"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "../../lib/supabase/client";
import StockChart from "../components/StockChart";

type PlanType = "basic" | "pro" | "unlimited" | "loading" | "no-user" | "error";
type AssetType = "stock" | "crypto";
type AlertConditionType = "above" | "below";
type NewsCategory = "market" | "company" | "crypto";

type StockResult = {
  source?: string;
  plan?: string;
  tier?: "basic" | "pro" | "unlimited";
  assetType?: AssetType;
  companyInfo?: {
    symbol?: string | null;
    name?: string | null;
    sector?: string | null;
    industry?: string | null;
    description?: string | null;
    website?: string | null;
    country?: string | null;
    exchange?: string | null;
    currency?: string | null;
  };
  price?: number | null;
  peRatio?: number | null;
  roe?: number | null;
  operatingMargin?: number | null;
  netMargin?: number | null;
  debtToEquity?: number | null;
  purchaseSignal?: string;
  aiScore?: {
    score?: number;
    signal?: string;
  };
  revenue?: number | null;
  marketCap?: number | null;
  eps?: number | null;
  realValue?: number | null;
  aiAnalysis?: {
    summary?: string;
    bullCase?: string[];
    bearCase?: string[];
    fairValueView?: string;
  };
  extraMetrics?: {
    freeCashFlow?: number | null;
    roic?: number | null;
    currentRatio?: number | null;
    revenueGrowth?: number | null;
    earningsGrowth?: number | null;
    dividendYield?: number | null;
  };
  cryptoAnalysisEnabled?: boolean;
  dailyLimit?: number;
  usedToday?: number;
  remainingToday?: number;
  error?: string;
};

type MarketOverviewItem = {
  symbol: string;
  name: string;
  logoUrl?: string | null;
  price: number | null;
  change?: number | null;
  changePercent?: number | null;
  sparkline?: number[] | null;
};

type MarketOverviewResponse = {
  stocks: MarketOverviewItem[];
  cryptos: MarketOverviewItem[];
  updatedAt?: string;
};

type WatchlistItem = {
  symbol: string;
  name: string;
  assetType: AssetType;
};

type WatchlistApiRow = {
  id?: string;
  email?: string;
  symbol: string;
  asset_type: AssetType;
  created_at?: string;
};

type AlertApiRow = {
  id: string;
  symbol: string;
  asset_type: AssetType;
  condition_type: AlertConditionType;
  target_price: number;
  created_at?: string;
};

type AlertItem = {
  id: string;
  symbol: string;
  assetType: AssetType;
  conditionType: AlertConditionType;
  targetPrice: number;
};

type AlertPriceMap = Record<
  string,
  {
    price: number | null;
    changePercent: number | null;
  }
>;

type NewsItem = {
  title: string;
  source: string;
  category: NewsCategory;
  url: string;
  summary: string;
  tag: string;
};

const NEWS_ITEMS: NewsItem[] = [
  {
    category: "market",
    tag: "Macro",
    source: "MarketWatch",
    title: "Markets: indexes, bonds, dollar and central banks",
    summary:
      "Live market coverage for S&P 500, Nasdaq, bond yields, the dollar and interest-rate expectations.",
    url: "https://www.marketwatch.com/markets",
  },
  {
    category: "market",
    tag: "Indexes",
    source: "Reuters",
    title: "Global markets: Europe, United States and Asia",
    summary:
      "Direct access to global market coverage, risk-on/risk-off sentiment and major macro catalysts.",
    url: "https://www.reuters.com/markets/",
  },
  {
    category: "company",
    tag: "AI Stocks",
    source: "Yahoo Finance",
    title: "Company news: Nvidia, Apple, Tesla, Microsoft",
    summary:
      "Track earnings, AI investments, guidance, margins and product updates from the most-watched companies.",
    url: "https://finance.yahoo.com/topic/stock-market-news/",
  },
  {
    category: "company",
    tag: "Earnings",
    source: "Investing.com",
    title: "Earnings season: revenue, EPS, margins and guidance",
    summary:
      "Follow company earnings reports and market reactions after results are published.",
    url: "https://www.investing.com/earnings-calendar/",
  },
  {
    category: "crypto",
    tag: "Bitcoin",
    source: "CoinDesk",
    title: "Crypto news: Bitcoin, Ethereum, ETFs and regulation",
    summary:
      "Follow spot ETF flows, regulation, institutional demand and major moves in BTC and ETH.",
    url: "https://www.coindesk.com/",
  },
  {
    category: "crypto",
    tag: "Altcoins",
    source: "CoinDesk",
    title: "Altcoins and crypto market: Solana, BNB, XRP, Chainlink",
    summary:
      "Track liquidity, on-chain activity, ecosystems, DeFi and major altcoin moves.",
    url: "https://www.coindesk.com/markets/",
  },
];

const KNOWN_CRYPTO_SYMBOLS = new Set([
  "BTC",
  "ETH",
  "BNB",
  "SOL",
  "XRP",
  "ADA",
  "DOGE",
  "TRX",
  "TON",
  "AVAX",
  "SHIB",
  "DOT",
  "LINK",
  "LTC",
  "BCH",
  "XLM",
  "ATOM",
  "UNI",
  "APT",
  "NEAR",
  "FIL",
  "ARB",
  "OP",
  "INJ",
  "SUI",
  "HBAR",
  "VET",
  "ALGO",
  "AAVE",
  "MKR",
  "RUNE",
  "TIA",
  "SEI",
  "PEPE",
]);

function formatLargeNumber(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "No data";
  if (value >= 1_000_000_000_000) return `${(value / 1_000_000_000_000).toFixed(2)}T`;
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  return value.toLocaleString();
}

function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "No data";
  return value.toFixed(2);
}

function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "No data";
  return `${(value * 100).toFixed(2)}%`;
}

function safeText(value?: string | null) {
  if (!value || !value.trim()) return "No data";
  return value;
}

function formatMarketPrice(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  if (value >= 1000) return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (value >= 1) return value.toFixed(2);
  return value.toFixed(4);
}

function formatChange(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}`;
}

function formatChangePercentSimple(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function getChangeColor(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "#cbd5e1";
  if (value > 0) return "#22c55e";
  if (value < 0) return "#ef4444";
  return "#cbd5e1";
}

function buildForcedSparkline(
  price: number | null | undefined,
  changePercent: number | null | undefined,
  points = 20
): number[] {
  const safePrice =
    typeof price === "number" && Number.isFinite(price) && price > 0 ? price : 100;

  const safeChange =
    typeof changePercent === "number" && Number.isFinite(changePercent)
      ? changePercent
      : 0;

  const trendDirection = safeChange >= 0 ? 1 : -1;
  const startPrice = safePrice * (1 - safeChange / 100);

  const baseStart =
    Number.isFinite(startPrice) && startPrice > 0
      ? startPrice
      : safePrice * (trendDirection > 0 ? 0.96 : 1.04);

  const data: number[] = [];

  for (let i = 0; i < points; i++) {
    const progress = points === 1 ? 1 : i / (points - 1);
    const trend = baseStart + (safePrice - baseStart) * progress;
    const wave1 = Math.sin(progress * Math.PI * 2) * safePrice * 0.01;
    const wave2 = Math.cos(progress * Math.PI * 4) * safePrice * 0.003;
    const wave3 = Math.sin(progress * Math.PI * 7) * safePrice * 0.002;
    const point = trend + wave1 + wave2 + wave3;

    data.push(Number(point.toFixed(6)));
  }

  return data;
}

function getCryptoTradingViewSymbol(symbol?: string | null) {
  const clean = (symbol || "").trim().toUpperCase();

  const map: Record<string, string> = {
    BTC: "BINANCE:BTCUSDT",
    ETH: "BINANCE:ETHUSDT",
    SOL: "BINANCE:SOLUSDT",
    BNB: "BINANCE:BNBUSDT",
    XRP: "BINANCE:XRPUSDT",
    ADA: "BINANCE:ADAUSDT",
    DOGE: "BINANCE:DOGEUSDT",
    TRX: "BINANCE:TRXUSDT",
    TON: "BINANCE:TONUSDT",
    AVAX: "BINANCE:AVAXUSDT",
    SHIB: "BINANCE:SHIBUSDT",
    DOT: "BINANCE:DOTUSDT",
    LINK: "BINANCE:LINKUSDT",
    LTC: "BINANCE:LTCUSDT",
    BCH: "BINANCE:BCHUSDT",
    XLM: "BINANCE:XLMUSDT",
    ATOM: "BINANCE:ATOMUSDT",
    UNI: "BINANCE:UNIUSDT",
    APT: "BINANCE:APTUSDT",
    NEAR: "BINANCE:NEARUSDT",
    FIL: "BINANCE:FILUSDT",
    ARB: "BINANCE:ARBUSDT",
    OP: "BINANCE:OPUSDT",
    INJ: "BINANCE:INJUSDT",
    SUI: "BINANCE:SUIUSDT",
    HBAR: "BINANCE:HBARUSDT",
  };

  return map[clean] || `BINANCE:${clean}USDT`;
}

function isAlertTriggered(
  conditionType: AlertConditionType,
  targetPrice: number,
  currentPrice: number | null | undefined
) {
  if (currentPrice === null || currentPrice === undefined || Number.isNaN(currentPrice)) {
    return false;
  }

  if (conditionType === "above") {
    return currentPrice >= targetPrice;
  }

  return currentPrice <= targetPrice;
}

function CryptoChart({ symbol }: { symbol: string }) {
  const tradingViewSymbol = getCryptoTradingViewSymbol(symbol);

  return (
    <div style={styles.chartCard}>
      <div style={styles.chartHeader}>
        <div style={styles.chartTitle}>Графика</div>
        <div style={styles.chartSubTitle}>{symbol}/USDT</div>
      </div>

      <div style={styles.chartFrameWrap}>
        <iframe
          key={tradingViewSymbol}
          src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_crypto_chart&symbol=${encodeURIComponent(
            tradingViewSymbol
          )}&interval=D&hidesidetoolbar=1&symboledit=1&saveimage=0&toolbarbg=F1F3F6&studies=[]&theme=dark&style=1&timezone=Etc%2FUTC&withdateranges=1&hidevolume=0&allow_symbol_change=1`}
          style={styles.chartIframe}
          title={`Crypto Chart ${symbol}`}
        />
      </div>
    </div>
  );
}

function Sparkline({
  data,
  positive,
}: {
  data?: number[] | null;
  positive: boolean;
}) {
  const safeData = Array.isArray(data)
    ? data.filter((value): value is number => Number.isFinite(value))
    : [];

  if (safeData.length < 2) {
    return (
      <div style={styles.sparklinePlaceholderWrap}>
        <div style={styles.sparklinePlaceholderLine} />
      </div>
    );
  }

  const width = 84;
  const height = 28;
  const padding = 2;

  const min = Math.min(...safeData);
  const max = Math.max(...safeData);
  const range = max - min || 1;

  const points = safeData
    .map((value, index) => {
      const x = padding + (index / (safeData.length - 1)) * (width - padding * 2);
      const y =
        height -
        padding -
        ((value - min) / range) * (height - padding * 2);

      return `${x},${y}`;
    })
    .join(" ");

  const lineColor = positive ? "#22c55e" : "#ef4444";
  const gradientId = `sparkline-gradient-${positive ? "up" : "down"}-${safeData.length}-${Math.round(
    safeData[0] ?? 0
  )}`;

  const areaPoints = `${padding},${height - padding} ${points} ${width - padding},${height - padding}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="84"
      height="28"
      style={styles.sparklineSvg}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop
            offset="0%"
            stopColor={positive ? "#22c55e" : "#ef4444"}
            stopOpacity="0.35"
          />
          <stop
            offset="100%"
            stopColor={positive ? "#22c55e" : "#ef4444"}
            stopOpacity="0.04"
          />
        </linearGradient>
      </defs>

      <polygon points={areaPoints} fill={`url(#${gradientId})`} />

      <polyline
        fill="none"
        stroke={lineColor}
        strokeWidth="2"
        points={points}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AssetLogo({
  symbol,
  name,
  logoUrl,
}: {
  symbol: string;
  name: string;
  logoUrl?: string | null;
}) {
  const [imgError, setImgError] = useState(false);

  const showImage = !!logoUrl && !imgError;
  const fallbackText = symbol.slice(0, 1).toUpperCase();

  return (
    <div style={styles.logoHolder} title={name}>
      {showImage ? (
        <img
          src={logoUrl}
          alt={name}
          style={styles.logoImage}
          onError={() => setImgError(true)}
        />
      ) : (
        <div style={styles.logoFallback}>{fallbackText}</div>
      )}
    </div>
  );
}

function MarketOverviewCard({
  title,
  items,
  type,
  onSelectSymbol,
  disabled,
}: {
  title: string;
  items: MarketOverviewItem[];
  type: "stocks" | "crypto";
  onSelectSymbol: (symbol: string) => void;
  disabled: boolean;
}) {
  return (
    <div style={styles.sideCard}>
      <div style={styles.marketCardHeader}>
        <h3 style={styles.marketCardTitle}>{title}</h3>
        <div style={styles.liveBadge}>LIVE</div>
      </div>

      <div style={styles.marketHeaderRow}>
        <div style={{ ...styles.marketHeaderCell, flex: 1.8 }}>Symbol</div>
        <div style={{ ...styles.marketHeaderCell, width: "82px", textAlign: "center" }}>
          Trend
        </div>
        <div style={{ ...styles.marketHeaderCell, flex: 1, textAlign: "right" }}>
          Price
        </div>
        <div style={{ ...styles.marketHeaderCell, flex: 1, textAlign: "right" }}>
          {type === "stocks" ? "Change" : "24h"}
        </div>
      </div>

      <div style={styles.marketList}>
        {items.map((item, index) => {
          const positive = (item.changePercent ?? 0) >= 0;

          return (
            <button
              key={`${type}-${item.symbol}`}
              type="button"
              onClick={() => onSelectSymbol(item.symbol)}
              disabled={disabled}
              style={{
                ...styles.marketRowButton,
                ...(disabled ? styles.marketRowButtonDisabled : {}),
              }}
              title={`Analyze ${item.symbol}`}
            >
              <div style={styles.marketRow}>
                <div style={styles.marketSymbolCell}>
                  <div style={styles.marketIndex}>{index + 1}</div>

                  <AssetLogo
                    symbol={item.symbol}
                    name={item.name}
                    logoUrl={item.logoUrl}
                  />

                  <div style={styles.marketTextWrap}>
                    <div style={styles.marketSymbol}>{item.symbol}</div>
                    <div style={styles.marketName}>{item.name}</div>
                  </div>
                </div>

                <div style={styles.marketSparkCell}>
                  <Sparkline data={item.sparkline} positive={positive} />
                </div>

                <div style={styles.marketPriceCell}>
                  {formatMarketPrice(item.price)}
                </div>

                <div
                  style={{
                    ...styles.marketChangeCell,
                    color: getChangeColor(item.changePercent),
                  }}
                >
                  {type === "stocks"
                    ? `${formatChange(item.change)} (${formatChangePercentSimple(item.changePercent)})`
                    : formatChangePercentSimple(item.changePercent)}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WatchlistCard({
  items,
  marketMap,
  onSelectSymbol,
  onRemove,
  disabled,
}: {
  items: WatchlistItem[];
  marketMap: Record<string, MarketOverviewItem>;
  onSelectSymbol: (symbol: string) => void;
  onRemove: (symbol: string) => void;
  disabled: boolean;
}) {
  return (
    <div style={styles.sideCard}>
      <div style={styles.marketCardHeader}>
        <h3 style={styles.marketCardTitle}>Watchlist</h3>
        <div style={styles.watchlistCount}>{items.length}</div>
      </div>

      {items.length === 0 ? (
        <div style={styles.watchlistEmpty}>
          Add an asset to your watchlist and it will appear here.
        </div>
      ) : (
        <div style={styles.watchlistList}>
          {items.map((item) => {
            const marketData = marketMap[item.symbol];
            const changePercent = marketData?.changePercent ?? null;
            const change = marketData?.change ?? null;
            const price = marketData?.price ?? null;
            const logoUrl = marketData?.logoUrl ?? null;

            return (
              <div key={`${item.assetType}-${item.symbol}`} style={styles.watchlistRow}>
                <button
                  type="button"
                  onClick={() => onSelectSymbol(item.symbol)}
                  disabled={disabled}
                  style={styles.watchlistMainButton}
                  title={`Analyze ${item.symbol}`}
                >
                  <div style={styles.watchlistTop}>
                    <div style={styles.watchlistIdentity}>
                      <AssetLogo
                        symbol={item.symbol}
                        name={item.name}
                        logoUrl={logoUrl}
                      />

                      <div style={styles.marketTextWrap}>
                        <div style={styles.watchlistSymbol}>{item.symbol}</div>
                        <div style={styles.watchlistName}>{item.name}</div>
                      </div>
                    </div>

                    <div style={styles.watchlistPriceWrap}>
                      <div style={styles.watchlistPrice}>
                        {formatMarketPrice(price)}
                      </div>

                      <div
                        style={{
                          ...styles.watchlistChange,
                          color: getChangeColor(changePercent),
                        }}
                      >
                        {item.assetType === "stock"
                          ? `${formatChange(change)} (${formatChangePercentSimple(changePercent)})`
                          : formatChangePercentSimple(changePercent)}
                      </div>
                    </div>
                  </div>
                </button>

                <div style={styles.watchlistMeta}>
                  <span
                    style={{
                      ...styles.watchTypeBadge,
                      ...(item.assetType === "crypto"
                        ? styles.watchTypeCrypto
                        : styles.watchTypeStock),
                    }}
                  >
                    {item.assetType === "crypto" ? "Crypto" : "Stock"}
                  </span>

                  <button
                    type="button"
                    onClick={() => onRemove(item.symbol)}
                    style={styles.watchlistRemoveButton}
                    title={`Remove ${item.symbol}`}
                  >
                    ×
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AlertsCard({
  alerts,
  alertPrices,
  formSymbol,
  setFormSymbol,
  formAssetType,
  setFormAssetType,
  formConditionType,
  setFormConditionType,
  formTargetPrice,
  setFormTargetPrice,
  onCreateAlert,
  onDeleteAlert,
  disabled,
}: {
  alerts: AlertItem[];
  alertPrices: AlertPriceMap;
  formSymbol: string;
  setFormSymbol: (value: string) => void;
  formAssetType: AssetType;
  setFormAssetType: (value: AssetType) => void;
  formConditionType: AlertConditionType;
  setFormConditionType: (value: AlertConditionType) => void;
  formTargetPrice: string;
  setFormTargetPrice: (value: string) => void;
  onCreateAlert: () => Promise<void>;
  onDeleteAlert: (id: string) => Promise<void>;
  disabled: boolean;
}) {
  return (
    <div style={styles.sideCard}>
      <div style={styles.marketCardHeader}>
        <h3 style={styles.marketCardTitle}>Alerts</h3>
        <div style={styles.watchlistCount}>{alerts.length}</div>
      </div>

      <div style={styles.alertForm}>
        <input
          value={formSymbol}
          onChange={(e) => setFormSymbol(e.target.value.toUpperCase())}
          placeholder="Symbol"
          style={styles.alertInput}
        />

        <select
          value={formAssetType}
          onChange={(e) => setFormAssetType(e.target.value as AssetType)}
          style={styles.alertSelect}
        >
          <option value="stock">Stock</option>
          <option value="crypto">Crypto</option>
        </select>

        <select
          value={formConditionType}
          onChange={(e) => setFormConditionType(e.target.value as AlertConditionType)}
          style={styles.alertSelect}
        >
          <option value="above">Above price</option>
          <option value="below">Below price</option>
        </select>

        <input
          value={formTargetPrice}
          onChange={(e) => setFormTargetPrice(e.target.value)}
          placeholder="Target price"
          type="number"
          step="0.0001"
          style={styles.alertInput}
        />

        <button
          type="button"
          onClick={onCreateAlert}
          style={styles.createAlertButton}
          disabled={disabled}
        >
          Create alert
        </button>
      </div>

      {alerts.length === 0 ? (
        <div style={styles.watchlistEmpty}>
          You do not have alerts yet. Create your first price trigger.
        </div>
      ) : (
        <div style={styles.alertsList}>
          {alerts.map((alert) => {
            const currentPrice = alertPrices[alert.symbol]?.price ?? null;
            const triggered = isAlertTriggered(
              alert.conditionType,
              alert.targetPrice,
              currentPrice
            );

            return (
              <div key={alert.id} style={styles.alertRow}>
                <div style={styles.alertRowTop}>
                  <div>
                    <div style={styles.alertSymbol}>{alert.symbol}</div>
                    <div style={styles.alertCondition}>
                      {alert.conditionType === "above" ? "Над" : "Под"}{" "}
                      {formatMarketPrice(alert.targetPrice)}
                    </div>
                  </div>

                  <div
                    style={{
                      ...styles.alertStatus,
                      ...(triggered
                        ? styles.alertStatusTriggered
                        : styles.alertStatusPending),
                    }}
                  >
                    {triggered ? "Triggered" : "Assetен"}
                  </div>
                </div>

                <div style={styles.alertRowBottom}>
                  <div style={styles.alertCurrentPrice}>
                    Current price: {formatMarketPrice(currentPrice)}
                  </div>

                  <div style={styles.alertActions}>
                    <span
                      style={{
                        ...styles.watchTypeBadge,
                        ...(alert.assetType === "crypto"
                          ? styles.watchTypeCrypto
                          : styles.watchTypeStock),
                      }}
                    >
                      {alert.assetType === "crypto" ? "Crypto" : "Stock"}
                    </span>

                    <button
                      type="button"
                      onClick={() => onDeleteAlert(alert.id)}
                      style={styles.watchlistRemoveButton}
                      title="Delete alert"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AlertsLockedCard() {
  return (
    <div style={styles.sideCard}>
      <div style={styles.marketCardHeader}>
        <h3 style={styles.marketCardTitle}>Alerts</h3>
        <div style={styles.lockedBadge}>PRO+</div>
      </div>

      <div style={styles.lockedCardText}>
        The Alerts feature is available only for <strong>PRO</strong> and{" "}
        <strong>UNLIMITED</strong>.
      </div>

      <div style={styles.lockedCardSubtext}>
        Upgrade your plan to create price alerts and track when an asset reaches a target price.
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={styles.metricCard}>
      <div style={styles.metricLabel}>{label}</div>
      <div style={styles.metricValue}>{value}</div>
    </div>
  );
}

function NewsSection({
  title,
  subtitle,
  category,
}: {
  title: string;
  subtitle: string;
  category: NewsCategory;
}) {
  const items = NEWS_ITEMS.filter((item) => item.category === category);

  return (
    <div style={styles.newsSection}>
      <div style={styles.newsSectionHeader}>
        <div>
          <h3 style={styles.newsSectionTitle}>{title}</h3>
          <p style={styles.newsSectionSubtitle}>{subtitle}</p>
        </div>

        <span style={styles.newsLiveBadge}>LIVE FEED</span>
      </div>

      <div style={styles.newsList}>
        {items.map((item) => (
          <a
            key={item.title}
            href={item.url}
            target="_blank"
            rel="noreferrer"
            style={styles.newsCard}
          >
            <div style={styles.newsTopRow}>
              <span style={styles.newsTag}>{item.tag}</span>
              <span style={styles.newsSource}>{item.source}</span>
            </div>

            <div style={styles.newsTitle}>{item.title}</div>
            <div style={styles.newsSummary}>{item.summary}</div>

            <div style={styles.newsOpenText}>Open live source →</div>
          </a>
        ))}
      </div>
    </div>
  );
}

function DashboardNewsHome() {
  return (
    <div style={styles.newsHome}>
      <div style={styles.newsHero}>
        <div>
          <div style={styles.newsHeroBadge}>MARKET DESK</div>
          <h2 style={styles.newsHeroTitle}>Market News Hub</h2>
          <p style={styles.newsHeroText}>
            Before running an analysis, this area gives users quick access to reliable market,
            company and crypto news sources. After entering a ticker and pressing
            “Analyze”, this area is replaced by the full asset analysis.
          </p>
        </div>
      </div>

      <div style={styles.newsGrid}>
        <NewsSection
          title="Market News"
          subtitle="Indexes, central banks, inflation, bonds and global risk."
          category="market"
        />

        <NewsSection
          title="Company News"
          subtitle="AI stocks, earnings, guidance, margins and major movers."
          category="company"
        />

        <NewsSection
          title="Crypto News"
          subtitle="Bitcoin, Ethereum, ETF flows, regulation and altcoins."
          category="crypto"
        />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const supabase = createClient();

  const [plan, setPlan] = useState<PlanType>("loading");
  const [accessActive, setAccessActive] = useState<boolean>(false);
  const [remaining, setRemaining] = useState<number>(0);
  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [ticker, setTicker] = useState<string>("");
  const [stockResult, setStockResult] = useState<StockResult | null>(null);
  const [overview, setOverview] = useState<MarketOverviewResponse>({
    stocks: [],
    cryptos: [],
  });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [watchlistLoading, setWatchlistLoading] = useState<boolean>(false);

  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [alertsLoading, setAlertsLoading] = useState<boolean>(false);
  const [alertPrices, setAlertPrices] = useState<AlertPriceMap>({});
  const [alertPricesLoading, setAlertPricesLoading] = useState<boolean>(false);

  const [alertSymbol, setAlertSymbol] = useState("");
  const [alertAssetType, setAlertAssetType] = useState<AssetType>("stock");
  const [alertConditionType, setAlertConditionType] =
    useState<AlertConditionType>("above");
  const [alertTargetPrice, setAlertTargetPrice] = useState("");

  const cleanedTicker = useMemo(() => ticker.trim().toUpperCase(), [ticker]);
  const isLikelyCrypto = useMemo(() => KNOWN_CRYPTO_SYMBOLS.has(cleanedTicker), [cleanedTicker]);

  const marketMap = useMemo(() => {
    const combined = [...overview.stocks, ...overview.cryptos];
    return combined.reduce<Record<string, MarketOverviewItem>>((acc, item) => {
      acc[item.symbol] = item;
      return acc;
    }, {});
  }, [overview]);

  const alertsEnabled = plan === "pro" || plan === "unlimited";
  const rsiEnabled = plan === "pro" || plan === "unlimited";

  const currentAssetType: AssetType =
    stockResult?.assetType === "crypto" ? "crypto" : "stock";

  const currentSymbol = stockResult?.companyInfo?.symbol?.trim().toUpperCase() || "";
  const currentName = stockResult?.companyInfo?.name?.trim() || currentSymbol || "Asset";

  const isCurrentInWatchlist = useMemo(() => {
    if (!currentSymbol) return false;
    return watchlist.some((item) => item.symbol === currentSymbol);
  }, [watchlist, currentSymbol]);

  const getCurrentDailyLimit = (currentPlan: PlanType, isActive: boolean) => {
    if (currentPlan === "basic" && !isActive) return 5;
    if (currentPlan === "basic" && isActive) return 10;
    if (currentPlan === "pro") return 20;
    if (currentPlan === "unlimited") return 999999;
    return 0;
  };

  const loadWatchlist = async () => {
    try {
      setWatchlistLoading(true);

      const res = await fetch("/api/watchlist", {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("WATCHLIST LOAD ERROR:", data?.error || "Unknown error");
        return;
      }

      const rows = Array.isArray(data) ? (data as WatchlistApiRow[]) : [];

      const mapped: WatchlistItem[] = rows.map((item) => ({
        symbol: item.symbol,
        name: item.symbol,
        assetType: item.asset_type,
      }));

      setWatchlist(mapped);
    } catch (error) {
      console.error("WATCHLIST FETCH ERROR:", error);
    } finally {
      setWatchlistLoading(false);
    }
  };

  const loadAlerts = async () => {
    if (!alertsEnabled) {
      setAlerts([]);
      return;
    }

    try {
      setAlertsLoading(true);

      const res = await fetch("/api/alerts", {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("ALERTS LOAD ERROR:", data?.error || "Unknown error");
        return;
      }

      const rows = Array.isArray(data) ? (data as AlertApiRow[]) : [];

      const mapped: AlertItem[] = rows.map((item) => ({
        id: item.id,
        symbol: item.symbol,
        assetType: item.asset_type,
        conditionType: item.condition_type,
        targetPrice: Number(item.target_price),
      }));

      setAlerts(mapped);
    } catch (error) {
      console.error("ALERTS FETCH ERROR:", error);
    } finally {
      setAlertsLoading(false);
    }
  };

  const loadAlertPrices = async (symbols: string[]) => {
    if (!alertsEnabled || symbols.length === 0) {
      setAlertPrices({});
      return;
    }

    try {
      setAlertPricesLoading(true);

      const res = await fetch("/api/alert-prices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ symbols }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("ALERT PRICES ERROR:", data?.error || "Unknown error");
        return;
      }

      setAlertPrices(data || {});
    } catch (error) {
      console.error("ALERT PRICES FETCH ERROR:", error);
    } finally {
      setAlertPricesLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      setIsLoggedIn(!!user);

      if (!user || !user.email) {
        setPlan("no-user");
        setLoading(false);
        return;
      }

      setEmail(user.email);

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

      const today = new Date().toISOString().slice(0, 10);

      const { data: usageData } = await supabase
        .from("daily_usage")
        .select("analyses_used")
        .eq("email", user.email)
        .eq("usage_date", today)
        .maybeSingle();

      const used = usageData?.analyses_used ?? 0;
      const limit = getCurrentDailyLimit(currentPlan, isActive);
      setRemaining(Math.max(limit - used, 0));

      await loadWatchlist();
      setLoading(false);
    };

    loadData();
  }, [supabase]);

  useEffect(() => {
    let isMounted = true;

    const normalizeOverviewItem = (item: any): MarketOverviewItem => {
      const price = Number.isFinite(item?.price) ? item.price : null;
      const change = Number.isFinite(item?.change) ? item.change : null;
      const changePercent = Number.isFinite(item?.changePercent) ? item.changePercent : null;

      const validSparkline = Array.isArray(item?.sparkline)
        ? (item.sparkline.filter((v: unknown): v is number => Number.isFinite(v)) as number[])
        : [];

      return {
        symbol: String(item?.symbol || ""),
        name: String(item?.name || item?.symbol || ""),
        logoUrl: item?.logoUrl || null,
        price,
        change,
        changePercent,
        sparkline:
          validSparkline.length >= 2
            ? validSparkline
            : buildForcedSparkline(price, changePercent, 20),
      };
    };

    const fetchOverview = async () => {
      try {
        const res = await fetch("/api/market-overview", {
          cache: "no-store",
        });

        const data = await res.json();

        if (!res.ok || data?.error) {
          console.error("Market overview error:", data?.error || "Unknown error");
          return;
        }

        if (isMounted) {
          const stocks = Array.isArray(data?.stocks)
            ? data.stocks.map(normalizeOverviewItem)
            : [];

          const cryptos = Array.isArray(data?.cryptos)
            ? data.cryptos.map(normalizeOverviewItem)
            : [];

          setOverview({
            stocks,
            cryptos,
          });
        }
      } catch (error) {
        console.error("Market overview fetch error:", error);
      }
    };

    fetchOverview();

    const interval = setInterval(fetchOverview, 60000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    loadAlerts();
  }, [alertsEnabled]);

  useEffect(() => {
    const symbols = [...new Set(alerts.map((item) => item.symbol))];
    loadAlertPrices(symbols);
  }, [alerts, alertsEnabled]);

  const addCurrentToWatchlist = async () => {
    if (!currentSymbol) return;

    try {
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          symbol: currentSymbol,
          assetType: currentAssetType,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data?.error || "Error при добавяне в watchlist.");
        return;
      }

      setWatchlist((prev) => {
        if (prev.some((item) => item.symbol === currentSymbol)) {
          return prev;
        }

        return [
          {
            symbol: currentSymbol,
            name: currentName,
            assetType: currentAssetType,
          },
          ...prev,
        ];
      });
    } catch (error) {
      console.error("WATCHLIST ADD ERROR:", error);
      alert("Error при добавяне в watchlist.");
    }
  };

  const removeFromWatchlist = async (symbol: string) => {
    try {
      const res = await fetch("/api/watchlist", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ symbol }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data?.error || "Error при премахване от watchlist.");
        return;
      }

      setWatchlist((prev) => prev.filter((item) => item.symbol !== symbol));
    } catch (error) {
      console.error("WATCHLIST DELETE ERROR:", error);
      alert("Error при премахване от watchlist.");
    }
  };

  const toggleCurrentWatchlist = async () => {
    if (!currentSymbol) return;

    if (isCurrentInWatchlist) {
      await removeFromWatchlist(currentSymbol);
      return;
    }

    await addCurrentToWatchlist();
  };

  const createAlert = async () => {
    if (!alertsEnabled) {
      alert("Alerts are available only for PRO and UNLIMITED.");
      return;
    }

    const symbol = alertSymbol.trim().toUpperCase();
    const targetPrice = Number(alertTargetPrice);

    if (!symbol) {
      alert("Enter a symbol.");
      return;
    }

    if (!Number.isFinite(targetPrice) || targetPrice <= 0) {
      alert("Enter a valid price.");
      return;
    }

    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          symbol,
          assetType: alertAssetType,
          conditionType: alertConditionType,
          targetPrice,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data?.error || "Error при създаване на alert.");
        return;
      }

      await loadAlerts();
      setAlertSymbol("");
      setAlertTargetPrice("");
      setAlertConditionType("above");
    } catch (error) {
      console.error("CREATE ALERT ERROR:", error);
      alert("Error при създаване на alert.");
    }
  };

  const deleteAlert = async (id: string) => {
    try {
      const res = await fetch("/api/alerts", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data?.error || "Error при изтриване на alert.");
        return;
      }

      setAlerts((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error("DELETE ALERT ERROR:", error);
      alert("Error при изтриване на alert.");
    }
  };

  const handleAnalyze = async (forcedSymbol?: string) => {
    const symbolToAnalyze = (forcedSymbol ?? ticker).trim().toUpperCase();

    if (!email) {
      alert("No active user.");
      window.location.href = "/auth";
      return;
    }

    if (!symbolToAnalyze) {
      alert("Enter a ticker.");
      return;
    }

    setAnalyzing(true);

    try {
      const res = await fetch("/api/stock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ticker: symbolToAnalyze,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        if (typeof data.remainingToday === "number") {
          setRemaining(data.remainingToday);
        }

        alert(data.error || "Error при анализа.");
        setAnalyzing(false);
        return;
      }

      setStockResult(data);

      if (typeof data.remainingToday === "number") {
        setRemaining(data.remainingToday);
      }

      setTicker("");
    } catch (error) {
      console.error("Analyze error:", error);
      alert("An unexpected error occurred during the analysis.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleQuickSelect = async (symbol: string) => {
    if (analyzing || loading) return;
    setTicker(symbol);
    await handleAnalyze(symbol);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const getPlanLabel = () => {
    if (plan === "loading") return "Loading...";
    if (plan === "no-user") return "No user";
    if (plan === "error") return "Error";
    if (plan === "basic" && !accessActive) return "VISITOR";
    if (plan === "basic" && accessActive) return "BASIC";
    return plan.toUpperCase();
  };

  const getPlanBadgeStyle = () => {
    if (plan === "unlimited") return styles.planBadgeUnlimited;
    if (plan === "pro") return styles.planBadgePro;
    return styles.planBadgeBasic;
  };

  const getFinalAssessmentTitle = () => {
    if (!stockResult) return "Market Mode";
    return stockResult.purchaseSignal || "Final Assessment";
  };

  const getFinalAssessmentText = () => {
    if (!stockResult) {
      return "Select an asset from the list or enter a ticker. After the analysis, the final assessment will appear here.";
    }

    if (stockResult.tier === "basic") {
      return `${stockResult.companyInfo?.name || "Assetът"} currently looks: ${stockResult.purchaseSignal || "No data"}.`;
    }

    return (
      stockResult.aiAnalysis?.summary ||
      `${stockResult.companyInfo?.name || "Assetът"} currently looks: ${stockResult.purchaseSignal || "No data"}.`
    );
  };

  const shouldShowStockChart =
    !!stockResult &&
    (stockResult.tier === "pro" || stockResult.tier === "unlimited") &&
    !!stockResult.companyInfo?.symbol &&
    stockResult.assetType !== "crypto";

  const shouldShowCryptoChart =
    !!stockResult &&
    (stockResult.tier === "pro" || stockResult.tier === "unlimited") &&
    !!stockResult.companyInfo?.symbol &&
    stockResult.assetType === "crypto";

  return (
    <main style={styles.page}>
      <div style={styles.overlay} />

      <div style={styles.wrapper}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Fundamental Analysis Platform</h1>
            <p style={styles.subtitle}>
              Enter a stock ticker or crypto symbol, analyze the asset and track your plan limits.
            </p>
          </div>

          <div style={styles.headerRight}>
            <div style={{ ...styles.planBadgeBase, ...getPlanBadgeStyle() }}>
              <span>{getPlanLabel()}</span>
              {accessActive && plan !== "basic" ? <span style={styles.planBadgeDot} /> : null}
            </div>

            <div style={styles.headerButtons}>
              <button
                style={styles.secondaryButton}
                onClick={() => {
                  window.location.href = "/";
                }}
              >
                Home
              </button>

              <button
                style={styles.secondaryButton}
                onClick={() => {
                  window.location.href = "/pricing";
                }}
              >
                Plans
              </button>

              {rsiEnabled ? (
                <button
                  style={styles.secondaryButton}
                  onClick={() => {
                    window.location.href = "/dashboard/rsi";
                  }}
                >
                  RSI Premium
                </button>
              ) : (
                <button
                  style={styles.rsiLockedButton}
                  onClick={() => {
                    window.location.href = "/pricing";
                  }}
                >
                  RSI Premium 🔒
                </button>
              )}

              {isLoggedIn ? (
                <button style={styles.logoutButton} onClick={handleLogout}>
                  Logout
                </button>
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
          </div>
        </div>

        <div style={styles.searchCard}>
          <input
            type="text"
            placeholder="Enter a stock ticker or crypto symbol, for example AAPL or BTC"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !analyzing && !loading) {
                e.preventDefault();
                handleAnalyze();
              }
            }}
            style={styles.input}
          />

          <button
            style={styles.primaryButton}
            onClick={() => handleAnalyze()}
            disabled={analyzing || loading}
          >
            {analyzing ? "Analyzing..." : "Analyze"}
          </button>
        </div>

        {cleanedTicker ? (
          <div style={styles.hintRow}>
            <span style={styles.hintBadge}>
              Detected type: {isLikelyCrypto ? "Cryptocurrency" : "Stock / company"}
            </span>
          </div>
        ) : null}

        <div style={styles.grid}>
          <div style={styles.mainCard}>
            {!stockResult ? (
              <DashboardNewsHome />
            ) : (
              <>
                <div style={styles.profileCard}>
                  <div style={styles.sectionTitleRow}>
                    <h2 style={styles.sectionTitle}>
                      {stockResult?.assetType === "crypto" ? "Asset Information" : "Company Information"}
                    </h2>

                    {stockResult?.companyInfo?.symbol ? (
                      <button
                        type="button"
                        onClick={toggleCurrentWatchlist}
                        style={{
                          ...styles.watchlistActionButton,
                          ...(isCurrentInWatchlist
                            ? styles.watchlistActionButtonActive
                            : {}),
                        }}
                      >
                        {isCurrentInWatchlist ? "★ In Watchlist" : "☆ Add to Watchlist"}
                      </button>
                    ) : null}
                  </div>

                  <div style={styles.profileTopGrid}>
                    <div style={styles.profileMiniCard}>
                      <div style={styles.resultLabel}>Name</div>
                      <div style={styles.profileMainValue}>
                        {safeText(stockResult.companyInfo?.name)}
                      </div>
                    </div>

                    <div style={styles.profileMiniCard}>
                      <div style={styles.resultLabel}>Symbol</div>
                      <div style={styles.profileMainValue}>
                        {safeText(stockResult.companyInfo?.symbol)}
                      </div>
                    </div>
                  </div>

                  <div style={styles.compactGrid}>
                    <MetricCard
                      label="Sector"
                      value={safeText(stockResult.companyInfo?.sector)}
                    />
                    <MetricCard
                      label="Industry"
                      value={safeText(stockResult.companyInfo?.industry)}
                    />
                    <MetricCard
                      label="Country"
                      value={safeText(stockResult.companyInfo?.country)}
                    />
                    <MetricCard
                      label="Exchange / Source"
                      value={safeText(stockResult.companyInfo?.exchange)}
                    />
                    <MetricCard
                      label="Currency"
                      value={safeText(stockResult.companyInfo?.currency)}
                    />

                    <div style={styles.metricCard}>
                      <div style={styles.metricLabel}>Website</div>
                      <div style={styles.metricValueSmall}>
                        {stockResult.companyInfo?.website ? (
                          <a
                            href={stockResult.companyInfo.website}
                            target="_blank"
                            rel="noreferrer"
                            style={styles.link}
                          >
                            {stockResult.companyInfo.website}
                          </a>
                        ) : (
                          "No data"
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={styles.descriptionCard}>
                    <div style={styles.resultLabel}>
                      {stockResult?.assetType === "crypto" ? "Description" : "Business Description"}
                    </div>
                    <div style={styles.descriptionText}>
                      {safeText(stockResult.companyInfo?.description)}
                    </div>
                  </div>
                </div>

                {shouldShowStockChart && (
                  <div style={{ marginBottom: "20px" }}>
                    <StockChart symbol={stockResult.companyInfo!.symbol!} />
                  </div>
                )}

                {shouldShowCryptoChart && (
                  <div style={{ marginBottom: "20px" }}>
                    <CryptoChart symbol={stockResult.companyInfo!.symbol!} />
                  </div>
                )}

                <div style={styles.sectionHeader}>BASIC</div>
                <div style={styles.compactGrid}>
                  <MetricCard
                    label={stockResult.assetType === "crypto" ? "Asset" : "Company"}
                    value={safeText(stockResult.companyInfo?.name)}
                  />
                  <MetricCard
                    label="Price"
                    value={formatNumber(stockResult.price)}
                  />
                  <MetricCard
                    label="P/E Ratio"
                    value={
                      stockResult.assetType === "crypto"
                        ? "Not applicable"
                        : formatNumber(stockResult.peRatio)
                    }
                  />
                  <MetricCard
                    label="ROE"
                    value={
                      stockResult.assetType === "crypto"
                        ? "Not applicable"
                        : formatPercent(stockResult.roe)
                    }
                  />
                  <MetricCard
                    label="Operating Margin"
                    value={
                      stockResult.assetType === "crypto"
                        ? "Not applicable"
                        : formatPercent(stockResult.operatingMargin)
                    }
                  />
                  <MetricCard
                    label="Net Margin"
                    value={
                      stockResult.assetType === "crypto"
                        ? "Not applicable"
                        : formatPercent(stockResult.netMargin)
                    }
                  />
                  <MetricCard
                    label="Debt / Equity"
                    value={
                      stockResult.assetType === "crypto"
                        ? "Not applicable"
                        : formatNumber(stockResult.debtToEquity)
                    }
                  />
                  <MetricCard
                    label="AI Score"
                    value={
                      stockResult.aiScore?.score && stockResult.aiScore?.signal
                        ? `${stockResult.aiScore.score}/10 (${stockResult.aiScore.signal})`
                        : "No data"
                    }
                  />
                  <MetricCard
                    label="Signal"
                    value={stockResult.purchaseSignal || "No data"}
                  />
                </div>

                {(stockResult.tier === "pro" || stockResult.tier === "unlimited") && (
                  <>
                    <div style={styles.sectionHeader}>PRO</div>
                    <div style={styles.compactGrid}>
                      <MetricCard
                        label={
                          stockResult.assetType === "crypto" ? "Volume / Network Scale" : "Revenue"
                        }
                        value={formatLargeNumber(stockResult.revenue)}
                      />
                      <MetricCard
                        label="Market Cap"
                        value={formatLargeNumber(stockResult.marketCap)}
                      />
                      <MetricCard
                        label="EPS"
                        value={
                          stockResult.assetType === "crypto"
                            ? "Not applicable"
                            : formatNumber(stockResult.eps)
                        }
                      />
                      <MetricCard
                        label="Fair Value"
                        value={formatNumber(stockResult.realValue)}
                      />
                    </div>

                    <div style={styles.aiCard}>
                      <div style={styles.aiTitle}>AI Analysis</div>

                      <p style={styles.aiText}>
                        {stockResult.aiAnalysis?.summary || "Няма AI Analysis"}
                      </p>

                      <div style={styles.aiColumns}>
                        <div style={styles.aiColumn}>
                          <div style={styles.aiSubTitle}>Bull case</div>
                          <ul style={styles.aiList}>
                            {(stockResult.aiAnalysis?.bullCase || []).map((item, index) => (
                              <li key={index}>{item}</li>
                            ))}
                          </ul>
                        </div>

                        <div style={styles.aiColumn}>
                          <div style={styles.aiSubTitle}>Bear case</div>
                          <ul style={styles.aiList}>
                            {(stockResult.aiAnalysis?.bearCase || []).map((item, index) => (
                              <li key={index}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div style={styles.fairValueBox}>
                        <span style={styles.resultLabel}>Fair value view:</span>{" "}
                        <span style={styles.fairValueText}>
                          {stockResult.aiAnalysis?.fairValueView || "No data"}
                        </span>
                      </div>
                    </div>
                  </>
                )}

                {stockResult.tier === "unlimited" && (
                  <>
                    <div style={styles.sectionHeader}>UNLIMITED</div>
                    <div style={styles.compactGrid}>
                      <MetricCard
                        label="Free Cash Flow"
                        value={
                          stockResult.assetType === "crypto"
                            ? "Not applicable"
                            : formatLargeNumber(stockResult.extraMetrics?.freeCashFlow)
                        }
                      />
                      <MetricCard
                        label="ROIC / ROA proxy"
                        value={
                          stockResult.assetType === "crypto"
                            ? "Not applicable"
                            : formatPercent(stockResult.extraMetrics?.roic)
                        }
                      />
                      <MetricCard
                        label="Current Ratio"
                        value={
                          stockResult.assetType === "crypto"
                            ? "Not applicable"
                            : formatNumber(stockResult.extraMetrics?.currentRatio)
                        }
                      />
                      <MetricCard
                        label="Revenue Growth"
                        value={formatPercent(stockResult.extraMetrics?.revenueGrowth)}
                      />
                      <MetricCard
                        label="EPS Growth"
                        value={
                          stockResult.assetType === "crypto"
                            ? "Not applicable"
                            : formatPercent(stockResult.extraMetrics?.earningsGrowth)}
                      />
                      <MetricCard
                        label="Dividend Yield"
                        value={
                          stockResult.assetType === "crypto"
                            ? "Not applicable"
                            : formatPercent(stockResult.extraMetrics?.dividendYield)
                        }
                      />
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          <div style={styles.sidebar}>
            <div style={styles.sideCard}>
              <h3 style={styles.sideTitle}>Final Assessment</h3>
              <div style={styles.badge}>{getFinalAssessmentTitle()}</div>
              <p style={styles.sideText}>{getFinalAssessmentText()}</p>

              {stockResult?.aiScore?.score && stockResult?.aiScore?.signal && (
                <div style={styles.finalAssessmentBox}>
                  <div style={styles.resultLabel}>AI Score</div>
                  <div style={styles.finalAssessmentValue}>
                    {stockResult.aiScore.score}/10 ({stockResult.aiScore.signal})
                  </div>
                </div>
              )}

              {stockResult?.aiAnalysis?.fairValueView && (
                <div style={styles.finalAssessmentBox}>
                  <div style={styles.resultLabel}>Fair value view</div>
                  <div style={styles.finalAssessmentValue}>
                    {stockResult.aiAnalysis.fairValueView}
                  </div>
                </div>
              )}
            </div>

            <div style={styles.sideCard}>
              <h3 style={styles.sideTitle}>Current Plan</h3>

              <div style={styles.planRow}>
                <span style={styles.planKey}>User:</span>
                <span style={styles.planValue}>
                  {email ? email : "No data"}
                </span>
              </div>

              <div style={styles.planRow}>
                <span style={styles.planKey}>Plan:</span>
                <span style={styles.planValue}>{getPlanLabel()}</span>
              </div>

              <div style={styles.planRow}>
                <span style={styles.planKey}>Paid access:</span>
                <span style={styles.planValue}>{accessActive ? "Assetен" : "Inactive"}</span>
              </div>

              <div style={styles.planRow}>
                <span style={styles.planKey}>Remaining analyses:</span>
                <span style={styles.planValue}>{plan === "unlimited" ? "∞" : remaining}</span>
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

            {alertsEnabled ? (
              <AlertsCard
                alerts={alerts}
                alertPrices={alertPrices}
                formSymbol={alertSymbol}
                setFormSymbol={setAlertSymbol}
                formAssetType={alertAssetType}
                setFormAssetType={setAlertAssetType}
                formConditionType={alertConditionType}
                setFormConditionType={setAlertConditionType}
                formTargetPrice={alertTargetPrice}
                setFormTargetPrice={setAlertTargetPrice}
                onCreateAlert={createAlert}
                onDeleteAlert={deleteAlert}
                disabled={alertsLoading || alertPricesLoading || loading}
              />
            ) : (
              <AlertsLockedCard />
            )}

            <WatchlistCard
              items={watchlist}
              marketMap={marketMap}
              onSelectSymbol={handleQuickSelect}
              onRemove={removeFromWatchlist}
              disabled={analyzing || loading || watchlistLoading}
            />

            <MarketOverviewCard
              title="Popular Stocks"
              items={overview.stocks}
              type="stocks"
              onSelectSymbol={handleQuickSelect}
              disabled={analyzing || loading}
            />

            <MarketOverviewCard
              title="Popular Crypto"
              items={overview.cryptos}
              type="crypto"
              onSelectSymbol={handleQuickSelect}
              disabled={analyzing || loading}
            />
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
    padding: "36px 20px",
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
    width: "100%",
    maxWidth: "1360px",
    margin: "0 auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
    marginBottom: "24px",
    flexWrap: "wrap",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    flexWrap: "wrap",
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
  title: {
    color: "white",
    fontSize: "40px",
    fontWeight: 800,
    marginBottom: "10px",
  },
  subtitle: {
    color: "#94a3b8",
    fontSize: "18px",
    margin: 0,
  },
  headerButtons: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  },
  searchCard: {
    display: "flex",
    gap: "14px",
    background: "rgba(10, 20, 40, 0.92)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "20px",
    padding: "14px 18px",
    boxShadow: "0 18px 40px rgba(0,0,0,0.35)",
    marginBottom: "12px",
    flexWrap: "wrap",
  },
  hintRow: {
    marginBottom: "20px",
  },
  hintBadge: {
    display: "inline-block",
    background: "rgba(37,99,235,0.15)",
    color: "#bfdbfe",
    border: "1px solid rgba(59,130,246,0.35)",
    borderRadius: "999px",
    padding: "8px 12px",
    fontSize: "13px",
    fontWeight: 700,
  },
  input: {
    flex: 1,
    minWidth: "260px",
    background: "#1f2937",
    color: "white",
    border: "1px solid #374151",
    borderRadius: "12px",
    padding: "14px 16px",
    fontSize: "16px",
    outline: "none",
  },
  primaryButton: {
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "12px",
    padding: "14px 22px",
    fontSize: "16px",
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
  rsiLockedButton: {
    background: "rgba(255,255,255,0.04)",
    color: "#fbbf24",
    border: "1px solid rgba(245,158,11,0.25)",
    borderRadius: "12px",
    padding: "12px 18px",
    fontSize: "15px",
    fontWeight: 700,
    cursor: "pointer",
    opacity: 0.85,
  },
  logoutButton: {
    background: "#111827",
    color: "white",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "12px",
    padding: "12px 18px",
    fontSize: "15px",
    fontWeight: 700,
    cursor: "pointer",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 3fr) minmax(280px, 1fr)",
    gap: "20px",
    alignItems: "start",
  },
  mainCard: {
    minWidth: 0,
    background: "rgba(10, 20, 40, 0.92)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "20px",
    padding: "20px",
    boxShadow: "0 18px 40px rgba(0,0,0,0.35)",
  },
  newsHome: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },
  newsHero: {
    background:
      "linear-gradient(135deg, rgba(37,99,235,0.22), rgba(14,165,233,0.08))",
    border: "1px solid rgba(59,130,246,0.24)",
    borderRadius: "18px",
    padding: "22px",
  },
  newsHeroBadge: {
    display: "inline-block",
    background: "rgba(37,99,235,0.22)",
    color: "#bfdbfe",
    border: "1px solid rgba(59,130,246,0.35)",
    borderRadius: "999px",
    padding: "6px 10px",
    fontSize: "11px",
    fontWeight: 800,
    marginBottom: "12px",
  },
  newsHeroTitle: {
    color: "white",
    fontSize: "28px",
    fontWeight: 800,
    margin: "0 0 10px",
  },
  newsHeroText: {
    color: "#cbd5e1",
    fontSize: "15px",
    lineHeight: 1.7,
    margin: 0,
    maxWidth: "920px",
  },
  newsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "14px",
  },
  newsSection: {
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "16px",
    padding: "16px",
    minWidth: 0,
  },
  newsSectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
    alignItems: "flex-start",
    marginBottom: "14px",
  },
  newsSectionTitle: {
    color: "white",
    fontSize: "18px",
    fontWeight: 800,
    margin: "0 0 6px",
  },
  newsSectionSubtitle: {
    color: "#94a3b8",
    fontSize: "12px",
    lineHeight: 1.5,
    margin: 0,
  },
  newsLiveBadge: {
    flexShrink: 0,
    background: "rgba(34,197,94,0.14)",
    color: "#86efac",
    border: "1px solid rgba(34,197,94,0.28)",
    borderRadius: "999px",
    padding: "5px 8px",
    fontSize: "10px",
    fontWeight: 800,
  },
  newsList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  newsCard: {
    display: "block",
    textDecoration: "none",
    background: "rgba(255,255,255,0.025)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "14px",
    padding: "13px",
  },
  newsTopRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
    marginBottom: "8px",
  },
  newsTag: {
    background: "rgba(37,99,235,0.18)",
    color: "#bfdbfe",
    border: "1px solid rgba(59,130,246,0.32)",
    borderRadius: "999px",
    padding: "4px 8px",
    fontSize: "10px",
    fontWeight: 800,
  },
  newsSource: {
    color: "#64748b",
    fontSize: "10px",
    textAlign: "right",
  },
  newsTitle: {
    color: "white",
    fontSize: "14px",
    fontWeight: 800,
    lineHeight: 1.45,
    marginBottom: "8px",
  },
  newsSummary: {
    color: "#cbd5e1",
    fontSize: "12px",
    lineHeight: 1.55,
    marginBottom: "10px",
  },
  newsOpenText: {
    color: "#93c5fd",
    fontSize: "12px",
    fontWeight: 800,
  },
  profileCard: {
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "16px",
    padding: "18px",
    marginBottom: "18px",
  },
  sectionTitleRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "14px",
    flexWrap: "wrap",
    marginBottom: "12px",
  },
  watchlistActionButton: {
    background: "rgba(255,255,255,0.04)",
    color: "white",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "12px",
    padding: "10px 14px",
    fontSize: "13px",
    fontWeight: 700,
    cursor: "pointer",
  },
  watchlistActionButtonActive: {
    background: "rgba(245,158,11,0.18)",
    color: "#fde68a",
    border: "1px solid rgba(245,158,11,0.35)",
  },
  profileTopGrid: {
    display: "grid",
    gridTemplateColumns: "1.5fr 0.5fr",
    gap: "12px",
    marginBottom: "12px",
  },
  profileMiniCard: {
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "12px",
    padding: "14px",
  },
  profileMainValue: {
    color: "white",
    fontSize: "20px",
    fontWeight: 800,
    wordBreak: "break-word",
    lineHeight: 1.35,
  },
  descriptionCard: {
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "14px",
    padding: "16px",
    marginTop: "12px",
  },
  descriptionText: {
    color: "#cbd5e1",
    fontSize: "14px",
    lineHeight: 1.7,
  },
  sectionTitle: {
    color: "white",
    fontSize: "24px",
    fontWeight: 800,
    margin: 0,
  },
  sectionHeader: {
    color: "#93c5fd",
    fontSize: "13px",
    fontWeight: 800,
    letterSpacing: "1px",
    margin: "6px 0 10px",
  },
  compactGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "10px",
    marginBottom: "16px",
  },
  metricCard: {
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "12px",
    padding: "12px 14px",
    minHeight: "74px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },
  metricLabel: {
    color: "#94a3b8",
    fontSize: "12px",
    marginBottom: "6px",
  },
  metricValue: {
    color: "white",
    fontSize: "15px",
    fontWeight: 700,
    lineHeight: 1.35,
    wordBreak: "break-word",
  },
  metricValueSmall: {
    color: "white",
    fontSize: "13px",
    fontWeight: 600,
    lineHeight: 1.4,
    wordBreak: "break-word",
  },
  resultLabel: {
    color: "#94a3b8",
    fontSize: "13px",
    marginBottom: "8px",
  },
  aiCard: {
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "16px",
    padding: "18px",
    marginBottom: "16px",
  },
  aiTitle: {
    color: "white",
    fontSize: "22px",
    fontWeight: 800,
    marginBottom: "10px",
  },
  aiText: {
    color: "#cbd5e1",
    fontSize: "15px",
    lineHeight: 1.7,
    marginBottom: "16px",
  },
  aiColumns: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "14px",
    marginBottom: "14px",
  },
  aiColumn: {
    background: "rgba(255,255,255,0.02)",
    borderRadius: "12px",
    padding: "12px",
  },
  aiSubTitle: {
    color: "white",
    fontSize: "15px",
    fontWeight: 700,
    marginBottom: "8px",
  },
  aiList: {
    color: "#cbd5e1",
    paddingLeft: "18px",
    margin: 0,
    lineHeight: 1.7,
  },
  fairValueBox: {
    color: "#cbd5e1",
    fontSize: "14px",
  },
  fairValueText: {
    color: "white",
    fontWeight: 700,
  },
  finalAssessmentBox: {
    marginTop: "16px",
    padding: "12px",
    borderRadius: "12px",
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.06)",
  },
  finalAssessmentValue: {
    color: "white",
    fontWeight: 700,
    fontSize: "14px",
    lineHeight: 1.5,
  },
  sidebar: {
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  sideCard: {
    minWidth: 0,
    background: "rgba(10, 20, 40, 0.92)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "18px",
    padding: "16px",
    boxShadow: "0 18px 40px rgba(0,0,0,0.35)",
  },
  sideTitle: {
    color: "white",
    fontSize: "22px",
    fontWeight: 800,
    marginBottom: "12px",
  },
  badge: {
    display: "inline-block",
    background: "rgba(244,63,94,0.18)",
    color: "#fda4af",
    border: "1px solid rgba(244,63,94,0.35)",
    borderRadius: "999px",
    padding: "6px 10px",
    fontSize: "11px",
    fontWeight: 700,
    marginBottom: "12px",
  },
  lockedBadge: {
    display: "inline-block",
    background: "rgba(245,158,11,0.18)",
    color: "#fde68a",
    border: "1px solid rgba(245,158,11,0.35)",
    borderRadius: "999px",
    padding: "5px 9px",
    fontSize: "10px",
    fontWeight: 800,
  },
  lockedCardText: {
    color: "white",
    fontSize: "14px",
    lineHeight: 1.6,
    marginBottom: "8px",
  },
  lockedCardSubtext: {
    color: "#94a3b8",
    fontSize: "13px",
    lineHeight: 1.6,
  },
  sideText: {
    color: "#cbd5e1",
    fontSize: "13px",
    lineHeight: 1.55,
    margin: 0,
  },
  planRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
    padding: "8px 0",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  planKey: {
    color: "#94a3b8",
    fontSize: "13px",
    flexShrink: 0,
  },
  planValue: {
    color: "white",
    fontSize: "13px",
    fontWeight: 700,
    textAlign: "right",
    wordBreak: "break-word",
    maxWidth: "62%",
  },
  upgradeButton: {
    marginTop: "14px",
    width: "100%",
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "12px",
    padding: "12px 16px",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
  },
  link: {
    color: "#93c5fd",
    textDecoration: "none",
  },
  chartCard: {
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "16px",
    padding: "16px",
  },
  chartHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
    gap: "12px",
    flexWrap: "wrap",
  },
  chartTitle: {
    color: "white",
    fontSize: "22px",
    fontWeight: 800,
  },
  chartSubTitle: {
    color: "#94a3b8",
    fontSize: "14px",
    fontWeight: 600,
  },
  chartFrameWrap: {
    width: "100%",
    height: "520px",
    borderRadius: "14px",
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.06)",
    background: "#0b1220",
  },
  chartIframe: {
    width: "100%",
    height: "100%",
    border: "none",
    display: "block",
  },
  marketCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    marginBottom: "12px",
  },
  marketCardTitle: {
    color: "white",
    fontSize: "18px",
    fontWeight: 800,
    margin: 0,
  },
  liveBadge: {
    display: "inline-block",
    background: "#ef4444",
    color: "white",
    borderRadius: "999px",
    padding: "3px 7px",
    fontSize: "10px",
    fontWeight: 800,
    letterSpacing: "0.4px",
  },
  watchlistCount: {
    minWidth: "24px",
    height: "24px",
    borderRadius: "999px",
    background: "rgba(37,99,235,0.18)",
    color: "#bfdbfe",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px",
    fontWeight: 800,
    border: "1px solid rgba(59,130,246,0.35)",
  },
  watchlistEmpty: {
    color: "#94a3b8",
    fontSize: "13px",
    lineHeight: 1.6,
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "12px",
    padding: "14px",
  },
  alertForm: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "8px",
    marginBottom: "12px",
  },
  alertInput: {
    width: "100%",
    boxSizing: "border-box",
    background: "#1f2937",
    color: "white",
    border: "1px solid #374151",
    borderRadius: "10px",
    padding: "10px 11px",
    fontSize: "13px",
    outline: "none",
  },
  alertSelect: {
    width: "100%",
    boxSizing: "border-box",
    background: "#1f2937",
    color: "white",
    border: "1px solid #374151",
    borderRadius: "10px",
    padding: "10px 11px",
    fontSize: "13px",
    outline: "none",
  },
  createAlertButton: {
    width: "100%",
    boxSizing: "border-box",
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "12px",
    padding: "11px 13px",
    fontSize: "13px",
    fontWeight: 700,
    cursor: "pointer",
  },
  alertsList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  alertRow: {
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "12px",
    padding: "10px",
  },
  alertRowTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    marginBottom: "8px",
  },
  alertSymbol: {
    color: "white",
    fontSize: "14px",
    fontWeight: 800,
    marginBottom: "4px",
  },
  alertCondition: {
    color: "#94a3b8",
    fontSize: "11px",
  },
  alertStatus: {
    borderRadius: "999px",
    padding: "5px 8px",
    fontSize: "10px",
    fontWeight: 800,
  },
  alertStatusPending: {
    background: "rgba(37,99,235,0.16)",
    color: "#bfdbfe",
    border: "1px solid rgba(59,130,246,0.35)",
  },
  alertStatusTriggered: {
    background: "rgba(34,197,94,0.16)",
    color: "#86efac",
    border: "1px solid rgba(34,197,94,0.35)",
  },
  alertRowBottom: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "8px",
  },
  alertCurrentPrice: {
    color: "#cbd5e1",
    fontSize: "11px",
  },
  alertActions: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  watchlistList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  watchlistRow: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "12px",
    padding: "10px",
  },
  watchlistTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
  },
  watchlistIdentity: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    minWidth: 0,
  },
  watchlistMainButton: {
    width: "100%",
    background: "transparent",
    border: "none",
    textAlign: "left",
    cursor: "pointer",
    padding: 0,
  },
  watchlistSymbol: {
    color: "white",
    fontSize: "13px",
    fontWeight: 800,
    marginBottom: "3px",
  },
  watchlistName: {
    color: "#94a3b8",
    fontSize: "11px",
    lineHeight: 1.3,
  },
  watchlistPriceWrap: {
    textAlign: "right",
    flexShrink: 0,
  },
  watchlistPrice: {
    color: "white",
    fontSize: "13px",
    fontWeight: 800,
    marginBottom: "3px",
  },
  watchlistChange: {
    fontSize: "11px",
    fontWeight: 800,
  },
  watchlistMeta: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
  },
  watchTypeBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "999px",
    padding: "5px 8px",
    fontSize: "10px",
    fontWeight: 800,
  },
  watchTypeStock: {
    background: "rgba(37,99,235,0.16)",
    color: "#bfdbfe",
    border: "1px solid rgba(59,130,246,0.35)",
  },
  watchTypeCrypto: {
    background: "rgba(168,85,247,0.16)",
    color: "#e9d5ff",
    border: "1px solid rgba(168,85,247,0.35)",
  },
  watchlistRemoveButton: {
    width: "24px",
    height: "24px",
    borderRadius: "999px",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    color: "white",
    fontSize: "16px",
    lineHeight: 1,
    cursor: "pointer",
  },
  marketHeaderRow: {
    display: "flex",
    gap: "8px",
    paddingBottom: "8px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    marginBottom: "4px",
  },
  marketHeaderCell: {
    color: "#94a3b8",
    fontSize: "10px",
    fontWeight: 700,
  },
  marketList: {
    display: "flex",
    flexDirection: "column",
  },
  marketRowButton: {
    background: "transparent",
    border: "none",
    padding: 0,
    margin: 0,
    width: "100%",
    textAlign: "left",
    cursor: "pointer",
    borderRadius: "12px",
  },
  marketRowButtonDisabled: {
    cursor: "not-allowed",
    opacity: 0.7,
  },
  marketRow: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
    padding: "8px 0",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    minWidth: 0,
  },
  marketSymbolCell: {
    flex: 1.8,
    display: "flex",
    alignItems: "center",
    gap: "8px",
    minWidth: 0,
  },
  marketTextWrap: {
    minWidth: 0,
    overflow: "hidden",
  },
  marketIndex: {
    color: "#cbd5e1",
    fontSize: "11px",
    fontWeight: 800,
    width: "14px",
    textAlign: "center",
    flexShrink: 0,
  },
  logoHolder: {
    width: "22px",
    height: "22px",
    borderRadius: "999px",
    overflow: "hidden",
    flexShrink: 0,
    background: "rgba(255,255,255,0.06)",
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
    background: "white",
  },
  logoFallback: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontSize: "10px",
    fontWeight: 800,
    background: "linear-gradient(135deg, #334155 0%, #1f2937 100%)",
  },
  marketSymbol: {
    color: "white",
    fontSize: "12px",
    fontWeight: 800,
  },
  marketName: {
    color: "#94a3b8",
    fontSize: "10px",
    lineHeight: 1.2,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "100%",
  },
  marketSparkCell: {
    width: "82px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  sparklineSvg: {
    display: "block",
  },
  sparklinePlaceholderWrap: {
    width: "76px",
    height: "24px",
    borderRadius: "8px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.04)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  sparklinePlaceholderLine: {
    width: "46px",
    height: "2px",
    borderRadius: "999px",
    background: "rgba(148,163,184,0.45)",
  },
  marketPriceCell: {
    flex: 1,
    textAlign: "right",
    color: "white",
    fontSize: "12px",
    fontWeight: 700,
  },
  marketChangeCell: {
    flex: 1,
    textAlign: "right",
    fontSize: "11px",
    fontWeight: 800,
  },
};
