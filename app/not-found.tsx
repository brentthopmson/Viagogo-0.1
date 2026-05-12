import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4 text-center">
      <h2 className="text-4xl font-black text-[#001B41] mb-2">404</h2>
      <p className="text-gray-500 font-bold mb-8">We could not find the page you are looking for.</p>
      <Link href="/" className="bg-[#001B41] text-white px-8 py-3 rounded-xl font-black hover:opacity-90 transition-all">
        Return Home
      </Link>
    </div>
  );
}
