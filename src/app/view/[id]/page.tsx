import pb from "@/lib/pocketbase";
import { notFound } from "next/navigation";
import ViewClient from "./view-client";
import { Metadata } from "next";
import { cache } from "react";

type Params = Promise<{ id: string }>;

const getQuestion = cache(async (id: string) => {
  try {
    // viewRule on collection already checks is_published=true
    return await pb.collection("questions").getOne(id);
  } catch (error: any) {
    console.error("PocketBase error fetching question:", {
      id,
      status: error?.status,
      message: error?.message,
    });
    return null;
  }
});

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const question = await getQuestion(id);
  
  if (!question) {
    return {
      title: "Question Not Found",
    };
  }

  return {
    title: "Anonymous Question",
    description: question.question.substring(0, 160),
  };
}

export default async function ViewPage({ params }: { params: Params }) {
  const { id } = await params;
  const question = await getQuestion(id);

  if (!question) {
    return notFound();
  }

  // Fetch answers for this question
  let answers: any[] = [];
  try {
    answers = await pb.collection("answers").getFullList({
      filter: `question = "${id}"`,
      sort: "position",
    });
  } catch (error) {
    console.error("Error fetching answers:", error);
  }

  return <ViewClient initialQuestion={question.question} id={id} initialAnswers={answers} />;
}
