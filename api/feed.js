// api/feed.js

export default async function handler(req, res) {
  const FEED_URL = "https://feeds.megaphone.fm/GLT1412515089";

  try {
    const response = await fetch(FEED_URL);
    if (!response.ok) {
      throw new Error("Failed to fetch feed");
    }

    const xml = await response.text();

    // Optional: Cache headers (e.g., 10 minutes)
    res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=59");
    res.setHeader("Content-Type", "application/xml");
    res.status(200).send(xml);
  } catch (error) {
    console.error("Proxy error:", error);
    res.status(500).json({ error: "Failed to fetch feed" });
  }
}
