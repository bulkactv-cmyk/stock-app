"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "../../../lib/supabase/client";

type PlanType = "basic" | "pro" | "unlimited" | "loading" | "no-user" | "error";
type TimeframeKey = "15m" | "1h" | "4h" | "12h" | "24h" | "1w";
type SortDirection = "asc" | "desc";
type SortColumn = "symbol" | "price" | TimeframeKey;

type RsiRow = {
  symbol: string;
  name: string;
  pair: string;
  logoUrl: string;
  price: number | null;
  rsi: Record<TimeframeKey, number | null>;
};

const TIMEFRAMES: TimeframeKey[] = ["15m", "1h", "4h", "12h", "24h", "1w"];

const TIMEFRAME_LABELS: Record<TimeframeKey, string> = {
  "15m": "15 Minutes",
  "1h": "1 Hour",
  "4h": "4 Hours",
  "12h": "12 Hours",
  "24h": "24 Hours",
  "1w": "1 Week",
};

const BINANCE_INTERVALS: Record<TimeframeKey, string> = {
  "15m": "15m",
  "1h": "1h",
  "4h": "4h",
  "12h": "12h",
  "24h": "1d",
  "1w": "1w",
};

const COINS = [
  { symbol: "BTC", name: "Bitcoin", pair: "BTCUSDT" },
  { symbol: "ETH", name: "Ethereum", pair: "ETHUSDT" },
  { symbol: "SOL", name: "Solana", pair: "SOLUSDT" },
  { symbol: "XRP", name: "XRP", pair: "XRPUSDT" },
  { symbol: "BNB", name: "BNB", pair: "BNBUSDT" },
  { symbol: "DOGE", name: "Dogecoin", pair: "DOGEUSDT" },
  { symbol: "ADA", name: "Cardano", pair: "ADAUSDT" },
  { symbol: "AVAX", name: "Avalanche", pair: "AVAXUSDT" },
  { symbol: "LINK", name: "Chainlink", pair: "LINKUSDT" },
  { symbol: "DOT", name: "Polkadot", pair: "DOTUSDT" },
  { symbol: "TRX", name: "TRON", pair: "TRXUSDT" },
  { symbol: "TON", name: "Toncoin", pair: "TONUSDT" },
  { symbol: "SHIB", name: "Shiba Inu", pair: "SHIBUSDT" },
  { symbol: "BCH", name: "Bitcoin Cash", pair: "BCHUSDT" },
  { symbol: "LTC", name: "Litecoin", pair: "LTCUSDT" },
  { symbol: "UNI", name: "Uniswap", pair: "UNIUSDT" },
];

function getLogoUrl(symbol: string) {
  return `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${symbol.toLowerCase()}.png`;
}

function emptyRsi(): Record<TimeframeKey, number | null> {
  return { "15m": null, "1h": null, "4h": null, "12h": null, "24h": null, "1w": null };
}

function calculateRsi(closes: number[], period = 14): number | null {
  if (closes.length < period + 1) return null;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const change = closes[i] - closes[i - 1];
    if (change >= 0) gains += change;
    else losses += Math.abs(change);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period + 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }

  if (avgLoss === 0) return 100;

  const rs = avgGain / avgLoss;
  return Number((100 - 100 / (1 + rs)).toFixed(1));
}

async function fetchBinanceCloses(pair: string, timeframe: TimeframeKey) {
  const interval = BINANCE_INTERVALS[timeframe];
  const res = await fetch(
    `https://api.binance.com/api/v3/klines?symbol=${pair}&interval=${interval}&limit=120`
  );

  if (!res.ok) throw new Error("Binance failed");

  const data = await res.json();

  return Array.isArray(data)
    ? data
        .map((row) => Number(row?.[4]))
        .filter((value) => Number.isFinite(value))
    : [];
}

function getCryptoCompareUrl(symbol: string, timeframe: TimeframeKey) {
  const base = "https://min-api.cryptocompare.com/data";

  if (timeframe === "15m") return `${base}/v2/histominute?fsym=${symbol}&tsym=USDT&limit=120&aggregate=15`;
  if (timeframe === "1h") return `${base}/v2/histohour?fsym=${symbol}&tsym=USDT&limit=120&aggregate=1`;
  if (timeframe === "4h") return `${base}/v2/histohour?fsym=${symbol}&tsym=USDT&limit=120&aggregate=4`;
  if (timeframe === "12h") return `${base}/v2/histohour?fsym=${symbol}&tsym=USDT&limit=120&aggregate=12`;
  if (timeframe === "24h") return `${base}/v2/histoday?fsym=${symbol}&tsym=USDT&limit=120&aggregate=1`;

  return `${base}/v2/histoday?fsym=${symbol}&tsym=USDT&limit=120&aggregate=7`;
}

async function fetchCryptoCompareCloses(symbol: string, timeframe: TimeframeKey) {
  const res = await fetch(getCryptoCompareUrl(symbol, timeframe));
  if (!res.ok) throw new Error("CryptoCompare failed");

  const data = await res.json();
  const rows = data?.Data?.Data;

  return Array.isArray(rows)
    ? rows
        .map((row) => Number(row?.close))
        .filter((value) => Number.isFinite(value))
    : [];
}

async function fetchCloses(symbol: string, pair: string, timeframe: TimeframeKey) {
  try {
    return await fetchBinanceCloses(pair, timeframe);
  } catch {
    return await fetchCryptoCompareCloses(symbol, timeframe);
  }
}

async function buildClientRow(coin: (typeof COINS)[number]): Promise<RsiRow> {
  const results = await Promise.all(
    TIMEFRAMES.map(async (tf) => {
      try {
        const closes = await fetchCloses(coin.symbol, coin.pair, tf);
        return {
          tf,
          price: closes.length ? closes[closes.length - 1] : null,
          rsi: calculateRsi(closes),
        };
      } catch {
        return { tf, price: null, rsi: null };
      }
    })
  );

  const rsi = emptyRsi();

  results.forEach((item) => {
    rsi[item.tf] = item.rsi;
  });

  return {
    symbol: coin.symbol,
    name: coin.name,
    pair: coin.pair,
    logoUrl: getLogoUrl(coin.symbol),
    price: results.find((item) => item.price !== null)?.price ?? null,
    rsi,
  };
}

function hasRealRsi(rows: RsiRow[]) {
  return rows.some((row) => TIMEFRAMES.some((tf) => typeof row.rsi?.[tf] === "number"));
}

function formatPrice(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  if (value >= 1000) return `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  if (value >= 1) return `$${value.toFixed(2)}`;
  return `$${value.toFixed(4)}`;
}

function formatRsi(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return value.toFixed(1);
}

function getRsiColor(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "#cbd5e1";
  if (value >= 70) return "#f87171";
  if (value >= 60) return "#fca5a5";
  if (value >= 40) return "#e5e7eb";
  if (value >= 30) return "#93c5fd";
  return "#34d399";
}

function getRsiBackground(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "rgba(255,255,255,0.04)";
  if (value >= 70) return "rgba(239,68,68,0.18)";
  if (value >= 60) return "rgba(127,29,29,0.25)";
  if (value >= 40) return "rgba(255,255,255,0.03)";
  if (value >= 30) return "rgba(8,47,73,0.35)";
  return "rgba(5,150,105,0.18)";
}

function getSafeSortNumber(value: number | null | undefined, direction: SortDirection) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return direction === "asc" ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
  }
  return value;
}

function AssetLogo({ symbol, name, logoUrl }: { symbol: string; name: string; logoUrl: string }) {
  const [imgError, setImgError] = useState(false);

  return (
    <div style={styles.logoHolder} title={name}>
      {!imgError ? (
        <img src={logoUrl} alt={name} style={styles.logoImage} onError={() => setImgError(true)} />
      ) : (
        <div style={styles.logoFallback}>{symbol.slice(0, 1)}</div>
      )}
    </div>
  );
}

function SortArrow({ active, direction }: { active: boolean; direction: SortDirection }) {
  return <span style={active ? styles.sortArrowActive : styles.sortArrowInactive}>{active ? (direction === "asc" ? "↑" : "↓") : "↕"}</span>;
}

export default function PremiumRsiPage() {
  const supabase = createClient();

  const [plan, setPlan] = useState<PlanType>("loading");
  const [accessActive, setAccessActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<RsiRow[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeframeKey>("15m");
  const [updatedAt, setUpdatedAt] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dataSource, setDataSource] = useState("Зареждане...");

  const [sortColumn, setSortColumn] = useState<SortColumn>("15m");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const isPremium = plan === "pro" || plan === "unlimited";

  useEffect(() => {
    const loadPlan = async () => {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.email) {
        setPlan("no-user");
        setLoading(false);
        return;
      }

      const { data: planData, error } = await supabase
        .from("user_plans")
        .select("plan, access_active")
        .eq("email", user.email)
        .single();

      if (error || !planData) {
        setPlan("error");
        setLoading(false);
        return;
      }

      let currentPlan = planData.plan as PlanType;
      const isActive = planData.access_active === true;

      if ((currentPlan === "pro" || currentPlan === "unlimited") && !isActive) {
        currentPlan = "basic";
      }

      setAccessActive(isActive);
      setPlan(currentPlan);
      setLoading(false);
    };

    loadPlan();
  }, [supabase]);

  useEffect(() => {
    setSortColumn(selectedTimeframe);
    setSortDirection("desc");
  }, [selectedTimeframe]);

  useEffect(() => {
    if (!isPremium) return;

    let mounted = true;

    const loadRsi = async (background = false) => {
      try {
        if (background) setIsRefreshing(true);

        let apiRows: RsiRow[] = [];

        try {
          const res = await fetch("/api/rsi-stats", { cache: "no-store" });
          const data = await res.json();

          if (res.ok && Array.isArray(data?.rows)) {
            apiRows = data.rows;
          }
        } catch {}

        if (hasRealRsi(apiRows)) {
          if (mounted) {
            setRows(apiRows);
            setUpdatedAt(new Date().toISOString());
            setDataSource("API");
          }
          return;
        }

        const clientRows = await Promise.all(COINS.map(buildClientRow));

        if (mounted) {
          setRows(clientRows);
          setUpdatedAt(new Date().toISOString());
          setDataSource("Client fallback");
        }
      } catch (error) {
        console.error("RSI load error:", error);

        if (mounted) {
          setRows(
            COINS.map((coin) => ({
              ...coin,
              logoUrl: getLogoUrl(coin.symbol),
              price: null,
              rsi: emptyRsi(),
            }))
          );
          setDataSource("Грешка при зареждане");
        }
      } finally {
        if (mounted) setIsRefreshing(false);
      }
    };

    loadRsi();

    const interval = setInterval(() => {
      loadRsi(true);
    }, 60000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [isPremium]);

  const sortedRows = useMemo(() => {
    const cloned = [...rows];

    cloned.sort((a, b) => {
      if (sortColumn === "symbol") {
        return sortDirection === "asc"
          ? a.symbol.localeCompare(b.symbol)
          : b.symbol.localeCompare(a.symbol);
      }

      if (sortColumn === "price") {
        const av = getSafeSortNumber(a.price, sortDirection);
        const bv = getSafeSortNumber(b.price, sortDirection);
        return sortDirection === "asc" ? av - bv : bv - av;
      }

      const av = getSafeSortNumber(a.rsi[sortColumn], sortDirection);
      const bv = getSafeSortNumber(b.rsi[sortColumn], sortDirection);
      return sortDirection === "asc" ? av - bv : bv - av;
    });

    return cloned;
  }, [rows, sortColumn, sortDirection]);

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }

    setSortColumn(column);
    setSortDirection(column === "symbol" ? "asc" : "desc");
  };

  if (loading) {
    return (
      <main style={styles.page}>
        <div style={styles.wrapper}>
          <div style={styles.loadingCard}>Зареждане...</div>
        </div>
      </main>
    );
  }

  if (!isPremium) {
    return (
      <main style={styles.page}>
        <div style={styles.wrapper}>
          <div style={styles.lockedCard}>
            <h1 style={styles.title}>RSI Premium</h1>
            <p style={styles.lockedText}>RSI Heatmap и RSI Table са достъпни само за PRO и UNLIMITED.</p>
            <div style={styles.lockedButtons}>
              <button style={styles.primaryButton} onClick={() => (window.location.href = "/pricing")}>
                Upgrade
              </button>
              <button style={styles.secondaryButton} onClick={() => (window.location.href = "/dashboard")}>
                Назад
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.wrapper}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>RSI Stats</h1>
            <p style={styles.subtitle}>Реални RSI стойности за водещи криптовалути по няколко таймфрейма.</p>
          </div>

          <button style={styles.secondaryButton} onClick={() => (window.location.href = "/dashboard")}>
            Назад към Dashboard
          </button>
        </div>

        <div style={styles.topMetaRow}>
          <div style={styles.premiumBadge}>
            {plan.toUpperCase()}
            {accessActive ? <span style={styles.premiumDot} /> : null}
          </div>

          <div style={styles.updateTextWrap}>
            <div style={styles.updateText}>Обновено: {updatedAt ? new Date(updatedAt).toLocaleString() : "—"}</div>
            <div style={styles.refreshBadge}>{isRefreshing ? "Обновяване..." : "Auto refresh: 60s"}</div>
            <div style={styles.refreshBadge}>Source: {dataSource}</div>
          </div>
        </div>

        <div style={styles.sectionCard}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>RSI Heatmap</h2>

            <div style={styles.tabs}>
              {TIMEFRAMES.map((tf) => (
                <button
                  key={tf}
                  type="button"
                  onClick={() => setSelectedTimeframe(tf)}
                  style={{
                    ...styles.tabButton,
                    ...(selectedTimeframe === tf ? styles.tabButtonActive : {}),
                  }}
                >
                  {TIMEFRAME_LABELS[tf]}
                </button>
              ))}
            </div>
          </div>

          <div style={styles.heatmapArea}>
            <div style={{ ...styles.band, ...styles.bandTop }} />
            <div style={{ ...styles.band, ...styles.bandUpper }} />
            <div style={{ ...styles.band, ...styles.bandMiddle }} />
            <div style={{ ...styles.band, ...styles.bandLower }} />
            <div style={{ ...styles.band, ...styles.bandBottom }} />

            {[0, 20, 40, 60, 80, 100].map((value) => (
              <div key={value} style={{ ...styles.axisLine, bottom: `${value}%` }}>
                <span style={styles.axisLabel}>{value}</span>
              </div>
            ))}

            {sortedRows.map((row, index) => {
              const value = row.rsi[selectedTimeframe];
              const safeValue = value ?? 50;
              const left = ((index + 1) / (sortedRows.length + 1)) * 100;

              return (
                <div
                  key={`${row.symbol}-${selectedTimeframe}`}
                  style={{ ...styles.pointWrap, left: `${left}%`, bottom: `${safeValue}%` }}
                  title={`${row.symbol} • RSI ${formatRsi(value)}`}
                >
                  <div style={styles.pointLabel}>{row.symbol}</div>
                  <div style={{ ...styles.pointDot, borderColor: getRsiColor(value) }} />
                  <div style={{ ...styles.pointStem, background: getRsiColor(value) }} />
                </div>
              );
            })}
          </div>
        </div>

        <div style={styles.sectionCard}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>RSI Table</h2>
            <div style={styles.tableInfo}>Кликни върху заглавие на колона за сортиране</div>
          </div>

          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {(["symbol", "price", ...TIMEFRAMES] as SortColumn[]).map((col) => (
                    <th key={col} style={styles.th}>
                      <button style={styles.thButton} onClick={() => handleSort(col)}>
                        {col === "symbol"
                          ? "Symbol"
                          : col === "price"
                          ? "Price"
                          : `RSI ${TIMEFRAME_LABELS[col as TimeframeKey]}`}
                        <SortArrow active={sortColumn === col} direction={sortDirection} />
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {sortedRows.map((row) => (
                  <tr key={row.symbol}>
                    <td style={styles.td}>
                      <div style={styles.symbolCell}>
                        <AssetLogo symbol={row.symbol} name={row.name} logoUrl={row.logoUrl} />
                        <div>
                          <div style={styles.symbolMain}>{row.symbol}</div>
                          <div style={styles.symbolSub}>{row.name}</div>
                        </div>
                      </div>
                    </td>

                    <td style={styles.td}>{formatPrice(row.price)}</td>

                    {TIMEFRAMES.map((tf) => (
                      <td key={tf} style={styles.td}>
                        <span
                          style={{
                            ...styles.rsiBadge,
                            background: getRsiBackground(row.rsi[tf]),
                            color: getRsiColor(row.rsi[tf]),
                          }}
                        >
                          {formatRsi(row.rsi[tf])}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={styles.sectionCard}>
          <h2 style={styles.sectionTitle}>Какво е RSI Heatmap?</h2>
          <div style={styles.explainerText}>
            <p>
              <strong>RSI</strong> измерва силата на движението в диапазон от 0 до 100.
              Над 70 често означава свръхкупен актив, а под 30 — свръхпродаден.
            </p>
            <p>
              Тази таблица показва RSI по няколко таймфрейма, за да виждаш краткосрочен и по-широк моментум.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "radial-gradient(circle at top, #171000 0%, #0c0b06 35%, #050505 100%)",
    padding: "32px 18px 50px",
  },
  wrapper: {
    maxWidth: "1280px",
    margin: "0 auto",
  },
  loadingCard: {
    background: "rgba(14,14,14,0.94)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "20px",
    padding: "28px",
    color: "white",
    fontSize: "18px",
    fontWeight: 700,
    textAlign: "center",
  },
  lockedCard: {
    background: "rgba(14,14,14,0.94)",
    border: "1px solid rgba(245,158,11,0.18)",
    borderRadius: "24px",
    padding: "36px",
    maxWidth: "820px",
    margin: "40px auto",
  },
  lockedText: {
    color: "white",
    fontSize: "18px",
    lineHeight: 1.7,
  },
  lockedButtons: {
    display: "flex",
    gap: "12px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "18px",
    marginBottom: "18px",
    flexWrap: "wrap",
  },
  title: {
    color: "white",
    fontSize: "42px",
    fontWeight: 800,
    marginBottom: "10px",
  },
  subtitle: {
    color: "#c1b8aa",
    fontSize: "16px",
    margin: 0,
  },
  topMetaRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "14px",
    flexWrap: "wrap",
    marginBottom: "18px",
  },
  updateTextWrap: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  },
  premiumBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 14px",
    borderRadius: "999px",
    background: "rgba(245,158,11,0.16)",
    border: "1px solid rgba(245,158,11,0.28)",
    color: "#facc15",
    fontSize: "12px",
    fontWeight: 800,
  },
  premiumDot: {
    width: "8px",
    height: "8px",
    borderRadius: "999px",
    background: "#22c55e",
  },
  updateText: {
    color: "#9ca3af",
    fontSize: "13px",
  },
  refreshBadge: {
    background: "rgba(245,158,11,0.12)",
    color: "#fbbf24",
    border: "1px solid rgba(245,158,11,0.24)",
    borderRadius: "999px",
    padding: "6px 10px",
    fontSize: "12px",
    fontWeight: 700,
  },
  sectionCard: {
    background: "rgba(10,10,10,0.94)",
    border: "1px solid rgba(245,158,11,0.12)",
    borderRadius: "18px",
    padding: "18px",
    marginBottom: "18px",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "14px",
    flexWrap: "wrap",
    marginBottom: "16px",
  },
  sectionTitle: {
    color: "white",
    fontSize: "18px",
    fontWeight: 800,
    margin: 0,
  },
  tableInfo: {
    color: "#9ca3af",
    fontSize: "13px",
  },
  tabs: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  tabButton: {
    background: "rgba(255,255,255,0.04)",
    color: "#d1d5db",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "10px",
    padding: "10px 12px",
    fontSize: "13px",
    fontWeight: 700,
    cursor: "pointer",
  },
  tabButtonActive: {
    background: "rgba(245,158,11,0.18)",
    color: "#fbbf24",
    border: "1px solid rgba(245,158,11,0.35)",
  },
  heatmapArea: {
    position: "relative",
    height: "560px",
    borderRadius: "16px",
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.06)",
    background: "#070707",
  },
  band: {
    position: "absolute",
    left: 0,
    width: "100%",
  },
  bandTop: { top: 0, height: "20%", background: "rgba(127,29,29,0.72)" },
  bandUpper: { top: "20%", height: "20%", background: "rgba(55,6,23,0.62)" },
  bandMiddle: { top: "40%", height: "20%", background: "rgba(15,23,42,0.78)" },
  bandLower: { top: "60%", height: "20%", background: "rgba(4,47,46,0.72)" },
  bandBottom: { top: "80%", height: "20%", background: "rgba(20,83,45,0.78)" },
  axisLine: {
    position: "absolute",
    left: 0,
    width: "100%",
    borderTop: "1px dashed rgba(255,255,255,0.12)",
  },
  axisLabel: {
    position: "absolute",
    left: "12px",
    top: "-10px",
    color: "#d1d5db",
    fontSize: "12px",
  },
  pointWrap: {
    position: "absolute",
    transform: "translate(-50%, 50%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "2px",
  },
  pointLabel: {
    color: "#e5e7eb",
    fontSize: "12px",
    fontWeight: 700,
  },
  pointDot: {
    width: "14px",
    height: "14px",
    borderRadius: "999px",
    background: "#111827",
    border: "3px solid #e5e7eb",
  },
  pointStem: {
    width: "2px",
    height: "18px",
    opacity: 0.6,
  },
  tableWrap: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "1040px",
  },
  th: {
    textAlign: "left",
    padding: 0,
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.02)",
  },
  thButton: {
    width: "100%",
    background: "transparent",
    border: "none",
    color: "white",
    padding: "14px 12px",
    fontSize: "14px",
    fontWeight: 800,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    textAlign: "left",
  },
  sortArrowActive: {
    color: "#fbbf24",
    fontSize: "13px",
    fontWeight: 800,
  },
  sortArrowInactive: {
    color: "#6b7280",
    fontSize: "12px",
    fontWeight: 800,
  },
  td: {
    padding: "14px 12px",
    color: "#e5e7eb",
    fontSize: "14px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    verticalAlign: "middle",
  },
  symbolCell: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  symbolMain: {
    color: "white",
    fontSize: "14px",
    fontWeight: 800,
  },
  symbolSub: {
    color: "#9ca3af",
    fontSize: "12px",
  },
  rsiBadge: {
    display: "inline-flex",
    minWidth: "52px",
    justifyContent: "center",
    alignItems: "center",
    padding: "6px 10px",
    borderRadius: "10px",
    fontSize: "13px",
    fontWeight: 800,
    border: "1px solid rgba(255,255,255,0.06)",
  },
  explainerText: {
    color: "#d1d5db",
    fontSize: "15px",
    lineHeight: 1.9,
  },
  primaryButton: {
    background: "#f59e0b",
    color: "#111827",
    border: "none",
    borderRadius: "12px",
    padding: "14px 20px",
    fontSize: "15px",
    fontWeight: 800,
    cursor: "pointer",
  },
  secondaryButton: {
    background: "rgba(255,255,255,0.04)",
    color: "white",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "12px",
    padding: "14px 20px",
    fontSize: "15px",
    fontWeight: 700,
    cursor: "pointer",
  },
  logoHolder: {
    width: "28px",
    height: "28px",
    borderRadius: "999px",
    overflow: "hidden",
    flexShrink: 0,
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  logoImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  logoFallback: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontSize: "12px",
    fontWeight: 800,
    background: "linear-gradient(135deg, #374151 0%, #111827 100%)",
  },
};