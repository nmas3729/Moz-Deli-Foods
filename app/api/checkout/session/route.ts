import { NextResponse } from "next/server";
import Stripe from "stripe";
import { logSafeError } from "@/lib/http";

export async function GET(request: Request) {
  const sessionId = new URL(request.url).searchParams.get("session_id");
  if (!sessionId || !/^cs_(test|live)_[A-Za-z0-9]+$/.test(sessionId)) {
    return NextResponse.json({ error: "Invalid checkout session." }, { status: 400 });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secretKey) {
    return NextResponse.json({ error: "Stripe checkout is not configured." }, { status: 503 });
  }

  try {
    const session = await new Stripe(secretKey).checkout.sessions.retrieve(sessionId);
    return NextResponse.json({
      paymentStatus: session.payment_status,
      sessionStatus: session.status,
    });
  } catch (error) {
    logSafeError("stripe_checkout_session_verification_failed", error);
    return NextResponse.json({ error: "Payment status could not be verified." }, { status: 502 });
  }
}
