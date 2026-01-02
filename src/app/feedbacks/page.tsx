import pb from "@/lib/pocketbase";
import { FeedbackMasonry } from "@/components/feedback-masonry";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, MessageSquareOff } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function FeedbacksPage() {
  let records;
  try {
    records = await pb.collection("feedbacks").getList(1, 100, {
      filter: "is_published = true",
      sort: "-created",
    });
  } catch (error) {
    console.error("Error fetching feedbacks:", error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Something went wrong</h2>
          <p className="text-muted-foreground">
            Failed to load feedbacks. Please try again later.
          </p>
          <Button asChild>
            <Link href="/">Go Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background selection:bg-primary/10">
      <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-size-[16px_16px] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)]" />

      <main className="container mx-auto px-6 py-12 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
        <div className="space-y-8">
          <header className="flex flex-col items-center justify-center space-y-6 text-center mb-12 relative">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="absolute left-0 top-0 hidden md:flex"
            >
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>

            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
                Feedbacks
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Kind words and thoughts from anonymous visitors.
              </p>
            </div>

            {/* Mobile back button */}
            <div className="md:hidden w-full flex justify-start">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Home
                </Link>
              </Button>
            </div>
          </header>

          {records.items.length > 0 ? (
            <FeedbackMasonry feedbacks={records.items as any} />
          ) : (
            <div className="text-center py-24 space-y-4">
              <div className="flex justify-center">
                <div className="p-4 rounded-full bg-muted/20">
                  <MessageSquareOff className="h-8 w-8 text-muted-foreground/50" />
                </div>
              </div>
              <p className="text-muted-foreground">
                No feedbacks yet. Be the first to share one!
              </p>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
