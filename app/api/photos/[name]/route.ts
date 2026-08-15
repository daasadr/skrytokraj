import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { join, basename, extname } from "node:path";

// Servírování nahraných fotek z perzistentního disku (volume).
const UPLOAD_DIR = process.env.UPLOAD_DIR || join(process.cwd(), "uploads");
const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;
  const safe = basename(name); // proti path traversal
  if (!/^[a-zA-Z0-9._-]+$/.test(safe)) {
    return new NextResponse("Neplatný název", { status: 400 });
  }
  const mime = MIME[extname(safe).toLowerCase()];
  if (!mime) {
    return new NextResponse("Nepodporovaný typ", { status: 400 });
  }

  try {
    const buf = await readFile(join(UPLOAD_DIR, safe));
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": mime,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Nenalezeno", { status: 404 });
  }
}
