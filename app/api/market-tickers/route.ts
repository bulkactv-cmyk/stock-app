import { NextResponse } from "next/server";

type MarketTickerItem = {
  label: string;
  value: string;
  change: string;
  positive: boolean;
  points: number[];
};

type AlphaVantageGlobalQuote = {
  "Global Quote"?: {
    "01. symbol"?: string;
    "05. price"?: string;
    "09. change"?: string;
    "10. change percent"?: string;
  };
};

const FALLBACK_SHAPES = {
  negative: [70, 68, 66, 65, 61, 58, 56, 54, 57, 52, 49, 46, 44, 42, 45, 41],
  neutral: [62, 61, 60, 61, 63, 66, 68, 70, 66, 67, 69, 71, 70, 71, 72, 73],
  positive: [38, 40, 42, 44, 47, 49, 53, 55, 57, 60, 58, 61, 64, 66, 68, 72],
};

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

async function getAlphaQuote(symbol: string) {
  const apiKey = process.env.ALPHA_VANTAGE_KEY;

  if (!apiKey) {
    console.error("Missing ALPHA_VANTAGE_KEY");
    return null;
  }

  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${apiKey}`;

  try {
    const response = await fetch(url, { cache: "no-store" });

    if (!response.ok) {
      console.error("Alpha Vantage response error:", response.status, url);
      return null;
    }

    const data: AlphaVantageGlobalQuote = await response.json();
    console.log(`Alpha raw response for ${symbol}:`, JSON.stringify(data));

    const quote = data?.["Global Quote"];
    if (!quote) return null;

    const price = Number(quote["05. price"]);
    const change = Number(quote["09. change"]);
    const percentRaw = quote["10. change percent"]?.replace("%", "");
    const percent = Number(percentRaw);

    if (Number.isNaN(price)) return null;

    return { price, change, percent };
  } catch (error) {
    console.error(`Alpha fetch error for ${symbol}:`, error);
    return null;
  }
}

async function buildTicker(label: string, symbol: string, shape: number[]): Promise<MarketTickerItem> {
  const quote = await getAlphaQuote(symbol);

  if (!quote) {
    return {
      label,
      value: "—",
      change: "Unavailable",
      positive: false,
      points: shape,
    };
  }

  const positive = typeof quote.change === "number" ? quote.change >= 0 : false;

  return {
    label,
    value: formatValue(quote.price, 2),
    change: formatChange(quote.change, quote.percent),
    positive,
    points: buildPoints(quote.price, positive),
  };
}

export async function GET() {
  try {
    const [sp500, dow30, nasdaq, gold, silver] = await Promise.all([
      buildTicker("S&P 500", "SPY", FALLBACK_SHAPES.negative),
      buildTicker("Dow 30", "DIA", FALLBACK_SHAPES.neutral),
      buildTicker("Nasdaq", "QQQ", FALLBACK_SHAPES.negative),
      buildTicker("Gold", "GLD", FALLBACK_SHAPES.positive),
      buildTicker("Silver", "SLV", FALLBACK_SHAPES.positive),
    ]);

    return NextResponse.json([sp500, dow30, nasdaq, gold, silver], { status: 200 });
  } catch (error) {
    console.error("MARKET TICKERS ERROR:", error);

    return NextResponse.json(
      [
        {
          label: "S&P 500",
          value: "—",
          change: "Unavailable",
          positive: false,
          points: FALLBACK_SHAPES.negative,
        },
        {
          label: "Dow 30",
          value: "—",
          change: "Unavailable",
          positive: false,
          points: FALLBACK_SHAPES.neutral,
        },
        {
          label: "Nasdaq",
          value: "—",
          change: "Unavailable",
          positive: false,
          points: FALLBACK_SHAPES.negative,
        },
        {
          label: "Gold",
          value: "—",
          change: "Unavailable",
          positive: false,
          points: FALLBACK_SHAPES.positive,
        },
        {
          label: "Silver",
          value: "—",
          change: "Unavailable",
          positive: false,
          points: FALLBACK_SHAPES.positive,
        },
      ],
      { status: 200 }
    );
  }
}