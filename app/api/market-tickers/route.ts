import { NextResponse } from "next/server";

type MarketTickerItem = {
  label: string;
  value: string;
  change: string;
  positive: boolean;
  points: number[];
};

const TICKERS: MarketTickerItem[] = [
  {
    label: "S&P 500",
    value: "5,844.19",
    change: "-3.02%",
    positive: false,
    points: [70,68,66,65,61,58,56,54,57,52,49,46,44,42,45,41],
  },
  {
    label: "Dow 30",
    value: "49,760.50",
    change: "+0.11%",
    positive: true,
    points: [62,61,60,61,63,66,68,70,66,67,69,71,70,71,72,73],
  },
  {
    label: "Nasdaq",
    value: "26,088.20",
    change: "-0.71%",
    positive: false,
    points: [78,76,73,70,67,64,61,59,57,54,52,48,45,43,40,38],
  },
  {
    label: "Gold",
    value: "4,725.20",
    change: "+0.82%",
    positive: true,
    points: [66,65,63,64,61,58,60,57,54,55,52,49,46,48,44,42],
  },
  {
    label: "Silver",
    value: "32.48",
    change: "+1.14%",
    positive: true,
    points: [38,40,42,44,47,49,53,55,57,60,58,61,64,66,68,72],
  },
];

export async function GET() {
  return NextResponse.json(TICKERS, {
    status: 200,
    headers: {
      "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}