# Auto patch for app/dashboard/page.tsx
# Adds company autocomplete using /api/search-symbol?q=

$ErrorActionPreference = "Stop"

$file = "app/dashboard/page.tsx"

if (!(Test-Path $file)) {
  Write-Host "ERROR: Cannot find $file. Run this script from the project root folder." -ForegroundColor Red
  exit 1
}

$content = Get-Content $file -Raw

if ($content -match "type SearchSuggestion") {
  Write-Host "Autocomplete already appears to be installed. No changes made." -ForegroundColor Yellow
  exit 0
}

# 1) Add type SearchSuggestion
$old = @'
type NewsItem = {
  title: string;
  source: string;
  category: NewsCategory;
  url: string;
  summary: string;
  tag: string;
};
'@

$new = @'
type NewsItem = {
  title: string;
  source: string;
  category: NewsCategory;
  url: string;
  summary: string;
  tag: string;
};

type SearchSuggestion = {
  symbol: string;
  name: string;
  exchange?: string | null;
  type?: string | null;
};
'@

if (!$content.Contains($old)) {
  Write-Host "ERROR: Could not find NewsItem type block." -ForegroundColor Red
  exit 1
}
$content = $content.Replace($old, $new)

# 2) Add autocomplete states after ticker state
$old = @'
  const [ticker, setTicker] = useState<string>("");
  const [stockResult, setStockResult] = useState<StockResult | null>(null);
'@

$new = @'
  const [ticker, setTicker] = useState<string>("");
  const [searchSuggestions, setSearchSuggestions] = useState<SearchSuggestion[]>([]);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState<number>(-1);
  const [stockResult, setStockResult] = useState<StockResult | null>(null);
'@

if (!$content.Contains($old)) {
  Write-Host "ERROR: Could not find ticker state block." -ForegroundColor Red
  exit 1
}
$content = $content.Replace($old, $new)

# 3) Add autocomplete effect after cleanedTicker memo
$old = @'
  const cleanedTicker = useMemo(() => ticker.trim().toUpperCase(), [ticker]);
  const isLikelyCrypto = useMemo(() => KNOWN_CRYPTO_SYMBOLS.has(cleanedTicker), [cleanedTicker]);
'@

$new = @'
  const cleanedTicker = useMemo(() => ticker.trim().toUpperCase(), [ticker]);
  const isLikelyCrypto = useMemo(() => KNOWN_CRYPTO_SYMBOLS.has(cleanedTicker), [cleanedTicker]);

  useEffect(() => {
    const query = ticker.trim();

    if (query.length < 2) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
      return;
    }

    let cancelled = false;

    const timer = setTimeout(async () => {
      try {
        setSearchLoading(true);

        const res = await fetch(`/api/search-symbol?q=${encodeURIComponent(query)}`, {
          cache: "no-store",
        });

        const data = await res.json();

        if (cancelled) return;

        if (!res.ok || data?.error || !Array.isArray(data)) {
          setSearchSuggestions([]);
          setShowSuggestions(false);
          return;
        }

        setSearchSuggestions(data.slice(0, 8));
        setShowSuggestions(data.length > 0);
        setSelectedSuggestionIndex(-1);
      } catch (error) {
        if (!cancelled) {
          console.error("SEARCH SUGGESTIONS ERROR:", error);
          setSearchSuggestions([]);
          setShowSuggestions(false);
        }
      } finally {
        if (!cancelled) {
          setSearchLoading(false);
        }
      }
    }, 280);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [ticker]);
'@

if (!$content.Contains($old)) {
  Write-Host "ERROR: Could not find cleanedTicker block." -ForegroundColor Red
  exit 1
}
$content = $content.Replace($old, $new)

# 4) Add handler after handleQuickSelect
$old = @'
  const handleQuickSelect = async (symbol: string) => {
    if (analyzing || loading) return;
    setTicker(symbol);
    await handleAnalyze(symbol);
  };
'@

$new = @'
  const handleQuickSelect = async (symbol: string) => {
    if (analyzing || loading) return;
    setTicker(symbol);
    await handleAnalyze(symbol);
  };

  const handleSuggestionSelect = async (suggestion: SearchSuggestion) => {
    if (analyzing || loading) return;

    setTicker(suggestion.symbol);
    setShowSuggestions(false);
    setSearchSuggestions([]);
    setSelectedSuggestionIndex(-1);

    await handleAnalyze(suggestion.symbol);
  };
'@

if (!$content.Contains($old)) {
  Write-Host "ERROR: Could not find handleQuickSelect block." -ForegroundColor Red
  exit 1
}
$content = $content.Replace($old, $new)

# 5) Replace search card JSX
$old = @'
        <div style={styles.searchCard}>
          <input
            type="text"
            placeholder="Enter a stock ticker or crypto symbol, for example AAPL or BTC"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !analyzing && !loading) {
                e.preventDefault();
                handleAnalyze();
              }
            }}
            style={styles.input}
          />

          <button
            style={styles.primaryButton}
            onClick={() => handleAnalyze()}
            disabled={analyzing || loading}
          >
            {analyzing ? "Analyzing..." : "Analyze"}
          </button>
        </div>
'@

$new = @'
        <div style={styles.searchCard}>
          <div style={styles.searchInputWrap}>
            <input
              type="text"
              placeholder="Search company or ticker, for example Mercedes, BMW, Apple, Nvidia, BTC"
              value={ticker}
              onChange={(e) => {
                setTicker(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => {
                if (searchSuggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setSelectedSuggestionIndex((prev) =>
                    Math.min(prev + 1, searchSuggestions.length - 1)
                  );
                  return;
                }

                if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setSelectedSuggestionIndex((prev) => Math.max(prev - 1, -1));
                  return;
                }

                if (e.key === "Escape") {
                  setShowSuggestions(false);
                  setSelectedSuggestionIndex(-1);
                  return;
                }

                if (e.key === "Enter" && !analyzing && !loading) {
                  e.preventDefault();

                  const selected =
                    selectedSuggestionIndex >= 0
                      ? searchSuggestions[selectedSuggestionIndex]
                      : null;

                  if (selected) {
                    handleSuggestionSelect(selected);
                    return;
                  }

                  setShowSuggestions(false);
                  handleAnalyze();
                }
              }}
              style={styles.input}
            />

            {showSuggestions && ticker.trim().length >= 2 ? (
              <div style={styles.suggestionsBox}>
                <div style={styles.suggestionsHeader}>
                  {searchLoading ? "Searching..." : "Company suggestions"}
                </div>

                {searchSuggestions.length > 0 ? (
                  searchSuggestions.map((item, index) => (
                    <button
                      key={`${item.symbol}-${index}`}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSuggestionSelect(item);
                      }}
                      style={{
                        ...styles.suggestionItem,
                        ...(selectedSuggestionIndex === index
                          ? styles.suggestionItemActive
                          : {}),
                      }}
                    >
                      <div style={styles.suggestionMain}>
                        <span style={styles.suggestionSymbol}>{item.symbol}</span>
                        <span style={styles.suggestionName}>{item.name}</span>
                      </div>

                      <div style={styles.suggestionMeta}>
                        {item.exchange || item.type || "Equity"}
                      </div>
                    </button>
                  ))
                ) : (
                  <div style={styles.suggestionEmpty}>
                    {searchLoading ? "Loading results..." : "No suggestions found"}
                  </div>
                )}
              </div>
            ) : null}
          </div>

          <button
            style={styles.primaryButton}
            onClick={() => {
              setShowSuggestions(false);
              handleAnalyze();
            }}
            disabled={analyzing || loading}
          >
            {analyzing ? "Analyzing..." : "Analyze"}
          </button>
        </div>
'@

if (!$content.Contains($old)) {
  Write-Host "ERROR: Could not find searchCard JSX block." -ForegroundColor Red
  exit 1
}
$content = $content.Replace($old, $new)

# 6) Add styles after searchCard style
$old = @'
  searchCard: {
    display: "flex",
    gap: "14px",
    background: "rgba(10, 20, 40, 0.92)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "20px",
    padding: "14px 18px",
    boxShadow: "0 18px 40px rgba(0,0,0,0.35)",
    marginBottom: "12px",
    flexWrap: "wrap",
  },
'@

$new = @'
  searchCard: {
    display: "flex",
    gap: "14px",
    background: "rgba(10, 20, 40, 0.92)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "20px",
    padding: "14px 18px",
    boxShadow: "0 18px 40px rgba(0,0,0,0.35)",
    marginBottom: "12px",
    flexWrap: "wrap",
  },
  searchInputWrap: {
    position: "relative",
    flex: 1,
    minWidth: "260px",
  },
  suggestionsBox: {
    position: "absolute",
    top: "calc(100% + 8px)",
    left: 0,
    right: 0,
    zIndex: 20,
    background: "#0f172a",
    border: "1px solid rgba(148,163,184,0.28)",
    borderRadius: "14px",
    boxShadow: "0 22px 60px rgba(0,0,0,0.45)",
    overflow: "hidden",
  },
  suggestionsHeader: {
    color: "#94a3b8",
    fontSize: "11px",
    fontWeight: 800,
    letterSpacing: "0.4px",
    padding: "10px 12px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(255,255,255,0.025)",
  },
  suggestionItem: {
    width: "100%",
    background: "transparent",
    border: "none",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    padding: "11px 12px",
    textAlign: "left",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
  },
  suggestionItemActive: {
    background: "rgba(37,99,235,0.22)",
  },
  suggestionMain: {
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: "3px",
  },
  suggestionSymbol: {
    color: "white",
    fontSize: "14px",
    fontWeight: 900,
  },
  suggestionName: {
    color: "#cbd5e1",
    fontSize: "12px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "520px",
  },
  suggestionMeta: {
    color: "#93c5fd",
    fontSize: "11px",
    fontWeight: 800,
    flexShrink: 0,
    textAlign: "right",
  },
  suggestionEmpty: {
    color: "#94a3b8",
    fontSize: "13px",
    padding: "14px 12px",
  },
'@

if (!$content.Contains($old)) {
  Write-Host "ERROR: Could not find searchCard styles block." -ForegroundColor Red
  exit 1
}
$content = $content.Replace($old, $new)

Set-Content -Path $file -Value $content -Encoding UTF8

Write-Host "SUCCESS: Autocomplete added to app/dashboard/page.tsx" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1) npm run build"
Write-Host "2) git add ."
Write-Host "3) git commit -m `"Add stock search autocomplete`""
Write-Host "4) git push"
