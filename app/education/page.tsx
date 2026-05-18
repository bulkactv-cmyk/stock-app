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

Strong revenue growth means demand is increasing.


2. EPS - Earnings Per Share

EPS shows how much profit belongs to each share.

Formula:
EPS = Net Income / Shares Outstanding

Example:
Net income = $10 billion
Shares outstanding = 5 billion

EPS = 10B / 5B = $2.00

If EPS grows from $2.00 to $2.50:

EPS Growth = (2.50 - 2.00) / 2.00 × 100 = 25%

EPS growth is one of the strongest drivers of stock prices.


3. P/E Ratio - Price to Earnings

P/E shows how much investors pay for $1 of earnings.

Formula:
P/E = Stock Price / EPS

Example:
Stock price = $100
EPS = $5

P/E = 100 / 5 = 20

Meaning:
Investors pay $20 for every $1 of earnings.

Lower P/E may mean the stock is cheaper.
Higher P/E may mean the market expects strong growth.

But:
A low P/E is not always good.
A high P/E is not always bad.
You must compare P/E with growth, margins and business quality.


4. P/S Ratio - Price to Sales

P/S compares company value with revenue.

Formula:
P/S = Market Cap / Revenue

Example:
Market cap = $100 billion
Revenue = $25 billion

P/S = 100B / 25B = 4

Meaning:
Investors pay $4 for every $1 of sales.

Useful for:
- growth companies
- unprofitable companies
- early-stage tech businesses

Warning:
A high P/S is risky if margins are weak.


5. PEG Ratio

PEG compares P/E with expected earnings growth.

Formula:
PEG = P/E / EPS Growth Rate

Example:
P/E = 30
Expected EPS growth = 20%

PEG = 30 / 20 = 1.5

Interpretation:
PEG below 1.0 = potentially undervalued
PEG around 1.0 = fairly valued
PEG above 2.0 = expensive unless quality is exceptional

Example:
Company A:
P/E = 40
Growth = 40%
PEG = 1.0

Company B:
P/E = 20
Growth = 5%
PEG = 4.0

Even though Company B has lower P/E, Company A may be better valued because growth supports the valuation.


6. EBITDA

EBITDA shows operating profitability before interest, taxes, depreciation and amortization.

Formula:
EBITDA = Earnings Before Interest, Taxes, Depreciation and Amortization

Simplified:
EBITDA = Operating Profit + Depreciation + Amortization

Example:
Operating profit = $8B
Depreciation = $1B
Amortization = $0.5B

EBITDA = 8B + 1B + 0.5B = $9.5B

EBITDA is useful for comparing companies with different debt levels and accounting structures.

Important:
EBITDA is not real cash flow.
It ignores capital expenditures.


7. FCF - Free Cash Flow

Free Cash Flow is the cash left after the company pays operating expenses and capital expenditures.

Formula:
FCF = Operating Cash Flow - Capital Expenditures

Example:
Operating cash flow = $15B
Capital expenditures = $5B

FCF = 15B - 5B = $10B

Why FCF matters:
- pays dividends
- funds buybacks
- reduces debt
- supports acquisitions
- protects the company during recessions

FCF Margin Formula:
FCF Margin = FCF / Revenue × 100

Example:
FCF = $10B
Revenue = $50B

FCF Margin = 10B / 50B × 100 = 20%

A 20% FCF margin is very strong.
`,
  },
  {
    title: "6. Margins: Gross, Operating, Net",
    content: `
1. Gross Margin

Gross Margin shows how much profit remains after direct production costs.

Formula:
Gross Margin = (Revenue - Cost of Goods Sold) / Revenue × 100

Example:
Revenue = $100M
Cost of goods sold = $40M

Gross Profit = 100M - 40M = $60M
Gross Margin = 60M / 100M × 100 = 60%

Interpretation:
Higher gross margin means the company has pricing power or efficient production.


2. Operating Margin

Operating Margin shows profitability after operating expenses.

Formula:
Operating Margin = Operating Income / Revenue × 100

Example:
Revenue = $100M
Operating income = $25M

Operating Margin = 25M / 100M × 100 = 25%

Interpretation:
This shows how efficiently management runs the business.


3. Net Margin

Net Margin shows final profit after all expenses, taxes and interest.

Formula:
Net Margin = Net Income / Revenue × 100

Example:
Revenue = $100M
Net income = $18M

Net Margin = 18M / 100M × 100 = 18%

Strong companies often have:
- stable gross margin
- rising operating margin
- healthy net margin

Margin expansion is a bullish signal.
Margin compression is a warning sign.
`,
  },
  {
    title: "7. Debt, Cash Flow, Balance Sheet",
    content: `
Debt shows how much money the company owes.

Important debt metrics:

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

Interpretation:
0.5 means debt is 50% of equity.


3. Interest Coverage

Formula:
Interest Coverage = EBIT / Interest Expense

Example:
EBIT = $10B
Interest expense = $1B

Interest Coverage = 10B / 1B = 10

A ratio above 5 is usually comfortable.
A ratio below 2 can be risky.


4. Cash Flow

Operating Cash Flow shows money generated by the core business.

Formula:
Operating Cash Flow = Cash generated from operations

If a company reports profit but has weak cash flow, that is a warning sign.

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

Market Cap shows the total market value of the company.

Formula:
Market Cap = Stock Price × Shares Outstanding

Example:
Stock price = $100
Shares outstanding = 1 billion

Market Cap = 100 × 1B = $100B


2. Enterprise Value

Enterprise Value shows the real takeover value of the company.

Formula:
Enterprise Value = Market Cap + Total Debt - Cash

Example:
Market cap = $100B
Debt = $20B
Cash = $10B

Enterprise Value = 100B + 20B - 10B = $110B

Why EV matters:
If someone buys the whole company, they also take the debt but receive the cash.

Enterprise Value is often better than market cap for valuation.


3. EV / EBITDA

Formula:
EV / EBITDA = Enterprise Value / EBITDA

Example:
EV = $110B
EBITDA = $10B

EV / EBITDA = 110B / 10B = 11

Lower EV/EBITDA can mean cheaper valuation.
But always compare with industry peers.
`,
  },
  {
    title: "9. ROE, ROIC, ROA",
    content: `
1. ROE - Return on Equity

ROE measures how efficiently the company uses shareholder equity.

Formula:
ROE = Net Income / Shareholders' Equity × 100

Example:
Net income = $10B
Equity = $50B

ROE = 10B / 50B × 100 = 20%

A 20% ROE is strong.


2. ROIC - Return on Invested Capital

ROIC measures how efficiently the company uses all invested capital.

Formula:
ROIC = NOPAT / Invested Capital × 100

NOPAT = Net Operating Profit After Tax

Example:
NOPAT = $8B
Invested capital = $40B

ROIC = 8B / 40B × 100 = 20%

High ROIC means the company creates strong returns on capital.


3. ROA - Return on Assets

ROA measures how efficiently assets generate profit.

Formula:
ROA = Net Income / Total Assets × 100

Example:
Net income = $10B
Total assets = $100B

ROA = 10B / 100B × 100 = 10%

Professional view:
ROIC is often more important than ROE because ROE can be inflated by debt.
`,
  },
  {
    title: "10. Dividends, Buybacks and Dilution",
    content: `
1. Dividend

Dividend is cash paid to shareholders.

Formula:
Dividend Yield = Annual Dividend / Stock Price × 100

Example:
Annual dividend = $3
Stock price = $100

Dividend Yield = 3 / 100 × 100 = 3%


2. Dividend Payout Ratio

Formula:
Payout Ratio = Dividend Per Share / EPS × 100

Example:
Dividend per share = $2
EPS = $5

Payout Ratio = 2 / 5 × 100 = 40%

A payout ratio below 60% is usually healthier.


3. Buybacks

Buybacks reduce shares outstanding.

Example:
Net income = $10B
Shares = 1B

EPS = 10B / 1B = $10

If shares fall to 900M:

EPS = 10B / 900M = $11.11

EPS increased without net income growth.


4. Dilution

Dilution increases share count and reduces ownership percentage.

Example:
You own 10,000 shares out of 1,000,000 total shares.

Ownership = 10,000 / 1,000,000 = 1%

If the company issues new shares and total shares become 2,000,000:

Ownership = 10,000 / 2,000,000 = 0.5%

Your ownership was diluted.
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

The market may accept high P/E if growth is strong.


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

This may look cheap, but you must check:
- debt
- margins
- growth
- industry decline
- cash flow quality

Best investors compare:
Growth quality + valuation discipline.
`,
  },
  {
    title: "12. How to perform fundamental analysis",
    content: `
Professional fundamental analysis process:

1. Revenue Growth

Formula:
Revenue Growth = (Current Revenue - Previous Revenue) / Previous Revenue × 100

Example:
Revenue grows from $80B to $100B.

Growth = (100B - 80B) / 80B × 100 = 25%


2. EPS Growth

Formula:
EPS Growth = (Current EPS - Previous EPS) / Previous EPS × 100

Example:
EPS grows from $4 to $5.

EPS Growth = (5 - 4) / 4 × 100 = 25%


3. Margin Analysis

Check:
- Gross Margin
- Operating Margin
- Net Margin

If revenue grows but margins fall, the growth may be low quality.


4. Debt Analysis

Check:
- Net Debt
- Debt to Equity
- Interest Coverage
- Debt maturity schedule

High debt is dangerous when interest rates rise.


5. Cash Flow Analysis

Formula:
FCF = Operating Cash Flow - Capital Expenditures

Example:
Operating cash flow = $20B
CapEx = $6B

FCF = $14B


6. Valuation

Use:
- P/E
- P/S
- PEG
- EV/EBITDA
- FCF Yield

FCF Yield Formula:
FCF Yield = FCF / Market Cap × 100

Example:
FCF = $10B
Market Cap = $200B

FCF Yield = 10B / 200B × 100 = 5%


7. Management Quality

Look for:
- smart capital allocation
- controlled debt
- strong margins
- consistent execution
- shareholder-friendly policies


8. Catalysts

Examples:
- new product cycle
- AI growth
- margin expansion
- buybacks
- lower interest rates
- institutional buying
- sector rotation


Final goal:
Estimate intrinsic value and compare it with current market price.

If intrinsic value is $120 and market price is $90:

Upside = (120 - 90) / 90 × 100 = 33.3%

That may be attractive if the business quality is strong.
`,
  },
];

export default function EducationPage() {
  const supabase = useMemo(() => createClient(), []);

  const [plan, setPlan] = useState<PlanType>("loading");
  const [selectedLesson, setSelectedLesson] = useState(lessons[4]);

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