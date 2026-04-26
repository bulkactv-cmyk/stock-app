"use client";

import { useEffect, useState } from "react";
import { createClient } from "../lib/supabase/client";

type PlanType = "basic" | "pro" | "unlimited" | "loading" | "guest";

export default function HomePage() {
  const supabase = createClient();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState<PlanType>("loading");

  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.email) {
        setIsLoggedIn(false);
        setPlan("guest");
        return;
      }

      setIsLoggedIn(true);
      setEmail(user.email);

      const { data } = await supabase
        .from("user_plans")
        .select("plan")
        .eq("email", user.email)
        .single();

      setPlan((data?.plan as PlanType) || "basic");
    };

    loadUser();
  }, [supabase]);

  return (
    <main style={styles.page}>
      {/* NAVBAR */}
      <div style={styles.nav}>
        <div style={styles.logo}>FA</div>

        <div style={styles.navRight}>
          <button onClick={() => (window.location.href = "/pricing")}>
            Pricing
          </button>

          {isLoggedIn ? (
            <>
              <button onClick={() => (window.location.href = "/dashboard")}>
                Dashboard
              </button>

              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  window.location.reload();
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <button onClick={() => (window.location.href = "/auth")}>
              Login
            </button>
          )}
        </div>
      </div>

      {/* HERO */}
      <section style={styles.hero}>
        <h1 style={styles.title}>
          Professional Stock & Crypto Analysis Platform
        </h1>

        <p style={styles.subtitle}>
          Analyze assets with AI, financial metrics, and real-time market data.
        </p>

        <div style={styles.heroButtons}>
          <button
            style={styles.primaryBtn}
            onClick={() => (window.location.href = "/dashboard")}
          >
            Start Analysis
          </button>

          <button
            style={styles.secondaryBtn}
            onClick={() => (window.location.href = "/pricing")}
          >
            View Pricing
          </button>
        </div>
      </section>

      {/* FEATURES */}
      <section style={styles.grid}>
        <Card title="AI Analysis" text="Instant insights with structured data" />
        <Card title="Financial Metrics" text="EPS, margins, valuation" />
        <Card title="Crypto Data" text="Market cap, liquidity, trends" />
        <Card title="Unlimited Plan" text="Full access to all tools" />
      </section>

      {/* PLAN */}
      <section style={styles.planBox}>
        <div>Your Plan: {plan.toUpperCase()}</div>
        {isLoggedIn && <div>{email}</div>}
      </section>
    </main>
  );
}

function Card({ title, text }: any) {
  return (
    <div style={styles.card}>
      <div style={styles.cardTitle}>{title}</div>
      <div style={styles.cardText}>{text}</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#020617",
    color: "white",
    padding: "20px",
    fontFamily: "system-ui",
  },

  nav: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "30px",
  },

  logo: {
    fontWeight: 800,
    fontSize: "22px",
  },

  navRight: {
    display: "flex",
    gap: "10px",
  },

  hero: {
    textAlign: "center",
    marginBottom: "40px",
  },

  title: {
    fontSize: "28px",
    fontWeight: 800,
    marginBottom: "10px",
  },

  subtitle: {
    color: "#94a3b8",
  },

  heroButtons: {
    marginTop: "20px",
    display: "flex",
    justifyContent: "center",
    gap: "10px",
    flexWrap: "wrap",
  },

  primaryBtn: {
    background: "#2563eb",
    padding: "12px 20px",
    borderRadius: "10px",
    border: "none",
    color: "white",
    fontWeight: 700,
  },

  secondaryBtn: {
    background: "#1e293b",
    padding: "12px 20px",
    borderRadius: "10px",
    border: "none",
    color: "white",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "12px",
    marginBottom: "30px",
  },

  card: {
    background: "#0f172a",
    padding: "16px",
    borderRadius: "12px",
  },

  cardTitle: {
    fontWeight: 700,
    marginBottom: "6px",
  },

  cardText: {
    color: "#94a3b8",
  },

  planBox: {
    background: "#0f172a",
    padding: "16px",
    borderRadius: "12px",
  },
};