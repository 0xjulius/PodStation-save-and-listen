import React from "react";

function SkeletonCard() {
  return (
    <div className="bg-zinc-900 p-4 rounded-2xl shadow-lg animate-pulse flex flex-col">
      <div className="bg-zinc-800 rounded-xl mb-4 w-full aspect-square" />
      <div className="h-5 bg-zinc-800 rounded w-3/4 mb-2" />
      <div className="h-4 bg-zinc-800 rounded w-1/3 mb-4" />
      <div className="h-10 bg-zinc-800 rounded w-full mb-2" />
      <div className="h-4 bg-zinc-800 rounded w-1/2" />
    </div>
  );
}

export default SkeletonCard;
