export default async function handler(req, res) {
  const YOUTUBE_CHANNEL_ID = "UCzQUP1qoWDoEbmsQxvdjxgQ";
  const youtubeFeedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${YOUTUBE_CHANNEL_ID}`;

  try {
    const response = await fetch(youtubeFeedUrl);
    if (!response.ok) {
      throw new Error("Failed to fetch YouTube feed");
    }

    const xml = await response.text();
    res.setHeader("Content-Type", "application/xml");
    res.status(200).send(xml);
  } catch (error) {
    res.status(500).json({ error: error.message || "Unknown error" });
  }
}
