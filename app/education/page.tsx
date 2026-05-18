"use client";

import React, { useMemo, useState, useEffect } from "react";
import { createClient } from "../../lib/supabase/client";

type PlanType = "basic" | "pro" | "unlimited" | "loading" | "guest";

const lessons = [
  {
    title: "1. What is a stock and what is it used for?",
    content: `
A stock represents ownership in a company.

When you buy a stock:
- you become a partial owner
- you participate in the company's growth
- you may receive dividends
- you can profit from price appreciation

Example:
If Apple is worth $3 trillion and you buy shares,
you own a small part of the business.

Why stocks matter:
Stocks allow companies to raise capital and investors to participate in long-term value creation.
`,
  },
  {
    title: "2. What moves stock prices?",
    content: `
Stock prices are influenced by:

- revenue growth
- earnings growth
- future guidance
- interest rates
- inflation
- institutional buying
- valuation expectations
- market sentiment
- fear and greed

Simple formula:
Stock price = Earnings Per Share × P/E Ratio

Example:
If a company earns $5 EPS and the market values it at 20 P/E:

Stock price = 5 × 20 = $100

If EPS grows to $6 and the P/E stays 20:

Stock price = 6 × 20 = $120

That is a 20% price increase.
`,
  },
  {
    title: "3. How does company growth affect the economy?",
    content: `
When a company grows:

- it hires more employees
- pays more taxes
- increases production
- invests in technology
- expands globally
- creates demand for suppliers
- increases shareholder wealth

Example:
If a company grows revenue from $10 billion to $12 billion:

Growth = (12 - 10) / 10 × 100 = 20%

That growth can lead to:
- more jobs
- higher wages
- more tax revenue
- stronger GDP contribution
- stronger capital markets
`,
  },
  {
    title: "4. Which metrics are used to analyze a company?",
    content: `
The most important metrics are:

1. Revenue
Measures total sales.

2. EPS
Measures profit per share.

3. Gross Margin
Shows production profitability.

4. Operating Margin
Shows business efficiency.

5. Net Margin
Shows final profitability.

6. Free Cash Flow
Shows real cash after expenses and investments.

7. Debt
Shows financial risk.

8. P/E Ratio
Shows how expensive the stock is compared to earnings.

9. PEG Ratio
Compares valuation with growth.

10. ROE / ROIC / ROA
Measure how efficiently the company uses capital.

Professional investors do not look at one metric alone.
They combine growth, profitability, cash flow, debt and valuation.
`,
  },
  {
    title: "5. Revenue, EPS, P/E, P/S, PEG, EBITDA, FCF",
    content: `
1. Revenue

Revenue is total company sales before expenses.

Formula:
Revenue = Price × Units Sold

Example:
If a company sells 1,000,000 products at $50 each:

Revenue = 1,000,000 × 50 = $50,000,000

If revenue grows from $50M to $60M:

Revenue Growth = (60M - 50M) / 50M × 100 = 20%


2. EPS - Earnings Per Share

Formula:
EPS = Net Income / Shares Outstanding

Example:
Net income = $10B
Shares outstanding = 5B

EPS = 10B / 5B = $2.00


3. P/E Ratio

Formula:
P/E = Stock Price / EPS

Example:
Stock price = $100
EPS = $5

P/E = 100 / 5 = 20


4. P/S Ratio

Formula:
P/S = Market Cap / Revenue

Example:
Market cap = $100B
Revenue = $25B

P/S = 100B / 25B = 4


5. PEG Ratio

Formula:
PEG = P/E / EPS Growth Rate

Example:
P/E = 30
EPS growth = 20%

PEG = 30 / 20 = 1.5


6. EBITDA

Formula:
EBITDA = Operating Profit + Depreciation + Amortization

Example:
Operating profit = $8B
Depreciation = $1B
Amortization = $0.5B

EBITDA = 8B + 1B + 0.5B = $9.5B


7. FCF - Free Cash Flow

Formula:
FCF = Operating Cash Flow - Capital Expenditures

Example:
Operating cash flow = $15B
Capital expenditures = $5B

FCF = 15B - 5B = $10B

FCF Margin:
FCF Margin = FCF / Revenue × 100

Example:
FCF = $10B
Revenue = $50B

FCF Margin = 10B / 50B × 100 = 20%
`,
  },
  {
    title: "6. Margins: Gross, Operating, Net",
    content: `
1. Gross Margin

Formula:
Gross Margin = (Revenue - Cost of Goods Sold) / Revenue × 100

Example:
Revenue = $100M
Cost of goods sold = $40M

Gross Profit = 100M - 40M = $60M
Gross Margin = 60M / 100M × 100 = 60%


2. Operating Margin

Formula:
Operating Margin = Operating Income / Revenue × 100

Example:
Revenue = $100M
Operating income = $25M

Operating Margin = 25M / 100M × 100 = 25%


3. Net Margin

Formula:
Net Margin = Net Income / Revenue × 100

Example:
Revenue = $100M
Net income = $18M

Net Margin = 18M / 100M × 100 = 18%

Margin expansion is bullish.
Margin compression is a warning signal.
`,
  },
  {
    title: "7. Debt, Cash Flow, Balance Sheet",
    content: `
1. Net Debt

Formula:
Net Debt = Total Debt - Cash

Example:
Total debt = $30B
Cash = $12B

Net Debt = 30B - 12B = $18B


2. Debt to Equity

Formula:
Debt to Equity = Total Debt / Shareholders' Equity

Example:
Debt = $20B
Equity = $40B

Debt to Equity = 20B / 40B = 0.5


3. Interest Coverage

Formula:
Interest Coverage = EBIT / Interest Expense

Example:
EBIT = $10B
Interest expense = $1B

Interest Coverage = 10B / 1B = 10


4. Cash Flow

Operating Cash Flow shows money generated by the core business.

A strong company:
- has cash reserves
- controls debt
- generates positive cash flow
- can survive market downturns
`,
  },
  {
    title: "8. Market Cap and Enterprise Value",
    content: `
1. Market Cap

Formula:
Market Cap = Stock Price × Shares Outstanding

Example:
Stock price = $100
Shares outstanding = 1B

Market Cap = 100 × 1B = $100B


2. Enterprise Value

Formula:
Enterprise Value = Market Cap + Total Debt - Cash

Example:
Market cap = $100B
Debt = $20B
Cash = $10B

Enterprise Value = 100B + 20B - 10B = $110B


3. EV / EBITDA

Formula:
EV / EBITDA = Enterprise Value / EBITDA

Example:
EV = $110B
EBITDA = $10B

EV / EBITDA = 110B / 10B = 11
`,
  },
  {
    title: "9. ROE, ROIC, ROA",
    content: `
1. ROE

Formula:
ROE = Net Income / Shareholders' Equity × 100

Example:
Net income = $10B
Equity = $50B

ROE = 10B / 50B × 100 = 20%


2. ROIC

Formula:
ROIC = NOPAT / Invested Capital × 100

Example:
NOPAT = $8B
Invested capital = $40B

ROIC = 8B / 40B × 100 = 20%


3. ROA

Formula:
ROA = Net Income / Total Assets × 100

Example:
Net income = $10B
Total assets = $100B

ROA = 10B / 100B × 100 = 10%
`,
  },
  {
    title: "10. Dividends, Buybacks and Dilution",
    content: `
1. Dividend Yield

Formula:
Dividend Yield = Annual Dividend / Stock Price × 100

Example:
Annual dividend = $3
Stock price = $100

Dividend Yield = 3 / 100 × 100 = 3%


2. Payout Ratio

Formula:
Payout Ratio = Dividend Per Share / EPS × 100

Example:
Dividend per share = $2
EPS = $5

Payout Ratio = 2 / 5 × 100 = 40%


3. Buybacks

Example:
Net income = $10B
Shares = 1B

EPS = 10B / 1B = $10

If shares fall to 900M:

EPS = 10B / 900M = $11.11


4. Dilution

Example:
You own 10,000 shares out of 1,000,000 total shares.

Ownership = 10,000 / 1,000,000 = 1%

If total shares become 2,000,000:

Ownership = 10,000 / 2,000,000 = 0.5%
`,
  },
  {
    title: "11. Growth vs Value companies",
    content: `
Growth companies:
- high revenue growth
- high EPS growth
- often high valuation
- usually reinvest cash
- higher volatility

Example:
Revenue grows from $10B to $13B.

Growth = (13B - 10B) / 10B × 100 = 30%


Value companies:
- lower valuation
- stable cash flow
- mature business
- often pay dividends
- lower growth

Example:
Stock price = $50
EPS = $5

P/E = 50 / 5 = 10

A low P/E can be attractive, but only if the business quality is strong.
`,
  },
  {
    title: "12. How to perform fundamental analysis",
    content: `
Professional fundamental analysis process:

1. Revenue Growth
2. EPS Growth
3. Margin Analysis
4. Debt Analysis
5. Cash Flow Analysis
6. Valuation
7. Management Quality
8. Catalysts

Example:
Intrinsic value = $120
Market price = $90

Upside = (120 - 90) / 90 × 100 = 33.3%

Goal:
Buy strong businesses below or near fair value.
`,
  },
  {
    title: "13. What is technical analysis and how is it used?",
    content: `
Technical analysis studies price action, volume and chart structure.

The goal:
Identify trends, momentum and possible future price movement.

Main tools:
- support and resistance
- trend lines
- moving averages
- RSI
- MACD
- volume analysis
- candlestick patterns

Support:
A price zone where buyers usually enter.

Resistance:
A price zone where sellers usually appear.

Moving Averages:
Popular averages:
- 50-day MA
- 200-day MA

Golden Cross:
50 MA crosses above 200 MA.
Usually bullish.

Death Cross:
50 MA crosses below 200 MA.
Usually bearish.

RSI:
RSI measures momentum.

Interpretation:
- RSI above 70 = overbought
- RSI below 30 = oversold

Professional traders combine:
price + volume + trend + macro conditions.
`,
  },
  {
    title: "14. What is fundamental analysis and how is it used?",
    content: `
Fundamental analysis studies the real value of a business or asset.

The goal:
Estimate intrinsic value and compare it with market price.

Professional investors analyze:
- revenue growth
- EPS growth
- margins
- debt
- free cash flow
- management quality
- industry trends
- macroeconomics

Example:
Fair value = $150
Current price = $100

Upside = (150 - 100) / 100 × 100 = 50%

Fundamental analysis is mostly used for:
- long-term investing
- institutional investing
- value investing
- growth investing
`,
  },
  {
    title: "15. What is inflation and how does it affect markets?",
    content: `
Inflation means prices rise over time.

Example:
A product costs $100 today.
Next year it costs $110.

Inflation = (110 - 100) / 100 × 100 = 10%

Causes of inflation:
- money printing
- high consumer demand
- supply shortages
- rising wages
- expensive energy
- geopolitical events

How inflation affects markets:

1. Stocks
High inflation can hurt growth stocks and consumer spending.

2. Interest Rates
Central banks raise rates to fight inflation.

3. Bonds
Bond prices usually fall when rates rise.

4. Gold
Gold is often used as an inflation hedge.

5. Crypto
Bitcoin is sometimes viewed as digital gold, but crypto remains highly volatile.
`,
  },
  {
    title: "16. What is deflation and how does it affect markets?",
    content: `
Deflation means prices fall over time.

Example:
A product costs $100 today.
Next year it costs $90.

Deflation = (90 - 100) / 100 × 100 = -10%

Causes:
- weak demand
- recession
- credit contraction
- falling wages
- economic slowdown

Why deflation is dangerous:
Consumers delay spending because they expect lower prices later.

This hurts:
- company revenue
- profits
- employment
- GDP growth

Central banks may respond with:
- lower interest rates
- money printing
- liquidity support
`,
  },
  {
    title: "17. What is cryptocurrency and why does it exist?",
    content: `
Cryptocurrency is a digital decentralized asset built on blockchain technology.

Bitcoin was created in 2009 by Satoshi Nakamoto.

Main idea:
Create money that does not require banks or governments.

Key advantages:
- decentralized
- borderless
- transparent blockchain
- limited supply in some assets
- 24/7 trading

Bitcoin Supply:
Maximum supply = 21 million coins.

Ethereum introduced:
- smart contracts
- decentralized applications
- DeFi
- NFT ecosystems

Main crypto sectors:
- Bitcoin
- Smart contract platforms
- AI crypto
- Gaming
- DeFi
- Real World Assets
- Infrastructure
`,
  },
  {
    title: "18. What to check before buying a cryptocurrency?",
    content: `
Before buying a cryptocurrency, analyze risk carefully.

1. Market Capitalization

Formula:
Market Cap = Price × Circulating Supply

2. Token Supply

Check:
- maximum supply
- circulating supply
- inflation schedule
- unlock schedule

3. Utility

Ask:
What real problem does the project solve?

4. Team and Investors

Check:
- founders
- developers
- institutional backing
- venture capital support

5. Liquidity

Low liquidity means higher manipulation risk.

6. Tokenomics

Analyze:
- staking
- emissions
- burns
- unlocks

7. Security

Check:
- audits
- hacks
- exploit history

8. Red Flags

Avoid:
- guaranteed returns
- fake partnerships
- low transparency
- anonymous suspicious teams
`,
  },
  {
    title: "19. What are interest rates and why do they matter?",
    content: `
Interest rates are the cost of borrowing money.

Higher rates:
- reduce inflation
- slow borrowing
- reduce liquidity
- pressure stock valuations

Lower rates:
- stimulate growth
- increase borrowing
- increase liquidity
- support risk assets

Growth stocks are highly sensitive to interest rates because their value depends heavily on future earnings.
`,
  },
  {
    title: "20. What is a recession?",
    content: `
A recession is a period of economic decline.

Usually characterized by:
- falling GDP
- rising unemployment
- lower spending
- weaker company profits

During recessions:
- consumers spend less
- companies cut costs
- markets become defensive

Sectors that often hold better:
- healthcare
- utilities
- consumer staples
`,
  },
  {
    title: "21. What is liquidity in financial markets?",
    content: `
Liquidity means how easily assets can be bought or sold.

High liquidity:
- easier trading
- tighter spreads
- lower volatility

Low liquidity:
- larger spreads
- higher volatility
- manipulation risk

When global liquidity increases:
- stocks often rise
- crypto often rises
- risk appetite increases

When liquidity decreases:
markets often become more volatile and bearish.
`,
  },
  {
    title: "22. Risk management and portfolio allocation",
    content: `
Risk management protects capital.

Main rules:

1. Never risk too much on one position.
2. Diversify across sectors and assets.
3. Avoid emotional decisions.
4. Use position sizing.
5. Keep cash reserves.

Example:
Portfolio = $100,000

If risk per trade = 1%:

Maximum acceptable loss = $1,000

Goal:
Protect capital first.
Grow capital second.
`,
  },
];

export default function EducationPage() {
  const supabase = useMemo(() => createClient(), []);

  const [plan, setPlan] = useState<PlanType>("loading");
  const [selectedLesson, setSelectedLesson] = useState(lessons[0]);

  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.email) {
        window.location.href = "/pricing";
        return;
      }

      const { data } = await supabase
        .from("user_plans")
        .select("plan, access_active")
        .eq("email", user.email)
        .single();

      const currentPlan = data?.plan;
      const active = data?.access_active;

      if ((currentPlan !== "pro" && currentPlan !== "unlimited") || !active) {
        window.location.href = "/pricing";
        return;
      }

      setPlan(currentPlan);
    };

    loadUser();
  }, [supabase]);

  if (plan === "loading") {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#050d1f",
          color: "white",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontSize: "24px",
          fontWeight: 700,
        }}
      >
        Loading Education...
      </div>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, #0f274d 0%, #08152f 40%, #050d1f 100%)",
        padding: "30px",
      }}
    >
      <div style={{ maxWidth: "1500px", margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <button
            onClick={() => {
              window.location.href = "https://www.aiproanalysis.com";
            }}
            style={{
              background: "rgba(37,99,235,0.22)",
              color: "white",
              border: "1px solid rgba(96,165,250,0.35)",
              borderRadius: "12px",
              padding: "12px 18px",
              fontSize: "14px",
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: "0 10px 20px rgba(0,0,0,0.25)",
            }}
          >
            ← Home
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "340px 1fr",
            gap: "20px",
          }}
        >
          <div
            style={{
              background: "rgba(10,20,40,0.94)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "20px",
              padding: "20px",
              height: "fit-content",
            }}
          >
            <h2 style={{ color: "white", marginBottom: "20px", fontSize: "24px" }}>
              Education Academy
            </h2>

            {lessons.map((lesson) => (
              <button
                key={lesson.title}
                onClick={() => setSelectedLesson(lesson)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  marginBottom: "10px",
                  padding: "14px",
                  borderRadius: "12px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  background:
                    selectedLesson.title === lesson.title
                      ? "rgba(37,99,235,0.35)"
                      : "rgba(255,255,255,0.03)",
                  color: "white",
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: "14px",
                }}
              >
                {lesson.title}
              </button>
            ))}
          </div>

          <div
            style={{
              background: "rgba(10,20,40,0.94)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "20px",
              padding: "34px",
            }}
          >
            <h1 style={{ color: "white", fontSize: "34px", marginBottom: "24px" }}>
              {selectedLesson.title}
            </h1>

            <div
              style={{
                color: "#dbeafe",
                fontSize: "18px",
                lineHeight: 1.9,
                whiteSpace: "pre-line",
              }}
            >
              {selectedLesson.content}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}