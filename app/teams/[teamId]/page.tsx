"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Team, Player } from "@/lib/types";
import { getTeamRosterByStatus } from "@/lib/googleSheets";
import RosterTable from "@/components/RosterTable";

export default function TeamPage() {
  const params = useParams<{ teamId: string }>();
  const teamId = params?.teamId || "";

  const [teams, setTeams] = useState<Team[]>([]);
  const [team, setTeam] = useState<Team | null>(null);
  const [active, setActive] = useState<Player[]>([]);
  const [dev, setDev] = useState<Player[]>([]);
  const [inj, setInj] = useState<Player[]>([]);
  const [draftPicks, setDraftPicks] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/teams");
        if (res.ok) {
          const data: Team[] = await res.json();
          setTeams(data);
          const found = data.find(t => t.teamId === teamId) || null;
          setTeam(found);
        }
        const [a, d, i] = await Promise.all([
          getTeamRosterByStatus(teamId, "ACTIVE"),
          getTeamRosterByStatus(teamId, "DEVELOPMENT"),
          getTeamRosterByStatus(teamId, "INJURY"),
        ]);
        setActive(a);
        setDev(d);
        setInj(i);

        // Fetch draft picks
        const draftRes = await fetch(`/api/draft-picks?teamId=${teamId}`);
        if (draftRes.ok) {
          const draftData = await draftRes.json();
          setDraftPicks(draftData);
        }
      } finally {
        setLoading(false);
      }
    };
    if (teamId) load();
  }, [teamId]);

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-5">
        {team?.mainLogo && (
          <div className="w-1/2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/image?url=${encodeURIComponent(team.mainLogo)}`} alt={`${team.teamName} logo`} className="w-full h-auto object-contain" />
          </div>
        )}
        <div className="w-1/2 space-y-1">
          <div className="text-sm text-black">GM {team?.manager || '-'} | Est. {team?.established || '-'}</div>
          <div className="text-sm text-black">{team?.conference || '-'} Conference</div>
          <div className="text-sm text-black">All-Time Record: {team?.record || '-'}</div>
          <div className="text-sm text-black">Playoffs: {team?.playoffs || '-'}</div>
          <div className="text-sm text-black">Conf. Titles: {team?.conferenceTitles || '-'}</div>
          <div className="text-sm text-black">Championships: {team?.championships || '-'}</div>
        </div>
      </div>

      {loading ? (
        <div className="text-black">Loading…</div>
      ) : (
        <div className="space-y-8">
          {/* Future Draft Picks - 7 rows by 2 columns */}
          <section>
            <h2 className="text-lg font-semibold mb-3 text-black">FUTURE DRAFT PICKS:</h2>
            <div className="card">
              <div className="table-wrap overflow-x-auto">
                <table className="w-full table-striped table-hover min-w-max">
                  <thead className="sticky top-0 z-20">
                    <tr>
                      <th className="px-1 py-4 text-center text-sm font-bold text-white bg-[var(--primary)] min-w-[80px] border-r border-white">YEAR</th>
                      <th className="px-1 py-4 text-center text-sm font-bold text-white bg-[var(--primary)] min-w-[400px]">UPCOMING PICKS</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-white">
                      <td className="px-1 py-4 text-sm text-black text-center border-r border-white">2026</td>
                      <td className="px-1 py-4 text-sm text-black text-center whitespace-pre-line">{draftPicks?.picks2026 || '—'}</td>
                    </tr>
                    <tr className="border-b border-white">
                      <td className="px-1 py-4 text-sm text-black text-center border-r border-white">2027</td>
                      <td className="px-1 py-4 text-sm text-black text-center whitespace-pre-line">{draftPicks?.picks2027 || '—'}</td>
                    </tr>
                    <tr className="border-b border-white">
                      <td className="px-1 py-4 text-sm text-black text-center border-r border-white">2028</td>
                      <td className="px-1 py-4 text-sm text-black text-center whitespace-pre-line">{draftPicks?.picks2028 || '—'}</td>
                    </tr>
                    <tr className="border-b border-white">
                      <td className="px-1 py-4 text-sm text-black text-center border-r border-white">2029</td>
                      <td className="px-1 py-4 text-sm text-black text-center whitespace-pre-line">{draftPicks?.picks2029 || '—'}</td>
                    </tr>
                    <tr className="border-b border-white">
                      <td className="px-1 py-4 text-sm text-black text-center border-r border-white">2030</td>
                      <td className="px-1 py-4 text-sm text-black text-center whitespace-pre-line">{draftPicks?.picks2030 || '—'}</td>
                    </tr>
                    <tr className="border-b border-white">
                      <td className="px-1 py-4 text-sm text-black text-center border-r border-white">NOTES</td>
                      <td className="px-1 py-4 text-sm text-black text-center whitespace-pre-line">{draftPicks?.notes || '—'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Roster Tables - shells similar to MyTeam */}
          <section>
            <h2 className="text-2xl font-bold mb-3 text-black">ROSTER</h2>
            <RosterTable 
              players={active} 
              title="Active Roster" 
              maxSlots={20} 
            />
          </section>
          <section>
            <RosterTable 
              players={dev} 
              title="Development" 
              maxSlots={6} 
            />
          </section>
          <section>
            <RosterTable 
              players={inj} 
              title="Injury Reserve" 
              maxSlots={2} 
            />
          </section>

          {/* Salary Cap - 8 columns, 5 rows */}
          <section>
            <h2 className="text-lg font-semibold mb-3 text-black">Salary Cap:</h2>
            <div className="overflow-x-auto rounded-lg border border-gray-800">
              <table className="w-full text-sm">
                <thead className="bg-gray-800">
                  <tr>
                    {Array.from({ length: 8 }).map((_, i) => (
                      <th key={i} className="px-3 py-2 text-left">Col {i + 1}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 4 }).map((_, r) => (
                    <tr key={r} className="border-t border-gray-800">
                      {Array.from({ length: 8 }).map((_, c) => (
                        <td key={c} className="px-3 py-2">—</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Season-by-season records - 12 columns, 5 rows */}
          <section>
            <h2 className="text-lg font-semibold mb-3 text-black">Season Records:</h2>
            <div className="overflow-x-auto rounded-lg border border-gray-800">
              <table className="w-full text-sm">
                <thead className="bg-gray-800">
                  <tr>
                    {Array.from({ length: 12 }).map((_, i) => (
                      <th key={i} className="px-3 py-2 text-left">Col {i + 1}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 4 }).map((_, r) => (
                    <tr key={r} className="border-t border-gray-800">
                      {Array.from({ length: 12 }).map((_, c) => (
                        <td key={c} className="px-3 py-2">—</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}


