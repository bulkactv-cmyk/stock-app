"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "../../lib/supabase/client";

type PlanType = "basic" | "pro" | "unlimited" | "loading" | "guest";
type Lesson = { id: number; level: string; title: string; };

const LESSON_ROWS = `1|НИВО 1 — ФИНАНСОВА ОСНОВА И МИСЛЕНЕ НА ИНВЕСТИТОР|Какво представляват парите
2|НИВО 1 — ФИНАНСОВА ОСНОВА И МИСЛЕНЕ НА ИНВЕСТИТОР|История на парите и финансовите системи
3|НИВО 1 — ФИНАНСОВА ОСНОВА И МИСЛЕНЕ НА ИНВЕСТИТОР|Инфлация и покупателна способност
4|НИВО 1 — ФИНАНСОВА ОСНОВА И МИСЛЕНЕ НА ИНВЕСТИТОР|Сложна лихва и натрупване на капитал
5|НИВО 1 — ФИНАНСОВА ОСНОВА И МИСЛЕНЕ НА ИНВЕСТИТОР|Разлика между активи и пасиви
6|НИВО 1 — ФИНАНСОВА ОСНОВА И МИСЛЕНЕ НА ИНВЕСТИТОР|Как работи банковата система
7|НИВО 1 — ФИНАНСОВА ОСНОВА И МИСЛЕНЕ НА ИНВЕСТИТОР|Централни банки и печатане на пари
8|НИВО 1 — ФИНАНСОВА ОСНОВА И МИСЛЕНЕ НА ИНВЕСТИТОР|Дълг, кредити и лихвени проценти
9|НИВО 1 — ФИНАНСОВА ОСНОВА И МИСЛЕНЕ НА ИНВЕСТИТОР|Финансова дисциплина и изграждане на капитал
10|НИВО 1 — ФИНАНСОВА ОСНОВА И МИСЛЕНЕ НА ИНВЕСТИТОР|Психология на богатството
11|НИВО 1 — ФИНАНСОВА ОСНОВА И МИСЛЕНЕ НА ИНВЕСТИТОР|Как мислят богатите инвеститори
12|НИВО 1 — ФИНАНСОВА ОСНОВА И МИСЛЕНЕ НА ИНВЕСТИТОР|Основни финансови грешки на начинаещите
13|НИВО 1 — ФИНАНСОВА ОСНОВА И МИСЛЕНЕ НА ИНВЕСТИТОР|Какво е инвестиране
14|НИВО 1 — ФИНАНСОВА ОСНОВА И МИСЛЕНЕ НА ИНВЕСТИТОР|Инвестиране срещу спекулация
15|НИВО 1 — ФИНАНСОВА ОСНОВА И МИСЛЕНЕ НА ИНВЕСТИТОР|Видове активи и asset classes
16|НИВО 1 — ФИНАНСОВА ОСНОВА И МИСЛЕНЕ НА ИНВЕСТИТОР|Риск и възвръщаемост
17|НИВО 1 — ФИНАНСОВА ОСНОВА И МИСЛЕНЕ НА ИНВЕСТИТОР|Времеви хоризонти при инвестирането
18|НИВО 1 — ФИНАНСОВА ОСНОВА И МИСЛЕНЕ НА ИНВЕСТИТОР|Как работят финансовите пазари
19|НИВО 1 — ФИНАНСОВА ОСНОВА И МИСЛЕНЕ НА ИНВЕСТИТОР|Институции на световните пазари
20|НИВО 1 — ФИНАНСОВА ОСНОВА И МИСЛЕНЕ НА ИНВЕСТИТОР|Какво правят хедж фондовете и маркет мейкърите
21|НИВО 2 — ФОНДОВ ПАЗАР И АКЦИИ|Какво е акция
22|НИВО 2 — ФОНДОВ ПАЗАР И АКЦИИ|IPO и листване на компании
23|НИВО 2 — ФОНДОВ ПАЗАР И АКЦИИ|Как работят борсите
24|НИВО 2 — ФОНДОВ ПАЗАР И АКЦИИ|NYSE, NASDAQ и глобалните пазари
25|НИВО 2 — ФОНДОВ ПАЗАР И АКЦИИ|Market Cap и Enterprise Value
26|НИВО 2 — ФОНДОВ ПАЗАР И АКЦИИ|Growth vs Value компании
27|НИВО 2 — ФОНДОВ ПАЗАР И АКЦИИ|Dividend Investing
28|НИВО 2 — ФОНДОВ ПАЗАР И АКЦИИ|Buybacks и dilution
29|НИВО 2 — ФОНДОВ ПАЗАР И АКЦИИ|Цикли на компаниите
30|НИВО 2 — ФОНДОВ ПАЗАР И АКЦИИ|Sector Rotation
31|НИВО 2 — ФОНДОВ ПАЗАР И АКЦИИ|Mega Caps vs Small Caps
32|НИВО 2 — ФОНДОВ ПАЗАР И АКЦИИ|Defensive vs Cyclical stocks
33|НИВО 2 — ФОНДОВ ПАЗАР И АКЦИИ|High Growth Investing
34|НИВО 2 — ФОНДОВ ПАЗАР И АКЦИИ|Compounders и quality businesses
35|НИВО 2 — ФОНДОВ ПАЗАР И АКЦИИ|Economic Moats
36|НИВО 2 — ФОНДОВ ПАЗАР И АКЦИИ|Pricing Power
37|НИВО 2 — ФОНДОВ ПАЗАР И АКЦИИ|Network Effects
38|НИВО 2 — ФОНДОВ ПАЗАР И АКЦИИ|Competitive Advantages
39|НИВО 2 — ФОНДОВ ПАЗАР И АКЦИИ|Institutional ownership
40|НИВО 2 — ФОНДОВ ПАЗАР И АКЦИИ|Insider buying and selling
41|НИВО 3 — ФУНДАМЕНТАЛЕН АНАЛИЗ|Как да четем финансов отчет
42|НИВО 3 — ФУНДАМЕНТАЛЕН АНАЛИЗ|Income Statement
43|НИВО 3 — ФУНДАМЕНТАЛЕН АНАЛИЗ|Balance Sheet
44|НИВО 3 — ФУНДАМЕНТАЛЕН АНАЛИЗ|Cash Flow Statement
45|НИВО 3 — ФУНДАМЕНТАЛЕН АНАЛИЗ|Revenue analysis
46|НИВО 3 — ФУНДАМЕНТАЛЕН АНАЛИЗ|EPS analysis
47|НИВО 3 — ФУНДАМЕНТАЛЕН АНАЛИЗ|Gross Margin
48|НИВО 3 — ФУНДАМЕНТАЛЕН АНАЛИЗ|Operating Margin
49|НИВО 3 — ФУНДАМЕНТАЛЕН АНАЛИЗ|Net Margin
50|НИВО 3 — ФУНДАМЕНТАЛЕН АНАЛИЗ|EBITDA
51|НИВО 3 — ФУНДАМЕНТАЛЕН АНАЛИЗ|Free Cash Flow
52|НИВО 3 — ФУНДАМЕНТАЛЕН АНАЛИЗ|FCF Yield
53|НИВО 3 — ФУНДАМЕНТАЛЕН АНАЛИЗ|ROE
54|НИВО 3 — ФУНДАМЕНТАЛЕН АНАЛИЗ|ROIC
55|НИВО 3 — ФУНДАМЕНТАЛЕН АНАЛИЗ|ROA
56|НИВО 3 — ФУНДАМЕНТАЛЕН АНАЛИЗ|Debt analysis
57|НИВО 3 — ФУНДАМЕНТАЛЕН АНАЛИЗ|Interest Coverage
58|НИВО 3 — ФУНДАМЕНТАЛЕН АНАЛИЗ|Liquidity ratios
59|НИВО 3 — ФУНДАМЕНТАЛЕН АНАЛИЗ|P/E valuation
60|НИВО 3 — ФУНДАМЕНТАЛЕН АНАЛИЗ|PEG ratio
61|НИВО 3 — ФУНДАМЕНТАЛЕН АНАЛИЗ|P/S ratio
62|НИВО 3 — ФУНДАМЕНТАЛЕН АНАЛИЗ|EV/EBITDA
63|НИВО 3 — ФУНДАМЕНТАЛЕН АНАЛИЗ|DCF valuation
64|НИВО 3 — ФУНДАМЕНТАЛЕН АНАЛИЗ|Intrinsic Value
65|НИВО 3 — ФУНДАМЕНТАЛЕН АНАЛИЗ|Margin of Safety
66|НИВО 3 — ФУНДАМЕНТАЛЕН АНАЛИЗ|Earnings manipulation
67|НИВО 3 — ФУНДАМЕНТАЛЕН АНАЛИЗ|Accounting red flags
68|НИВО 3 — ФУНДАМЕНТАЛЕН АНАЛИЗ|Short seller analysis
69|НИВО 3 — ФУНДАМЕНТАЛЕН АНАЛИЗ|Institutional research workflow
70|НИВО 3 — ФУНДАМЕНТАЛЕН АНАЛИЗ|Building investment thesis
71|НИВО 4 — МАКРОИКОНОМИКА ЗА ИНВЕСТИТОРИ|Какво е макроикономика
72|НИВО 4 — МАКРОИКОНОМИКА ЗА ИНВЕСТИТОРИ|GDP и икономически растеж
73|НИВО 4 — МАКРОИКОНОМИКА ЗА ИНВЕСТИТОРИ|CPI и инфлация
74|НИВО 4 — МАКРОИКОНОМИКА ЗА ИНВЕСТИТОРИ|Deflation
75|НИВО 4 — МАКРОИКОНОМИКА ЗА ИНВЕСТИТОРИ|Federal Reserve
76|НИВО 4 — МАКРОИКОНОМИКА ЗА ИНВЕСТИТОРИ|ECB и глобалните централни банки
77|НИВО 4 — МАКРОИКОНОМИКА ЗА ИНВЕСТИТОРИ|Interest Rates
78|НИВО 4 — МАКРОИКОНОМИКА ЗА ИНВЕСТИТОРИ|Bond Market
79|НИВО 4 — МАКРОИКОНОМИКА ЗА ИНВЕСТИТОРИ|Yield Curve
80|НИВО 4 — МАКРОИКОНОМИКА ЗА ИНВЕСТИТОРИ|Quantitative Easing
81|НИВО 4 — МАКРОИКОНОМИКА ЗА ИНВЕСТИТОРИ|Liquidity cycles
82|НИВО 4 — МАКРОИКОНОМИКА ЗА ИНВЕСТИТОРИ|Dollar strength
83|НИВО 4 — МАКРОИКОНОМИКА ЗА ИНВЕСТИТОРИ|Oil and commodities
84|НИВО 4 — МАКРОИКОНОМИКА ЗА ИНВЕСТИТОРИ|Geopolitics and markets
85|НИВО 4 — МАКРОИКОНОМИКА ЗА ИНВЕСТИТОРИ|Recessions
86|НИВО 4 — МАКРОИКОНОМИКА ЗА ИНВЕСТИТОРИ|Credit crises
87|НИВО 4 — МАКРОИКОНОМИКА ЗА ИНВЕСТИТОРИ|Banking crises
88|НИВО 4 — МАКРОИКОНОМИКА ЗА ИНВЕСТИТОРИ|Debt cycles
89|НИВО 4 — МАКРОИКОНОМИКА ЗА ИНВЕСТИТОРИ|Labor market
90|НИВО 4 — МАКРОИКОНОМИКА ЗА ИНВЕСТИТОРИ|Consumer spending
91|НИВО 4 — МАКРОИКОНОМИКА ЗА ИНВЕСТИТОРИ|Institutional positioning
92|НИВО 4 — МАКРОИКОНОМИКА ЗА ИНВЕСТИТОРИ|Macro investing framework
93|НИВО 5 — ТЕХНИЧЕСКИ АНАЛИЗ|Основи на technical analysis
94|НИВО 5 — ТЕХНИЧЕСКИ АНАЛИЗ|Candlestick structure
95|НИВО 5 — ТЕХНИЧЕСКИ АНАЛИЗ|Support and Resistance
96|НИВО 5 — ТЕХНИЧЕСКИ АНАЛИЗ|Trend analysis
97|НИВО 5 — ТЕХНИЧЕСКИ АНАЛИЗ|Market structure
98|НИВО 5 — ТЕХНИЧЕСКИ АНАЛИЗ|Volume analysis
99|НИВО 5 — ТЕХНИЧЕСКИ АНАЛИЗ|Moving averages
100|НИВО 5 — ТЕХНИЧЕСКИ АНАЛИЗ|RSI
101|НИВО 5 — ТЕХНИЧЕСКИ АНАЛИЗ|MACD
102|НИВО 5 — ТЕХНИЧЕСКИ АНАЛИЗ|Bollinger Bands
103|НИВО 5 — ТЕХНИЧЕСКИ АНАЛИЗ|Fibonacci retracement
104|НИВО 5 — ТЕХНИЧЕСКИ АНАЛИЗ|VWAP
105|НИВО 5 — ТЕХНИЧЕСКИ АНАЛИЗ|ATR volatility
106|НИВО 5 — ТЕХНИЧЕСКИ АНАЛИЗ|Breakouts
107|НИВО 5 — ТЕХНИЧЕСКИ АНАЛИЗ|Fake breakouts
108|НИВО 5 — ТЕХНИЧЕСКИ АНАЛИЗ|Trend continuation
109|НИВО 5 — ТЕХНИЧЕСКИ АНАЛИЗ|Reversal patterns
110|НИВО 5 — ТЕХНИЧЕСКИ АНАЛИЗ|Divergences
111|НИВО 5 — ТЕХНИЧЕСКИ АНАЛИЗ|Multi timeframe analysis
112|НИВО 5 — ТЕХНИЧЕСКИ АНАЛИЗ|Chart psychology
113|НИВО 5 — ТЕХНИЧЕСКИ АНАЛИЗ|Liquidity zones
114|НИВО 5 — ТЕХНИЧЕСКИ АНАЛИЗ|Stop hunts
115|НИВО 5 — ТЕХНИЧЕСКИ АНАЛИЗ|Institutional order flow
116|НИВО 5 — ТЕХНИЧЕСКИ АНАЛИЗ|Smart Money Concepts
117|НИВО 5 — ТЕХНИЧЕСКИ АНАЛИЗ|Wyckoff Method
118|НИВО 5 — ТЕХНИЧЕСКИ АНАЛИЗ|Elliott Wave Theory
119|НИВО 5 — ТЕХНИЧЕСКИ АНАЛИЗ|Advanced chart reading
120|НИВО 5 — ТЕХНИЧЕСКИ АНАЛИЗ|Professional technical workflow
121|НИВО 6 — ПРОФЕСИОНАЛЕН ТРЕЙДИНГ|Day Trading
122|НИВО 6 — ПРОФЕСИОНАЛЕН ТРЕЙДИНГ|Swing Trading
123|НИВО 6 — ПРОФЕСИОНАЛЕН ТРЕЙДИНГ|Position Trading
124|НИВО 6 — ПРОФЕСИОНАЛЕН ТРЕЙДИНГ|Scalping
125|НИВО 6 — ПРОФЕСИОНАЛЕН ТРЕЙДИНГ|Momentum Trading
126|НИВО 6 — ПРОФЕСИОНАЛЕН ТРЕЙДИНГ|Breakout Trading
127|НИВО 6 — ПРОФЕСИОНАЛЕН ТРЕЙДИНГ|Mean Reversion
128|НИВО 6 — ПРОФЕСИОНАЛЕН ТРЕЙДИНГ|Trend Following
129|НИВО 6 — ПРОФЕСИОНАЛЕН ТРЕЙДИНГ|Volatility Trading
130|НИВО 6 — ПРОФЕСИОНАЛЕН ТРЕЙДИНГ|Pair Trading
131|НИВО 6 — ПРОФЕСИОНАЛЕН ТРЕЙДИНГ|Market Making basics
132|НИВО 6 — ПРОФЕСИОНАЛЕН ТРЕЙДИНГ|High Frequency Trading overview
133|НИВО 6 — ПРОФЕСИОНАЛЕН ТРЕЙДИНГ|Futures trading
134|НИВО 6 — ПРОФЕСИОНАЛЕН ТРЕЙДИНГ|Options trading
135|НИВО 6 — ПРОФЕСИОНАЛЕН ТРЕЙДИНГ|Greeks in options
136|НИВО 6 — ПРОФЕСИОНАЛЕН ТРЕЙДИНГ|Hedging strategies
137|НИВО 6 — ПРОФЕСИОНАЛЕН ТРЕЙДИНГ|Leverage and margin
138|НИВО 6 — ПРОФЕСИОНАЛЕН ТРЕЙДИНГ|Risk/reward framework
139|НИВО 6 — ПРОФЕСИОНАЛЕН ТРЕЙДИНГ|Stop loss engineering
140|НИВО 6 — ПРОФЕСИОНАЛЕН ТРЕЙДИНГ|Position sizing
141|НИВО 6 — ПРОФЕСИОНАЛЕН ТРЕЙДИНГ|Portfolio exposure
142|НИВО 6 — ПРОФЕСИОНАЛЕН ТРЕЙДИНГ|Drawdown management
143|НИВО 6 — ПРОФЕСИОНАЛЕН ТРЕЙДИНГ|Trading journal
144|НИВО 6 — ПРОФЕСИОНАЛЕН ТРЕЙДИНГ|Backtesting
145|НИВО 6 — ПРОФЕСИОНАЛЕН ТРЕЙДИНГ|Strategy optimization
146|НИВО 6 — ПРОФЕСИОНАЛЕН ТРЕЙДИНГ|Probability and expectancy
147|НИВО 6 — ПРОФЕСИОНАЛЕН ТРЕЙДИНГ|Professional trader psychology
148|НИВО 6 — ПРОФЕСИОНАЛЕН ТРЕЙДИНГ|Institutional execution
149|НИВО 6 — ПРОФЕСИОНАЛЕН ТРЕЙДИНГ|Market manipulation
150|НИВО 6 — ПРОФЕСИОНАЛЕН ТРЕЙДИНГ|Building a professional trading system
151|НИВО 7 — КРИПТОВАЛУТИ И BLOCKCHAIN|История на Bitcoin
152|НИВО 7 — КРИПТОВАЛУТИ И BLOCKCHAIN|Blockchain fundamentals
153|НИВО 7 — КРИПТОВАЛУТИ И BLOCKCHAIN|Mining
154|НИВО 7 — КРИПТОВАЛУТИ И BLOCKCHAIN|Wallets and custody
155|НИВО 7 — КРИПТОВАЛУТИ И BLOCKCHAIN|Ethereum ecosystem
156|НИВО 7 — КРИПТОВАЛУТИ И BLOCKCHAIN|Smart contracts
157|НИВО 7 — КРИПТОВАЛУТИ И BLOCKCHAIN|Layer 1 vs Layer 2
158|НИВО 7 — КРИПТОВАЛУТИ И BLOCKCHAIN|DeFi
159|НИВО 7 — КРИПТОВАЛУТИ И BLOCKCHAIN|Staking
160|НИВО 7 — КРИПТОВАЛУТИ И BLOCKCHAIN|Yield farming
161|НИВО 7 — КРИПТОВАЛУТИ И BLOCKCHAIN|Liquidity pools
162|НИВО 7 — КРИПТОВАЛУТИ И BLOCKCHAIN|Stablecoins
163|НИВО 7 — КРИПТОВАЛУТИ И BLOCKCHAIN|Tokenomics
164|НИВО 7 — КРИПТОВАЛУТИ И BLOCKCHAIN|Token unlocks
165|НИВО 7 — КРИПТОВАЛУТИ И BLOCKCHAIN|On-chain analysis
166|НИВО 7 — КРИПТОВАЛУТИ И BLOCKCHAIN|Crypto cycles
167|НИВО 7 — КРИПТОВАЛУТИ И BLOCKCHAIN|Bitcoin halving
168|НИВО 7 — КРИПТОВАЛУТИ И BLOCKCHAIN|Altcoin rotations
169|НИВО 7 — КРИПТОВАЛУТИ И BLOCKCHAIN|NFT ecosystem
170|НИВО 7 — КРИПТОВАЛУТИ И BLOCKCHAIN|AI crypto sector
171|НИВО 7 — КРИПТОВАЛУТИ И BLOCKCHAIN|Meme coin psychology
172|НИВО 7 — КРИПТОВАЛУТИ И BLOCKCHAIN|Crypto regulations
173|НИВО 7 — КРИПТОВАЛУТИ И BLOCKCHAIN|Exchange risks
174|НИВО 7 — КРИПТОВАЛУТИ И BLOCKCHAIN|Rug pulls and scams
175|НИВО 7 — КРИПТОВАЛУТИ И BLOCKCHAIN|Institutional crypto adoption
176|НИВО 7 — КРИПТОВАЛУТИ И BLOCKCHAIN|Crypto portfolio management
177|НИВО 7 — КРИПТОВАЛУТИ И BLOCKCHAIN|Advanced crypto research
178|НИВО 7 — КРИПТОВАЛУТИ И BLOCKCHAIN|Professional crypto investing framework
179|НИВО 8 — ПСИХОЛОГИЯ И ПОВЕДЕНЧЕСКИ ФИНАНСИ|Fear and greed
180|НИВО 8 — ПСИХОЛОГИЯ И ПОВЕДЕНЧЕСКИ ФИНАНСИ|FOMO
181|НИВО 8 — ПСИХОЛОГИЯ И ПОВЕДЕНЧЕСКИ ФИНАНСИ|Panic selling
182|НИВО 8 — ПСИХОЛОГИЯ И ПОВЕДЕНЧЕСКИ ФИНАНСИ|Overtrading
183|НИВО 8 — ПСИХОЛОГИЯ И ПОВЕДЕНЧЕСКИ ФИНАНСИ|Revenge trading
184|НИВО 8 — ПСИХОЛОГИЯ И ПОВЕДЕНЧЕСКИ ФИНАНСИ|Confirmation bias
185|НИВО 8 — ПСИХОЛОГИЯ И ПОВЕДЕНЧЕСКИ ФИНАНСИ|Survivorship bias
186|НИВО 8 — ПСИХОЛОГИЯ И ПОВЕДЕНЧЕСКИ ФИНАНСИ|Anchoring bias
187|НИВО 8 — ПСИХОЛОГИЯ И ПОВЕДЕНЧЕСКИ ФИНАНСИ|Emotional discipline
188|НИВО 8 — ПСИХОЛОГИЯ И ПОВЕДЕНЧЕСКИ ФИНАНСИ|Patience and conviction
189|НИВО 8 — ПСИХОЛОГИЯ И ПОВЕДЕНЧЕСКИ ФИНАНСИ|Handling volatility
190|НИВО 8 — ПСИХОЛОГИЯ И ПОВЕДЕНЧЕСКИ ФИНАНСИ|Long-term mindset
191|НИВО 8 — ПСИХОЛОГИЯ И ПОВЕДЕНЧЕСКИ ФИНАНСИ|Institutional emotional control
192|НИВО 8 — ПСИХОЛОГИЯ И ПОВЕДЕНЧЕСКИ ФИНАНСИ|Decision making under pressure
193|НИВО 8 — ПСИХОЛОГИЯ И ПОВЕДЕНЧЕСКИ ФИНАНСИ|Professional investor mindset
194|НИВО 9 — ПОРТФЕЙЛЕН МЕНИДЖМЪНТ|Portfolio construction
195|НИВО 9 — ПОРТФЕЙЛЕН МЕНИДЖМЪНТ|Diversification
196|НИВО 9 — ПОРТФЕЙЛЕН МЕНИДЖМЪНТ|Correlation
197|НИВО 9 — ПОРТФЕЙЛЕН МЕНИДЖМЪНТ|Asset allocation
198|НИВО 9 — ПОРТФЕЙЛЕН МЕНИДЖМЪНТ|Rebalancing
199|НИВО 9 — ПОРТФЕЙЛЕН МЕНИДЖМЪНТ|Cash management
200|НИВО 9 — ПОРТФЕЙЛЕН МЕНИДЖМЪНТ|Defensive positioning
201|НИВО 9 — ПОРТФЕЙЛЕН МЕНИДЖМЪНТ|Aggressive growth allocation
202|НИВО 9 — ПОРТФЕЙЛЕН МЕНИДЖМЪНТ|Risk parity
203|НИВО 9 — ПОРТФЕЙЛЕН МЕНИДЖМЪНТ|Hedging portfolio risk
204|НИВО 9 — ПОРТФЕЙЛЕН МЕНИДЖМЪНТ|Crisis management
205|НИВО 9 — ПОРТФЕЙЛЕН МЕНИДЖМЪНТ|Black Swan events
206|НИВО 9 — ПОРТФЕЙЛЕН МЕНИДЖМЪНТ|Portfolio stress testing
207|НИВО 9 — ПОРТФЕЙЛЕН МЕНИДЖМЪНТ|Institutional portfolio management
208|НИВО 9 — ПОРТФЕЙЛЕН МЕНИДЖМЪНТ|Building long-term wealth systems
209|НИВО 10 — ПРОФЕСИОНАЛНО НИВО / ИНСТИТУЦИОНАЛНО МИСЛЕНЕ|How hedge funds operate
210|НИВО 10 — ПРОФЕСИОНАЛНО НИВО / ИНСТИТУЦИОНАЛНО МИСЛЕНЕ|Institutional capital flows
211|НИВО 10 — ПРОФЕСИОНАЛНО НИВО / ИНСТИТУЦИОНАЛНО МИСЛЕНЕ|Prime brokers
212|НИВО 10 — ПРОФЕСИОНАЛНО НИВО / ИНСТИТУЦИОНАЛНО МИСЛЕНЕ|Dark pools
213|НИВО 10 — ПРОФЕСИОНАЛНО НИВО / ИНСТИТУЦИОНАЛНО МИСЛЕНЕ|Liquidity engineering
214|НИВО 10 — ПРОФЕСИОНАЛНО НИВО / ИНСТИТУЦИОНАЛНО МИСЛЕНЕ|Quantitative investing
215|НИВО 10 — ПРОФЕСИОНАЛНО НИВО / ИНСТИТУЦИОНАЛНО МИСЛЕНЕ|Algorithmic trading
216|НИВО 10 — ПРОФЕСИОНАЛНО НИВО / ИНСТИТУЦИОНАЛНО МИСЛЕНЕ|AI in investing
217|НИВО 10 — ПРОФЕСИОНАЛНО НИВО / ИНСТИТУЦИОНАЛНО МИСЛЕНЕ|Macro hedge funds
218|НИВО 10 — ПРОФЕСИОНАЛНО НИВО / ИНСТИТУЦИОНАЛНО МИСЛЕНЕ|Global capital cycles
219|НИВО 10 — ПРОФЕСИОНАЛНО НИВО / ИНСТИТУЦИОНАЛНО МИСЛЕНЕ|Sovereign wealth funds
220|НИВО 10 — ПРОФЕСИОНАЛНО НИВО / ИНСТИТУЦИОНАЛНО МИСЛЕНЕ|Private equity
221|НИВО 10 — ПРОФЕСИОНАЛНО НИВО / ИНСТИТУЦИОНАЛНО МИСЛЕНЕ|Venture capital
222|НИВО 10 — ПРОФЕСИОНАЛНО НИВО / ИНСТИТУЦИОНАЛНО МИСЛЕНЕ|IPO investing
223|НИВО 10 — ПРОФЕСИОНАЛНО НИВО / ИНСТИТУЦИОНАЛНО МИСЛЕНЕ|Distressed investing
224|НИВО 10 — ПРОФЕСИОНАЛНО НИВО / ИНСТИТУЦИОНАЛНО МИСЛЕНЕ|Crisis investing
225|НИВО 10 — ПРОФЕСИОНАЛНО НИВО / ИНСТИТУЦИОНАЛНО МИСЛЕНЕ|Professional research systems
226|НИВО 10 — ПРОФЕСИОНАЛНО НИВО / ИНСТИТУЦИОНАЛНО МИСЛЕНЕ|Building institutional-grade frameworks
227|НИВО 10 — ПРОФЕСИОНАЛНО НИВО / ИНСТИТУЦИОНАЛНО МИСЛЕНЕ|Multi-asset investing
228|НИВО 10 — ПРОФЕСИОНАЛНО НИВО / ИНСТИТУЦИОНАЛНО МИСЛЕНЕ|Becoming a professional investor`;

const LEVEL_DESCRIPTIONS: Record<string, string> = {
  "НИВО 1 — ФИНАНСОВА ОСНОВА И МИСЛЕНЕ НА ИНВЕСТИТОР": "Пари, инфлация, банки, риск, активи, финансова дисциплина и първи принципи.",
  "НИВО 2 — ФОНДОВ ПАЗАР И АКЦИИ": "Акции, борси, IPO, капитализация, дивиденти, buybacks, moats и институционална собственост.",
  "НИВО 3 — ФУНДАМЕНТАЛЕН АНАЛИЗ": "Финансови отчети, приходи, EPS, маржове, ROIC, DCF, intrinsic value и инвестиционна теза.",
  "НИВО 4 — МАКРОИКОНОМИКА ЗА ИНВЕСТИТОРИ": "GDP, CPI, лихви, облигации, ликвидност, долар, суровини, кризи и макро рамка.",
  "НИВО 5 — ТЕХНИЧЕСКИ АНАЛИЗ": "Свещи, тренд, volume, RSI, MACD, VWAP, ATR, Wyckoff, Elliott и професионален workflow.",
  "НИВО 6 — ПРОФЕСИОНАЛЕН ТРЕЙДИНГ": "Day trading, swing trading, options, futures, leverage, stop loss, position sizing и execution.",
  "НИВО 7 — КРИПТОВАЛУТИ И BLOCKCHAIN": "Bitcoin, Ethereum, DeFi, staking, tokenomics, unlocks, on-chain, scams и crypto cycles.",
  "НИВО 8 — ПСИХОЛОГИЯ И ПОВЕДЕНЧЕСКИ ФИНАНСИ": "Fear, greed, FOMO, bias, discipline, patience, volatility и decision making.",
  "НИВО 9 — ПОРТФЕЙЛЕН МЕНИДЖМЪНТ": "Portfolio construction, diversification, correlation, allocation, rebalancing, hedging и stress testing.",
  "НИВО 10 — ПРОФЕСИОНАЛНО НИВО / ИНСТИТУЦИОНАЛНО МИСЛЕНЕ": "Hedge funds, dark pools, quant, AI, private equity, capital flows и institutional-grade frameworks.",
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

function contains(text: string, words: string[]) {
  const t = text.toLowerCase();
  return words.some((w) => t.includes(w.toLowerCase()));
}

function formulaFor(title: string) {
  if (contains(title, ["Инфлация", "CPI"])) return {
    formula: "Inflation Rate = (Current CPI - Previous CPI) / Previous CPI × 100",
    example: "Ако CPI миналата година е 250, а тази година е 270, инфлацията е (270 - 250) / 250 × 100 = 8%. Ако депозитът ти носи 2%, реалната доходност е приблизително 2% - 8% = -6%."
  };
  if (contains(title, ["Сложна лихва"])) return {
    formula: "Future Value = Present Value × (1 + r)^n",
    example: "Ако инвестираш $10,000 при 8% годишно за 20 години: FV = 10,000 × (1.08)^20 = $46,610. Това показва защо времето е най-силният съюзник на инвеститора."
  };
  if (contains(title, ["Market Cap", "Enterprise Value"])) return {
    formula: "Market Cap = Share Price × Shares Outstanding\nEnterprise Value = Market Cap + Total Debt - Cash",
    example: "Цена $120 и 1 млрд. акции дават Market Cap $120 млрд. Ако дългът е $20 млрд., а кешът $10 млрд., EV = 120 + 20 - 10 = $130 млрд."
  };
  if (contains(title, ["Revenue"])) return {
    formula: "Revenue = Price × Units Sold\nRevenue Growth = (Current Revenue - Previous Revenue) / Previous Revenue × 100",
    example: "1 млн. продукта по $50 = $50 млн. приходи. След година 1.2 млн. продукта по $55 = $66 млн. Растежът е 32%."
  };
  if (contains(title, ["EPS"])) return {
    formula: "EPS = Net Income / Shares Outstanding",
    example: "Нетна печалба $10 млрд. и 5 млрд. акции дават EPS $2. Ако EPS стане $2.50, растежът е 25%."
  };
  if (contains(title, ["P/E"])) return {
    formula: "P/E = Share Price / EPS\nImplied Price = EPS × P/E",
    example: "EPS $7 и P/E 28 дават цена $196. Ако EPS стане $8, но P/E падне до 22, цената е $176. Затова растежът и valuation multiple са еднакво важни."
  };
  if (contains(title, ["PEG"])) return {
    formula: "PEG = P/E / EPS Growth Rate",
    example: "P/E 30 и EPS растеж 20% дават PEG 1.5. P/E 20 и растеж 5% дават PEG 4.0. По-ниският P/E не винаги е по-добър."
  };
  if (contains(title, ["P/S"])) return {
    formula: "P/S = Market Cap / Revenue",
    example: "Market Cap $100 млрд. и приходи $25 млрд. дават P/S 4. Показателят е полезен за растежни компании без стабилна печалба."
  };
  if (contains(title, ["EBITDA"])) return {
    formula: "EBITDA = Operating Income + Depreciation + Amortization\nEV/EBITDA = Enterprise Value / EBITDA",
    example: "Operating Income $8 млрд., D&A $1.5 млрд. => EBITDA $9.5 млрд. EV $95 млрд. => EV/EBITDA 10."
  };
  if (contains(title, ["Free Cash Flow", "FCF"])) return {
    formula: "FCF = Operating Cash Flow - Capital Expenditures\nFCF Yield = FCF / Market Cap × 100",
    example: "Operating Cash Flow $15 млрд. и CapEx $5 млрд. дават FCF $10 млрд. При Market Cap $200 млрд. FCF Yield = 5%."
  };
  if (contains(title, ["Gross Margin"])) return {
    formula: "Gross Margin = (Revenue - COGS) / Revenue × 100",
    example: "Приходи $100 млн. и COGS $40 млн. дават gross margin 60%. Високият марж често означава силен продукт или brand power."
  };
  if (contains(title, ["Operating Margin"])) return {
    formula: "Operating Margin = Operating Income / Revenue × 100",
    example: "Operating Income $25 млн. и приходи $100 млн. дават operating margin 25%. Ако маржът расте, бизнесът мащабира по-ефективно."
  };
  if (contains(title, ["Net Margin"])) return {
    formula: "Net Margin = Net Income / Revenue × 100",
    example: "Net Income $18 млн. и приходи $100 млн. дават net margin 18%. Ако приходите растат, но net margin пада, разходите може да изяждат растежа."
  };
  if (contains(title, ["ROE"])) return {
    formula: "ROE = Net Income / Shareholders' Equity × 100",
    example: "Net Income $10 млрд. и Equity $50 млрд. дават ROE 20%. Проверявай и дълга, защото leverage може да изкриви ROE."
  };
  if (contains(title, ["ROIC"])) return {
    formula: "ROIC = NOPAT / Invested Capital × 100",
    example: "NOPAT $8 млрд. и invested capital $40 млрд. дават ROIC 20%. Устойчив висок ROIC е знак за качествен бизнес."
  };
  if (contains(title, ["ROA"])) return {
    formula: "ROA = Net Income / Total Assets × 100",
    example: "Net Income $10 млрд. и Assets $100 млрд. дават ROA 10%. Показва ефективност на активите."
  };
  if (contains(title, ["Debt", "Interest Coverage", "Liquidity ratios", "Дълг"])) return {
    formula: "Net Debt = Total Debt - Cash\nInterest Coverage = EBIT / Interest Expense",
    example: "Дълг $30 млрд. и кеш $12 млрд. => Net Debt $18 млрд. EBIT $10 млрд. и лихви $1 млрд. => Interest Coverage 10."
  };
  if (contains(title, ["RSI"])) return {
    formula: "RSI = 100 - [100 / (1 + RS)]\nRS = Average Gain / Average Loss",
    example: "RSI над 70 показва силен импулс или прегряване, а под 30 — силна разпродажба. Не се купува или продава само по RSI."
  };
  if (contains(title, ["MACD"])) return {
    formula: "MACD Line = 12 EMA - 26 EMA\nSignal Line = 9 EMA of MACD\nHistogram = MACD Line - Signal Line",
    example: "MACD cross нагоре показва подобряващ се momentum, но в sideways market дава много фалшиви сигнали."
  };
  if (contains(title, ["Moving averages"])) return {
    formula: "SMA = Sum of Closing Prices / Number of Periods",
    example: "Затваряния 100, 102, 101, 105, 107 дават 5-дневна SMA = 103. Цена над 200-дневната средна често показва дългосрочна сила."
  };
  if (contains(title, ["ATR"])) return {
    formula: "True Range = max(High-Low, |High-Previous Close|, |Low-Previous Close|)\nATR = Average True Range",
    example: "Ако ATR е $5, stop от $1 е твърде тесен и може да бъде ударен от нормален шум."
  };
  if (contains(title, ["VWAP"])) return {
    formula: "VWAP = Sum(Price × Volume) / Sum(Volume)",
    example: "Институция, която купува под VWAP, получава по-добра средна цена от среднопретеглената цена за деня."
  };
  if (contains(title, ["Position sizing", "Risk/reward"])) return {
    formula: "Position Size = Amount Risked / Stop Loss Distance\nExpected Value = (Win Rate × Average Win) - (Loss Rate × Average Loss)",
    example: "Портфейл $100,000, риск 1% = $1,000. Stop 5% => позиция $20,000."
  };
  if (contains(title, ["Crypto", "Bitcoin", "Ethereum", "Token", "DeFi", "Staking", "Blockchain"])) return {
    formula: "Crypto Market Cap = Token Price × Circulating Supply\nFDV = Token Price × Max Supply",
    example: "Токен $2 и 500 млн. circulating supply => Market Cap $1 млрд. Ако max supply е 2 млрд., FDV = $4 млрд. Unlocks могат да натиснат цената."
  };
  return {
    formula: "Professional Framework = Concept + Numbers + Context + Risk Management",
    example: "Професионалистът не взема решение от една цифра. Той комбинира качество, цена, риск, ликвидност, макро среда и поведение на пазара."
  };
}

function visualType(title: string) {
  if (contains(title, ["Инфлация", "CPI", "Deflation"])) return "inflation";
  if (contains(title, ["RSI"])) return "rsi";
  if (contains(title, ["MACD"])) return "macd";
  if (contains(title, ["Moving averages"])) return "moving";
  if (contains(title, ["Support", "Resistance", "Breakout"])) return "support";
  if (contains(title, ["Volume"])) return "volume";
  if (contains(title, ["Candlestick"])) return "candles";
  if (contains(title, ["Bitcoin", "Ethereum", "Crypto", "Token", "DeFi", "Blockchain"])) return "crypto";
  return "valuation";
}

function buildLesson(lesson: Lesson) {
  const f = formulaFor(lesson.title);
  const title = lesson.title;
  return [
    {
      heading: "Въведение и значение",
      body: `Тази лекция разглежда темата „${title.replace(/Урок \d+ — /, "")}“ като част от професионалната инвестиционна академия. Целта не е да запомниш термин, а да разбереш как този елемент влияе върху реални инвестиционни решения. За начинаещия инвеститор това е важно, защото пазарите не прощават повърхностно мислене. Цената се движи от очаквания, капиталови потоци, риск, ликвидност, лихви, печалби и човешка психология.`
    },
    {
      heading: "Основна концепция",
      body: `В практиката тази тема се използва, за да оценим дали даден актив е качествен, дали цената му е разумна и какъв риск поемаме. Ако анализираш акция, мисли за реален бизнес с приходи, разходи, конкуренти, мениджмънт, дълг и бъдещи очаквания. Ако анализираш криптовалута, мисли за мрежа, ликвидност, tokenomics, сигурност, adoption и регулаторен риск. Ако анализираш графика, мисли за поведение на купувачи и продавачи, не за магическа линия.`
    },
    {
      heading: "Формула, изчисление или работещ модел",
      body: `${f.formula}\n\n${f.example}\n\nФормулата не е само математика. Тя е начин да превърнеш впечатленията в проверими числа. Когато можеш да измериш нещо, можеш да го сравниш с миналото, с конкурентите, със сектора и с очакванията на пазара.`
    },
    {
      heading: "Реален пазарен пример",
      body: `Представи си две компании. Компания A расте с 25% годишно, но няма свободен паричен поток и постоянно издава нови акции. Компания B расте с 10%, но има високи маржове, нисък дълг, стабилен Free Cash Flow и силен brand. Начинаещият често избира Компания A само заради растежа. Професионалният инвеститор сравнява качеството на растежа, цената, риска и устойчивостта. При крипто примерът е подобен: силна цена без ликвидност, utility и контрол върху supply може да бъде просто краткосрочен hype.`
    },
    {
      heading: "Как институциите го използват",
      body: `Институциите използват тази тема в повторяем процес. Те не купуват, защото някой е казал, че активът е добър. Те изграждат теза, сравняват данни, правят сценарии, изчисляват downside, следят ликвидността и определят размер на позицията. Големите фондове мислят в портфейли, не в единични залози. Дори когато харесват дадена идея, те питат: колко можем да загубим, какво вече е включено в цената и какво би променило тезата?`
    },
    {
      heading: "Чести грешки на начинаещите",
      body: `1. Гледат само една цифра или един индикатор.\n2. Купуват след силно движение от страх да не изпуснат възможност.\n3. Не проверяват дълг, маржове, cash flow, ликвидност или цикъл.\n4. Бъркат добра компания с добра инвестиция — цената също има значение.\n5. Нямат предварителен план за риск, stop, размер на позицията или времеви хоризонт.`
    },
    {
      heading: "Практическа рамка",
      body: `Преди да вземеш решение, премини през този процес:\n\n1. Определи дали анализираш бизнес, графика, макро среда или крипто проект.\n2. Събери поне 5 конкретни числа или факта.\n3. Сравни ги с предходни години и с конкуренти.\n4. Определи основния риск.\n5. Определи какво би доказало, че грешиш.\n6. Изчисли разумен размер на позицията.\n7. Не инвестирай само защото цената се движи бързо.`
    },
    {
      heading: "Ключови takeaways",
      body: `• Пазарната цена не винаги е равна на реалната стойност.\n• Контекстът е толкова важен, колкото и формулата.\n• Един показател никога не е достатъчен.\n• Институциите мислят чрез сценарии и управление на риска.\n• Най-важното умение е да оцелееш достатъчно дълго, за да се възползваш от добрите идеи.`
    },
    {
      heading: "Домашно упражнение и контролни въпроси",
      body: `Домашно: избери една акция или криптовалута и приложи темата на урока върху нея. Запиши числата, риска, тезата и причината да НЕ инвестираш.\n\nКонтролни въпроси:\n1. Как би обяснил темата на напълно начинаещ?\n2. Кои числа трябва да провериш?\n3. Какво може да се обърка?\n4. Как институция би анализирала същия актив?\n5. Какъв е твоят план, ако тезата се окаже грешна?`
    },
  ];
}

function PracticalVisual({ type }: { type: string }) {
  return (
    <div style={styles.visualCard}>
      <div style={styles.visualLabel}>Практически визуален пример</div>
      <svg viewBox="0 0 760 280" width="100%" height="280" role="img">
        <rect x="0" y="0" width="760" height="280" rx="18" fill="rgba(8,20,40,0.96)" />
        {[45,90,135,180,225].map((y) => <line key={y} x1="45" y1={y} x2="720" y2={y} stroke="rgba(255,255,255,0.08)" />)}
        {type === "inflation" ? (
          <>
            {[["Year 1",120,170,60,"$100"],["Year 2",270,135,95,"$110"],["Year 3",420,95,135,"$125"],["Year 4",570,65,165,"$140"]].map(([label,x,y,h,price]) => (
              <g key={String(label)}><rect x={Number(x)} y={Number(y)} width="90" height={Number(h)} rx="10" fill="#3b82f6" opacity="0.72" /><text x={Number(x)+45} y={Number(y)-10} textAnchor="middle" fill="white" fontSize="15" fontWeight="800">{price}</text><text x={Number(x)+45} y="255" textAnchor="middle" fill="#dbeafe" fontSize="14">{label}</text></g>
            ))}
          </>
        ) : type === "rsi" ? (
          <>
            <rect x="70" y="50" width="620" height="52" fill="rgba(239,68,68,0.22)" /><rect x="70" y="102" width="620" height="105" fill="rgba(148,163,184,0.10)" /><rect x="70" y="207" width="620" height="42" fill="rgba(34,197,94,0.18)" />
            <text x="85" y="82" fill="#fecaca" fontSize="15" fontWeight="800">RSI над 70: силен импулс / риск от прегряване</text><text x="85" y="155" fill="#dbeafe" fontSize="15" fontWeight="800">RSI 30–70: нормална зона</text><text x="85" y="235" fill="#86efac" fontSize="15" fontWeight="800">RSI под 30: oversold зона</text>
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
  const content = useMemo(() => buildLesson(selectedLesson), [selectedLesson]);

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
            <h1 style={styles.sidebarTitle}>Пълна инвестиционна академия</h1>
            <p style={styles.sidebarSubtitle}>Структура от абсолютен начинаещ до професионален инвеститор и трейдър.</p>

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
                        <p style={styles.levelSubtitle}>{LEVEL_DESCRIPTIONS[level] || "Професионална секция от академията."}</p>
                        {grouped[level].map((lesson) => (
                          <button key={lesson.id} style={{...styles.lessonButton, ...(selectedLesson.id === lesson.id ? styles.lessonButtonActive : {})}} onClick={() => setSelectedLesson(lesson)}>
                            {lesson.title}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}

              <div style={styles.levelBlock}>
                <button style={styles.levelButton}><span>ФИНАЛНО ДИПЛОМИРАНЕ</span><span>✓</span></button>
                <div style={styles.lessonsWrap}>
                  {["Анализ на публична компания","Изграждане на инвестиционен портфейл","Макро анализ на пазарите","Технически анализ на реална графика","Управление на риск при криза","Crypto research report","Собствена trading стратегия","Institutional investment thesis","Пълен професионален инвестиционен план"].map((exam, index) => <div key={exam} style={styles.examItem}>Финален изпит {index + 1} — {exam}</div>)}
                </div>
              </div>
            </div>
          </aside>

          <section style={styles.contentCard}>
            <div style={styles.lessonMeta}>{selectedLesson.level}</div>
            <h1 style={styles.lessonTitle}>{selectedLesson.title}</h1>
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
