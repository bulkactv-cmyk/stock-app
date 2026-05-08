"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "../../../lib/supabase/client";

type PlanType = "basic" | "pro" | "unlimited" | "loading" | "no-user" | "error";
type TimeframeKey = "15m" | "1h" | "4h" | "12h" | "24h" | "1w";
type SortDirection = "asc" | "desc";
type SortColumn = "symbol" | "price" | TimeframeKey;

type Coin = {
  symbol: string;
  name: string;
  pair: string;
};

type RsiRow = {
  symbol: string;
  name: string;
  pair: string;
  logoUrl: string;
  price: number | null;
  rsi: Record<TimeframeKey, number | null>;
};

const TIMEFRAMES: TimeframeKey[] = ["15m", "1h", "4h", "12h", "24h", "1w"];
const TABLE_PAGE_SIZE = 20;

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

const COINS: Coin[] = [
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
  { symbol: "NEAR", name: "NEAR Protocol", pair: "NEARUSDT" },
  { symbol: "APT", name: "Aptos", pair: "APTUSDT" },
  { symbol: "ARB", name: "Arbitrum", pair: "ARBUSDT" },
  { symbol: "OP", name: "Optimism", pair: "OPUSDT" },
  { symbol: "INJ", name: "Injective", pair: "INJUSDT" },
  { symbol: "SUI", name: "Sui", pair: "SUIUSDT" },
  { symbol: "FIL", name: "Filecoin", pair: "FILUSDT" },
  { symbol: "ATOM", name: "Cosmos", pair: "ATOMUSDT" },
  { symbol: "ETC", name: "Ethereum Classic", pair: "ETCUSDT" },
  { symbol: "XLM", name: "Stellar", pair: "XLMUSDT" },
  { symbol: "HBAR", name: "Hedera", pair: "HBARUSDT" },
  { symbol: "ICP", name: "Internet Computer", pair: "ICPUSDT" },
  { symbol: "VET", name: "VeChain", pair: "VETUSDT" },
  { symbol: "AAVE", name: "Aave", pair: "AAVEUSDT" },
  { symbol: "ALGO", name: "Algorand", pair: "ALGOUSDT" },
  { symbol: "GRT", name: "The Graph", pair: "GRTUSDT" },
  { symbol: "MKR", name: "Maker", pair: "MKRUSDT" },
  { symbol: "STX", name: "Stacks", pair: "STXUSDT" },
  { symbol: "RUNE", name: "THORChain", pair: "RUNEUSDT" },
  { symbol: "SEI", name: "Sei", pair: "SEIUSDT" },
  { symbol: "TIA", name: "Celestia", pair: "TIAUSDT" },
  { symbol: "WLD", name: "Worldcoin", pair: "WLDUSDT" },
  { symbol: "FET", name: "Fetch.ai", pair: "FETUSDT" },
  { symbol: "RENDER", name: "Render", pair: "RENDERUSDT" },
  { symbol: "QNT", name: "Quant", pair: "QNTUSDT" },
  { symbol: "MANA", name: "Decentraland", pair: "MANAUSDT" },
  { symbol: "SAND", name: "The Sandbox", pair: "SANDUSDT" },
  { symbol: "AXS", name: "Axie Infinity", pair: "AXSUSDT" },
  { symbol: "EGLD", name: "MultiversX", pair: "EGLDUSDT" },
  { symbol: "FLOW", name: "Flow", pair: "FLOWUSDT" },
  { symbol: "KAVA", name: "Kava", pair: "KAVAUSDT" },
  { symbol: "EOS", name: "EOS", pair: "EOSUSDT" },
  { symbol: "XTZ", name: "Tezos", pair: "XTZUSDT" },
  { symbol: "THETA", name: "Theta Network", pair: "THETAUSDT" },
  { symbol: "CHZ", name: "Chiliz", pair: "CHZUSDT" },
  { symbol: "CRV", name: "Curve DAO", pair: "CRVUSDT" },
  { symbol: "COMP", name: "Compound", pair: "COMPUSDT" },
  { symbol: "SNX", name: "Synthetix", pair: "SNXUSDT" },
  { symbol: "ZEC", name: "Zcash", pair: "ZECUSDT" },
  { symbol: "DASH", name: "Dash", pair: "DASHUSDT" },
  { symbol: "ENJ", name: "Enjin Coin", pair: "ENJUSDT" },
  { symbol: "BAT", name: "Basic Attention Token", pair: "BATUSDT" },
  { symbol: "ZIL", name: "Zilliqa", pair: "ZILUSDT" },
  { symbol: "IOTA", name: "IOTA", pair: "IOTAUSDT" },
  { symbol: "ONE", name: "Harmony", pair: "ONEUSDT" },
  { symbol: "ANKR", name: "Ankr", pair: "ANKRUSDT" },
  { symbol: "LRC", name: "Loopring", pair: "LRCUSDT" },
  { symbol: "KSM", name: "Kusama", pair: "KSMUSDT" },
  { symbol: "MINA", name: "Mina", pair: "MINAUSDT" },
  { symbol: "DYDX", name: "dYdX", pair: "DYDXUSDT" },
  { symbol: "GMX", name: "GMX", pair: "GMXUSDT" },
  { symbol: "LDO", name: "Lido DAO", pair: "LDOUSDT" },
  { symbol: "PEPE", name: "Pepe", pair: "PEPEUSDT" },
  { symbol: "FLOKI", name: "Floki", pair: "FLOKIUSDT" },
  { symbol: "BONK", name: "Bonk", pair: "BONKUSDT" },
  { symbol: "WIF", name: "dogwifhat", pair: "WIFUSDT" },
  { symbol: "JUP", name: "Jupiter", pair: "JUPUSDT" },
  { symbol: "PYTH", name: "Pyth Network", pair: "PYTHUSDT" },
  { symbol: "STRK", name: "Starknet", pair: "STRKUSDT" },
  { symbol: "JTO", name: "Jito", pair: "JTOUSDT" },
  { symbol: "ORDI", name: "ORDI", pair: "ORDIUSDT" },
  { symbol: "AR", name: "Arweave", pair: "ARUSDT" },
  { symbol: "IMX", name: "Immutable", pair: "IMXUSDT" },
  { symbol: "GALA", name: "Gala", pair: "GALAUSDT" },
  { symbol: "ROSE", name: "Oasis Network", pair: "ROSEUSDT" },
  { symbol: "CFX", name: "Conflux", pair: "CFXUSDT" },
  { symbol: "BLUR", name: "Blur", pair: "BLURUSDT" },
  { symbol: "APE", name: "ApeCoin", pair: "APEUSDT" },
  { symbol: "ENS", name: "Ethereum Name Service", pair: "ENSUSDT" },
  { symbol: "MASK", name: "Mask Network", pair: "MASKUSDT" },
  { symbol: "AGIX", name: "SingularityNET", pair: "AGIXUSDT" },
  { symbol: "1INCH", name: "1inch", pair: "1INCHUSDT" },
  { symbol: "CAKE", name: "PancakeSwap", pair: "CAKEUSDT" },
  { symbol: "SUSHI", name: "SushiSwap", pair: "SUSHIUSDT" },
  { symbol: "YFI", name: "yearn.finance", pair: "YFIUSDT" },
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

  const data: unknown = await res.json();

  return Array.isArray(data)
    ? data
        .map((row) => (Array.isArray(row) ? Number(row[4]) : Number.NaN))
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
        .map((row: { close?: number | string }) => Number(row?.close))
        .filter((value: number) => Number.isFinite(value))
    : [];
}

async function fetchCloses(symbol: string, pair: string, timeframe: TimeframeKey) {
  try {
    return await fetchBinanceCloses(pair, timeframe);
  } catch {
    return await fetchCryptoCompareCloses(symbol, timeframe);
  }
}

async function buildClientRow(coin: Coin): Promise<RsiRow> {
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

async function buildClientRowsInBatches(coins: Coin[], batchSize = 8): Promise<RsiRow[]> {
  const output: RsiRow[] = [];

  for (let i = 0; i < coins.length; i += batchSize) {
    const batch = coins.slice(i, i + batchSize);
    const batchRows = await Promise.all(batch.map(buildClientRow));
    output.push(...batchRows);
  }

  return output;
}

function hasRealRsi(rows: RsiRow[]) {
  return rows.some((row) => TIMEFRAMES.some((tf) => typeof row.rsi?.[tf] === "number"));
}

function normalizeApiRow(row: Partial<RsiRow>, coin: Coin): RsiRow {
  return {
    symbol: row.symbol ?? coin.symbol,
    name: row.name ?? coin.name,
    pair: row.pair ?? coin.pair,
    logoUrl: row.logoUrl ?? getLogoUrl(coin.symbol),
    price: typeof row.price === "number" ? row.price : null,
    rsi: {
      ...emptyRsi(),
      ...(row.rsi ?? {}),
    },
  };
}

function mergeRowsWithCoinList(apiRows: RsiRow[], clientRows: RsiRow[]) {
  const apiMap = new Map(apiRows.map((row) => [row.symbol, row]));
  const clientMap = new Map(clientRows.map((row) => [row.symbol, row]));

  return COINS.map((coin) => {
    const apiRow = apiMap.get(coin.symbol);
    const clientRow = clientMap.get(coin.symbol);

    if (apiRow && hasRealRsi([apiRow])) return normalizeApiRow(apiRow, coin);
    if (clientRow) return clientRow;

    return {
      symbol: coin.symbol,
      name: coin.name,
      pair: coin.pair,
      logoUrl: getLogoUrl(coin.symbol),
      price: null,
      rsi: emptyRsi(),
    };
  });
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
  return (
    <span style={active ? styles.sortArrowActive : styles.sortArrowInactive}>
      {active ? (direction === "asc" ? "↑" : "↓") : "↕"}
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
  const [updatedAt, setUpdatedAt] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dataSource, setDataSource] = useState("Зареждане...");
  const [currentPage, setCurrentPage] = useState(1);

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
    setCurrentPage(1);
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
            apiRows = data.rows as RsiRow[];
          }
        } catch {}

        const apiSymbolsWithRsi = new Set(
          apiRows
            .filter((row) => hasRealRsi([row]))
            .map((row) => row.symbol)
        );

        const missingCoins = COINS.filter((coin) => !apiSymbolsWithRsi.has(coin.symbol));
        const shouldBuildFallbackRows = !hasRealRsi(apiRows) || missingCoins.length > 0;

        const clientRows = shouldBuildFallbackRows
          ? await buildClientRowsInBatches(missingCoins.length ? missingCoins : COINS)
          : [];

        const finalRows = mergeRowsWithCoinList(apiRows, clientRows);

        if (mounted) {
          setRows(finalRows);
          setUpdatedAt(new Date().toISOString());
          setDataSource(hasRealRsi(apiRows) ? "API + Client fallback" : "Client fallback");
          setCurrentPage(1);
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
          setCurrentPage(1);
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

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / TABLE_PAGE_SIZE));

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * TABLE_PAGE_SIZE;
    return sortedRows.slice(start, start + TABLE_PAGE_SIZE);
  }, [sortedRows, currentPage]);

  const paginationItems = useMemo(() => {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }, [totalPages]);

  const handleSort = (column: SortColumn) => {
    setCurrentPage(1);

    if (sortColumn === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }

    setSortColumn(column);
    setSortDirection(column === "symbol" ? "asc" : "desc");
  };

  const goToPage = (page: number) => {
    setCurrentPage(Math.min(Math.max(page, 1), totalPages));
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
            <p style={styles.subtitle}>
              Реални RSI стойности за всички следени криптовалути по няколко таймфрейма.
            </p>
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
            <div style={styles.refreshBadge}>Coins: {sortedRows.length}</div>
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

          <div style={styles.heatmapScroll}>
            <div
              style={{
                ...styles.heatmapArea,
                width: `${Math.max(1280, sortedRows.length * 54)}px`,
              }}
            >
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
        </div>

        <div style={styles.sectionCard}>
          <div style={styles.sectionHeader}>
            <div>
              <h2 style={styles.sectionTitle}>RSI Table</h2>
              <p style={styles.sectionNote}>
                Показани са {paginatedRows.length} от {sortedRows.length} криптовалути. По 20 криптовалути на страница.
              </p>
            </div>
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
                {paginatedRows.map((row) => (
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

          <div style={styles.paginationWrap}>
            <button
              type="button"
              style={{
                ...styles.paginationButton,
                ...(currentPage === 1 ? styles.paginationButtonDisabled : {}),
              }}
              disabled={currentPage === 1}
              onClick={() => goToPage(currentPage - 1)}
            >
              ← Предишна
            </button>

            <div style={styles.paginationPages}>
              {paginationItems.map((page) => (
                <button
                  key={page}
                  type="button"
                  style={{
                    ...styles.paginationPageButton,
                    ...(currentPage === page ? styles.paginationPageButtonActive : {}),
                  }}
                  onClick={() => goToPage(page)}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              type="button"
              style={{
                ...styles.paginationButton,
                ...(currentPage === totalPages ? styles.paginationButtonDisabled : {}),
              }}
              disabled={currentPage === totalPages}
              onClick={() => goToPage(currentPage + 1)}
            >
              Следваща →
            </button>
          </div>

          <div style={styles.pageCoinList}>
            <div style={styles.pageCoinListTitle}>Криптовалути на страница {currentPage}</div>
            <div style={styles.pageCoinGrid}>
              {paginatedRows.map((row) => (
                <span key={`listed-${row.symbol}`} style={styles.pageCoinPill}>
                  {row.symbol}
                </span>
              ))}
            </div>
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
              Heatmap секцията показва всички криптовалути от списъка, а таблицата е разделена на страници по 20 актива,
              за да остане бърза, четима и удобна за анализ.
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
  sectionNote: {
    color: "#9ca3af",
    fontSize: "13px",
    margin: "6px 0 0",
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
  heatmapScroll: {
    width: "100%",
    overflowX: "auto",
    overflowY: "hidden",
    borderRadius: "16px",
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
    fontSize: "11px",
    fontWeight: 700,
    whiteSpace: "nowrap",
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
  paginationWrap: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    flexWrap: "wrap",
    marginTop: "18px",
    paddingTop: "18px",
    borderTop: "1px solid rgba(255,255,255,0.08)",
  },
  paginationPages: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  paginationButton: {
    background: "rgba(245,158,11,0.12)",
    color: "#fbbf24",
    border: "1px solid rgba(245,158,11,0.24)",
    borderRadius: "12px",
    padding: "10px 14px",
    fontSize: "13px",
    fontWeight: 800,
    cursor: "pointer",
  },
  paginationButtonDisabled: {
    opacity: 0.45,
    cursor: "not-allowed",
  },
  paginationPageButton: {
    width: "38px",
    height: "38px",
    borderRadius: "12px",
    background: "rgba(255,255,255,0.04)",
    color: "#d1d5db",
    border: "1px solid rgba(255,255,255,0.08)",
    fontSize: "13px",
    fontWeight: 800,
    cursor: "pointer",
  },
  paginationPageButtonActive: {
    background: "rgba(245,158,11,0.22)",
    color: "#facc15",
    border: "1px solid rgba(245,158,11,0.38)",
  },
  pageCoinList: {
    marginTop: "18px",
    padding: "14px",
    borderRadius: "14px",
    background: "rgba(255,255,255,0.025)",
    border: "1px solid rgba(255,255,255,0.06)",
  },
  pageCoinListTitle: {
    color: "#d1d5db",
    fontSize: "13px",
    fontWeight: 800,
    marginBottom: "10px",
  },
  pageCoinGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },
  pageCoinPill: {
    color: "#fbbf24",
    background: "rgba(245,158,11,0.11)",
    border: "1px solid rgba(245,158,11,0.18)",
    borderRadius: "999px",
    padding: "6px 10px",
    fontSize: "12px",
    fontWeight: 800,
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