import React from "react";

export default function Footer() {
  return (
    <footer className="card blur-bg rounded-2xl py-6 text-center text-zinc-400 text-sm select-none bg-black border border-white/10 mt-6 ">
      <p className="mt-2">
        <a
          href="https://juliusaalto.com/"
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

      <p className="mt-4 text-xs text-zinc-400 px-4">
        This website is not affiliated with or endorsed by Megaphone, or any
        related entities.
        <br />
        All podcast content, including descriptions and media, is the property
        of their respective owners and shown here for educational,
        non-commercial purposes only.
      </p>

      <div>
        <br />
        <p className="mb-8 text-xs text-orange-400 px-4">
          <strong className="text-zinc-400 ">Disclaimer:</strong> I do not own,
          control, or profit from any referral or affiliate links that may
          appear in this site. These links are part of the original third-party
          podcast feed and are included automatically for educational purposes
          only.
        </p>
        Podcast data from:{" "}
        <a
          href="https://megaphone.fm/"
          target="_blank"
          rel="noreferrer"
          className="text-orange-400 hover:underline px-4"
        >
          Megaphone
        </a>
      </div>
    </footer>
  );
}
