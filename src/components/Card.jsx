import React from "react";

export default function Card({ logo, title }) {
    return (
      <div className=" flex flex-col items-center justify-center h-80 w-80 rounded-2xl image-zoom hover:scale-105 transition-transform duration-300">
        <img
          src={logo}
          alt={`${title} logo`}
          className="w-64 h-64 mb-4 rounded-2xl bg-white/10 border border-white/10 object-cover transition-transform duration-300 hover:scale-105"
        />
        <h2 className="text-md font-semibold text-center text-white rounded-2xl px-4 transition-all duration-300">
          {title}
        </h2>
      </div>
    );
}
