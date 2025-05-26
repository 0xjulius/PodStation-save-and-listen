import { useEffect, useState, useMemo } from "react"; // tuodaan react-hookit ja framer-motion -kirjasto
import { motion, AnimatePresence } from "framer-motion";
import logo from "./assets/logo.png"; // logo-kuva

const FEED_URL = "https://feeds.megaphone.fm/GLT1412515089"; // podcastin rss-syöte
const CORS_PROXY = "https://thingproxy.freeboard.io/fetch/"; // cors-proxy, jotta voi hakea dataa suoraan

function App() {
  // tilat eri asioille
  const [episodes, setEpisodes] = useState([]); // podcast-jaksot
  const [visibleCount, setVisibleCount] = useState(9); // montako jaksoa näytetään
  const [loading, setLoading] = useState(true); // latausstatus
  const [error, setError] = useState(""); // virheilmoitus
  const [searchTerm, setSearchTerm] = useState(""); // hakusana
  const [expandedEpisodes, setExpandedEpisodes] = useState(new Set()); // mitkä jaksot on laajennettu
  const [scrolled, setScrolled] = useState(false); // onko sivua skrollattu alas

  useEffect(() => {
    // haetaan rss-syöte
    const fetchFeed = async () => {
      try {
        const response = await fetch(`${CORS_PROXY}${FEED_URL}`); // haetaan syöte corsin kautta
        if (!response.ok) throw new Error("Failed to fetch feed"); // virhe jos ei ok

        const text = await response.text(); // luetaan vastaus tekstinä
        const parser = new DOMParser(); // xml-parseri
        const xml = parser.parseFromString(text, "application/xml"); // parsitaan xml-muotoon

        const items = Array.from(xml.querySelectorAll("item")); // haetaan kaikki jaksot

        const parsedEpisodes = items.map((item) => {
          // apufunktiot
          const get = (selector) =>
            item.querySelector(selector)?.textContent || ""; // haetaan teksti
          const getAttr = (selector, attr) =>
            item.querySelector(selector)?.getAttribute(attr) || ""; // haetaan attribuutti

          // haetaan kuva turvallisesti nimialueilta
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

            return "https://via.placeholder.com/300x300?text=No+Image"; // oletuskuva jos ei löydy
          };

          // palautetaan jaksotiedot
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

        setEpisodes(parsedEpisodes); // tallennetaan jaksot tilaan
      } catch (err) {
        console.error("Error loading feed:", err);
        setError("Failed to load podcast feed."); // virheilmoitus
      } finally {
        setLoading(false); // lopetetaan lataustila
      }
    };

    fetchFeed(); // käynnistetään haku komponentin latautuessa
  }, []);

  useEffect(() => {
    // kuunnellaan sivun scrollausta
    const onScroll = () => {
      setScrolled(window.scrollY > 50); // asetetaan true jos scrollattu yli 50px
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll); // siivotaan tapahtumakuuntelija pois
  }, []);

  // haetaan suodatetut jaksot hakusanalla
  const filteredEpisodes = useMemo(() => {
    if (!searchTerm.trim()) return episodes; // jos hakusana tyhjä, näytetään kaikki
    return episodes.filter(
      (ep) => ep.title.toLowerCase().includes(searchTerm.toLowerCase()) // haetaan otsikosta hakusanalla
    );
  }, [searchTerm, episodes]);

  // rajataan näkyviin näytettävien jaksojen määrä
  const visibleEpisodes = filteredEpisodes.slice(0, visibleCount);

  // vaihdetaan jakson kuvaus auki/kiinni tilaa
  const toggleDescription = (index) => {
    setExpandedEpisodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) newSet.delete(index);
      else newSet.add(index);
      return newSet;
    });
  };

  return (
    <div className="bg-black text-white min-h-screen flex flex-col p-6 font-sans">
      {/* ylävalikko, sisältää logon, otsikon ja hakukentän */}
      <header className="sticky top-0 bg-black bg-opacity-90 backdrop-blur-md flex items-center p-4 rounded-b-xl z-20 mb-6">
        <motion.img
          src={logo}
          alt="Logo"
          className="mr-4 rounded"
          animate={{
            width: scrolled ? 75 : 170, // logo pienenee scrollatessa
            height: scrolled ? 75 : 170,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
        <h1 className="text-3xl font-bold select-none">Joe Rogan Experience</h1>
        <input
          type="search"
          placeholder="Search episodes..."
          className="ml-auto px-3 py-2 rounded-2xl bg-zinc-900 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition w-64"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)} // päivitetään hakusana tilaan
          aria-label="Search episodes"
        />
      </header>

      {/* lataus- ja virheilmoitukset */}
      {loading && <p className="text-zinc-400">Loading episodes...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && filteredEpisodes.length === 0 && (
        <p className="text-zinc-400">No episodes found for your search.</p> // ei hakutuloksia
      )}

      {/* jaksot ruudukossa */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 flex-grow">
        <AnimatePresence>
          {visibleEpisodes.map((ep, index) => (
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
                loading="lazy" // kuvat latautuu laiskasti
              />
              <h2 className="text-xl font-semibold mb-1">{ep.title}</h2>
              <p className="text-sm text-zinc-400 mb-2">{ep.pubDate}</p>
              <audio controls src={ep.audioUrl} className="w-full mb-2" />{" "}
              {/* soittimen ääni */}
              <p className="text-xs text-zinc-500 mb-2"></p>
              {ep.description && (
                <>
                  <button
                    onClick={() => toggleDescription(index)} // kuvaus auki/kiinni
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
                        className="overflow-hidden text-md text-zinc-400"
                        dangerouslySetInnerHTML={{ __html: ep.description }} // näytetään kuvaus html-muodossa
                      />
                    )}
                  </AnimatePresence>
                </>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* lataa lisää -nappi jos löytyy lisää jaksoja */}
      {visibleCount < filteredEpisodes.length && (
        <div className="flex justify-center mt-8">
          <button
            onClick={() => setVisibleCount((c) => c + 9)} // näytetään 20 lisää
            className="px-8 py-3 bg-orange-600 rounded-full font-semibold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400"
          >
            Load More
          </button>
        </div>
      )}

      {/* alatunniste */}
      <footer className="mt-12 py-6 border-t border-gray-700 text-center text-zinc-400 text-sm select-none">
        <p>
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
        <p className="mt-2">
          <a
            href="https://twitter.com/joe_rogan"
            target="_blank"
            rel="noreferrer"
            className="mx-2 hover:text-orange-400"
          >
            Twitter
          </a>{" "}
          |{" "}
          <a
            href="https://www.joerogan.com/"
            target="_blank"
            rel="noreferrer"
            className="mx-2 hover:text-orange-400"
          >
            Official Site
          </a>
        </p>
        <p className="mt-2 text-xs text-orange-400">
          <strong className="text-zinc-400">Disclaimer:</strong> I do not own,
          control, or profit from any referral or affiliate links that may
          appear in episode descriptions. These links are part of the original
          third-party podcast feed and are included automatically for
          educational purposes only.
          <p className="mt-4 text-xs text-zinc-400">
            This website is a personal learning project created by a student
            exploring web development with React. It is not affiliated with or
            endorsed by the Joe Rogan Experience, Megaphone, or any related
            entities. <br />
            All podcast content, including descriptions and media, is the
            property of their respective owners and shown here for educational,
            non-commercial purposes only.
          </p>
        </p>
      </footer>
    </div>
  );
}

export default App;
