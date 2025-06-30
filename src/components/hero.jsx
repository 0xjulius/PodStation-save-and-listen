import React from "react";

export default function Hero() {
  return (
    <header className="py-10 px-6 text-center rounded-2xl mb-6">
      <h1 className="text-5xl font-bold select-none lg:text-6xl text-white">
        Welcome to the <span className="text-gradient">PodStation.</span>
      </h1>
      <p className="text-white select-none text-md lg:text-lg">
        A place where you can search, listen and save podcasts!
      </p>
    </header>
  );
}
