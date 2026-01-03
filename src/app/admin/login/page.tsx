"use client";

import { useState, useActionState, useEffect } from "react";
import { loginAdmin } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/theme-toggle";

const initialState = {
  message: "",
  error: undefined as string | undefined,
};

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [state, formAction, pending] = useActionState(loginAdmin, initialState);

  useEffect(() => {
    if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <div className="relative min-h-screen bg-background selection:bg-primary/10">
      {/* Background patterns */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-size-[16px_16px] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)]" />

      {/* Theme Toggle */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <main className="w-full max-w-[400px] mx-auto px-6 pt-32 pb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 ease-out">
        <div className="space-y-8">
          <header className="space-y-2 text-center">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Admin Login
            </h1>
            <p className="text-muted-foreground text-sm font-medium">
              Sign in to access the admin dashboard
            </p>
          </header>

          <form action={formAction} className="space-y-4">
            <div>
              <Input
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                disabled={pending}
                required
                autoComplete="email"
                className="bg-background/50 backdrop-blur-sm border-muted-foreground/20 focus:border-primary transition-all duration-300 rounded-xl px-4 py-3 text-base h-auto"
              />
            </div>

            <div>
              <Input
                type="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                disabled={pending}
                required
                autoComplete="current-password"
                className="bg-background/50 backdrop-blur-sm border-muted-foreground/20 focus:border-primary transition-all duration-300 rounded-xl px-4 py-3 text-base h-auto"
              />
            </div>

            <Button
              type="submit"
              disabled={pending || !email || !password}
              className="w-full h-12 text-base font-medium rounded-xl transition-all duration-300 active:scale-[0.98]"
            >
              {pending ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <footer className="text-center">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold">
              Secure Access
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
}
