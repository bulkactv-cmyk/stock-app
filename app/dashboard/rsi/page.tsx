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

type RsiResponse = {
  rows: RsiRow[];
  updatedAt?: string;
  error?: string;
};

const TIMEFRAME_LABELS: Record<TimeframeKey, string> = {
  "15m": "15 Minutes",
  "1h": "1 Hour",
  "4h": "4 Hours",
  "12h": "12 Hours",
  "24h": "24 Hours",
  "1w": "1 Week",
};

function formatPrice(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  if (value >= 1000) {
    return `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  }
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
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "rgba(255,255,255,0.04)";
  }
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

function AssetLogo({
  symbol,
  name,
  logoUrl,
}: {
  symbol: string;
  name: string;
  logoUrl: string;
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <div style={styles.logoHolder} title={name}>
      {!imgError ? (
        <img
          src={logoUrl}
          alt={name}
          style={styles.logoImage}
          onError={() => setImgError(true)}
        />
      ) : (
        <div style={styles.logoFallback}>{symbol.slice(0, 1)}</div>
      )}
    </div>
  );
}

function SortArrow({
  active,
  direction,
}: {
  active: boolean;
  direction: SortDirection;
}) {
  if (!active) {
    return <span style={styles.sortArrowInactive}>↕</span>;
  }

  return (
    <span style={styles.sortArrowActive}>
      {direction === "asc" ? "↑" : "↓"}
    </span>
  );
}

export default function PremiumRsiPage() {
  const supabase = createClient();

  const [plan, setPlan] = useState<PlanType>("loading");
  const [accessActive, setAccessActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<RsiRow[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeframeKey>("15m");
  const [updatedAt, setUpdatedAt] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState(false);

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

      const { data: planData, error: planError } = await supabase
        .from("user_plans")
        .select("plan, access_active")
        .eq("email", user.email)
        .single();

      if (planError || !planData) {
        setPlan("error");
        setLoading(false);
        return;
      }

      let currentPlan = planData.plan as PlanType;
      const isActive = planData.access_active === true;

      setAccessActive(isActive);

      if ((currentPlan === "pro" || currentPlan === "unlimited") && !isActive) {
        currentPlan = "basic";
      }

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
        if (background) {
          setIsRefreshing(true);
        }

        const res = await fetch("/api/rsi-stats", { cache: "no-store" });
        const data = (await res.json()) as RsiResponse;

        if (!res.ok || data.error) {
          console.error(data.error || "RSI fetch error");
          return;
        }

        if (mounted) {
          setRows(Array.isArray(data.rows) ? data.rows : []);
          setUpdatedAt(data.updatedAt || "");
        }
      } catch (error) {
        console.error("RSI fetch error:", error);
      } finally {
        if (background && mounted) {
          setIsRefreshing(false);
        }
      }
    };

    loadRsi();

    const interval = setInterval(() => {
      loadRsi(true);
    }, 15000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [isPremium]);

  const sortedRows = useMemo(() => {
    const cloned = [...rows];

    cloned.sort((a, b) => {
      if (sortColumn === "symbol") {
        const aValue = a.symbol.toUpperCase();
        const bValue = b.symbol.toUpperCase();

        if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
        if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
        return 0;
      }

      if (sortColumn === "price") {
        const aValue = getSafeSortNumber(a.price, sortDirection);
        const bValue = getSafeSortNumber(b.price, sortDirection);

        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }

      const aValue = getSafeSortNumber(a.rsi[sortColumn], sortDirection);
      const bValue = getSafeSortNumber(b.rsi[sortColumn], sortDirection);

      return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
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
        <div style={styles.overlay} />
        <div style={styles.wrapper}>
          <div style={styles.loadingCard}>Зареждане...</div>
        </div>
      </main>
    );
  }

  if (!isPremium) {
    return (
      <main style={styles.page}>
        <div style={styles.overlay} />
        <div style={styles.wrapper}>
          <div style={styles.lockedCard}>
            <h1 style={styles.title}>RSI Premium</h1>
            <p style={styles.lockedText}>
              RSI Heatmap и RSI Table са достъпни само за <strong>PRO</strong> и{" "}
              <strong>UNLIMITED</strong>.
            </p>
            <p style={styles.lockedSubtext}>
              Ъпгрейдни плана си, за да виждаш реални RSI стойности по множество
              таймфреймове и да следиш прегряване или препродаденост на пазара.
            </p>

            <div style={styles.lockedButtons}>
              <button
                style={styles.primaryButton}
                onClick={() => {
                  window.location.href = "/pricing";
                }}
              >
                Upgrade
              </button>

              <button
                style={styles.secondaryButton}
                onClick={() => {
                  window.location.href = "/dashboard";
                }}
              >
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
      <div style={styles.overlay} />

      <div style={styles.wrapper}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>RSI Stats</h1>
            <p style={styles.subtitle}>
              Реални RSI стойности за водещи криптовалути по няколко таймфрейма.
            </p>
          </div>

          <div style={styles.headerButtons}>
            <button
              style={styles.secondaryButton}
              onClick={() => {
                window.location.href = "/dashboard";
              }}
            >
              Назад към Dashboard
            </button>
          </div>
        </div>

        <div style={styles.topMetaRow}>
          <div style={styles.premiumBadge}>
            {plan.toUpperCase()}
            {accessActive ? <span style={styles.premiumDot} /> : null}
          </div>

          <div style={styles.updateTextWrap}>
            <div style={styles.updateText}>
              Обновено: {updatedAt ? new Date(updatedAt).toLocaleString() : "—"}
            </div>
            <div style={styles.refreshBadge}>
              {isRefreshing ? "Обновяване..." : "Auto refresh: 15s"}
            </div>
          </div>
        </div>

        <div style={styles.sectionCard}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>RSI Heatmap</h2>

            <div style={styles.tabs}>
              {(Object.keys(TIMEFRAME_LABELS) as TimeframeKey[]).map((tf) => (
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

          <div style={styles.heatmapWrap}>
            <div style={styles.heatmapArea}>
              <div style={{ ...styles.band, ...styles.bandTop }} />
              <div style={{ ...styles.band, ...styles.bandUpper }} />
              <div style={{ ...styles.band, ...styles.bandMiddle }} />
              <div style={{ ...styles.band, ...styles.bandLower }} />
              <div style={{ ...styles.band, ...styles.bandBottom }} />

              {[0, 20, 40, 60, 80, 100].map((value) => (
                <div
                  key={value}
                  style={{
                    ...styles.axisLine,
                    bottom: `${value}%`,
                  }}
                >
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
                    style={{
                      ...styles.pointWrap,
                      left: `${left}%`,
                      bottom: `${safeValue}%`,
                    }}
                    title={`${row.symbol} • RSI ${formatRsi(value)}`}
                  >
                    <div style={styles.pointLabel}>{row.symbol}</div>
                    <div
                      style={{
                        ...styles.pointDot,
                        borderColor: getRsiColor(value),
                      }}
                    />
                    <div
                      style={{
                        ...styles.pointStem,
                        background: getRsiColor(value),
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div style={styles.sectionCard}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>RSI Table</h2>
            <div style={styles.tableInfo}>
              Кликни върху заглавие на колона за сортиране
            </div>
          </div>

          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>
                    <button style={styles.thButton} onClick={() => handleSort("symbol")}>
                      Symbol
                      <SortArrow
                        active={sortColumn === "symbol"}
                        direction={sortDirection}
                      />
                    </button>
                  </th>

                  <th style={styles.th}>
                    <button style={styles.thButton} onClick={() => handleSort("price")}>
                      Price
                      <SortArrow
                        active={sortColumn === "price"}
                        direction={sortDirection}
                      />
                    </button>
                  </th>

                  <th style={styles.th}>
                    <button style={styles.thButton} onClick={() => handleSort("15m")}>
                      RSI 15 Min
                      <SortArrow
                        active={sortColumn === "15m"}
                        direction={sortDirection}
                      />
                    </button>
                  </th>

                  <th style={styles.th}>
                    <button style={styles.thButton} onClick={() => handleSort("1h")}>
                      RSI 1 Hr
                      <SortArrow
                        active={sortColumn === "1h"}
                        direction={sortDirection}
                      />
                    </button>
                  </th>

                  <th style={styles.th}>
                    <button style={styles.thButton} onClick={() => handleSort("4h")}>
                      RSI 4 Hrs
                      <SortArrow
                        active={sortColumn === "4h"}
                        direction={sortDirection}
                      />
                    </button>
                  </th>

                  <th style={styles.th}>
                    <button style={styles.thButton} onClick={() => handleSort("12h")}>
                      RSI 12 Hrs
                      <SortArrow
                        active={sortColumn === "12h"}
                        direction={sortDirection}
                      />
                    </button>
                  </th>

                  <th style={styles.th}>
                    <button style={styles.thButton} onClick={() => handleSort("24h")}>
                      RSI 24 Hrs
                      <SortArrow
                        active={sortColumn === "24h"}
                        direction={sortDirection}
                      />
                    </button>
                  </th>

                  <th style={styles.th}>
                    <button style={styles.thButton} onClick={() => handleSort("1w")}>
                      RSI 1 Wk
                      <SortArrow
                        active={sortColumn === "1w"}
                        direction={sortDirection}
                      />
                    </button>
                  </th>
                </tr>
              </thead>

              <tbody>
                {sortedRows.map((row) => (
                  <tr key={row.symbol}>
                    <td style={styles.td}>
                      <div style={styles.symbolCell}>
                        <AssetLogo
                          symbol={row.symbol}
                          name={row.name}
                          logoUrl={row.logoUrl}
                        />
                        <div>
                          <div style={styles.symbolMain}>{row.symbol}</div>
                          <div style={styles.symbolSub}>{row.name}</div>
                        </div>
                      </div>
                    </td>

                    <td style={styles.td}>{formatPrice(row.price)}</td>

                    {(["15m", "1h", "4h", "12h", "24h", "1w"] as TimeframeKey[]).map(
                      (tf) => (
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
                      )
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={styles.sectionCard}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Какво е RSI Heatmap?</h2>
          </div>

          <div style={styles.explainerText}>
            <p>
              <strong>RSI (Relative Strength Index)</strong> е един от най-използваните
              технически индикатори за измерване на силата и скоростта на движението
              в цената. Той се движи в диапазон от <strong>0 до 100</strong> и помага
              да се оцени дали даден актив е прекалено купуван или прекалено
              разпродаван.
            </p>

            <p>
              При стойности <strong>над 70</strong> активът често се разглежда като
              <strong> свръхкупен</strong>, а при стойности <strong>под 30</strong> –
              като <strong>свръхпродаден</strong>. Това не е самостоятелен сигнал за
              покупка или продажба, а инструмент за контекст и моментум.
            </p>

            <p>
              <strong>RSI Heatmap</strong> визуализира бързо къде се намират
              различните активи спрямо тези зони. Така можеш моментално да видиш
              кои криптовалути са по-близо до прегряване и кои са по-близо до
              потенциално възстановяване.
            </p>

            <p>
              <strong>RSI Table</strong> показва същите RSI стойности по няколко
              таймфрейма – 15 минути, 1 час, 4 часа, 12 часа, 24 часа и 1 седмица.
              Това ти позволява да следиш не само краткосрочното състояние, но и
              дали инерцията се изгражда или отслабва в по-широка времева рамка.
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
    position: "relative",
    background:
      "radial-gradient(circle at top, #171000 0%, #0c0b06 35%, #050505 100%)",
    padding: "32px 18px 50px",
    overflow: "hidden",
  },
  overlay: {
    position: "absolute",
    inset: 0,
    background: "rgba(0,0,0,0.18)",
    backdropFilter: "blur(2px)",
  },
  wrapper: {
    position: "relative",
    zIndex: 1,
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
    boxShadow: "0 22px 60px rgba(0,0,0,0.45)",
  },
  lockedText: {
    color: "white",
    fontSize: "18px",
    lineHeight: 1.7,
    marginBottom: "12px",
  },
  lockedSubtext: {
    color: "#b7b7b7",
    fontSize: "15px",
    lineHeight: 1.8,
    marginBottom: "24px",
  },
  lockedButtons: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
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
  headerButtons: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
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
    letterSpacing: "0.4px",
  },
  premiumDot: {
    width: "8px",
    height: "8px",
    borderRadius: "999px",
    background: "#22c55e",
    boxShadow: "0 0 0 4px rgba(34,197,94,0.12)",
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
    boxShadow: "0 18px 40px rgba(0,0,0,0.32)",
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
  heatmapWrap: {
    padding: "8px 0 4px",
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
  bandTop: {
    top: 0,
    height: "20%",
    background: "rgba(127,29,29,0.72)",
  },
  bandUpper: {
    top: "20%",
    height: "20%",
    background: "rgba(55,6,23,0.62)",
  },
  bandMiddle: {
    top: "40%",
    height: "20%",
    background: "rgba(15,23,42,0.78)",
  },
  bandLower: {
    top: "60%",
    height: "20%",
    background: "rgba(4,47,46,0.72)",
  },
  bandBottom: {
    top: "80%",
    height: "20%",
    background: "rgba(20,83,45,0.78)",
  },
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
    marginBottom: "2px",
    textShadow: "0 1px 6px rgba(0,0,0,0.8)",
  },
  pointDot: {
    width: "14px",
    height: "14px",
    borderRadius: "999px",
    background: "#111827",
    border: "3px solid #e5e7eb",
    boxShadow: "0 0 0 4px rgba(0,0,0,0.18)",
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
    padding: "0",
    color: "white",
    fontSize: "14px",
    fontWeight: 800,
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
    marginBottom: "2px",
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