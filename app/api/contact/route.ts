import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log("CONTACT ENV CHECK:", {
    hasSupabaseUrl: Boolean(supabaseUrl),
    hasServiceRoleKey: Boolean(serviceRoleKey),
    hasResendApiKey: Boolean(process.env.RESEND_API_KEY),
  });

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL.");
  }

  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function POST(req: Request) {
  try {
    const { name, email, message } = await req.json();

    console.log("CONTACT DATA RECEIVED:", {
      name,
      email,
      hasMessage: Boolean(message),
    });

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      );
    }

    const cleanName = String(name).trim();
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanMessage = String(message).trim();

    const supabaseAdmin = getSupabaseAdmin();

    const { data: insertedMessage, error: insertError } = await supabaseAdmin
      .from("contact_messages")
      .insert({
        name: cleanName,
        email: cleanEmail,
        message: cleanMessage,
        status: "new",
      })
      .select("id, name, email, status, created_at")
      .single();

    console.log("CONTACT INSERT RESULT:", {
      insertedMessage,
      insertError,
    });

    if (insertError) {
      console.error("CONTACT MESSAGE INSERT ERROR:", insertError);

      return NextResponse.json(
        {
          error: "Failed to save message.",
          details: insertError.message,
        },
        { status: 500 }
      );
    }

    const resendApiKey = process.env.RESEND_API_KEY;

    if (resendApiKey) {
      const resend = new Resend(resendApiKey);

      const emailResult = await resend.emails.send({
        from: "Stock App <onboarding@resend.dev>",
        to: "denalexinvest@gmail.com",
        replyTo: cleanEmail,
        subject: `New contact message from ${cleanName}`,
        text: `
New contact message

Name: ${cleanName}
Email: ${cleanEmail}

Message:
${cleanMessage}
        `,
      });

      console.log("CONTACT EMAIL RESULT:", emailResult);
    } else {
      console.warn("CONTACT EMAIL SKIPPED: Missing RESEND_API_KEY.");
    }

    return NextResponse.json({
      success: true,
      messageId: insertedMessage?.id ?? null,
    });
  } catch (error: unknown) {
    console.error("CONTACT API ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to send message.",
      },
      { status: 500 }
    );
  }
}