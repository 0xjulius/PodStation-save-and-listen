// api/feed.js

let requests = {};

export default async function handler(req, res) {
  const FEED_URL = "https://feeds.megaphone.fm/thispastweekendw";
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  const now = Date.now();

  // Clear old entries every request (TTL: 60s)
  const windowMs = 60 * 1000;
  const limit = 5;

  // Clean up expired IPs
  Object.keys(requests).forEach((ipKey) => {
    if (now - requests[ipKey].startTime > windowMs) {
      delete requests[ipKey];
    }
  });

  if (!requests[ip]) {
    requests[ip] = { count: 1, startTime: now };
  } else {
    requests[ip].count += 1;
  }

  if (requests[ip].count > limit) {
    return res
      .status(429)
      .json({ error: "Too many requests. Please try again later." });
  }

  try {
    const response = await fetch(FEED_URL);
    if (!response.ok) {
      throw new Error("Failed to fetch feed");
    }

    const xml = await response.text();

    // Optional: Cache headers (10 minutes)
    res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=59");
    res.setHeader("Content-Type", "application/xml");
    res.status(200).send(xml);
  } catch (error) {
    console.error("Proxy error:", error);
    res.status(500).json({ error: "Failed to fetch feed" });
  }
}
