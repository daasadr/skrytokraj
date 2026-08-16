import { randomBytes, createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import type { AuthTokenType } from "@/generated/prisma/client";

// Tokeny pro ověření e-mailu / obnovu hesla. V DB je jen SHA-256 hash tokenu;
// syrový token putuje jen v odkazu v e-mailu.

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export async function createAuthToken(
  userId: string,
  type: AuthTokenType,
  ttlMs: number,
): Promise<string> {
  const raw = randomBytes(32).toString("base64url");
  await prisma.authToken.create({
    data: {
      userId,
      type,
      tokenHash: hashToken(raw),
      expiresAt: new Date(Date.now() + ttlMs),
    },
  });
  return raw;
}

/** Ověří a jednorázově „spotřebuje" token. Vrací userId, nebo null. */
export async function consumeAuthToken(
  raw: string,
  type: AuthTokenType,
): Promise<string | null> {
  if (!raw) return null;
  const token = await prisma.authToken.findUnique({
    where: { tokenHash: hashToken(raw) },
  });
  if (
    !token ||
    token.type !== type ||
    token.usedAt !== null ||
    token.expiresAt < new Date()
  ) {
    return null;
  }
  await prisma.authToken.update({
    where: { id: token.id },
    data: { usedAt: new Date() },
  });
  return token.userId;
}
