"use server";

import { getAuthenticatedPb } from "@/lib/pocketbase";
import { getSession } from "@/lib/session";
import { requireAdmin } from "../actions";

export interface AnswerSlide {
  dbId?: string;
  template: "centered" | "left";
  content: string;
  fontSize: "auto" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
  position: number;
}

export async function uploadAnswerAttachment(
  answerId: string,
  questionId: string,
  formData: FormData
): Promise<{ success: boolean; attachment?: string; error?: string }> {
  await requireAdmin();
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };
  const pb = getAuthenticatedPb(session.token);

  try {
    // Verify the answer belongs to the question
    const answer = await pb.collection("answers").getOne(answerId);
    if (answer.question !== questionId) {
      return { success: false, error: "Answer does not belong to this question" };
    }

    // Upload the file
    const updatedAnswer = await pb.collection("answers").update(answerId, formData);
    
    return { 
      success: true, 
      attachment: updatedAnswer.attachment 
    };
  } catch (error) {
    console.error("Error uploading attachment:", error);
    return { success: false, error: "Failed to upload attachment" };
  }
}

export interface AttachmentConfig {
  mode: "full" | "overlay";
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  size: "sm" | "md" | "lg";
}

export async function updateAttachmentConfig(
  answerId: string,
  config: AttachmentConfig
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };
  const pb = getAuthenticatedPb(session.token);

  try {
    await pb.collection("answers").update(answerId, {
      attachment_config: JSON.stringify(config),
    });
    
    return { success: true };
  } catch (error) {
    console.error("Error updating attachment config:", error);
    return { success: false, error: "Failed to update attachment config" };
  }
}

export async function createAnswerSlide(
  questionId: string,
  content: string = "# New Section\n\nStart writing your content here...",
  position: number = 0
): Promise<{ success: boolean; dbId?: string; error?: string }> {
  await requireAdmin();
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  // Validate questionId format (PocketBase IDs are 15 alphanumeric chars)
  if (!/^[a-zA-Z0-9]{15}$/.test(questionId)) {
    return { success: false, error: "Invalid question ID format" };
  }

  const pb = getAuthenticatedPb(session.token);

  try {
    const newAnswer = await pb.collection("answers").create({
      question: questionId,
      answer: content,
      position: position,
    });

    return { success: true, dbId: newAnswer.id };
  } catch (error) {
    console.error("Error creating answer slide:", error);
    return { success: false, error: "Failed to create answer slide" };
  }
}

export async function saveAnswers(questionId: string, slides: AnswerSlide[]) {
  await requireAdmin();
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };
  
  // Validate questionId format (PocketBase IDs are 15 alphanumeric chars)
  if (!/^[a-zA-Z0-9]{15}$/.test(questionId)) {
    return { success: false, error: "Invalid question ID format" };
  }
  
  const pb = getAuthenticatedPb(session.token);

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

