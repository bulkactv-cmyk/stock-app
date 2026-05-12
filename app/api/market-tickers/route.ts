import { NextResponse } from "next/server";

type MarketTickerItem = {
  label: string;
  value: string;
  change: string;
  positive: boolean;
  points: number[];
};

type YahooQuote = {
  symbol?: string;
  shortName?: string;
  regularMarketPrice?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
};

const SYMBOLS = [
  { label: "S&P 500", symbol: "^GSPC" },
  { label: "Dow 30", symbol: "^DJI" },
  { label: "Nasdaq", symbol: "^IXIC" },
  { label: "Gold", symbol: "GC=F" },
  { label: "Silver", symbol: "SI=F" },
];

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
    value: "—",
    change: "Unavailable",
    positive: false,
    points: [66, 65, 63, 64, 61, 58, 60, 57, 54, 55, 52, 49, 46, 48, 44, 42],
  },
  {
    label: "Silver",
    value: "—",
    change: "Unavailable",
    positive: false,
    points: [38, 40, 42, 44, 47, 49, 53, 55, 57, 60, 58, 61, 64, 66, 68, 72],
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
      base * 0.92, base * 0.93, base * 0.935, base * 0.94,
      base * 0.948, base * 0.952, base * 0.958, base * 0.962,
      base * 0.968, base * 0.972, base * 0.978, base * 0.983,
      base * 0.989, base * 0.994, base * 0.997, base,
    ].map((v) => Number(v.toFixed(2)));
  }

  return [
    base * 1.08, base * 1.075, base * 1.068, base * 1.061,
    base * 1.055, base * 1.049, base * 1.043, base * 1.036,
    base * 1.03, base * 1.024, base * 1.018, base * 1.013,
    base * 1.009, base * 1.005, base * 1.002, base,
  ].map((v) => Number(v.toFixed(2)));
}

async function getYahooQuotes(): Promise<YahooQuote[]> {
  const symbols = SYMBOLS.map((item) => item.symbol).join(",");
  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbols)}`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json",
      },
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      console.error("Yahoo quote response error:", response.status);
      return [];
    }

    const data = await response.json();
    return data?.quoteResponse?.result ?? [];
  } catch (error) {
    console.error("Yahoo quote fetch error:", error);
    return [];
  }
}

function toTicker(
  label: string,
  quote: YahooQuote | undefined,
  fallback: MarketTickerItem
): MarketTickerItem {
  if (!quote || typeof quote.regularMarketPrice !== "number") {
    return fallback;
  }

  const positive =
    typeof quote.regularMarketChange === "number"
      ? quote.regularMarketChange >= 0
      : false;

  return {
    label,
    value: formatValue(quote.regularMarketPrice, 2),
    change: formatChange(
      quote.regularMarketChange,
      quote.regularMarketChangePercent
    ),
    positive,
    points: buildPoints(quote.regularMarketPrice, positive),
  };
}

export async function GET() {
  try {
    const quotes = await getYahooQuotes();

    const bySymbol = new Map(
      quotes.map((quote) => [quote.symbol, quote] as const)
    );

    const results: MarketTickerItem[] = [
      toTicker("S&P 500", bySymbol.get("^GSPC"), FALLBACK_TICKERS[0]),
      toTicker("Dow 30", bySymbol.get("^DJI"), FALLBACK_TICKERS[1]),
      toTicker("Nasdaq", bySymbol.get("^IXIC"), FALLBACK_TICKERS[2]),
      toTicker("Gold", bySymbol.get("GC=F"), FALLBACK_TICKERS[3]),
      toTicker("Silver", bySymbol.get("SI=F"), FALLBACK_TICKERS[4]),
    ];

    return NextResponse.json(results, {
      status: 200,
      headers: {
        "Cache-Control": "s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    console.error("YAHOO MARKET TICKERS ERROR:", error);
    return NextResponse.json(FALLBACK_TICKERS, { status: 200 });
  }
}