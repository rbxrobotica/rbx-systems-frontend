import { NextRequest, NextResponse } from "next/server";
import { verify } from "altcha-lib/frameworks/shared";
import { deriveKey } from "altcha-lib/algorithms/pbkdf2";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_MESSAGE = 5000;
const ALTCHA_SECRET = process.env.ALTCHA_SECRET;

// In-memory rate limiter: 5 submissions per IP per hour
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 5;

function sanitize(s: string, max: number): string {
  return s.trim().slice(0, max);
}

function toE164(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 15) return null;
  return `+${digits}`;
}

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.ip ?? "unknown";
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) ?? [];
  const valid = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  rateLimitMap.set(ip, valid);
  return valid.length >= RATE_LIMIT_MAX;
}

function recordRequest(ip: string): void {
  const timestamps = rateLimitMap.get(ip) ?? [];
  timestamps.push(Date.now());
  rateLimitMap.set(ip, timestamps);
}

type ContactPayload = {
  name: string;
  email: string;
  phone?: string;
  message: string;
  whatsappOptIn?: boolean;
  altcha?: string;
  website?: string;
};

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  // 1. Honeypot check — instant silent reject
  let body: ContactPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.website && body.website.trim().length > 0) {
    // Bot filled the honeypot. Return 200 to avoid tipping them off.
    return NextResponse.json({ success: true });
  }

  // 2. Rate limit check
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  // 3. Altcha verification
  if (!body.altcha) {
    return NextResponse.json({ error: "Missing anti-abuse token" }, { status: 403 });
  }

  if (!ALTCHA_SECRET) {
    console.error("ALTCHA_SECRET not configured");
    return NextResponse.json({ error: "Service unavailable" }, { status: 500 });
  }

  const altchaResult = await verify(body.altcha, deriveKey, ALTCHA_SECRET);

  if (altchaResult.error || !altchaResult.verification?.verified) {
    return NextResponse.json({ error: "Invalid anti-abuse token" }, { status: 403 });
  }

  // 4. Input validation
  const name = sanitize(body.name ?? "", 200);
  const email = sanitize(body.email ?? "", 200);
  const message = sanitize(body.message ?? "", MAX_MESSAGE);
  const phone = body.phone ? sanitize(body.phone, 20) : undefined;
  const whatsappOptIn = body.whatsappOptIn === true;

  if (!name || !email || !message) {
    return NextResponse.json(
      { error: "name, email, and message are required" },
      { status: 400 }
    );
  }

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  // Record successful validation for rate limiting
  recordRequest(ip);

  // --- Send email via Postmark ---
  const postmarkToken = process.env.POSTMARK_SERVER_TOKEN;
  if (!postmarkToken) {
    console.error("POSTMARK_SERVER_TOKEN not configured");
    return NextResponse.json({ error: "Service unavailable" }, { status: 500 });
  }

  const emailBody = [
    `Nome: ${name}`,
    `E-mail: ${email}`,
    phone ? `Telefone: ${phone}` : null,
    whatsappOptIn ? "WhatsApp opt-in: sim" : null,
    "",
    message,
  ]
    .filter(Boolean)
    .join("\n");

  const emailRes = await fetch("https://api.postmarkapp.com/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Postmark-Server-Token": postmarkToken,
      Accept: "application/json",
    },
    body: JSON.stringify({
      From: "contact@rbxsystems.ch",
      To: "contact@rbxsystems.ch",
      ReplyTo: email,
      Subject: `[Site] Nova mensagem de ${name}`,
      TextBody: emailBody,
    }),
  });

  if (!emailRes.ok) {
    const errText = await emailRes.text();
    console.error("Postmark error:", emailRes.status, errText);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }

  // --- Send WhatsApp via D360 (fire-and-forget) ---
  if (phone && whatsappOptIn) {
    const d360Key = process.env.D360_API_KEY;
    const e164 = toE164(phone);

    if (d360Key && e164) {
      fetch("https://waba.360dialog.io/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "D360-API-KEY": d360Key,
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: e164,
          type: "template",
          template: {
            name: "contact_form_acknowledgment",
            language: { code: "pt_BR" },
            components: [
              {
                type: "body",
                parameters: [
                  { type: "text", text: name },
                ],
              },
            ],
          },
        }),
      }).catch((err) => {
        console.error("D360 WhatsApp error (non-blocking):", err);
      });
    }
  }

  return NextResponse.json({ success: true });
}
