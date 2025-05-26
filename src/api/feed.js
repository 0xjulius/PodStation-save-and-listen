let cachedFeed = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 300 * 1000; // 5 minutes in milliseconds

export default async function handler(req, res) {
  const FEED_URL = "https://feeds.megaphone.fm/GLT1412515089";

  // Check if cached feed is still valid
  if (cachedFeed && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return res.status(200).json(cachedFeed);
  }

  try {
    const response = await fetch(FEED_URL);
    if (!response.ok) {
      return res
        .status(response.status)
        .json({ error: "Failed to fetch feed" });
    }

    const text = await response.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, "application/xml");
    const items = Array.from(xml.querySelectorAll("item"));

    const parsedEpisodes = items.map((item) => {
      const get = (selector) => item.querySelector(selector)?.textContent || "";
      const getAttr = (selector, attr) =>
        item.querySelector(selector)?.getAttribute(attr) || "";

      const getImage = (item) => {
        const itunesNS = "http://www.itunes.com/dtds/podcast-1.0.dtd";
        const mediaNS = "http://search.yahoo.com/mrss/";

        const itunesImage = item.getElementsByTagNameNS(itunesNS, "image")[0];
        if (itunesImage && itunesImage.getAttribute("href")) {
          return itunesImage.getAttribute("href");
        }

        const mediaContent = item.getElementsByTagNameNS(mediaNS, "content")[0];
        if (mediaContent && mediaContent.getAttribute("url")) {
          return mediaContent.getAttribute("url");
        }

        return "https://via.placeholder.com/300x300?text=No+Image";
      };

      return {
        title: get("title"),
        description: get("description"),
        pubDate: new Date(get("pubDate")).toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
        duration: get("itunes\\:duration"),
        audioUrl: getAttr("enclosure", "url"),
        image: getImage(item),
      };
    });

    cachedFeed = parsedEpisodes;
    cacheTimestamp = Date.now();

    res.status(200).json(parsedEpisodes);
  } catch (error) {
    console.error("Error loading feed:", error);
    res.status(500).json({ error: "Failed to load podcast feed." });
  }
}
