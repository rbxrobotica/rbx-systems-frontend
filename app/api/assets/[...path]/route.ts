import { s3 } from "@/lib/s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";

const BUCKET = process.env.CONTABO_S3_CONTENT_BUCKET ?? "rbx-content";

const CONTENT_TYPE_FALLBACKS: Record<string, string> = {
  svg: "image/svg+xml",
  png: "image/png",
  webp: "image/webp",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const key = `assets/${params.path.join("/")}`;
  const ext = params.path[params.path.length - 1].split(".").pop()?.toLowerCase() ?? "";

  try {
    const res = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
    const bytes = await res.Body!.transformToByteArray();

    return new NextResponse(bytes, {
      headers: {
        "Content-Type": res.ContentType ?? CONTENT_TYPE_FALLBACKS[ext] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
