import { NextResponse } from "next/server";

type TimeframeKey = "15m" | "1h" | "4h" | "12h" | "24h" | "1w";

type RsiRow = {
  symbol: string;
  name: string;
  pair: string;
  logoUrl: string;
  price: number | null;
  rsi: Record<TimeframeKey, number | null>;
};

const TIMEFRAME_TO_BINANCE: Record<TimeframeKey, string> = {
  "15m": "15m",
  "1h": "1h",
  "4h": "4h",
  "12h": "12h",
  "24h": "1d",
  "1w": "1w",
};

const COINS = [
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
];

function getLogoUrl(symbol: string) {
  return `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${symbol.toLowerCase()}.png`;
}

function toNumber(value: unknown): number | null {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

async function fetchKlines(pair: string, interval: string, limit = 120) {
  const res = await fetch(
    `https://api.binance.com/api/v3/klines?symbol=${pair}&interval=${interval}&limit=${limit}`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    throw new Error(`Binance error for ${pair} ${interval}`);
  }

  const data = (await res.json()) as unknown[];

  return Array.isArray(data) ? data : [];
}

function extractCloses(klines: unknown[]) {
  return klines
    .map((row) => {
      if (!Array.isArray(row)) return null;
      return toNumber(row[4]);
    })
    .filter((value): value is number => value !== null);
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
  const rsi = 100 - 100 / (1 + rs);

  return Number(rsi.toFixed(1));
}

async function buildRow(coin: (typeof COINS)[number]): Promise<RsiRow> {
  const timeframeEntries = await Promise.all(
    (Object.keys(TIMEFRAME_TO_BINANCE) as TimeframeKey[]).map(async (tf) => {
      try {
        const klines = await fetchKlines(coin.pair, TIMEFRAME_TO_BINANCE[tf], 120);
        const closes = extractCloses(klines);
        const rsi = calculateRsi(closes, 14);
        const lastPrice = closes.length ? closes[closes.length - 1] : null;

        return {
          timeframe: tf,
          rsi,
          lastPrice,
        };
      } catch {
        return {
          timeframe: tf,
          rsi: null,
          lastPrice: null,
        };
      }
    })
  );

  const rsiMap = timeframeEntries.reduce(
    (acc, entry) => {
      acc[entry.timeframe] = entry.rsi;
      return acc;
    },
    {} as Record<TimeframeKey, number | null>
  );

  const price =
    timeframeEntries.find((entry) => entry.timeframe === "15m")?.lastPrice ?? null;

  return {
    symbol: coin.symbol,
    name: coin.name,
    pair: coin.pair,
    logoUrl: getLogoUrl(coin.symbol),
    price,
    rsi: rsiMap,
  };
}

export async function GET() {
  try {
    const rows = await Promise.all(COINS.map(buildRow));

    return NextResponse.json({
      rows,
      updatedAt: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Грешка при RSI данните.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}