"use client";

import React, { useMemo, useState, useEffect } from "react";
import { createClient } from "../../lib/supabase/client";

type PlanType =
  | "basic"
  | "pro"
  | "unlimited"
  | "loading"
  | "guest";

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
If Apple is worth 3 trillion dollars and you buy shares,
you own a small part of the business.
`,
  },

  {
    title: "2. What moves stock prices?",
    content: `
Stock prices are influenced by:

- revenue growth
- earnings
- company guidance
- interest rates
- inflation
- institutional buying
- market sentiment
- fear and greed

The market always looks forward,
not backward.
`,
  },

  {
    title: "3. How does company growth affect the economy?",
    content: `
When a company grows:

- it hires employees
- pays taxes
- increases production
- invests in innovation
- expands globally

This directly impacts:
GDP, employment and financial markets.
`,
  },

  {
    title: "4. Which metrics are used to analyze a company?",
    content: `
The most important metrics are:

- Revenue
- EPS
- Margins
- Cash Flow
- Debt
- P/E
- PEG
- ROE
- ROIC
- Free Cash Flow

Institutional investors use these metrics
to estimate the true value of a company.
`,
  },

  {
    title: "5. Revenue, EPS, P/E, P/S, PEG, EBITDA, FCF",
    content: `
Revenue = total company sales

EPS = earnings per share

P/E = price relative to earnings

P/S = price relative to sales

PEG = P/E adjusted for growth

EBITDA = operational profitability

FCF = free cash flow

Free Cash Flow is one of the most important
institutional metrics.
`,
  },

  {
    title: "6. Margins: Gross, Operating, Net",
    content: `
Gross Margin:
profit after production costs

Operating Margin:
operational efficiency

Net Margin:
final net profit

Higher margins usually mean:
a stronger business model.
`,
  },

  {
    title: "7. Debt, Cash Flow, Balance Sheet",
    content: `
Debt = money owed

Cash Flow = movement of money

Balance Sheet = financial health snapshot

A strong company:
- has cash reserves
- controls debt
- generates positive cash flow
`,
  },

  {
    title: "8. Market Cap and Enterprise Value",
    content: `
Market Cap =
the market value of a company.

Enterprise Value =
the real value including debt.

Institutional investors often prefer EV
because it provides a more complete valuation.
`,
  },

  {
    title: "9. ROE, ROIC, ROA",
    content: `
ROE = Return on Equity

ROIC = Return on Invested Capital

ROA = Return on Assets

High values usually indicate:
strong management efficiency.
`,
  },

  {
    title: "10. Dividends, Buybacks and Dilution",
    content: `
Dividend =
cash paid to shareholders.

Buybacks =
the company repurchases its own shares.

Dilution =
increasing share count,
which reduces shareholder ownership percentage.
`,
  },

  {
    title: "11. Growth vs Value companies",
    content: `
Growth companies:
- higher growth
- higher risk
- usually expensive valuations

Value companies:
- undervalued businesses
- stable fundamentals
- slower growth

Institutions often combine both strategies.
`,
  },

  {
    title: "12. How to perform fundamental analysis",
    content: `
Steps:

1. Analyze revenue growth
2. Analyze EPS growth
3. Review margins
4. Check debt levels
5. Study cash flow
6. Compare valuation
7. Evaluate management
8. Identify future catalysts

Final goal:
compare intrinsic value
with current market price.
`,
  },
];

export default function EducationPage() {
  const supabase = useMemo(() => createClient(), []);

  const [plan, setPlan] =
    useState<PlanType>("loading");

  const [selectedLesson, setSelectedLesson] =
    useState(lessons[0]);

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

      if (
        (currentPlan !== "pro" &&
          currentPlan !== "unlimited") ||
        !active
      ) {
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
      <div
        style={{
          maxWidth: "1500px",
          margin: "0 auto",
        }}
      >
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
              window.location.href =
                "https://www.aiproanalysis.com";
            }}
            style={{
              background:
                "rgba(37,99,235,0.22)",
              color: "white",
              border:
                "1px solid rgba(96,165,250,0.35)",
              borderRadius: "12px",
              padding: "12px 18px",
              fontSize: "14px",
              fontWeight: 800,
              cursor: "pointer",
              boxShadow:
                "0 10px 20px rgba(0,0,0,0.25)",
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
            <h2
              style={{
                color: "white",
                marginBottom: "20px",
                fontSize: "24px",
              }}
            >
              Education Academy
            </h2>

            {lessons.map((lesson) => (
              <button
                key={lesson.title}
                onClick={() =>
                  setSelectedLesson(lesson)
                }
                style={{
                  width: "100%",
                  textAlign: "left",
                  marginBottom: "10px",
                  padding: "14px",
                  borderRadius: "12px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  background:
                    selectedLesson.title ===
                    lesson.title
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
            <h1
              style={{
                color: "white",
                fontSize: "34px",
                marginBottom: "24px",
              }}
            >
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