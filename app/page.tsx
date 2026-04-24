"use client";

import { useEffect, useState } from "react";
import { createClient } from "../lib/supabase/client";

type PlanType = "basic" | "pro" | "unlimited" | "loading" | "guest";

type ClockItemProps = {
  label: string;
  time: string;
};

function ClockItem({ label, time }: ClockItemProps) {
  return (
    <div style={styles.clockCard}>
      <div style={styles.clockLabel}>{label}</div>
      <div style={styles.clockTime}>{time}</div>
    </div>
  );
}

export default function HomePage() {
  const supabase = createClient();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState<PlanType>("loading");
  const [accessActive, setAccessActive] = useState(false);

  const [londonTime, setLondonTime] = useState("");
  const [newYorkTime, setNewYorkTime] = useState("");
  const [hongKongTime, setHongKongTime] = useState("");

  useEffect(() => {
    const loadUser = async () => {
      try {
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

        const { data: planData } = await supabase
          .from("user_plans")
          .select("plan, access_active")
          .eq("email", user.email)
          .single();

        let currentPlan = String(planData?.plan || "basic") as PlanType;
        const isActive = planData?.access_active === true;

        if ((currentPlan === "pro" || currentPlan === "unlimited") && !isActive) {
          currentPlan = "basic";
        }

        setPlan(currentPlan);
        setAccessActive(isActive);
      } catch (error) {
        console.error("HOME LOAD ERROR:", error);
        setPlan("guest");
      }
    };

    loadUser();
  }, [supabase]);

  useEffect(() => {
    const updateTimes = () => {
      const timeOptions: Intl.DateTimeFormatOptions = {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      };

      setLondonTime(
        new Intl.DateTimeFormat("en-GB", {
          ...timeOptions,
          timeZone: "Europe/London",
        }).format(new Date())
      );

      setNewYorkTime(
        new Intl.DateTimeFormat("en-US", {
          ...timeOptions,
          timeZone: "America/New_York",
        }).format(new Date())
      );

      setHongKongTime(
        new Intl.DateTimeFormat("en-HK", {
          ...timeOptions,
          timeZone: "Asia/Hong_Kong",
        }).format(new Date())
      );
    };

    updateTimes();
    const interval = setInterval(updateTimes, 1000);

    return () => clearInterval(interval);
  }, []);

  const getPlanLabel = () => {
    if (plan === "loading") return "Зареждане...";
    if (plan === "guest") return "Гост";
    return plan.toUpperCase();
  };

  const getPlanBadgeStyle = () => {
    if (plan === "unlimited") return styles.planBadgeUnlimited;
    if (plan === "pro") return styles.planBadgePro;
    if (plan === "basic") return styles.planBadgeBasic;
    return styles.planBadgeGuest;
  };

  return (
    <main style={styles.page}>
      <div style={styles.overlay} />

      <div style={styles.wrapper}>
        <div style={styles.topBar}>
          <div style={styles.brandBlock}>
            <div style={styles.logoBox}>FA</div>

            <div>
              <div style={styles.brandName}>Fundamental Analysis Platform</div>
              <div style={styles.brandSubtext}>
                Акции, криптовалути, premium анализи и професионални пазарни инструменти
              </div>
            </div>
          </div>

          <div style={styles.topBarRight}>
            <div style={{ ...styles.planBadgeBase, ...getPlanBadgeStyle() }}>
              <span>{getPlanLabel()}</span>
              {accessActive && (plan === "pro" || plan === "unlimited") ? (
                <span style={styles.planBadgeDot} />
              ) : null}
            </div>

            <div style={styles.topButtons}>
              <button
                style={styles.secondaryButton}
                onClick={() => {
                  window.location.href = "/pricing";
                }}
              >
                Планове
              </button>

              <button
                style={styles.contactButton}
                onClick={() => {
                  window.location.href = "/contact";
                }}
              >
                Контакт
              </button>

              {isLoggedIn ? (
                <>
                  <button
                    style={styles.primaryButton}
                    onClick={() => {
                      window.location.href = "/dashboard";
                    }}
                  >
                    Dashboard
                  </button>

                  <button
                    style={styles.darkButton}
                    onClick={async () => {
                      await supabase.auth.signOut();
                      window.location.href = "/";
                    }}
                  >
                    Изход
                  </button>
                </>
              ) : (
                <button
                  style={styles.primaryButton}
                  onClick={() => {
                    window.location.href = "/auth";
                  }}
                >
                  Вход
                </button>
              )}
            </div>
          </div>
        </div>

        <div style={styles.clocksWrap}>
          <ClockItem label="London" time={londonTime} />
          <ClockItem label="New York" time={newYorkTime} />
          <ClockItem label="Hong Kong" time={hongKongTime} />
        </div>

        <div style={styles.grid}>
          <div style={styles.mainColumn}>
            <section style={styles.heroCard}>
              <div style={styles.heroBadge}>PRO MARKET TOOLS</div>

              <h1 style={styles.heroTitle}>
                Професионална платформа за фундаментален анализ на акции и криптовалути
              </h1>

              <p style={styles.heroText}>
                Анализирай компании и крипто активи с реални данни, графики, AI
                обобщения, Alerts, Watchlist и premium RSI инструменти. Всичко е
                структурирано така, че да виждаш повече информация на един екран и
                да взимаш решения по-бързо.
              </p>

              <div style={styles.heroActions}>
                <button
                  style={styles.primaryButtonLarge}
                  onClick={() => {
                    window.location.href = isLoggedIn ? "/dashboard" : "/auth";
                  }}
                >
                  {isLoggedIn ? "Отвори Dashboard" : "Започни сега"}
                </button>

                <button
                  style={styles.secondaryButtonLarge}
                  onClick={() => {
                    window.location.href = "/pricing";
                  }}
                >
                  Виж плановете
                </button>

                <button
                  style={styles.contactButtonLarge}
                  onClick={() => {
                    window.location.href = "/contact";
                  }}
                >
                  Свържи се с нас
                </button>
              </div>

              <div style={styles.heroMetricsGrid}>
                <div style={styles.heroMetricCard}>
                  <div style={styles.heroMetricLabel}>Активи</div>
                  <div style={styles.heroMetricValue}>Акции + Крипто</div>
                </div>

                <div style={styles.heroMetricCard}>
                  <div style={styles.heroMetricLabel}>Premium</div>
                  <div style={styles.heroMetricValue}>Alerts + RSI</div>
                </div>

                <div style={styles.heroMetricCard}>
                  <div style={styles.heroMetricLabel}>Графики</div>
                  <div style={styles.heroMetricValue}>Stock + Crypto</div>
                </div>
              </div>
            </section>

            <section style={styles.sectionCard}>
              <div style={styles.sectionHeader}>
                <h2 style={styles.sectionTitle}>Какво получаваш</h2>
              </div>

              <div style={styles.featuresGrid}>
                <div style={styles.featureCard}>
                  <div style={styles.featureTitle}>Фундаментален анализ</div>
                  <div style={styles.featureText}>
                    Revenue, EPS, Margin, Debt/Equity, Market Cap, Real Value и
                    още ключови показатели за по-добра оценка на компанията.
                  </div>
                </div>

                <div style={styles.featureCard}>
                  <div style={styles.featureTitle}>Крипто анализ</div>
                  <div style={styles.featureText}>
                    Анализирай водещи криптовалути, следи пазарна капитализация,
                    графики, движения и premium RSI данни по различни таймфреймове.
                  </div>
                </div>

                <div style={styles.featureCard}>
                  <div style={styles.featureTitle}>AI обобщения</div>
                  <div style={styles.featureText}>
                    Ясно резюме, bull case, bear case и fair value view, за да
                    получаваш по-структуриран и бърз поглед върху актива.
                  </div>
                </div>

                <div style={styles.featureCard}>
                  <div style={styles.featureTitle}>Alerts</div>
                  <div style={styles.featureText}>
                    Създавай ценови известия за акции и криптовалути и следи кога
                    пазарът достига важни нива.
                  </div>
                </div>

                <div style={styles.featureCard}>
                  <div style={styles.featureTitle}>Watchlist</div>
                  <div style={styles.featureText}>
                    Запазвай активи в любими и отваряй анализите им с един клик,
                    без да въвеждаш тикера всеки път наново.
                  </div>
                </div>

                <div style={styles.featureCard}>
                  <div style={styles.featureTitle}>Premium RSI Stats</div>
                  <div style={styles.featureText}>
                    Heatmap и RSI Table с реални данни и няколко таймфрейма за
                    по-добър контрол върху моментума на пазара.
                  </div>
                </div>
              </div>
            </section>

            <section style={styles.sectionCard}>
              <div style={styles.sectionHeader}>
                <h2 style={styles.sectionTitle}>За кого е платформата</h2>
              </div>

              <div style={styles.audienceGrid}>
                <div style={styles.audienceCard}>
                  <div style={styles.audienceTitle}>Дългосрочни инвеститори</div>
                  <div style={styles.audienceText}>
                    Подходяща за хора, които искат да сравняват бизнес качество,
                    оценка, растеж и капиталова ефективност.
                  </div>
                </div>

                <div style={styles.audienceCard}>
                  <div style={styles.audienceTitle}>Активни трейдъри</div>
                  <div style={styles.audienceText}>
                    Alerts, Watchlist, графики и RSI статистики дават по-бърз
                    поглед върху краткосрочните възможности.
                  </div>
                </div>

                <div style={styles.audienceCard}>
                  <div style={styles.audienceTitle}>Потребители на Premium план</div>
                  <div style={styles.audienceText}>
                    За тези, които искат повече пазарни инструменти, по-бърз достъп
                    до данни и по-професионално работно пространство.
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div style={styles.sidebar}>
            <div style={styles.sideCard}>
              <h3 style={styles.sideTitle}>Текущ статус</h3>

              <div style={styles.planRow}>
                <span style={styles.planKey}>Потребител:</span>
                <span style={styles.planValue}>
                  {isLoggedIn ? email : "Не си влязъл"}
                </span>
              </div>

              <div style={styles.planRow}>
                <span style={styles.planKey}>План:</span>
                <span style={styles.planValue}>{getPlanLabel()}</span>
              </div>

              <div style={styles.planRow}>
                <span style={styles.planKey}>Premium достъп:</span>
                <span style={styles.planValue}>
                  {accessActive ? "Активен" : "Неактивен"}
                </span>
              </div>

              <button
                style={styles.upgradeButton}
                onClick={() => {
                  window.location.href = "/pricing";
                }}
              >
                Upgrade
              </button>
            </div>

            <div style={styles.sideCard}>
              <h3 style={styles.sideTitle}>Планове</h3>

              <div style={styles.planMiniCard}>
                <div style={styles.planMiniTitle}>Basic</div>
                <div style={styles.planMiniText}>
                  3 анализа на ден, базов достъп, без Alerts и RSI Premium.
                </div>
              </div>

              <div style={styles.planMiniCard}>
                <div style={styles.planMiniTitle}>Pro</div>
                <div style={styles.planMiniText}>
                  20 анализа на ден, AI анализ, Alerts, графики и достъп до RSI Premium.
                </div>
              </div>

              <div style={styles.planMiniCard}>
                <div style={styles.planMiniTitle}>Unlimited</div>
                <div style={styles.planMiniText}>
                  Неограничени анализи, всички функции, premium инструменти и по-пълен достъп.
                </div>
              </div>
            </div>

            <div style={styles.sideCard}>
              <h3 style={styles.sideTitle}>Бърз достъп</h3>

              <div style={styles.quickButtons}>
                <button
                  style={styles.quickButton}
                  onClick={() => {
                    window.location.href = "/dashboard";
                  }}
                >
                  Dashboard
                </button>

                <button
                  style={styles.quickButton}
                  onClick={() => {
                    window.location.href = "/dashboard/rsi";
                  }}
                >
                  RSI Stats
                </button>

                <button
                  style={styles.quickButton}
                  onClick={() => {
                    window.location.href = "/pricing";
                  }}
                >
                  Pricing
                </button>

                <button
                  style={styles.quickButton}
                  onClick={() => {
                    window.location.href = "/contact";
                  }}
                >
                  Контакт
                </button>
              </div>
            </div>

            <div style={styles.sideCard}>
              <h3 style={styles.sideTitle}>Защо е полезен сайтът</h3>
              <p style={styles.sideText}>
                Вместо да гледаш данни от няколко различни места, тук получаваш
                концентриран анализ, графики, alerts и premium статистики в едно
                работно пространство.
              </p>
            </div>
          </div>
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
    maxWidth: "1360px",
    margin: "0 auto",
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
    marginBottom: "20px",
    flexWrap: "wrap",
  },
  brandBlock: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    flexWrap: "wrap",
  },
  logoBox: {
    width: "52px",
    height: "52px",
    borderRadius: "14px",
    background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    fontWeight: 800,
    boxShadow: "0 10px 24px rgba(37,99,235,0.28)",
  },
  brandName: {
    color: "white",
    fontSize: "20px",
    fontWeight: 800,
    marginBottom: "4px",
  },
  brandSubtext: {
    color: "#94a3b8",
    fontSize: "14px",
    lineHeight: 1.5,
  },
  topBarRight: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    flexWrap: "wrap",
  },
  topButtons: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  clocksWrap: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "12px",
    marginBottom: "20px",
  },
  clockCard: {
    background: "rgba(10, 20, 40, 0.92)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "16px",
    padding: "14px 16px",
    boxShadow: "0 14px 28px rgba(0,0,0,0.22)",
  },
  clockLabel: {
    color: "#94a3b8",
    fontSize: "13px",
    marginBottom: "6px",
  },
  clockTime: {
    color: "white",
    fontSize: "24px",
    fontWeight: 800,
    letterSpacing: "0.6px",
  },
  planBadgeBase: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    borderRadius: "999px",
    padding: "10px 14px",
    fontSize: "12px",
    fontWeight: 800,
    letterSpacing: "0.4px",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  planBadgeGuest: {
    background: "rgba(51,65,85,0.42)",
    color: "#cbd5e1",
  },
  planBadgeBasic: {
    background: "rgba(51,65,85,0.5)",
    color: "#e2e8f0",
  },
  planBadgePro: {
    background: "rgba(37,99,235,0.18)",
    color: "#bfdbfe",
    border: "1px solid rgba(59,130,246,0.35)",
  },
  planBadgeUnlimited: {
    background: "rgba(168,85,247,0.18)",
    color: "#e9d5ff",
    border: "1px solid rgba(168,85,247,0.35)",
  },
  planBadgeDot: {
    width: "8px",
    height: "8px",
    borderRadius: "999px",
    background: "#22c55e",
    boxShadow: "0 0 0 4px rgba(34,197,94,0.15)",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "3fr 1fr",
    gap: "20px",
    alignItems: "start",
  },
  mainColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  sidebar: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  heroCard: {
    background: "rgba(10, 20, 40, 0.94)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "24px",
    padding: "28px",
    boxShadow: "0 18px 40px rgba(0,0,0,0.35)",
  },
  heroBadge: {
    display: "inline-block",
    background: "rgba(37,99,235,0.18)",
    color: "#93c5fd",
    border: "1px solid rgba(59,130,246,0.35)",
    borderRadius: "999px",
    padding: "6px 12px",
    fontSize: "12px",
    fontWeight: 800,
    marginBottom: "16px",
  },
  heroTitle: {
    color: "white",
    fontSize: "42px",
    lineHeight: 1.15,
    fontWeight: 800,
    marginBottom: "16px",
  },
  heroText: {
    color: "#cbd5e1",
    fontSize: "17px",
    lineHeight: 1.8,
    maxWidth: "980px",
    marginBottom: "22px",
  },
  heroActions: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    marginBottom: "22px",
  },
  primaryButton: {
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "12px",
    padding: "12px 18px",
    fontSize: "15px",
    fontWeight: 700,
    cursor: "pointer",
  },
  contactButton: {
    background: "rgba(14, 165, 233, 0.16)",
    color: "#bae6fd",
    border: "1px solid rgba(14, 165, 233, 0.34)",
    borderRadius: "12px",
    padding: "12px 18px",
    fontSize: "15px",
    fontWeight: 700,
    cursor: "pointer",
  },
  primaryButtonLarge: {
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "14px",
    padding: "16px 22px",
    fontSize: "16px",
    fontWeight: 800,
    cursor: "pointer",
  },
  contactButtonLarge: {
    background: "rgba(14, 165, 233, 0.16)",
    color: "#bae6fd",
    border: "1px solid rgba(14, 165, 233, 0.34)",
    borderRadius: "14px",
    padding: "16px 22px",
    fontSize: "16px",
    fontWeight: 800,
    cursor: "pointer",
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
  secondaryButtonLarge: {
    background: "rgba(255,255,255,0.04)",
    color: "white",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "14px",
    padding: "16px 22px",
    fontSize: "16px",
    fontWeight: 800,
    cursor: "pointer",
  },
  darkButton: {
    background: "#111827",
    color: "white",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "12px",
    padding: "12px 18px",
    fontSize: "15px",
    fontWeight: 700,
    cursor: "pointer",
  },
  heroMetricsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "10px",
  },
  heroMetricCard: {
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "14px",
    padding: "14px 16px",
  },
  heroMetricLabel: {
    color: "#94a3b8",
    fontSize: "12px",
    marginBottom: "6px",
  },
  heroMetricValue: {
    color: "white",
    fontSize: "16px",
    fontWeight: 800,
  },
  sectionCard: {
    background: "rgba(10, 20, 40, 0.94)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "20px",
    padding: "22px",
    boxShadow: "0 18px 40px rgba(0,0,0,0.35)",
  },
  sectionHeader: {
    marginBottom: "16px",
  },
  sectionTitle: {
    color: "white",
    fontSize: "24px",
    fontWeight: 800,
    margin: 0,
  },
  featuresGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "12px",
  },
  featureCard: {
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "14px",
    padding: "16px",
  },
  featureTitle: {
    color: "white",
    fontSize: "16px",
    fontWeight: 800,
    marginBottom: "8px",
  },
  featureText: {
    color: "#cbd5e1",
    fontSize: "14px",
    lineHeight: 1.7,
  },
  audienceGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "12px",
  },
  audienceCard: {
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "14px",
    padding: "16px",
  },
  audienceTitle: {
    color: "white",
    fontSize: "16px",
    fontWeight: 800,
    marginBottom: "8px",
  },
  audienceText: {
    color: "#cbd5e1",
    fontSize: "14px",
    lineHeight: 1.7,
  },
  sideCard: {
    background: "rgba(10, 20, 40, 0.94)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "20px",
    padding: "20px",
    boxShadow: "0 18px 40px rgba(0,0,0,0.35)",
  },
  sideTitle: {
    color: "white",
    fontSize: "22px",
    fontWeight: 800,
    marginBottom: "14px",
  },
  sideText: {
    color: "#cbd5e1",
    fontSize: "14px",
    lineHeight: 1.8,
    margin: 0,
  },
  planRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    padding: "10px 0",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  planKey: {
    color: "#94a3b8",
    fontSize: "14px",
  },
  planValue: {
    color: "white",
    fontSize: "14px",
    fontWeight: 700,
    textAlign: "right",
    wordBreak: "break-word",
  },
  upgradeButton: {
    marginTop: "16px",
    width: "100%",
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "12px",
    padding: "14px 18px",
    fontSize: "16px",
    fontWeight: 700,
    cursor: "pointer",
  },
  planMiniCard: {
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "14px",
    padding: "14px",
    marginBottom: "10px",
  },
  planMiniTitle: {
    color: "white",
    fontSize: "15px",
    fontWeight: 800,
    marginBottom: "6px",
  },
  planMiniText: {
    color: "#cbd5e1",
    fontSize: "13px",
    lineHeight: 1.6,
  },
  quickButtons: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  quickButton: {
    width: "100%",
    background: "rgba(255,255,255,0.04)",
    color: "white",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "12px",
    padding: "12px 14px",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
  },
};