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
  if (has(title, ["Inflation", "CPI"])) return { formula: "Inflation Rate = (Current CPI - Previous CPI) / Previous CPI × 100", example: "If CPI rises from 250 to 270, inflation is (270 - 250) / 250 × 100 = 8%. If your cash earns 2%, the approximate real return is 2% - 8% = -6%." };
  if (has(title, ["Compound Interest"])) return { formula: "Future Value = Present Value × (1 + r)^n", example: "Investing $10,000 at 8% annually for 20 years gives 10,000 × (1.08)^20 = $46,610. Time and reinvestment do most of the heavy work." };
  if (has(title, ["Market Capitalization", "Enterprise Value"])) return { formula: "Market Cap = Share Price × Shares Outstanding\nEnterprise Value = Market Cap + Total Debt - Cash", example: "A $120 share price and 1 billion shares create a $120 billion market cap. With $20 billion debt and $10 billion cash, EV = 120 + 20 - 10 = $130 billion." };
  if (has(title, ["Revenue"])) return { formula: "Revenue = Price × Units Sold\nRevenue Growth = (Current Revenue - Previous Revenue) / Previous Revenue × 100", example: "1 million units sold at $50 create $50 million revenue. If sales become 1.2 million units at $55, revenue becomes $66 million, a 32% increase." };
  if (has(title, ["EPS"])) return { formula: "EPS = Net Income / Shares Outstanding", example: "A company with $10 billion net income and 5 billion shares has EPS of $2. If EPS grows to $2.50, EPS growth is 25%." };
  if (has(title, ["P/E"])) return { formula: "P/E = Share Price / EPS\nImplied Price = EPS × P/E", example: "EPS of $7 and a P/E of 28 imply a $196 price. If EPS rises to $8 but the P/E compresses to 22, the implied price becomes $176." };
  if (has(title, ["PEG"])) return { formula: "PEG = P/E / EPS Growth Rate", example: "A company with P/E 30 and EPS growth 20% has PEG 1.5. A P/E 20 company growing 5% has PEG 4.0. Lower P/E does not always mean better value." };
  if (has(title, ["P/S"])) return { formula: "P/S = Market Cap / Revenue", example: "A $100 billion market cap and $25 billion revenue create a P/S ratio of 4. This is often useful for high-growth companies with limited current earnings." };
  if (has(title, ["EBITDA"])) return { formula: "EBITDA = Operating Income + Depreciation + Amortization\nEV/EBITDA = Enterprise Value / EBITDA", example: "Operating income of $8 billion plus D&A of $1.5 billion gives EBITDA of $9.5 billion. EV of $95 billion gives EV/EBITDA of 10." };
  if (has(title, ["Free Cash Flow", "FCF"])) return { formula: "FCF = Operating Cash Flow - Capital Expenditures\nFCF Yield = FCF / Market Cap × 100", example: "Operating cash flow of $15 billion minus capex of $5 billion gives FCF of $10 billion. With a $200 billion market cap, FCF yield is 5%." };
  if (has(title, ["Gross Margin"])) return { formula: "Gross Margin = (Revenue - COGS) / Revenue × 100", example: "Revenue of $100 million and COGS of $40 million give gross margin of 60%. High gross margin often signals product strength or brand power." };
  if (has(title, ["Operating Margin"])) return { formula: "Operating Margin = Operating Income / Revenue × 100", example: "Operating income of $25 million and revenue of $100 million give operating margin of 25%. Rising operating margin often shows scalability." };
  if (has(title, ["Net Margin"])) return { formula: "Net Margin = Net Income / Revenue × 100", example: "Net income of $18 million and revenue of $100 million give net margin of 18%. If revenue grows but net margin falls, expenses may be absorbing the growth." };
  if (has(title, ["ROE"])) return { formula: "ROE = Net Income / Shareholders' Equity × 100", example: "Net income of $10 billion and equity of $50 billion give ROE of 20%. Always check whether high ROE is driven by excessive leverage." };
  if (has(title, ["ROIC"])) return { formula: "ROIC = NOPAT / Invested Capital × 100", example: "NOPAT of $8 billion and invested capital of $40 billion give ROIC of 20%. Consistently high ROIC often indicates a high-quality business." };
  if (has(title, ["ROA"])) return { formula: "ROA = Net Income / Total Assets × 100", example: "Net income of $10 billion and total assets of $100 billion give ROA of 10%. ROA measures how efficiently assets create profit." };
  if (has(title, ["Debt", "Interest Coverage", "Liquidity Ratios"])) return { formula: "Net Debt = Total Debt - Cash\nInterest Coverage = EBIT / Interest Expense", example: "Debt of $30 billion and cash of $12 billion create net debt of $18 billion. EBIT of $10 billion and interest expense of $1 billion give interest coverage of 10." };
  if (has(title, ["RSI"])) return { formula: "RSI = 100 - [100 / (1 + RS)]\nRS = Average Gain / Average Loss", example: "RSI above 70 can signal strong momentum or overheating. RSI below 30 can signal oversold conditions. It should never be used alone." };
  if (has(title, ["MACD"])) return { formula: "MACD Line = 12 EMA - 26 EMA\nSignal Line = 9 EMA of MACD\nHistogram = MACD Line - Signal Line", example: "A bullish MACD cross suggests improving momentum, but in sideways markets MACD can create many false signals." };
  if (has(title, ["Moving Averages"])) return { formula: "SMA = Sum of Closing Prices / Number of Periods", example: "Closing prices of 100, 102, 101, 105 and 107 create a 5-day SMA of 103. Price above the 200-day average often signals long-term strength." };
  if (has(title, ["ATR"])) return { formula: "True Range = max(High-Low, |High-Previous Close|, |Low-Previous Close|)\nATR = Average True Range", example: "If ATR is $5, a $1 stop is probably too tight and may be hit by normal market noise." };
  if (has(title, ["VWAP"])) return { formula: "VWAP = Sum(Price × Volume) / Sum(Volume)", example: "An institution buying below VWAP receives a better average price than the volume-weighted market average for the session." };
  if (has(title, ["Position Sizing", "Risk/Reward"])) return { formula: "Position Size = Amount Risked / Stop Loss Distance\nExpected Value = (Win Rate × Average Win) - (Loss Rate × Average Loss)", example: "With a $100,000 portfolio and 1% risk, the dollar risk is $1,000. If the stop is 5%, position size is $20,000." };
  if (has(title, ["Bitcoin", "Ethereum", "Crypto", "Token", "DeFi", "Blockchain"])) return { formula: "Crypto Market Cap = Token Price × Circulating Supply\nFDV = Token Price × Max Supply", example: "A token priced at $2 with 500 million circulating supply has a $1 billion market cap. If max supply is 2 billion, FDV is $4 billion." };
  return { formula: "Professional Framework = Concept + Numbers + Context + Risk Management", example: "A professional decision combines business quality, valuation, macro conditions, liquidity, risk control and market behavior. One metric is never enough." };
}

function specificDescription(title: string) {
  const category = getCategory(title);
  const name = title.replace(/^Lesson \d+ — /, "");
  const base: Record<string, string> = {
    foundation: `${name} explains the financial foundation behind every investment decision. The lesson connects personal finance, purchasing power, capital formation and rational decision-making, so a beginner can understand how money, time, risk and behavior shape long-term wealth.`,
    stocks: `${name} explains how equity ownership works in real markets. The lesson connects company quality, shareholder rights, valuation, sector behavior and institutional participation, so a beginner can understand why stock prices move and how to judge whether a business deserves capital.`,
    fundamental: `${name} explains how investors read business performance through financial statements and valuation metrics. The lesson focuses on numbers, formulas, quality of earnings, cash generation, balance sheet strength and the difference between accounting profit and real owner value.`,
    macro: `${name} explains how the broad economy affects stocks, bonds, currencies, commodities and crypto. The lesson connects growth, inflation, central banks, interest rates, liquidity and investor positioning, so the student can understand why markets react to economic data.`,
    technical: `${name} explains how market participants express behavior through price, volume and chart structure. The lesson teaches the tool as a decision framework, not as a magic signal, and shows how professionals combine it with trend, liquidity, volatility and risk management.`,
    trading: `${name} explains a practical trading concept used to manage entries, exits, risk and execution. The lesson focuses on process, probability, position sizing, discipline and avoiding emotional decisions in fast-moving markets.`,
    crypto: `${name} explains a crypto and blockchain concept from the perspective of security, utility, liquidity, token supply and adoption. The lesson helps beginners avoid hype-driven decisions and analyze crypto assets like serious market instruments.`,
    psychology: `${name} explains a behavioral finance concept that affects real investor performance. The lesson focuses on emotional control, cognitive bias, decision quality and the gap between knowing what to do and actually doing it under pressure.`,
    portfolio: `${name} explains how investors combine assets into a coherent portfolio. The lesson focuses on diversification, correlation, risk budgeting, rebalancing and building a system that can survive different market environments.`,
    institutional: `${name} explains how professional market participants think, operate and allocate capital. The lesson connects large-scale capital flows, execution, liquidity, research systems and institutional decision-making.`,
    video: `${name} is a prepared module for future visual education. It defines what the video lesson will demonstrate on screen, what chart or report will be used, what the viewer should learn and how the topic will connect to practical investing decisions.`,
    literature: `${name} is a structured reading module. It explains what type of books, reports, research papers or notes belong in this section, how to study them and how to convert reading into practical investment skill.`,
    general: `${name} explains an important market concept through definitions, examples, formulas where relevant and practical institutional context.`,
  };
  return base[category];
}

function institutionUse(title: string) {
  const category = getCategory(title);
  if (category === "macro") return "Institutions use this topic to determine the market regime: growth, inflation, policy direction, liquidity and credit conditions. They adjust equity exposure, bond duration, currency hedges and sector allocation based on how the macro picture changes.";
  if (category === "technical" || category === "trading") return "Professional traders use this topic as part of execution and risk control. They look for liquidity, confirmation across timeframes, volatility conditions, order flow and areas where risk can be defined before capital is deployed.";
  if (category === "crypto") return "Institutions use this topic to assess custody risk, liquidity depth, token supply, regulation, real network activity and whether the asset can fit inside a risk-managed portfolio without operational problems.";
  if (category === "psychology") return "Institutional teams reduce behavioral mistakes through process: investment committees, pre-defined risk limits, written theses, post-trade reviews and independent challenge of assumptions.";
  if (category === "video") return "This future video module will be used to translate theory into demonstration: screen recordings, chart annotation, company analysis walkthroughs and step-by-step examples.";
  if (category === "literature") return "This reading module will be used as a reference system. Professional teams build shared knowledge through reports, books, checklists, models and archived investment cases.";
  return "Institutions use this topic inside a repeatable research process. They compare the company or asset against history, competitors, valuation, market expectations, liquidity and downside risk before making an allocation.";
}

function mistakes(title: string) {
  const category = getCategory(title);
  if (category === "technical" || category === "trading") return "Beginners often treat a signal as a guaranteed prediction, ignore higher timeframes, place stops in obvious liquidity zones and increase risk after losses.";
  if (category === "crypto") return "Beginners often buy because of hype, ignore token unlocks, underestimate exchange and custody risk, and confuse a rising price with real adoption.";
  if (category === "macro") return "Beginners often think one data release explains the entire market, ignore expectations, and fail to separate nominal growth from real growth.";
  if (category === "fundamental") return "Beginners often focus on one attractive metric, ignore cash flow, overlook debt, compare different sectors incorrectly and forget that valuation depends on growth, margins and interest rates.";
  if (category === "video") return "The mistake is to watch passively. Video lessons should be used actively: pause, repeat the steps, write notes and apply the process to a real company or chart.";
  if (category === "literature") return "The mistake is to read without extracting a process. A useful reading system produces notes, checklists, examples and better decisions, not just more information.";
  return "Beginners often look for simple answers, copy other investors, ignore risk management and make decisions after price already moved strongly.";
}

function buildLessonSections(lesson: Lesson) {
  const f = formulaFor(lesson.title);
  const description = specificDescription(lesson.title);
  return [
    { heading: "1. Introduction and Learning Objective", body: `${description} The purpose of this lesson is to make the topic usable in real decisions, not just recognizable as a term. By the end, the student should understand what the concept means, why it matters, which numbers or evidence to check and how to avoid the most common beginner errors.` },
    { heading: "2. Core Concept Explained from Zero", body: `The central idea behind “${lesson.title.replace(/^Lesson \d+ — /, "")}” is to connect market theory with real economic behavior. Every asset has a story, but professional investors do not invest in stories alone. They ask what drives value, what can be measured, what risk is hidden and whether the current price already reflects the good news. This is the difference between guessing and analysis.` },
    { heading: "3. Formula, Model or Practical Calculation", body: `${f.formula}\n\n${f.example}\n\nThe formula is not included as decoration. It is a tool for disciplined thinking. Numbers allow comparison across companies, time periods, sectors and market cycles. When a topic does not have one universal formula, the correct professional approach is to build a checklist and use evidence rather than emotion.` },
    { heading: "4. Real Market Example", body: `Imagine comparing Apple, NVIDIA, Tesla, Berkshire Hathaway, Bitcoin and Ethereum. Each asset can be attractive for a different reason, but the analysis must match the asset. Apple may be evaluated through brand strength, free cash flow and buybacks. NVIDIA may be evaluated through growth, margins and AI demand. Tesla may require analysis of execution risk, competition and valuation. Bitcoin requires scarcity, liquidity, macro demand and custody analysis. Ethereum requires ecosystem usage, staking, fees and developer activity. The lesson topic tells you which lens to use.` },
    { heading: "5. How Institutions Use It", body: institutionUse(lesson.title) },
    { heading: "6. Common Beginner Mistakes", body: mistakes(lesson.title) },
    { heading: "7. Practical Checklist", body: "1. Define the asset or market you are analyzing.\n2. Identify the main driver of value.\n3. Collect at least five facts or numbers.\n4. Compare them with history and competitors.\n5. Define the main risk.\n6. Decide what would prove your thesis wrong.\n7. Size the position according to risk, not excitement." },
    { heading: "8. Key Takeaways", body: "• A good investment process is repeatable.\n• Price and value are not always the same.\n• One metric is never enough.\n• Risk must be defined before entering.\n• Institutions think in scenarios and probabilities.\n• Beginners improve fastest when they write down their thesis and review it later." },
    { heading: "9. Homework", body: `Choose one real company, ETF, commodity, currency pair or crypto asset. Apply this lesson to it. Write a short thesis, list the key numbers, define the downside risk and explain what would make you avoid the investment even if the chart looks attractive.` },
  ];
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
