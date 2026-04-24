import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance();

type CmcQuoteEntry = {
  symbol?: string;
  quote?: {
    USD?: {
      price?: number;
      percent_change_24h?: number;
    };
  };
};

type AlertPricesRequestBody = {
  symbols?: unknown;
};

const CRYPTO_SYMBOLS = new Set<string>([
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

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function pickCmcEntry(raw: unknown): CmcQuoteEntry | null {
  if (!raw) return null;

  if (Array.isArray(raw)) {
    return (raw[0] as CmcQuoteEntry) || null;
  }

  if (typeof raw === "object") {
    return raw as CmcQuoteEntry;
  }

  return null;
}

async function fetchCryptoPrices(symbols: string[]) {
  const apiKey = process.env.COINMARKETCAP_API_KEY;

  if (!apiKey || symbols.length === 0) {
    return {} as Record<string, { price: number | null; changePercent: number | null }>;
  }

  const res = await fetch(
    `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${symbols.join(",")}&convert=USD`,
    {
      headers: {
        "X-CMC_PRO_API_KEY": apiKey,
        Accept: "application/json",
      },
      cache: "no-store",
    }
  );

  const json: unknown = await res.json();

  const result: Record<
    string,
    { price: number | null; changePercent: number | null }
  > = {};

  for (const symbol of symbols) {
    const rawEntry =
      typeof json === "object" &&
      json !== null &&
      "data" in json &&
      typeof (json as { data?: unknown }).data === "object" &&
      (json as { data?: Record<string, unknown> }).data !== null
        ? (json as { data: Record<string, unknown> }).data[symbol]
        : undefined;

    const entry = pickCmcEntry(rawEntry);

    result[symbol] = {
      price: toNumber(entry?.quote?.USD?.price),
      changePercent: toNumber(entry?.quote?.USD?.percent_change_24h),
    };
  }

  return result;
}

async function fetchStockPrices(symbols: string[]) {
  const result: Record<
    string,
    { price: number | null; changePercent: number | null }
  > = {};

  await Promise.all(
    symbols.map(async (symbol: string) => {
      try {
        const quote = await yahooFinance.quote(symbol);

        const price =
          toNumber(quote.regularMarketPrice) ??
          toNumber(quote.postMarketPrice) ??
          toNumber(quote.preMarketPrice);

        const changePercent = toNumber(quote.regularMarketChangePercent);

        result[symbol] = {
          price,
          changePercent,
        };
      } catch {
        result[symbol] = {
          price: null,
          changePercent: null,
        };
      }
    })
  );

  return result;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as AlertPricesRequestBody;

    const rawSymbols = Array.isArray(body?.symbols) ? body.symbols : [];

    const symbols: string[] = rawSymbols
      .map((item: unknown) => String(item ?? "").trim().toUpperCase())
      .filter((item: string) => item.length > 0);

    const uniqueSymbols: string[] = [...new Set(symbols)];

    const cryptoSymbols: string[] = uniqueSymbols.filter((s: string) =>
      CRYPTO_SYMBOLS.has(s)
    );
    const stockSymbols: string[] = uniqueSymbols.filter(
      (s: string) => !CRYPTO_SYMBOLS.has(s)
    );

    const [cryptoData, stockData] = await Promise.all([
      fetchCryptoPrices(cryptoSymbols),
      fetchStockPrices(stockSymbols),
    ]);

    return NextResponse.json({
      ...stockData,
      ...cryptoData,
    });
  } catch (error: unknown) {
    console.error("ALERT PRICES ERROR:", error);

    const message =
      error instanceof Error ? error.message : "Грешка при alert prices.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}