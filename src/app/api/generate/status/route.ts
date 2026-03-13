import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const MESHY_API_KEY = process.env.MESHY_API_KEY!;

export async function GET(req: NextRequest) {
  const taskId = req.nextUrl.searchParams.get("taskId");

  if (!taskId) {
    return NextResponse.json(
      { error: "taskId is required" },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(
      `https://api.meshy.ai/openapi/v1/image-to-3d/${taskId}`,
      {
        headers: {
          Authorization: `Bearer ${MESHY_API_KEY}`,
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json(
        { error: "Failed to check status", details: err },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Proxy the model URL through our own API to avoid CORS
    const modelUrl =
      data.status === "SUCCEEDED" && data.model_urls?.glb
        ? `/api/generate/model?url=${encodeURIComponent(data.model_urls.glb)}`
        : null;

    return NextResponse.json(
      {
        status: data.status,
        progress: data.progress || 0,
        modelUrl: data.status === "SUCCEEDED" && data.model_urls?.glb
  ? `/api/generate/model?url=${encodeURIComponent(data.model_urls.glb)}`
  : null,
        textureUrls: data.texture_urls || null,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          "CDN-Cache-Control": "no-store",
        },
      }
    );
  } catch (error: any) {
    console.error("Status check error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}