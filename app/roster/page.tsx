"use client";

import { useEffect, useState } from "react";
import { Team, Player, Matchup, WeekDate } from "@/lib/types";
import { getTeamRosterByStatus } from "@/lib/googleSheets";
import RosterTable from "@/components/RosterTable";
import { useAuth } from "@/lib/auth";

export default function RosterPage() {
  const { currentTeam } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [active, setActive] = useState<Player[]>([]);
  const [dev, setDev] = useState<Player[]>([]);
  const [inj, setInj] = useState<Player[]>([]);
  const [draftCapital, setDraftCapital] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSection, setSelectedSection] = useState<string>("home");
  const [currentMatchup, setCurrentMatchup] = useState<Matchup | null>(null);
  const [upcomingMatchup, setUpcomingMatchup] = useState<Matchup | null>(null);
  const [currentWeek, setCurrentWeek] = useState<number>(0);

  // Load teams on mount and set current team as default
  useEffect(() => {
    const loadTeams = async () => {
      try {
        const res = await fetch("/api/teams");
        if (res.ok) {
          const data: Team[] = await res.json();
          setTeams(data);
          
          // Set current team as default if available, otherwise first team
          if (currentTeam) {
            setSelectedTeamId(currentTeam.teamId);
            setSelectedTeam(currentTeam);
          } else if (data.length > 0) {
            setSelectedTeamId(data[0].teamId);
            setSelectedTeam(data[0]);
          }
        }
      } catch (error) {
        console.error("Error loading teams:", error);
      }
    };
    loadTeams();
  }, [currentTeam]);

  // Determine current week based on current date from Google Sheets
  const getCurrentWeek = async (weekDates: WeekDate[]): Promise<number> => {
    try {
      const currentTimeRes = await fetch('/api/current-time');
      if (!currentTimeRes.ok) {
        console.error('Failed to fetch current time');
        return 1;
      }
      
      const currentTime = await currentTimeRes.json();
      const currentDate = new Date(currentTime.currentDate);
      
      for (const weekDate of weekDates) {
        const weekStart = new Date(weekDate.startDate);
        const weekEnd = new Date(weekDate.finishDate);
        
        if (currentDate >= weekStart && currentDate <= weekEnd) {
          return weekDate.week;
        }
      }
      
      return 1; // Default to week 1 if no match found
    } catch (error) {
      console.error('Error determining current week:', error);
      return 1;
    }
  };

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
          setDraftCapital(draftData);
        }

        // Load matchup data
        const [matchupsRes, weekDatesRes] = await Promise.all([
          fetch('/api/matchups'),
          fetch('/api/weekdates'),
        ]);

        if (weekDatesRes.ok) {
          const weekDatesData: WeekDate[] = await weekDatesRes.json();
          
          const calculatedWeek = await getCurrentWeek(weekDatesData);
          setCurrentWeek(calculatedWeek);
        }

        if (matchupsRes.ok) {
          const matchupsData: Matchup[] = await matchupsRes.json();
          
          // Find current matchup
          const currentMatch = matchupsData.find(m => 
            (m.team1Id === selectedTeamId || m.team2Id === selectedTeamId) && 
            m.week === currentWeek
          );
          setCurrentMatchup(currentMatch || null);

          // Find upcoming matchup (next week)
          const upcomingMatch = matchupsData.find(m => 
            (m.team1Id === selectedTeamId || m.team2Id === selectedTeamId) && 
            m.week === currentWeek + 1
          );
          setUpcomingMatchup(upcomingMatch || null);
        }
      } catch (error) {
        console.error("Error loading roster data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadRosterData();
  }, [selectedTeamId, currentWeek]);

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
    let salaryCap = year === '25-26' ? 247.2 : 276.87;
    
    // Add Dynasty Cup bonus for 25-26 season only
    if (year === '25-26' && selectedTeam) {
      const dynastyCupBonuses: Record<string, number> = {
        'T001': 12.36, // Armstrong's Army
        'T002': 3.71,  // Bort Chasing Boards
        'T003': 3.71,  // Easy Money Magnets
        'T004': 12.36, // Forever Young, Forever Wemby
        'T011': 7.42,  // Squib Nation
        'T012': 3.71,  // Tragic Bonsons
        'T013': 3.71,  // Willsy's Gentlemen
        'T014': 7.42   // Winchelsea Hardons
      };
      
      const bonus = dynastyCupBonuses[selectedTeam.teamId] || 0;
      salaryCap += bonus;
    }
    
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

  // Get players by position for depth chart
  const getPlayersByPosition = (position: string) => {
    const allPlayers = [...active, ...dev, ...inj];
    return allPlayers.filter(player => {
      const playerPos = player.position.toUpperCase();
      switch (position) {
        case "G":
          return playerPos === "G";
        case "G/F":
          return playerPos === "G/F";
        case "F":
          return playerPos === "F";
        case "F/C":
          return playerPos === "F/C";
        case "C":
          return playerPos === "C";
        default:
          return false;
      }
    }).sort((a, b) => {
      // Sort by 2YR-RK (lowest to highest)
      const rankA = a.twoYearRank;
      const rankB = b.twoYearRank;
      
      // Treat no data or "-" as highest (no ranking yet)
      if (!rankA || rankA === "-" || rankA === "") return 1;
      if (!rankB || rankB === "-" || rankB === "") return -1;
      
      // Convert to numbers for comparison
      const numA = parseFloat(rankA.toString());
      const numB = parseFloat(rankB.toString());
      
      if (isNaN(numA)) return 1;
      if (isNaN(numB)) return -1;
      
      return numA - numB;
    });
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
                  className="w-full px-4 py-3 border border-gray-600 bg-gray-700 text-white text-xl font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-10"
          >
            {teams.map((team) => (
              <option key={team.teamId} value={team.teamId} className="bg-gray-700 text-white">
                {team.teamName.toUpperCase()}
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
            className="w-full px-4 py-3 border border-gray-600 bg-gray-700 text-white text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-10"
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
            <div className="px-6 pb-40">
              <h2 className="text-2xl font-bold mb-4 text-white">TEAM HOME</h2>
              
              {/* Current Matchup */}
              <div className="bg-gray-700 p-6 mb-6">
                <h3 className="text-xl font-semibold mb-4 text-white">Current Matchup</h3>
                {currentMatchup ? (
                  <div className="text-gray-300">
                    <div className="text-lg font-semibold text-white mb-2">
                      Week {currentMatchup.week} vs {currentMatchup.team1Id === selectedTeamId ? currentMatchup.team2Name : currentMatchup.team1Name}
                    </div>
                    <div className="text-sm">
                      ({currentMatchup.team1Id === selectedTeamId ? 
                        `${currentMatchup.team1Score} vs ${currentMatchup.team2Score}` : 
                        `${currentMatchup.team2Score} vs ${currentMatchup.team1Score}`})
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-300">No current matchup found</div>
                )}
              </div>

              {/* Upcoming Matchup */}
              <div className="bg-gray-700 p-6 mb-6">
                <h3 className="text-xl font-semibold mb-4 text-white">Upcoming Matchup</h3>
                {upcomingMatchup ? (
                  <div className="text-gray-300">
                    <div className="text-lg font-semibold text-white mb-2">
                      Week {upcomingMatchup.week} vs {upcomingMatchup.team1Id === selectedTeamId ? upcomingMatchup.team2Name : upcomingMatchup.team1Name}
                    </div>
                    <div className="text-sm">
                      (Coming Soon)
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-300">No upcoming matchup found</div>
                )}
              </div>

              {/* Season Record & Standing */}
              <div className="bg-gray-700 p-6">
                <h3 className="text-xl font-semibold mb-4 text-white">Season Record & Standing</h3>
                <div className="text-gray-300 space-y-1">
                  <div className="text-sm">Position: TBD</div>
                  <div className="text-sm">Record: TBD</div>
                </div>
              </div>
            </div>
          )}

          {selectedSection === "rosters" && (
            <>
              {/* Salary Cap Breakdown */}
              <section className="px-6 mb-2">
                <h2 className="text-2xl font-bold mb-4 text-white">SALARY CAP BREAKDOWN</h2>
                <div className="bg-gray-800 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full table-fixed">
                      <thead className="bg-gray-700 sticky top-0 z-20">
                        <tr>
                          <th className="sticky left-0 bg-gray-700 px-4 py-3 text-left text-sm font-medium text-gray-300 border-r border-gray-600 w-[182px] z-30">
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
                <div className="space-y-4 mb-4">
                  <h2 className="text-lg font-semibold text-white">MAIN ROSTER ({active.length}/20)</h2>
                  <h2 className="text-lg font-semibold text-white">DEVELOPMENT ({dev.length}/6)</h2>
                  <h2 className="text-lg font-semibold text-white">INJURY RESERVE ({inj.length}/2)</h2>
                </div>
                
            <RosterTable 
              players={active} 
                  title="" 
              maxSlots={20}
              headerTitle="MAIN ROSTER"
            />
          </section>
          
          <section className="px-6 mb-6">
            <RosterTable 
              players={dev} 
                  title="" 
              maxSlots={6}
              headerTitle="DEVELOPMENT LIST"
            />
          </section>
          
          <section className="px-6 mb-6">
            <RosterTable 
              players={inj} 
                  title="" 
              maxSlots={2}
              headerTitle="LONG TERM INJURY"
            />
          </section>

              {/* Bottom spacing */}
              <div className="h-32"></div>
            </>
          )}

          {selectedSection === "depth-chart" && (
            <div className="px-6 pb-48">
              <h2 className="text-2xl font-bold mb-4 text-white">DEPTH CHART</h2>
              <div className="space-y-6">
                {[
                  { key: "G", title: "Guard" },
                  { key: "G/F", title: "Guard/Forward" },
                  { key: "F", title: "Forward" },
                  { key: "F/C", title: "Forward/Center" },
                  { key: "C", title: "Center" }
                ].map(({ key, title }, index) => {
                  const positionPlayers = getPlayersByPosition(key);
                  return (
                    <div key={key}>
                      <div className="bg-gray-700 p-4">
                        <h3 className="text-lg font-semibold mb-3 text-white">
                          {title} ({positionPlayers.length})
                        </h3>
                        <div className="space-y-2">
                          {positionPlayers.length > 0 ? (
                            positionPlayers.map((player) => (
                              <div key={player.playerId} className="text-gray-300 text-sm">
                                {player.name} ({player.nbaTeam}) - Ranked #{player.twoYearRank || "-"}
                              </div>
                            ))
                          ) : (
                            <div className="text-gray-500 text-sm italic">No players at this position</div>
                          )}
                        </div>
                      </div>
                      {/* Spacer line between positions */}
                      {index < 4 && (
                        <div className="h-4"></div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {selectedSection === "draft-picks" && (
            <div className="px-6 pb-48">
              <h2 className="text-2xl font-bold mb-4 text-white">CURRENT DRAFT CAPITAL</h2>
              
              {/* Draft Picks by Year */}
              <div className="space-y-6">
                {[2026, 2027, 2028, 2029, 2030].map((year, index) => (
                  <div key={year}>
                    <div className="bg-gray-700 p-4">
                      <h3 className="text-lg font-semibold mb-3 text-white">{year}</h3>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="text-center">
                          <div className="text-gray-300">1st Round</div>
                          <div className="font-semibold text-white">{draftCapital?.[`${year} Round 1`] || '—'}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-gray-300">2nd Round</div>
                          <div className="font-semibold text-white">{draftCapital?.[`${year} Round 2`] || '—'}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-gray-300">3rd Round</div>
                          <div className="font-semibold text-white">{draftCapital?.[`${year} Round 3`] || '—'}</div>
                        </div>
                      </div>
                    </div>
                    {/* Spacer line between years */}
                    {index < 4 && (
                      <div className="h-4"></div>
                    )}
                  </div>
                ))}
              </div>

              {/* Notes Section */}
              {draftCapital?.NOTES && (
                <div className="bg-gray-700 p-4 mt-6">
                  <h3 className="text-lg font-semibold mb-3 text-white">NOTES</h3>
                  <div className="text-gray-300 whitespace-pre-line text-sm">
                    {draftCapital.NOTES}
                  </div>
                </div>
              )}
            </div>
          )}

          {selectedSection === "season-history" && (
            <div className="px-6 pb-40">
              <h2 className="text-2xl font-bold mb-4 text-white">SEASON BY SEASON HISTORY</h2>
              <div className="bg-gray-700 p-6">
                <div className="text-gray-300">Coming Soon</div>
              </div>
            </div>
          )}

          {selectedSection === "player-stats" && (
            <div className="px-6 pb-40">
              <h2 className="text-2xl font-bold mb-4 text-white">ALL-TIME PLAYER STATS</h2>
              <div className="bg-gray-700 p-6">
                <div className="text-gray-300">Coming Soon</div>
              </div>
            </div>
          )}

          {selectedSection === "player-records" && (
            <div className="px-6 pb-40">
              <h2 className="text-2xl font-bold mb-4 text-white">PLAYER RECORDS</h2>
              <div className="bg-gray-700 p-6">
                <div className="text-gray-300">Coming Soon</div>
              </div>
            </div>
          )}

          {selectedSection === "team-records" && (
            <div className="px-6 pb-40">
              <h2 className="text-2xl font-bold mb-4 text-white">TEAM RECORDS</h2>
              <div className="bg-gray-700 p-6">
                <div className="text-gray-300">Coming Soon</div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
