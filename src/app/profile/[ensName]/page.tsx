import { fetchENSProfile } from "@/lib/ens";
import { ENSProfile } from "@/components/ens-profile";
import { Navbar } from "@/components/navbar";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ ensName: string }>;
}) {
  const { ensName } = await params;
  const decodedName = decodeURIComponent(ensName);
  const profile = await fetchENSProfile(decodedName);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 p-4 sm:p-8">
        <ENSProfile profile={profile} />
      </main>
    </>
  );
}
