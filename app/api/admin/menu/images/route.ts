import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { hasTrustedOrigin, logSafeError } from "@/lib/http";
import { detectMenuImageType, MAX_MENU_IMAGE_BYTES } from "@/lib/menu-image";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Administrator access is required." }, { status: 401 });
  }
  if (!hasTrustedOrigin(request)) {
    return NextResponse.json({ error: "Request origin was not accepted." }, { status: 403 });
  }
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("multipart/form-data")) {
    return NextResponse.json({ error: "Upload an image file." }, { status: 415 });
  }
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_MENU_IMAGE_BYTES + 32_768) {
    return NextResponse.json({ error: "Images must be 5 MB or smaller." }, { status: 413 });
  }

  try {
    const form = await request.formData();
    const file = form.get("file");
    const altText = form.get("altText");
    if (!(file instanceof File) || typeof altText !== "string" || !altText.trim() || altText.length > 200) {
      return NextResponse.json({ error: "Choose an image and provide descriptive alt text." }, { status: 400 });
    }
    if (file.size === 0 || file.size > MAX_MENU_IMAGE_BYTES) {
      return NextResponse.json({ error: "Images must be between 1 byte and 5 MB." }, { status: 413 });
    }

    const data = new Uint8Array(await file.arrayBuffer());
    const contentType = detectMenuImageType(data);
    if (!contentType || contentType !== file.type) {
      return NextResponse.json({ error: "Use a valid JPEG, PNG or WebP image." }, { status: 415 });
    }

    const image = await prisma.menuImageAsset.create({
      data: {
        id: randomUUID(),
        contentType,
        altText: altText.trim(),
        data,
      },
      select: { id: true, altText: true },
    });
    return NextResponse.json({
      image: `/api/menu/images/${image.id}`,
      altText: image.altText,
    }, { status: 201 });
  } catch (error) {
    logSafeError("admin_menu_image_upload_failed", error);
    return NextResponse.json({ error: "The image could not be uploaded." }, { status: 503 });
  }
}
