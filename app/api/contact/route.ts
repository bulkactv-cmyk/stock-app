import { NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { name, email, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      );
    }

    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      return NextResponse.json(
        { error: "Missing RESEND_API_KEY." },
        { status: 500 }
      );
    }

    const resend = new Resend(resendApiKey);

    await resend.emails.send({
      from: "Stock App <onboarding@resend.dev>",
      to: "denalexinvest@gmail.com",
      replyTo: email,
      subject: `New contact message from ${name}`,
      text: `
Name: ${name}
Email: ${email}

Message:
${message}
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("CONTACT EMAIL ERROR:", error);

    return NextResponse.json(
      { error: "Failed to send message." },
      { status: 500 }
    );
  }
}