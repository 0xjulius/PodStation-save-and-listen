import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import HubermanFeed from "./pages/huberman";
import JreFeed from "./pages/jre";
import Thispastweekend from "./pages/thispastweekend";
import Navbar from "./components/Navbar";
import Card from "./components/Card";
import logo1 from "./assets/default.webp";
import logo2 from "./assets/logo.png";
import Footer from "./components/footer";
import VantaWr from "./components/VantaWrapper";
import Hero from "./components/hero";
import TheVergeCastFeed from "./pages/thevergecast";
import TheDoctorsFarmacy from "./pages/thedoctorsfarmacy";

function Home() {
  return (
    <VantaWr>
      <div className="p-8 ">
        <Hero />
        <div className="items-center justify-center flex mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12 bg-black blur-bg card rounded-2xl border border-white/10 ">
            <Link to="/huberman">
              <Card title="Huberman Lab" logo={logo1} />
            </Link>
            <Link to="/joe-rogan-experience">
              <Card title="Joe Rogan Experience" logo={logo2} />
            </Link>

            <Link to="/this-past-weekend">
              <Card
                title="This Past Weekend"
                logo="https://megaphone.imgix.net/podcasts/77b32ce4-b2db-11ed-9447-83efd7382a7a/image/image.jpg?ixlib=rails-4.3.1&max-w=3000&max-h=3000&fit=crop&auto=format,compress"
              />
            </Link>

            <Link to="/thevergecast">
              <Card
                title="The Vergecast"
                logo="https://megaphone.imgix.net/podcasts/e4c412e6-e1f0-11e8-9bde-83f9d376f059/image/Podcast_Tile_6000x6000px.png?ixlib=rails-4.3.1&max-w=3000&max-h=3000&fit=crop&auto=format,compress"
              />
            </Link>

            <Link to="/thedoctorsfarmacy">
              <Card
                title="The Doctor's Farmacy"
                logo="https://megaphone.imgix.net/podcasts/023e032e-c763-11ee-be4f-27c14bd0edec/image/b48241079d9f8d935c35e92fa507926f.jpg?ixlib=rails-4.3.1&max-w=3000&max-h=3000&fit=crop&auto=format,compress"
              />
            </Link>

            <Link to="#">
              <Card
                title="Upcoming.."
                logo="https://avatar.iran.liara.run/public"
              />
            </Link>
            {/* Add more cards if needed */}
          </div>
        </div>
        <Footer />
      </div>
    </VantaWr>
  );
}

export default function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/huberman" element={<HubermanFeed />} />
        <Route path="/joe-rogan-experience" element={<JreFeed />} />
        <Route path="/this-past-weekend" element={<Thispastweekend />} />
        <Route path="/thevergecast" element={<TheVergeCastFeed />} />
        <Route path="/thedoctorsfarmacy" element={<TheDoctorsFarmacy />} />
        {/* Add more routes as needed */}
      </Routes>
    </Router>
  );
}
