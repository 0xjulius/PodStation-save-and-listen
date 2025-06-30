import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SkeletonCard from "../components/SkeletonCard";
import logo from "../assets/huberman-logo.webp";
import logo2 from "../assets/huberman-logo-footer.avif";
import defaultpic from "../assets/default.webp";
import Footer from "../components/footer";
import HeaderInfo from "../components/header";

function HubermanFeed() {
  const [episodes, setEpisodes] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [visibleCount, setVisibleCount] = useState(9);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedEpisodes, setExpandedEpisodes] = useState(new Set());
  const [scrolled, setScrolled] = useState(false);
  const [retryAfter, setRetryAfter] = useState(0);
  const [currentPlayingIndex, setCurrentPlayingIndex] = useState(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const FAVORITES_KEY = "favoritePodcasts";

  const Heart = (props) => (
    <svg
      {...props}
      fill="currentColor"
      viewBox="0 0 24 24"
      stroke="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 
        4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3
        19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
      />
    </svg>
  );

  const HeartOff = (props) => (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 
        4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3
        19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
      />
    </svg>
  );
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];
    setFavorites(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (title) => {
    setFavorites((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  const isFavorite = (title) => favorites.includes(title);

  const [listened, setListened] = useState(() => {
    return JSON.parse(localStorage.getItem("listenedEpisodes") || "[]");
  });

  useEffect(() => {
    localStorage.setItem("listenedEpisodes", JSON.stringify(listened));
  }, [listened]);

  const toggleListened = (title) => {
    setListened((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  const isListened = (title) => listened.includes(title);

  const CheckIcon = (props) => (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M5 13l4 4L19 7" />
    </svg>
  );

  useEffect(() => {
    let timerId;

    const refreshCount =
      Number(sessionStorage.getItem("refreshCount") || 0) + 1;
    sessionStorage.setItem("refreshCount", refreshCount);

    if (refreshCount > 10) {
      setError("Too many requests. Please try again later.");
      setRetryAfter(20);
      setLoading(false);

      timerId = setInterval(() => {
        setRetryAfter((prev) => {
          if (prev <= 1) {
            clearInterval(timerId);
            setError("");
            sessionStorage.setItem("refreshCount", "0");
            setLoading(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerId) clearInterval(timerId);
      };
    }

    const fetchFeed = async () => {
      try {
        const [response] = await Promise.all([
          fetch("api/huberman-feed"),
          new Promise((resolve) => setTimeout(resolve, 1500)),
        ]);

        if (response.status === 429) {
          setError("Too many requests. Please try again later.");
          setRetryAfter(60);
          setLoading(false);

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

        if (!response.ok) {
          let message = "Failed to load podcast feed.";
          try {
            const errorData = await response.json();
            if (errorData?.error) message = errorData.error;
          } catch (_) {}
          throw new Error(message);
        }

        const text = await response.text();
        const parser = new DOMParser();
        const xml = parser.parseFromString(text, "application/xml");

        const items = Array.from(xml.querySelectorAll("item"));

        const parsedEpisodes = items.map((item) => {
          const get = (selector) =>
            item.querySelector(selector)?.textContent || "";
          const getAttr = (selector, attr) =>
            item.querySelector(selector)?.getAttribute(attr) || "";

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

    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, []);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const filteredEpisodes = useMemo(() => {
    const base = episodes.filter((ep) =>
      ep.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return showFavoritesOnly
      ? base.filter((ep) => favorites.includes(ep.title))
      : base;
  }, [searchTerm, episodes, favorites, showFavoritesOnly]);

  const visibleEpisodes = filteredEpisodes.slice(0, visibleCount);

  const toggleDescription = (index) => {
    setExpandedEpisodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) newSet.delete(index);
      else newSet.add(index);
      return newSet;
    });
  };

  useEffect(() => {
    if (currentPlayingIndex === null) return;
    const ep = visibleEpisodes[currentPlayingIndex];
    if (!ep) return;

    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: ep.title,
        artist: "Huberman Lab",
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
    <div className="lb-body text-black min-h-screen flex flex-col p-6 font-sans">
      <header className="sticky top-0 bg-black bg-opacity-90 backdrop-blur-md p-4 rounded-b-xl z-20 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center">
            <motion.img
              src={logo}
              alt="Logo"
              className="rounded mr-4 hidden lg:block"
              animate={{
                width: scrolled ? 75 : 170,
                height: scrolled ? 75 : 170,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
            <motion.img
              src={logo2}
              alt="Logo"
              className="lg:m-4"
              animate={{
                width: scrolled ? 161 : 322,
                height: scrolled ? 40 : 80,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          </div>

          <div className="flex gap-2 items-center">
            <button
              onClick={() => setShowFavoritesOnly((prev) => !prev)}
              className={`px-4 rounded-2xl bg-orange-500 text-sm font-semibold transition h-10 ${
                showFavoritesOnly
                  ? "bg-orange-600  hover:bg-zinc-700 cursor-pointer"
                  : "bg-zinc-900 text-red-400 cursor-pointer hover:bg-zinc-700"
              }`}
            >
              {showFavoritesOnly ? (
                <Heart className="h-7 w-7" />
              ) : (
                <HeartOff className="h-7 w-7" />
              )}
            </button>
            <input
              type="search"
              placeholder="Search episodes..."
              className="px-4 py-2 rounded-2xl bg-zinc-900 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition w-full sm:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search episodes"
            />
          </div>
        </div>
      </header>
      <HeaderInfo
        className="mb-6"
        title="Welcome to Huberman Hub"
        subtitle="Andrew Huberman, Ph.D., is a neuroscientist and tenured professor in the department of neurobiology, and by courtesy, psychiatry and behavioral sciences at Stanford School of Medicine."
      />

      <AnimatePresence>
        {loading && (
          <motion.div
            key="loading-overlay"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 flex flex-col items-center justify-center backdrop-blur-sm bg-opacity-30 z-50"
            aria-live="polite"
            aria-busy="true"
          >
            <img
              src={logo2}
              alt="Loading..."
              className="mb-4"
              aria-label="Loading animation"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {error && <p className="text-red-500">{error}</p>}

      {retryAfter > 0 && (
        <p className="text-yellow-400 mb-4">
          Please wait {retryAfter} second{retryAfter !== 1 ? "s" : ""} before
          refreshing the site.
        </p>
      )}

      <div className="flex-grow">
        <AnimatePresence>
          {showFavoritesOnly && favorites.length === 0 && !loading ? (
            <p className="text-center text-orange-400 mt-10 text-lg">
              No favorites yet. Add some by clicking the heart!
            </p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(loading || filteredEpisodes.length === 0) && !showFavoritesOnly
                ? Array.from({ length: 3 }).map((_, idx) => (
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
                      className={`bg-black p-4 rounded-2xl shadow-lg flex flex-col transition-all duration-300  ${
                        isListened(ep.title)
                          ? "opacity-50 grayscale brightness-50 "
                          : ""
                      }`}
                    >
                      <img
                        src={defaultpic || ep.image}
                        alt={ep.title}
                        className="rounded-xl mb-4 w-full aspect-square object-cover"
                        loading="lazy"
                      />

                      <div className="flex justify-between items-center mb-1">
                        <h2 className="text-xl font-semibold mb-1 title-lb">
                          {ep.title}
                        </h2>

                        <div className="flex items-center gap-3">
                          <motion.button
                            onClick={() => toggleListened(ep.title)}
                            title="Mark as Listened"
                            whileTap={{ scale: 0.9 }}
                          >
                            <CheckIcon
                              className={`h-9 w-9 ${
                                isListened(ep.title)
                                  ? "text-green-400 cursor-pointer transition duration-300 ease-in-out"
                                  : "text-zinc-600 cursor-pointer hover:text-green-400 transition duration-300 ease-in-out"
                              }`}
                            />
                          </motion.button>

                          <motion.button
                            onClick={() => toggleFavorite(ep.title)}
                            title="Toggle Favorite"
                            whileTap={{ scale: 0.9 }}
                          >
                            {isFavorite(ep.title) ? (
                              <Heart className="text-orange-500 h-7 w-7 cursor-pointer transition duration-300 ease-in-out" />
                            ) : (
                              <HeartOff className="text-zinc-600 h-7 w-7 cursor-pointer hover:text-red-400 transition duration-300 ease-in-out" />
                            )}
                          </motion.button>
                        </div>
                      </div>

                      {ep.description && (
                        <>
                          <AnimatePresence>
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                              className="overflow-hidden text-md text-zinc-400 space-y-2"
                            >
                              <div
                                className={`w-full max-w-full break-words text-md text-zinc-400 ${
                                  !expandedEpisodes.has(index)
                                    ? "truncate-two-lines"
                                    : ""
                                }`}
                                dangerouslySetInnerHTML={{
                                  __html: ep.description,
                                }}
                              />
                              <button
                                onClick={() => toggleDescription(index)}
                                className="text-sm text-orange-400 hover:underline self-start mb-2 focus:outline-none cursor-pointer"
                                aria-expanded={expandedEpisodes.has(index)}
                              >
                                {expandedEpisodes.has(index)
                                  ? "Hide Description"
                                  : "Show more"}
                              </button>

                              {expandedEpisodes.has(index) && (
                                <p className="text-xs text-white italic max-w-screen mb-4">
                                  Disclaimer: I do not own, control, or profit
                                  from any referral or affiliate links that may
                                  appear in episode descriptions. These links
                                  are part of the original third-party podcast
                                  feed and are displayed automatically without
                                  modification.
                                </p>
                              )}
                            </motion.div>
                          </AnimatePresence>
                        </>
                      )}

                      <p className="text-sm text-zinc-400 mb-2">{ep.pubDate}</p>

                      <div className="flex justify-between items-center mb-2">
                        <audio
                          controls
                          controlsList="nodownload"
                          src={ep.audioUrl}
                          className="w-full"
                          onPlay={() => setCurrentPlayingIndex(index)}
                        />
                      </div>
                    </motion.div>
                  ))}
            </div>
          )}
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
      <Footer />
    </div>
  );
}

export default HubermanFeed;
