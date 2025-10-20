"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Team } from "@/lib/types";

export default function RostersPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Filter teams by conference
  const easternTeams = teams.filter(t => ['T001', 'T004', 'T005', 'T008', 'T009', 'T012', 'T013'].includes(t.teamId));
  const westernTeams = teams.filter(t => ['T002', 'T003', 'T006', 'T007', 'T010', 'T011', 'T014'].includes(t.teamId));

  // Get the maximum number of teams to ensure equal rows
  const maxTeams = Math.max(easternTeams.length, westernTeams.length);

  // Debug logging
  console.log('Eastern teams:', easternTeams);
  console.log('Western teams:', westernTeams);

  return (
    <div className="p-4 bg-white pb-32">
      <div className="sticky top-0 bg-white z-10 pb-4">
        <h1 className="heading-1 mb-6 text-center">DYNASTY ROSTERS</h1>
      </div>

      {loading ? (
        <div className="text-gray-600 text-center">Loading teams…</div>
      ) : (
        <div className="table-wrap pb-32">
          <table className="w-full">
            <thead>
              <tr>
                <th className="px-4 py-3 text-center text-white font-bold border-r-2 border-black bg-blue-600" style={{borderRight: '2px solid black'}}>
                  EASTERN
                </th>
                <th className="px-4 py-3 text-center text-white font-bold bg-red-600">
                  WESTERN
                </th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: maxTeams + 1 }).map((_, index) => (
                <tr key={index} className="border-b border-white">
                  <td className="px-4 py-2 text-center border-r-2 border-black bg-white align-middle" style={{borderRight: '2px solid black'}}>
                    {easternTeams[index] ? (
                      <Link
                        href={`/teams/${encodeURIComponent(easternTeams[index].teamId)}`}
                        className="block"
                      >
                        {easternTeams[index].mainLogo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={`/api/image?url=${encodeURIComponent(easternTeams[index].mainLogo)}`}
                            alt={`${easternTeams[index].teamName} logo`}
                            className="h-20 object-contain mx-auto"
                          />
                        ) : (
                          <div className="text-lg text-gray-600">
                            {easternTeams[index].teamName}
                          </div>
                        )}
                      </Link>
                    ) : (
                      <div className="h-20"></div>
                    )}
                  </td>
                  <td className="px-4 py-2 text-center bg-white align-middle">
                    {westernTeams[index] ? (
                      <Link
                        href={`/teams/${encodeURIComponent(westernTeams[index].teamId)}`}
                        className="block"
                      >
                        {westernTeams[index].mainLogo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={`/api/image?url=${encodeURIComponent(westernTeams[index].mainLogo)}`}
                            alt={`${westernTeams[index].teamName} logo`}
                            className="h-20 object-contain mx-auto"
                          />
                        ) : (
                          <div className="text-lg text-gray-600">
                            {westernTeams[index].teamName}
                          </div>
                        )}
                      </Link>
                    ) : (
                      <div className="h-20"></div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
