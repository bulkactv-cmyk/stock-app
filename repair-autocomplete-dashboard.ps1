# Force patch autocomplete UI for app/dashboard/page.tsx
# Safe to run even if the previous patch was partial.

$ErrorActionPreference = "Stop"
$file = "app/dashboard/page.tsx"

if (!(Test-Path $file)) {
  Write-Host "ERROR: Cannot find $file. Run this from the stock-app root folder." -ForegroundColor Red
  exit 1
}

$content = Get-Content $file -Raw

function Add-After-If-Missing {
  param(
    [string]$Content,
    [string]$Needle,
    [string]$Insert,
    [string]$Check
  )

  if ($Content.Contains($Check)) {
    return $Content
  }

  if (!$Content.Contains($Needle)) {
    throw "Could not find marker: $Needle"
  }

  return $Content.Replace($Needle, $Needle + $Insert)
}

function Replace-Block {
  param(
    [string]$Content,
    [string]$Old,
    [string]$New,
    [string]$Check
  )

  if ($Content.Contains($Check)) {
    return $Content
  }

  if (!$Content.Contains($Old)) {
    throw "Could not find block to replace."
  }

  return $Content.Replace($Old, $New)
}

# 1) Type
$content = Add-After-If-Missing `
  -Content $content `
  -Needle @'
type NewsItem = {
  title: string;
  source: string;
  category: NewsCategory;
  url: string;
  summary: string;
  tag: string;
};
'@ `
  -Insert @'


type SearchSuggestion = {
  symbol: string;
  name: string;
  exchange?: string | null;
  type?: string | null;
};
'@ `
  -Check "type SearchSuggestion ="

# 2) States
$content = Replace-Block `
  -Content $content `
  -Old @'
  const [ticker, setTicker] = useState<string>("");
  const [stockResult, setStockResult] = useState<StockResult | null>(null);
'@ `
  -New @'
  const [ticker, setTicker] = useState<string>("");
  const [searchSuggestions, setSearchSuggestions] = useState<SearchSuggestion[]>([]);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState<number>(-1);
  const [stockResult, setStockResult] = useState<StockResult | null>(null);
'@ `
  -Check "const [searchSuggestions, setSearchSuggestions]"

# 3) Effect
$content = Replace-Block `
  -Content $content `
  -Old @'
  const cleanedTicker = useMemo(() => ticker.trim().toUpperCase(), [ticker]);
  const isLikelyCrypto = useMemo(() => KNOWN_CRYPTO_SYMBOLS.has(cleanedTicker), [cleanedTicker]);
'@ `
  -New @'
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
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [ticker]);
'@ `
  -Check "SEARCH SUGGESTIONS ERROR"

# 4) Handler
$content = Replace-Block `
  -Content $content `
  -Old @'
  const handleQuickSelect = async (symbol: string) => {
    if (analyzing || loading) return;
    setTicker(symbol);
    await handleAnalyze(symbol);
  };
'@ `
  -New @'
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
'@ `
  -Check "const handleSuggestionSelect = async"

# 5) Search JSX — force replace old OR previously partial searchCard
$oldSearch = @'
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

$newSearch = @'
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

if (!$content.Contains("styles.suggestionsBox")) {
  if ($content.Contains($oldSearch)) {
    $content = $content.Replace($oldSearch, $newSearch)
  } else {
    throw "Could not find old search JSX block. Send dashboard/page.tsx again."
  }
}

# 6) Styles
$oldStyles = @'
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

$newStyles = @'
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
    overflow: "visible",
  },
  searchInputWrap: {
    position: "relative",
    flex: 1,
    minWidth: "260px",
    overflow: "visible",
  },
  suggestionsBox: {
    position: "absolute",
    top: "calc(100% + 8px)",
    left: 0,
    right: 0,
    zIndex: 9999,
    background: "#0f172a",
    border: "1px solid rgba(148,163,184,0.35)",
    borderRadius: "14px",
    boxShadow: "0 22px 60px rgba(0,0,0,0.55)",
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

if (!$content.Contains("suggestionSymbol:")) {
  if ($content.Contains($oldStyles)) {
    $content = $content.Replace($oldStyles, $newStyles)
  } else {
    throw "Could not find searchCard styles block."
  }
}

Set-Content -Path $file -Value $content -Encoding UTF8

Write-Host "SUCCESS: Autocomplete UI installed or repaired." -ForegroundColor Green
Write-Host "Now run: npm run build" -ForegroundColor Cyan
