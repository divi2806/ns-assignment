import { fetchENSProfile } from "@/lib/ens";
import { ENSProfile } from "@/components/ens-profile";
import Link from "next/link";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ ensName: string }>;
}) {
  const { ensName } = await params;
  const decodedName = decodeURIComponent(ensName);
  const profile = await fetchENSProfile(decodedName);

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">ENS Profile</h1>
          <Link href="/graph" className="text-blue-600 hover:underline text-sm">
            View Graph →
          </Link>
        </div>
        <ENSProfile profile={profile} />
      </div>
    </main>
  );
}
