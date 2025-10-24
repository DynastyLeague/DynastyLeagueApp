"use client";

import { useEffect, useState } from "react";
import { Team, Player } from "@/lib/types";
import { getTeamRosterByStatus } from "@/lib/googleSheets";
import RosterTable from "@/components/RosterTable";

export default function RosterPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [active, setActive] = useState<Player[]>([]);
  const [dev, setDev] = useState<Player[]>([]);
  const [inj, setInj] = useState<Player[]>([]);
  const [draftPicks, setDraftPicks] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(true);

  // Load teams on mount
  useEffect(() => {
    const loadTeams = async () => {
      try {
        const res = await fetch("/api/teams");
        if (res.ok) {
          const data: Team[] = await res.json();
          setTeams(data);
          // Set first team as default
          if (data.length > 0) {
            setSelectedTeamId(data[0].teamId);
            setSelectedTeam(data[0]);
          }
        }
      } catch (error) {
        console.error("Error loading teams:", error);
      }
    };
    loadTeams();
  }, []);

  // Load roster data when team changes
  useEffect(() => {
    const loadRosterData = async () => {
      if (!selectedTeamId) return;
      
      setLoading(true);
      try {
        const [a, d, i] = await Promise.all([
          getTeamRosterByStatus(selectedTeamId, "ACTIVE"),
          getTeamRosterByStatus(selectedTeamId, "DEVELOPMENT"),
          getTeamRosterByStatus(selectedTeamId, "INJURY"),
        ]);
        setActive(a);
        setDev(d);
        setInj(i);

        // Fetch draft picks
        const draftRes = await fetch(`/api/draft-picks?teamId=${selectedTeamId}`);
        if (draftRes.ok) {
          const draftData = await draftRes.json();
          setDraftPicks(draftData);
        }
      } catch (error) {
        console.error("Error loading roster data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadRosterData();
  }, [selectedTeamId]);

  const handleTeamChange = (teamId: string) => {
    setSelectedTeamId(teamId);
    const team = teams.find(t => t.teamId === teamId);
    console.log('Selected team:', team);
    console.log('Team logo URL:', team?.mainLogo);
    setSelectedTeam(team || null);
  };

  if (loading && !selectedTeam) {
    return (
      <div className="min-h-screen bg-gray-800 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-800">
      {/* White Spacer */}
      <div className="h-5 bg-gray-800"></div>

      {/* Team Selector */}
      <div className="px-6 mb-6">
        <label htmlFor="team-select" className="block text-lg font-semibold mb-2 text-white">
          Select Team:
        </label>
        <div className="relative">
          <select
            id="team-select"
            value={selectedTeamId}
            onChange={(e) => handleTeamChange(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-10"
          >
            {teams.map((team) => (
              <option key={team.teamId} value={team.teamId} className="bg-gray-700 text-white">
                {team.teamName}
              </option>
            ))}
          </select>
          {/* Custom dropdown arrow */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        
        {/* Team Logo Display */}
        {selectedTeam && (
          <div className="mt-4 flex items-center gap-3">
            {selectedTeam.mainLogo ? (
              <img
                src={`/api/image?url=${encodeURIComponent(selectedTeam.mainLogo)}`}
                alt={`${selectedTeam.teamName} logo`}
                className="h-12 w-12 object-contain"
                onError={(e) => {
                  console.log('Logo failed to load:', selectedTeam.mainLogo);
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
            ) : null}
            <div 
              className={`h-12 w-12 bg-gray-600 flex items-center justify-center rounded ${selectedTeam.mainLogo ? 'hidden' : ''}`}
            >
              <span className="text-white text-xs font-bold">
                {selectedTeam.teamName?.slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div>
              <div className="text-white font-semibold">{selectedTeam.teamName}</div>
              <div className="text-gray-300 text-sm">{selectedTeam.conference} Conference</div>
            </div>
          </div>
        )}
      </div>

      {/* Dark Gray Spacer */}
      <div className="h-10 bg-gray-800"></div>

      {selectedTeam && (
        <>

          {/* Draft Picks Section */}
          {draftPicks && (
            <section className="px-6 mb-8">
              <h2 className="text-2xl font-bold mb-4 text-white">DRAFT PICKS</h2>
              <div className="bg-gray-700 rounded-lg p-4">
                <table className="w-full">
                  <tbody>
                    <tr className="border-b border-gray-600">
                      <td className="px-1 py-4 text-sm text-white text-center border-r border-gray-600 font-semibold">2026</td>
                      <td className="px-1 py-4 text-sm text-white text-center">{draftPicks?.picks2026 || '—'}</td>
                    </tr>
                    <tr className="border-b border-gray-600">
                      <td className="px-1 py-4 text-sm text-white text-center border-r border-gray-600 font-semibold">2027</td>
                      <td className="px-1 py-4 text-sm text-white text-center">{draftPicks?.picks2027 || '—'}</td>
                    </tr>
                    <tr className="border-b border-gray-600">
                      <td className="px-1 py-4 text-sm text-white text-center border-r border-gray-600 font-semibold">2028</td>
                      <td className="px-1 py-4 text-sm text-white text-center">{draftPicks?.picks2028 || '—'}</td>
                    </tr>
                    <tr className="border-b border-gray-600">
                      <td className="px-1 py-4 text-sm text-white text-center border-r border-gray-600 font-semibold">2029</td>
                      <td className="px-1 py-4 text-sm text-white text-center">{draftPicks?.picks2029 || '—'}</td>
                    </tr>
                    <tr className="border-b border-gray-600">
                      <td className="px-1 py-4 text-sm text-white text-center border-r border-gray-600 font-semibold">2030</td>
                      <td className="px-1 py-4 text-sm text-white text-center">{draftPicks?.picks2030 || '—'}</td>
                    </tr>
                    <tr className="border-b border-gray-600">
                      <td className="px-1 py-4 text-sm text-white text-center border-r border-gray-600 font-semibold">NOTES</td>
                      <td className="px-1 py-4 text-sm text-white text-center whitespace-pre-line">{draftPicks?.notes || '—'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Roster Tables */}
          <section className="px-6 mb-6">
            <h2 className="text-2xl font-bold mb-3 text-white">ROSTER</h2>
            <RosterTable 
              players={active} 
              title="MAIN ROSTER" 
              maxSlots={20} 
            />
          </section>
          
          <section className="px-6 mb-6">
            <RosterTable 
              players={dev} 
              title="Development" 
              maxSlots={6} 
            />
          </section>
          
          <section className="px-6 mb-6">
            <RosterTable 
              players={inj} 
              title="Injury Reserve" 
              maxSlots={2} 
            />
          </section>

          {/* Salary Cap Section */}
          <section className="px-6 pb-32">
            <h2 className="text-lg font-semibold mb-3 text-white">
              SALARY CAP BREAKDOWN
            </h2>
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-gray-300">Total Salary</div>
                  <div className="font-semibold text-white">$0M</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-300">Cap Space</div>
                  <div className="font-semibold text-white">$0M</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-300">Luxury Tax</div>
                  <div className="font-semibold text-white">$0M</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-300">Hard Cap</div>
                  <div className="font-semibold text-white">$0M</div>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
