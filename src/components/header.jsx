import React from "react";

export default function Header({ title, subtitle }) {
  return (
    <header className="py-10 px-6 text-center rounded-2xl mb-6">
      <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 title-lb">
        {title}
      </h1>
      {subtitle && <p className="text-lg text-gray-600 mb-6">{subtitle}</p>}
    </header>
  );
}
