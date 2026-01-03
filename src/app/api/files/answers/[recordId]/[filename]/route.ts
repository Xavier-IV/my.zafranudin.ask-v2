"use server";

import pb from "@/lib/pocketbase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ recordId: string; filename: string }> }
) {
  try {
    const { recordId, filename } = await params;
    
    // Construct the PocketBase file URL
    const fileUrl = `${process.env.POCKETBASE_URL}/api/files/answers/${recordId}/${filename}`;
    
    // Fetch the file from PocketBase with authentication headers
    const response = await fetch(fileUrl, {
      headers: pb.authStore.token
        ? { Authorization: `Bearer ${pb.authStore.token}` }
        : process.env.POCKETBASE_SECRET_KEY
        ? { "x-secret-key": process.env.POCKETBASE_SECRET_KEY }
        : {},
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "File not found" },
        { status: response.status }
      );
    }

    // Get the file data
    const fileData = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "image/jpeg";

    // Return the file with appropriate headers
    return new NextResponse(fileData, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Error proxying file:", error);
    return NextResponse.json(
      { error: "Failed to fetch file" },
      { status: 500 }
    );
  }
}
