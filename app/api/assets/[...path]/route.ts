import { s3 } from "@/lib/s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

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
  const segments = params.path;
  const key = `assets/${segments.join("/")}`;
  const ext = segments[segments.length - 1].split(".").pop()?.toLowerCase() ?? "";
  const contentType = CONTENT_TYPE_FALLBACKS[ext] ?? "application/octet-stream";

  // 1. Try S3 first
  try {
    const res = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
    const bytes = await res.Body!.transformToByteArray();
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": res.ContentType ?? contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    // S3 miss — fall through to local fallback
  }

  // 2. Fall back to public/ (only ui/ prefix maps to public root)
  if (segments[0] === "ui") {
    const filename = segments.slice(1).join("/");
    try {
      const localPath = join(process.cwd(), "public", filename);
      const bytes = await readFile(localPath);
      return new NextResponse(bytes, {
        headers: {
          "Content-Type": contentType,
          // Short cache so S3 upload takes over quickly once deployed
          "Cache-Control": "public, max-age=60",
        },
      });
    } catch {
      // local file also not found
    }
  }

  return new NextResponse(null, { status: 404 });
}
