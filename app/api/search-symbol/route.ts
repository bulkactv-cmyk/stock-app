import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

export const runtime = "nodejs";

const yahooFinance = new YahooFinance();

type YahooSearchQuote = {
  symbol?: string;
  shortname?: string;
  longname?: string;
  quoteType?: string;
  typeDisp?: string;
  exchDisp?: string;
  exchange?: string;
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim();

    if (!query || query.length < 2) {
      return NextResponse.json([]);
    }

    const result = await yahooFinance.search(query, {
      quotesCount: 10,
      newsCount: 0,
    });

    const quotes = ((result?.quotes || []) as YahooSearchQuote[])
      .filter((item) => {
        const quoteType = String(item.quoteType || "").toUpperCase();
        const typeDisp = String(item.typeDisp || "").toUpperCase();

        return (
          item.symbol &&
          (quoteType === "EQUITY" ||
            quoteType === "ETF" ||
            typeDisp.includes("EQUITY") ||
            typeDisp.includes("ETF"))
        );
      })
      .slice(0, 8)
      .map((item) => ({
        symbol: String(item.symbol || "").toUpperCase(),
        name: item.longname || item.shortname || item.symbol || "Unknown",
        exchange: item.exchDisp || item.exchange || null,
        type: item.quoteType || item.typeDisp || "Equity",
      }));

    return NextResponse.json(quotes);
  } catch (error: unknown) {
    console.error("SEARCH SYMBOL ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Symbol search failed.",
      },
      { status: 500 }
    );
  }
}