// app/education/page.tsx
'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, PlayCircle, BookOpen, Trophy, Target } from 'lucide-react';

interface Lesson {
  id: number;
  title: string;
  level: number;
  description?: string;
}

interface Level {
  id: number;
  title: string;
  lessons: Lesson[];
}

// ==================== ПЪЛНА ПРОГРАМА НА АНГЛИЙСКИ ====================
const levels: Level[] = [
  {
    id: 1,
    title: "LEVEL 1 — FINANCIAL FOUNDATION & INVESTOR MINDSET",
    lessons: [
      { id: 1, title: "Lesson 1 — What Money Really Is" },
      { id: 2, title: "Lesson 2 — History of Money and Financial Systems" },
      { id: 3, title: "Lesson 3 — Inflation and Purchasing Power" },
      { id: 4, title: "Lesson 4 — Compound Interest and Wealth Building" },
      { id: 5, title: "Lesson 5 — Assets vs Liabilities" },
      { id: 6, title: "Lesson 6 — How the Banking System Works" },
      { id: 7, title: "Lesson 7 — Central Banks and Money Printing" },
      { id: 8, title: "Lesson 8 — Debt, Credit and Interest Rates" },
      { id: 9, title: "Lesson 9 — Financial Discipline and Capital Building" },
      { id: 10, title: "Lesson 10 — Psychology of Wealth" },
      { id: 11, title: "Lesson 11 — How Rich Investors Think" },
      { id: 12, title: "Lesson 12 — Common Financial Mistakes of Beginners" },
      { id: 13, title: "Lesson 13 — What Is Investing" },
      { id: 14, title: "Lesson 14 — Investing vs Speculation" },
      { id: 15, title: "Lesson 15 — Types of Assets and Asset Classes" },
      { id: 16, title: "Lesson 16 — Risk and Return" },
      { id: 17, title: "Lesson 17 — Time Horizons in Investing" },
      { id: 18, title: "Lesson 18 — How Financial Markets Work" },
      { id: 19, title: "Lesson 19 — Institutions in Global Markets" },
      { id: 20, title: "Lesson 20 — What Hedge Funds and Market Makers Do" },
    ]
  },
  {
    id: 2,
    title: "LEVEL 2 — STOCK MARKET & EQUITIES",
    lessons: [
      { id: 21, title: "Lesson 21 — What Is a Stock" },
      { id: 22, title: "Lesson 22 — IPOs and Company Listings" },
      { id: 23, title: "Lesson 23 — How Stock Exchanges Work" },
      { id: 24, title: "Lesson 24 — NYSE, NASDAQ and Global Exchanges" },
      { id: 25, title: "Lesson 25 — Market Cap and Enterprise Value" },
      { id: 26, title: "Lesson 26 — Growth vs Value Investing" },
      { id: 27, title: "Lesson 27 — Dividend Investing" },
      { id: 28, title: "Lesson 28 — Share Buybacks and Dilution" },
      { id: 29, title: "Lesson 29 — Company Business Cycles" },
      { id: 30, title: "Lesson 30 — Sector Rotation" },
      { id: 31, title: "Lesson 31 — Mega Caps vs Small Caps" },
      { id: 32, title: "Lesson 32 — Defensive vs Cyclical Stocks" },
      { id: 33, title: "Lesson 33 — High Growth Investing" },
      { id: 34, title: "Lesson 34 — Compounders and Quality Businesses" },
      { id: 35, title: "Lesson 35 — Economic Moats" },
      { id: 36, title: "Lesson 36 — Pricing Power" },
      { id: 37, title: "Lesson 37 — Network Effects" },
      { id: 38, title: "Lesson 38 — Competitive Advantages" },
      { id: 39, title: "Lesson 39 — Institutional Ownership" },
      { id: 40, title: "Lesson 40 — Insider Buying and Selling" },
    ]
  },
  {
    id: 3,
    title: "LEVEL 3 — FUNDAMENTAL ANALYSIS",
    lessons: [
      { id: 41, title: "Lesson 41 — How to Read Financial Statements" },
      { id: 42, title: "Lesson 42 — Income Statement" },
      { id: 43, title: "Lesson 43 — Balance Sheet" },
      { id: 44, title: "Lesson 44 — Cash Flow Statement" },
      { id: 45, title: "Lesson 45 — Revenue Analysis" },
      { id: 46, title: "Lesson 46 — EPS Analysis" },
      { id: 47, title: "Lesson 47 — Gross Margin" },
      { id: 48, title: "Lesson 48 — Operating Margin" },
      { id: 49, title: "Lesson 49 — Net Margin" },
      { id: 50, title: "Lesson 50 — EBITDA" },
      { id: 51, title: "Lesson 51 — Free Cash Flow (FCF)" },
      { id: 52, title: "Lesson 52 — FCF Yield" },
      { id: 53, title: "Lesson 53 — ROE, ROIC & ROA" },
      { id: 54, title: "Lesson 54 — Debt Analysis" },
      { id: 55, title: "Lesson 55 — Interest Coverage Ratio" },
      { id: 56, title: "Lesson 56 — Liquidity Ratios" },
      { id: 57, title: "Lesson 57 — P/E Ratio" },
      { id: 58, title: "Lesson 58 — PEG Ratio" },
      { id: 59, title: "Lesson 59 — P/S & EV/EBITDA" },
      { id: 60, title: "Lesson 60 — DCF Valuation" },
      { id: 61, title: "Lesson 61 — Intrinsic Value & Margin of Safety" },
      { id: 62, title: "Lesson 62 — Earnings Manipulation & Red Flags" },
      { id: 63, title: "Lesson 63 — Building an Investment Thesis" },
    ]
  },
  {
    id: 4,
    title: "LEVEL 4 — MACROECONOMICS FOR INVESTORS",
    lessons: [
      { id: 71, title: "Lesson 71 — What Is Macroeconomics" },
      { id: 72, title: "Lesson 72 — GDP and Economic Growth" },
      { id: 73, title: "Lesson 73 — CPI, Inflation and Deflation" },
      { id: 74, title: "Lesson 74 — Federal Reserve & Central Banks" },
      { id: 75, title: "Lesson 75 — Interest Rates & Yield Curve" },
      { id: 76, title: "Lesson 76 — Quantitative Easing & Liquidity" },
      { id: 77, title: "Lesson 77 — Recessions and Credit Crises" },
      { id: 78, title: "Lesson 78 — Oil, Commodities & Geopolitics" },
      { id: 79, title: "Lesson 79 — Macro Investing Framework" },
    ]
  },
  {
    id: 5,
    title: "LEVEL 5 — TECHNICAL ANALYSIS",
    lessons: [
      { id: 93, title: "Lesson 93 — Basics of Technical Analysis" },
      { id: 94, title: "Lesson 94 — Candlestick Patterns" },
      { id: 95, title: "Lesson 95 — Support & Resistance" },
      { id: 96, title: "Lesson 96 — Trend Analysis & Market Structure" },
      { id: 97, title: "Lesson 97 — Moving Averages" },
      { id: 98, title: "Lesson 98 — RSI, MACD & Bollinger Bands" },
      { id: 99, title: "Lesson 99 — Volume & VWAP" },
      { id: 100, title: "Lesson 100 — Advanced Chart Patterns & SMC" },
    ]
  },
  {
    id: 6,
    title: "LEVEL 6 — PROFESSIONAL TRADING",
    lessons: [
      { id: 121, title: "Lesson 121 — Day Trading, Swing & Position Trading" },
      { id: 122, title: "Lesson 122 — Risk Management & Position Sizing" },
      { id: 123, title: "Lesson 123 — Options Trading & The Greeks" },
      { id: 124, title: "Lesson 124 — Futures & Leverage" },
      { id: 125, title: "Lesson 125 — Building a Professional Trading System" },
    ]
  },
  {
    id: 7,
    title: "LEVEL 7 — CRYPTOCURRENCIES & BLOCKCHAIN",
    lessons: [
      { id: 151, title: "Lesson 151 — History of Bitcoin" },
      { id: 152, title: "Lesson 152 — Blockchain Fundamentals" },
      { id: 153, title: "Lesson 153 — Ethereum, Smart Contracts & DeFi" },
      { id: 154, title: "Lesson 154 — Staking, Yield Farming & Liquidity Pools" },
      { id: 155, title: "Lesson 155 — Crypto Cycles, Halving & Tokenomics" },
      { id: 156, title: "Lesson 156 — On-Chain Analysis & Professional Crypto Investing" },
    ]
  },
  {
    id: 8,
    title: "LEVEL 8 — PSYCHOLOGY & BEHAVIORAL FINANCE",
    lessons: [
      { id: 179, title: "Lesson 179 — Fear, Greed & FOMO" },
      { id: 180, title: "Lesson 180 — Emotional Discipline & Bias Control" },
      { id: 181, title: "Lesson 181 — Professional Investor Mindset" },
    ]
  },
  {
    id: 9,
    title: "LEVEL 9 — PORTFOLIO MANAGEMENT",
    lessons: [
      { id: 194, title: "Lesson 194 — Portfolio Construction & Diversification" },
      { id: 195, title: "Lesson 195 — Asset Allocation & Rebalancing" },
      { id: 196, title: "Lesson 196 — Risk Parity & Hedging" },
      { id: 197, title: "Lesson 197 — Crisis & Black Swan Management" },
    ]
  },
  {
    id: 10,
    title: "LEVEL 10 — INSTITUTIONAL & PROFESSIONAL LEVEL",
    lessons: [
      { id: 209, title: "Lesson 209 — How Hedge Funds & Sovereign Wealth Funds Operate" },
      { id: 210, title: "Lesson 210 — Quantitative & Algorithmic Investing" },
      { id: 211, title: "Lesson 211 — Private Equity, Venture Capital & Distressed Investing" },
      { id: 212, title: "Lesson 212 — Becoming a Professional Investor" },
    ]
  },
];

// Final Exams
const finalExams: Lesson[] = [
  { id: 301, title: "Final Exam 1 — Public Company Analysis", level: 11 },
  { id: 302, title: "Final Exam 2 — Building a Full Investment Portfolio", level: 11 },
  { id: 303, title: "Final Exam 3 — Macro Market Analysis", level: 11 },
  { id: 304, title: "Final Project — Complete Professional Investment Plan", level: 11 },
];

export default function EducationPage() {
  const [expandedLevels, setExpandedLevels] = useState<number[]>([1]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const toggleLevel = (levelId: number) => {
    setExpandedLevels(prev => 
      prev.includes(levelId) ? prev.filter(id => id !== levelId) : [...prev, levelId]
    );
  };

  const handleLessonClick = async (lesson: Lesson) => {
    setIsLoading(true);
    setSelectedLesson(lesson);
    await new Promise(r => setTimeout(r, 700));
    setIsLoading(false);
  };

  const renderLessonContent = (lesson: Lesson) => {
    const isFinal = lesson.level === 11;

    return (
      <div className="prose prose-invert max-w-none">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-5 py-1 rounded-full text-sm mb-4">
            {isFinal ? "FINAL EXAM" : `LEVEL ${lesson.level}`} • {lesson.title.split(' — ')[0]}
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">{lesson.title}</h1>
          <p className="text-xl text-gray-400">Dr. Alexander Ivanov • 20+ Years Experience</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-10 leading-relaxed">
          <p className="text-lg text-gray-300 mb-10">
            Hello! I&apos;m Dr. Alexander Ivanov. In this lesson we will explore <strong>{lesson.title}</strong> 
            in extreme depth with real-world examples, analogies, and practical insights.
          </p>

          {/* Dynamic Detailed Content */}
          <div className="space-y-12 text-gray-200">
            <section>
              <h2 className="text-2xl font-semibold mb-6 text-white">Introduction – Why This Matters</h2>
              <p className="text-lg">
                Understanding {lesson.title.toLowerCase()} is the difference between gambling and professional investing. 
                Today we will break it down step-by-step like a university lecture combined with Wikipedia-level detail.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-6 text-white">Core Concepts Explained</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-zinc-950 p-7 rounded-2xl border border-zinc-700">
                  <h3 className="text-blue-400 font-medium mb-3">Real-World Example</h3>
                  <p>Apple (AAPL) went from $1.5 trillion to over $3.5 trillion market cap between 2020–2024 thanks to strong fundamentals and network effects.</p>
                </div>
                <div className="bg-zinc-950 p-7 rounded-2xl border border-zinc-700">
                  <h3 className="text-emerald-400 font-medium mb-3">Crypto Parallel</h3>
                  <p>Bitcoin’s halving cycles and Ethereum’s transition to Proof-of-Stake show how protocol changes affect price.</p>
                </div>
              </div>
            </section>

            {lesson.id === 4 && (
              <section>
                <h2 className="text-2xl font-semibold mb-6 text-white">Compound Interest Formula</h2>
                <div className="bg-black p-6 rounded-2xl font-mono text-sm">
                  FV = PV × (1 + r/n)<sup>nt</sup><br/>
                  <span className="text-emerald-400">Example:</span> $10,000 at 10% for 30 years = <strong>$174,494</strong>
                </div>
              </section>
            )}

            {lesson.id === 57 && (
              <section>
                <h2 className="text-2xl font-semibold mb-6 text-white">Key Valuation Formulas</h2>
                <ul className="space-y-4 text-sm">
                  <li><strong>P/E Ratio</strong> = Price per Share ÷ EPS</li>
                  <li><strong>PEG Ratio</strong> = (P/E) ÷ Expected Growth Rate</li>
                  <li><strong>FCF Yield</strong> = Free Cash Flow ÷ Enterprise Value</li>
                </ul>
              </section>
            )}

            <section>
              <h2 className="text-2xl font-semibold mb-6 text-white">Key Takeaways</h2>
              <ul className="space-y-4 text-lg">
                <li className="flex gap-3">✅ You now understand the core principle behind this topic</li>
                <li className="flex gap-3">✅ You saw real examples from Apple, Tesla, Bitcoin</li>
                <li className="flex gap-3">✅ You know the most common beginner mistakes to avoid</li>
                <li className="flex gap-3">✅ You have practical tools to apply immediately</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex">
      {/* Sidebar */}
      <div className="w-96 border-r border-zinc-800 bg-zinc-950 overflow-y-auto">
        <div className="p-6 border-b border-zinc-800 sticky top-0 bg-zinc-950 z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Investment Academy</h1>
              <p className="text-sm text-gray-500">From Zero to Professional</p>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-6">
          {levels.map((level) => (
            <div key={level.id} className="mb-2">
              <button
                onClick={() => toggleLevel(level.id)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-zinc-900 rounded-2xl text-left transition-all"
              >
                <div className="flex items-center gap-4">
                  <span className="text-blue-500 font-mono font-bold">L{level.id}</span>
                  <span className="font-semibold">{level.title}</span>
                </div>
                {expandedLevels.includes(level.id) ? <ChevronDown /> : <ChevronRight />}
              </button>

              {expandedLevels.includes(level.id) && (
                <div className="ml-9 mt-2 space-y-1">
                  {level.lessons.map((lesson) => (
                    <button
                      key={lesson.id}
                      onClick={() => handleLessonClick(lesson)}
                      className={`w-full text-left px-5 py-3 rounded-xl flex items-center gap-3 hover:bg-zinc-900 text-sm transition-all ${
                        selectedLesson?.id === lesson.id ? 'bg-blue-950 text-blue-400' : 'text-gray-300'
                      }`}
                    >
                      <PlayCircle className="w-4 h-4" />
                      {lesson.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Final Exams */}
          <div className="pt-6 border-t border-zinc-800">
            <div className="px-5 py-3 text-xs uppercase tracking-widest text-emerald-400 font-medium mb-3">FINAL DIPLOMA</div>
            {finalExams.map((exam) => (
              <button
                key={exam.id}
                onClick={() => handleLessonClick(exam)}
                className="w-full text-left px-5 py-3 rounded-xl flex items-center gap-3 hover:bg-emerald-950 text-sm text-emerald-300"
              >
                <Target className="w-4 h-4" />
                {exam.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-10">
        {!selectedLesson ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Trophy className="w-28 h-28 text-blue-500 mb-8" />
            <h2 className="text-5xl font-bold mb-6">Welcome to Your Investment Journey</h2>
            <p className="text-xl text-gray-400 max-w-md">Select any lesson from the left menu to begin learning with Dr. Alexander Ivanov.</p>
          </div>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center h-[70vh]">
            <div className="animate-spin w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full mb-8" />
            <p className="text-blue-400 text-xl">Dr. Ivanov is preparing your detailed lesson...</p>
          </div>
        ) : (
          renderLessonContent(selectedLesson)
        )}
      </div>
    </div>
  );
}