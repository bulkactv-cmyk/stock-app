"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase/client";

type CheckoutPlan = "basic" | "pro" | "unlimited";

export default function PricingPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [loadingPlan, setLoadingPlan] = useState<CheckoutPlan | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.email) {
        setEmail(user.email);
      }
    };

    loadUser();
  }, [supabase]);

  async function startCheckout(plan: CheckoutPlan) {
    try {
      if (!email) {
        alert("Моля, първо влез в акаунта си.");
        window.location.href = "/auth";
        return;
      }

      setLoadingPlan(plan);

      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan, email }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Грешка при плащането");
        setLoadingPlan(null);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
        return;
      }

      alert("Липсва checkout URL");
      setLoadingPlan(null);
    } catch (error) {
      console.error("Checkout fetch error:", error);
      alert("Проблем при връзката със Stripe");
      setLoadingPlan(null);
    }
  }

  return (
    <main style={styles.page}>
      <div style={styles.overlay} />

      <div style={styles.wrapper}>
        <header style={styles.header}>
          <div style={styles.logoWrap}>
            <div style={styles.logoCircle}>FA</div>
            <div>
              <div style={styles.logoTitle}>Fundamental AI</div>
              <div style={styles.logoSubTitle}>Абонаментни планове</div>
            </div>
          </div>

          <div style={styles.headerButtons}>
            <button
              style={styles.secondaryButton}
              onClick={() => {
                window.location.href = "/";
              }}
            >
              Начало
            </button>

            <button
              style={styles.secondaryButton}
              onClick={() => {
                window.location.href = "/dashboard";
              }}
            >
              Dashboard
            </button>
          </div>
        </header>

        <section style={styles.hero}>
          <div style={styles.heroBadge}>Избери подходящия план</div>
          <h1 style={styles.title}>Планове за всеки тип инвеститор</h1>
          <p style={styles.subtitle}>
            Започни с Basic, премини към Pro за по-дълбок анализ или отключи
            пълния потенциал с Unlimited.
          </p>
        </section>

        <section style={styles.grid}>
          <div style={styles.card}>
            <div style={styles.planHeader}>
              <div style={styles.planName}>Basic</div>
              <div style={styles.planTag}>Стартов платен план</div>
            </div>

            <div style={styles.priceWrap}>
              <div style={styles.price}>€4.99</div>
              <div style={styles.period}>/ месец</div>
            </div>

            <p style={styles.planText}>
              Подходящ за потребители, които искат достъпен вход към анализа на
              акции.
            </p>

            <div style={styles.features}>
              <div style={styles.feature}>• 10 анализа на ден</div>
              <div style={styles.feature}>• Само акции</div>
              <div style={styles.feature}>• Базови фундаментални метрики</div>
              <div style={styles.feature}>• Кратка финална оценка</div>
              <div style={styles.feature}>• 1 месец достъп</div>
            </div>

            <div style={styles.noteBox}>
              <div style={styles.noteTitle}>Подходящ за:</div>
              <div style={styles.noteText}>
                Бърза първа оценка на компании без нужда от пълния premium пакет.
              </div>
            </div>

            <button
              style={styles.basicButton}
              onClick={() => startCheckout("basic")}
              disabled={loadingPlan !== null}
            >
              {loadingPlan === "basic" ? "Зареждане..." : "Купи Basic"}
            </button>
          </div>

          <div style={{ ...styles.card, ...styles.featuredCard }}>
            <div style={styles.popularBadge}>Най-популярен</div>

            <div style={styles.planHeader}>
              <div style={styles.planName}>Pro</div>
              <div style={styles.planTag}>По-сериозен анализ</div>
            </div>

            <div style={styles.priceWrap}>
              <div style={styles.price}>€9.99</div>
              <div style={styles.period}>/ месец</div>
            </div>

            <p style={styles.planText}>
              За инвеститори, които искат по-дълбока оценка, AI анализ и повече
              данни за компаниите.
            </p>

            <div style={styles.features}>
              <div style={styles.feature}>• 20 анализа на ден</div>
              <div style={styles.feature}>• Само акции</div>
              <div style={styles.feature}>• Всичко от Basic</div>
              <div style={styles.feature}>• Пълни метрики за акции</div>
              <div style={styles.feature}>• AI анализ и fair value view</div>
              <div style={styles.feature}>• Графика на акцията</div>
            </div>

            <div style={styles.noteBox}>
              <div style={styles.noteTitle}>Подходящ за:</div>
              <div style={styles.noteText}>
                Инвеститори, които сравняват компании и искат по-детайлна
                фундаментална картина.
              </div>
            </div>

            <button
              style={styles.primaryButton}
              onClick={() => startCheckout("pro")}
              disabled={loadingPlan !== null}
            >
              {loadingPlan === "pro" ? "Зареждане..." : "Купи Pro"}
            </button>
          </div>

          <div style={styles.card}>
            <div style={styles.planHeader}>
              <div style={styles.planName}>Unlimited</div>
              <div style={styles.planTag}>Пълен достъп</div>
            </div>

            <div style={styles.priceWrap}>
              <div style={styles.price}>€19.99</div>
              <div style={styles.period}>/ месец</div>
            </div>

            <p style={styles.planText}>
              Максимален достъп за потребители, които искат акции, крипто и
              всички premium функции в платформата.
            </p>

            <div style={styles.features}>
              <div style={styles.feature}>• Неограничени анализи</div>
              <div style={styles.feature}>• Акции + криптовалути</div>
              <div style={styles.feature}>• Всичко от Pro</div>
              <div style={styles.feature}>• Разширени premium метрики</div>
              <div style={styles.feature}>• AI анализ за пълния пакет</div>
              <div style={styles.feature}>• Crypto графики и market overview</div>
              <div style={styles.feature}>• Бъдещи premium ъпдейти</div>
            </div>

            <div style={styles.noteBox}>
              <div style={styles.noteTitle}>Подходящ за:</div>
              <div style={styles.noteText}>
                Активни инвеститори и трейдъри, които искат пълна картина на
                пазара в една платформа.
              </div>
            </div>

            <button
              style={styles.unlimitedButton}
              onClick={() => startCheckout("unlimited")}
              disabled={loadingPlan !== null}
            >
              {loadingPlan === "unlimited" ? "Зареждане..." : "Купи Unlimited"}
            </button>
          </div>
        </section>

        <section style={styles.compareSection}>
          <h2 style={styles.compareTitle}>Сравнение на функциите</h2>

          <div style={styles.compareCard}>
            <div style={styles.compareHeader}>
              <div style={{ ...styles.compareCell, flex: 1.6 }}>Функция</div>
              <div style={styles.compareCell}>Basic</div>
              <div style={styles.compareCell}>Pro</div>
              <div style={styles.compareCell}>Unlimited</div>
            </div>

            {[
              ["Анализи на ден", "10", "20", "∞"],
              ["Анализ на акции", "Да", "Да", "Да"],
              ["Анализ на крипто", "Не", "Не", "Да"],
              ["Базови метрики", "Да", "Да", "Да"],
              ["Разширени метрики", "Не", "Да", "Да"],
              ["AI анализ", "Ограничен", "Да", "Да"],
              ["Графики", "Не", "Да", "Да"],
              ["Market overview", "Не", "Ограничено", "Да"],
            ].map((row, index) => (
              <div key={index} style={styles.compareRow}>
                <div style={{ ...styles.compareValue, flex: 1.6 }}>{row[0]}</div>
                <div style={styles.compareValue}>{row[1]}</div>
                <div style={styles.compareValue}>{row[2]}</div>
                <div style={styles.compareValue}>{row[3]}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    position: "relative",
    background:
      "radial-gradient(circle at top, #122a52 0%, #08152f 42%, #050d1f 100%)",
    padding: "28px 20px 50px",
    overflow: "hidden",
  },
  overlay: {
    position: "absolute",
    inset: 0,
    background: "rgba(3, 10, 25, 0.18)",
    backdropFilter: "blur(2px)",
  },
  wrapper: {
    position: "relative",
    zIndex: 1,
    maxWidth: "1240px",
    margin: "0 auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    flexWrap: "wrap",
    marginBottom: "34px",
  },
  logoWrap: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },
  logoCircle: {
    width: "52px",
    height: "52px",
    borderRadius: "16px",
    background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    fontWeight: 900,
    boxShadow: "0 14px 30px rgba(37,99,235,0.35)",
  },
  logoTitle: {
    color: "white",
    fontSize: "22px",
    fontWeight: 800,
  },
  logoSubTitle: {
    color: "#94a3b8",
    fontSize: "13px",
    marginTop: "2px",
  },
  headerButtons: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  },
  secondaryButton: {
    background: "#334155",
    color: "white",
    border: "none",
    borderRadius: "12px",
    padding: "12px 18px",
    fontSize: "15px",
    fontWeight: 700,
    cursor: "pointer",
  },
  hero: {
    textAlign: "center",
    maxWidth: "860px",
    margin: "0 auto 32px",
  },
  heroBadge: {
    display: "inline-block",
    background: "rgba(37,99,235,0.18)",
    color: "#bfdbfe",
    border: "1px solid rgba(59,130,246,0.35)",
    borderRadius: "999px",
    padding: "8px 12px",
    fontSize: "12px",
    fontWeight: 800,
    marginBottom: "16px",
  },
  title: {
    color: "white",
    fontSize: "46px",
    fontWeight: 900,
    marginBottom: "14px",
  },
  subtitle: {
    color: "#94a3b8",
    fontSize: "18px",
    lineHeight: 1.7,
    margin: 0,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "22px",
    marginBottom: "34px",
    alignItems: "stretch",
  },
  card: {
    position: "relative",
    background: "rgba(10, 20, 40, 0.92)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "24px",
    padding: "28px",
    boxShadow: "0 18px 40px rgba(0,0,0,0.35)",
    color: "white",
    display: "flex",
    flexDirection: "column",
    minHeight: "100%",
  },
  featuredCard: {
    border: "1px solid rgba(59,130,246,0.45)",
    boxShadow: "0 22px 50px rgba(37,99,235,0.18)",
    transform: "translateY(-4px)",
  },
  popularBadge: {
    position: "absolute",
    top: "-12px",
    left: "24px",
    background: "#2563eb",
    color: "white",
    borderRadius: "999px",
    padding: "7px 12px",
    fontSize: "12px",
    fontWeight: 800,
    boxShadow: "0 12px 24px rgba(37,99,235,0.28)",
  },
  planHeader: {
    marginBottom: "14px",
  },
  planName: {
    fontSize: "28px",
    fontWeight: 900,
    marginBottom: "6px",
  },
  planTag: {
    color: "#94a3b8",
    fontSize: "14px",
  },
  priceWrap: {
    display: "flex",
    alignItems: "baseline",
    gap: "8px",
    marginBottom: "12px",
  },
  price: {
    fontSize: "38px",
    fontWeight: 900,
    color: "white",
  },
  period: {
    color: "#94a3b8",
    fontSize: "15px",
  },
  planText: {
    color: "#cbd5e1",
    fontSize: "15px",
    lineHeight: 1.7,
    marginTop: 0,
    marginBottom: "20px",
  },
  features: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginBottom: "22px",
  },
  feature: {
    color: "#e2e8f0",
    fontSize: "15px",
    lineHeight: 1.55,
  },
  noteBox: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "16px",
    padding: "16px",
    marginBottom: "22px",
  },
  noteTitle: {
    color: "white",
    fontSize: "14px",
    fontWeight: 800,
    marginBottom: "8px",
  },
  noteText: {
    color: "#cbd5e1",
    fontSize: "14px",
    lineHeight: 1.65,
  },
  basicButton: {
    marginTop: "auto",
    background: "#334155",
    color: "white",
    border: "none",
    borderRadius: "14px",
    padding: "14px 18px",
    fontSize: "16px",
    fontWeight: 800,
    cursor: "pointer",
    width: "100%",
  },
  primaryButton: {
    marginTop: "auto",
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "14px",
    padding: "14px 18px",
    fontSize: "16px",
    fontWeight: 800,
    cursor: "pointer",
    width: "100%",
  },
  unlimitedButton: {
    marginTop: "auto",
    background: "#111827",
    color: "white",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "14px",
    padding: "14px 18px",
    fontSize: "16px",
    fontWeight: 800,
    cursor: "pointer",
    width: "100%",
  },
  compareSection: {
    marginTop: "10px",
  },
  compareTitle: {
    color: "white",
    fontSize: "32px",
    fontWeight: 900,
    textAlign: "center",
    marginBottom: "18px",
  },
  compareCard: {
    background: "rgba(10, 20, 40, 0.92)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "24px",
    overflow: "hidden",
    boxShadow: "0 18px 40px rgba(0,0,0,0.35)",
  },
  compareHeader: {
    display: "flex",
    gap: "10px",
    padding: "18px 22px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.02)",
  },
  compareRow: {
    display: "flex",
    gap: "10px",
    padding: "16px 22px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  compareCell: {
    flex: 1,
    color: "#94a3b8",
    fontSize: "14px",
    fontWeight: 800,
    textAlign: "center",
  },
  compareValue: {
    flex: 1,
    color: "white",
    fontSize: "14px",
    fontWeight: 700,
    textAlign: "center",
  },
};