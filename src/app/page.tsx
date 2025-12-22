import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">ENS Social Graph</h1>
        <p className="text-gray-600 mb-8">
          Explore ENS profiles and visualize social connections on the
          Ethereum Name Service.
        </p>

        <div className="space-y-4">
          <Link
            href="/profile/vitalik.eth"
            className="block p-4 border rounded-lg bg-white hover:bg-gray-50 transition"
          >
            <h2 className="font-semibold">→ View Profile: vitalik.eth</h2>
            <p className="text-sm text-gray-500">
              See ENS records, avatar, and text data
            </p>
          </Link>

          <Link
            href="/graph"
            className="block p-4 border rounded-lg bg-white hover:bg-gray-50 transition"
          >
            <h2 className="font-semibold">→ View Social Graph</h2>
            <p className="text-sm text-gray-500">
              Interactive network visualization of ENS connections
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}
