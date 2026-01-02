"use server";

import pb from "@/lib/pocketbase";
import { z } from "zod";

const questionSchema = z.object({
  question: z
    .string()
    .trim()
    .min(2, "Please enter at least 2 characters")
    .max(1000, "Message is too long (max 1000 characters)"),
});

const feedbackSchema = z.object({
  feedback: z
    .string()
    .trim()
    .min(2, "Please enter at least 2 characters")
    .max(1000, "Message is too long (max 1000 characters)"),
  name: z
    .string()
    .trim()
    .max(100, "Name is too long (max 100 characters)")
    .optional(),
});

async function validateTurnstile(token: string | null) {
  if (!token) return false;

  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) {
    console.error("TURNSTILE_SECRET_KEY is not defined");
    return true; // Don't block if not configured yet, but log error
  }

  const formData = new FormData();
  formData.append("secret", secretKey);
  formData.append("response", token);

  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await response.json();
  return data.success;
}

export async function submitQuestion(
  prevState: { message: string; error?: string },
  formData: FormData
) {
  const turnstileResponse = formData.get("cf-turnstile-response") as string;
  const isTurnstileValid = await validateTurnstile(turnstileResponse);

  if (!isTurnstileValid) {
    return { message: "", error: "Invalid captcha. Please try again." };
  }

  const rawData = {
    question: formData.get("question"),
  };

  const validation = questionSchema.safeParse(rawData);

  if (!validation.success) {
    return { message: "", error: validation.error.issues[0].message };
  }

  try {
    await pb.collection("questions").create({
      question: validation.data.question,
    });

    return { message: "Message sent successfully!", error: undefined };
  } catch (error) {
    console.error("Error submitting question:", error);
    return {
      message: "",
      error: "Failed to submit question. Please try again.",
    };
  }
}

export async function submitFeedback(
  prevState: { message: string; error?: string },
  formData: FormData
) {
  const turnstileResponse = formData.get("cf-turnstile-response") as string;
  const isTurnstileValid = await validateTurnstile(turnstileResponse);

  if (!isTurnstileValid) {
    return { message: "", error: "Invalid captcha. Please try again." };
  }

  const rawData = {
    feedback: formData.get("feedback"),
    name: formData.get("name") || undefined,
  };

  const validation = feedbackSchema.safeParse(rawData);

  if (!validation.success) {
    return { message: "", error: validation.error.issues[0].message };
  }

  try {
    await pb.collection("feedbacks").create({
      feedback: validation.data.feedback,
      ...(validation.data.name && { name: validation.data.name }),
    });

    return { message: "Feedback sent successfully!", error: undefined };
  } catch (error) {
    console.error("Error submitting feedback:", error);
    return {
      message: "",
      error: "Failed to submit feedback. Please try again.",
    };
  }
}
