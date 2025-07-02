import React from "react";

export default function Hero() {
  return (
    <header className="py-10 px-6 text-center rounded-2xl mb-6 hfont">
      <h1 className="text-5xl font-bold select-none lg:text-6xl text-white ">
        Welcome to the <span className="text-gradient hfont">PodStation.</span>
      </h1>
      <p className="text-white/75 select-none text-md lg:text-lg">
        A place where you can search, listen and save podcasts!
      </p>
    </header>
  );
}
