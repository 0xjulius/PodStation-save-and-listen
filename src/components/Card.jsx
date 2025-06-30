import React from "react";

export default function Card({ logo, title }) {
    return (
        <div className="hover:bg-white/10 flex flex-col items-center justify-center h-80 w-80 hover:shadow-lg duration-300 rounded-2xl transition-colors">
          <img
            src={logo}
            alt={`${title} logo`}
            className="w-64 h-64 mb-4 rounded-2xl bg-white/100 "
          />
          <h2 className="text-md font-semibold text-center text-white rounded-2xl px-4">
            {title}
          </h2>
        </div>
    );
}
