import { notFound, redirect } from "next/navigation";
import ViewClient from "./view-client";
import { Metadata } from "next";
import { cache } from "react";
import { getAuthenticatedPb } from "@/lib/pocketbase";
import { getSession } from "@/lib/session";
import { requireAdmin } from "../../actions";

type Params = Promise<{ id: string }>;

const getQuestion = cache(async (id: string, token: string) => {
  const pb = getAuthenticatedPb(token);
  try {
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
  const session = await getSession();
  if (!session) {
    return { title: "Question Not Found" };
  }
  
  const question = await getQuestion(id, session.token);
  
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
  await requireAdmin();
  
  const session = await getSession();
  if (!session) {
    redirect("/admin/login");
  }
  
  const pb = getAuthenticatedPb(session.token);
  const { id } = await params;
  const question = await getQuestion(id, session.token);

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

  // Note: File token not needed if attachment field is not marked as "Protected" in PocketBase
  // If you need protected files, authenticate pb instance first or mark field as public
  const fileToken = "";

  return <ViewClient initialQuestion={question.question} id={id} initialAnswers={answers} fileToken={fileToken} />;
}

