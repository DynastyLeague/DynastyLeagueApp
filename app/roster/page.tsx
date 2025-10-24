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
  const [selectedSection, setSelectedSection] = useState<string>("home");

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

  // Calculate salary cap allocations
  const calculateCapAllocations = (year: string) => {
    let total = 0;
    
    // Active players: 100% of salary
    active.forEach(player => {
      const salary = getSalaryForYear(player, year);
      if (typeof salary === 'number') {
        total += salary;
      }
    });
    
    // Injury players: 50% of salary
    inj.forEach(player => {
      const salary = getSalaryForYear(player, year);
      if (typeof salary === 'number') {
        total += salary * 0.5;
      }
    });
    
    // Development players: 0% of salary (no calculation needed)
    
    return total;
  };

  // Get salary for specific year
  const getSalaryForYear = (player: Player, year: string) => {
    switch (year) {
      case '25-26': return typeof player.salary25_26 === 'number' ? player.salary25_26 : 0;
      case '26-27': return typeof player.salary26_27 === 'number' ? player.salary26_27 : 0;
      case '27-28': return typeof player.salary27_28 === 'number' ? player.salary27_28 : 0;
      case '28-29': return typeof player.salary28_29 === 'number' ? player.salary28_29 : 0;
      case '29-30': return typeof player.salary29_30 === 'number' ? player.salary29_30 : 0;
      case '30-31': return typeof player.salary30_31 === 'number' ? player.salary30_31 : 0;
      default: return 0;
    }
  };

  // Calculate cap space
  const calculateCapSpace = (year: string) => {
    const salaryCap = year === '25-26' ? 247.2 : 276.87;
    const allocations = calculateCapAllocations(year);
    return salaryCap - allocations;
  };

  // Calculate hard cap limit
  const calculateHardCapLimit = (year: string) => {
    const hardCap = year === '25-26' ? 296.8 : 332.25;
    const minSalary = year === '25-26' ? 2.48 : 2.77;
    const activeRosterCount = active.length;
    const minRosterSpots = 16;
    
    // Start with Hard Cap - Total Cap Allocations
    const allocations = calculateCapAllocations(year);
    let result = hardCap - allocations;
    
    // Factor in min salary for spots under 16
    if (activeRosterCount < minRosterSpots) {
      const missingSpots = minRosterSpots - activeRosterCount;
      const minSalaryAdjustment = minSalary * missingSpots;
      result -= minSalaryAdjustment;
    }
    
    return result;
  };

  // Format currency with red highlighting for negative numbers
  const formatCurrency = (value: number) => {
    const formatted = `$${value.toFixed(2)}m`;
    const isNegative = value < 0;
    return (
      <span className={isNegative ? 'text-red-400' : 'text-white'}>
        {formatted}
      </span>
    );
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

      {/* Team Selector with Logo */}
      <div className="px-6 mb-6">
        {selectedTeam && (
          <div className="flex items-center gap-4">
            {/* Team Logo */}
            <img
              src={`/logos/${selectedTeam.teamId}-main.png.png`}
              alt={`${selectedTeam.teamName} logo`}
              className="h-16 w-16 object-contain"
              onError={(e) => {
                console.log('Logo failed to load:', selectedTeam.teamId);
                e.currentTarget.style.display = 'none';
                const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
            <div 
              className="h-16 w-16 bg-gray-600 flex items-center justify-center rounded hidden"
            >
              <span className="text-white text-sm font-bold">
                {selectedTeam.teamName?.slice(0, 2).toUpperCase()}
              </span>
            </div>
            
            {/* Team Dropdown */}
            <div className="flex-1">
              <div className="relative">
                <select
                  id="team-select"
                  value={selectedTeamId}
                  onChange={(e) => handleTeamChange(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-600 rounded-lg bg-gray-700 text-white text-xl font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-10"
                >
                  {teams.map((team) => (
                    <option key={team.teamId} value={team.teamId} className="bg-gray-700 text-white">
                      {team.teamName}
                    </option>
                  ))}
                </select>
                {/* Custom dropdown arrow */}
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <div className="text-gray-300 text-sm mt-1">{selectedTeam.conference} Conference</div>
            </div>
          </div>
        )}
      </div>

      {/* Dark Gray Spacer */}
      <div className="h-10 bg-gray-800"></div>

      {/* Section Selector */}
      <div className="px-6 mb-6">
        <div className="relative">
          <select
            id="section-select"
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="w-full px-4 py-3 border border-gray-600 rounded-lg bg-gray-700 text-white text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-10"
          >
            <option value="home" className="bg-gray-700 text-white">HOME</option>
            <option value="rosters" className="bg-gray-700 text-white">ROSTER</option>
            <option value="depth-chart" className="bg-gray-700 text-white">DEPTH CHART</option>
            <option value="draft-picks" className="bg-gray-700 text-white">FUTURE DRAFT PICKS</option>
            <option value="season-history" className="bg-gray-700 text-white">SEASON BY SEASON HISTORY</option>
            <option value="player-stats" className="bg-gray-700 text-white">ALL-TIME PLAYER STATS</option>
            <option value="player-records" className="bg-gray-700 text-white">PLAYER RECORDS</option>
            <option value="team-records" className="bg-gray-700 text-white">TEAM RECORDS</option>
          </select>
          {/* Custom dropdown arrow */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Dark Gray Spacer */}
      <div className="h-10 bg-gray-800"></div>

      {/* Content based on selected section */}
      {selectedTeam && (
        <>
          {selectedSection === "home" && (
            <div className="px-6 pb-32">
              <h2 className="text-2xl font-bold mb-4 text-white">TEAM HOME</h2>
              <div className="bg-gray-700 rounded-lg p-6 mb-6">
                <h3 className="text-xl font-semibold mb-4 text-white">Current Matchup</h3>
                <div className="text-gray-300">Week X vs Team Name - Coming Soon</div>
              </div>
              <div className="bg-gray-700 rounded-lg p-6 mb-6">
                <h3 className="text-xl font-semibold mb-4 text-white">Upcoming Matchup</h3>
                <div className="text-gray-300">Week X+1 vs Team Name - Coming Soon</div>
              </div>
              <div className="bg-gray-700 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-4 text-white">Season Record & Standing</h3>
                <div className="text-gray-300">Record: 0-0 | Position: TBD - Coming Soon</div>
              </div>
            </div>
          )}

          {selectedSection === "rosters" && (
            <>
              {/* Salary Cap Breakdown */}
              <section className="px-6 mb-2">
                <h2 className="text-2xl font-bold mb-4 text-white">SALARY CAP BREAKDOWN</h2>
                <div className="bg-gray-800 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full table-fixed">
                      <thead className="bg-gray-700 sticky top-0 z-20">
                        <tr>
                          <th className="sticky left-0 bg-gray-700 px-4 py-3 text-left text-sm font-medium text-gray-300 border-r border-gray-600 w-[182px] z-30">
                            YEAR
                          </th>
                          <th className="px-3 py-3 text-center text-base font-medium text-gray-300 w-24 relative z-10">25-26</th>
                          <th className="px-3 py-3 text-center text-base font-medium text-gray-300 w-24 relative z-10">26-27</th>
                          <th className="px-3 py-3 text-center text-base font-medium text-gray-300 w-24 relative z-10">27-28</th>
                          <th className="px-3 py-3 text-center text-base font-medium text-gray-300 w-24 relative z-10">28-29</th>
                          <th className="px-3 py-3 text-center text-base font-medium text-gray-300 w-24 relative z-10">29-30</th>
                          <th className="px-3 py-3 text-center text-base font-medium text-gray-300 w-24 relative z-10">30-31</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-600">
                        <tr className="bg-gray-800">
                          <td className="sticky left-0 bg-inherit px-4 py-2 text-sm border-r border-gray-600 w-[182px] z-10 text-white font-semibold">TOTAL CAP ALLOCATIONS</td>
                          <td className="px-3 py-3 text-center text-base w-24">{formatCurrency(calculateCapAllocations('25-26'))}</td>
                          <td className="px-3 py-3 text-center text-base w-24">{formatCurrency(calculateCapAllocations('26-27'))}</td>
                          <td className="px-3 py-3 text-center text-base w-24">{formatCurrency(calculateCapAllocations('27-28'))}</td>
                          <td className="px-3 py-3 text-center text-base w-24">{formatCurrency(calculateCapAllocations('28-29'))}</td>
                          <td className="px-3 py-3 text-center text-base w-24">{formatCurrency(calculateCapAllocations('29-30'))}</td>
                          <td className="px-3 py-3 text-center text-base w-24">{formatCurrency(calculateCapAllocations('30-31'))}</td>
                        </tr>
                        <tr className="bg-gray-700">
                          <td className="sticky left-0 bg-inherit px-4 py-2 text-sm border-r border-gray-600 w-[182px] z-10 text-white font-semibold">CAP SPACE</td>
                          <td className="px-3 py-3 text-center text-base w-24">{formatCurrency(calculateCapSpace('25-26'))}</td>
                          <td className="px-3 py-3 text-center text-base w-24">{formatCurrency(calculateCapSpace('26-27'))}</td>
                          <td className="px-3 py-3 text-center text-base w-24">{formatCurrency(calculateCapSpace('27-28'))}</td>
                          <td className="px-3 py-3 text-center text-base w-24">{formatCurrency(calculateCapSpace('28-29'))}</td>
                          <td className="px-3 py-3 text-center text-base w-24">{formatCurrency(calculateCapSpace('29-30'))}</td>
                          <td className="px-3 py-3 text-center text-base w-24">{formatCurrency(calculateCapSpace('30-31'))}</td>
                        </tr>
                        <tr className="bg-gray-800">
                          <td className="sticky left-0 bg-inherit px-4 py-2 text-sm border-r border-gray-600 w-[182px] z-10 text-white font-semibold">HARD CAP LIMIT</td>
                          <td className="px-3 py-3 text-center text-base w-24">{formatCurrency(calculateHardCapLimit('25-26'))}</td>
                          <td className="px-3 py-3 text-center text-base w-24">{formatCurrency(calculateHardCapLimit('26-27'))}</td>
                          <td className="px-3 py-3 text-center text-base w-24">{formatCurrency(calculateHardCapLimit('27-28'))}</td>
                          <td className="px-3 py-3 text-center text-base w-24">{formatCurrency(calculateHardCapLimit('28-29'))}</td>
                          <td className="px-3 py-3 text-center text-base w-24">{formatCurrency(calculateHardCapLimit('29-30'))}</td>
                          <td className="px-3 py-3 text-center text-base w-24">{formatCurrency(calculateHardCapLimit('30-31'))}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>

              {/* Roster Tables */}
              <section className="px-6 mb-6">
                <div className="flex gap-8 mb-4">
                  <h2 className="text-lg font-semibold text-white">MAIN ({active.length}/20)</h2>
                  <h2 className="text-lg font-semibold text-white">DEVELOPMENT ({dev.length}/6)</h2>
                  <h2 className="text-lg font-semibold text-white">INJURY ({inj.length}/2)</h2>
                </div>
                
                <RosterTable 
                  players={active} 
                  title="" 
                  maxSlots={20} 
                />
              </section>
              
              <section className="px-6 mb-6">
                <RosterTable 
                  players={dev} 
                  title="" 
                  maxSlots={6} 
                />
              </section>
              
              <section className="px-6 mb-6">
                <RosterTable 
                  players={inj} 
                  title="" 
                  maxSlots={2} 
                />
              </section>

              {/* Bottom spacing */}
              <div className="h-32"></div>
            </>
          )}

          {selectedSection === "depth-chart" && (
            <div className="px-6 pb-32">
              <h2 className="text-2xl font-bold mb-4 text-white">DEPTH CHART</h2>
              <div className="space-y-4">
                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3 text-white">Guards</h3>
                  <div className="text-gray-300">Coming Soon</div>
                </div>
                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3 text-white">Guard/Forward</h3>
                  <div className="text-gray-300">Coming Soon</div>
                </div>
                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3 text-white">Forward</h3>
                  <div className="text-gray-300">Coming Soon</div>
                </div>
                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3 text-white">Forward/Center</h3>
                  <div className="text-gray-300">Coming Soon</div>
                </div>
                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3 text-white">Center</h3>
                  <div className="text-gray-300">Coming Soon</div>
                </div>
              </div>
            </div>
          )}

          {selectedSection === "draft-picks" && (
            <div className="px-6 pb-32">
              <h2 className="text-2xl font-bold mb-4 text-white">FUTURE DRAFT PICKS</h2>
              <div className="space-y-4">
                {[2025, 2026, 2027, 2028, 2029, 2030, 2031].map(year => (
                  <div key={year} className="bg-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-3 text-white">{year}-{String(year + 1).slice(-2)}</h3>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-gray-300">1st Round</div>
                        <div className="font-semibold text-white">Coming Soon</div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-300">2nd Round</div>
                        <div className="font-semibold text-white">Coming Soon</div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-300">3rd Round</div>
                        <div className="font-semibold text-white">Coming Soon</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedSection === "season-history" && (
            <div className="px-6 pb-32">
              <h2 className="text-2xl font-bold mb-4 text-white">SEASON BY SEASON HISTORY</h2>
              <div className="bg-gray-700 rounded-lg p-6">
                <div className="text-gray-300">Coming Soon</div>
              </div>
            </div>
          )}

          {selectedSection === "player-stats" && (
            <div className="px-6 pb-32">
              <h2 className="text-2xl font-bold mb-4 text-white">ALL-TIME PLAYER STATS</h2>
              <div className="bg-gray-700 rounded-lg p-6">
                <div className="text-gray-300">Coming Soon</div>
              </div>
            </div>
          )}

          {selectedSection === "player-records" && (
            <div className="px-6 pb-32">
              <h2 className="text-2xl font-bold mb-4 text-white">PLAYER RECORDS</h2>
              <div className="bg-gray-700 rounded-lg p-6">
                <div className="text-gray-300">Coming Soon</div>
              </div>
            </div>
          )}

          {selectedSection === "team-records" && (
            <div className="px-6 pb-32">
              <h2 className="text-2xl font-bold mb-4 text-white">TEAM RECORDS</h2>
              <div className="bg-gray-700 rounded-lg p-6">
                <div className="text-gray-300">Coming Soon</div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
