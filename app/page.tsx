"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Team } from "@/lib/types";
import { useAuth } from "@/lib/auth";

export default function Home() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentTeam, isLoading } = useAuth();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/teams");
        if (res.ok) {
          const data: Team[] = await res.json();
          setTeams(data);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Don't render until auth is checked
  if (isLoading) {
    return <div className="p-4 bg-white">Loading...</div>;
  }

  return (
    <div className="p-4 bg-white">
      {currentTeam ? (
        <>
          {/* Dynasty League Logo for logged-in users */}
          <div className="text-center mb-8">
            <img
              src={`/api/image?url=${encodeURIComponent("https://drive.google.com/uc?export=view&id=1hOy_hcD3zCKG4ajLx9fSgZcF4Wp1Rfqo")}`}
              alt="Dynasty League"
              className="mx-auto h-32 object-contain"
            />
          </div>
          
          <h1 className="heading-1 mb-4">Teams</h1>
        </>
      ) : (
        <h1 className="heading-1 mb-4">Teams</h1>
      )}

      {loading ? (
        <div className="text-gray-600">Loading teams…</div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
          {teams.map((t) => (
            <Link
              key={t.teamId}
              href="/roster"
              className="group card p-3 flex items-center justify-center hover:shadow-xl transition-all duration-200"
            >
              {t.mainLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/api/image?url=${encodeURIComponent(t.mainLogo)}`}
                  alt={`${t.teamName} logo`}
                  className="h-12 object-contain opacity-90 group-hover:opacity-100"
                />
              ) : (
                <div className="text-center text-sm text-gray-600">
                  {t.teamName}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

