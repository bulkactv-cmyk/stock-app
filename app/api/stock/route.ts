import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";
import { createClient } from "../../../lib/supabase/server";
import { checkUsageLimit, incrementUsage } from "../../../lib/check-usage-limit";

const yahooFinance = new YahooFinance();

type CmcQuote = {
  id?: number;
  name?: string;
  symbol?: string;
  slug?: string;
  cmc_rank?: number;
  date_added?: string;
  max_supply?: number | null;
  circulating_supply?: number | null;
  total_supply?: number | null;
  self_reported_circulating_supply?: number | null;
  self_reported_market_cap?: number | null;
  tags?: string[];
  quote?: {
    USD?: {
      price?: number;
      volume_24h?: number;
      volume_change_24h?: number;
      percent_change_1h?: number;
      percent_change_24h?: number;
      percent_change_7d?: number;
      percent_change_30d?: number;
      market_cap?: number;
      market_cap_dominance?: number;
      fully_diluted_market_cap?: number;
      last_updated?: string;
    };
  };
};

type CmcInfo = {
  id?: number;
  name?: string;
  symbol?: string;
  category?: string;
  description?: string;
  slug?: string;
  logo?: string;
  subreddit?: string;
  notice?: string;
  tags?: string[];
  urls?: {
    website?: string[];
    technical_doc?: string[];
    source_code?: string[];
    twitter?: string[];
    reddit?: string[];
    chat?: string[];
    explorer?: string[];
  };
  date_added?: string;
};

const CRYPTO_MAP: Record<string, string> = {
  BTC: "BTC",
  ETH: "ETH",
  SOL: "SOL",
  BNB: "BNB",
  XRP: "XRP",
  ADA: "ADA",
  DOGE: "DOGE",
  AVAX: "AVAX",
  LINK: "LINK",
  DOT: "DOT",
  TON: "TON",
  TRX: "TRX",
  SHIB: "SHIB",
  LTC: "LTC",
  BCH: "BCH",
  UNI: "UNI",
  ATOM: "ATOM",
  NEAR: "NEAR",
  APT: "APT",
  FIL: "FIL",
  ARB: "ARB",
  OP: "OP",
  INJ: "INJ",
  SUI: "SUI",
  HBAR: "HBAR",
  PEPE: "PEPE",
};

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function estimateSignal(params: {
  peRatio: number | null;
  roe: number | null;
  operatingMargin: number | null;
  netMargin: number | null;
  debtToEquity: number | null;
}): string {
  let score = 0;

  const { peRatio, roe, operatingMargin, netMargin, debtToEquity } = params;

  if (peRatio !== null) {
    if (peRatio > 0 && peRatio <= 20) score += 1;
    else if (peRatio > 35) score -= 1;
  }

  if (roe !== null) {
    if (roe >= 0.15) score += 1;
    else if (roe < 0.08) score -= 1;
  }

  if (operatingMargin !== null) {
    if (operatingMargin >= 0.15) score += 1;
    else if (operatingMargin < 0.08) score -= 1;
  }

  if (netMargin !== null) {
    if (netMargin >= 0.1) score += 1;
    else if (netMargin < 0.05) score -= 1;
  }

  if (debtToEquity !== null) {
    if (debtToEquity <= 1.0) score += 1;
    else if (debtToEquity > 2.0) score -= 1;
  }

  if (score >= 3) return "Добра за наблюдение";
  if (score >= 1) return "Умерено атрактивна";
  return "Неизгодна в момента";
}

function calculateAIScore(params: {
  peRatio: number | null;
  roe: number | null;
  netMargin: number | null;
  debtToEquity: number | null;
}) {
  let score = 5;

  const { peRatio, roe, netMargin, debtToEquity } = params;

  if (peRatio !== null) {
    if (peRatio > 0 && peRatio <= 20) score += 1;
    if (peRatio > 35) score -= 1;
  }

  if (roe !== null) {
    if (roe >= 0.15) score += 2;
    if (roe < 0.08) score -= 1;
  }

  if (netMargin !== null) {
    if (netMargin >= 0.10) score += 1;
    if (netMargin < 0.05) score -= 1;
  }

  if (debtToEquity !== null) {
    if (debtToEquity <= 1) score += 1;
    if (debtToEquity > 2) score -= 2;
  }

  if (score > 10) score = 10;
  if (score < 1) score = 1;

  if (score >= 8) return { score, signal: "BUY" };
  if (score >= 5) return { score, signal: "HOLD" };
  return { score, signal: "SELL" };
}

async function fetchCoinMarketCapCrypto(symbol: string) {
  const apiKey = process.env.COINMARKETCAP_API_KEY;

  if (!apiKey) {
    throw new Error("Липсва COINMARKETCAP_API_KEY");
  }

  const headers = {
    "X-CMC_PRO_API_KEY": apiKey,
    Accept: "application/json",
  };

  const [quoteRes, infoRes] = await Promise.all([
    fetch(
      `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${symbol}&convert=USD`,
      {
        headers,
        cache: "no-store",
      }
    ),
    fetch(
      `https://pro-api.coinmarketcap.com/v2/cryptocurrency/info?symbol=${symbol}`,
      {
        headers,
        cache: "no-store",
      }
    ),
  ]);

  const quoteJson = await quoteRes.json();
  const infoJson = await infoRes.json();

  if (!quoteRes.ok) {
    throw new Error(
      quoteJson?.status?.error_message || "Грешка при заявка към CoinMarketCap quotes."
    );
  }

  if (!infoRes.ok) {
    throw new Error(
      infoJson?.status?.error_message || "Грешка при заявка към CoinMarketCap info."
    );
  }

  const quoteData = quoteJson?.data?.[symbol] as CmcQuote | undefined;

  const infoEntry = infoJson?.data?.[symbol];
  const infoData = Array.isArray(infoEntry)
    ? (infoEntry[0] as CmcInfo | undefined)
    : (infoEntry as CmcInfo | undefined);

  if (!quoteData) {
    throw new Error("Няма крипто данни за този символ.");
  }

  const usd = quoteData.quote?.USD;

  const circulatingSupply =
    toNumber(quoteData.circulating_supply) ??
    toNumber(quoteData.self_reported_circulating_supply);

  const maxSupply = toNumber(quoteData.max_supply);
  const totalSupply = toNumber(quoteData.total_supply);

  const supplyRatio =
    circulatingSupply !== null && maxSupply !== null && maxSupply > 0
      ? circulatingSupply / maxSupply
      : null;

  return {
    source: "coinmarketcap",
    plan: "unlimited",
    tier: "unlimited",
    assetType: "crypto",
    companyInfo: {
      symbol: quoteData.symbol || symbol,
      name: quoteData.name || symbol,
      sector: "Криптовалута",
      industry: infoData?.category || "Дигитални активи",
      description:
        infoData?.description || `${symbol} е криптовалута, търгувана спрямо USD.`,
      website: infoData?.urls?.website?.[0] || null,
      country: "Глобален пазар",
      exchange: "CoinMarketCap",
      currency: "USD",
    },
    price: toNumber(usd?.price),
    peRatio: null,
    roe: null,
    operatingMargin: null,
    netMargin: null,
    debtToEquity: null,
    purchaseSignal: "Високорисков актив",
    aiScore: {
      score: 3,
      signal: "SELL",
    },
    revenue: toNumber(usd?.volume_24h),
    marketCap:
      toNumber(usd?.market_cap) ??
      toNumber(quoteData.self_reported_market_cap),
    eps: null,
    realValue: null,
    aiAnalysis: {
      summary:
        `${quoteData.name || symbol} е криптовалута с висока волатилност. ` +
        `Тук фокусът е върху ликвидност, пазарна капитализация, supply структура и momentum, ` +
        `а не върху класически акционни метрики.`,
      bullCase: [
        "висока ликвидност",
        "силно пазарно внимание",
        "потенциал за резки движения нагоре",
      ],
      bearCase: [
        "висока волатилност",
        "липса на традиционна фундаментална оценка",
        "по-висок спекулативен риск",
      ],
      fairValueView:
        "При криптовалутите няма класически модел за fair value като при акциите",
    },
    extraMetrics: {
      freeCashFlow: null,
      roic: null,
      currentRatio: null,
      revenueGrowth: toNumber(usd?.percent_change_7d),
      earningsGrowth: toNumber(usd?.percent_change_30d),
      dividendYield: null,
    },
    cryptoData: {
      rank: toNumber(quoteData.cmc_rank),
      marketCap: toNumber(usd?.market_cap),
      fullyDilutedValuation: toNumber(usd?.fully_diluted_market_cap),
      volume24h: toNumber(usd?.volume_24h),
      volumeChange24h: toNumber(usd?.volume_change_24h),
      marketDominance: toNumber(usd?.market_cap_dominance),
      percentChange1h: toNumber(usd?.percent_change_1h),
      percentChange24h: toNumber(usd?.percent_change_24h),
      percentChange7d: toNumber(usd?.percent_change_7d),
      percentChange30d: toNumber(usd?.percent_change_30d),
      circulatingSupply,
      totalSupply,
      maxSupply,
      supplyRatio,
      launchDate: quoteData.date_added || infoData?.date_added || null,
      category: infoData?.category || null,
      whitepaper: infoData?.urls?.technical_doc?.[0] || null,
      github: infoData?.urls?.source_code?.[0] || null,
      reddit: infoData?.urls?.reddit?.[0] || infoData?.subreddit || null,
      twitter: infoData?.urls?.twitter?.[0] || null,
      explorer: infoData?.urls?.explorer?.[0] || null,
    },
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const ticker = body?.ticker;

    if (!ticker || typeof ticker !== "string") {
      return NextResponse.json(
        { error: "Липсва валиден тикер." },
        { status: 400 }
      );
    }

    const cleanTicker = ticker.trim().toUpperCase();

    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user || !user.email) {
      return NextResponse.json(
        { error: "Няма логнат потребител." },
        { status: 401 }
      );
    }

    const limitCheck = await checkUsageLimit(user.email);

    if (!limitCheck.allowed) {
      return NextResponse.json(
        {
          error: "Достигна дневния лимит за анализи.",
          plan: limitCheck.plan,
          dailyLimit: limitCheck.dailyLimit,
          usedToday: limitCheck.usedToday,
          remainingToday: limitCheck.remainingToday,
        },
        { status: 429 }
      );
    }

    const currentPlan = limitCheck.plan;

    const cryptoSymbol = CRYPTO_MAP[cleanTicker] || null;
    const isCrypto = !!cryptoSymbol;

    if (isCrypto && currentPlan !== "unlimited") {
      return NextResponse.json(
        { error: "Криптовалутите са налични само в Unlimited плана." },
        { status: 403 }
      );
    }

    if (isCrypto && currentPlan === "unlimited") {
      const cryptoPayload = await fetchCoinMarketCapCrypto(cryptoSymbol);
      await incrementUsage(user.email);
      return NextResponse.json({
        ...cryptoPayload,
        dailyLimit: limitCheck.dailyLimit,
        usedToday: limitCheck.usedToday + 1,
        remainingToday: Math.max(limitCheck.remainingToday - 1, 0),
      });
    }

    const quote = await yahooFinance.quote(cleanTicker);

    const summary = await yahooFinance.quoteSummary(cleanTicker, {
      modules: [
        "assetProfile",
        "defaultKeyStatistics",
        "financialData",
        "summaryDetail",
      ],
    });

    const price =
      quote.regularMarketPrice ??
      quote.postMarketPrice ??
      quote.preMarketPrice ??
      null;

    const peRatio =
      toNumber(quote.trailingPE) ??
      toNumber(summary.summaryDetail?.trailingPE);

    const roe = toNumber(summary.financialData?.returnOnEquity);
    const operatingMargin = toNumber(summary.financialData?.operatingMargins);
    const netMargin = toNumber(summary.financialData?.profitMargins);
    const debtToEquity = toNumber(summary.financialData?.debtToEquity);

    const aiScore = calculateAIScore({
      peRatio,
      roe,
      netMargin,
      debtToEquity,
    });

    const companyProfile = {
      symbol: quote.symbol || cleanTicker,
      name: quote.shortName || quote.longName || "Няма данни",
      sector: summary.assetProfile?.sector || null,
      industry: summary.assetProfile?.industry || null,
      description: summary.assetProfile?.longBusinessSummary || null,
      website: summary.assetProfile?.website || null,
      country: summary.assetProfile?.country || null,
      exchange: quote.fullExchangeName || quote.exchange || null,
      currency: quote.currency || null,
    };

    const basicPayload = {
      source: "yahoo_finance",
      plan: currentPlan,
      tier: "basic",
      assetType: "stock",
      companyInfo: companyProfile,
      price,
      peRatio,
      roe,
      operatingMargin,
      netMargin,
      debtToEquity,
      purchaseSignal: estimateSignal({
        peRatio,
        roe,
        operatingMargin,
        netMargin,
        debtToEquity,
      }),
      aiScore,
      dailyLimit: limitCheck.dailyLimit,
      usedToday: limitCheck.usedToday + 1,
      remainingToday: Math.max(limitCheck.remainingToday - 1, 0),
    };

    if (currentPlan === "basic") {
      await incrementUsage(user.email);
      return NextResponse.json(basicPayload);
    }

    if (currentPlan === "pro") {
      const revenue = toNumber(summary.financialData?.totalRevenue);
      const marketCap = toNumber(quote.marketCap);
      const eps =
        toNumber(summary.defaultKeyStatistics?.trailingEps) ??
        toNumber(quote.epsTrailingTwelveMonths);

      const realValue =
        eps !== null && peRatio !== null && peRatio > 0
          ? Number((eps * Math.min(peRatio, 20)).toFixed(2))
          : null;

      const bullPoints: string[] = [];
      const bearPoints: string[] = [];

      if (roe !== null && roe >= 0.15) bullPoints.push("силна възвръщаемост на капитала");
      if (operatingMargin !== null && operatingMargin >= 0.15) bullPoints.push("добър оперативен марж");
      if (netMargin !== null && netMargin >= 0.1) bullPoints.push("стабилен нетен марж");
      if (debtToEquity !== null && debtToEquity <= 1.0) bullPoints.push("контролируем дълг");

      if (peRatio !== null && peRatio > 30) bearPoints.push("висока оценка спрямо печалбата");
      if (debtToEquity !== null && debtToEquity > 2.0) bearPoints.push("повишена задлъжнялост");
      if (operatingMargin !== null && operatingMargin < 0.08) bearPoints.push("слаб оперативен марж");
      if (netMargin !== null && netMargin < 0.05) bearPoints.push("нисък нетен марж");

      const responsePayload = {
        ...basicPayload,
        tier: "pro",
        revenue,
        marketCap,
        eps,
        realValue,
        aiAnalysis: {
          summary:
            `${companyProfile.name} изглежда ` +
            `${(realValue !== null && price !== null
              ? price < realValue
                ? "под справедливата стойност"
                : price > realValue
                ? "над справедливата стойност"
                : "близо до справедливата стойност"
              : "неутрално оценена")}. Основният фокус е върху ` +
            `${bullPoints[0] || "качеството на бизнеса"} и ` +
            `${bearPoints[0] || "оценката на акцията"}.`,
          bullCase: bullPoints.length ? bullPoints : ["липсва силен положителен сигнал"],
          bearCase: bearPoints.length ? bearPoints : ["липсва силен негативен сигнал"],
          fairValueView:
            realValue !== null && price !== null
              ? price < realValue
                ? "Изглежда под справедливата стойност"
                : price > realValue
                ? "Изглежда над справедливата стойност"
                : "Близо е до справедливата стойност"
              : "Недостатъчно данни за ясна оценка на справедливата стойност",
        },
      };

      await incrementUsage(user.email);
      return NextResponse.json(responsePayload);
    }

    const revenue = toNumber(summary.financialData?.totalRevenue);
    const marketCap = toNumber(quote.marketCap);
    const eps =
      toNumber(summary.defaultKeyStatistics?.trailingEps) ??
      toNumber(quote.epsTrailingTwelveMonths);

    const realValue =
      eps !== null && peRatio !== null && peRatio > 0
        ? Number((eps * Math.min(peRatio, 20)).toFixed(2))
        : null;

    const freeCashFlow = toNumber(summary.financialData?.freeCashflow);
    const roic = toNumber(summary.financialData?.returnOnAssets);
    const currentRatio = toNumber(summary.financialData?.currentRatio);
    const revenueGrowth = toNumber(summary.financialData?.revenueGrowth);
    const earningsGrowth = toNumber(summary.financialData?.earningsGrowth);
    const dividendYield =
      toNumber(summary.summaryDetail?.dividendYield) ??
      toNumber(quote.trailingAnnualDividendYield);

    const deepSignals: string[] = [];
    if (freeCashFlow !== null && freeCashFlow > 0) deepSignals.push("положителен свободен паричен поток");
    if (revenueGrowth !== null && revenueGrowth > 0.05) deepSignals.push("добър ръст на приходите");
    if (earningsGrowth !== null && earningsGrowth > 0.05) deepSignals.push("добър ръст на печалбата");
    if (currentRatio !== null && currentRatio >= 1) deepSignals.push("нормална краткосрочна ликвидност");

    const responsePayload = {
      ...basicPayload,
      tier: "unlimited",
      revenue,
      marketCap,
      eps,
      realValue,
      aiAnalysis: {
        summary:
          `${companyProfile.name} преминава разширен unlimited анализ ` +
          `с акцент върху качество, растеж, ликвидност и оценка.`,
        bullCase: deepSignals.length ? deepSignals : ["липсват достатъчно силни положителни сигнали"],
        bearCase: [
          peRatio !== null && peRatio > 30 ? "по-висока оценка" : null,
          debtToEquity !== null && debtToEquity > 2 ? "по-висок финансов риск" : null,
          netMargin !== null && netMargin < 0.05 ? "слаб нетен марж" : null,
        ].filter(Boolean),
        fairValueView:
          realValue !== null && price !== null
            ? price < realValue
              ? "Под справедливата стойност"
              : price > realValue
              ? "Над справедливата стойност"
              : "Близо до справедливата стойност"
            : "Недостатъчно данни за fair value",
      },
      extraMetrics: {
        freeCashFlow,
        roic,
        currentRatio,
        revenueGrowth,
        earningsGrowth,
        dividendYield,
      },
    };

    await incrementUsage(user.email);
    return NextResponse.json(responsePayload);
  } catch (error: any) {
    console.error("STOCK ROUTE ERROR:", error);
    return NextResponse.json(
      { error: error?.message || "Грешка при stock анализа." },
      { status: 500 }
    );
  }
}