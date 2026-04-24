import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type TimeframeKey = "15m" | "1h" | "4h" | "12h" | "24h" | "1w";

type RsiRow = {
  symbol: string;
  name: string;
  pair: string;
  logoUrl: string;
  price: number | null;
  rsi: Record<TimeframeKey, number | null>;
};

const TIMEFRAMES: TimeframeKey[] = ["15m", "1h", "4h", "12h", "24h", "1w"];

const BINANCE_INTERVALS: Record<TimeframeKey, string> = {
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

async function fetchWithTimeout(url: string, timeoutMs = 9000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 StockApp RSI",
        Accept: "application/json",
      },
    });

    return res;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchBinanceCloses(pair: string, timeframe: TimeframeKey) {
  const interval = BINANCE_INTERVALS[timeframe];

  const url = `https://api.binance.com/api/v3/klines?symbol=${pair}&interval=${interval}&limit=120`;

  const res = await fetchWithTimeout(url);

  if (!res.ok) {
    throw new Error(`Binance failed ${pair} ${timeframe}`);
  }

  const data = await res.json();

  if (!Array.isArray(data)) {
    throw new Error(`Invalid Binance response ${pair}`);
  }

  return data
    .map((row) => {
      if (!Array.isArray(row)) return null;
      const value = Number(row[4]);
      return Number.isFinite(value) ? value : null;
    })
    .filter((value): value is number => value !== null);
}

function getCryptoCompareEndpoint(symbol: string, timeframe: TimeframeKey) {
  const base = "https://min-api.cryptocompare.com/data";

  if (timeframe === "15m") {
    return `${base}/v2/histominute?fsym=${symbol}&tsym=USDT&limit=120&aggregate=15`;
  }

  if (timeframe === "1h") {
    return `${base}/v2/histohour?fsym=${symbol}&tsym=USDT&limit=120&aggregate=1`;
  }

  if (timeframe === "4h") {
    return `${base}/v2/histohour?fsym=${symbol}&tsym=USDT&limit=120&aggregate=4`;
  }

  if (timeframe === "12h") {
    return `${base}/v2/histohour?fsym=${symbol}&tsym=USDT&limit=120&aggregate=12`;
  }

  if (timeframe === "24h") {
    return `${base}/v2/histoday?fsym=${symbol}&tsym=USDT&limit=120&aggregate=1`;
  }

  return `${base}/v2/histoday?fsym=${symbol}&tsym=USDT&limit=120&aggregate=7`;
}

async function fetchCryptoCompareCloses(symbol: string, timeframe: TimeframeKey) {
  const url = getCryptoCompareEndpoint(symbol, timeframe);

  const res = await fetchWithTimeout(url);

  if (!res.ok) {
    throw new Error(`CryptoCompare failed ${symbol} ${timeframe}`);
  }

  const data = await res.json();

  const rows = data?.Data?.Data;

  if (!Array.isArray(rows)) {
    throw new Error(`Invalid CryptoCompare response ${symbol}`);
  }

  return rows
    .map((row) => {
      const value = Number(row?.close);
      return Number.isFinite(value) ? value : null;
    })
    .filter((value): value is number => value !== null);
}

async function fetchCloses(symbol: string, pair: string, timeframe: TimeframeKey) {
  try {
    return await fetchBinanceCloses(pair, timeframe);
  } catch {
    return await fetchCryptoCompareCloses(symbol, timeframe);
  }
}

async function buildRow(coin: (typeof COINS)[number]): Promise<RsiRow> {
  const results = await Promise.all(
    TIMEFRAMES.map(async (timeframe) => {
      try {
        const closes = await fetchCloses(coin.symbol, coin.pair, timeframe);
        const rsi = calculateRsi(closes, 14);
        const lastPrice = closes.length ? closes[closes.length - 1] : null;

        return {
          timeframe,
          rsi,
          lastPrice,
        };
      } catch {
        return {
          timeframe,
          rsi: null,
          lastPrice: null,
        };
      }
    })
  );

  const rsi = results.reduce((acc, item) => {
    acc[item.timeframe] = item.rsi;
    return acc;
  }, {} as Record<TimeframeKey, number | null>);

  const price =
    results.find((item) => item.timeframe === "15m")?.lastPrice ??
    results.find((item) => item.lastPrice !== null)?.lastPrice ??
    null;

  return {
    symbol: coin.symbol,
    name: coin.name,
    pair: coin.pair,
    logoUrl: getLogoUrl(coin.symbol),
    price,
    rsi,
  };
}

export async function GET() {
  try {
    const rows = await Promise.all(COINS.map(buildRow));

    return NextResponse.json({
      rows,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Грешка при RSI данните.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}