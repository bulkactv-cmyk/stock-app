import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance();

type CmcQuote = {
  id?: number;
  name?: string;
  symbol?: string;
  quote?: {
    USD?: {
      price?: number;
      percent_change_24h?: number;
    };
  };
};

type CmcInfoItem = {
  id?: number;
  name?: string;
  symbol?: string;
  logo?: string;
};

const STOCK_SYMBOLS = [
  "AAPL",
  "MSFT",
  "NVDA",
  "AMZN",
  "GOOGL",
  "META",
  "TSLA",
  "JPM",
  "V",
  "WMT",
];

const CRYPTO_SYMBOLS = [
  "BTC",
  "ETH",
  "SOL",
  "BNB",
  "XRP",
  "ADA",
  "DOGE",
  "AVAX",
  "LINK",
  "DOT",
];

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function extractHostname(url?: string | null): string | null {
  if (!url) return null;

  try {
    const normalized =
      url.startsWith("http://") || url.startsWith("https://")
        ? url
        : `https://${url}`;

    const hostname = new URL(normalized).hostname.replace(/^www\./, "");
    return hostname || null;
  } catch {
    return null;
  }
}

function buildStockLogoUrl(website?: string | null): string | null {
  const hostname = extractHostname(website);
  if (!hostname) return null;

  return `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`;
}

function buildForcedSparkline(
  price: number | null,
  changePercent: number | null,
  points = 20
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

async function getStockSparkline(symbol: string): Promise<number[]> {
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

    return closes.slice(-20);
  } catch (error) {
    console.error(`Stock sparkline error for ${symbol}:`, error);
    return [];
  }
}

export async function GET() {
  try {
    const stockResults = await Promise.all(
      STOCK_SYMBOLS.map(async (symbol) => {
        try {
          const [quote, summary, sparklineRaw] = await Promise.all([
            yahooFinance.quote(symbol),
            yahooFinance.quoteSummary(symbol, {
              modules: ["assetProfile"],
            }),
            getStockSparkline(symbol),
          ]);

          const website = summary?.assetProfile?.website || null;
          const price =
            toNumber(quote.regularMarketPrice) ??
            toNumber(quote.postMarketPrice) ??
            toNumber(quote.preMarketPrice);

          const change = toNumber(quote.regularMarketChange);
          const changePercent = toNumber(quote.regularMarketChangePercent);

          return {
            symbol,
            name: quote.shortName || quote.longName || symbol,
            logoUrl: buildStockLogoUrl(website),
            price,
            change,
            changePercent,
            sparkline:
              sparklineRaw.length >= 8
                ? sparklineRaw
                : buildForcedSparkline(price, changePercent, 20),
          };
        } catch (error) {
          console.error(`Stock overview error for ${symbol}:`, error);

          return {
            symbol,
            name: symbol,
            logoUrl: null,
            price: null,
            change: null,
            changePercent: null,
            sparkline: buildForcedSparkline(100, 0, 20),
          };
        }
      })
    );

    const cmcKey = process.env.COINMARKETCAP_API_KEY;

    if (!cmcKey) {
      return NextResponse.json(
        { error: "Липсва COINMARKETCAP_API_KEY в .env.local" },
        { status: 500 }
      );
    }

    const [cryptoRes, cryptoInfoRes] = await Promise.all([
      fetch(
        `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${CRYPTO_SYMBOLS.join(",")}&convert=USD`,
        {
          headers: {
            "X-CMC_PRO_API_KEY": cmcKey,
            Accept: "application/json",
          },
          cache: "no-store",
        }
      ),
      fetch(
        `https://pro-api.coinmarketcap.com/v2/cryptocurrency/info?symbol=${CRYPTO_SYMBOLS.join(",")}`,
        {
          headers: {
            "X-CMC_PRO_API_KEY": cmcKey,
            Accept: "application/json",
          },
          cache: "no-store",
        }
      ),
    ]);

    const cryptoJson = await cryptoRes.json();
    const cryptoInfoJson = await cryptoInfoRes.json();

    if (!cryptoRes.ok) {
      return NextResponse.json(
        {
          error:
            cryptoJson?.status?.error_message ||
            "Грешка при зареждане на крипто overview.",
        },
        { status: 500 }
      );
    }

    if (!cryptoInfoRes.ok) {
      return NextResponse.json(
        {
          error:
            cryptoInfoJson?.status?.error_message ||
            "Грешка при зареждане на крипто logo данни.",
        },
        { status: 500 }
      );
    }

    const cryptoResults = CRYPTO_SYMBOLS.map((symbol) => {
      const item = cryptoJson?.data?.[symbol] as CmcQuote | undefined;
      const usd = item?.quote?.USD;

      const infoEntry = cryptoInfoJson?.data?.[symbol];
      const infoItem = Array.isArray(infoEntry)
        ? (infoEntry[0] as CmcInfoItem | undefined)
        : (infoEntry as CmcInfoItem | undefined);

      const price = toNumber(usd?.price);
      const changePercent = toNumber(usd?.percent_change_24h);

      return {
        symbol,
        name: item?.name || symbol,
        logoUrl: infoItem?.logo || null,
        price,
        changePercent,
        sparkline: buildForcedSparkline(price, changePercent, 20),
      };
    });

    return NextResponse.json({
      stocks: stockResults,
      cryptos: cryptoResults,
      updatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("MARKET OVERVIEW ERROR:", error);

    return NextResponse.json(
      { error: error?.message || "Грешка при market overview." },
      { status: 500 }
    );
  }
}