import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";
import { createClient } from "../../../lib/supabase/server";
import { checkUsageLimit, incrementUsage } from "../../../lib/check-usage-limit";

export const runtime = "nodejs";

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

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function formatMetric(value: number | null, suffix = "") {
  if (value === null || Number.isNaN(value)) return "not available";
  return `${Number(value).toFixed(2)}${suffix}`;
}

function formatPercentMetric(value: number | null) {
  if (value === null || Number.isNaN(value)) return "not available";
  return `${(value * 100).toFixed(2)}%`;
}

function safeLimitValue(value: number) {
  return value === Infinity ? "unlimited" : value;
}

function safeRemainingValue(value: number) {
  return value === Infinity ? "unlimited" : value;
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

  if (score >= 3) return "Attractive for watchlist";
  if (score >= 1) return "Moderately attractive";
  return "Unattractive at current levels";
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

function buildProAnalysis(params: {
  companyName: string;
  price: number | null;
  realValue: number | null;
  peRatio: number | null;
  roe: number | null;
  operatingMargin: number | null;
  netMargin: number | null;
  debtToEquity: number | null;
}) {
  const {
    companyName,
    price,
    realValue,
    peRatio,
    roe,
    operatingMargin,
    netMargin,
    debtToEquity,
  } = params;

  const bullPoints: string[] = [];
  const bearPoints: string[] = [];

  if (roe !== null && roe >= 0.15) {
    bullPoints.push(`Strong return on equity at ${formatPercentMetric(roe)}, indicating efficient use of shareholder capital.`);
  }
  if (operatingMargin !== null && operatingMargin >= 0.15) {
    bullPoints.push(`Healthy operating margin at ${formatPercentMetric(operatingMargin)}, showing solid core profitability.`);
  }
  if (netMargin !== null && netMargin >= 0.1) {
    bullPoints.push(`Stable net margin at ${formatPercentMetric(netMargin)}, suggesting good bottom-line conversion.`);
  }
  if (debtToEquity !== null && debtToEquity <= 1.0) {
    bullPoints.push(`Manageable leverage with debt-to-equity near ${formatMetric(debtToEquity)}.`);
  }

  if (peRatio !== null && peRatio > 30) {
    bearPoints.push(`Elevated valuation with a P/E ratio near ${formatMetric(peRatio)}, leaving less room for execution mistakes.`);
  }
  if (debtToEquity !== null && debtToEquity > 2.0) {
    bearPoints.push(`Higher balance-sheet risk due to debt-to-equity near ${formatMetric(debtToEquity)}.`);
  }
  if (operatingMargin !== null && operatingMargin < 0.08) {
    bearPoints.push(`Weak operating margin at ${formatPercentMetric(operatingMargin)}, which may limit earnings resilience.`);
  }
  if (netMargin !== null && netMargin < 0.05) {
    bearPoints.push(`Low net margin at ${formatPercentMetric(netMargin)}, indicating limited profitability after costs.`);
  }

  const valuationText =
    realValue !== null && price !== null
      ? price < realValue
        ? "appears to trade below the model-implied fair value"
        : price > realValue
        ? "appears to trade above the model-implied fair value"
        : "trades close to the model-implied fair value"
      : "cannot be valued with high confidence because several key inputs are missing";

  return {
    summary:
      `${companyName} ${valuationText}. The PRO view focuses on valuation, profitability, leverage and margin quality. ` +
      `The stock should be interpreted through the balance between business quality and the price investors are currently paying.`,
    bullCase: bullPoints.length
      ? bullPoints
      : ["There is no strong positive signal from the available profitability, leverage and valuation metrics."],
    bearCase: bearPoints.length
      ? bearPoints
      : ["There is no major negative signal from the available profitability, leverage and valuation metrics."],
    fairValueView:
      realValue !== null && price !== null
        ? price < realValue
          ? "The stock looks below estimated fair value based on the simplified EPS and P/E model."
          : price > realValue
          ? "The stock looks above estimated fair value based on the simplified EPS and P/E model."
          : "The stock looks close to estimated fair value based on the simplified EPS and P/E model."
        : "There is not enough data to calculate a reliable fair value estimate.",
  };
}

function buildUnlimitedAnalysis(params: {
  companyName: string;
  price: number | null;
  realValue: number | null;
  peRatio: number | null;
  roe: number | null;
  operatingMargin: number | null;
  netMargin: number | null;
  debtToEquity: number | null;
  revenue: number | null;
  marketCap: number | null;
  eps: number | null;
  freeCashFlow: number | null;
  roic: number | null;
  currentRatio: number | null;
  revenueGrowth: number | null;
  earningsGrowth: number | null;
  dividendYield: number | null;
}) {
  const {
    companyName,
    price,
    realValue,
    peRatio,
    roe,
    operatingMargin,
    netMargin,
    debtToEquity,
    revenue,
    marketCap,
    eps,
    freeCashFlow,
    roic,
    currentRatio,
    revenueGrowth,
    earningsGrowth,
    dividendYield,
  } = params;

  const bullCase: string[] = [];
  const bearCase: string[] = [];

  if (freeCashFlow !== null && freeCashFlow > 0) {
    bullCase.push("Positive free cash flow supports financial flexibility, buybacks, debt reduction or reinvestment into growth.");
  }
  if (revenueGrowth !== null && revenueGrowth > 0.05) {
    bullCase.push(`Revenue growth of ${formatPercentMetric(revenueGrowth)} indicates that demand is still expanding at a healthy pace.`);
  }
  if (earningsGrowth !== null && earningsGrowth > 0.05) {
    bullCase.push(`Earnings growth of ${formatPercentMetric(earningsGrowth)} suggests improving profitability and operating leverage.`);
  }
  if (roe !== null && roe >= 0.15) {
    bullCase.push(`ROE of ${formatPercentMetric(roe)} points to strong capital efficiency and potentially durable shareholder value creation.`);
  }
  if (operatingMargin !== null && operatingMargin >= 0.15) {
    bullCase.push(`Operating margin of ${formatPercentMetric(operatingMargin)} shows that the core business has meaningful pricing power or cost discipline.`);
  }
  if (currentRatio !== null && currentRatio >= 1) {
    bullCase.push(`Current ratio of ${formatMetric(currentRatio)} suggests acceptable short-term liquidity.`);
  }

  if (peRatio !== null && peRatio > 30) {
    bearCase.push(`The P/E ratio near ${formatMetric(peRatio)} implies high market expectations and increases downside risk if growth slows.`);
  }
  if (debtToEquity !== null && debtToEquity > 2) {
    bearCase.push(`Debt-to-equity near ${formatMetric(debtToEquity)} increases financial risk, especially in a higher-rate environment.`);
  }
  if (netMargin !== null && netMargin < 0.05) {
    bearCase.push(`Net margin of ${formatPercentMetric(netMargin)} is thin, leaving limited room for cost inflation or revenue weakness.`);
  }
  if (revenueGrowth !== null && revenueGrowth < 0) {
    bearCase.push(`Negative revenue growth of ${formatPercentMetric(revenueGrowth)} signals demand pressure or cyclical weakness.`);
  }
  if (earningsGrowth !== null && earningsGrowth < 0) {
    bearCase.push(`Negative earnings growth of ${formatPercentMetric(earningsGrowth)} points to weakening profitability momentum.`);
  }
  if (freeCashFlow !== null && freeCashFlow < 0) {
    bearCase.push("Negative free cash flow can reduce financial flexibility and may require external financing if it persists.");
  }

  const valuationView =
    realValue !== null && price !== null
      ? price < realValue
        ? `The simplified fair value model suggests upside because the current price is below estimated fair value of ${formatMetric(realValue)}.`
        : price > realValue
        ? `The simplified fair value model suggests caution because the current price is above estimated fair value of ${formatMetric(realValue)}.`
        : `The current price is very close to the simplified fair value estimate of ${formatMetric(realValue)}.`
      : "Fair value confidence is limited because EPS or valuation multiple inputs are incomplete.";

  const summary =
    `${companyName} receives an UNLIMITED-level institutional review across valuation, profitability, growth, liquidity and balance-sheet quality. ` +
    `Current price is ${price !== null ? formatMetric(price) : "not available"}, estimated fair value is ${realValue !== null ? formatMetric(realValue) : "not available"}, ` +
    `P/E is ${formatMetric(peRatio)}, revenue growth is ${formatPercentMetric(revenueGrowth)}, earnings growth is ${formatPercentMetric(earningsGrowth)}, ` +
    `operating margin is ${formatPercentMetric(operatingMargin)}, net margin is ${formatPercentMetric(netMargin)}, and debt-to-equity is ${formatMetric(debtToEquity)}. ` +
    `The investment case should be judged by whether growth and cash generation are strong enough to justify the current valuation and financial risk profile.`;

  return {
    summary,
    bullCase: bullCase.length
      ? bullCase
      : [
          "The available data does not show enough strong bullish evidence. Investors should wait for clearer signs of growth, margin expansion or cash-flow strength.",
        ],
    bearCase: bearCase.length
      ? bearCase
      : [
          "The available data does not show a severe bearish signal, but valuation, growth consistency and balance-sheet quality should still be monitored.",
        ],
    fairValueView: valuationView,
    catalysts: [
      "Next earnings report and management guidance updates.",
      "Revenue acceleration or slowdown versus market expectations.",
      "Margin expansion, cost control or signs of operating leverage.",
      "Changes in interest-rate expectations and broader equity risk appetite.",
      "Company-specific product launches, AI initiatives, buybacks or capital allocation updates.",
    ],
    risks: [
      "Valuation compression if growth expectations fall.",
      "Margin pressure from weaker demand, higher costs or competition.",
      "Balance-sheet stress if debt levels remain high or refinancing costs increase.",
      "Negative earnings revisions after quarterly results.",
      "Macro risk from rates, liquidity conditions and sector rotation.",
    ],
    valuationNotes: [
      `Market cap: ${marketCap !== null ? formatMetric(marketCap) : "not available"}.`,
      `Revenue: ${revenue !== null ? formatMetric(revenue) : "not available"}.`,
      `EPS: ${eps !== null ? formatMetric(eps) : "not available"}.`,
      `Free cash flow: ${freeCashFlow !== null ? formatMetric(freeCashFlow) : "not available"}.`,
      `ROA/ROIC proxy: ${roic !== null ? formatPercentMetric(roic) : "not available"}.`,
      `Dividend yield: ${dividendYield !== null ? formatPercentMetric(dividendYield) : "not available"}.`,
    ],
  };
}



const COMPANY_ALIAS_TO_SYMBOL: Record<string, string> = {
  VW: "VOW3.DE",
  "VW.DE": "VOW3.DE",
  VOLKSWAGEN: "VOW3.DE",
  "VOLKSWAGEN AG": "VOW3.DE",
  VOW: "VOW3.DE",
  "VOW.DE": "VOW.DE",
  VOW3: "VOW3.DE",
  "VOW3.DE": "VOW3.DE",

  MERCEDES: "MBG.DE",
  "MERCEDES BENZ": "MBG.DE",
  "MERCEDES-BENZ": "MBG.DE",
  "MERCEDES-BENZ GROUP": "MBG.DE",
  DAIMLER: "MBG.DE",
  MBG: "MBG.DE",
  "MBG.DE": "MBG.DE",

  BMW: "BMW.DE",
  "BMW.DE": "BMW.DE",

  PORSCHE: "P911.DE",
  "PORSCHE AG": "P911.DE",
  P911: "P911.DE",
  "P911.DE": "P911.DE",

  SIEMENS: "SIE.DE",
  "SIE.DE": "SIE.DE",

  ALLIANZ: "ALV.DE",
  "ALV.DE": "ALV.DE",

  BASF: "BAS.DE",
  "BAS.DE": "BAS.DE",

  SAP: "SAP.DE",
  "SAP.DE": "SAP.DE",
};

type YahooSearchQuote = {
  symbol?: string;
  shortname?: string;
  longname?: string;
  quoteType?: string;
  exchDisp?: string;
  exchange?: string;
  typeDisp?: string;
};

function normalizeCompanyQuery(input: string): string {
  return input
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ")
    .replace(/[.,]/g, "");
}

function looksLikeDirectTicker(input: string): boolean {
  const value = input.trim().toUpperCase();

  if (!value) return false;

  return /^[A-Z0-9.\-=]{1,15}$/.test(value) && !value.includes(" ");
}

async function searchYahooSymbol(input: string): Promise<{
  symbol: string;
  resolvedName: string | null;
}> {
  const searchResult = await yahooFinance.search(input, {
    quotesCount: 10,
    newsCount: 0,
  });

  const quotes = ((searchResult?.quotes || []) as YahooSearchQuote[]).filter(
    (item) => {
      const quoteType = String(item.quoteType || "").toUpperCase();
      const typeDisp = String(item.typeDisp || "").toUpperCase();

      return (
        !!item.symbol &&
        (
          quoteType === "EQUITY" ||
          quoteType === "ETF" ||
          typeDisp.includes("EQUITY") ||
          typeDisp.includes("ETF")
        )
      );
    }
  );

  const preferred = quotes.find((item) => {
    const symbol = String(item.symbol || "").toUpperCase();
    const exchange = String(item.exchange || item.exchDisp || "").toUpperCase();

    return (
      symbol.endsWith(".DE") ||
      symbol.endsWith(".F") ||
      symbol.endsWith(".L") ||
      symbol.endsWith(".PA") ||
      symbol.endsWith(".AS") ||
      symbol.endsWith(".MI") ||
      symbol.endsWith(".SW") ||
      exchange.includes("XETRA") ||
      exchange.includes("GERMAN") ||
      exchange.includes("FRANKFURT") ||
      exchange.includes("LONDON") ||
      exchange.includes("EURONEXT")
    );
  });

  const selected = preferred || quotes[0];

  if (!selected?.symbol) {
    throw new Error("No stock symbol found for this company name.");
  }

  return {
    symbol: selected.symbol.toUpperCase(),
    resolvedName: selected.longname || selected.shortname || null,
  };
}

async function resolveYahooSymbol(input: string): Promise<{
  symbol: string;
  resolvedFromName: boolean;
  originalQuery: string;
  resolvedName: string | null;
}> {
  const originalQuery = input.trim();
  const normalizedQuery = normalizeCompanyQuery(originalQuery);
  const cleanQuery = originalQuery.toUpperCase();

  const aliasSymbol = COMPANY_ALIAS_TO_SYMBOL[normalizedQuery] || COMPANY_ALIAS_TO_SYMBOL[cleanQuery];

  if (aliasSymbol) {
    return {
      symbol: aliasSymbol,
      resolvedFromName: true,
      originalQuery,
      resolvedName: normalizedQuery,
    };
  }

  if (looksLikeDirectTicker(originalQuery)) {
    return {
      symbol: cleanQuery,
      resolvedFromName: false,
      originalQuery,
      resolvedName: null,
    };
  }

  const searched = await searchYahooSymbol(originalQuery);

  return {
    symbol: searched.symbol,
    resolvedFromName: true,
    originalQuery,
    resolvedName: searched.resolvedName,
  };
}

async function fetchYahooQuoteAndSummary(input: string) {
  const firstResolved = await resolveYahooSymbol(input);

  try {
    const [quote, summary] = await Promise.all([
      yahooFinance.quote(firstResolved.symbol),
      yahooFinance.quoteSummary(firstResolved.symbol, {
        modules: [
          "assetProfile",
          "defaultKeyStatistics",
          "financialData",
          "summaryDetail",
        ],
      }),
    ]);

    return {
      quote,
      summary,
      resolved: firstResolved,
    };
  } catch (firstError) {
    if (!firstResolved.resolvedFromName) {
      const searched = await searchYahooSymbol(input);

      const [quote, summary] = await Promise.all([
        yahooFinance.quote(searched.symbol),
        yahooFinance.quoteSummary(searched.symbol, {
          modules: [
            "assetProfile",
            "defaultKeyStatistics",
            "financialData",
            "summaryDetail",
          ],
        }),
      ]);

      return {
        quote,
        summary,
        resolved: {
          symbol: searched.symbol,
          resolvedFromName: true,
          originalQuery: input,
          resolvedName: searched.resolvedName,
        },
      };
    }

    throw firstError;
  }
}

async function fetchCoinMarketCapCrypto(symbol: string) {
  const apiKey = process.env.COINMARKETCAP_API_KEY;

  if (!apiKey) {
    throw new Error("Missing COINMARKETCAP_API_KEY");
  }

  const cleanSymbol = symbol.trim().toUpperCase();

  if (!cleanSymbol) {
    throw new Error("Missing crypto symbol.");
  }

  const headers = {
    "X-CMC_PRO_API_KEY": apiKey,
    Accept: "application/json",
  };

  const [quoteRes, infoRes] = await Promise.all([
    fetch(
      `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${encodeURIComponent(
        cleanSymbol
      )}&convert=USD`,
      {
        headers,
        cache: "no-store",
      }
    ),
    fetch(
      `https://pro-api.coinmarketcap.com/v2/cryptocurrency/info?symbol=${encodeURIComponent(
        cleanSymbol
      )}`,
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
      quoteJson?.status?.error_message || "CoinMarketCap quote request failed."
    );
  }

  if (!infoRes.ok) {
    throw new Error(
      infoJson?.status?.error_message || "CoinMarketCap info request failed."
    );
  }

  const rawQuoteData = quoteJson?.data?.[cleanSymbol];

  const quoteData = Array.isArray(rawQuoteData)
    ? ([...rawQuoteData] as CmcQuote[]).sort(
        (a, b) => (a.cmc_rank || 999999) - (b.cmc_rank || 999999)
      )[0]
    : (rawQuoteData as CmcQuote | undefined);

  const infoEntry = infoJson?.data?.[cleanSymbol];

  const infoData = Array.isArray(infoEntry)
    ? ([...infoEntry] as CmcInfo[]).sort((a, b) => {
        const aId = typeof a.id === "number" ? a.id : 999999999;
        const bId = typeof b.id === "number" ? b.id : 999999999;
        return aId - bId;
      })[0]
    : (infoEntry as CmcInfo | undefined);

  if (!quoteData) {
    throw new Error("No crypto data found for this symbol.");
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
      symbol: quoteData.symbol || cleanSymbol,
      name: quoteData.name || cleanSymbol,
      sector: "Cryptocurrency",
      industry: infoData?.category || "Digital Assets",
      description:
        infoData?.description ||
        `${quoteData.symbol || cleanSymbol} is a cryptocurrency traded against USD.`,
      website: infoData?.urls?.website?.[0] || null,
      country: "Global market",
      exchange: "CoinMarketCap",
      currency: "USD",
    },
    price: toNumber(usd?.price),
    peRatio: null,
    roe: null,
    operatingMargin: null,
    netMargin: null,
    debtToEquity: null,
    purchaseSignal: "High-risk asset",
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
        `${quoteData.name || cleanSymbol} is a high-volatility digital asset. The analysis focuses on liquidity, market capitalization, supply structure, dominance and momentum rather than traditional equity metrics such as EPS, P/E or margins.`,
      bullCase: [
        "High liquidity can support efficient entry and exit for active traders.",
        "Strong market attention can create upside momentum during crypto risk-on phases.",
        "Large market capitalization may attract institutional flows compared with smaller digital assets.",
        "Positive ETF, regulatory or adoption headlines can quickly re-rate sentiment.",
      ],
      bearCase: [
        "Crypto assets remain highly volatile and can experience sharp drawdowns.",
        "There is no traditional fair value model comparable to equities.",
        "Regulatory pressure, exchange risk and liquidity shocks can materially affect price.",
        "Momentum can reverse quickly when leverage unwinds across the crypto market.",
      ],
      fairValueView:
        "For cryptocurrencies, fair value should be interpreted through liquidity, adoption, network effects, supply dynamics and market cycle positioning rather than a classic earnings-based model.",
      catalysts: [
        "ETF flow data and institutional allocation trends.",
        "Regulatory decisions in major jurisdictions.",
        "Network upgrades, adoption metrics and ecosystem growth.",
        "Bitcoin dominance, stablecoin liquidity and broader risk appetite.",
      ],
      risks: [
        "High volatility and forced liquidations.",
        "Regulatory actions or exchange-specific stress.",
        "Sharp liquidity contraction during risk-off markets.",
        "Speculative positioning and leverage-driven reversals.",
      ],
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

async function tryFetchCoinMarketCapCrypto(symbol: string) {
  try {
    return await fetchCoinMarketCapCrypto(symbol);
  } catch (error) {
    console.log("CRYPTO LOOKUP SKIPPED:", {
      symbol,
      message: error instanceof Error ? error.message : String(error),
    });

    return null;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const ticker = body?.ticker;

    if (!ticker || typeof ticker !== "string") {
      return NextResponse.json(
        { error: "Missing valid ticker." },
        { status: 400 }
      );
    }

    const rawTicker = ticker.trim();
    const cleanTicker = rawTicker.toUpperCase();

    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user || !user.email) {
      return NextResponse.json(
        { error: "No authenticated user." },
        { status: 401 }
      );
    }

    const limitCheck = await checkUsageLimit(user.email);

    if (!limitCheck.allowed) {
      return NextResponse.json(
        {
          error: "Daily analysis limit reached.",
          plan: limitCheck.plan,
          dailyLimit: safeLimitValue(limitCheck.dailyLimit),
          usedToday: limitCheck.usedToday,
          remainingToday: safeRemainingValue(limitCheck.remainingToday),
        },
        { status: 429 }
      );
    }

    const currentPlan = limitCheck.plan;

    const cryptoPayload = await tryFetchCoinMarketCapCrypto(cleanTicker);

    if (cryptoPayload) {
      if (currentPlan !== "unlimited") {
        return NextResponse.json(
          {
            error:
              "Cryptocurrency analysis is available only on the Unlimited plan.",
          },
          { status: 403 }
        );
      }

      await incrementUsage(user.email);

      return NextResponse.json({
        ...cryptoPayload,
        dailyLimit: safeLimitValue(limitCheck.dailyLimit),
        usedToday: limitCheck.usedToday + 1,
        remainingToday:
          limitCheck.remainingToday === Infinity
            ? "unlimited"
            : Math.max(limitCheck.remainingToday - 1, 0),
      });
    }

    const { quote, summary, resolved } = await fetchYahooQuoteAndSummary(rawTicker);

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
      name: quote.shortName || quote.longName || "No data",
      sector: summary.assetProfile?.sector || null,
      industry: summary.assetProfile?.industry || null,
      description: summary.assetProfile?.longBusinessSummary || null,
      website: summary.assetProfile?.website || null,
      country: summary.assetProfile?.country || null,
      exchange: quote.fullExchangeName || quote.exchange || null,
      currency: quote.currency || null,
      resolvedFromName: resolved.resolvedFromName,
      originalQuery: resolved.originalQuery,
      resolvedName: resolved.resolvedName,
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
      dailyLimit: safeLimitValue(limitCheck.dailyLimit),
      usedToday: limitCheck.usedToday + 1,
      remainingToday:
        limitCheck.remainingToday === Infinity
          ? "unlimited"
          : Math.max(limitCheck.remainingToday - 1, 0),
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

      const responsePayload = {
        ...basicPayload,
        tier: "pro",
        revenue,
        marketCap,
        eps,
        realValue,
        aiAnalysis: buildProAnalysis({
          companyName: companyProfile.name,
          price,
          realValue,
          peRatio,
          roe,
          operatingMargin,
          netMargin,
          debtToEquity,
        }),
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

    const responsePayload = {
      ...basicPayload,
      tier: "unlimited",
      revenue,
      marketCap,
      eps,
      realValue,
      aiAnalysis: buildUnlimitedAnalysis({
        companyName: companyProfile.name,
        price,
        realValue,
        peRatio,
        roe,
        operatingMargin,
        netMargin,
        debtToEquity,
        revenue,
        marketCap,
        eps,
        freeCashFlow,
        roic,
        currentRatio,
        revenueGrowth,
        earningsGrowth,
        dividendYield,
      }),
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
  } catch (error: unknown) {
    console.error("STOCK ROUTE ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Stock analysis failed.",
      },
      { status: 500 }
    );
  }
}
