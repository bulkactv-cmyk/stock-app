"use client";

import { useState } from "react";
import { createClient } from "../../lib/supabase/client";

export default function AuthPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const signUp = async () => {
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    alert("Регистрацията е успешна. Сега влез с имейла и паролата.");
    setLoading(false);
  };

  const signIn = async () => {
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from("user_plans").upsert({
      email,
      plan: "basic",
      access_active: false,
    });

    if (insertError) {
      console.log("Insert error:", insertError.message);
    }

    alert("Влезе успешно!");
    window.location.href = "/";

    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Добре дошъл</h1>
        <p style={styles.subtitle}>Влез или създай акаунт</p>

        <input
          type="email"
          placeholder="Имейл"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
        />

        <input
          type="password"
          placeholder="Парола"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
        />

        <div style={styles.buttons}>
          <button onClick={signUp} disabled={loading} style={styles.secondaryBtn}>
            Регистрация
          </button>

          <button onClick={signIn} disabled={loading} style={styles.primaryBtn}>
            Вход
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: any = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#0f172a",
  },
  card: {
    background: "#111827",
    padding: "40px",
    borderRadius: "16px",
    width: "360px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
  },
  title: {
    color: "white",
    marginBottom: "8px",
  },
  subtitle: {
    color: "#9ca3af",
    marginBottom: "24px",
  },
  input: {
    width: "100%",
    padding: "12px",
    marginBottom: "12px",
    borderRadius: "8px",
    border: "1px solid #374151",
    background: "#1f2937",
    color: "white",
  },
  buttons: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "10px",
  },
  primaryBtn: {
    background: "#2563eb",
    color: "white",
    padding: "10px 16px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
  },
  secondaryBtn: {
    background: "#374151",
    color: "white",
    padding: "10px 16px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
  },
};