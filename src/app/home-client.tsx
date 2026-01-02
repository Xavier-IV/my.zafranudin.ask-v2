"use client";

import {
  useState,
  useActionState,
  useEffect,
  useRef,
  startTransition,
} from "react";
import Link from "next/link";
import { submitQuestion, submitFeedback } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/theme-toggle";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";

const initialState = {
  message: "",
  error: undefined as string | undefined,
};

type HomeClientProps = {
  initialMode: "ask" | "feedback";
};

export default function HomeClient({ initialMode }: HomeClientProps) {
  // Mode is controlled by server via URL - no client state needed
  const mode = initialMode;
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const [questionState, questionAction, questionPending] = useActionState(
    submitQuestion,
    initialState
  );
  const [feedbackState, feedbackAction, feedbackPending] = useActionState(
    submitFeedback,
    initialState
  );

  const formRef = useRef<HTMLFormElement>(null);
  const turnstileRef = useRef<TurnstileInstance>(null);
  const pending = mode === "ask" ? questionPending : feedbackPending;
  const state = mode === "ask" ? questionState : feedbackState;
  const formAction = mode === "ask" ? questionAction : feedbackAction;



  // Handle question submission state
  useEffect(() => {
    if (questionState.error || questionState.message) {
      turnstileRef.current?.reset();
      setTurnstileToken(null);
    }

    if (questionState.error) {
      toast.error(questionState.error);
    }
    if (questionState.message) {
      toast.success(questionState.message);
      formRef.current?.reset();
      startTransition(() => {
        setMessage("");
        setName("");
      });
    }
  }, [questionState]);

  // Handle feedback submission state
  useEffect(() => {
    if (feedbackState.error || feedbackState.message) {
      turnstileRef.current?.reset();
      setTurnstileToken(null);
    }

    if (feedbackState.error) {
      toast.error(feedbackState.error);
    }
    if (feedbackState.message) {
      toast.success(feedbackState.message);
      formRef.current?.reset();
      startTransition(() => {
        setMessage("");
        setName("");
      });
    }
  }, [feedbackState]);

  return (
    <div className="relative min-h-screen bg-background selection:bg-primary/10">
      {/* Background patterns */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-size-[16px_16px] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)]" />

      {/* Theme Toggle */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <main className="w-full max-w-[440px] mx-auto px-6 pt-32 pb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 ease-out">
        <div className="space-y-8">
          <header className="space-y-2 text-center">
            <div className="h-[44px] relative">
              <h1
                className={`text-4xl font-semibold tracking-tight text-foreground absolute inset-0 transition-opacity duration-300 ${
                  mode === "ask" ? "opacity-100" : "opacity-0"
                }`}
              >
                Ask me anything
              </h1>
              <h1
                className={`text-4xl font-semibold tracking-tight text-foreground absolute inset-0 transition-opacity duration-300 ${
                  mode === "feedback" ? "opacity-100" : "opacity-0"
                }`}
              >
                Share feedback
              </h1>
            </div>
            <div className="h-[20px] relative">
              <p
                className={`text-muted-foreground text-sm font-medium absolute inset-0 transition-opacity duration-300 ${
                  mode === "ask" ? "opacity-100" : "opacity-0"
                }`}
              >
                Send an anonymous message, I&apos;ll read them all.
              </p>
              <p
                className={`text-muted-foreground text-sm font-medium absolute inset-0 transition-opacity duration-300 ${
                  mode === "feedback" ? "opacity-100" : "opacity-0"
                }`}
              >
                Share your feedback about my work.
              </p>
            </div>
            <div className="h-[16px] relative">
              <p
                className={`text-muted-foreground text-xs absolute inset-0 transition-opacity duration-300 ${
                  mode === "ask" ? "opacity-100" : "opacity-0"
                }`}
              >
                Answers will be replied on{" "}
                <a
                  href="https://www.threads.com/@zafranudin_z"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-foreground transition-colors"
                >
                  Threads
                </a>
              </p>
            </div>
          </header>

          {/* Mode Toggle - Navigation based */}
          <div className="w-full">
            <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground w-full">
              <Link
                href="/"
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 flex-1 ${
                  mode === "ask"
                    ? "bg-background text-foreground shadow-sm"
                    : "hover:bg-background/50"
                }`}
              >
                Ask
              </Link>
              <Link
                href="/?mode=feedback"
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 flex-1 ${
                  mode === "feedback"
                    ? "bg-background text-foreground shadow-sm"
                    : "hover:bg-background/50"
                }`}
              >
                Feedback
              </Link>
            </div>
          </div>

          <form ref={formRef} action={formAction} className="space-y-4">
            <div className="group relative">
              <Textarea
                name={mode === "ask" ? "question" : "feedback"}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  mode === "ask"
                    ? "Type your message here..."
                    : "Share your feedback..."
                }
                rows={5}
                disabled={pending}
                required
                maxLength={1000}
                className="resize-none bg-background/50 backdrop-blur-sm border-muted-foreground/20 focus:border-primary transition-all duration-300 rounded-xl px-4 py-3 text-base min-h-[140px] max-h-[300px] overflow-y-auto"
              />
              <div
                className={`absolute bottom-3 right-3 text-[10px] font-mono transition-all duration-300 ${
                  message.length === 0
                    ? "opacity-0"
                    : message.trim().length < 2 || message.length === 1000
                    ? "text-destructive opacity-100"
                    : "text-muted-foreground opacity-100"
                }`}
              >
                {message.length}/1000
              </div>
            </div>
            {mode === "feedback" && (
              <div>
                <Input
                  type="text"
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name or alias (optional)"
                  disabled={pending}
                  maxLength={100}
                  className="bg-background/50 backdrop-blur-sm border-muted-foreground/20 focus:border-primary transition-all duration-300 rounded-xl px-4 py-3 text-base h-auto"
                />
              </div>
            )}
            
            <div className="flex justify-center py-2">
              <Turnstile
                ref={turnstileRef}
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                onSuccess={(token) => setTurnstileToken(token)}
                onExpire={() => setTurnstileToken(null)}
                onError={() => setTurnstileToken(null)}
              />
            </div>

            <Button
              type="submit"
              disabled={pending || message.trim().length < 2 || !turnstileToken}
              className="w-full h-12 text-base font-medium rounded-xl transition-all duration-300 active:scale-[0.98]"
            >
              {pending ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Sending...
                </span>
              ) : mode === "ask" ? (
                "Send Message"
              ) : (
                "Send Feedback"
              )}
            </Button>
          </form>

          <footer className="text-center space-y-2">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold">
              Anonymous & Secure
            </p>
            <div className="flex flex-col items-center gap-2">
              <a
                href="https://github.com/Xavier-IV/my.zafranudin.ask-v2"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors inline-block"
              >
                Open Source on GitHub
              </a>
              <Link
                href="/feedbacks"
                className="text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors inline-block underline decoration-dotted underline-offset-2"
              >
                View Feedbacks
              </Link>
              <a
                href="https://zafranudin.my/links"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors inline-block underline decoration-dotted underline-offset-2"
              >
                All Links
              </a>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
