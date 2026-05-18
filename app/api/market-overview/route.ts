import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance();

type MarketTickerItem = {
  label: string;
  value: string;
  change: string;
  positive: boolean;
  points: number[];
};

type MarketSymbol = {
  label: string;
  symbol: string;
};

const MARKET_SYMBOLS: MarketSymbol[] = [
  { label: "S&P 500", symbol: "^GSPC" },
  { label: "Dow 30", symbol: "^DJI" },
  { label: "Nasdaq", symbol: "^IXIC" },
  { label: "Gold", symbol: "GC=F" },
  { label: "Silver", symbol: "SI=F" },
];

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function formatValue(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";

  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatChangePercent(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";

  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

function buildForcedSparkline(
  price: number | null,
  changePercent: number | null,
  points = 20
): number[] {
  const safePrice =
    price !== null && Number.isFinite(price) && price > 0 ? price : 100;

  const safeChangePercent =
    changePercent !== null && Number.isFinite(changePercent)
      ? changePercent
      : 0;

  const startMultiplier = 1 - safeChangePercent / 100;
  const startBase =
    Number.isFinite(startMultiplier) && startMultiplier > 0
      ? safePrice * startMultiplier
      : safePrice * 0.98;

  const data: number[] = [];

  for (let i = 0; i < points; i++) {
    const progress = points === 1 ? 1 : i / (points - 1);

    const trendBase = startBase + (safePrice - startBase) * progress;
    const waveA = Math.sin(progress * Math.PI * 2) * safePrice * 0.012;
    const waveB = Math.cos(progress * Math.PI * 5) * safePrice * 0.004;
    const waveC = Math.sin(progress * Math.PI * 9) * safePrice * 0.002;

    const point = trendBase + waveA + waveB + waveC;
    data.push(Number(point.toFixed(6)));
  }

  return data;
}

async function getMarketSparkline(symbol: string): Promise<number[]> {
  try {
    const chart = await yahooFinance.chart(symbol, {
      period1: new Date(Date.now() - 1000 * 60 * 60 * 24),
      period2: new Date(),
      interval: "5m",
    });

    const quotes = chart?.quotes || [];

    const closes = quotes
      .map((quote) => toNumber(quote.close))
      .filter((value): value is number => value !== null);

    if (closes.length >= 8) {
      return closes.slice(-20);
    }

    return [];
  } catch (error) {
    console.error(`Sparkline error for ${symbol}:`, error);
    return [];
  }
}

async function getMarketTicker(item: MarketSymbol): Promise<MarketTickerItem> {
  try {
    const [quote, sparklineRaw] = await Promise.all([
      yahooFinance.quote(item.symbol),
      getMarketSparkline(item.symbol),
    ]);

    const price =
      toNumber(quote.regularMarketPrice) ??
      toNumber(quote.postMarketPrice) ??
      toNumber(quote.preMarketPrice);

    const changePercent =
      toNumber(quote.regularMarketChangePercent) ??
      toNumber(quote.postMarketChangePercent) ??
      toNumber(quote.preMarketChangePercent);

    return {
      label: item.label,
      value: formatValue(price),
      change: formatChangePercent(changePercent),
      positive: typeof changePercent === "number" ? changePercent >= 0 : false,
      points:
        sparklineRaw.length >= 8
          ? sparklineRaw
          : buildForcedSparkline(price, changePercent, 20),
    };
  } catch (error) {
    console.error(`Market ticker error for ${item.symbol}:`, error);

    return {
      label: item.label,
      value: "—",
      change: "—",
      positive: false,
      points: buildForcedSparkline(100, 0, 20),
    };
  }
}

export async function GET() {
  try {
    const results = await Promise.all(MARKET_SYMBOLS.map(getMarketTicker));

    return NextResponse.json(results, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Pragma: "no-cache",
      },
    });
  } catch (error: unknown) {
    console.error("MARKET TICKERS API ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load market tickers.",
      },
      { status: 500 }
    );
  }
}