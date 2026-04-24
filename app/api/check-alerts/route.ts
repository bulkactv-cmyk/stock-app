import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import YahooFinance from "yahoo-finance2";

export const runtime = "nodejs";

const yahooFinance = new YahooFinance();

type AlertRow = {
  id: string;
  email: string;
  symbol: string;
  asset_type: "stock" | "crypto";
  condition_type: "above" | "below";
  target_price: number;
  is_triggered?: boolean | null;
  last_triggered_at?: string | null;
  created_at?: string;
};

type CoinGeckoPriceResponse = Record<
  string,
  {
    usd?: number;
  }
>;

const CRYPTO_MAP: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  BNB: "binancecoin",
  XRP: "ripple",
  ADA: "cardano",
  DOGE: "dogecoin",
  AVAX: "avalanche-2",
  LINK: "chainlink",
  DOT: "polkadot",
  TRX: "tron",
  TON: "the-open-network",
  SHIB: "shiba-inu",
  LTC: "litecoin",
  BCH: "bitcoin-cash",
  XLM: "stellar",
  ATOM: "cosmos",
  UNI: "uniswap",
  APT: "aptos",
  NEAR: "near",
  FIL: "filecoin",
  ARB: "arbitrum",
  OP: "optimism",
  INJ: "injective-protocol",
  SUI: "sui",
  HBAR: "hedera-hashgraph",
};

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL.");
  }

  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

async function getStockPrice(symbol: string): Promise<number | null> {
  try {
    const quote = await yahooFinance.quote(symbol);

    return (
      toNumber(quote.regularMarketPrice) ??
      toNumber(quote.postMarketPrice) ??
      toNumber(quote.preMarketPrice)
    );
  } catch (error) {
    console.error(`STOCK PRICE ERROR for ${symbol}:`, error);
    return null;
  }
}

async function getCryptoPrice(symbol: string): Promise<number | null> {
  try {
    const coinGeckoId = CRYPTO_MAP[symbol] || symbol.toLowerCase();

    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(
        coinGeckoId
      )}&vs_currencies=usd`,
      {
        cache: "no-store",
      }
    );

    if (!res.ok) {
      console.error(`COINGECKO ERROR for ${symbol}:`, res.status);
      return null;
    }

    const json = (await res.json()) as CoinGeckoPriceResponse;
    const price = json?.[coinGeckoId]?.usd;

    return toNumber(price);
  } catch (error) {
    console.error(`CRYPTO PRICE ERROR for ${symbol}:`, error);
    return null;
  }
}

async function getCurrentPrice(symbol: string, assetType: "stock" | "crypto") {
  if (assetType === "crypto") {
    return await getCryptoPrice(symbol);
  }

  return await getStockPrice(symbol);
}

function shouldTriggerAlert(
  conditionType: "above" | "below",
  currentPrice: number | null,
  targetPrice: number
) {
  if (currentPrice === null || !Number.isFinite(currentPrice)) return false;

  if (conditionType === "above") {
    return currentPrice >= targetPrice;
  }

  return currentPrice <= targetPrice;
}

async function markAlertTriggered(id: string) {
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("alerts")
    .update({
      is_triggered: true,
      last_triggered_at: now,
    })
    .eq("id", id);

  if (error) {
    console.error(`UPDATE ALERT TRIGGERED ERROR for ${id}:`, error);
  }
}

async function resetAlertTriggered(id: string) {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from("alerts")
    .update({
      is_triggered: false,
      last_triggered_at: null,
    })
    .eq("id", id);

  if (error) {
    console.error(`RESET ALERT ERROR for ${id}:`, error);
  }
}

export async function GET() {
  const debug: {
    step: string;
    env: {
      hasSupabaseUrl: boolean;
      hasServiceRoleKey: boolean;
      hasResendKey: boolean;
    };
    alertsCount: number;
    checks: unknown[];
    supabaseError?: string;
    error?: string;
  } = {
    step: "start",
    env: {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasResendKey: !!process.env.RESEND_API_KEY,
    },
    alertsCount: 0,
    checks: [],
  };

  try {
    const supabase = getSupabaseAdmin();

    debug.step = "loading_alerts";

    const { data: alerts, error } = await supabase.from("alerts").select("*");

    if (error) {
      debug.step = "supabase_error";
      debug.supabaseError = error.message;
      return NextResponse.json(debug, { status: 500 });
    }

    const alertRows = (alerts || []) as AlertRow[];
    debug.alertsCount = alertRows.length;

    for (const alert of alertRows) {
      const symbol = String(alert.symbol || "").trim().toUpperCase();
      const assetType = alert.asset_type;
      const targetPrice = Number(alert.target_price);
      const wasTriggered = alert.is_triggered === true;

      if (!symbol || !alert.email || !assetType || !alert.condition_type) {
        debug.checks.push({
          id: alert.id,
          skipped: true,
          reason: "missing_data",
        });
        continue;
      }

      const currentPrice = await getCurrentPrice(symbol, assetType);

      const triggeredNow = shouldTriggerAlert(
        alert.condition_type,
        currentPrice,
        targetPrice
      );

      const item: {
        id: string;
        email: string;
        symbol: string;
        assetType: "stock" | "crypto";
        conditionType: "above" | "below";
        targetPrice: number;
        currentPrice: number | null;
        wasTriggered: boolean;
        triggeredNow: boolean;
        emailSent?: boolean;
        emailError?: string;
        updatedState?: string;
        skipped?: boolean;
        reason?: string;
      } = {
        id: alert.id,
        email: alert.email,
        symbol,
        assetType,
        conditionType: alert.condition_type,
        targetPrice,
        currentPrice,
        wasTriggered,
        triggeredNow,
      };

      if (triggeredNow && !wasTriggered) {
        try {
          const { sendAlertEmail } = await import("@/lib/email");

          await sendAlertEmail({
            to: alert.email,
            symbol,
            price: currentPrice!,
            target: targetPrice,
          });

          await markAlertTriggered(alert.id);

          item.emailSent = true;
          item.updatedState = "marked_triggered";
        } catch (emailError: unknown) {
          item.emailSent = false;
          item.emailError =
            emailError instanceof Error
              ? emailError.message
              : "Unknown email error";
        }
      } else if (triggeredNow && wasTriggered) {
        item.emailSent = false;
        item.updatedState = "already_triggered_no_email";
      } else if (!triggeredNow && wasTriggered) {
        await resetAlertTriggered(alert.id);
        item.emailSent = false;
        item.updatedState = "reset_triggered_state";
      } else {
        item.emailSent = false;
        item.updatedState = "no_action";
      }

      debug.checks.push(item);
    }

    debug.step = "done";
    return NextResponse.json(debug);
  } catch (err: unknown) {
    debug.step = "catch_error";
    debug.error = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(debug, { status: 500 });
  }
}