"use client";

import { useEffect, useState } from "react";
import { createClient } from "../lib/supabase/client";

type PlanType = "basic" | "pro" | "unlimited" | "loading" | "guest";

type ClockItemProps = {
  label: string;
  time: string;
};

type NewsItem = {
  title: string;
  description: string;
  source: string;
  url: string;
  tag: string;
};

const MARKET_NEWS: NewsItem[] = [
  {
    title: "Global Market Coverage",
    description:
      "Track equities, bonds, central banks, inflation data and global risk sentiment.",
    source: "Reuters Markets",
    url: "https://www.reuters.com/markets/",
    tag: "Markets",
  },
  {
    title: "Stock Market News",
    description:
      "Follow major movers, earnings reactions, sector rotation and Wall Street updates.",
    source: "Yahoo Finance",
    url: "https://finance.yahoo.com/topic/stock-market-news/",
    tag: "Stocks",
  },
  {
    title: "Earnings Calendar",
    description:
      "Check upcoming earnings reports, EPS expectations, revenue data and guidance risk.",
    source: "Investing.com",
    url: "https://www.investing.com/earnings-calendar/",
    tag: "Earnings",
  },
];

const COMPANY_NEWS: NewsItem[] = [
  {
    title: "AI and Mega-Cap Stocks",
    description:
      "Follow Nvidia, Microsoft, Apple, Tesla, Amazon and other global market leaders.",
    source: "MarketWatch",
    url: "https://www.marketwatch.com/markets",
    tag: "Companies",
  },
  {
    title: "Technology Sector Updates",
    description:
      "Monitor product launches, AI investment cycles, cloud demand and margin trends.",
    source: "CNBC Technology",
    url: "https://www.cnbc.com/technology/",
    tag: "Technology",
  },
  {
    title: "Business and Financial News",
    description:
      "Read corporate news, macro developments and global investor sentiment updates.",
    source: "Financial Times",
    url: "https://www.ft.com/markets",
    tag: "Finance",
  },
];

const CRYPTO_NEWS: NewsItem[] = [
  {
    title: "Bitcoin and Ethereum News",
    description:
      "Follow ETF flows, institutional demand, regulation and crypto market structure.",
    source: "CoinDesk",
    url: "https://www.coindesk.com/",
    tag: "Crypto",
  },
  {
    title: "Crypto Market Prices",
    description:
      "Track digital asset prices, market cap, sector rotation and crypto liquidity.",
    source: "CoinMarketCap",
    url: "https://coinmarketcap.com/",
    tag: "Prices",
  },
  {
    title: "Crypto Regulation",
    description:
      "Monitor regulatory developments, exchange news and institutional adoption trends.",
    source: "The Block",
    url: "https://www.theblock.co/",
    tag: "Regulation",
  },
];

function ClockItem({ label, time }: ClockItemProps) {
  return (
    <div style={styles.clockCard}>
      <div style={styles.clockLabel}>{label}</div>
      <div style={styles.clockTime}>{time}</div>
    </div>
  );
}

function NewsCard({ item }: { item: NewsItem }) {
  return (
    <a href={item.url} target="_blank" rel="noreferrer" style={styles.newsCard}>
      <div style={styles.newsTopRow}>
        <span style={styles.newsTag}>{item.tag}</span>
        <span style={styles.newsSource}>{item.source}</span>
      </div>

      <div style={styles.newsTitle}>{item.title}</div>
      <div style={styles.newsDescription}>{item.description}</div>
      <div style={styles.newsLink}>Open source →</div>
    </a>
  );
}

function NewsSection({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle: string;
  items: NewsItem[];
}) {
  return (
    <section style={styles.sectionCard}>
      <div style={styles.sectionHeader}>
        <div>
          <h2 style={styles.sectionTitle}>{title}</h2>
          <p style={styles.sectionSubtitle}>{subtitle}</p>
        </div>
      </div>

      <div style={styles.newsGrid}>
        {items.map((item) => (
          <NewsCard key={`${title}-${item.title}`} item={item} />
        ))}
      </div>
    </section>
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
    if (plan === "loading") return "LOADING";
    if (plan === "guest") return "GUEST";
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
                Stocks, crypto, premium analysis and professional market tools
              </div>
            </div>
          </div>

          <div style={styles.topBarRight}>
            <div style={styles.topButtons}>
              <button
                style={styles.secondaryButton}
                onClick={() => {
                  window.location.href = "/pricing";
                }}
              >
                Pricing
              </button>

              <button
                style={styles.contactButton}
                onClick={() => {
                  window.location.href = "/contact";
                }}
              >
                Contact
              </button>

              <button
                style={styles.newsButton}
                onClick={() => {
                  document.getElementById("market-news")?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                }}
              >
                News
              </button>

              <button
                style={styles.educationButton}
                onClick={() => {
                  document.getElementById("education")?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                }}
              >
                Education
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
                    Logout
                  </button>
                </>
              ) : (
                <button
                  style={styles.primaryButton}
                  onClick={() => {
                    window.location.href = "/auth";
                  }}
                >
                  Login
                </button>
              )}
            </div>

            <div style={{ ...styles.planBadgeBase, ...getPlanBadgeStyle() }}>
              <span>{getPlanLabel()}</span>
              {accessActive && (plan === "pro" || plan === "unlimited") ? (
                <span style={styles.planBadgeDot} />
              ) : null}
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
              <div style={styles.heroContent}>
                <div style={styles.heroBadge}>PRO MARKET TOOLS</div>

                <h1 style={styles.heroTitle}>
                  Professional platform for stock and crypto analysis
                </h1>

                <p style={styles.heroText}>
                  Analyze stocks and crypto assets using real-time data, financial
                  metrics, AI insights, alerts, watchlists and advanced market tools.
                  Everything is structured to help investors make faster and better
                  decisions.
                </p>

                <div style={styles.heroMetricsGrid}>
                  <div style={styles.heroMetricCard}>
                    <div style={styles.heroMetricLabel}>Assets</div>
                    <div style={styles.heroMetricValue}>Stocks + Crypto</div>
                  </div>

                  <div style={styles.heroMetricCard}>
                    <div style={styles.heroMetricLabel}>Premium</div>
                    <div style={styles.heroMetricValue}>Alerts + RSI</div>
                  </div>

                  <div style={styles.heroMetricCard}>
                    <div style={styles.heroMetricLabel}>Charts</div>
                    <div style={styles.heroMetricValue}>Stock + Crypto</div>
                  </div>
                </div>
              </div>
            </section>

            <div id="market-news">
              <NewsSection
                title="Market News"
                subtitle="Global macro, indexes, rates, bonds and market sentiment."
                items={MARKET_NEWS}
              />
            </div>

            <NewsSection
              title="Company News"
              subtitle="Major companies, earnings, AI leaders and sector rotation."
              items={COMPANY_NEWS}
            />

            <NewsSection
              title="Crypto News"
              subtitle="Bitcoin, Ethereum, ETF flows, regulation and digital asset market structure."
              items={CRYPTO_NEWS}
            />

            <section id="education" style={styles.sectionCard}>
              <div style={styles.sectionHeader}>
                <div>
                  <h2 style={styles.sectionTitle}>Education</h2>
                  <p style={styles.sectionSubtitle}>
                    Core concepts for investors who want to analyze markets more professionally.
                  </p>
                </div>
              </div>

              <div style={styles.featuresGrid}>
                <div style={styles.featureCard}>
                  <div style={styles.featureTitle}>Fundamental Analysis</div>
                  <div style={styles.featureText}>
                    Understand revenue, EPS, margins, debt, market cap, cash flow and
                    valuation before making investment decisions.
                  </div>
                </div>

                <div style={styles.featureCard}>
                  <div style={styles.featureTitle}>Crypto Analysis</div>
                  <div style={styles.featureText}>
                    Analyze leading crypto assets through market cap, liquidity,
                    volatility, network activity and market structure.
                  </div>
                </div>

                <div style={styles.featureCard}>
                  <div style={styles.featureTitle}>AI Insights</div>
                  <div style={styles.featureText}>
                    Use structured summaries, bull cases, bear cases and fair value
                    views to understand an asset faster.
                  </div>
                </div>

                <div style={styles.featureCard}>
                  <div style={styles.featureTitle}>Alerts</div>
                  <div style={styles.featureText}>
                    Create price alerts for stocks and crypto so important levels are
                    easier to monitor.
                  </div>
                </div>

                <div style={styles.featureCard}>
                  <div style={styles.featureTitle}>Watchlist</div>
                  <div style={styles.featureText}>
                    Save assets and open their analysis with one click instead of
                    searching for tickers every time.
                  </div>
                </div>

                <div style={styles.featureCard}>
                  <div style={styles.featureTitle}>Premium RSI Stats</div>
                  <div style={styles.featureText}>
                    Use RSI heatmaps and tables across multiple timeframes to monitor
                    momentum and market extremes.
                  </div>
                </div>
              </div>
            </section>

            <section style={styles.sectionCard}>
              <div style={styles.sectionHeader}>
                <h2 style={styles.sectionTitle}>Who is this platform for?</h2>
              </div>

              <div style={styles.audienceGrid}>
                <div style={styles.audienceCard}>
                  <div style={styles.audienceTitle}>Long-term Investors</div>
                  <div style={styles.audienceText}>
                    For users who compare business quality, valuation, growth and
                    capital efficiency.
                  </div>
                </div>

                <div style={styles.audienceCard}>
                  <div style={styles.audienceTitle}>Active Traders</div>
                  <div style={styles.audienceText}>
                    Alerts, watchlists, charts and RSI statistics help monitor
                    short-term opportunities.
                  </div>
                </div>

                <div style={styles.audienceCard}>
                  <div style={styles.audienceTitle}>Premium Users</div>
                  <div style={styles.audienceText}>
                    For users who want more market tools, faster access to data and a
                    professional investment workspace.
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div style={styles.sidebar}>
            <div style={styles.sideCard}>
              <h3 style={styles.sideTitle}>Current Status</h3>

              <div style={styles.planRow}>
                <span style={styles.planKey}>User:</span>
                <span style={styles.planValue}>
                  {isLoggedIn ? email : "Not logged in"}
                </span>
              </div>

              <div style={styles.planRow}>
                <span style={styles.planKey}>Plan:</span>
                <span style={styles.planValue}>{getPlanLabel()}</span>
              </div>

              <div style={styles.planRow}>
                <span style={styles.planKey}>Premium access:</span>
                <span style={styles.planValue}>
                  {accessActive ? "Active" : "Inactive"}
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
              <h3 style={styles.sideTitle}>Plans</h3>

              <div style={styles.planMiniCard}>
                <div style={styles.planMiniTitle}>Basic</div>
                <div style={styles.planMiniText}>
                  3 analyses per day, basic access, no Alerts and no RSI Premium.
                </div>
              </div>

              <div style={styles.planMiniCard}>
                <div style={styles.planMiniTitle}>Pro</div>
                <div style={styles.planMiniText}>
                  20 analyses per day, AI analysis, alerts, charts and RSI Premium access.
                </div>
              </div>

              <div style={styles.planMiniCard}>
                <div style={styles.planMiniTitle}>Unlimited</div>
                <div style={styles.planMiniText}>
                  Unlimited analysis, all features, premium tools and deeper access.
                </div>
              </div>
            </div>

            <div style={styles.sideCard}>
              <h3 style={styles.sideTitle}>Quick Access</h3>

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
                  Contact
                </button>
              </div>
            </div>

            <div style={styles.sideCard}>
              <h3 style={styles.sideTitle}>Why this platform matters</h3>
              <p style={styles.sideText}>
                Instead of checking multiple websites, users get structured analysis,
                charts, alerts, news sources and premium statistics in one workspace.
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
    padding: "26px 20px 42px",
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
    marginBottom: "14px",
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
    marginLeft: "auto",
  },
  topButtons: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    alignItems: "center",
  },
  clocksWrap: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(120px, 170px))",
    gap: "10px",
    marginBottom: "14px",
  },
  clockCard: {
    background: "rgba(10, 20, 40, 0.82)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "12px",
    padding: "10px 12px",
    boxShadow: "0 10px 22px rgba(0,0,0,0.18)",
  },
  clockLabel: {
    color: "#94a3b8",
    fontSize: "11px",
    marginBottom: "4px",
    fontWeight: 400,
  },
  clockTime: {
    color: "white",
    fontSize: "20px",
    fontWeight: 400,
    letterSpacing: "1.4px",
    fontFamily:
      "'Courier New', 'Consolas', 'SFMono-Regular', 'Roboto Mono', monospace",
    textShadow: "0 0 10px rgba(34,211,238,0.22)",
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
    order: 10,
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
    gap: "18px",
  },
  sidebar: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  heroCard: {
    position: "relative",
    overflow: "hidden",
    backgroundImage:
      "linear-gradient(90deg, rgba(6,18,40,0.92), rgba(6,18,40,0.78), rgba(6,18,40,0.48)), url('/images/ai-trading-bg.jpg')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "24px",
    padding: "28px",
    boxShadow: "0 18px 40px rgba(0,0,0,0.35)",
  },
  heroContent: {
    position: "relative",
    zIndex: 1,
    maxWidth: "780px",
    backdropFilter: "blur(1px)",
  },
  heroBadge: {
    display: "inline-block",
    background: "rgba(37,99,235,0.18)",
    color: "#93c5fd",
    border: "1px solid rgba(59,130,246,0.35)",
    borderRadius: "999px",
    padding: "6px 12px",
    fontSize: "12px",
    fontWeight: 700,
    marginBottom: "16px",
  },
  heroTitle: {
    color: "white",
    fontSize: "34px",
    lineHeight: 1.22,
    fontWeight: 500,
    marginBottom: "14px",
    maxWidth: "760px",
  },
  heroText: {
    color: "#cbd5e1",
    fontSize: "15px",
    lineHeight: 1.8,
    maxWidth: "760px",
    marginBottom: "20px",
    fontWeight: 400,
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
  newsButton: {
    background: "rgba(245,158,11,0.16)",
    color: "#fde68a",
    border: "1px solid rgba(245,158,11,0.34)",
    borderRadius: "12px",
    padding: "12px 18px",
    fontSize: "15px",
    fontWeight: 700,
    cursor: "pointer",
  },
  educationButton: {
    background: "rgba(168,85,247,0.16)",
    color: "#e9d5ff",
    border: "1px solid rgba(168,85,247,0.34)",
    borderRadius: "12px",
    padding: "12px 18px",
    fontSize: "15px",
    fontWeight: 700,
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
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.10)",
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
    fontWeight: 700,
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
  sectionSubtitle: {
    color: "#94a3b8",
    fontSize: "14px",
    lineHeight: 1.6,
    margin: "8px 0 0",
  },
  newsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "12px",
  },
  newsCard: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    background: "rgba(255,255,255,0.025)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "14px",
    padding: "16px",
    textDecoration: "none",
    minHeight: "168px",
  },
  newsTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
  },
  newsTag: {
    background: "rgba(37,99,235,0.16)",
    color: "#bfdbfe",
    border: "1px solid rgba(59,130,246,0.28)",
    borderRadius: "999px",
    padding: "4px 8px",
    fontSize: "10px",
    fontWeight: 800,
  },
  newsSource: {
    color: "#94a3b8",
    fontSize: "11px",
    fontWeight: 700,
  },
  newsTitle: {
    color: "white",
    fontSize: "16px",
    fontWeight: 800,
    lineHeight: 1.35,
  },
  newsDescription: {
    color: "#cbd5e1",
    fontSize: "13px",
    lineHeight: 1.65,
    flex: 1,
  },
  newsLink: {
    color: "#93c5fd",
    fontSize: "13px",
    fontWeight: 800,
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
