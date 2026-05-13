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

const TICKERS = [
  { label: "S&P 500", symbol: "^GSPC", digits: 2 },
  { label: "Dow 30", symbol: "^DJI", digits: 2 },
  { label: "Nasdaq", symbol: "^IXIC", digits: 2 },
  { label: "Gold", symbol: "GC=F", digits: 2 },
  { label: "Silver", symbol: "SI=F", digits: 2 },
];

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function formatValue(value: number | null, digits = 2): string {
  if (value === null) return "—";
  return value.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function formatChange(changePercent: number | null): string {
  if (changePercent === null) return "Unavailable";
  return `${changePercent >= 0 ? "+" : ""}${changePercent.toFixed(2)}%`;
}

function buildForcedSparkline(
  price: number | null,
  changePercent: number | null,
  points = 16
): number[] {
  const safePrice =
    price !== null && Number.isFinite(price) && price > 0 ? price : 100;

  const safeChangePercent =
    changePercent !== null && Number.isFinite(changePercent) ? changePercent : 0;

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

async function getSparkline(symbol: string): Promise<number[]> {
  try {
    const end = new Date();
    const start = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30);

    const chart = await yahooFinance.chart(symbol, {
      period1: start,
      period2: end,
      interval: "1d",
    });

    const quotes = chart?.quotes || [];
    const closes = quotes
      .map((q) => toNumber(q.close))
      .filter((v): v is number => v !== null);

    return closes.slice(-16);
  } catch (error) {
    console.error(`Ticker sparkline error for ${symbol}:`, error);
    return [];
  }
}

export async function GET() {
  try {
    const results: MarketTickerItem[] = await Promise.all(
      TICKERS.map(async ({ label, symbol, digits }) => {
        try {
          const [quote, sparklineRaw] = await Promise.all([
            yahooFinance.quote(symbol),
            getSparkline(symbol),
          ]);

          const price =
            toNumber(quote.regularMarketPrice) ??
            toNumber(quote.postMarketPrice) ??
            toNumber(quote.preMarketPrice);

          const changePercent = toNumber(quote.regularMarketChangePercent);
          const positive = (changePercent ?? 0) >= 0;

          return {
            label,
            value: formatValue(price, digits),
            change: formatChange(changePercent),
            positive,
            points:
              sparklineRaw.length >= 8
                ? sparklineRaw
                : buildForcedSparkline(price, changePercent, 16),
          };
        } catch (error) {
          console.error(`Market ticker error for ${symbol}:`, error);

          return {
            label,
            value: "—",
            change: "Unavailable",
            positive: false,
            points: buildForcedSparkline(100, 0, 16),
          };
        }
      })
    );

    return NextResponse.json(results, {
      status: 200,
      headers: {
        "Cache-Control": "s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error: any) {
    console.error("MARKET TICKERS ERROR:", error);

    return NextResponse.json(
      { error: error?.message || "Грешка при market tickers." },
      { status: 500 }
    );
  }
}