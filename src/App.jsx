import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SkeletonCard from "./components/SkeletonCard";
import logo from "./assets/logo.png";

function App() {
  // alustetaan useState-hookeilla kaikki tarvittavat tilamuuttujat
  const [episodes, setEpisodes] = useState([]); // kaikki jaksot
  const [visibleCount, setVisibleCount] = useState(9); // näkyvien jaksojen määrä
  const [loading, setLoading] = useState(true); // lataustila
  const [error, setError] = useState(""); // mahdollinen virheteksti
  const [searchTerm, setSearchTerm] = useState(""); // hakukentän arvo
  const [expandedEpisodes, setExpandedEpisodes] = useState(new Set()); // mitkä jaksot ovat auki
  const [scrolled, setScrolled] = useState(false); // onko sivua vieritetty
  const [retryAfter, setRetryAfter] = useState(0); // odotusaika jos tulee liikaa pyyntöjä
  const [currentPlayingIndex, setCurrentPlayingIndex] = useState(null); // mikä jakso on käynnissä

  useEffect(() => {
    let timerId;

    // haetaan podcast-feedi palvelimelta
    const fetchFeed = async () => {
      try {
        const [response] = await Promise.all([
          fetch("/api/feed"),
          new Promise((resolve) => setTimeout(resolve, 2000)), //skeletoncard flex while loading
        ]);

        // jos pyyntöjä on liikaa, asetetaan virhe ja odotusaika
        if (response.status === 429) {
          setError("Too many requests. Please try again later.");
          setRetryAfter(60);

          // käynnistetään sekuntikello joka laskee odotusaikaa
          timerId = setInterval(() => {
            setRetryAfter((prev) => {
              if (prev <= 1) {
                clearInterval(timerId);
                setError("");
                return 0;
              }
              return prev - 1;
            });
          }, 1000);

          return;
        }

        // jos vastaus ei ole ok, yritetään hakea virheviesti
        if (!response.ok) {
          let message = "Failed to load podcast feed.";
          try {
            const errorData = await response.json();
            if (errorData?.error) message = errorData.error;
          } catch (_) {}
          throw new Error(message);
        }

        // parsitaan xml-feed
        const text = await response.text();
        const parser = new DOMParser();
        const xml = parser.parseFromString(text, "application/xml");

        const items = Array.from(xml.querySelectorAll("item"));

        // muunnetaan xml-jaksot json-muotoon
        const parsedEpisodes = items.map((item) => {
          const get = (selector) =>
            item.querySelector(selector)?.textContent || "";
          const getAttr = (selector, attr) =>
            item.querySelector(selector)?.getAttribute(attr) || "";

          // haetaan kuvan url eri nimialueista
          const getImage = (item) => {
            const itunesNS = "http://www.itunes.com/dtds/podcast-1.0.dtd";
            const mediaNS = "http://search.yahoo.com/mrss/";

            const itunesImage = item.getElementsByTagNameNS(
              itunesNS,
              "image"
            )[0];
            if (itunesImage && itunesImage.getAttribute("href")) {
              return itunesImage.getAttribute("href");
            }

            const mediaContent = item.getElementsByTagNameNS(
              mediaNS,
              "content"
            )[0];
            if (mediaContent && mediaContent.getAttribute("url")) {
              return mediaContent.getAttribute("url");
            }

            return "https://via.placeholder.com/300x300?text=No+Image";
          };

          // palautetaan jakson tiedot objektina
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

        // asetetaan ladatut jaksot tilaan
        setEpisodes(parsedEpisodes);
        setError("");
      } catch (err) {
        console.error("Error loading feed:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFeed();

    // jos komponentti poistetaan, tyhjennetään ajastin
    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, []);

  // seurataan vieritystä headerin pienentämistä varten
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // suodatetaan jaksot haun perusteella
  const filteredEpisodes = useMemo(() => {
    if (!searchTerm.trim()) return episodes;
    return episodes.filter((ep) =>
      ep.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, episodes]);

  // näytetään vain osa suodatetuista jaksoista
  const visibleEpisodes = filteredEpisodes.slice(0, visibleCount);

  // näytetään/piilotetaan jakson kuvaus
  const toggleDescription = (index) => {
    setExpandedEpisodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) newSet.delete(index);
      else newSet.add(index);
      return newSet;
    });
  };

  // media session api päivittää toistettavan jakson tiedot
  useEffect(() => {
    if (currentPlayingIndex === null) return;
    const ep = visibleEpisodes[currentPlayingIndex];
    if (!ep) return;

    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: ep.title,
        artist: "Joe Rogan Experience",
        album: `Episode ${currentPlayingIndex + 1}`,
        artwork: [{ src: ep.image, sizes: "512x512", type: "image/png" }],
      });

      navigator.mediaSession.setActionHandler("play", () => {
        const audioElems = document.querySelectorAll("audio");
        if (audioElems[currentPlayingIndex])
          audioElems[currentPlayingIndex].play();
      });
      navigator.mediaSession.setActionHandler("pause", () => {
        const audioElems = document.querySelectorAll("audio");
        if (audioElems[currentPlayingIndex])
          audioElems[currentPlayingIndex].pause();
      });
    }
  }, [currentPlayingIndex, visibleEpisodes]);

  return (
    <div className="bg-black text-white min-h-screen flex flex-col p-6 font-sans">
      <header className="sticky top-0 bg-black bg-opacity-90 backdrop-blur-md p-4 rounded-b-xl z-20 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center">
            <motion.img
              src={logo}
              alt="Logo"
              className="rounded mr-4"
              animate={{
                width: scrolled ? 75 : 170,
                height: scrolled ? 75 : 170,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
            <h1 className="text-xl font-bold select-none lg:text-3xl title-gradient">
              THE JOE ROGAN EXPERIENCE.
            </h1>
          </div>

          <input
            type="search"
            placeholder="Search episodes..."
            className="px-4 py-2 rounded-2xl bg-zinc-900 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition w-full sm:w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search episodes"
          />
        </div>
      </header>

      {loading && <p className="text-zinc-400">Loading episodes...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {retryAfter > 0 && (
        <p className="text-yellow-400 mb-4">
          Please wait {retryAfter} second{retryAfter !== 1 ? "s" : ""} before
          retrying.
        </p>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 flex-grow">
        <AnimatePresence>
          {loading || filteredEpisodes.length === 0
            ? Array.from({ length: 9 }).map((_, idx) => (
                <SkeletonCard key={`skeleton-${idx}`} />
              ))
            : visibleEpisodes.map((ep, index) => (
                <motion.div
                  key={ep.audioUrl || index}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="bg-zinc-900 p-4 rounded-2xl shadow-lg flex flex-col"
                >
                  <img
                    src={ep.image}
                    alt={ep.title}
                    className="rounded-xl mb-4 w-full aspect-square object-cover"
                    loading="lazy"
                  />
                  <h2 className="text-xl font-semibold mb-1">{ep.title}</h2>
                  <p className="text-sm text-zinc-400 mb-2">{ep.pubDate}</p>
                  <audio
                    controls
                    controlsList="nodownload"
                    src={ep.audioUrl}
                    className="w-full mb-2"
                    onPlay={() => setCurrentPlayingIndex(index)}
                  />
                  {ep.description && (
                    <>
                      <button
                        onClick={() => toggleDescription(index)}
                        className="text-sm text-orange-400 hover:underline self-start mb-2 focus:outline-none"
                        aria-expanded={expandedEpisodes.has(index)}
                      >
                        {expandedEpisodes.has(index)
                          ? "Hide Description"
                          : "Show Description"}
                      </button>

                      <AnimatePresence>
                        {expandedEpisodes.has(index) && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden text-md text-zinc-400 space-y-2"
                          >
                            <div
                              dangerouslySetInnerHTML={{
                                __html: ep.description,
                              }}
                            />
                            <p className="text-xs text-orange-600 italic">
                              Disclaimer: I do not own, control, or profit from
                              any referral or affiliate links that may appear in
                              episode descriptions. These links are part of the
                              original third-party podcast feed and are
                              displayed automatically without modification.
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  )}
                </motion.div>
              ))}
        </AnimatePresence>
      </div>

      {visibleCount < filteredEpisodes.length && (
        <div className="flex justify-center mt-8">
          <button
            onClick={() => setVisibleCount((c) => c + 9)}
            className="cursor-pointer px-8 py-3 bg-orange-600 rounded-full font-semibold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400"
            disabled={retryAfter > 0}
          >
            Load More
          </button>
        </div>
      )}

      <footer className="mt-12 py-6 border-t border-gray-700 text-center text-zinc-400 text-sm select-none">
        <p className="mt-2">
          <a
            href="https://www.joerogan.com/"
            target="_blank"
            rel="noreferrer"
            className="mx-2 hover:text-orange-400 text-white "
            aria-label="Official JRE Site"
          >
            Official Site
          </a>{" "}
          |{" "}
          <a
            href="https://juliusaalto.com"
            target="_blank"
            rel="noreferrer"
            className="mx-2 hover:text-orange-400 text-white "
            aria-label="My Website"
          >
            My Website
          </a>{" "}
          |{" "}
          <a
            href="https://github.com/0xjulius"
            target="_blank"
            rel="noreferrer"
            className="mx-2 hover:text-orange-400 text-white "
            aria-label="GitHub"
          >
            GitHub
          </a>
        </p>

        <p className="mt-4 text-xs text-zinc-400">
          This website is not affiliated with or endorsed by the Joe Rogan
          Experience, Megaphone, or any related entities.
          <br />
          All podcast content, including descriptions and media, is the property
          of their respective owners and shown here for educational,
          non-commercial purposes only.
        </p>
        <p>
          <br />
          <p className="mb-8 text-xs text-orange-400">
            <strong className="text-zinc-400">Disclaimer:</strong> I do not own,
            control, or profit from any referral or affiliate links that may
            appear in this site. These links are part of the original
            third-party podcast feed and are included automatically for
            educational purposes only.
          </p>
          Podcast data from{" "}
          <a
            href="https://megaphone.fm/"
            target="_blank"
            rel="noreferrer"
            className="text-orange-400 hover:underline"
          >
            Megaphone
          </a>
          . Built with React & Tailwind CSS.
        </p>
      </footer>
    </div>
  );
}

export default App;
