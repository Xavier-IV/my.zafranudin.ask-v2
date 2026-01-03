import pb from "@/lib/pocketbase";
import { NextResponse } from "next/server";

export async function GET() {
  const secret = process.env.POCKETBASE_SECRET_KEY;
  console.log("POCKETBASE_SECRET_KEY exists:", !!secret);
  if (secret) console.log("POCKETBASE_SECRET_KEY length:", secret.length);

  try {
    // Create a new published question for testing
    const testRecord = await pb.collection("questions").create({
      question: "Hello, this is a test question for the view page! 🚀",
      is_published: true,
    });
    
    return NextResponse.json({ 
      id: testRecord.id, 
      question: testRecord.question 
    });
  } catch (error: any) {
    console.error("Debug API error:", error);
    return NextResponse.json({ 
      error: error.message,
      details: error.response?.data,
      secret_configured: !!secret
    }, { status: 500 });
  }
}
