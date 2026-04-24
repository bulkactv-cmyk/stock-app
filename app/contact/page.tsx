"use client";

import { useState } from "react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    console.log("CONTACT FORM:", {
      name,
      email,
      message,
    });

    setSent(true);
    setName("");
    setEmail("");
    setMessage("");
  };

  return (
    <main style={styles.page}>
      <div style={styles.overlay} />

      <div style={styles.wrapper}>
        <div style={styles.headerRow}>
          <div>
            <h1 style={styles.title}>Контакт</h1>
            <p style={styles.subtitle}>
              Изпрати съобщение през платформата.
            </p>
          </div>

          <button
            style={styles.backButton}
            onClick={() => {
              window.location.href = "/";
            }}
          >
            Назад
          </button>
        </div>

        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Форма за съобщение</h2>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.fieldWrap}>
              <label style={styles.label}>Име</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Въведи име"
                style={styles.input}
                required
              />
            </div>

            <div style={styles.fieldWrap}>
              <label style={styles.label}>Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Въведи email"
                type="email"
                style={styles.input}
                required
              />
            </div>

            <div style={styles.fieldWrap}>
              <label style={styles.label}>Съобщение</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Напиши съобщението си"
                style={styles.textarea}
                required
              />
            </div>

            <button type="submit" style={styles.submitButton}>
              Изпрати съобщение
            </button>
          </form>

          {sent ? (
            <div style={styles.successBox}>
              Съобщението беше изпратено успешно.
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    position: "relative",
    background:
      "radial-gradient(circle at top, #0f274d 0%, #08152f 40%, #050d1f 100%)",
    padding: "32px 20px",
    overflow: "hidden",
  },
  overlay: {
    position: "absolute",
    inset: 0,
    background: "rgba(3, 10, 25, 0.25)",
    backdropFilter: "blur(2px)",
  },
  wrapper: {
    position: "relative",
    zIndex: 1,
    maxWidth: "900px",
    margin: "0 auto",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    flexWrap: "wrap",
    marginBottom: "20px",
  },
  title: {
    color: "white",
    fontSize: "42px",
    fontWeight: 800,
    margin: "0 0 8px 0",
  },
  subtitle: {
    color: "#94a3b8",
    fontSize: "16px",
    margin: 0,
  },
  backButton: {
    background: "rgba(255,255,255,0.04)",
    color: "white",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "12px",
    padding: "12px 18px",
    fontSize: "15px",
    fontWeight: 700,
    cursor: "pointer",
  },
  card: {
    background: "rgba(10, 20, 40, 0.94)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "24px",
    padding: "24px",
    boxShadow: "0 18px 40px rgba(0,0,0,0.35)",
  },
  cardTitle: {
    color: "white",
    fontSize: "26px",
    fontWeight: 800,
    marginTop: 0,
    marginBottom: "18px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  fieldWrap: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    color: "#cbd5e1",
    fontSize: "14px",
    fontWeight: 700,
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    background: "#111827",
    color: "white",
    border: "1px solid #374151",
    borderRadius: "12px",
    padding: "14px 16px",
    fontSize: "15px",
    outline: "none",
  },
  textarea: {
    width: "100%",
    minHeight: "180px",
    resize: "vertical",
    boxSizing: "border-box",
    background: "#111827",
    color: "white",
    border: "1px solid #374151",
    borderRadius: "12px",
    padding: "14px 16px",
    fontSize: "15px",
    outline: "none",
  },
  submitButton: {
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "12px",
    padding: "15px 18px",
    fontSize: "16px",
    fontWeight: 800,
    cursor: "pointer",
  },
  successBox: {
    marginTop: "18px",
    background: "rgba(34,197,94,0.12)",
    color: "#bbf7d0",
    border: "1px solid rgba(34,197,94,0.3)",
    borderRadius: "12px",
    padding: "14px 16px",
    fontSize: "14px",
    fontWeight: 700,
  },
};