"use client";

import { useState } from "react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError("");
    setSent(false);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          message,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      setSent(true);
      setName("");
      setEmail("");
      setMessage("");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={styles.page}>
      <div style={styles.overlay} />

      <div style={styles.wrapper}>
        <div style={styles.headerRow}>
          <div>
            <h1 style={styles.title}>Contact</h1>
            <p style={styles.subtitle}>
              Send a message directly to our email.
            </p>
          </div>

          <button
            style={styles.backButton}
            onClick={() => {
              window.location.href = "/";
            }}
          >
            Back
          </button>
        </div>

        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Message Form</h2>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.fieldWrap}>
              <label style={styles.label}>Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                style={styles.input}
                required
              />
            </div>

            <div style={styles.fieldWrap}>
              <label style={styles.label}>Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                type="email"
                style={styles.input}
                required
              />
            </div>

            <div style={styles.fieldWrap}>
              <label style={styles.label}>Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your message"
                style={styles.textarea}
                required
              />
            </div>

            <button type="submit" style={styles.submitButton} disabled={loading}>
              {loading ? "Sending..." : "Send Message"}
            </button>
          </form>

          {sent && (
            <div style={styles.successBox}>
              Message sent successfully.
            </div>
          )}

          {error && (
            <div style={styles.errorBox}>
              {error}
            </div>
          )}
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
    opacity: 1,
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
  errorBox: {
    marginTop: "18px",
    background: "rgba(239,68,68,0.12)",
    color: "#fecaca",
    border: "1px solid rgba(239,68,68,0.3)",
    borderRadius: "12px",
    padding: "14px 16px",
    fontSize: "14px",
    fontWeight: 700,
  },
};