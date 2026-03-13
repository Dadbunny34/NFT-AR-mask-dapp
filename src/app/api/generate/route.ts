import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const MESHY_API_KEY = process.env.MESHY_API_KEY!;

export async function POST(req: NextRequest) {
  try {
    const { imageUrl, name } = await req.json();

    if (!imageUrl) {
      return NextResponse.json({ error: "imageUrl is required" }, { status: 400 });
    }

    const meshyRes = await fetch("https://api.meshy.ai/openapi/v1/image-to-3d", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MESHY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image_url: imageUrl,
        enable_pbr: true,
      }),
    });

    if (!meshyRes.ok) {
      const err = await meshyRes.text();
      console.error("Meshy API error:", err);
      return NextResponse.json(
        { error: "Failed to start 3D generation" },
        { status: meshyRes.status }
      );
    }

    const data = await meshyRes.json();

    return NextResponse.json({
      taskId: data.result,
      status: "PENDING",
    });
  } catch (error: any) {
    console.error("Generate error:", error);
    return NextResponse.json(
      { error: error.message || "Generation failed" },
      { status: 500 }
    );
  }
}