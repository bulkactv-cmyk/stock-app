"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "../../lib/supabase/client";

type PlanType = "basic" | "pro" | "unlimited" | "loading" | "guest";

type LessonCategory = "core" | "macro" | "crypto" | "technical" | "video" | "library";

type VisualType =
  | "stock"
  | "valuation"
  | "inflation"
  | "crypto"
  | "supportResistance"
  | "movingAverage"
  | "rsi"
  | "macd"
  | "bollinger"
  | "volume"
  | "candles"
  | "risk";

type Lesson = {
  title: string;
  category: LessonCategory;
  visual?: VisualType;
  content: string;
};

const lessons: Lesson[] = [
  {
    title: "1. Stock Ownership and Shareholder Rights",
    category: "core",
    visual: "stock",
    content: `
A stock represents ownership in a company.

When you buy a stock, you are not just buying a price on a screen.
You are buying a small ownership share in a real business.

If the company grows, earns more money and becomes more valuable, your stock may also become more valuable.

What you get as a shareholder:

1. Ownership
You own a small part of the company.

2. Price appreciation
If the company becomes more valuable, the stock price may rise.

3. Dividends
Some companies share part of their profits with investors.

4. Voting rights
Some shares allow investors to vote on important company decisions.

Example:
Apple has millions of shareholders.
If you buy Apple shares, you own a small part of Apple.

Simple example:
Company value = $1,000,000
Total shares = 100,000

Value per share:
$1,000,000 / 100,000 = $10 per share

If the company grows to $2,000,000 and the number of shares stays the same:

New value per share:
$2,000,000 / 100,000 = $20 per share

Your investment doubled.

Professional lesson:
A stock is not only a trading instrument.
It is ownership in a business.
The better you understand the business, the better investor you become.
`,
  },
  {
    title: "2. Stock Price Drivers",
    category: "core",
    visual: "valuation",
    content: `
Stock prices move because investors constantly reprice the future value of a company.

The market looks forward.
It cares about what the company may earn in the future.

Main drivers of stock prices:

1. Earnings growth
If profit grows, the stock usually becomes more attractive.

2. Revenue growth
If sales grow, the business may become larger and more valuable.

3. Margins
Higher margins mean the company keeps more profit from each dollar of sales.

4. Interest rates
Higher rates usually pressure valuations.
Lower rates usually support valuations.

5. Market sentiment
Fear and greed can move prices even when fundamentals do not change.

6. Institutional money
Large funds, banks and pension funds can strongly move prices.

Basic valuation formula:
Stock Price = EPS × P/E Ratio

Example:
EPS = $5
P/E = 20

Stock Price = 5 × 20 = $100

If EPS grows to $6 and P/E stays 20:

Stock Price = 6 × 20 = $120

Price return:
(120 - 100) / 100 × 100 = 20%

Professional lesson:
A stock can rise because earnings improve, because valuation expands, or both.
The strongest moves happen when earnings grow and the market is willing to pay a higher multiple.
`,
  },
  {
    title: "3. Company Growth and Economic Impact",
    category: "core",
    content: `
Company growth affects the economy because businesses create jobs, pay taxes, produce goods and invest in innovation.

When a company grows:

1. It hires more employees
More jobs increase household income.

2. It pays more taxes
Governments collect more tax revenue.

3. It invests in technology
Productivity improves.

4. It expands supply chains
Suppliers also benefit.

5. It increases capital market value
Shareholders become wealthier.

Example:
Revenue last year = $10B
Revenue this year = $12B

Revenue Growth:
(12B - 10B) / 10B × 100 = 20%

If the company hires 5,000 new employees, buys more equipment and expands production, the wider economy benefits.

Professional lesson:
Strong companies are not isolated.
They influence employment, innovation, consumption, tax revenue and capital markets.
`,
  },
  {
    title: "4. Core Company Analysis Metrics",
    category: "core",
    content: `
Professional investors do not analyze a company using only one number.

They combine multiple categories:

1. Growth metrics
- Revenue Growth
- EPS Growth
- Free Cash Flow Growth

2. Profitability metrics
- Gross Margin
- Operating Margin
- Net Margin

3. Valuation metrics
- P/E
- P/S
- PEG
- EV/EBITDA
- FCF Yield

4. Balance sheet metrics
- Cash
- Debt
- Net Debt
- Debt to Equity
- Interest Coverage

5. Efficiency metrics
- ROE
- ROIC
- ROA

6. Shareholder return metrics
- Dividends
- Buybacks
- Dilution

Professional workflow:
First check whether the company is growing.
Then check whether the growth is profitable.
Then check whether the company has too much debt.
Then compare the valuation with the quality of the business.

Beginner mistake:
Looking only at P/E and thinking low P/E always means cheap.

Professional view:
Cheap can become cheaper if the business is weak.
Expensive can become more expensive if the company is exceptional.
`,
  },
  {
    title: "5. Revenue, EPS, P/E, P/S, PEG, EBITDA, FCF",
    category: "core",
    content: `
1. Revenue

Revenue is total company sales before expenses.

Formula:
Revenue = Price × Units Sold

Example:
A company sells 1,000,000 products at $50 each.

Revenue = 1,000,000 × 50 = $50,000,000

Revenue Growth:
Current Revenue = $60M
Previous Revenue = $50M

Revenue Growth = (60M - 50M) / 50M × 100 = 20%

Meaning:
Demand is increasing.


2. EPS - Earnings Per Share

EPS shows how much profit belongs to each share.

Formula:
EPS = Net Income / Shares Outstanding

Example:
Net Income = $10B
Shares Outstanding = 5B

EPS = 10B / 5B = $2.00

EPS Growth:
Old EPS = $2.00
New EPS = $2.50

EPS Growth = (2.50 - 2.00) / 2.00 × 100 = 25%


3. P/E Ratio

P/E shows how much investors pay for $1 of earnings.

Formula:
P/E = Stock Price / EPS

Example:
Stock Price = $100
EPS = $5

P/E = 100 / 5 = 20

Meaning:
Investors pay $20 for every $1 of earnings.

Professional interpretation:
Low P/E can mean cheap, but it can also mean weak growth.
High P/E can mean expensive, but it can also mean strong future growth.


4. P/S Ratio

P/S compares company value with revenue.

Formula:
P/S = Market Cap / Revenue

Example:
Market Cap = $100B
Revenue = $25B

P/S = 100B / 25B = 4

Meaning:
Investors pay $4 for every $1 of sales.

Useful for:
- growth companies
- unprofitable companies
- early-stage technology companies


5. PEG Ratio

PEG compares valuation with growth.

Formula:
PEG = P/E / EPS Growth Rate

Example:
P/E = 30
EPS Growth = 20%

PEG = 30 / 20 = 1.5

Interpretation:
PEG below 1.0 = potentially undervalued
PEG around 1.0 = fair
PEG above 2.0 = expensive unless the company is exceptional


6. EBITDA

EBITDA measures operating profitability before interest, taxes, depreciation and amortization.

Formula:
EBITDA = Operating Profit + Depreciation + Amortization

Example:
Operating Profit = $8B
Depreciation = $1B
Amortization = $0.5B

EBITDA = 8B + 1B + 0.5B = $9.5B

Important:
EBITDA is useful, but it is not real free cash flow.


7. FCF - Free Cash Flow

Free Cash Flow is the cash left after operating expenses and capital investments.

Formula:
FCF = Operating Cash Flow - Capital Expenditures

Example:
Operating Cash Flow = $15B
Capital Expenditures = $5B

FCF = 15B - 5B = $10B

FCF Margin:
FCF Margin = FCF / Revenue × 100

Example:
FCF = $10B
Revenue = $50B

FCF Margin = 10B / 50B × 100 = 20%

Professional lesson:
Free Cash Flow is one of the most important metrics because it shows real financial power.
`,
  },
  {
    title: "6. Margins: Gross, Operating, Net",
    category: "core",
    content: `
Margins show how much profit a company keeps from its sales.

1. Gross Margin

Formula:
Gross Margin = (Revenue - Cost of Goods Sold) / Revenue × 100

Example:
Revenue = $100M
Cost of Goods Sold = $40M

Gross Profit = 100M - 40M = $60M
Gross Margin = 60M / 100M × 100 = 60%

Meaning:
The company keeps 60 cents of gross profit from every $1 of sales.


2. Operating Margin

Formula:
Operating Margin = Operating Income / Revenue × 100

Example:
Revenue = $100M
Operating Income = $25M

Operating Margin = 25M / 100M × 100 = 25%

Meaning:
After operating expenses, the company keeps 25 cents from every $1 of sales.


3. Net Margin

Formula:
Net Margin = Net Income / Revenue × 100

Example:
Revenue = $100M
Net Income = $18M

Net Margin = 18M / 100M × 100 = 18%

Meaning:
After all expenses, taxes and interest, the company keeps 18 cents from every $1 of sales.

Professional lesson:
Margin expansion is bullish.
Margin compression is a warning signal.

Example:
Revenue grows 20%, but margins fall from 25% to 10%.
That may mean the company is buying growth at the expense of profitability.
`,
  },
  {
    title: "7. Debt, Cash Flow, Balance Sheet",
    category: "core",
    content: `
The balance sheet shows the financial health of a company.

Key items:

1. Cash
Money the company has available.

2. Debt
Money the company owes.

3. Equity
Net value belonging to shareholders.

4. Assets
Everything the company owns.

5. Liabilities
Everything the company owes.


Net Debt

Formula:
Net Debt = Total Debt - Cash

Example:
Total Debt = $30B
Cash = $12B

Net Debt = 30B - 12B = $18B


Debt to Equity

Formula:
Debt to Equity = Total Debt / Shareholders' Equity

Example:
Debt = $20B
Equity = $40B

Debt to Equity = 20B / 40B = 0.5

Meaning:
Debt equals 50% of shareholder equity.


Interest Coverage

Formula:
Interest Coverage = EBIT / Interest Expense

Example:
EBIT = $10B
Interest Expense = $1B

Interest Coverage = 10B / 1B = 10

Meaning:
The company earns 10 times more than it needs to pay interest.

Professional lesson:
High debt is not always bad if cash flow is strong.
But high debt becomes dangerous when interest rates rise or revenue falls.
`,
  },
  {
    title: "8. Market Cap and Enterprise Value",
    category: "core",
    content: `
Market Cap

Formula:
Market Cap = Stock Price × Shares Outstanding

Example:
Stock Price = $100
Shares Outstanding = 1B

Market Cap = 100 × 1B = $100B

Market cap tells you how much the market values the equity of the company.


Enterprise Value

Formula:
Enterprise Value = Market Cap + Total Debt - Cash

Example:
Market Cap = $100B
Debt = $20B
Cash = $10B

Enterprise Value = 100B + 20B - 10B = $110B

Why EV matters:
If someone buys the entire company, they also take the debt but receive the cash.


EV / EBITDA

Formula:
EV / EBITDA = Enterprise Value / EBITDA

Example:
EV = $110B
EBITDA = $10B

EV / EBITDA = 110B / 10B = 11

Professional lesson:
Enterprise Value gives a more complete valuation than market cap because it includes debt and cash.
`,
  },
  {
    title: "9. ROE, ROIC, ROA",
    category: "core",
    content: `
ROE - Return on Equity

Formula:
ROE = Net Income / Shareholders' Equity × 100

Example:
Net Income = $10B
Equity = $50B

ROE = 10B / 50B × 100 = 20%


ROIC - Return on Invested Capital

Formula:
ROIC = NOPAT / Invested Capital × 100

Example:
NOPAT = $8B
Invested Capital = $40B

ROIC = 8B / 40B × 100 = 20%


ROA - Return on Assets

Formula:
ROA = Net Income / Total Assets × 100

Example:
Net Income = $10B
Total Assets = $100B

ROA = 10B / 100B × 100 = 10%

Professional lesson:
ROIC is often more important than ROE because ROE can be inflated with debt.
High ROIC usually means the company has a strong business model.
`,
  },
  {
    title: "10. Dividends, Buybacks and Dilution",
    category: "core",
    content: `
Dividend Yield

Formula:
Dividend Yield = Annual Dividend / Stock Price × 100

Example:
Annual Dividend = $3
Stock Price = $100

Dividend Yield = 3 / 100 × 100 = 3%


Payout Ratio

Formula:
Payout Ratio = Dividend Per Share / EPS × 100

Example:
Dividend Per Share = $2
EPS = $5

Payout Ratio = 2 / 5 × 100 = 40%

A payout ratio below 60% is usually healthier.


Buybacks

Buybacks reduce share count.

Example:
Net Income = $10B
Shares = 1B

EPS = 10B / 1B = $10

If the company buys back shares and shares fall to 900M:

EPS = 10B / 900M = $11.11

EPS increased even without net income growth.


Dilution

Dilution increases share count and reduces ownership.

Example:
You own 10,000 shares out of 1,000,000 shares.

Ownership = 10,000 / 1,000,000 = 1%

If total shares become 2,000,000:

Ownership = 10,000 / 2,000,000 = 0.5%

Professional lesson:
Buybacks can help shareholders.
Dilution hurts shareholders if it does not create enough value.
`,
  },
  {
    title: "11. Growth vs Value companies",
    category: "core",
    content: `
Growth companies:
- high revenue growth
- high EPS growth
- high valuation
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
Stock Price = $50
EPS = $5

P/E = 50 / 5 = 10

Professional lesson:
Growth is powerful when it is profitable.
Value is attractive when the business is not structurally declining.

Best investors compare:
business quality + growth + valuation + risk.
`,
  },
  {
    title: "12. Fundamental Analysis Process",
    category: "core",
    content: `
Professional fundamental analysis process:

1. Understand the business
What does the company sell?
Who are the customers?
Does the company have competitive advantages?

2. Analyze revenue growth
Formula:
Revenue Growth = (Current Revenue - Previous Revenue) / Previous Revenue × 100

3. Analyze EPS growth
Formula:
EPS Growth = (Current EPS - Previous EPS) / Previous EPS × 100

4. Analyze margins
Check gross, operating and net margins.

5. Analyze debt
Check net debt, interest coverage and debt maturity.

6. Analyze free cash flow
Formula:
FCF = Operating Cash Flow - Capital Expenditures

7. Compare valuation
Use P/E, P/S, PEG, EV/EBITDA and FCF Yield.

8. Identify catalysts
Examples:
- AI growth
- new products
- margin expansion
- lower interest rates
- buybacks
- institutional buying

Example:
Intrinsic Value = $120
Market Price = $90

Upside = (120 - 90) / 90 × 100 = 33.3%

Professional goal:
Buy strong companies when market price is below or near fair value.
`,
  },
  {
    title: "13. Technical Analysis Framework",
    category: "technical",
    visual: "supportResistance",
    content: `
Technical analysis studies price action, volume and chart structure.

It does not ask:
"What is the company worth?"

It asks:
"What is price doing right now?"

Technical analysis is used to identify:
- trend direction
- momentum
- support zones
- resistance zones
- possible entry points
- possible exit points
- risk levels

Main tools:
- support and resistance
- trend lines
- moving averages
- RSI
- MACD
- volume
- candlestick patterns

Important:
Technical analysis should not be used alone.
Professional brokers combine technical analysis with fundamentals, macro and risk management.

Example:
A stock is fundamentally strong, but price is below the 200-day moving average.
A professional investor may wait for technical confirmation before entering.
`,
  },
  {
    title: "14. Fundamental Analysis Framework",
    category: "core",
    visual: "valuation",
    content: `
Fundamental analysis studies the real value of a company.

It asks:
"What is this business really worth?"

Professional investors analyze:
- revenue
- EPS
- margins
- debt
- free cash flow
- valuation
- competitive advantages
- management
- industry trends
- macro conditions

Example:
Fair Value = $150
Current Price = $100

Upside = (150 - 100) / 100 × 100 = 50%

If the company is strong and risk is acceptable, the stock may be attractive.

Professional use:
- long-term investing
- institutional investing
- value investing
- growth investing
- portfolio construction
`,
  },
  {
    title: "15. Inflation and Market Impact",
    category: "macro",
    visual: "inflation",
    content: `
Inflation means prices rise over time.

Example:
A product costs $100 today.
Next year it costs $110.

Inflation = (110 - 100) / 100 × 100 = 10%

Causes:
- money printing
- high demand
- supply shortages
- rising wages
- expensive energy
- geopolitical shocks

Market impact:

1. Stocks
High inflation can pressure stocks because costs rise and consumers spend less.

2. Interest Rates
Central banks raise rates to fight inflation.

3. Bonds
Bond prices usually fall when rates rise.

4. Gold
Gold is often used as an inflation hedge.

5. Crypto
Bitcoin is sometimes viewed as digital gold, but crypto remains volatile.

Professional lesson:
Inflation is not only about prices.
It changes interest rates, valuations, liquidity and investor behavior.
`,
  },
  {
    title: "16. Deflation and Market Impact",
    category: "macro",
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
- company profits
- employment
- GDP growth

Central banks may respond with:
- lower interest rates
- money printing
- liquidity support

Professional lesson:
Short-term lower prices may look good for consumers, but long-term deflation can damage the economy.
`,
  },
  {
    title: "17. Cryptocurrency, Blockchain and Digital Assets",
    category: "crypto",
    visual: "crypto",
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
- fast global transfer

Bitcoin:
Maximum supply = 21 million coins.

Ethereum:
Introduced smart contracts, decentralized applications and DeFi.

Blockchain:
A public digital ledger that records transactions securely.

Professional lesson:
Crypto is not one single market.
It includes many sectors:
- Bitcoin
- smart contracts
- DeFi
- AI crypto
- gaming
- infrastructure
- real world assets
`,
  },
  {
    title: "18. Crypto Research Checklist Before Buying",
    category: "crypto",
    content: `
Before buying crypto, analyze risk carefully.

1. Market Capitalization

Formula:
Market Cap = Price × Circulating Supply

Example:
Price = $10
Circulating Supply = 100M tokens

Market Cap = 10 × 100M = $1B


2. Token Supply
Check:
- max supply
- circulating supply
- future unlocks
- inflation schedule

3. Utility
Ask:
What problem does this project solve?

4. Team and Investors
Check:
- founders
- developers
- institutional backers
- venture capital investors

5. Liquidity
Low liquidity means higher manipulation risk.

6. Tokenomics
Check:
- emissions
- staking
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
- anonymous suspicious teams
- no real product

Professional lesson:
In crypto, risk management is more important than prediction.
`,
  },
  {
    title: "19. Interest Rates and Asset Valuation",
    category: "macro",
    content: `
Interest rates are the cost of borrowing money.

Higher rates:
- reduce borrowing
- reduce inflation
- reduce liquidity
- pressure stock valuations
- strengthen cash and bonds

Lower rates:
- stimulate growth
- increase borrowing
- increase liquidity
- support stocks and crypto

Why growth stocks react strongly:
Growth stocks depend heavily on future earnings.
When interest rates rise, future earnings become less valuable today.

Professional lesson:
Do not analyze stocks without understanding interest rates.
Rates influence valuation, liquidity and institutional positioning.
`,
  },
  {
    title: "20. Recession, Earnings Risk and Defensive Positioning",
    category: "macro",
    content: `
A recession is a period of economic decline.

Common signs:
- falling GDP
- rising unemployment
- weak consumer spending
- falling company profits
- tighter credit conditions

During recessions:
- consumers spend less
- companies cut costs
- earnings decline
- investors become defensive

Sectors that often hold better:
- healthcare
- utilities
- consumer staples

Risk assets often fall:
- small caps
- speculative technology
- weak balance sheet companies
- highly leveraged crypto

Professional lesson:
Recessions create risk, but also opportunity.
Strong companies can become attractive when fear is extreme.
`,
  },
  {
    title: "21. Market Liquidity and Risk Appetite",
    category: "macro",
    content: `
Liquidity means how easily assets can be bought or sold without moving price too much.

High liquidity:
- tighter spreads
- easier execution
- lower volatility
- less manipulation risk

Low liquidity:
- wider spreads
- higher volatility
- more slippage
- more manipulation risk

Central bank liquidity:
When central banks inject liquidity, risk assets often rise.

When liquidity decreases:
- stocks may fall
- crypto may fall
- volatility may rise

Professional lesson:
Liquidity is one of the strongest hidden drivers of global markets.
`,
  },
  {
    title: "22. Risk management and portfolio allocation",
    category: "core",
    visual: "risk",
    content: `
Risk management protects capital.

Main rules:

1. Never risk too much on one position.
2. Diversify across sectors and assets.
3. Avoid emotional decisions.
4. Use position sizing.
5. Keep cash reserves.
6. Know your invalidation level.
7. Do not average down blindly.

Example:
Portfolio = $100,000
Risk per trade = 1%

Maximum loss:
100,000 × 1% = $1,000

If stop loss distance is 5%:

Position size:
1,000 / 5% = $20,000

Professional lesson:
Great investors survive first and grow second.
Capital protection is more important than one good trade.
`,
  },
  {
    title: "23. Moving Averages: SMA and EMA",
    category: "technical",
    visual: "movingAverage",
    content: `
Moving averages smooth price movement and help identify trend direction.

SMA - Simple Moving Average

Formula:
SMA = Sum of closing prices / Number of periods

Example:
Closing prices for 5 days:
100, 102, 101, 105, 107

SMA = (100 + 102 + 101 + 105 + 107) / 5
SMA = 515 / 5 = 103

EMA - Exponential Moving Average

EMA gives more weight to recent prices.

Professional use:
- 20 EMA for short-term trend
- 50 SMA for medium-term trend
- 200 SMA for long-term trend

Bullish structure:
Price above 20, 50 and 200 moving averages.

Bearish structure:
Price below 20, 50 and 200 moving averages.

Golden Cross:
50-day MA crosses above 200-day MA.
Usually bullish.

Death Cross:
50-day MA crosses below 200-day MA.
Usually bearish.

Correct use:
Do not buy only because price touches a moving average.
Use moving averages with volume, trend, support/resistance and macro context.
`,
  },
  {
    title: "24. RSI - Relative Strength Index",
    category: "technical",
    visual: "rsi",
    content: `
RSI measures momentum.

Range:
0 to 100

Common interpretation:
RSI above 70 = overbought
RSI below 30 = oversold

But this is not enough.

Professional interpretation:

1. Strong uptrends
RSI can stay above 70 for a long time.
Overbought does not always mean sell.

2. Strong downtrends
RSI can stay below 30 for a long time.
Oversold does not always mean buy.

3. Bullish RSI zone
In strong markets, RSI often holds above 40-50.

4. Bearish RSI zone
In weak markets, RSI often fails near 50-60.

RSI divergence:

Bullish divergence:
Price makes lower low.
RSI makes higher low.

This can signal weakening selling pressure.

Bearish divergence:
Price makes higher high.
RSI makes lower high.

This can signal weakening buying pressure.

Professional use:
RSI works best with trend, support/resistance and volume.
`,
  },
  {
    title: "25. MACD - Moving Average Convergence Divergence",
    category: "technical",
    visual: "macd",
    content: `
MACD is a momentum indicator.

It shows the relationship between two moving averages.

Main parts:
- MACD line
- Signal line
- Histogram

Common settings:
12 EMA, 26 EMA, 9 Signal

Formula:
MACD Line = 12-period EMA - 26-period EMA

Signal Line = 9-period EMA of MACD Line

Histogram = MACD Line - Signal Line

Bullish signal:
MACD line crosses above signal line.

Bearish signal:
MACD line crosses below signal line.

Histogram:
If histogram rises, momentum is strengthening.
If histogram falls, momentum is weakening.

Professional use:
MACD is better in trending markets.
It can give false signals in sideways markets.

Correct use:
Combine MACD with:
- trend direction
- support/resistance
- volume
- higher timeframe confirmation
`,
  },
  {
    title: "26. Bollinger Bands",
    category: "technical",
    visual: "bollinger",
    content: `
Bollinger Bands measure volatility.

They contain:
- middle band
- upper band
- lower band

Middle band:
Usually 20-period moving average.

Upper and lower bands:
Usually 2 standard deviations above and below the middle band.

Professional interpretation:

1. Price near upper band
Momentum is strong, but price may be extended.

2. Price near lower band
Selling pressure is strong, but price may be oversold.

3. Band squeeze
Bands become narrow.
This often signals that volatility is low and a bigger move may come.

4. Band expansion
Bands widen.
This means volatility is increasing.

Beginner mistake:
Selling every time price touches the upper band.

Professional view:
In strong trends, price can ride the upper band for a long time.

Correct use:
Use Bollinger Bands with volume, RSI, trend direction and support/resistance.
`,
  },
  {
    title: "27. Volume and Volume Confirmation",
    category: "technical",
    visual: "volume",
    content: `
Volume shows how many shares or coins are traded.

Why volume matters:
Price movement with high volume is more reliable than price movement with low volume.

Professional interpretation:

1. Price rises with high volume
Bullish confirmation.

2. Price rises with low volume
Weak move. Be careful.

3. Price falls with high volume
Strong selling pressure.

4. Breakout with high volume
More reliable breakout.

5. Breakout with low volume
Higher risk of fake breakout.

Example:
Stock breaks resistance at $100.

Scenario A:
Breakout volume is 3 times average volume.
This is stronger.

Scenario B:
Breakout volume is below average.
This may be a false breakout.

Professional lesson:
Volume confirms conviction.
Without volume, price signals are weaker.
`,
  },
  {
    title: "28. Support and Resistance",
    category: "technical",
    visual: "supportResistance",
    content: `
Support and resistance are key price zones.

Support:
A zone where buyers usually enter.

Resistance:
A zone where sellers usually appear.

Example:
Bitcoin falls to $90,000 multiple times and bounces.
$90,000 becomes support.

Example:
A stock rises to $150 several times and fails.
$150 becomes resistance.

Breakout:
Price moves above resistance.

Breakdown:
Price moves below support.

Retest:
After breakout, price may return to the old resistance.
If it holds, that old resistance may become support.

Professional use:
Do not treat support/resistance as exact lines.
Treat them as zones.

Correct use:
Combine with:
- volume
- trend
- RSI
- macro environment
- risk management
`,
  },
  {
    title: "29. Candlestick Patterns",
    category: "technical",
    visual: "candles",
    content: `
Candlesticks show open, high, low and close.

Each candle tells a short story of buyers and sellers.

Important candles:

1. Bullish engulfing
A strong bullish candle fully covers the previous bearish candle.
Possible reversal signal.

2. Bearish engulfing
A strong bearish candle covers the previous bullish candle.
Possible weakness signal.

3. Doji
Open and close are close together.
Shows indecision.

4. Hammer
Long lower wick.
Sellers pushed price down, but buyers recovered.
Can be bullish near support.

5. Shooting star
Long upper wick.
Buyers pushed price up, but sellers rejected it.
Can be bearish near resistance.

Professional lesson:
Candlestick patterns are more useful when they appear at important levels.

A hammer in the middle of nowhere is weak.
A hammer at major support with high volume is more meaningful.
`,
  },
  {
    title: "30. Trend Lines and Market Structure",
    category: "technical",
    visual: "supportResistance",
    content: `
Trend lines help visualize market direction.

Uptrend:
Higher highs and higher lows.

Downtrend:
Lower highs and lower lows.

Sideways market:
Price moves between support and resistance.

Uptrend example:
Low 1 = $100
High 1 = $120
Low 2 = $110
High 2 = $140

This is bullish structure.

Downtrend example:
High 1 = $150
Low 1 = $130
High 2 = $140
Low 2 = $115

This is bearish structure.

Professional lesson:
Do not fight the primary trend.

If the daily trend is bearish, short-term bullish signals are weaker.
If the weekly trend is bullish, short-term pullbacks may be opportunities.
`,
  },
  {
    title: "31. FCF Yield and Earnings Yield",
    category: "core",
    content: `
FCF Yield shows how much free cash flow the company produces relative to market cap.

Formula:
FCF Yield = Free Cash Flow / Market Cap × 100

Example:
Free Cash Flow = $10B
Market Cap = $200B

FCF Yield = 10B / 200B × 100 = 5%

Meaning:
The company produces 5% of its market value in free cash flow per year.

Earnings Yield

Formula:
Earnings Yield = EPS / Stock Price × 100

Example:
EPS = $5
Stock Price = $100

Earnings Yield = 5 / 100 × 100 = 5%

Connection with P/E:
Earnings Yield = 1 / P/E

If P/E = 20:
Earnings Yield = 1 / 20 = 5%

Professional lesson:
FCF Yield helps compare stocks with bonds and cash returns.
`,
  },
  {
    title: "32. Economic Moat and Competitive Advantage",
    category: "core",
    content: `
Economic moat means a company has strong protection against competitors.

It does not mean economic growth, GDP growth or macroeconomic development.
It means business defense.

The idea is simple:
If a company earns high profits, competitors will usually try to enter the market.
If competitors can easily copy the product, reduce prices or take customers, the profit advantage may disappear.
If competitors cannot easily do that, the company may have an economic moat.

A strong moat can protect:
- revenue
- margins
- market share
- customer loyalty
- pricing power
- return on invested capital
- long-term free cash flow

Main types of economic moats:

1. Brand power

A strong brand allows a company to charge premium prices because customers trust it.

Formula connection:
Pricing Power = Ability to increase price without losing many customers

Example:
If a company sells 10,000,000 products at $100, revenue is:

Revenue = 10,000,000 × $100 = $1,000,000,000

If the company raises price by 10% to $110 and demand stays strong:

New Revenue = 10,000,000 × $110 = $1,100,000,000

Revenue increases by $100,000,000 without selling more units.

Examples:
Apple, Coca-Cola, Nike, Ferrari.

Why it matters:
A strong brand often supports higher margins and customer loyalty.


2. Network effects

A network effect exists when a product becomes more valuable as more people use it.

Example:
A payment network with 10,000 merchants is useful.
A payment network with 100,000,000 merchants and users is much more powerful.

Examples:
Visa, Mastercard, Meta, Microsoft ecosystem.

Why it matters:
New competitors struggle because users prefer the network where everyone already is.


3. Switching costs

Switching costs exist when customers cannot easily leave a product or service.

Example:
A large company uses enterprise software for accounting, customer data and operations.
Changing the software may cost millions, require employee training and create operational risk.

Examples:
Microsoft, Adobe, Salesforce, Oracle.

Why it matters:
High switching costs create recurring revenue and reduce customer churn.


4. Cost advantage

A company has a cost advantage when it can produce or distribute goods cheaper than competitors.

Example:
Company A produces a product for $60 and sells it for $100.
Gross Profit = $100 - $60 = $40
Gross Margin = 40 / 100 × 100 = 40%

Company B produces the same product for $80 and sells it for $100.
Gross Profit = $20
Gross Margin = 20%

Company A can lower prices and still remain profitable, while Company B may struggle.

Examples:
Walmart, Costco, large-scale manufacturers.

Why it matters:
Cost advantages are powerful during recessions and price wars.


5. Patents, regulation and licenses

Some companies are protected by patents, licenses or regulatory barriers.

Example:
A pharmaceutical company may have patent protection on a drug.
Competitors cannot legally copy it until the patent expires.

Examples:
Pharma companies, exchanges, regulated utilities, specialized technology companies.

Why it matters:
Legal protection can create years of high profitability.


6. Data and ecosystem advantage

Some companies collect valuable data or build ecosystems that become difficult to replace.

Example:
A user who owns an iPhone, MacBook, Apple Watch, AirPods and uses iCloud is less likely to leave Apple.

Why it matters:
The ecosystem increases retention and lifetime customer value.


How to identify a real moat:

1. High ROIC

Formula:
ROIC = NOPAT / Invested Capital × 100

Example:
NOPAT = $10B
Invested Capital = $50B

ROIC = 10B / 50B × 100 = 20%

A company that can produce 20% ROIC for many years may have a strong moat.


2. Stable or rising margins

Formula:
Operating Margin = Operating Income / Revenue × 100

Example:
Revenue = $100B
Operating Income = $30B

Operating Margin = 30B / 100B × 100 = 30%

If competitors cannot reduce this margin over time, the company may be well protected.


3. Pricing power

If inflation rises and the company can increase prices without losing customers, that is a strong sign of moat.


4. Market share stability

If a company keeps or grows market share for many years, competitors may not be able to attack it successfully.


5. Recurring revenue

Recurring revenue means customers keep paying regularly.

Examples:
software subscriptions, cloud contracts, payment networks, membership models.


Real investor example:

Company A:
Revenue growth = 8%
Operating margin = 32%
ROIC = 25%
Debt = low
Customer retention = high

Company B:
Revenue growth = 20%
Operating margin = 5%
ROIC = 4%
Debt = high
Customer retention = weak

Many beginners may choose Company B because growth is higher.
A professional may prefer Company A because it has better economics and stronger protection.


Professional lesson:
A strong economic moat does not guarantee the stock is always a buy.
Price still matters.

Even a great company can be a bad investment if bought at an extreme valuation.

The correct question is:
Is this a high-quality company with durable competitive advantages, and is the current valuation reasonable?
`,
  },
  {
    title: "33. Video Lessons - Coming Soon",
    category: "video",
    content: `
This section is reserved for future video education. It should not be treated as a completed investment lesson yet.

Purpose of this module:
The video section will be used for practical screen-recorded lessons where users can see charts, financial statements, indicators and portfolio decisions visually instead of only reading text.

Planned video curriculum:
1. Reading a stock chart from zero
Users will learn price candles, trend direction, support, resistance, volume and basic chart navigation.

2. Reading financial statements
Users will see where revenue, net income, assets, liabilities, cash flow and debt appear in real company reports.

3. Using valuation ratios correctly
The lesson will compare P/E, P/S, EV/EBITDA, PEG and FCF Yield on real examples.

4. Combining fundamental and technical analysis
The goal will be to show how a fundamentally strong company can still require technical timing and risk control.

5. Risk management in practice
The video will demonstrate position sizing, stop levels, portfolio exposure and scenario planning.

Future structure:
- short concept explanation
- practical screen example
- formula or checklist
- common mistakes
- professional summary
`,
  },
  {
    title: "34. Reading Library - Coming Soon",
    category: "library",
    content: `
This section is reserved for future reading resources, checklists and investor reference materials.

Purpose of this module:
The reading library will organize longer educational materials that users can return to when they analyze companies, crypto assets, macro data or risk decisions.

Planned library sections:
1. Beginner investing guide
A structured guide explaining stocks, ETFs, diversification, compounding, risk and long-term portfolio thinking.

2. Financial statement guide
A practical reference for income statements, balance sheets and cash flow statements.

3. Valuation guide
A formula-based guide for P/E, P/S, PEG, EV/EBITDA, FCF Yield, intrinsic value and margin of safety.

4. Risk management checklist
A checklist covering position size, portfolio concentration, stop levels, liquidity, volatility and emotional discipline.

5. Crypto research checklist
A framework for token supply, unlock schedules, liquidity, utility, team quality, security and market narrative.

6. Trading psychology notes
A practical section on overtrading, fear of missing out, revenge trading, confirmation bias and patience.

Future structure:
- detailed article
- formulas and examples
- checklist
- beginner mistakes
- professional summary
`,
  },
];

const categories: { key: LessonCategory; label: string; description: string }[] = [
  {
    key: "core",
    label: "Core Investing Lessons",
    description: "Stocks, valuation, company analysis, risk and portfolio basics.",
  },
  {
    key: "macro",
    label: "Macroeconomics",
    description: "Inflation, deflation, interest rates, recession and liquidity.",
  },
  {
    key: "crypto",
    label: "Cryptocurrency Lessons",
    description: "Blockchain, Bitcoin, crypto risk, tokenomics and project research.",
  },
  {
    key: "technical",
    label: "Professional Trading Indicators",
    description: "RSI, MACD, moving averages, volume, candles and chart structure.",
  },
  {
    key: "video",
    label: "Video Lessons",
    description: "Future section for premium video education.",
  },
  {
    key: "library",
    label: "Reading Library",
    description: "Future section for articles, checklists and reading materials.",
  },
];


function normalizeLessonBody(content: string) {
  return content
    .trim()
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+\n/g, "\n");
}

function splitLessonBody(content: string) {
  return normalizeLessonBody(content)
    .split("\n\n")
    .map((block) => block.trim())
    .filter(Boolean);
}

function isSectionHeading(block: string) {
  const clean = block.trim();
  if (!clean) return false;
  if (clean.length > 80) return false;
  if (clean.includes("=") || clean.includes("/")) return false;
  if (/^\d+[.)]/.test(clean)) return false;
  if (clean.endsWith(":")) return true;
  const knownHeadings = [
    "Definition",
    "Purpose",
    "Institutional use",
    "Professional interpretation",
    "Professional workflow",
    "Professional lesson",
    "Formula",
    "Example",
    "Real example",
    "Calculation example",
    "Common beginner mistakes",
    "Correct use",
    "Market impact",
    "Main drivers",
    "Key items",
    "Future structure",
    "Planned video curriculum",
    "Planned library sections",
  ];
  return knownHeadings.includes(clean);
}

function LessonContent({ content }: { content: string }) {
  const blocks = splitLessonBody(content);

  return (
    <div style={styles.lessonTextWrap}>
      {blocks.map((block, index) => {
        const heading = isSectionHeading(block);

        if (heading) {
          return (
            <h2 key={`${block}-${index}`} style={styles.lessonSubheading}>
              {block.replace(/:$/, "")}
            </h2>
          );
        }

        return (
          <div key={`${block}-${index}`} style={styles.lessonParagraph}>
            {block}
          </div>
        );
      })}
    </div>
  );
}


const styles: Record<string, React.CSSProperties> = {
  lessonTextWrap: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  lessonSubheading: {
    color: "white",
    fontSize: "22px",
    lineHeight: 1.22,
    margin: "16px 0 2px",
    fontWeight: 900,
  },
  lessonParagraph: {
    color: "#dbeafe",
    fontSize: "17px",
    lineHeight: 1.42,
    whiteSpace: "pre-line",
  },
};


function ChartVisual({ type }: { type: VisualType }) {
  const titleMap: Record<VisualType, string> = {
    stock: "Stock ownership example",
    valuation: "Valuation example",
    inflation: "Inflation impact example",
    crypto: "Crypto market structure",
    supportResistance: "Support and resistance",
    movingAverage: "Moving averages",
    rsi: "RSI zones",
    macd: "MACD momentum",
    bollinger: "Bollinger Bands",
    volume: "Volume confirmation",
    candles: "Candlestick example",
    risk: "Risk management example",
  };

  return (
    <div
      style={{
        background: "rgba(3,10,25,0.55)",
        border: "1px solid rgba(96,165,250,0.22)",
        borderRadius: "18px",
        padding: "18px",
        marginBottom: "24px",
      }}
    >
      <div
        style={{
          color: "#93c5fd",
          fontSize: "13px",
          fontWeight: 900,
          marginBottom: "12px",
          letterSpacing: "0.4px",
          textTransform: "uppercase",
        }}
      >
        Practical visual: {titleMap[type]}
      </div>

      <svg viewBox="0 0 760 280" width="100%" height="280" role="img">
        <rect x="0" y="0" width="760" height="280" rx="18" fill="rgba(8,20,40,0.96)" />

        {[40, 90, 140, 190, 240].map((y) => (
          <line key={y} x1="40" y1={y} x2="720" y2={y} stroke="rgba(255,255,255,0.08)" />
        ))}

        {type === "supportResistance" || type === "movingAverage" || type === "candles" || type === "volume" ? (
          <>
            <line x1="55" y1="210" x2="710" y2="210" stroke="#22c55e" strokeWidth="3" strokeDasharray="8 8" />
            <text x="58" y="202" fill="#86efac" fontSize="14" fontWeight="700">
              Support zone
            </text>

            <line x1="55" y1="75" x2="710" y2="75" stroke="#f87171" strokeWidth="3" strokeDasharray="8 8" />
            <text x="58" y="65" fill="#fca5a5" fontSize="14" fontWeight="700">
              Resistance zone
            </text>

            <polyline
              fill="none"
              stroke="#38bdf8"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              points="55,220 115,190 170,205 230,150 285,165 340,120 395,135 455,92 520,112 590,80 660,95 710,68"
            />

            {type === "movingAverage" && (
              <polyline
                fill="none"
                stroke="#facc15"
                strokeWidth="3"
                strokeLinecap="round"
                points="55,215 130,198 205,180 280,160 355,142 430,124 505,108 580,96 655,88 710,82"
              />
            )}

            {type === "volume" && (
              <>
                {[70, 105, 140, 175, 210, 245, 280, 315, 350, 385, 420, 455, 490, 525, 560, 595, 630, 665].map(
                  (x, index) => (
                    <rect
                      key={x}
                      x={x}
                      y={245 - ((index % 5) + 2) * 12}
                      width="18"
                      height={((index % 5) + 2) * 12}
                      fill={index % 3 === 0 ? "#22c55e" : "#38bdf8"}
                      opacity="0.8"
                    />
                  )
                )}
                <text x="58" y="260" fill="#dbeafe" fontSize="14" fontWeight="700">
                  Higher volume confirms stronger moves
                </text>
              </>
            )}

            {type === "candles" && (
              <>
                {[90, 140, 190, 240, 290, 340, 390, 440, 490, 540, 590, 640].map((x, index) => {
                  const up = index % 2 === 0;
                  return (
                    <g key={x}>
                      <line
                        x1={x}
                        y1={up ? 90 + index * 5 : 80 + index * 4}
                        x2={x}
                        y2={up ? 185 - index * 3 : 200 - index * 4}
                        stroke={up ? "#22c55e" : "#ef4444"}
                        strokeWidth="3"
                      />
                      <rect
                        x={x - 10}
                        y={up ? 120 + index * 3 : 115 + index * 5}
                        width="20"
                        height="45"
                        rx="4"
                        fill={up ? "#22c55e" : "#ef4444"}
                      />
                    </g>
                  );
                })}
              </>
            )}
          </>
        ) : null}

        {type === "rsi" && (
          <>
            <rect x="60" y="45" width="640" height="55" fill="rgba(239,68,68,0.20)" />
            <rect x="60" y="100" width="640" height="95" fill="rgba(148,163,184,0.10)" />
            <rect x="60" y="195" width="640" height="45" fill="rgba(34,197,94,0.18)" />

            <text x="70" y="78" fill="#fca5a5" fontSize="16" fontWeight="800">
              RSI above 70: overbought zone
            </text>
            <text x="70" y="150" fill="#dbeafe" fontSize="16" fontWeight="800">
              RSI 30-70: neutral / trend zone
            </text>
            <text x="70" y="223" fill="#86efac" fontSize="16" fontWeight="800">
              RSI below 30: oversold zone
            </text>

            <polyline
              fill="none"
              stroke="#38bdf8"
              strokeWidth="4"
              strokeLinecap="round"
              points="70,190 130,170 190,130 250,85 310,115 370,145 430,105 490,75 550,120 610,160 680,135"
            />
          </>
        )}

        {type === "macd" && (
          <>
            <line x1="60" y1="140" x2="700" y2="140" stroke="rgba(255,255,255,0.25)" />
            <polyline
              fill="none"
              stroke="#38bdf8"
              strokeWidth="4"
              points="70,160 130,150 190,130 250,110 310,120 370,150 430,170 490,150 550,115 610,100 680,120"
            />
            <polyline
              fill="none"
              stroke="#facc15"
              strokeWidth="4"
              points="70,170 130,160 190,145 250,125 310,130 370,145 430,160 490,158 550,135 610,118 680,125"
            />
            <text x="70" y="40" fill="#38bdf8" fontSize="15" fontWeight="800">
              MACD line
            </text>
            <text x="185" y="40" fill="#facc15" fontSize="15" fontWeight="800">
              Signal line
            </text>
            {[95, 145, 195, 245, 295, 345, 395, 445, 495, 545, 595, 645].map((x, i) => (
              <rect
                key={x}
                x={x}
                y={i < 5 ? 140 - (i + 1) * 8 : 140}
                width="20"
                height={i < 5 ? (i + 1) * 8 : (i - 4) * 8}
                fill={i < 5 ? "#22c55e" : "#ef4444"}
                opacity="0.75"
              />
            ))}
          </>
        )}

        {type === "bollinger" && (
          <>
            <path
              d="M60 90 C170 55, 280 100, 390 70 C500 45, 610 95, 700 65"
              fill="none"
              stroke="#60a5fa"
              strokeWidth="3"
              strokeDasharray="8 8"
            />
            <path
              d="M60 190 C170 155, 280 205, 390 175 C500 145, 610 195, 700 165"
              fill="none"
              stroke="#60a5fa"
              strokeWidth="3"
              strokeDasharray="8 8"
            />
            <path
              d="M60 140 C170 105, 280 155, 390 125 C500 95, 610 145, 700 115"
              fill="none"
              stroke="#facc15"
              strokeWidth="4"
            />
            <polyline
              fill="none"
              stroke="#22c55e"
              strokeWidth="4"
              points="60,150 120,135 180,145 240,115 300,130 360,105 420,120 480,90 540,110 600,85 660,100 700,76"
            />
            <text x="70" y="235" fill="#dbeafe" fontSize="15" fontWeight="800">
              Bands expand when volatility rises and contract when volatility falls.
            </text>
          </>
        )}

        {type === "inflation" && (
          <>
            <rect x="90" y="170" width="90" height="60" fill="#38bdf8" rx="8" />
            <rect x="245" y="135" width="90" height="95" fill="#facc15" rx="8" />
            <rect x="400" y="95" width="90" height="135" fill="#fb7185" rx="8" />
            <rect x="555" y="65" width="90" height="165" fill="#ef4444" rx="8" />
            <text x="105" y="255" fill="#dbeafe" fontSize="15">
              Year 1
            </text>
            <text x="260" y="255" fill="#dbeafe" fontSize="15">
              Year 2
            </text>
            <text x="415" y="255" fill="#dbeafe" fontSize="15">
              Year 3
            </text>
            <text x="570" y="255" fill="#dbeafe" fontSize="15">
              Year 4
            </text>
            <text x="100" y="160" fill="#dbeafe" fontSize="16" fontWeight="800">
              $100
            </text>
            <text x="255" y="125" fill="#dbeafe" fontSize="16" fontWeight="800">
              $110
            </text>
            <text x="410" y="85" fill="#dbeafe" fontSize="16" fontWeight="800">
              $125
            </text>
            <text x="565" y="55" fill="#dbeafe" fontSize="16" fontWeight="800">
              $140
            </text>
          </>
        )}

        {type === "crypto" && (
          <>
            {[
              ["Bitcoin", 115, 95, "#facc15"],
              ["Ethereum", 325, 95, "#38bdf8"],
              ["DeFi", 535, 95, "#22c55e"],
              ["AI Crypto", 220, 190, "#a78bfa"],
              ["Infrastructure", 440, 190, "#fb7185"],
            ].map(([label, x, y, color]) => (
              <g key={label}>
                <circle cx={Number(x)} cy={Number(y)} r="46" fill={String(color)} opacity="0.18" />
                <circle cx={Number(x)} cy={Number(y)} r="45" stroke={String(color)} strokeWidth="3" fill="none" />
                <text x={Number(x)} y={Number(y) + 5} textAnchor="middle" fill="#dbeafe" fontSize="15" fontWeight="800">
                  {label}
                </text>
              </g>
            ))}
          </>
        )}

        {type === "stock" || type === "valuation" || type === "risk" ? (
          <>
            <rect x="80" y="70" width="170" height="120" rx="14" fill="rgba(37,99,235,0.22)" stroke="#60a5fa" />
            <text x="165" y="115" textAnchor="middle" fill="white" fontSize="18" fontWeight="900">
              Company
            </text>
            <text x="165" y="145" textAnchor="middle" fill="#dbeafe" fontSize="14">
              Revenue + Profit
            </text>

            <path d="M270 130 L470 130" stroke="#22c55e" strokeWidth="4" markerEnd="url(#arrow)" />
            <rect x="500" y="70" width="170" height="120" rx="14" fill="rgba(34,197,94,0.18)" stroke="#22c55e" />
            <text x="585" y="115" textAnchor="middle" fill="white" fontSize="18" fontWeight="900">
              Investor
            </text>
            <text x="585" y="145" textAnchor="middle" fill="#dbeafe" fontSize="14">
              Ownership + Return
            </text>

            <defs>
              <marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
                <path d="M0,0 L0,6 L9,3 z" fill="#22c55e" />
              </marker>
            </defs>
          </>
        ) : null}
      </svg>
    </div>
  );
}

export default function EducationPage() {
  const supabase = useMemo(() => createClient(), []);

  const [plan, setPlan] = useState<PlanType>("loading");
  const [selectedLesson, setSelectedLesson] = useState<Lesson>(lessons[0]);
  const [openCategory, setOpenCategory] = useState<LessonCategory>("core");

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
            gap: "12px",
            flexWrap: "wrap",
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

          <div
            style={{
              color: "#93c5fd",
              fontSize: "13px",
              fontWeight: 800,
              background: "rgba(37,99,235,0.16)",
              border: "1px solid rgba(96,165,250,0.22)",
              borderRadius: "999px",
              padding: "10px 14px",
            }}
          >
            Premium Education Academy
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "360px 1fr",
            gap: "20px",
            alignItems: "start",
          }}
        >
          <aside
            style={{
              background: "rgba(10,20,40,0.94)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "20px",
              padding: "20px",
              height: "fit-content",
              position: "sticky",
              top: "20px",
            }}
          >
            <h2 style={{ color: "white", marginBottom: "8px", fontSize: "24px" }}>
              Education Academy
            </h2>

            <p
              style={{
                color: "#94a3b8",
                fontSize: "13px",
                lineHeight: 1.6,
                marginBottom: "18px",
              }}
            >
              Structured investor education with lessons, formulas, examples and practical chart visuals.
            </p>

            {categories.map((category) => {
              const categoryLessons = lessons.filter((lesson) => lesson.category === category.key);
              const isOpen = openCategory === category.key;

              return (
                <div key={category.key} style={{ marginBottom: "10px" }}>
                  <button
                    onClick={() => setOpenCategory(isOpen ? "core" : category.key)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "14px",
                      borderRadius: "14px",
                      border: "1px solid rgba(96,165,250,0.20)",
                      background: isOpen ? "rgba(37,99,235,0.32)" : "rgba(255,255,255,0.04)",
                      color: "white",
                      cursor: "pointer",
                      fontWeight: 900,
                      fontSize: "14px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span>{category.label}</span>
                    <span>{isOpen ? "▲" : "▼"}</span>
                  </button>

                  {isOpen ? (
                    <div style={{ paddingTop: "8px" }}>
                      <p
                        style={{
                          color: "#94a3b8",
                          fontSize: "12px",
                          lineHeight: 1.55,
                          margin: "0 0 8px",
                          padding: "0 4px",
                        }}
                      >
                        {category.description}
                      </p>

                      {categoryLessons.map((lesson) => (
                        <button
                          key={lesson.title}
                          onClick={() => setSelectedLesson(lesson)}
                          style={{
                            width: "100%",
                            textAlign: "left",
                            marginBottom: "8px",
                            padding: "12px",
                            borderRadius: "12px",
                            border: "1px solid rgba(255,255,255,0.08)",
                            background:
                              selectedLesson.title === lesson.title
                                ? "rgba(37,99,235,0.45)"
                                : "rgba(255,255,255,0.025)",
                            color: "white",
                            cursor: "pointer",
                            fontWeight: 700,
                            fontSize: "13px",
                            lineHeight: 1.4,
                          }}
                        >
                          {lesson.title}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </aside>

          <section
            style={{
              background: "rgba(10,20,40,0.94)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "20px",
              padding: "34px",
              minHeight: "760px",
            }}
          >
            <h1 style={{ color: "white", fontSize: "34px", marginBottom: "18px", lineHeight: 1.25 }}>
              {selectedLesson.title}
            </h1>

            {selectedLesson.visual ? <ChartVisual type={selectedLesson.visual} /> : null}

            <LessonContent content={selectedLesson.content} />
          </section>
        </div>
      </div>
    </main>
  );
}