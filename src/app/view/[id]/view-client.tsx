"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Download, ArrowLeft, Type, Plus, Minus, RotateCcw, FilePlus, Trash2, LayoutTemplate, AlignLeft, AlignCenter } from "lucide-react";
import { toPng } from "html-to-image";
import { useSearchParams } from "next/navigation";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Textarea } from "@/components/ui/textarea";

import { cn } from "@/lib/utils";

type ViewClientProps = {
  initialQuestion: string;
  id: string;
};

type FontSize = "auto" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";

type SlideType = "question" | "answer";
type SlideTemplate = "centered" | "left";

interface Slide {
  id: string;
  type: SlideType;
  template: SlideTemplate;
  title?: string;
  content: string;
  fontSize: FontSize;
}

export default function ViewClient({ initialQuestion, id }: ViewClientProps) {
  const searchParams = useSearchParams();
  const isAdmin = searchParams.get("admin") === "true";
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [isCapturingId, setIsCapturingId] = useState<string | null>(null);
  const [slides, setSlides] = useState<Slide[]>([
    { id: "q", type: "question", template: "centered", content: initialQuestion, fontSize: "auto" }
  ]);
  const [scale, setScale] = useState(1);
  const slideRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

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

  const updateSlideData = (id: string, updates: Partial<Slide>) => {
    setSlides(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const renderInnerContent = (slide: Slide) => {
    const isCentered = slide.template === "centered";
    const commonClasses = "leading-relaxed prose prose-neutral dark:prose-invert transition-all duration-200";
    
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

          <div className="mt-auto">
            <ThemeToggle />
          </div>
        </aside>
      </TooltipProvider>

      {/* Main Artboard Area */}
      <main 
        ref={containerRef}
        className="flex-1 relative bg-muted/5 overflow-x-auto overflow-y-hidden flex items-center px-12 gap-16"
      >
        {slides.map((slide, index) => (
          <div key={slide.id} className="flex flex-col gap-4 items-center shrink-0">
            {/* Header Controls for each Slide */}
            <div className="flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
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

            <div 
              className="relative shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] bg-background transition-all duration-300 ease-out"
              style={{ 
                width: '600px', 
                height: '600px',
                transform: `scale(${scale})`,
                transformOrigin: 'top center'
              }}
            >
              <div className="absolute inset-0 border border-border pointer-events-none z-10 opacity-30" />
              
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
              {isCapturingId !== slide.id && slide.type === "answer" && (
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
                   <div className="flex justify-between items-center text-[10px] text-muted-foreground/40 font-mono uppercase tracking-widest">
                     <span>{slide.template.toUpperCase()} Template</span>
                     <span className="italic">Hover out to preview</span>
                   </div>
                </div>
              )}
            </div>
            
            <span className="text-[10px] font-black font-mono text-muted-foreground/20 uppercase tracking-[0.3em]">
              Page {index + 1}
            </span>
          </div>
        ))}

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
