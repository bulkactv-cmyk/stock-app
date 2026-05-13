"use client";

import React, { useEffect, useMemo, useState } from "react";
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

type MarketTickerItem = {
  label: string;
  value: string;
  change: string;
  positive?: boolean;
  points: number[];
};

type LiveMarketSymbol = {
  label: string;
  symbol: string;
};

type YahooQuoteResult = {
  meta?: {
    regularMarketPrice?: number;
    previousClose?: number;
    chartPreviousClose?: number;
  };
  timestamp?: number[];
  indicators?: {
    quote?: Array<{
      close?: Array<number | null>;
    }>;
  };
};

type YahooChartResponse = {
  chart?: {
    result?: YahooQuoteResult[];
    error?: unknown;
  };
};

const MARKET_REFRESH_MS = 30000;

const LIVE_MARKET_SYMBOLS: LiveMarketSymbol[] = [
  { label: "S&P 500", symbol: "^GSPC" },
  { label: "Dow 30", symbol: "^DJI" },
  { label: "Nasdaq", symbol: "^IXIC" },
  { label: "Gold", symbol: "GC=F" },
  { label: "Silver", symbol: "SI=F" },
];

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

const FALLBACK_TICKERS: MarketTickerItem[] = [
  {
    label: "S&P 500",
    value: "Loading...",
    change: "Updating...",
    positive: false,
    points: [70, 68, 66, 65, 61, 58, 56, 54, 57, 52, 49, 46, 44, 42, 45, 41],
  },
  {
    label: "Dow 30",
    value: "Loading...",
    change: "Updating...",
    positive: false,
    points: [62, 61, 60, 61, 63, 66, 68, 70, 66, 67, 69, 71, 70, 71, 72, 73],
  },
  {
    label: "Nasdaq",
    value: "Loading...",
    change: "Updating...",
    positive: false,
    points: [78, 76, 73, 70, 67, 64, 61, 59, 57, 54, 52, 48, 45, 43, 40, 38],
  },
  {
    label: "Gold",
    value: "Loading...",
    change: "Updating...",
    positive: false,
    points: [66, 65, 63, 64, 61, 58, 60, 57, 54, 55, 52, 49, 46, 48, 44, 42],
  },
  {
    label: "Silver",
    value: "Loading...",
    change: "Updating...",
    positive: true,
    points: [38, 40, 42, 44, 47, 49, 53, 55, 57, 60, 58, 61, 64, 66, 68, 72],
  },
];

function formatMarketValue(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";

  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatMarketChangePercent(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";

  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

function normalizeSparklinePoints(values: number[]) {
  const cleanValues = values.filter((value) => Number.isFinite(value));

  if (cleanValues.length >= 2) return cleanValues.slice(-18);

  return [40, 42, 41, 43, 44, 45, 44, 46, 47, 48, 47, 49, 50, 51, 50, 52];
}

async function fetchYahooTicker(item: LiveMarketSymbol): Promise<MarketTickerItem> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    item.symbol
  )}?range=1d&interval=5m&includePrePost=true&_=${Date.now()}`;

  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Yahoo market request failed: ${response.status}`);
  }

  const data = (await response.json()) as YahooChartResponse;
  const result = data.chart?.result?.[0];

  if (!result) {
    throw new Error("Yahoo market response missing result");
  }

  const closes =
    result.indicators?.quote?.[0]?.close
      ?.map((value) => (typeof value === "number" ? value : Number.NaN))
      .filter((value) => Number.isFinite(value)) ?? [];

  const lastClose =
    closes.length > 0
      ? closes[closes.length - 1]
      : result.meta?.regularMarketPrice ?? null;

  const previousClose =
    result.meta?.previousClose ?? result.meta?.chartPreviousClose ?? closes[0] ?? null;

  const changePercent =
    typeof lastClose === "number" &&
    typeof previousClose === "number" &&
    previousClose !== 0
      ? ((lastClose - previousClose) / previousClose) * 100
      : null;

  return {
    label: item.label,
    value: formatMarketValue(lastClose),
    change: formatMarketChangePercent(changePercent),
    positive: typeof changePercent === "number" ? changePercent >= 0 : false,
    points: normalizeSparklinePoints(closes),
  };
}

async function fetchInternalMarketTickers(): Promise<MarketTickerItem[]> {
  const response = await fetch(`/api/market-tickers?_=${Date.now()}`, {
    method: "GET",
    cache: "no-store",
    headers: {
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
  });

  if (!response.ok) {
    throw new Error(`Market API error: ${response.status}`);
  }

  const data = await response.json();

  if (!Array.isArray(data)) return [];

  return data
    .filter((item: unknown): item is Partial<MarketTickerItem> => {
      return typeof item === "object" && item !== null;
    })
    .map((item) => ({
      label: String(item.label ?? ""),
      value: String(item.value ?? "—"),
      change: String(item.change ?? "—"),
      positive: Boolean(item.positive),
      points:
        Array.isArray(item.points) && item.points.length > 1
          ? item.points.map((point) => Number(point) || 0)
          : [40, 42, 41, 43, 44, 45, 44, 46, 47, 48, 47, 49, 50, 51, 50, 52],
    }))
    .filter((item) => item.label);
}

async function fetchLiveMarketTickers(): Promise<MarketTickerItem[]> {
  try {
    const liveRows = await Promise.all(LIVE_MARKET_SYMBOLS.map(fetchYahooTicker));

    if (liveRows.length > 0) {
      return liveRows;
    }
  } catch (error) {
    console.error("YAHOO LIVE MARKET ERROR:", error);
  }

  const internalRows = await fetchInternalMarketTickers();

  if (internalRows.length > 0) {
    return internalRows;
  }

  throw new Error("No market ticker data available");
}

function ClockItem({ label, time }: ClockItemProps) {
  return (
    <div style={styles.clockCard}>
      <div style={styles.clockLabel}>{label}</div>
      <div style={styles.clockTimeWrap}>
        <div style={styles.clockTime}>{time}</div>
      </div>
    </div>
  );
}

function Sparkline({
  points,
  color,
  fillColor,
  idSeed,
}: {
  points: number[];
  color: string;
  fillColor: string;
  idSeed: string;
}) {
  const width = 88;
  const height = 32;
  const safePoints = points.length > 1 ? points : [1, 1];
  const max = Math.max(...safePoints);
  const min = Math.min(...safePoints);
  const range = max - min || 1;

  const line = safePoints
    .map((point, index) => {
      const x = (index / (safePoints.length - 1)) * width;
      const y = height - ((point - min) / range) * (height - 6) - 3;
      return `${x},${y}`;
    })
    .join(" ");

  const area = `0,${height} ${line} ${width},${height}`;
  const gradientId = `gradient-${idSeed
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")}-${safePoints.join("-")}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={88}
      height={32}
      aria-hidden="true"
      style={styles.sparklineSvg}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fillColor} stopOpacity="0.38" />
          <stop offset="100%" stopColor={fillColor} stopOpacity="0.03" />
        </linearGradient>
      </defs>

      <path d={`M ${area}`} fill={`url(#${gradientId})`} stroke="none" />

      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={line}
      />
    </svg>
  );
}

function MarketTickerCard({
  item,
  isLast,
}: {
  item: MarketTickerItem;
  isLast?: boolean;
}) {
  const lineColor = item.positive ? "#22c55e" : "#f87171";
  const fillColor = item.positive ? "#22c55e" : "#ef4444";

  return (
    <div
      style={{
        ...styles.tickerCard,
        ...(isLast ? styles.tickerCardLast : {}),
      }}
    >
      <div style={styles.tickerTextBlock}>
        <div style={styles.tickerLabel}>{item.label}</div>
        <div style={styles.tickerValue}>{item.value}</div>
        <div
          style={{
            ...styles.tickerChange,
            color: item.positive ? "#4ade80" : "#f87171",
          }}
        >
          {item.change}
        </div>
      </div>

      <div style={styles.tickerChartWrap}>
        <Sparkline
          points={item.points}
          color={lineColor}
          fillColor={fillColor}
          idSeed={item.label}
        />
      </div>
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
  const supabase = useMemo(() => createClient(), []);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState<PlanType>("loading");
  const [accessActive, setAccessActive] = useState(false);
  const [hoveredNav, setHoveredNav] = useState("");

  const [londonTime, setLondonTime] = useState("--:--:--");
  const [newYorkTime, setNewYorkTime] = useState("--:--:--");
  const [hongKongTime, setHongKongTime] = useState("--:--:--");

  const [marketTickers, setMarketTickers] =
    useState<MarketTickerItem[]>(FALLBACK_TICKERS);
  const [marketLastUpdated, setMarketLastUpdated] = useState("");
  const [marketRefreshing, setMarketRefreshing] = useState(false);

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

      const now = new Date();

      setLondonTime(
        new Intl.DateTimeFormat("en-GB", {
          ...timeOptions,
          timeZone: "Europe/London",
        }).format(now)
      );

      setNewYorkTime(
        new Intl.DateTimeFormat("en-US", {
          ...timeOptions,
          timeZone: "America/New_York",
        }).format(now)
      );

      setHongKongTime(
        new Intl.DateTimeFormat("en-HK", {
          ...timeOptions,
          timeZone: "Asia/Hong_Kong",
        }).format(now)
      );
    };

    updateTimes();
    const interval = setInterval(updateTimes, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let active = true;
    let interval: ReturnType<typeof setInterval> | null = null;

    const loadMarketTickers = async () => {
      try {
        setMarketRefreshing(true);

        const normalized = await fetchLiveMarketTickers();

        if (!active) return;

        if (normalized.length > 0) {
          setMarketTickers(normalized);
          setMarketLastUpdated(new Date().toLocaleTimeString());
        }
      } catch (error) {
        console.error("MARKET TICKER LOAD ERROR:", error);
      } finally {
        if (active) {
          setMarketRefreshing(false);
        }
      }
    };

    loadMarketTickers();
    interval = setInterval(loadMarketTickers, MARKET_REFRESH_MS);

    return () => {
      active = false;

      if (interval) {
        clearInterval(interval);
      }
    };
  }, []);

  const getPlanLabel = () => {
    if (plan === "loading") return "LOADING";
    if (plan === "guest") return "VISITOR";
    return plan.toUpperCase();
  };

  const getPlanBadgeStyle = () => {
    if (plan === "unlimited") return styles.planBadgeUnlimited;
    if (plan === "pro") return styles.planBadgePro;
    if (plan === "basic") return styles.planBadgeBasic;
    return styles.planBadgeGuest;
  };

  const getNavButtonStyle = (key: string) => ({
    ...styles.navButton,
    ...(hoveredNav === key ? styles.navButtonHover : {}),
  });

  return (
    <main style={styles.page}>
      <div style={styles.overlay} />

      <div style={styles.wrapper}>
        <header style={styles.topBar}>
          <div style={styles.brandBlock}>
            <button
              type="button"
              style={styles.logoBox}
              onClick={() => {
                window.location.href = "/";
              }}
              aria-label="Go to homepage"
            >
              <img
                src="/logo.png"
                alt="Fundamental Analysis Platform logo"
                style={styles.mainLogoImage}
              />
            </button>

            <div style={styles.brandTextBlock}>
              <div style={styles.brandLine}>
                <div style={styles.brandName}>Fundamental Analysis Platform</div>
                <span style={styles.proDeskBadge}>PRO DESK</span>
              </div>
              <div style={styles.brandSubtext}>
                Professional stock, crypto and AI analysis platform.
              </div>
            </div>
          </div>

          <div style={styles.topBarRight}>
            <div style={styles.topButtons}>
              <button
                style={getNavButtonStyle("pricing")}
                onMouseEnter={() => setHoveredNav("pricing")}
                onMouseLeave={() => setHoveredNav("")}
                onClick={() => {
                  window.location.href = "/pricing";
                }}
              >
                Pricing
              </button>

              <button
                style={getNavButtonStyle("contact")}
                onMouseEnter={() => setHoveredNav("contact")}
                onMouseLeave={() => setHoveredNav("")}
                onClick={() => {
                  window.location.href = "/contact";
                }}
              >
                Contact
              </button>

              <button
                style={getNavButtonStyle("news")}
                onMouseEnter={() => setHoveredNav("news")}
                onMouseLeave={() => setHoveredNav("")}
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
                style={getNavButtonStyle("education")}
                onMouseEnter={() => setHoveredNav("education")}
                onMouseLeave={() => setHoveredNav("")}
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
                    style={getNavButtonStyle("dashboard")}
                    onMouseEnter={() => setHoveredNav("dashboard")}
                    onMouseLeave={() => setHoveredNav("")}
                    onClick={() => {
                      window.location.href = "/dashboard";
                    }}
                  >
                    Dashboard
                  </button>

                  <button
                    style={getNavButtonStyle("logout")}
                    onMouseEnter={() => setHoveredNav("logout")}
                    onMouseLeave={() => setHoveredNav("")}
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
                  style={getNavButtonStyle("login")}
                  onMouseEnter={() => setHoveredNav("login")}
                  onMouseLeave={() => setHoveredNav("")}
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
        </header>

        <div style={styles.topInfoRow}>
          <div style={styles.clocksWrap}>
            <ClockItem label="London" time={londonTime} />
            <ClockItem label="New York" time={newYorkTime} />
            <ClockItem label="Hong Kong" time={hongKongTime} />
          </div>

          <div style={styles.marketTickerPanel}>
            <div style={styles.liveStatusPill}>
              <span
                style={{
                  ...styles.liveDot,
                  ...(marketRefreshing ? styles.liveDotRefreshing : {}),
                }}
              />
              <span>
                {marketRefreshing
                  ? "Updating"
                  : marketLastUpdated
                  ? `Live ${marketLastUpdated}`
                  : "Live"}
              </span>
            </div>

            {marketTickers.map((item, index) => (
              <MarketTickerCard
                key={`${item.label}-${index}`}
                item={item}
                isLast={index === marketTickers.length - 1}
              />
            ))}
          </div>
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
                  10 analyses per day, basic access, no Alerts and no RSI Premium.
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
    alignItems: "center",
    gap: "18px",
    marginBottom: "14px",
    flexWrap: "wrap",
    background:
      "linear-gradient(135deg, rgba(14,80,132,0.58), rgba(29,78,216,0.24))",
    border: "1px solid rgba(14,165,233,0.28)",
    borderRadius: "22px",
    padding: "14px 16px",
    boxShadow: "0 18px 42px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.04)",
  },
  brandBlock: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    minWidth: 0,
  },
  logoBox: {
    width: "64px",
    height: "64px",
    borderRadius: "18px",
    background: "rgba(14,165,233,0.08)",
    border: "1px solid rgba(14,165,233,0.20)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "4px",
    cursor: "pointer",
    boxShadow: "0 14px 30px rgba(14,165,233,0.12)",
    flexShrink: 0,
  },
  mainLogoImage: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    display: "block",
  },
  brandTextBlock: {
    minWidth: 0,
  },
  brandLine: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },
  brandName: {
    color: "white",
    fontSize: "20px",
    fontWeight: 900,
    letterSpacing: "-0.3px",
    lineHeight: 1.15,
  },
  proDeskBadge: {
    background: "rgba(34,197,94,0.16)",
    color: "#86efac",
    border: "1px solid rgba(34,197,94,0.32)",
    borderRadius: "999px",
    padding: "4px 8px",
    fontSize: "10px",
    fontWeight: 900,
    letterSpacing: "0.4px",
    whiteSpace: "nowrap",
  },
  brandSubtext: {
    color: "#a8b6ca",
    fontSize: "13px",
    lineHeight: 1.45,
    marginTop: "6px",
  },
  topBarRight: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
    marginLeft: "auto",
  },
  topButtons: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    alignItems: "center",
  },
  navButton: {
    background: "rgba(14, 165, 233, 0.16)",
    color: "#dbeafe",
    border: "1px solid rgba(14, 165, 233, 0.38)",
    borderRadius: "14px",
    padding: "12px 18px",
    fontSize: "14px",
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 10px 22px rgba(0,0,0,0.14)",
    transition: "all 0.18s ease",
  },
  navButtonHover: {
    background: "rgba(37,99,235,0.34)",
    border: "1px solid rgba(96,165,250,0.62)",
    color: "white",
    transform: "translateY(-1px)",
    boxShadow: "0 0 0 1px rgba(96,165,250,0.14), 0 14px 28px rgba(37,99,235,0.22)",
  },
  topInfoRow: {
    display: "flex",
    alignItems: "stretch",
    gap: "10px",
    marginBottom: "14px",
    width: "100%",
    overflowX: "auto",
    paddingBottom: "2px",
  },
  clocksWrap: {
    display: "flex",
    gap: "6px",
    alignItems: "stretch",
    flexShrink: 0,
  },
  clockCard: {
    width: "112px",
    minWidth: "112px",
    height: "86px",
    background: "rgba(6, 14, 28, 0.96)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "12px",
    padding: "8px 8px 10px",
    boxShadow: "0 10px 22px rgba(0,0,0,0.18)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },
  clockLabel: {
    color: "#94a3b8",
    fontSize: "10px",
    fontWeight: 500,
    textAlign: "left",
    marginBottom: "6px",
  },
  clockTimeWrap: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  clockTime: {
    color: "white",
    fontSize: "18px",
    fontWeight: 500,
    letterSpacing: "2px",
    lineHeight: 1,
    textAlign: "center",
    fontFamily:
      "'Roboto Mono', 'SFMono-Regular', 'Consolas', 'Courier New', monospace",
    fontVariantNumeric: "tabular-nums",
  },
  marketTickerPanel: {
    position: "relative",
    flex: 1,
    minWidth: "820px",
    display: "flex",
    alignItems: "stretch",
    gap: "4px",
    background: "linear-gradient(180deg, rgba(7,18,38,0.94), rgba(8,20,40,0.88))",
    border: "1px solid rgba(34,211,238,0.18)",
    borderRadius: "16px",
    padding: "8px 10px 8px 76px",
    boxShadow: "0 10px 22px rgba(0,0,0,0.18)",
  },
  liveStatusPill: {
    position: "absolute",
    left: "10px",
    top: "10px",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "rgba(34,197,94,0.10)",
    color: "#86efac",
    border: "1px solid rgba(34,197,94,0.22)",
    borderRadius: "999px",
    padding: "5px 8px",
    fontSize: "10px",
    fontWeight: 900,
    whiteSpace: "nowrap",
  },
  liveDot: {
    width: "7px",
    height: "7px",
    borderRadius: "999px",
    background: "#22c55e",
    boxShadow: "0 0 0 4px rgba(34,197,94,0.12)",
  },
  liveDotRefreshing: {
    background: "#facc15",
    boxShadow: "0 0 0 4px rgba(250,204,21,0.12)",
  },
  tickerCard: {
    flex: 1,
    minWidth: "150px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
    padding: "4px 8px",
    borderRight: "1px solid rgba(255,255,255,0.06)",
  },
  tickerCardLast: {
    borderRight: "none",
  },
  tickerTextBlock: {
    minWidth: 0,
  },
  tickerLabel: {
    color: "#60a5fa",
    fontSize: "12px",
    fontWeight: 800,
    marginBottom: "4px",
    whiteSpace: "nowrap",
  },
  tickerValue: {
    color: "white",
    fontSize: "17px",
    fontWeight: 800,
    lineHeight: 1.15,
    whiteSpace: "nowrap",
  },
  tickerChange: {
    fontSize: "12px",
    fontWeight: 700,
    marginTop: "4px",
    whiteSpace: "nowrap",
  },
  tickerChartWrap: {
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.98,
  },
  sparklineSvg: {
    display: "block",
  },
  planBadgeBase: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    borderRadius: "999px",
    padding: "10px 14px",
    fontSize: "12px",
    fontWeight: 900,
    letterSpacing: "0.4px",
    border: "1px solid rgba(255,255,255,0.08)",
    order: 10,
  },
  planBadgeGuest: {
    background: "rgba(51,65,85,0.52)",
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
    background: "rgba(168,85,247,0.24)",
    color: "#e9d5ff",
    border: "1px solid rgba(168,85,247,0.45)",
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