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

const FMP_BASE_URL = "https://financialmodelingprep.com/stable";

function formatValue(value?: number, digits = 2) {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";

  return value.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function formatChange(change?: number, percent?: number) {
  if (typeof change !== "number" || typeof percent !== "number") return "—";

  const changeText = `${change >= 0 ? "+" : ""}${change.toFixed(2)}`;
  const percentText = `${percent >= 0 ? "+" : ""}${percent.toFixed(2)}%`;

  return `${changeText} ${percentText}`;
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

async function getQuote(url: string): Promise<FmpQuote | null> {
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();

  if (Array.isArray(data) && data.length > 0) {
    return data[0];
  }

  if (data && typeof data === "object") {
    return data;
  }

  return null;
}

export async function GET() {
  try {
    const apiKey = process.env.FMP_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing FMP_API_KEY" },
        { status: 500 }
      );
    }

    const endpoints = [
      {
        label: "S&P 500",
        url: `${FMP_BASE_URL}/quote?symbol=%5EGSPC&apikey=${apiKey}`,
      },
      {
        label: "Dow 30",
        url: `${FMP_BASE_URL}/quote?symbol=%5EDJI&apikey=${apiKey}`,
      },
      {
        label: "Nasdaq",
        url: `${FMP_BASE_URL}/quote?symbol=%5EIXIC&apikey=${apiKey}`,
      },
      {
        label: "Gold",
        url: `${FMP_BASE_URL}/quote?symbol=GCUSD&apikey=${apiKey}`,
      },
      {
        label: "Silver",
        url: `${FMP_BASE_URL}/quote?symbol=SIUSD&apikey=${apiKey}`,
      },
    ];

    const results = await Promise.all(
      endpoints.map(async (item) => {
        const quote = await getQuote(item.url);
        const price = quote?.price;
        const change = quote?.change;
        const percent = quote?.changesPercentage;
        const positive = typeof change === "number" ? change >= 0 : false;

        const normalized: MarketTickerItem = {
          label: item.label,
          value: formatValue(price, 2),
          change: formatChange(change, percent),
          positive,
          points: buildPoints(price, positive),
        };

        return normalized;
      })
    );

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error("FMP MARKET TICKERS ERROR:", error);

    return NextResponse.json(
      { error: "Failed to load market tickers" },
      { status: 500 }
    );
  }
}