"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { RelativeTime } from "./relative-time";

interface Feedback {
  id: string;
  feedback: string;
  name?: string;
  created: string;
}

interface FeedbackMasonryProps {
  feedbacks: Feedback[];
}

export function FeedbackMasonry({ feedbacks }: FeedbackMasonryProps) {
  return (
    <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
      {feedbacks.map((item) => (
        <FeedbackCard key={item.id} item={item} />
      ))}
    </div>
  );
}

function FeedbackCard({ item }: { item: Feedback }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const maxLength = 240;
  const isLong = item.feedback.length > maxLength;
  const displayFeedback = isExpanded || !isLong 
    ? item.feedback 
    : item.feedback.slice(0, maxLength) + "...";

  return (
    <div className="break-inside-avoid-column bg-background/50 backdrop-blur-sm border border-muted-foreground/20 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex flex-col gap-4">
        <div className="space-y-2">
          <p className="text-base leading-relaxed text-foreground whitespace-pre-wrap">
            {displayFeedback}
          </p>
          {isLong && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs font-semibold text-primary hover:underline transition-all"
            >
              {isExpanded ? "Show less" : "Read more"}
            </button>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-muted/20">
          <span className="text-sm font-semibold text-muted-foreground">
            {item.name || "Anonymous"}
          </span>
          <RelativeTime 
            date={item.created} 
            className="text-xs text-muted-foreground/50 tabular-nums" 
          />
        </div>
      </div>
    </div>
  );
}
