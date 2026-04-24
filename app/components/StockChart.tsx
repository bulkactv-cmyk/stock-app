"use client";

import { useEffect, useRef } from "react";

type StockChartProps = {
  symbol: string;
};

declare global {
  interface Window {
    TradingView?: {
      widget: new (config: Record<string, unknown>) => void;
    };
  }
}

export default function StockChart({ symbol }: StockChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef(`tv_chart_${Math.random().toString(36).slice(2, 11)}`);

  useEffect(() => {
    if (!containerRef.current || !symbol) return;

    containerRef.current.innerHTML = "";

    const widgetContainer = document.createElement("div");
    widgetContainer.id = widgetIdRef.current;
    widgetContainer.style.height = "100%";
    widgetContainer.style.width = "100%";
    containerRef.current.appendChild(widgetContainer);

    const createWidget = () => {
      if (!window.TradingView) return;

      new window.TradingView.widget({
        autosize: true,
        symbol: symbol,
        interval: "D",
        timezone: "Etc/UTC",
        theme: "dark",
        style: "1",
        locale: "bg",
        withdateranges: true,
        hide_side_toolbar: false,
        allow_symbol_change: false,
        details: false,
        hotlist: false,
        calendar: false,
        studies: [],
        container_id: widgetIdRef.current,
      });
    };

    const existingScript = document.querySelector(
      'script[src="https://s3.tradingview.com/tv.js"]'
    ) as HTMLScriptElement | null;

    if (existingScript && window.TradingView) {
      createWidget();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = () => createWidget();
    document.body.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [symbol]);

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "16px",
        padding: "14px",
        height: "420px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          color: "white",
          fontSize: "22px",
          fontWeight: 800,
          marginBottom: "12px",
        }}
      >
        Графика
      </div>

      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "350px",
        }}
      />
    </div>
  );
}