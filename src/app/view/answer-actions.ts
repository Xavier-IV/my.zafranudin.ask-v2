"use server";

import pb from "@/lib/pocketbase";

export interface AnswerSlide {
  dbId?: string;
  template: "centered" | "left";
  content: string;
  fontSize: "auto" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
  position: number;
}

export async function saveAnswers(questionId: string, slides: AnswerSlide[]) {
  try {
    // Get existing answers for this question
    const existingAnswers = await pb.collection("answers").getFullList({
      filter: `question = "${questionId}"`,
    });

    const existingIds = new Set(existingAnswers.map((a) => a.id));
    const updatedIds = new Set(slides.filter((s) => s.dbId).map((s) => s.dbId));

    // Delete answers that were removed
    const toDelete = existingAnswers.filter((a) => !updatedIds.has(a.id));
    for (const answer of toDelete) {
      await pb.collection("answers").delete(answer.id);
    }

    // Create or update slides
    for (const slide of slides) {
      const data = {
        question: questionId,
        answer: slide.content,
        position: slide.position,
        // Store template and fontSize as JSON in a metadata field if needed
        // For now, we'll just store the content
      };

      if (slide.dbId && existingIds.has(slide.dbId)) {
        // Update existing
        await pb.collection("answers").update(slide.dbId, data);
      } else {
        // Create new
        await pb.collection("answers").create(data);
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error saving answers:", error);
    return { success: false, error: "Failed to save answers" };
  }
}
