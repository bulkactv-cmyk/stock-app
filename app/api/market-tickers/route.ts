export async function GET() {
  const apiKey = process.env.FMP_API_KEY;

  if (!apiKey) {
    return Response.json({
      error: "Missing FMP_API_KEY"
    });
  }

  const url = `https://financialmodelingprep.com/stable/batch-index-quotes?apikey=${apiKey}`;

  try {
    const response = await fetch(url, { cache: "no-store" });
    const text = await response.text();

    return new Response(text, {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    return Response.json({
      error: "Fetch failed",
      details: String(error)
    });
  }
}