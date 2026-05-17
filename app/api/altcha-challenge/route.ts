import { NextResponse } from "next/server";
import { createChallenge, randomInt } from "altcha-lib";
import { deriveKey } from "altcha-lib/algorithms/pbkdf2";

const HMAC_SECRET = process.env.ALTCHA_SECRET;

export async function GET() {
  if (!HMAC_SECRET) {
    console.error("ALTCHA_SECRET not configured");
    return NextResponse.json({ error: "Service unavailable" }, { status: 500 });
  }

  const challenge = await createChallenge({
    algorithm: "PBKDF2/SHA-256",
    cost: 5_000,
    counter: randomInt(5_000, 10_000),
    deriveKey,
    hmacSignatureSecret: HMAC_SECRET,
  });

  return NextResponse.json(challenge);
}
