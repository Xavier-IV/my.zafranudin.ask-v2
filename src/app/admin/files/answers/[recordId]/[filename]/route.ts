import { getSession, clearSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ recordId: string; filename: string }> }
) {
  try {
    // Verify admin session (double-check even though proxy.ts protects /admin/*)
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { recordId, filename } = await params;
    
    // Validate record ID format (PocketBase IDs are 15 alphanumeric chars)
    if (!/^[a-zA-Z0-9]{15}$/.test(recordId)) {
      return NextResponse.json(
        { error: "Invalid record ID" },
        { status: 400 }
      );
    }
    
    // Construct the PocketBase file URL
    const fileUrl = `${process.env.POCKETBASE_URL}/api/files/answers/${recordId}/${encodeURIComponent(filename)}`;
    
    // Fetch the file from PocketBase with admin token
    const response = await fetch(fileUrl, {
      headers: { Authorization: `Bearer ${session.token}` },
    });

    if (!response.ok) {
      // If it's an auth error, clear the session
      if (response.status === 401 || response.status === 403) {
        await clearSession();
        return NextResponse.json(
          { error: "Session expired. Please log in again." },
          { status: 401 }
        );
      }

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
        "Cache-Control": "private, max-age=3600",
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
