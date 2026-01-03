"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Download, ArrowLeft, Type, Plus, Minus, RotateCcw, FilePlus, Trash2, LayoutTemplate, AlignLeft, AlignCenter, Save, GripVertical, Grid3x3, Rows3, Image } from "lucide-react";
import { toPng } from "html-to-image";
import { useSearchParams } from "next/navigation";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Textarea } from "@/components/ui/textarea";
import { saveAnswers, uploadAnswerAttachment, updateAttachmentConfig } from "../answer-actions";
import { toast } from "sonner";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { cn } from "@/lib/utils";

// Attachment configuration type
export type ImageMode = "full" | "overlay";
export type ImagePosition = "top-left" | "top-right" | "bottom-left" | "bottom-right";
export type ImageSize = "sm" | "md" | "lg";

export interface AttachmentConfig {
  mode: ImageMode;
  position: ImagePosition;
  size: ImageSize;
}

interface Answer {
  id: string;
  question: string;
  answer: string;
  attachment?: string;
  attachment_config?: AttachmentConfig | string; // Can be JSON string from DB
  position: number;
  created: string;
  updated: string;
}

type ViewClientProps = {
  initialQuestion: string;
  id: string;
  initialAnswers: Answer[];
  fileToken: string;
};

type FontSize = "auto" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";

type SlideType = "question" | "answer";
type SlideTemplate = "centered" | "left";

interface Slide {
  id: string;
  dbId?: string;
  type: SlideType;
  template: SlideTemplate;
  title?: string;
  content: string;
  fontSize: FontSize;
  attachment?: string;
  attachmentUrl?: string;
  imageMode?: ImageMode;
  imagePosition?: ImagePosition;
  imageSize?: ImageSize;
}

export default function ViewClient({ initialQuestion, id, initialAnswers, fileToken }: ViewClientProps) {
  const searchParams = useSearchParams();
  const isAdmin = searchParams.get("admin") === "true";
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [isCapturingId, setIsCapturingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'editor' | 'grid'>('editor');
  
  const [slides, setSlides] = useState<Slide[]>(() => {
    const questionSlide: Slide = { 
      id: "q", 
      type: "question", 
      template: "centered", 
      content: initialQuestion, 
      fontSize: "auto" 
    };
    
    const answerSlides: Slide[] = initialAnswers.map((answer, index) => {
      // Use Next.js API route to proxy file requests (keeps PocketBase URL hidden)
      const attachmentUrl = answer.attachment 
        ? `/api/files/answers/${answer.id}/${answer.attachment}`
        : undefined;
      
      // Parse attachment config from database
      let config: AttachmentConfig | null = null;
      if (answer.attachment_config) {
        try {
          config = typeof answer.attachment_config === 'string' 
            ? JSON.parse(answer.attachment_config) 
            : answer.attachment_config;
        } catch (e) {
          console.error('Failed to parse attachment_config:', e);
        }
      }
      
      return {
        id: `answer-${index}`,
        dbId: answer.id,
        type: "answer" as const,
        template: "left" as const,
        content: answer.answer,
        fontSize: "auto" as const,
        attachment: answer.attachment,
        attachmentUrl,
        imageMode: config?.mode || "full",
        imagePosition: config?.position || "top-right",
        imageSize: config?.size || "md",
      };
    });
    
    return [questionSlide, ...answerSlides];
  });
  
  const [scale, setScale] = useState(1);
  const slideRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSlides((prev) => {
        const oldIndex = prev.findIndex((s) => s.id === active.id);
        const newIndex = prev.findIndex((s) => s.id === over.id);
        const newSlides = arrayMove(prev, oldIndex, newIndex);
        
        // Clear any pending save
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
        
        // Auto-save after reordering - debounced to prevent duplicate saves
        saveTimeoutRef.current = setTimeout(() => {
          handleSave(newSlides);
          saveTimeoutRef.current = null;
        }, 300);
        
        return newSlides;
      });
    }
  };

  useEffect(() => {
    setMounted(true);
    
    const updateScale = () => {
      if (!containerRef.current) return;
      const { clientHeight } = containerRef.current;
      const margin = 120; // Increased margin for template buttons
      const availableHeight = clientHeight - margin;
      const newScale = Math.min(availableHeight / 600, 1);
      setScale(newScale);
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  useEffect(() => {
    if (!isAdmin) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAdmin, slides, id, isSaving]); // Include dependencies for handleSave

  const downloadAsPng = async (slideId: string) => {
    const el = slideRefs.current[slideId];
    if (!el) return;

    setIsCapturingId(slideId);
    // Give state change a moment to settle
    await new Promise((resolve) => setTimeout(resolve, 50));

    try {
      const dataUrl = await toPng(el, {
        quality: 2,
        width: 600,
        height: 600,
        pixelRatio: 2,
      });

      const link = document.createElement("a");
      const slide = slides.find(s => s.id === slideId);
      const suffix = slide?.type === "question" ? "question" : `answer-${slides.indexOf(slide!) }`;
      link.download = `ask-zafranudin-${id}-${suffix}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Error generating PNG:", error);
    } finally {
      setIsCapturingId(null);
    }
  };

  const getFontSizeClass = (slide: Slide) => {
    if (slide.fontSize !== "auto") {
      const classes: Record<FontSize, string> = {
        auto: "",
        sm: "text-base",
        md: "text-lg",
        lg: "text-xl",
        xl: "text-2xl",
        "2xl": "text-3xl",
        "3xl": "text-4xl",
      };
      return classes[slide.fontSize];
    }

    const plainText = slide.content.replace(/<[^>]*>/g, "").trim();
    const length = plainText.length;

    if (length < 60) return "text-3xl";
    if (length < 150) return "text-2xl";
    if (length < 300) return "text-xl";
    return "text-lg";
  };

  const updateSlideFontSize = (slideId: string, direction: "up" | "down" | "auto") => {
    setSlides(prev => prev.map(slide => {
      if (slide.id !== slideId) return slide;
      
      if (direction === "auto") return { ...slide, fontSize: "auto" };

      const sizes: FontSize[] = ["sm", "md", "lg", "xl", "2xl", "3xl"];
      const currentIndex = sizes.indexOf(slide.fontSize === "auto" ? "md" : slide.fontSize);
      
      if (direction === "up") {
        const nextIndex = Math.min(currentIndex + 1, sizes.length - 1);
        return { ...slide, fontSize: sizes[nextIndex] };
      } else {
        const nextIndex = Math.max(currentIndex - 1, 0);
        return { ...slide, fontSize: sizes[nextIndex] };
      }
    }));
  };

  const toggleTemplate = (slideId: string) => {
    setSlides(prev => prev.map(s => s.id === slideId ? { ...s, template: s.template === "centered" ? "left" : "centered" } : s));
  };

  const addAnswerSlide = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    setSlides(prev => [...prev, { 
      id: newId, 
      type: "answer", 
      template: "left",
      content: "# New Section\n\nStart writing your content here...", 
      fontSize: "auto" 
    }]);
  };

  const removeSlide = (id: string) => {
    if (id === "q") return;
    setSlides(prev => prev.filter(s => s.id !== id));
  };

  const updateSlideData = (slideId: string, updates: Partial<Slide>) => {
    // Update state immediately for UI responsiveness
    setSlides(prev => prev.map(s => s.id === slideId ? { ...s, ...updates } : s));
    
    // Check if attachment config changed
    const configChanged = updates.imageMode !== undefined || 
                         updates.imagePosition !== undefined || 
                         updates.imageSize !== undefined;
    
    // Save to database asynchronously (outside of render)
    if (configChanged) {
      // Get the updated slide to save
      const slideToSave = slides.find(s => s.id === slideId);
      if (slideToSave?.dbId && slideToSave?.attachment) {
        const config: AttachmentConfig = {
          mode: updates.imageMode ?? slideToSave.imageMode ?? "full",
          position: updates.imagePosition ?? slideToSave.imagePosition ?? "top-right",
          size: updates.imageSize ?? slideToSave.imageSize ?? "md",
        };
        
        // Save config to database (async, don't block UI)
        updateAttachmentConfig(slideToSave.dbId, config).catch(err => {
          console.error("Failed to save attachment config:", err);
          toast.error("Failed to save image settings");
        });
      }
    }
  };

  const handleSave = async (currentSlides?: Slide[]) => {
    setIsSaving(true);
    const slidesToSave = currentSlides || slides;
    try {
      const answerSlides = slidesToSave
        .filter(s => s.type === "answer")
        .map((slide, index) => ({
          dbId: slide.dbId,
          template: slide.template,
          content: slide.content,
          fontSize: slide.fontSize,
          position: index,
        }));

      const result = await saveAnswers(id, answerSlides);
      
      if (result.success) {
        toast.success("Answers saved automatically!");
      } else {
        toast.error(result.error || "Failed to save answers");
      }
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("Failed to save answers");
    } finally {
      setIsSaving(false);
    }
  };

  const renderInnerContent = (slide: Slide) => {
    const isCentered = slide.template === "centered";
    const commonClasses = "leading-relaxed prose prose-neutral dark:prose-invert transition-all duration-200";
    
    // If slide has an attachment
    if (slide.attachment && slide.attachmentUrl) {
      const imageMode = slide.imageMode || "full";
      const imageSize = slide.imageSize || "md";
      
      // Size classes for overlay mode (small positioned images)
      const overlaySizeClasses = {
        sm: "w-24 h-24",
        md: "w-32 h-32",
        lg: "w-40 h-40",
      };
      
      // Size classes for full mode (percentage-based)
      const fullSizeClasses = {
        sm: "max-w-[60%] max-h-[60%]",
        md: "max-w-full max-h-full",
        lg: "w-full h-full",
      };
      
      // Full image mode - image replaces content
      if (imageMode === "full") {
        return (
          <div className="flex items-center justify-center w-full h-full">
            <img 
              src={slide.attachmentUrl} 
              alt="Answer attachment" 
              className={cn("object-contain rounded-lg", fullSizeClasses[imageSize])}
            />
          </div>
        );
      }
      
      // Overlay mode - small image with text
      if (imageMode === "overlay") {
        const position = slide.imagePosition || "top-right";
        const positionClasses = {
          "top-left": "top-0 left-0",
          "top-right": "top-0 right-0",
          "bottom-left": "bottom-0 left-0",
          "bottom-right": "bottom-0 right-0",
        };
        
        return (
          <div className="relative w-full h-full">
            {/* Text content */}
            <div className={cn(commonClasses, " [&>*:first-child]:mt-0 [&>*:last-child]:mb-0", isCentered ? "font-semibold text-center" : "font-medium text-left", getFontSizeClass(slide))}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {slide.content}
              </ReactMarkdown>
            </div>
            
            {/* Overlay image */}
            <div className={cn("absolute", overlaySizeClasses[imageSize], positionClasses[position])}>
              <img 
                src={slide.attachmentUrl} 
                alt="Answer attachment" 
                className="w-full h-full object-cover rounded-lg shadow-lg"
              />
            </div>
          </div>
        );
      }
    }
    
    // No attachment - show text only
    if (slide.type === "question") {
      return (
        <div 
          className={cn(commonClasses, isCentered ? "font-semibold text-center" : "font-medium text-left", getFontSizeClass(slide))} 
          dangerouslySetInnerHTML={{ __html: slide.content }} 
        />
      );
    }
    
    return (
      <div className={cn(commonClasses, " [&>*:first-child]:mt-0 [&>*:last-child]:mb-0", isCentered ? "font-semibold text-center" : "font-medium text-left", getFontSizeClass(slide))}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {slide.content}
        </ReactMarkdown>
      </div>
    );
  };

  if (!mounted) return null;

  if (!isAdmin) {
    return (
      <div className="relative min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-[440px] space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000 ease-out text-center">
          <header className="space-y-1 text-center">
            <h1 className="text-xl font-bold tracking-tight text-foreground">Ask me anything</h1>
            <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-widest opacity-50">Anonymous Message</p>
          </header>
          <div className="bg-muted/50 backdrop-blur-sm border border-muted-foreground/20 rounded-xl px-6 py-10 min-h-[200px] flex items-center justify-center">
            <div 
              className={cn("font-medium leading-relaxed prose prose-neutral dark:prose-invert text-center", getFontSizeClass(slides[0]))}
              dangerouslySetInnerHTML={{ __html: initialQuestion }}
            />
          </div>
          <footer className="space-y-2 text-center">
             <p className="text-[10px] text-muted-foreground/50 font-bold">
              Tech · Career · Software Engineering · Vibe Code
            </p>
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs text-muted-foreground/70 font-medium select-none">ask.zafranudin.my</span>
            </div>
          </footer>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden font-geist-sans">
      {/* Left Toolbox */}
      <TooltipProvider delayDuration={0}>
        <aside className="w-[70px] border-r bg-muted/20 flex flex-col items-center py-6 gap-4 z-20">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" asChild className="rounded-xl">
                <Link href="/">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Go back</TooltipContent>
          </Tooltip>

          <div className="w-8 h-[1px] bg-border mx-auto my-1" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="secondary" 
                size="icon" 
                className="rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                onClick={addAnswerSlide}
              >
                <FilePlus className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Add Answer Page</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="default" 
                size="icon" 
                className="rounded-xl"
                onClick={() => handleSave()}
                disabled={isSaving}
              >
                <Save className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <div className="flex items-center gap-2">
                <span>{isSaving ? "Saving..." : "Save All"}</span>
                {!isSaving && <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 italic">⌘S</kbd>}
              </div>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-xl"
                onClick={() => setViewMode(viewMode === 'editor' ? 'grid' : 'editor')}
              >
                {viewMode === 'editor' ? <Grid3x3 className="h-5 w-5" /> : <Rows3 className="h-5 w-5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {viewMode === 'editor' ? 'Grid View' : 'Editor View'}
            </TooltipContent>
          </Tooltip>

          <div className="mt-auto">
            <ThemeToggle />
          </div>
        </aside>
      </TooltipProvider>

      {/* Main Artboard Area */}
      <main 
        ref={containerRef}
        className="flex-1 relative bg-muted/5 overflow-auto"
      >
        {viewMode === 'grid' ? (
          /* Grid View */
          <div className="p-12">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={slides.map(s => s.id)}
                strategy={horizontalListSortingStrategy}
              >
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-max">
                  {slides.map((slide, index) => (
                    <GridSlideCard
                      key={slide.id}
                      slide={slide}
                      index={index}
                      removeSlide={removeSlide}
                    />
                  ))}
                  
                  {isAdmin && (
                    <button 
                      onClick={addAnswerSlide}
                      className="aspect-square border-2 border-dashed border-border/40 hover:border-primary/40 bg-muted/5 hover:bg-muted/10 transition-all duration-300 ease-out rounded-lg flex items-center justify-center cursor-pointer group"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-background border border-border flex items-center justify-center group-hover:border-primary/30 transition-all">
                          <Plus className="h-6 w-6 text-muted-foreground/40 group-hover:text-primary/60 transition-colors" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/30 group-hover:text-primary/50 transition-colors">Add Page</span>
                      </div>
                    </button>
                  )}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        ) : (
          /* Editor View */
          <div className="flex items-center px-12 gap-16 h-full overflow-x-auto overflow-y-hidden" style={{ overscrollBehaviorX: 'none' }}>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={slides.map(s => s.id)}
                strategy={horizontalListSortingStrategy}
              >
                {slides.map((slide, index) => (
                  <SortableSlide
                    key={slide.id}
                    slide={slide}
                    index={index}
                    isAdmin={isAdmin}
                    isCapturingId={isCapturingId}
                    scale={scale}
                    slideRefs={slideRefs}
                    updateSlideFontSize={updateSlideFontSize}
                    toggleTemplate={toggleTemplate}
                    downloadAsPng={downloadAsPng}
                    removeSlide={removeSlide}
                    updateSlideData={updateSlideData}
                    renderInnerContent={renderInnerContent}
                    getFontSizeClass={getFontSizeClass}
                    questionId={id}
                    fileToken={fileToken}
                  />
                ))}
              </SortableContext>
            </DndContext>
            
            {isAdmin && (
              <div className="flex flex-col gap-4 items-center shrink-0">
                {/* Spacer for controls alignment */}
                <div className="h-8 w-8" />
                
                <button 
                  onClick={addAnswerSlide}
                  className="relative group border-2 border-dashed border-border/40 hover:border-primary/40 bg-muted/5 hover:bg-muted/10 transition-all duration-300 ease-out rounded-sm flex items-center justify-center cursor-pointer overflow-hidden"
                  style={{ 
                    width: '600px', 
                    height: '600px',
                    transform: `scale(${scale})`,
                    transformOrigin: 'top center'
                  }}
                >
                  <div className="flex flex-col items-center gap-4 transition-transform duration-300 group-hover:scale-110">
                    <div className="w-16 h-16 rounded-full bg-background border border-border flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:border-primary/30 transition-all">
                      <Plus className="h-8 w-8 text-muted-foreground/40 group-hover:text-primary/60 transition-colors" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/30 group-hover:text-primary/50 transition-colors">Add Page</span>
                  </div>
                </button>
                
                <span className="text-[10px] font-black font-mono text-muted-foreground/10 uppercase tracking-[0.3em] select-none">
                  New Artboard
                </span>
              </div>
            )}
          </div>
        )}

        {/* Info Overlay */}
        <div className="fixed bottom-6 right-6 text-[10px] font-mono text-muted-foreground/40 pointer-events-none uppercase tracking-widest flex gap-4">
          <span>{slides.length} ARTBOARDS</span>
          <span>•</span>
          <span>SYSTEM v2.5</span>
        </div>
      </main>
    </div>
  );
}

function GridSlideCard({ slide, index, removeSlide }: { slide: Slide; index: number; removeSlide: (id: string) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: slide.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  // Truncate content for grid view
  const getTruncatedContent = (content: string, maxLength: number = 80) => {
    const plainText = content.replace(/<[^>]*>/g, '').replace(/[#*_`]/g, '').trim();
    return plainText.length > maxLength ? plainText.substring(0, maxLength) + '...' : plainText;
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className="relative group aspect-square"
    >
      <div 
        className="w-full h-full bg-background border-2 border-border hover:border-primary/50 rounded-lg p-4 flex flex-col gap-3 cursor-grab active:cursor-grabbing transition-all duration-200 hover:shadow-lg"
        {...attributes}
        {...listeners}
      >
        {/* Slide Type Badge */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-bold text-muted-foreground/40 uppercase tracking-wider">
            {slide.type === 'question' ? 'Question' : `Answer ${index}`}
          </span>
          {slide.type === 'answer' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeSlide(slide.id);
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded"
            >
              <Trash2 className="h-3 w-3 text-destructive" />
            </button>
          )}
        </div>

        {/* Content Preview */}
        <div className="flex-1 flex items-center justify-center text-center px-2">
          <p className="text-sm font-medium text-foreground/70 line-clamp-4 leading-relaxed">
            {getTruncatedContent(slide.content, 120)}
          </p>
        </div>

        {/* Footer Info */}
        <div className="flex items-center justify-between text-[9px] text-muted-foreground/30 font-mono uppercase tracking-wider">
          <span>Page {index + 1}</span>
          <span className="capitalize">{slide.template}</span>
        </div>
      </div>
    </div>
  );
}

function SortableSlide({ 
  slide, 
  index, 
  isAdmin, 
  isCapturingId, 
  scale, 
  slideRefs, 
  updateSlideFontSize, 
  toggleTemplate, 
  downloadAsPng, 
  removeSlide, 
  updateSlideData, 
  renderInnerContent,
  getFontSizeClass,
  questionId,
  fileToken
}: any) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: slide.id });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isAdmin && slide.type === "answer" && slide.dbId) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (!isAdmin || slide.type !== "answer" || !slide.dbId) return;

    const files = e.dataTransfer.files;
    if (files.length === 0) return;

    const file = files[0];
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }

    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('attachment', file);

      const result = await uploadAnswerAttachment(slide.dbId, questionId, formData);
      
      if (result.success && result.attachment) {
        // Update the slide with the new attachment (using Next.js API proxy)
        const attachmentUrl = `/api/files/answers/${slide.dbId}/${result.attachment}`;
        updateSlideData(slide.id, { 
          attachment: result.attachment,
          attachmentUrl,
          imageMode: slide.imageMode || "full",
          imagePosition: slide.imagePosition || "top-right",
          imageSize: slide.imageSize || "md",
        });
        toast.success("Image uploaded successfully!");
      } else {
        toast.error(result.error || "Failed to upload image");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex flex-col gap-4 items-center shrink-0">
      {/* Header Controls for each Slide */}
      {isAdmin && (
        <div className="flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md cursor-grab active:cursor-grabbing" {...attributes} {...listeners}>
            <GripVertical className="h-3 w-3" />
          </Button>

          <div className="flex bg-muted/50 rounded-lg p-0.5 border border-border">
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md" onClick={() => updateSlideFontSize(slide.id, "up")}>
              <Plus className="h-3 w-3" />
            </Button>
            <div className="flex items-center px-1">
              <Type className="h-3 w-3" />
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md" onClick={() => updateSlideFontSize(slide.id, "down")}>
              <Minus className="h-3 w-3" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className={cn("h-7 w-7 rounded-md", slide.fontSize === "auto" && "text-primary")} 
              onClick={() => updateSlideFontSize(slide.id, "auto")}
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
          </div>

          <div className="flex bg-muted/50 rounded-lg p-0.5 border border-border px-1">
            <Button variant="ghost" size="icon" className={cn("h-7 w-7 rounded-md", slide.template === "left" && "text-primary bg-background")} onClick={() => toggleTemplate(slide.id)}><AlignLeft className="h-3 w-3" /></Button>
            <Button variant="ghost" size="icon" className={cn("h-7 w-7 rounded-md", slide.template === "centered" && "text-primary bg-background")} onClick={() => toggleTemplate(slide.id)}><AlignCenter className="h-3 w-3" /></Button>
          </div>

          <Button 
            variant="default" 
            size="icon" 
            className="h-8 w-8 rounded-lg shadow-sm"
            onClick={() => downloadAsPng(slide.id)}
            disabled={isCapturingId === slide.id}
          >
            <Download className="h-4 w-4" />
          </Button>

          {slide.type === "answer" && (
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10" onClick={() => removeSlide(slide.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      {/* Actual Slide Card */}
      <div 
        className={cn(
          "relative shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] bg-background transition-all duration-300 ease-out",
          isDragOver && "ring-4 ring-primary ring-offset-2",
          isUploading && "opacity-50 pointer-events-none"
        )}
        style={{ 
          width: '600px', 
          height: '600px',
          transform: `scale(${scale})`,
          transformOrigin: 'top center'
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="absolute inset-0 border border-border pointer-events-none z-10 opacity-30" />
        
        {/* Upload indicator */}
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center z-50 bg-background/80">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-sm font-medium">Uploading image...</p>
            </div>
          </div>
        )}
        
        {/* Drag overlay */}
        {isDragOver && (
          <div className="absolute inset-0 flex items-center justify-center z-40 bg-primary/10 backdrop-blur-sm">
            <div className="text-center">
              <p className="text-lg font-bold text-primary">Drop image here</p>
            </div>
          </div>
        )}
        
        <div 
          ref={el => { slideRefs.current[slide.id] = el }} 
          className="w-[600px] h-[600px] bg-background flex flex-col p-16 overflow-hidden"
        >
          <div className="w-full max-w-[440px] mx-auto flex flex-col h-full">
            {slide.type === "question" && (
              <header className={cn("flex flex-col gap-1", slide.template === "centered" ? "items-center text-center" : "items-start text-left")}>
                <h1 className="text-xl font-black tracking-tighter text-foreground uppercase opacity-90">
                  Ask me anything
                </h1>
                <p className="text-muted-foreground text-[10px] font-bold opacity-50 uppercase tracking-widest leading-none">
                  Anonymous Message
                </p>
              </header>
            )}

            <div className={cn("relative flex-1 flex flex-col", slide.template === "centered" ? "justify-center" : "justify-start pt-12")}>
              {slide.template === "centered" ? (
                <div className="bg-muted/30 backdrop-blur-sm border border-border rounded-2xl px-10 py-12 min-h-[220px] flex items-center justify-center relative">
                  <div className="absolute top-4 left-4 text-muted-foreground/10 text-4xl font-serif select-none">"</div>
                  {renderInnerContent(slide)}
                  <div className="absolute bottom-4 right-4 text-muted-foreground/10 text-4xl font-serif select-none">"</div>
                </div>
              ) : (
                renderInnerContent(slide)
              )}
            </div>

            <footer className={cn("flex flex-col gap-4 mt-auto pt-8", slide.template === "centered" ? "items-center text-center" : "items-start text-left")}>
              <div className="h-[1px] w-8 bg-border opacity-30" />
              <div className={cn("flex flex-col gap-1", slide.template === "centered" ? "items-center" : "items-start")}>
                <p className="text-[10px] text-muted-foreground/40 font-bold">
                  Tech · Career · Software Engineering · Vibe Code
                </p>
                <span className="text-[11px] text-foreground/30 font-bold select-none tracking-tight">
                  ask.zafranudin.my
                </span>
              </div>
            </footer>
          </div>
        </div>

        {/* Editable Fields Overlay (Only visible in editor, not in capture) */}
        {isAdmin && isCapturingId !== slide.id && slide.type === "answer" && (
          <div className="absolute inset-0 bg-background/95 p-8 flex flex-col gap-6 z-30 opacity-0 hover:opacity-100 transition-all duration-300">
             <div className="space-y-2 flex-1 flex flex-col">
               <label className="text-xs font-medium text-muted-foreground">Content</label>
                <Textarea 
                   value={slide.content} 
                   onChange={(e) => updateSlideData(slide.id, { content: e.target.value })}
                   placeholder="Type your narrative (Markdown supported)..."
                   className="flex-1 resize-none leading-relaxed font-mono text-sm"
                 />
             </div>
             
             {/* Image controls - only show if attachment exists */}
             {slide.attachment && (
               <div className="space-y-3 border-t border-border pt-4">
                 <label className="text-xs font-medium text-muted-foreground">Image Display</label>
                 
                 {/* Mode toggle */}
                 <div className="flex gap-2">
                   <Button
                     variant={slide.imageMode === "full" ? "default" : "outline"}
                     size="sm"
                     className="flex-1 h-8 text-xs"
                     onClick={() => updateSlideData(slide.id, { imageMode: "full" })}
                   >
                     <Image className="h-3 w-3 mr-1" />
                     Full Image
                   </Button>
                   <Button
                     variant={slide.imageMode === "overlay" ? "default" : "outline"}
                     size="sm"
                     className="flex-1 h-8 text-xs"
                     onClick={() => updateSlideData(slide.id, { imageMode: "overlay" })}
                   >
                     <LayoutTemplate className="h-3 w-3 mr-1" />
                     Overlay
                   </Button>
                 </div>
                 
                 {/* Position selector - only show in overlay mode */}
                 {slide.imageMode === "overlay" && (
                   <div className="space-y-2">
                     <label className="text-xs font-medium text-muted-foreground">Position</label>
                     <div className="grid grid-cols-2 gap-2">
                       <Button
                         variant={slide.imagePosition === "top-left" ? "default" : "outline"}
                         size="sm"
                         className="h-8 text-xs"
                         onClick={() => updateSlideData(slide.id, { imagePosition: "top-left" })}
                       >
                         Top Left
                       </Button>
                       <Button
                         variant={slide.imagePosition === "top-right" ? "default" : "outline"}
                         size="sm"
                         className="h-8 text-xs"
                         onClick={() => updateSlideData(slide.id, { imagePosition: "top-right" })}
                       >
                         Top Right
                       </Button>
                       <Button
                         variant={slide.imagePosition === "bottom-left" ? "default" : "outline"}
                         size="sm"
                         className="h-8 text-xs"
                         onClick={() => updateSlideData(slide.id, { imagePosition: "bottom-left" })}
                       >
                         Bottom Left
                       </Button>
                       <Button
                         variant={slide.imagePosition === "bottom-right" ? "default" : "outline"}
                         size="sm"
                         className="h-8 text-xs"
                         onClick={() => updateSlideData(slide.id, { imagePosition: "bottom-right" })}
                       >
                         Bottom Right
                       </Button>
                     </div>
                   </div>
                 )}
                 
                 {/* Size selector */}
                 <div className="space-y-2">
                   <label className="text-xs font-medium text-muted-foreground">Size</label>
                   <div className="flex gap-2">
                     <Button
                       variant={slide.imageSize === "sm" ? "default" : "outline"}
                       size="sm"
                       className="flex-1 h-8 text-xs"
                       onClick={() => updateSlideData(slide.id, { imageSize: "sm" })}
                     >
                       Small
                     </Button>
                     <Button
                       variant={slide.imageSize === "md" ? "default" : "outline"}
                       size="sm"
                       className="flex-1 h-8 text-xs"
                       onClick={() => updateSlideData(slide.id, { imageSize: "md" })}
                     >
                       Medium
                     </Button>
                     <Button
                       variant={slide.imageSize === "lg" ? "default" : "outline"}
                       size="sm"
                       className="flex-1 h-8 text-xs"
                       onClick={() => updateSlideData(slide.id, { imageSize: "lg" })}
                     >
                       Large
                     </Button>
                   </div>
                 </div>
               </div>
             )}
             
             <div className="flex justify-between items-center text-[10px] text-muted-foreground/40 font-mono uppercase tracking-widest">
               <span>{slide.template.toUpperCase()} Template</span>
               {slide.dbId ? (
                 <span className="italic">Drag & drop image anywhere on card</span>
               ) : (
                 <span className="italic text-amber-500">Save first to enable image upload</span>
               )}
             </div>
          </div>
        )}
      </div>
      
      <span className="text-[10px] font-black font-mono text-muted-foreground/20 uppercase tracking-[0.3em]">
        Page {index + 1}
      </span>
    </div>
  );
}
