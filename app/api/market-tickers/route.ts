import { NextResponse } from "next/server";

type MarketTickerItem = {
  label: string;
  value: string;
  change: string;
  positive: boolean;
  points: number[];
};

type FmpQuote = {
  symbol?: string;
  name?: string;
  price?: number;
  change?: number;
  changesPercentage?: number;
};

const FMP_BASE_URL = "https://financialmodelingprep.com/api/v3";

const FALLBACK_TICKERS: MarketTickerItem[] = [
  {
    label: "S&P 500",
    value: "—",
    change: "Unavailable",
    positive: false,
    points: [70, 68, 66, 65, 61, 58, 56, 54, 57, 52, 49, 46, 44, 42, 45, 41],
  },
  {
    label: "Dow 30",
    value: "—",
    change: "Unavailable",
    positive: false,
    points: [62, 61, 60, 61, 63, 66, 68, 70, 66, 67, 69, 71, 70, 71, 72, 73],
  },
  {
    label: "Nasdaq",
    value: "—",
    change: "Unavailable",
    positive: false,
    points: [78, 76, 73, 70, 67, 64, 61, 59, 57, 54, 52, 48, 45, 43, 40, 38],
  },
  {
    label: "Gold",
    value: "2,350.00",
    change: "+0.00 (+0.00%)",
    positive: true,
    points: [2290, 2298, 2302, 2310, 2318, 2324, 2330, 2334, 2338, 2342, 2344, 2346, 2348, 2349, 2350, 2350],
  },
  {
    label: "Silver",
    value: "27.50",
    change: "+0.00 (+0.00%)",
    positive: true,
    points: [26.2, 26.4, 26.5, 26.7, 26.8, 26.9, 27.0, 27.1, 27.15, 27.2, 27.25, 27.3, 27.35, 27.4, 27.45, 27.5],
  },
];

function formatValue(value?: number, digits = 2) {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";

  return value.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function formatChange(change?: number, percent?: number) {
  if (typeof change !== "number" || typeof percent !== "number") {
    return "Unavailable";
  }

  const changeText = `${change >= 0 ? "+" : ""}${change.toFixed(2)}`;
  const percentText = `${percent >= 0 ? "+" : ""}${percent.toFixed(2)}%`;

  return `${changeText} (${percentText})`;
}

function buildPoints(price?: number, positive?: boolean) {
  const safePrice = typeof price === "number" && price > 0 ? price : 100;
  const base = safePrice;

  if (positive) {
    return [
      base * 0.92,
      base * 0.93,
      base * 0.935,
      base * 0.94,
      base * 0.948,
      base * 0.952,
      base * 0.958,
      base * 0.962,
      base * 0.968,
      base * 0.972,
      base * 0.978,
      base * 0.983,
      base * 0.989,
      base * 0.994,
      base * 0.997,
      base,
    ].map((v) => Number(v.toFixed(2)));
  }

  return [
    base * 1.08,
    base * 1.075,
    base * 1.068,
    base * 1.061,
    base * 1.055,
    base * 1.049,
    base * 1.043,
    base * 1.036,
    base * 1.03,
    base * 1.024,
    base * 1.018,
    base * 1.013,
    base * 1.009,
    base * 1.005,
    base * 1.002,
    base,
  ].map((v) => Number(v.toFixed(2)));
}

async function getQuote(symbol: string): Promise<FmpQuote | null> {
  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey) return null;

  const url = `${FMP_BASE_URL}/quote/${encodeURIComponent(symbol)}?apikey=${apiKey}`;

  try {
    const response = await fetch(url, { cache: "no-store" });

    if (!response.ok) {
      console.error("FMP response error:", response.status, url);
      return null;
    }

    const data = await response.json();
    console.log(`FMP raw response for ${symbol}:`, JSON.stringify(data));

    if (Array.isArray(data) && data.length > 0) {
      return data[0];
    }

    return null;
  } catch (error) {
    console.error(`FMP fetch error for ${symbol}:`, error);
    return null;
  }
}

async function buildTicker(label: string, symbol: string, fallback: MarketTickerItem): Promise<MarketTickerItem> {
  const quote = await getQuote(symbol);

  if (!quote || typeof quote.price !== "number") {
    console.error(`No valid price for ${label}`, quote);
    return fallback;
  }

  const price = quote.price;
  const change = quote.change;
  const percent = quote.changesPercentage;
  const positive = typeof change === "number" ? change >= 0 : false;

  return {
    label,
    value: formatValue(price, 2),
    change: formatChange(change, percent),
    positive,
    points: buildPoints(price, positive),
  };
}

export async function GET() {
  try {
    const apiKey = process.env.FMP_API_KEY;

    if (!apiKey) {
      console.error("Missing FMP_API_KEY");
      return NextResponse.json(FALLBACK_TICKERS, { status: 200 });
    }

    const [sp500, dow30, nasdaq] = await Promise.all([
      buildTicker("S&P 500", "^GSPC", FALLBACK_TICKERS[0]),
      buildTicker("Dow 30", "^DJI", FALLBACK_TICKERS[1]),
      buildTicker("Nasdaq", "^IXIC", FALLBACK_TICKERS[2]),
    ]);

    const results: MarketTickerItem[] = [
      sp500,
      dow30,
      nasdaq,
      FALLBACK_TICKERS[3],
      FALLBACK_TICKERS[4],
    ];

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error("MARKET TICKERS ERROR:", error);
    return NextResponse.json(FALLBACK_TICKERS, { status: 200 });
  }
}