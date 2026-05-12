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
    value: "—",
    change: "Unavailable",
    positive: false,
    points: [66, 65, 63, 64, 61, 58, 60, 57, 54, 55, 52, 49, 46, 48, 44, 42],
  },
  {
    label: "Silver",
    value: "—",
    change: "Unavailable",
    positive: true,
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
  try {
    const response = await fetch(url, { cache: "no-store" });

    if (!response.ok) {
      console.error("FMP response error:", response.status, url);
      return null;
    }

    const data = await response.json();
    console.log("FMP raw response for", url, JSON.stringify(data));

    if (Array.isArray(data) && data.length > 0) {
      return data[0];
    }

    if (data && typeof data === "object" && !Array.isArray(data)) {
      return data;
    }

    return null;
  } catch (error) {
    console.error("FMP fetch error:", url, error);
    return null;
  }
}

export async function GET() {
  try {
    const apiKey = process.env.FMP_API_KEY;

    if (!apiKey) {
      console.error("Missing FMP_API_KEY");
      return NextResponse.json(FALLBACK_TICKERS, { status: 200 });
    }

    const endpoints = [
      {
        label: "S&P 500",
        url: `${FMP_BASE_URL}/quote/%5EGSPC?apikey=${apiKey}`,
      },
      {
        label: "Dow 30",
        url: `${FMP_BASE_URL}/quote/%5EDJI?apikey=${apiKey}`,
      },
      {
        label: "Nasdaq",
        url: `${FMP_BASE_URL}/quote/%5EIXIC?apikey=${apiKey}`,
      },
      {
        label: "Gold",
        url: `${FMP_BASE_URL}/quote/GCUSD?apikey=${apiKey}`,
      },
      {
        label: "Silver",
        url: `${FMP_BASE_URL}/quote/SIUSD?apikey=${apiKey}`,
      },
    ];

    const results = await Promise.all(
      endpoints.map(async (item, index) => {
        const quote = await getQuote(item.url);

        if (!quote || typeof quote.price !== "number") {
          console.error(`No valid price for ${item.label}`, quote);
          return FALLBACK_TICKERS[index];
        }

        const price = quote.price;
        const change = quote.change;
        const percent = quote.changesPercentage;
        const positive = typeof change === "number" ? change >= 0 : false;

        return {
          label: item.label,
          value: formatValue(price, 2),
          change: formatChange(change, percent),
          positive,
          points: buildPoints(price, positive),
        };
      })
    );

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error("FMP MARKET TICKERS ERROR:", error);
    return NextResponse.json(FALLBACK_TICKERS, { status: 200 });
  }
}