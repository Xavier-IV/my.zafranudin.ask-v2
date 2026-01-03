import { requireAdmin, getAdminEmail, logoutAdmin } from "./actions";
import { getAuthenticatedPb } from "@/lib/pocketbase";
import { getSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { RelativeTime } from "@/components/relative-time";
import Link from "next/link";
import { redirect } from "next/navigation";

// Helper to strip HTML tags for display
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

interface Question {
  id: string;
  question: string;
  created: string;
}

interface Feedback {
  id: string;
  feedback: string;
  name?: string;
  created: string;
}

export default async function AdminDashboard() {
  await requireAdmin();
  const adminEmail = await getAdminEmail();
  
  // Get authenticated PocketBase instance
  const session = await getSession();
  if (!session) {
    redirect("/admin/login");
  }
  const pb = getAuthenticatedPb(session.token);

  // Fetch questions and feedbacks
  const questions = await pb.collection("questions").getFullList<Question>({
    sort: "-created",
  });

  const feedbacks = await pb.collection("feedbacks").getFullList<Feedback>({
    sort: "-created",
  });

  return (
    <div className="relative min-h-screen bg-background selection:bg-primary/10">
      {/* Background patterns */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-size-[16px_16px] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)]" />

      {/* Header */}
      <header className="border-b border-muted-foreground/10 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">Admin Dashboard</h1>
            <span className="text-sm text-muted-foreground">{adminEmail}</span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <form action={logoutAdmin}>
              <Button variant="outline" size="sm" type="submit">
                Logout
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Questions Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                Questions ({questions.length})
              </h2>
            </div>
            <div className="space-y-3">
              {questions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No questions yet
                </p>
              ) : (
                questions.map((q) => (
                  <div
                    key={q.id}
                    className="p-4 rounded-xl border border-muted-foreground/10 bg-background/50"
                  >
                    <p className="text-sm">{stripHtml(q.question)}</p>
                    <div className="flex items-center justify-between mt-2">
                      <RelativeTime
                        date={q.created}
                        className="text-xs text-muted-foreground"
                      />
                      <Link
                        href={`/admin/view/${q.id}`}
                        className="text-xs text-primary hover:underline"
                      >
                        View / Answer
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Feedbacks Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                Feedbacks ({feedbacks.length})
              </h2>
            </div>
            <div className="space-y-3">
              {feedbacks.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No feedbacks yet
                </p>
              ) : (
                feedbacks.map((f) => (
                  <div
                    key={f.id}
                    className="p-4 rounded-xl border border-muted-foreground/10 bg-background/50"
                  >
                    <p className="text-sm">{stripHtml(f.feedback)}</p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <span>{f.name || "Anonymous"}</span>
                        <span>•</span>
                        <RelativeTime date={f.created} />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
