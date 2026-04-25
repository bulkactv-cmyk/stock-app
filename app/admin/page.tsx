import { redirect } from "next/navigation";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { createClient } from "../../lib/supabase/server";

export const dynamic = "force-dynamic";

const ADMIN_EMAIL = "denalexinvest@gmail.com";

type ContactMessage = {
  id: number;
  name: string;
  email: string;
  message: string;
  status: string;
  created_at: string;
};

function getSupabaseAdmin() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

export default async function AdminPage() {
  const supabaseUser = await createClient();

  const {
    data: { user },
  } = await supabaseUser.auth.getUser();

  if (!user?.email) {
    redirect("/auth");
  }

  if (user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return (
      <main style={styles.page}>
        <div style={styles.card}>
          <h1 style={styles.title}>Unauthorized</h1>
          <p style={styles.subtitle}>
            You do not have permission to access this page.
          </p>
          <a href="/" style={styles.backButton}>
            Back to Home
          </a>
        </div>
      </main>
    );
  }

  const supabase = getSupabaseAdmin();

  await supabase.from("user_plans").upsert(
    {
      email: ADMIN_EMAIL,
      plan: "unlimited",
      access_active: true,
    },
    { onConflict: "email" }
  );

  const { data, error } = await supabase
    .from("contact_messages")
    .select("id, name, email, message, status, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main style={styles.page}>
        <h1 style={styles.title}>Admin Messages</h1>
        <div style={styles.errorBox}>Failed to load messages.</div>
      </main>
    );
  }

  const messages = (data || []) as ContactMessage[];

  return (
    <main style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Admin Messages</h1>
          <p style={styles.subtitle}>
            Private admin panel for contact form submissions.
          </p>
          <p style={styles.adminBadge}>Admin: {ADMIN_EMAIL} · Unlimited Plan</p>
        </div>

        <a href="/" style={styles.backButton}>
          Back to Home
        </a>
      </div>

      <div style={styles.card}>
        {messages.length === 0 ? (
          <p style={styles.empty}>No messages yet.</p>
        ) : (
          messages.map((item) => (
            <div key={item.id} style={styles.messageCard}>
              <div style={styles.messageHeader}>
                <div>
                  <h2 style={styles.name}>{item.name}</h2>
                  <p style={styles.email}>{item.email}</p>
                </div>

                <span style={styles.status}>{item.status}</span>
              </div>

              <p style={styles.message}>{item.message}</p>

              <p style={styles.date}>
                {new Date(item.created_at).toLocaleString("en-US")}
              </p>
            </div>
          ))
        )}
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top, #0f274d 0%, #08152f 40%, #050d1f 100%)",
    padding: "32px 20px",
    color: "white",
  },
  header: {
    maxWidth: "1100px",
    margin: "0 auto 24px auto",
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  title: {
    fontSize: "42px",
    fontWeight: 800,
    margin: 0,
  },
  subtitle: {
    color: "#94a3b8",
    marginTop: "8px",
  },
  adminBadge: {
    color: "#bfdbfe",
    fontWeight: 800,
    marginTop: "10px",
  },
  backButton: {
    background: "rgba(255,255,255,0.06)",
    color: "white",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "12px",
    padding: "12px 18px",
    fontWeight: 700,
    textDecoration: "none",
    display: "inline-block",
  },
  card: {
    maxWidth: "1100px",
    margin: "0 auto",
    background: "rgba(10, 20, 40, 0.94)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "24px",
    padding: "24px",
    boxShadow: "0 18px 40px rgba(0,0,0,0.35)",
  },
  messageCard: {
    background: "#111827",
    border: "1px solid #374151",
    borderRadius: "16px",
    padding: "18px",
    marginBottom: "16px",
  },
  messageHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "flex-start",
  },
  name: {
    fontSize: "20px",
    margin: 0,
  },
  email: {
    color: "#93c5fd",
    margin: "6px 0 0 0",
  },
  status: {
    background: "rgba(37,99,235,0.15)",
    color: "#bfdbfe",
    border: "1px solid rgba(37,99,235,0.35)",
    borderRadius: "999px",
    padding: "6px 10px",
    fontSize: "12px",
    fontWeight: 800,
    textTransform: "uppercase",
  },
  message: {
    color: "#e5e7eb",
    lineHeight: 1.6,
    marginTop: "16px",
    whiteSpace: "pre-wrap",
  },
  date: {
    color: "#94a3b8",
    fontSize: "13px",
    marginTop: "14px",
  },
  empty: {
    color: "#94a3b8",
    margin: 0,
  },
  errorBox: {
    maxWidth: "900px",
    margin: "24px auto",
    background: "rgba(239,68,68,0.12)",
    color: "#fecaca",
    border: "1px solid rgba(239,68,68,0.3)",
    borderRadius: "12px",
    padding: "14px 16px",
    fontWeight: 700,
  },
};