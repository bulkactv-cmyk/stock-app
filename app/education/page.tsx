"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "../../lib/supabase/client";

type PlanType = "basic" | "pro" | "unlimited" | "loading" | "guest";
type Lesson = { id: number; level: string; title: string };

const LESSON_ROWS = `1|LEVEL 1 — FINANCIAL FOUNDATION AND INVESTOR MINDSET|What Money Is
2|LEVEL 1 — FINANCIAL FOUNDATION AND INVESTOR MINDSET|History of Money and Financial Systems
3|LEVEL 1 — FINANCIAL FOUNDATION AND INVESTOR MINDSET|Inflation and Purchasing Power
4|LEVEL 1 — FINANCIAL FOUNDATION AND INVESTOR MINDSET|Compound Interest and Capital Accumulation
5|LEVEL 1 — FINANCIAL FOUNDATION AND INVESTOR MINDSET|Assets vs Liabilities
6|LEVEL 1 — FINANCIAL FOUNDATION AND INVESTOR MINDSET|How the Banking System Works
7|LEVEL 1 — FINANCIAL FOUNDATION AND INVESTOR MINDSET|Central Banks and Money Creation
8|LEVEL 1 — FINANCIAL FOUNDATION AND INVESTOR MINDSET|Debt, Credit and Interest Rates
9|LEVEL 1 — FINANCIAL FOUNDATION AND INVESTOR MINDSET|Financial Discipline and Capital Building
10|LEVEL 1 — FINANCIAL FOUNDATION AND INVESTOR MINDSET|Psychology of Wealth
11|LEVEL 1 — FINANCIAL FOUNDATION AND INVESTOR MINDSET|How Wealthy Investors Think
12|LEVEL 1 — FINANCIAL FOUNDATION AND INVESTOR MINDSET|Common Financial Mistakes Beginners Make
13|LEVEL 1 — FINANCIAL FOUNDATION AND INVESTOR MINDSET|What Investing Means
14|LEVEL 1 — FINANCIAL FOUNDATION AND INVESTOR MINDSET|Investing vs Speculation
15|LEVEL 1 — FINANCIAL FOUNDATION AND INVESTOR MINDSET|Asset Classes and Types of Assets
16|LEVEL 1 — FINANCIAL FOUNDATION AND INVESTOR MINDSET|Risk and Return
17|LEVEL 1 — FINANCIAL FOUNDATION AND INVESTOR MINDSET|Investment Time Horizons
18|LEVEL 1 — FINANCIAL FOUNDATION AND INVESTOR MINDSET|How Financial Markets Work
19|LEVEL 1 — FINANCIAL FOUNDATION AND INVESTOR MINDSET|Global Market Institutions
20|LEVEL 1 — FINANCIAL FOUNDATION AND INVESTOR MINDSET|What Hedge Funds and Market Makers Do
21|LEVEL 2 — STOCK MARKET AND EQUITIES|What a Stock Is
22|LEVEL 2 — STOCK MARKET AND EQUITIES|IPO and Public Company Listings
23|LEVEL 2 — STOCK MARKET AND EQUITIES|How Stock Exchanges Work
24|LEVEL 2 — STOCK MARKET AND EQUITIES|NYSE, NASDAQ and Global Markets
25|LEVEL 2 — STOCK MARKET AND EQUITIES|Market Capitalization and Enterprise Value
26|LEVEL 2 — STOCK MARKET AND EQUITIES|Growth vs Value Companies
27|LEVEL 2 — STOCK MARKET AND EQUITIES|Dividend Investing
28|LEVEL 2 — STOCK MARKET AND EQUITIES|Buybacks and Dilution
29|LEVEL 2 — STOCK MARKET AND EQUITIES|Company Life Cycles
30|LEVEL 2 — STOCK MARKET AND EQUITIES|Sector Rotation
31|LEVEL 2 — STOCK MARKET AND EQUITIES|Mega Caps vs Small Caps
32|LEVEL 2 — STOCK MARKET AND EQUITIES|Defensive vs Cyclical Stocks
33|LEVEL 2 — STOCK MARKET AND EQUITIES|High Growth Investing
34|LEVEL 2 — STOCK MARKET AND EQUITIES|Compounders and Quality Businesses
35|LEVEL 2 — STOCK MARKET AND EQUITIES|Economic Moats
36|LEVEL 2 — STOCK MARKET AND EQUITIES|Pricing Power
37|LEVEL 2 — STOCK MARKET AND EQUITIES|Network Effects
38|LEVEL 2 — STOCK MARKET AND EQUITIES|Competitive Advantages
39|LEVEL 2 — STOCK MARKET AND EQUITIES|Institutional Ownership
40|LEVEL 2 — STOCK MARKET AND EQUITIES|Insider Buying and Selling
41|LEVEL 3 — FUNDAMENTAL ANALYSIS|How to Read a Financial Report
42|LEVEL 3 — FUNDAMENTAL ANALYSIS|Income Statement
43|LEVEL 3 — FUNDAMENTAL ANALYSIS|Balance Sheet
44|LEVEL 3 — FUNDAMENTAL ANALYSIS|Cash Flow Statement
45|LEVEL 3 — FUNDAMENTAL ANALYSIS|Revenue Analysis
46|LEVEL 3 — FUNDAMENTAL ANALYSIS|EPS Analysis
47|LEVEL 3 — FUNDAMENTAL ANALYSIS|Gross Margin
48|LEVEL 3 — FUNDAMENTAL ANALYSIS|Operating Margin
49|LEVEL 3 — FUNDAMENTAL ANALYSIS|Net Margin
50|LEVEL 3 — FUNDAMENTAL ANALYSIS|EBITDA
51|LEVEL 3 — FUNDAMENTAL ANALYSIS|Free Cash Flow
52|LEVEL 3 — FUNDAMENTAL ANALYSIS|FCF Yield
53|LEVEL 3 — FUNDAMENTAL ANALYSIS|ROE
54|LEVEL 3 — FUNDAMENTAL ANALYSIS|ROIC
55|LEVEL 3 — FUNDAMENTAL ANALYSIS|ROA
56|LEVEL 3 — FUNDAMENTAL ANALYSIS|Debt Analysis
57|LEVEL 3 — FUNDAMENTAL ANALYSIS|Interest Coverage
58|LEVEL 3 — FUNDAMENTAL ANALYSIS|Liquidity Ratios
59|LEVEL 3 — FUNDAMENTAL ANALYSIS|P/E Valuation
60|LEVEL 3 — FUNDAMENTAL ANALYSIS|PEG Ratio
61|LEVEL 3 — FUNDAMENTAL ANALYSIS|P/S Ratio
62|LEVEL 3 — FUNDAMENTAL ANALYSIS|EV/EBITDA
63|LEVEL 3 — FUNDAMENTAL ANALYSIS|DCF Valuation
64|LEVEL 3 — FUNDAMENTAL ANALYSIS|Intrinsic Value
65|LEVEL 3 — FUNDAMENTAL ANALYSIS|Margin of Safety
66|LEVEL 3 — FUNDAMENTAL ANALYSIS|Earnings Manipulation
67|LEVEL 3 — FUNDAMENTAL ANALYSIS|Accounting Red Flags
68|LEVEL 3 — FUNDAMENTAL ANALYSIS|Short Seller Analysis
69|LEVEL 3 — FUNDAMENTAL ANALYSIS|Institutional Research Workflow
70|LEVEL 3 — FUNDAMENTAL ANALYSIS|Building an Investment Thesis
71|LEVEL 4 — MACROECONOMICS FOR INVESTORS|What Macroeconomics Is
72|LEVEL 4 — MACROECONOMICS FOR INVESTORS|GDP and Economic Growth
73|LEVEL 4 — MACROECONOMICS FOR INVESTORS|CPI and Inflation
74|LEVEL 4 — MACROECONOMICS FOR INVESTORS|Deflation
75|LEVEL 4 — MACROECONOMICS FOR INVESTORS|Federal Reserve
76|LEVEL 4 — MACROECONOMICS FOR INVESTORS|ECB and Global Central Banks
77|LEVEL 4 — MACROECONOMICS FOR INVESTORS|Interest Rates
78|LEVEL 4 — MACROECONOMICS FOR INVESTORS|Bond Market
79|LEVEL 4 — MACROECONOMICS FOR INVESTORS|Yield Curve
80|LEVEL 4 — MACROECONOMICS FOR INVESTORS|Quantitative Easing
81|LEVEL 4 — MACROECONOMICS FOR INVESTORS|Liquidity Cycles
82|LEVEL 4 — MACROECONOMICS FOR INVESTORS|Dollar Strength
83|LEVEL 4 — MACROECONOMICS FOR INVESTORS|Oil and Commodities
84|LEVEL 4 — MACROECONOMICS FOR INVESTORS|Geopolitics and Markets
85|LEVEL 4 — MACROECONOMICS FOR INVESTORS|Recessions
86|LEVEL 4 — MACROECONOMICS FOR INVESTORS|Credit Crises
87|LEVEL 4 — MACROECONOMICS FOR INVESTORS|Banking Crises
88|LEVEL 4 — MACROECONOMICS FOR INVESTORS|Debt Cycles
89|LEVEL 4 — MACROECONOMICS FOR INVESTORS|Labor Market
90|LEVEL 4 — MACROECONOMICS FOR INVESTORS|Consumer Spending
91|LEVEL 4 — MACROECONOMICS FOR INVESTORS|Institutional Positioning
92|LEVEL 4 — MACROECONOMICS FOR INVESTORS|Macro Investing Framework
93|LEVEL 5 — TECHNICAL ANALYSIS|Technical Analysis Basics
94|LEVEL 5 — TECHNICAL ANALYSIS|Candlestick Structure
95|LEVEL 5 — TECHNICAL ANALYSIS|Support and Resistance
96|LEVEL 5 — TECHNICAL ANALYSIS|Trend Analysis
97|LEVEL 5 — TECHNICAL ANALYSIS|Market Structure
98|LEVEL 5 — TECHNICAL ANALYSIS|Volume Analysis
99|LEVEL 5 — TECHNICAL ANALYSIS|Moving Averages
100|LEVEL 5 — TECHNICAL ANALYSIS|RSI
101|LEVEL 5 — TECHNICAL ANALYSIS|MACD
102|LEVEL 5 — TECHNICAL ANALYSIS|Bollinger Bands
103|LEVEL 5 — TECHNICAL ANALYSIS|Fibonacci Retracement
104|LEVEL 5 — TECHNICAL ANALYSIS|VWAP
105|LEVEL 5 — TECHNICAL ANALYSIS|ATR Volatility
106|LEVEL 5 — TECHNICAL ANALYSIS|Breakouts
107|LEVEL 5 — TECHNICAL ANALYSIS|Fake Breakouts
108|LEVEL 5 — TECHNICAL ANALYSIS|Trend Continuation
109|LEVEL 5 — TECHNICAL ANALYSIS|Reversal Patterns
110|LEVEL 5 — TECHNICAL ANALYSIS|Divergences
111|LEVEL 5 — TECHNICAL ANALYSIS|Multi-Timeframe Analysis
112|LEVEL 5 — TECHNICAL ANALYSIS|Chart Psychology
113|LEVEL 5 — TECHNICAL ANALYSIS|Liquidity Zones
114|LEVEL 5 — TECHNICAL ANALYSIS|Stop Hunts
115|LEVEL 5 — TECHNICAL ANALYSIS|Institutional Order Flow
116|LEVEL 5 — TECHNICAL ANALYSIS|Smart Money Concepts
117|LEVEL 5 — TECHNICAL ANALYSIS|Wyckoff Method
118|LEVEL 5 — TECHNICAL ANALYSIS|Elliott Wave Theory
119|LEVEL 5 — TECHNICAL ANALYSIS|Advanced Chart Reading
120|LEVEL 5 — TECHNICAL ANALYSIS|Professional Technical Workflow
121|LEVEL 6 — PROFESSIONAL TRADING|Day Trading
122|LEVEL 6 — PROFESSIONAL TRADING|Swing Trading
123|LEVEL 6 — PROFESSIONAL TRADING|Position Trading
124|LEVEL 6 — PROFESSIONAL TRADING|Scalping
125|LEVEL 6 — PROFESSIONAL TRADING|Momentum Trading
126|LEVEL 6 — PROFESSIONAL TRADING|Breakout Trading
127|LEVEL 6 — PROFESSIONAL TRADING|Mean Reversion
128|LEVEL 6 — PROFESSIONAL TRADING|Trend Following
129|LEVEL 6 — PROFESSIONAL TRADING|Volatility Trading
130|LEVEL 6 — PROFESSIONAL TRADING|Pair Trading
131|LEVEL 6 — PROFESSIONAL TRADING|Market Making Basics
132|LEVEL 6 — PROFESSIONAL TRADING|High Frequency Trading Overview
133|LEVEL 6 — PROFESSIONAL TRADING|Futures Trading
134|LEVEL 6 — PROFESSIONAL TRADING|Options Trading
135|LEVEL 6 — PROFESSIONAL TRADING|Greeks in Options
136|LEVEL 6 — PROFESSIONAL TRADING|Hedging Strategies
137|LEVEL 6 — PROFESSIONAL TRADING|Leverage and Margin
138|LEVEL 6 — PROFESSIONAL TRADING|Risk/Reward Framework
139|LEVEL 6 — PROFESSIONAL TRADING|Stop Loss Engineering
140|LEVEL 6 — PROFESSIONAL TRADING|Position Sizing
141|LEVEL 6 — PROFESSIONAL TRADING|Portfolio Exposure
142|LEVEL 6 — PROFESSIONAL TRADING|Drawdown Management
143|LEVEL 6 — PROFESSIONAL TRADING|Trading Journal
144|LEVEL 6 — PROFESSIONAL TRADING|Backtesting
145|LEVEL 6 — PROFESSIONAL TRADING|Strategy Optimization
146|LEVEL 6 — PROFESSIONAL TRADING|Probability and Expectancy
147|LEVEL 6 — PROFESSIONAL TRADING|Professional Trader Psychology
148|LEVEL 6 — PROFESSIONAL TRADING|Institutional Execution
149|LEVEL 6 — PROFESSIONAL TRADING|Market Manipulation
150|LEVEL 6 — PROFESSIONAL TRADING|Building a Professional Trading System
151|LEVEL 7 — CRYPTOCURRENCIES AND BLOCKCHAIN|History of Bitcoin
152|LEVEL 7 — CRYPTOCURRENCIES AND BLOCKCHAIN|Blockchain Fundamentals
153|LEVEL 7 — CRYPTOCURRENCIES AND BLOCKCHAIN|Mining
154|LEVEL 7 — CRYPTOCURRENCIES AND BLOCKCHAIN|Wallets and Custody
155|LEVEL 7 — CRYPTOCURRENCIES AND BLOCKCHAIN|Ethereum Ecosystem
156|LEVEL 7 — CRYPTOCURRENCIES AND BLOCKCHAIN|Smart Contracts
157|LEVEL 7 — CRYPTOCURRENCIES AND BLOCKCHAIN|Layer 1 vs Layer 2
158|LEVEL 7 — CRYPTOCURRENCIES AND BLOCKCHAIN|DeFi
159|LEVEL 7 — CRYPTOCURRENCIES AND BLOCKCHAIN|Staking
160|LEVEL 7 — CRYPTOCURRENCIES AND BLOCKCHAIN|Yield Farming
161|LEVEL 7 — CRYPTOCURRENCIES AND BLOCKCHAIN|Liquidity Pools
162|LEVEL 7 — CRYPTOCURRENCIES AND BLOCKCHAIN|Stablecoins
163|LEVEL 7 — CRYPTOCURRENCIES AND BLOCKCHAIN|Tokenomics
164|LEVEL 7 — CRYPTOCURRENCIES AND BLOCKCHAIN|Token Unlocks
165|LEVEL 7 — CRYPTOCURRENCIES AND BLOCKCHAIN|On-Chain Analysis
166|LEVEL 7 — CRYPTOCURRENCIES AND BLOCKCHAIN|Crypto Cycles
167|LEVEL 7 — CRYPTOCURRENCIES AND BLOCKCHAIN|Bitcoin Halving
168|LEVEL 7 — CRYPTOCURRENCIES AND BLOCKCHAIN|Altcoin Rotations
169|LEVEL 7 — CRYPTOCURRENCIES AND BLOCKCHAIN|NFT Ecosystem
170|LEVEL 7 — CRYPTOCURRENCIES AND BLOCKCHAIN|AI Crypto Sector
171|LEVEL 7 — CRYPTOCURRENCIES AND BLOCKCHAIN|Meme Coin Psychology
172|LEVEL 7 — CRYPTOCURRENCIES AND BLOCKCHAIN|Crypto Regulations
173|LEVEL 7 — CRYPTOCURRENCIES AND BLOCKCHAIN|Exchange Risks
174|LEVEL 7 — CRYPTOCURRENCIES AND BLOCKCHAIN|Rug Pulls and Scams
175|LEVEL 7 — CRYPTOCURRENCIES AND BLOCKCHAIN|Institutional Crypto Adoption
176|LEVEL 7 — CRYPTOCURRENCIES AND BLOCKCHAIN|Crypto Portfolio Management
177|LEVEL 7 — CRYPTOCURRENCIES AND BLOCKCHAIN|Advanced Crypto Research
178|LEVEL 7 — CRYPTOCURRENCIES AND BLOCKCHAIN|Professional Crypto Investing Framework
179|LEVEL 8 — PSYCHOLOGY AND BEHAVIORAL FINANCE|Fear and Greed
180|LEVEL 8 — PSYCHOLOGY AND BEHAVIORAL FINANCE|FOMO
181|LEVEL 8 — PSYCHOLOGY AND BEHAVIORAL FINANCE|Panic Selling
182|LEVEL 8 — PSYCHOLOGY AND BEHAVIORAL FINANCE|Overtrading
183|LEVEL 8 — PSYCHOLOGY AND BEHAVIORAL FINANCE|Revenge Trading
184|LEVEL 8 — PSYCHOLOGY AND BEHAVIORAL FINANCE|Confirmation Bias
185|LEVEL 8 — PSYCHOLOGY AND BEHAVIORAL FINANCE|Survivorship Bias
186|LEVEL 8 — PSYCHOLOGY AND BEHAVIORAL FINANCE|Anchoring Bias
187|LEVEL 8 — PSYCHOLOGY AND BEHAVIORAL FINANCE|Emotional Discipline
188|LEVEL 8 — PSYCHOLOGY AND BEHAVIORAL FINANCE|Patience and Conviction
189|LEVEL 8 — PSYCHOLOGY AND BEHAVIORAL FINANCE|Handling Volatility
190|LEVEL 8 — PSYCHOLOGY AND BEHAVIORAL FINANCE|Long-Term Mindset
191|LEVEL 8 — PSYCHOLOGY AND BEHAVIORAL FINANCE|Institutional Emotional Control
192|LEVEL 8 — PSYCHOLOGY AND BEHAVIORAL FINANCE|Decision Making Under Pressure
193|LEVEL 8 — PSYCHOLOGY AND BEHAVIORAL FINANCE|Professional Investor Mindset
194|LEVEL 9 — PORTFOLIO MANAGEMENT|Portfolio Construction
195|LEVEL 9 — PORTFOLIO MANAGEMENT|Diversification
196|LEVEL 9 — PORTFOLIO MANAGEMENT|Correlation
197|LEVEL 9 — PORTFOLIO MANAGEMENT|Asset Allocation
198|LEVEL 9 — PORTFOLIO MANAGEMENT|Rebalancing
199|LEVEL 9 — PORTFOLIO MANAGEMENT|Cash Management
200|LEVEL 9 — PORTFOLIO MANAGEMENT|Defensive Positioning
201|LEVEL 9 — PORTFOLIO MANAGEMENT|Aggressive Growth Allocation
202|LEVEL 9 — PORTFOLIO MANAGEMENT|Risk Parity
203|LEVEL 9 — PORTFOLIO MANAGEMENT|Hedging Portfolio Risk
204|LEVEL 9 — PORTFOLIO MANAGEMENT|Crisis Management
205|LEVEL 9 — PORTFOLIO MANAGEMENT|Black Swan Events
206|LEVEL 9 — PORTFOLIO MANAGEMENT|Portfolio Stress Testing
207|LEVEL 9 — PORTFOLIO MANAGEMENT|Institutional Portfolio Management
208|LEVEL 9 — PORTFOLIO MANAGEMENT|Building Long-Term Wealth Systems
209|LEVEL 10 — PROFESSIONAL AND INSTITUTIONAL THINKING|How Hedge Funds Operate
210|LEVEL 10 — PROFESSIONAL AND INSTITUTIONAL THINKING|Institutional Capital Flows
211|LEVEL 10 — PROFESSIONAL AND INSTITUTIONAL THINKING|Prime Brokers
212|LEVEL 10 — PROFESSIONAL AND INSTITUTIONAL THINKING|Dark Pools
213|LEVEL 10 — PROFESSIONAL AND INSTITUTIONAL THINKING|Liquidity Engineering
214|LEVEL 10 — PROFESSIONAL AND INSTITUTIONAL THINKING|Quantitative Investing
215|LEVEL 10 — PROFESSIONAL AND INSTITUTIONAL THINKING|Algorithmic Trading
216|LEVEL 10 — PROFESSIONAL AND INSTITUTIONAL THINKING|AI in Investing
217|LEVEL 10 — PROFESSIONAL AND INSTITUTIONAL THINKING|Macro Hedge Funds
218|LEVEL 10 — PROFESSIONAL AND INSTITUTIONAL THINKING|Global Capital Cycles
219|LEVEL 10 — PROFESSIONAL AND INSTITUTIONAL THINKING|Sovereign Wealth Funds
220|LEVEL 10 — PROFESSIONAL AND INSTITUTIONAL THINKING|Private Equity
221|LEVEL 10 — PROFESSIONAL AND INSTITUTIONAL THINKING|Venture Capital
222|LEVEL 10 — PROFESSIONAL AND INSTITUTIONAL THINKING|IPO Investing
223|LEVEL 10 — PROFESSIONAL AND INSTITUTIONAL THINKING|Distressed Investing
224|LEVEL 10 — PROFESSIONAL AND INSTITUTIONAL THINKING|Crisis Investing
225|LEVEL 10 — PROFESSIONAL AND INSTITUTIONAL THINKING|Professional Research Systems
226|LEVEL 10 — PROFESSIONAL AND INSTITUTIONAL THINKING|Building Institutional-Grade Frameworks
227|LEVEL 10 — PROFESSIONAL AND INSTITUTIONAL THINKING|Multi-Asset Investing
228|LEVEL 10 — PROFESSIONAL AND INSTITUTIONAL THINKING|Becoming a Professional Investor
229|LEVEL 11 — VIDEO LESSONS|Video Lesson Roadmap
230|LEVEL 11 — VIDEO LESSONS|Screen Recording: Reading a Stock Chart
231|LEVEL 11 — VIDEO LESSONS|Screen Recording: Reading an Income Statement
232|LEVEL 11 — VIDEO LESSONS|Video Walkthrough: Building a Watchlist
233|LEVEL 11 — VIDEO LESSONS|Video Walkthrough: Using RSI and MACD Correctly
234|LEVEL 11 — VIDEO LESSONS|Video Walkthrough: Comparing Two Companies
235|LEVEL 11 — VIDEO LESSONS|Video Walkthrough: Crypto Tokenomics Research
236|LEVEL 11 — VIDEO LESSONS|Video Walkthrough: Portfolio Risk Review
237|LEVEL 11 — VIDEO LESSONS|Video Walkthrough: Building a Trading Journal
238|LEVEL 11 — VIDEO LESSONS|Video Lesson Checklist and Production Plan
239|LEVEL 12 — TECHNICAL LITERATURE|Beginner Reading Path
240|LEVEL 12 — TECHNICAL LITERATURE|Core Books for Long-Term Investors
241|LEVEL 12 — TECHNICAL LITERATURE|Core Books for Traders
242|LEVEL 12 — TECHNICAL LITERATURE|Financial Statement Reading Materials
243|LEVEL 12 — TECHNICAL LITERATURE|Macroeconomics Reading Materials
244|LEVEL 12 — TECHNICAL LITERATURE|Technical Analysis Reading Materials
245|LEVEL 12 — TECHNICAL LITERATURE|Crypto and Blockchain Reading Materials
246|LEVEL 12 — TECHNICAL LITERATURE|Behavioral Finance Reading Materials
247|LEVEL 12 — TECHNICAL LITERATURE|Institutional Research Papers
248|LEVEL 12 — TECHNICAL LITERATURE|Reading Notes and Study System`;

const LEVEL_DESCRIPTIONS: Record<string, string> = {
  "LEVEL 1 — FINANCIAL FOUNDATION AND INVESTOR MINDSET": "Money, inflation, banks, debt, risk, asset classes and the first principles of disciplined investing.",
  "LEVEL 2 — STOCK MARKET AND EQUITIES": "Stocks, exchanges, IPOs, dividends, buybacks, company quality, economic moats and institutional ownership.",
  "LEVEL 3 — FUNDAMENTAL ANALYSIS": "Financial statements, revenue, EPS, margins, debt, cash flow, valuation, DCF and investment thesis construction.",
  "LEVEL 4 — MACROECONOMICS FOR INVESTORS": "GDP, CPI, inflation, interest rates, bonds, liquidity, currencies, commodities and macro market regimes.",
  "LEVEL 5 — TECHNICAL ANALYSIS": "Candles, trends, volume, RSI, MACD, VWAP, ATR, liquidity zones, Wyckoff, Elliott Wave and professional chart workflow.",
  "LEVEL 6 — PROFESSIONAL TRADING": "Trading styles, futures, options, leverage, position sizing, backtesting, execution, psychology and trading systems.",
  "LEVEL 7 — CRYPTOCURRENCIES AND BLOCKCHAIN": "Bitcoin, Ethereum, blockchain, DeFi, staking, tokenomics, unlocks, on-chain research, scams and crypto cycles.",
  "LEVEL 8 — PSYCHOLOGY AND BEHAVIORAL FINANCE": "Fear, greed, FOMO, cognitive biases, discipline, volatility, patience and professional decision-making.",
  "LEVEL 9 — PORTFOLIO MANAGEMENT": "Portfolio construction, diversification, correlation, allocation, rebalancing, hedging, stress testing and wealth systems.",
  "LEVEL 10 — PROFESSIONAL AND INSTITUTIONAL THINKING": "Hedge funds, capital flows, prime brokers, dark pools, quant strategies, AI, private equity and institutional frameworks.",
  "LEVEL 11 — VIDEO LESSONS": "A dedicated section prepared for future screen-recorded lessons, chart walkthroughs, case studies and guided tutorials.",
  "LEVEL 12 — TECHNICAL LITERATURE": "A structured reading library for books, reports, research papers, study notes, checklists and professional references.",
};

function parseLessons(): Lesson[] {
  return LESSON_ROWS.trim().split("\n").map((row) => {
    const [id, level, title] = row.split("|");
    return { id: Number(id), level, title };
  });
}

function groupByLevel(lessons: Lesson[]) {
  return lessons.reduce<Record<string, Lesson[]>>((acc, lesson) => {
    acc[lesson.level] = acc[lesson.level] || [];
    acc[lesson.level].push(lesson);
    return acc;
  }, {});
}

function has(text: string, terms: string[]) {
  const lower = text.toLowerCase();
  return terms.some((term) => lower.includes(term.toLowerCase()));
}

function getCategory(title: string) {
  if (has(title, ["Money", "Inflation", "Compound", "Banking", "Central Banks", "Debt", "Credit", "Interest Rates", "Financial Discipline", "Wealth", "Investing", "Speculation", "Asset Classes", "Risk and Return", "Time Horizons", "Financial Markets", "Market Institutions", "Market Makers"])) return "foundation";
  if (has(title, ["Stock", "IPO", "Exchanges", "NYSE", "NASDAQ", "Market Capitalization", "Enterprise Value", "Growth", "Value", "Dividend", "Buybacks", "Dilution", "Sector", "Mega Caps", "Small Caps", "Defensive", "Cyclical", "Moats", "Pricing Power", "Network Effects", "Competitive", "Institutional Ownership", "Insider"])) return "stocks";
  if (has(title, ["Financial Report", "Income Statement", "Balance Sheet", "Cash Flow", "Revenue", "EPS", "Margin", "EBITDA", "Free Cash Flow", "FCF", "ROE", "ROIC", "ROA", "Debt Analysis", "Interest Coverage", "Liquidity Ratios", "P/E", "PEG", "P/S", "EV/EBITDA", "DCF", "Intrinsic", "Margin of Safety", "Earnings Manipulation", "Accounting", "Short Seller", "Research Workflow", "Investment Thesis"])) return "fundamental";
  if (has(title, ["Macroeconomics", "GDP", "CPI", "Deflation", "Federal Reserve", "ECB", "Bond", "Yield Curve", "Quantitative Easing", "Liquidity Cycles", "Dollar", "Oil", "Commodities", "Geopolitics", "Recessions", "Credit Crises", "Banking Crises", "Debt Cycles", "Labor Market", "Consumer Spending", "Macro"])) return "macro";
  if (has(title, ["Technical", "Candlestick", "Support", "Resistance", "Trend", "Market Structure", "Volume", "Moving Averages", "RSI", "MACD", "Bollinger", "Fibonacci", "VWAP", "ATR", "Breakouts", "Reversal", "Divergences", "Timeframe", "Chart", "Liquidity Zones", "Stop Hunts", "Order Flow", "Smart Money", "Wyckoff", "Elliott"])) return "technical";
  if (has(title, ["Trading", "Scalping", "Momentum", "Mean Reversion", "Pair", "Market Making", "High Frequency", "Futures", "Options", "Greeks", "Hedging", "Leverage", "Risk/Reward", "Stop Loss", "Position Sizing", "Exposure", "Drawdown", "Journal", "Backtesting", "Strategy", "Probability", "Expectancy", "Execution", "Manipulation"])) return "trading";
  if (has(title, ["Bitcoin", "Blockchain", "Mining", "Wallets", "Ethereum", "Smart Contracts", "Layer", "DeFi", "Staking", "Yield Farming", "Liquidity Pools", "Stablecoins", "Tokenomics", "Token Unlocks", "On-Chain", "Crypto", "Halving", "Altcoin", "NFT", "Meme", "Exchange Risks", "Rug Pulls"])) return "crypto";
  if (has(title, ["Fear", "Greed", "FOMO", "Panic", "Overtrading", "Revenge", "Bias", "Discipline", "Patience", "Volatility", "Mindset", "Decision Making"])) return "psychology";
  if (has(title, ["Portfolio", "Diversification", "Correlation", "Allocation", "Rebalancing", "Cash Management", "Defensive Positioning", "Aggressive", "Risk Parity", "Hedging Portfolio", "Crisis Management", "Black Swan", "Stress Testing", "Wealth Systems"])) return "portfolio";
  if (has(title, ["Hedge Funds", "Capital Flows", "Prime Brokers", "Dark Pools", "Liquidity Engineering", "Quantitative", "Algorithmic", "AI", "Macro Hedge", "Sovereign", "Private Equity", "Venture Capital", "IPO Investing", "Distressed", "Crisis Investing", "Institutional-Grade", "Multi-Asset", "Professional Investor"])) return "institutional";
  if (has(title, ["Video", "Screen Recording", "Walkthrough"])) return "video";
  if (has(title, ["Reading", "Books", "Materials", "Papers", "Notes", "Literature"])) return "literature";
  return "general";
}

function formulaFor(title: string) {
  if (has(title, ["Inflation", "CPI"])) return { formula: "Inflation Rate = (Current CPI - Previous CPI) / Previous CPI × 100", example: "If CPI rises from 250 to 270, inflation is (270 - 250) / 250 × 100 = 8%. If wages rise only 4%, real purchasing power falls by roughly 4%." };
  if (has(title, ["Deflation"])) return { formula: "Deflation Rate = (Current Price Index - Previous Price Index) / Previous Price Index × 100", example: "If the price index falls from 200 to 194, deflation is (194 - 200) / 200 × 100 = -3%. Goods are cheaper, but falling demand can hurt company revenue and employment." };
  if (has(title, ["Compound Interest"])) return { formula: "Future Value = Present Value × (1 + r)^n", example: "Investing $10,000 at 8% for 20 years gives 10,000 × (1.08)^20 = $46,610. The gain is not linear because returns compound on previous returns." };
  if (has(title, ["Market Capitalization", "Market Cap"])) return { formula: "Market Cap = Share Price × Shares Outstanding", example: "If a company has 1.5 billion shares and each share trades at $80, market cap = 1.5B × $80 = $120B." };
  if (has(title, ["Enterprise Value"])) return { formula: "Enterprise Value = Market Cap + Total Debt + Preferred Equity + Minority Interest - Cash", example: "Market cap $120B + debt $25B - cash $10B = enterprise value of $135B. EV estimates the full takeover value of the business." };
  if (has(title, ["Revenue"])) return { formula: "Revenue = Units Sold × Average Selling Price\nRevenue Growth = (Current Revenue - Previous Revenue) / Previous Revenue × 100", example: "If a company sold 2M devices at $500, revenue is $1B. If next year revenue is $1.25B, growth = (1.25 - 1.00) / 1.00 × 100 = 25%." };
  if (has(title, ["EPS"])) return { formula: "EPS = Net Income / Weighted Average Shares Outstanding", example: "Net income of $12B and 4B shares gives EPS = $3.00. If shares fall to 3.8B through buybacks and income stays $12B, EPS rises to $3.16." };
  if (has(title, ["P/E"])) return { formula: "P/E = Share Price / EPS", example: "A stock at $150 with EPS of $6 trades at 25× earnings. If EPS grows to $7 and the market still pays 25×, implied value becomes $175." };
  if (has(title, ["PEG"])) return { formula: "PEG = P/E Ratio / Expected EPS Growth Rate", example: "P/E 30 with expected EPS growth of 20% gives PEG = 1.5. P/E 18 with growth of 6% gives PEG = 3.0, which may be less attractive despite the lower P/E." };
  if (has(title, ["P/S"])) return { formula: "P/S = Market Cap / Revenue", example: "A $50B company with $10B revenue trades at 5× sales. If revenue grows but margins remain weak, the P/S ratio alone can mislead investors." };
  if (has(title, ["EV/EBITDA"])) return { formula: "EV/EBITDA = Enterprise Value / EBITDA", example: "EV of $90B and EBITDA of $9B produce EV/EBITDA = 10×. This is useful when comparing companies with different debt levels." };
  if (has(title, ["EBITDA"])) return { formula: "EBITDA = Operating Income + Depreciation + Amortization", example: "Operating income of $4B plus depreciation and amortization of $1B gives EBITDA of $5B. It approximates operating cash profitability before financing and taxes." };
  if (has(title, ["Free Cash Flow", "FCF"])) return { formula: "Free Cash Flow = Operating Cash Flow - Capital Expenditures", example: "Operating cash flow of $18B minus capex of $6B gives FCF of $12B. This is cash available for debt reduction, buybacks, dividends or reinvestment." };
  if (has(title, ["FCF Yield"])) return { formula: "FCF Yield = Free Cash Flow / Market Cap × 100", example: "FCF of $12B and market cap of $240B gives FCF yield = 5%. A higher FCF yield can indicate better value if cash flow is durable." };
  if (has(title, ["Gross Margin"])) return { formula: "Gross Margin = (Revenue - Cost of Goods Sold) / Revenue × 100", example: "Revenue of $100M and COGS of $42M produce gross margin of 58%. High gross margin often suggests pricing power, brand strength or software-like economics." };
  if (has(title, ["Operating Margin"])) return { formula: "Operating Margin = Operating Income / Revenue × 100", example: "Operating income of $24M on $100M revenue gives operating margin of 24%. Rising operating margin means the business keeps more profit after operating expenses." };
  if (has(title, ["Net Margin"])) return { formula: "Net Margin = Net Income / Revenue × 100", example: "Net income of $15M on $100M revenue gives net margin of 15%. If revenue grows but net margin falls to 5%, growth may not be translating into shareholder profit." };
  if (has(title, ["Margins"])) return { formula: "Gross Margin = Gross Profit / Revenue × 100\nOperating Margin = Operating Income / Revenue × 100\nNet Margin = Net Income / Revenue × 100", example: "On $100M revenue: gross profit $60M = 60% gross margin; operating income $25M = 25% operating margin; net income $18M = 18% net margin." };
  if (has(title, ["ROE"])) return { formula: "ROE = Net Income / Shareholders' Equity × 100", example: "Net income of $8B and equity of $40B gives ROE = 20%. Check debt: leverage can make ROE look high even when business quality is average." };
  if (has(title, ["ROIC"])) return { formula: "ROIC = NOPAT / Invested Capital × 100", example: "NOPAT of $6B and invested capital of $30B gives ROIC = 20%. A company earning ROIC above its cost of capital creates value." };
  if (has(title, ["ROA"])) return { formula: "ROA = Net Income / Total Assets × 100", example: "Net income of $5B and total assets of $100B gives ROA = 5%. Asset-light businesses often have higher ROA than banks or industrial firms." };
  if (has(title, ["Interest Coverage"])) return { formula: "Interest Coverage = EBIT / Interest Expense", example: "EBIT of $3B and interest expense of $300M gives coverage of 10×. Below 2× can become dangerous in a recession." };
  if (has(title, ["Liquidity Ratios"])) return { formula: "Current Ratio = Current Assets / Current Liabilities\nQuick Ratio = (Cash + Marketable Securities + Receivables) / Current Liabilities", example: "Current assets $5B and current liabilities $2.5B give a current ratio of 2.0. A quick ratio below 1.0 can signal short-term liquidity pressure." };
  if (has(title, ["Debt Analysis", "Debt, Credit", "Debt Cycles"])) return { formula: "Net Debt = Total Debt - Cash\nNet Debt / EBITDA = Net Debt / EBITDA", example: "Debt $20B, cash $6B, EBITDA $7B: net debt = $14B and net debt/EBITDA = 2.0×. Higher leverage increases risk when earnings fall." };
  if (has(title, ["DCF"])) return { formula: "Intrinsic Value = Present Value of Future Free Cash Flows\nPV = FCF / (1 + Discount Rate)^n", example: "If expected FCF is $10B next year and the discount rate is 10%, the year-one present value is $10B / 1.10 = $9.09B. DCF is sensitive to growth and discount-rate assumptions." };
  if (has(title, ["Intrinsic Value"])) return { formula: "Intrinsic Value per Share = Estimated Business Value / Shares Outstanding", example: "If the estimated value of a company is $150B and it has 1B shares, intrinsic value is $150 per share. If the stock trades at $110, the discount is about 27%." };
  if (has(title, ["Margin of Safety"])) return { formula: "Margin of Safety = (Intrinsic Value - Market Price) / Intrinsic Value × 100", example: "Intrinsic value $100 and market price $75 give margin of safety = 25%. This protects against mistakes in assumptions." };
  if (has(title, ["Dividend"])) return { formula: "Dividend Yield = Annual Dividend per Share / Share Price × 100\nPayout Ratio = Dividends / Net Income × 100", example: "A $3 annual dividend on a $60 stock gives a 5% yield. If the company earns $5 EPS and pays $3, payout ratio is 60%." };
  if (has(title, ["Buybacks", "Dilution"])) return { formula: "Share Count Change = (New Shares - Old Shares) / Old Shares × 100", example: "If shares fall from 1.0B to 0.9B, share count declines 10%, boosting each remaining share's claim on earnings. If shares rise to 1.2B, shareholders are diluted by 20%." };
  if (has(title, ["RSI"])) return { formula: "RSI = 100 - [100 / (1 + RS)]\nRS = Average Gain / Average Loss", example: "If average gain is 1.2 and average loss is 0.8, RS = 1.5 and RSI = 60. RSI above 70 can show strong momentum or overextension; below 30 can show weakness or oversold pressure." };
  if (has(title, ["MACD"])) return { formula: "MACD Line = 12-period EMA - 26-period EMA\nSignal Line = 9-period EMA of MACD\nHistogram = MACD Line - Signal Line", example: "If the 12 EMA rises above the 26 EMA and MACD crosses above the signal line, momentum is improving. In sideways markets, the same signal may fail repeatedly." };
  if (has(title, ["Moving Averages"])) return { formula: "Simple Moving Average = Sum of Closing Prices / Number of Periods", example: "Closing prices 100, 102, 103, 101, 104 give a 5-day SMA of 102. A 50-day average above the 200-day average often signals longer-term strength." };
  if (has(title, ["Bollinger"])) return { formula: "Upper Band = Moving Average + 2 Standard Deviations\nLower Band = Moving Average - 2 Standard Deviations", example: "If the 20-day average is $100 and standard deviation is $4, the upper band is $108 and lower band is $92. Bands expand when volatility rises." };
  if (has(title, ["ATR"])) return { formula: "True Range = max(High-Low, |High-Previous Close|, |Low-Previous Close|)\nATR = Average True Range", example: "If a stock has ATR of $5, a $1 stop-loss is likely too tight. Professionals use ATR to size stops around normal volatility." };
  if (has(title, ["VWAP"])) return { formula: "VWAP = Sum(Price × Volume) / Sum(Volume)", example: "If most volume traded near $50 and your average buy price is $49.70, execution is better than VWAP. Institutions use VWAP to judge execution quality." };
  if (has(title, ["Fibonacci"])) return { formula: "Common retracement levels: 23.6%, 38.2%, 50%, 61.8%, 78.6%", example: "If a stock rises from $100 to $150, a 50% retracement is $125 and a 61.8% retracement is about $119.10. These are zones, not guarantees." };
  if (has(title, ["Risk/Reward"])) return { formula: "Risk/Reward = Potential Loss / Potential Gain\nReward/Risk = Potential Gain / Potential Loss", example: "Buying at $100 with stop at $95 and target at $115 risks $5 to make $15. Reward/risk = 3:1." };
  if (has(title, ["Position Sizing"])) return { formula: "Position Size = Account Risk / Stop Distance", example: "On a $50,000 account, risking 1% means $500 risk. If stop distance is $2 per share, position size = 250 shares." };
  if (has(title, ["Expected", "Expectancy", "Probability"])) return { formula: "Expectancy = (Win Rate × Average Win) - (Loss Rate × Average Loss)", example: "Win rate 45%, average win $300, loss rate 55%, average loss $150: expectancy = 0.45×300 - 0.55×150 = $52.50 per trade." };
  if (has(title, ["Crypto", "Bitcoin", "Ethereum", "Token", "Blockchain", "DeFi", "Staking", "Yield", "Stablecoins"])) return { formula: "Market Cap = Token Price × Circulating Supply\nFDV = Token Price × Maximum Supply", example: "A token priced at $2 with 500M circulating supply has $1B market cap. If max supply is 2B, FDV is $4B, meaning future dilution risk may be large." };
  return { formula: "", example: "" };
}

function getLessonFocus(title: string) {
  if (has(title, ["Video", "Screen Recording", "Walkthrough"])) {
    return {
      intro: `${title} is a future practical video module. Its purpose is to turn written theory into visual step-by-step demonstrations using charts, statements, watchlists, research notes and real market examples.`,
      use: "This module will be used for screen recordings, narrated chart examples, practical walkthroughs and case studies. It should teach a viewer what to look at, where to click, what numbers matter and how to avoid mechanical mistakes.",
      important: "Video helps beginners because many investing skills are visual and procedural. Seeing a chart, a financial report or a checklist in action is often easier than reading a definition.",
      mistake: "The main beginner mistake is passive watching. A video lesson is useful only if the student pauses, repeats the process, takes notes and applies it to a real asset."
    };
  }

  if (has(title, ["Reading", "Books", "Materials", "Papers", "Notes", "Literature"])) {
    return {
      intro: `${title} is a technical reading module. It is designed to organize high-quality books, reports, research papers, checklists and study notes into a repeatable learning path.`,
      use: "This section is used to build a professional reading habit: extract frameworks, save formulas, summarize case studies and convert reading into investment checklists.",
      important: "Reading gives depth. Markets reward investors who can compare current events with history, understand accounting language and recognize recurring patterns across cycles.",
      mistake: "Beginners often read randomly without notes. Professional reading produces models, checklists and better questions."
    };
  }

  if (has(title, ["Revenue", "EPS", "P/E", "P/S", "PEG", "EBITDA", "Free Cash Flow", "FCF", "Margin", "ROE", "ROIC", "ROA", "Debt", "Interest Coverage", "Liquidity Ratios", "Market Cap", "Enterprise Value", "DCF", "Intrinsic Value", "Dividend", "Buybacks", "Dilution"])) {
    return {
      intro: `${title} is a company-analysis metric lesson. It focuses on how to measure business performance, profitability, valuation, financial strength or shareholder value using numbers instead of opinion.`,
      use: "Investors use this metric to compare companies, track performance over time, judge valuation and detect whether a business is improving or deteriorating.",
      important: "Metrics matter because stock prices eventually react to growth, margins, cash flow, balance sheet strength and market expectations. A company can be popular and still be overpriced, or boring and still be valuable.",
      mistake: "Beginners often isolate one ratio and ignore the full context. A metric must be compared with company history, competitors, sector economics, interest rates and the quality of the underlying business."
    };
  }

  if (has(title, ["RSI", "MACD", "Moving Averages", "Bollinger", "Fibonacci", "VWAP", "ATR", "Candlestick", "Support", "Resistance", "Trend", "Volume", "Breakout", "Divergence", "Chart", "Liquidity", "Order Flow", "Wyckoff", "Elliott"])) {
    return {
      intro: `${title} is a technical-analysis lesson. It explains how price, volume, volatility and market structure can help investors and traders understand behavior on a chart.`,
      use: "Traders use this tool to identify trend, momentum, support, resistance, volatility and possible entry or exit zones. It is most useful when combined with risk management and higher-timeframe context.",
      important: "Technical analysis matters because markets are not only financial statements; they are also auction systems driven by buyers, sellers, liquidity and psychology.",
      mistake: "Beginners often treat chart tools as predictions. Professionals treat them as probability tools and always define invalidation, position size and risk before entering."
    };
  }

  if (has(title, ["Bitcoin", "Ethereum", "Crypto", "Blockchain", "Mining", "Wallets", "Smart Contracts", "Layer", "DeFi", "Staking", "Tokenomics", "Stablecoins", "On-Chain", "Halving", "Altcoin", "NFT", "Meme", "Exchange", "Rug Pulls"])) {
    return {
      intro: `${title} is a crypto-market lesson. It explains the technology, economic incentives, token supply, security, liquidity and adoption factors behind digital assets.`,
      use: "Crypto investors use this knowledge to evaluate network utility, token design, liquidity, custody risk, regulation and whether market hype is supported by real activity.",
      important: "Crypto is high-potential but high-risk. Understanding supply, unlocks, custody, protocol revenue, user activity and security is essential before allocating capital.",
      mistake: "Beginners often buy narratives without checking supply, unlock schedules, liquidity, team incentives, exchange risk or whether the project solves a real problem."
    };
  }

  if (has(title, ["Inflation", "Deflation", "GDP", "Federal Reserve", "ECB", "Interest Rates", "Bond", "Yield Curve", "Quantitative Easing", "Dollar", "Oil", "Commodities", "Recession", "Credit", "Banking", "Labor", "Consumer", "Macro"])) {
    return {
      intro: `${title} is a macroeconomic lesson. It explains how large economic forces influence stocks, bonds, commodities, currencies, crypto and investor behavior.`,
      use: "Investors use macro analysis to understand market regimes, central-bank policy, liquidity conditions, recession risk and which asset classes may benefit or suffer.",
      important: "Macro matters because even excellent companies can fall when liquidity tightens, rates rise or recession risk increases. It helps investors avoid analyzing companies in isolation.",
      mistake: "Beginners often react to headlines without asking what the market expected, whether the data changes policy and which assets are actually sensitive to the change."
    };
  }

  return {
    intro: `${title} is a core investing lesson. It explains the concept directly and connects it to real decisions a beginner investor must eventually make.`,
    use: "This concept is used to understand risk, value, behavior, market structure or capital allocation. It belongs in the investor's process because it improves decision quality.",
    important: "It is important because investing is not guessing. A disciplined investor builds a framework, checks evidence and avoids emotional decisions.",
    mistake: "Beginners often jump to action before understanding the concept, the numbers and the risk. A professional first defines the question, then analyzes the evidence."
  };
}

function institutionUse(title: string) {
  if (has(title, ["Revenue", "EPS", "P/E", "P/S", "PEG", "EBITDA", "Free Cash Flow", "FCF", "Margin", "ROE", "ROIC", "ROA", "Debt", "Interest Coverage", "Liquidity Ratios", "Market Cap", "Enterprise Value", "DCF", "Intrinsic Value", "Dividend", "Buybacks", "Dilution"])) {
    return "Institutions use this metric inside comparative models, screening systems and investment committee notes. They rarely use it alone. They compare it with historical averages, sector peers, management guidance, balance-sheet risk, interest-rate conditions and expected future growth.";
  }

  if (has(title, ["RSI", "MACD", "Moving Averages", "Bollinger", "Fibonacci", "VWAP", "ATR", "Candlestick", "Support", "Resistance", "Trend", "Volume", "Breakout", "Divergence", "Chart", "Liquidity", "Order Flow", "Wyckoff", "Elliott"])) {
    return "Professional desks use this concept to define market structure, liquidity zones, volatility, execution quality and trade risk. It is not treated as a guaranteed signal. It is combined with position sizing, stop placement, catalyst awareness and multi-timeframe confirmation.";
  }

  if (has(title, ["Inflation", "Deflation", "GDP", "Federal Reserve", "ECB", "Interest Rates", "Bond", "Yield Curve", "Quantitative Easing", "Dollar", "Oil", "Commodities", "Recession", "Credit", "Banking", "Labor", "Consumer", "Macro"])) {
    return "Institutional investors use this topic to build a macro regime view. They connect economic data with central-bank policy, liquidity, earnings expectations, valuation multiples, currency trends and sector positioning.";
  }

  if (has(title, ["Bitcoin", "Ethereum", "Crypto", "Blockchain", "Mining", "Wallets", "Smart Contracts", "Layer", "DeFi", "Staking", "Tokenomics", "Stablecoins", "On-Chain", "Halving", "Altcoin", "NFT", "Meme", "Exchange", "Rug Pulls"])) {
    return "Crypto funds and institutional desks use this concept to evaluate network strength, liquidity, custody risk, token supply, unlock schedules, regulation, exchange risk, on-chain activity and whether adoption is real or only speculative.";
  }

  return "Institutions use this concept as one part of a structured decision process. They define the investment question, collect evidence, compare alternatives, estimate risk, document assumptions and decide whether the expected return justifies the capital allocation.";
}


function buildLessonSections(lesson: Lesson) {
  const f = formulaFor(lesson.title);
  const focus = getLessonFocus(lesson.title);
  const sections = [
    { heading: "1. Concept", body: focus.intro },
    { heading: "2. Practical Use", body: focus.use },
    { heading: "3. Why It Matters", body: focus.important },
  ];

  if (f.formula) {
    sections.push({
      heading: "4. Formula and Calculation",
      body: `${f.formula}\n\nDetailed example:\n${f.example}`
    });
  } else {
    sections.push({
      heading: "4. How It Works in Practice",
      body: "This topic works as part of a decision framework. First, define the asset or market you are analyzing. Second, identify the main driver of value or risk. Third, collect evidence. Fourth, compare that evidence with history, competitors and the current market price. Finally, decide whether the potential reward is worth the risk."
    });
  }

  sections.push(
    { heading: "5. Real Example", body: `Apply this lesson to a real asset. For example, compare Apple, NVIDIA, Tesla, Berkshire Hathaway, Bitcoin or Ethereum only through the lens of “${lesson.title}”. The goal is not to admire the asset, but to understand what this specific topic reveals about quality, risk, valuation or timing.` },
    { heading: "6. Institutional Perspective", body: institutionUse(lesson.title) },
    { heading: "7. Common Beginner Mistakes", body: focus.mistake },
    { heading: "8. Checklist", body: "• Define the asset.\n• Identify the relevant data.\n• Calculate the metric if the topic has a formula.\n• Compare with history and competitors.\n• Check whether the market price already reflects the good news.\n• Define what would prove the idea wrong.\n• Control position size before entering." }
  );

  return sections;
}

function visualType(title: string) {
  if (has(title, ["Inflation", "CPI", "Deflation"])) return "inflation";
  if (has(title, ["RSI"])) return "rsi";
  if (has(title, ["MACD"])) return "macd";
  if (has(title, ["Moving Averages"])) return "moving";
  if (has(title, ["Support", "Resistance", "Breakout"])) return "support";
  if (has(title, ["Bitcoin", "Ethereum", "Crypto", "Token", "DeFi", "Blockchain"])) return "crypto";
  return "valuation";
}

function PracticalVisual({ type }: { type: string }) {
  return (
    <div style={styles.visualCard}>
      <div style={styles.visualLabel}>Practical Visual Example</div>
      <svg viewBox="0 0 760 280" width="100%" height="280" role="img">
        <rect x="0" y="0" width="760" height="280" rx="18" fill="rgba(8,20,40,0.96)" />
        {[45, 90, 135, 180, 225].map((y) => <line key={y} x1="45" y1={y} x2="720" y2={y} stroke="rgba(255,255,255,0.08)" />)}
        {type === "inflation" ? (
          <>
            {[["Year 1",120,170,60,"$100"],["Year 2",270,135,95,"$110"],["Year 3",420,95,135,"$125"],["Year 4",570,65,165,"$140"]].map(([label,x,y,h,price]) => (
              <g key={String(label)}><rect x={Number(x)} y={Number(y)} width="90" height={Number(h)} rx="10" fill="#3b82f6" opacity="0.72" /><text x={Number(x)+45} y={Number(y)-10} textAnchor="middle" fill="white" fontSize="15" fontWeight="800">{price}</text><text x={Number(x)+45} y="255" textAnchor="middle" fill="#dbeafe" fontSize="14">{label}</text></g>
            ))}
          </>
        ) : type === "rsi" ? (
          <>
            <rect x="70" y="50" width="620" height="52" fill="rgba(239,68,68,0.22)" /><rect x="70" y="102" width="620" height="105" fill="rgba(148,163,184,0.10)" /><rect x="70" y="207" width="620" height="42" fill="rgba(34,197,94,0.18)" />
            <text x="85" y="82" fill="#fecaca" fontSize="15" fontWeight="800">RSI above 70: strong momentum / overheating risk</text><text x="85" y="155" fill="#dbeafe" fontSize="15" fontWeight="800">RSI 30–70: normal zone</text><text x="85" y="235" fill="#86efac" fontSize="15" fontWeight="800">RSI below 30: oversold zone</text>
            <polyline fill="none" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" points="80,190 140,172 205,130 265,82 330,118 390,147 455,108 515,76 580,124 650,156 700,134" />
          </>
        ) : type === "macd" ? (
          <>
            <line x1="70" y1="145" x2="700" y2="145" stroke="rgba(255,255,255,0.22)" /><polyline fill="none" stroke="#38bdf8" strokeWidth="4" points="80,160 145,150 210,130 275,108 340,120 405,150 470,170 535,150 600,115 665,100 710,120" /><polyline fill="none" stroke="#facc15" strokeWidth="4" points="80,170 145,160 210,145 275,125 340,130 405,145 470,160 535,158 600,135 665,118 710,125" />
            <text x="80" y="45" fill="#38bdf8" fontSize="15" fontWeight="800">MACD Line</text><text x="190" y="45" fill="#facc15" fontSize="15" fontWeight="800">Signal Line</text>
          </>
        ) : type === "crypto" ? (
          <>
            {[["Bitcoin",140,100,"#facc15"],["Ethereum",340,100,"#38bdf8"],["DeFi",540,100,"#22c55e"],["Tokenomics",250,195,"#a78bfa"],["Liquidity",470,195,"#fb7185"]].map(([label,x,y,color]) => (
              <g key={String(label)}><circle cx={Number(x)} cy={Number(y)} r="48" fill={String(color)} opacity="0.18" /><circle cx={Number(x)} cy={Number(y)} r="47" stroke={String(color)} strokeWidth="3" fill="none" /><text x={Number(x)} y={Number(y)+5} textAnchor="middle" fill="#dbeafe" fontSize="14" fontWeight="800">{label}</text></g>
            ))}
          </>
        ) : (
          <>
            <line x1="60" y1="210" x2="710" y2="210" stroke="#22c55e" strokeWidth="3" strokeDasharray="8 8" /><text x="65" y="202" fill="#86efac" fontSize="14" fontWeight="800">Support / Value zone</text>
            <line x1="60" y1="75" x2="710" y2="75" stroke="#f87171" strokeWidth="3" strokeDasharray="8 8" /><text x="65" y="66" fill="#fca5a5" fontSize="14" fontWeight="800">Resistance / Expensive zone</text>
            <polyline fill="none" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" points="60,220 120,190 175,205 235,150 290,165 345,120 400,135 460,92 525,112 595,80 665,95 710,68" />
            {type === "moving" && <polyline fill="none" stroke="#facc15" strokeWidth="3" strokeLinecap="round" points="60,215 140,198 220,180 300,160 380,142 460,124 540,108 620,96 710,82" />}
          </>
        )}
      </svg>
    </div>
  );
}

export default function EducationPage() {
  const supabase = useMemo(() => createClient(), []);
  const lessons = useMemo(() => parseLessons(), []);
  const grouped = useMemo(() => groupByLevel(lessons), [lessons]);
  const levelNames = Object.keys(grouped);
  const [plan, setPlan] = useState<PlanType>("loading");
  const [selectedLesson, setSelectedLesson] = useState<Lesson>(lessons[0]);
  const [openLevel, setOpenLevel] = useState<string>(levelNames[0]);
  const content = useMemo(() => buildLessonSections(selectedLesson), [selectedLesson]);

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) { window.location.href = "/pricing"; return; }
      const { data } = await supabase.from("user_plans").select("plan, access_active").eq("email", user.email).single();
      if ((data?.plan !== "pro" && data?.plan !== "unlimited") || !data?.access_active) { window.location.href = "/pricing"; return; }
      setPlan(data.plan);
    };
    loadUser();
  }, [supabase]);

  if (plan === "loading") return <div style={styles.loadingPage}>Loading Education Academy...</div>;

  return (
    <main style={styles.page}>
      <div style={styles.wrapper}>
        <div style={styles.topRow}>
          <button onClick={() => (window.location.href = "https://www.aiproanalysis.com")} style={styles.homeButton}>← Home</button>
          <div style={styles.premiumBadge}>Premium Education Academy</div>
        </div>

        <div style={styles.layout}>
          <aside style={styles.sidebar}>
            <h1 style={styles.sidebarTitle}>Complete Investment Academy</h1>
            <p style={styles.sidebarSubtitle}>A structured path from absolute beginner to professional investor and trader.</p>

            <div style={styles.levelList}>
              {levelNames.map((level) => {
                const isOpen = openLevel === level;
                return (
                  <div key={level} style={styles.levelBlock}>
                    <button style={styles.levelButton} onClick={() => setOpenLevel(isOpen ? "" : level)}>
                      <span>{level}</span><span>{isOpen ? "▲" : "▼"}</span>
                    </button>
                    {isOpen ? (
                      <div style={styles.lessonsWrap}>
                        <p style={styles.levelSubtitle}>{LEVEL_DESCRIPTIONS[level] || "Professional academy section."}</p>
                        {grouped[level].map((lesson) => (
                          <button key={lesson.id} style={{...styles.lessonButton, ...(selectedLesson.id === lesson.id ? styles.lessonButtonActive : {})}} onClick={() => setSelectedLesson(lesson)}>
                            Lesson {lesson.id} — {lesson.title}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}

              <div style={styles.levelBlock}>
                <button style={styles.levelButton}><span>FINAL GRADUATION</span><span>✓</span></button>
                <div style={styles.lessonsWrap}>
                  {["Public company analysis","Investment portfolio construction","Macro market analysis","Technical analysis of a real chart","Risk management during crisis","Crypto research report","Personal trading strategy","Institutional investment thesis","Complete professional investment plan"].map((exam, index) => <div key={exam} style={styles.examItem}>Final Exam {index + 1} — {exam}</div>)}
                </div>
              </div>
            </div>
          </aside>

          <section style={styles.contentCard}>
            <div style={styles.lessonMeta}>{selectedLesson.level}</div>
            <h1 style={styles.lessonTitle}>Lesson {selectedLesson.id} — {selectedLesson.title}</h1>
            <PracticalVisual type={visualType(selectedLesson.title)} />

            <div style={styles.sectionsWrap}>
              {content.map((section) => (
                <article key={section.heading} style={styles.lessonSection}>
                  <h2 style={styles.sectionTitle}>{section.heading}</h2>
                  <p style={styles.sectionText}>{section.body}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  loadingPage: { minHeight: "100vh", background: "#050d1f", color: "white", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "24px", fontWeight: 800 },
  page: { minHeight: "100vh", background: "radial-gradient(circle at top, #0f274d 0%, #08152f 40%, #050d1f 100%)", padding: "28px" },
  wrapper: { maxWidth: "1580px", margin: "0 auto" },
  topRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "18px" },
  homeButton: { background: "rgba(37,99,235,0.22)", color: "white", border: "1px solid rgba(96,165,250,0.35)", borderRadius: "12px", padding: "12px 18px", fontSize: "14px", fontWeight: 900, cursor: "pointer" },
  premiumBadge: { color: "#93c5fd", fontSize: "13px", fontWeight: 900, background: "rgba(37,99,235,0.16)", border: "1px solid rgba(96,165,250,0.22)", borderRadius: "999px", padding: "10px 14px" },
  layout: { display: "grid", gridTemplateColumns: "390px 1fr", gap: "22px", alignItems: "start" },
  sidebar: { background: "rgba(10,20,40,0.94)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "18px", padding: "20px", position: "sticky", top: "20px", maxHeight: "calc(100vh - 60px)", overflowY: "auto" },
  sidebarTitle: { color: "white", fontSize: "22px", fontWeight: 900, margin: "0 0 8px" },
  sidebarSubtitle: { color: "#94a3b8", fontSize: "13px", lineHeight: 1.5, margin: "0 0 16px" },
  levelList: { display: "flex", flexDirection: "column", gap: "10px" },
  levelBlock: { display: "flex", flexDirection: "column", gap: "8px" },
  levelButton: { width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", background: "rgba(37,99,235,0.18)", color: "white", border: "1px solid rgba(96,165,250,0.24)", borderRadius: "12px", padding: "12px", fontSize: "13px", fontWeight: 900, cursor: "pointer", textAlign: "left" },
  lessonsWrap: { display: "flex", flexDirection: "column", gap: "7px" },
  levelSubtitle: { color: "#94a3b8", fontSize: "12px", lineHeight: 1.5, margin: "2px 0 4px" },
  lessonButton: { width: "100%", background: "rgba(255,255,255,0.035)", color: "white", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "11px", padding: "11px 12px", fontSize: "12px", lineHeight: 1.35, fontWeight: 800, cursor: "pointer", textAlign: "left" },
  lessonButtonActive: { background: "rgba(37,99,235,0.55)", border: "1px solid rgba(96,165,250,0.45)" },
  examItem: { color: "#dbeafe", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px", padding: "10px", fontSize: "12px", fontWeight: 700 },
  contentCard: { background: "rgba(8,18,36,0.96)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", padding: "34px", boxShadow: "0 24px 50px rgba(0,0,0,0.34)" },
  lessonMeta: { color: "#93c5fd", fontSize: "13px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.45px", marginBottom: "12px" },
  lessonTitle: { color: "white", fontSize: "34px", lineHeight: 1.18, fontWeight: 900, margin: "0 0 22px" },
  visualCard: { background: "rgba(3,10,25,0.55)", border: "1px solid rgba(96,165,250,0.22)", borderRadius: "18px", padding: "18px", marginBottom: "24px" },
  visualLabel: { color: "#93c5fd", fontSize: "13px", fontWeight: 900, marginBottom: "12px", textTransform: "uppercase" },
  sectionsWrap: { display: "flex", flexDirection: "column", gap: "18px" },
  lessonSection: { borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "16px" },
  sectionTitle: { color: "white", fontSize: "22px", lineHeight: 1.25, margin: "0 0 8px", fontWeight: 900 },
  sectionText: { color: "#dbeafe", fontSize: "16px", lineHeight: 1.45, whiteSpace: "pre-line", margin: 0 },
};
