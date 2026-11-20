import { NextResponse } from "next/server";
import { logSafeError } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/.test(id)) {
    return NextResponse.json({ error: "Image not found." }, { status: 404 });
  }

  try {
    const image = await prisma.menuImageAsset.findUnique({
      where: { id },
      select: { contentType: true, altText: true, data: true },
    });
    if (!image) return NextResponse.json({ error: "Image not found." }, { status: 404 });
    return new NextResponse(image.data, {
      headers: {
        "Content-Type": image.contentType,
        "Content-Length": String(image.data.byteLength),
        "Content-Disposition": "inline",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    logSafeError("menu_image_load_failed", error);
    return NextResponse.json({ error: "Image is temporarily unavailable." }, { status: 503 });
  }
}
