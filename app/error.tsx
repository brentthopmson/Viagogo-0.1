"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      <h2 className="text-2xl font-black text-[#001B41] mb-4">Something went wrong!</h2>
      <button
        onClick={() => reset()}
        className="bg-[#89CF28] text-white px-8 py-3 rounded-xl font-black hover:opacity-90 transition-all"
      >
        Try again
      </button>
    </div>
  );
}
