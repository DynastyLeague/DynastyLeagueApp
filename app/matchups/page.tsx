'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Matchup, WeekDate, Team, Selection } from '@/lib/types';

export default function MatchupPage() {
  const [matchups, setMatchups] = useState<Matchup[]>([]);
  const [weekDates, setWeekDates] = useState<WeekDate[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [todayDate, setTodayDate] = useState<string>('');
  const [allSelections, setAllSelections] = useState<Selection[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [matchupsRes, weekDatesRes, teamsRes, currentTimeRes] = await Promise.all([
          fetch('/api/matchups'),
          fetch('/api/weekdates'),
          fetch('/api/teams'),
          fetch('/api/current-time')
        ]);

        if (matchupsRes.ok && weekDatesRes.ok && teamsRes.ok) {
          const matchupsData = await matchupsRes.json();
          const weekDatesData = await weekDatesRes.json();
          const teamsData = await teamsRes.json();

          setMatchups(matchupsData);
          setWeekDates(weekDatesData);
          setTeams(teamsData);

          // Get today's date and determine current week
          if (currentTimeRes.ok) {
            const { date } = await currentTimeRes.json();
            setTodayDate(date);

            // Parse today's date with better date handling
            let today: Date;
            if (date.includes('/')) {
              const parts = date.split('/');
              if (parts.length === 3) {
                const day = parseInt(parts[0]);
                const month = parseInt(parts[1]) - 1;
                const year = parseInt(parts[2]);
                today = new Date(year, month, day);
              } else {
                today = new Date(date);
              }
            } else {
              today = new Date(date);
            }

            // Sort weeks by week number to ensure proper order
            const sortedWeeks = [...weekDatesData].sort((a, b) => a.week - b.week);
            
            let currentWeek = sortedWeeks[0]?.week || 1; // Default to first week

            // Find the week that contains today's date
            for (const weekDate of sortedWeeks) {
              // Parse start and finish dates with better date handling
              let startDate: Date;
              if (weekDate.startDate.includes('/')) {
                const parts = weekDate.startDate.split('/');
                if (parts.length === 3) {
                  const day = parseInt(parts[0]);
                  const month = parseInt(parts[1]) - 1;
                  const year = parseInt(parts[2]);
                  startDate = new Date(year, month, day);
                } else {
                  startDate = new Date(weekDate.startDate);
                }
              } else {
                startDate = new Date(weekDate.startDate);
              }

              let finishDate: Date;
              if (weekDate.finishDate.includes('/')) {
                const parts = weekDate.finishDate.split('/');
                if (parts.length === 3) {
                  const day = parseInt(parts[0]);
                  const month = parseInt(parts[1]) - 1;
                  const year = parseInt(parts[2]);
                  finishDate = new Date(year, month, day);
                  // Set to end of day
                  finishDate.setHours(23, 59, 59, 999);
                } else {
                  finishDate = new Date(weekDate.finishDate);
                }
              } else {
                finishDate = new Date(weekDate.finishDate);
              }
              
              if (today >= startDate && today <= finishDate) {
                currentWeek = weekDate.week;
                break;
              }
            }

            // If today is past all weeks, show the last week
            if (sortedWeeks.length > 0) {
              const lastWeek = sortedWeeks[sortedWeeks.length - 1];
              let lastWeekFinishDate: Date;
              if (lastWeek.finishDate.includes('/')) {
                const parts = lastWeek.finishDate.split('/');
                if (parts.length === 3) {
                  const day = parseInt(parts[0]);
                  const month = parseInt(parts[1]) - 1;
                  const year = parseInt(parts[2]);
                  lastWeekFinishDate = new Date(year, month, day);
                  lastWeekFinishDate.setHours(23, 59, 59, 999);
                } else {
                  lastWeekFinishDate = new Date(lastWeek.finishDate);
                }
              } else {
                lastWeekFinishDate = new Date(lastWeek.finishDate);
              }
              
              if (today > lastWeekFinishDate) {
                currentWeek = lastWeek.week;
              }
            }

            setSelectedWeek(currentWeek);
          } else if (weekDatesData.length > 0) {
            // Fallback to first week if current time API fails
            const sortedWeeks = [...weekDatesData].sort((a, b) => a.week - b.week);
            setSelectedWeek(sortedWeeks[0].week);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch selections when week changes
  useEffect(() => {
    const fetchSelections = async () => {
      if (selectedWeek) {
        try {
          const selectionsRes = await fetch(`/api/selections?week=${selectedWeek}`);
          if (selectionsRes.ok) {
            const selectionsData = await selectionsRes.json();
            setAllSelections(selectionsData);
          }
        } catch (error) {
          console.error('Error fetching selections:', error);
        }
      }
    };

    fetchSelections();
  }, [selectedWeek]);

  const getTeamById = (teamId: string) => {
    return teams.find(team => team.teamId === teamId);
  };


  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short'
    });
  };

  const formatDateRange = (startDate: string, finishDate: string) => {
    const start = formatDate(startDate);
    const end = formatDate(finishDate);
    const year = new Date(startDate).getFullYear();
    return `${start} - ${end} ${year}`;
  };

  // Get today's games for a specific matchup and team
  const getTodayGames = (matchupId: string, teamId: string) => {
    return allSelections.filter(sel => 
      sel.matchupId === matchupId && 
      sel.teamId === teamId && 
      sel.gameDate === todayDate &&
      !sel.position.toLowerCase().includes('res') // Exclude reserves
    );
  };

  // Format stat value (for non-percentage stats)
  const formatStat = (value: number | undefined, hasStarted: boolean = false) => {
    if (!value || value === 0) {
      // If game has started (MIN >= 1), show 0 instead of -
      return hasStarted ? '0' : '-';
    }
    // Remove .0 for whole numbers
    return value % 1 === 0 ? value.toString() : value.toFixed(1);
  };

  // Format percentage stat (keep - if no data, even if game started)
  const formatPercentStat = (value: number | undefined) => {
    if (!value || value === 0) return '-';
    // Remove .0 for whole numbers
    return value % 1 === 0 ? value.toString() : value.toFixed(1);
  };

  // Get short team name (second part after first space)
  const getShortTeamName = (teamId: string) => {
    const team = getTeamById(teamId);
    if (!team?.teamName) return teamId.toUpperCase();
    
    const teamNameUpper = team.teamName.toUpperCase();
    
    // Special mappings for specific teams (case-insensitive)
    if (teamNameUpper.includes('CHASING') && teamNameUpper.includes('BOARDS')) {
      return 'BOARDS';
    }
    if (teamNameUpper.includes('MONEY') && teamNameUpper.includes('MAGNETS')) {
      return 'MAGNETS';
    }
    if (teamNameUpper === 'NATION' || teamNameUpper.includes('NATION')) {
      return 'SQUIB';
    }
    if (teamNameUpper.includes('FOREVER') && teamNameUpper.includes('WEMBY')) {
      return 'FOREVERS';
    }
    
    const nameParts = team.teamName.split(' ');
    if (nameParts.length > 1) {
      // Return everything after the first word, in uppercase
      return nameParts.slice(1).join(' ').toUpperCase();
    }
    return team.teamName.toUpperCase();
  };

  const filteredMatchups = matchups.filter(matchup => matchup.week === selectedWeek);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-800 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-800">
      <style jsx>{`
        select {
          font-size: 1.5rem; /* text-2xl - 20% smaller than text-3xl */
        }
        select option {
          font-size: 1rem; /* text-base - 20% smaller than text-xl */
          padding: 0.5rem;
          background-color: #374151; /* bg-gray-700 */
          color: white;
        }
        select:focus {
          outline: none;
          border-color: #f97316; /* orange-500 */
        }
      `}</style>
      {/* Header */}
      <div className="bg-orange-500 text-white p-6 sm:p-12 pb-8 sm:pb-16 mb-6 sm:mb-12">
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-center">DYNASTY LEAGUE MATCHUPS</h1>
      </div>

      {/* White Spacer */}
      <div className="h-5 bg-gray-800"></div>

      {/* Week Selection Dropdown */}
      <div className="px-6 mb-12">
        <select
          value={selectedWeek}
          onChange={(e) => setSelectedWeek(parseInt(e.target.value))}
          className="w-full bg-gray-700 text-white text-2xl px-4 py-3 border border-gray-600 rounded-none focus:outline-none focus:border-orange-500 appearance-none"
        >
          {weekDates.map((week) => (
            <option key={week.week} value={week.week}>
              WEEK {week.week} ({formatDateRange(week.startDate, week.finishDate)})
            </option>
          ))}
        </select>
      </div>

      {/* Dark Gray Spacer */}
      <div className="h-10 bg-gray-800"></div>

      {/* Matchups */}
      <div className="px-4 sm:px-6 pb-12 container-responsive">
        {filteredMatchups.map((matchup) => (
          <Link key={matchup.matchupId} href={`/matchups/${matchup.matchupId}`}>
            <div className="bg-gray-800 py-4 px-4 sm:py-6 sm:px-8 cursor-pointer hover:bg-gray-700 transition-colors mb-12 overflow-hidden">
              <div className="flex items-center justify-between flex-wrap gap-2">
                {/* Team 1 */}
                <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center flex-shrink-0">
                    {(() => {
                      const team1 = getTeamById(matchup.team1Id);
                      if (team1?.teamId) {
                        return (
                          <Image
                            src={`/logos/${team1.teamId}-main.png.png`}
                            alt={team1.teamName}
                            width={64}
                            height={64}
                            className="object-contain w-16 h-16 sm:w-20 sm:h-20"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        );
                      }
                      return <span className="text-white text-base sm:text-sm">T1</span>;
                    })()}
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <div className="text-gray-400 text-sm sm:text-base">
                      <div className="font-bold">GP</div>
                      <div>{matchup.team1Gp}/9</div>
                    </div>
                  </div>
                </div>

                {/* Scores */}
                <div className="text-center px-4 sm:px-12 flex-shrink-0 min-w-0">
                  <div className="text-2xl sm:text-4xl font-bold flex items-center justify-center gap-3 sm:gap-6">
                    <span className={`min-w-[2rem] sm:min-w-[3rem] ${matchup.team1Score > matchup.team2Score ? 'text-green-400' : matchup.team1Score < matchup.team2Score ? 'text-red-400' : 'text-gray-400'}`}>
                      {matchup.team1Score}
                    </span>
                    <span className="text-sm sm:text-lg text-gray-300">vs</span>
                    <span className={`min-w-[2rem] sm:min-w-[3rem] ${matchup.team2Score > matchup.team1Score ? 'text-green-400' : matchup.team2Score < matchup.team1Score ? 'text-red-400' : 'text-gray-400'}`}>
                      {matchup.team2Score}
                    </span>
                  </div>
                </div>

                {/* Team 2 */}
                <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0 justify-end">
                  <div className="min-w-0 flex-1 text-right">
                    <div className="text-gray-400 text-sm sm:text-base">
                      <div className="font-bold">GP</div>
                      <div>{matchup.team2Gp}/9</div>
                    </div>
                  </div>
                  <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center flex-shrink-0">
                    {(() => {
                      const team2 = getTeamById(matchup.team2Id);
                      if (team2?.teamId) {
                        return (
                          <Image
                            src={`/logos/${team2.teamId}-main.png.png`}
                            alt={team2.teamName}
                            width={64}
                            height={64}
                            className="object-contain w-16 h-16 sm:w-20 sm:h-20"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        );
                      }
                      return <span className="text-white text-base sm:text-sm">T2</span>;
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Today's Live Games Section */}
      {todayDate && filteredMatchups.some(m => 
        getTodayGames(m.matchupId, m.team1Id).length > 0 || getTodayGames(m.matchupId, m.team2Id).length > 0
      ) && (
        <>
          {/* Spacer */}
          <div className="h-16 bg-gray-800"></div>

          {/* Section Header */}
          <div className="bg-orange-500 text-white p-6 sm:p-12 pb-8 sm:pb-16 mb-6 sm:mb-12">
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-center">TODAY&apos;S LIVE GAMES</h2>
          </div>

          {/* Games Content */}
          <div className="px-4 sm:px-6 pb-12 container-responsive">
            <div className="space-y-6 text-xs">
              {filteredMatchups.map((matchup) => {
                const team1Games = getTodayGames(matchup.matchupId, matchup.team1Id);
                const team2Games = getTodayGames(matchup.matchupId, matchup.team2Id);
                const hasAnyGames = team1Games.length > 0 || team2Games.length > 0;
                
                if (!hasAnyGames) return null;
                
                return (
                  <div key={matchup.matchupId} className="bg-gray-800 py-6 px-4 sm:py-8 sm:px-8">
                    {/* Team 1 Today's Games */}
                    {team1Games.length > 0 && (
                      <div className={team2Games.length > 0 ? "mb-6" : ""}>
                        {/* Header Row */}
                        <div className="flex items-center py-1 text-gray-500 font-bold border-b border-gray-700 mb-1">
                          <span className="w-28 flex-shrink-0">{getShortTeamName(matchup.team1Id)}</span>
                          <div className="flex flex-1 text-[10px]">
                            <span className="flex-1 text-center">PTS</span>
                            <span className="flex-1 text-center">3PM</span>
                            <span className="flex-1 text-center">AST</span>
                            <span className="flex-1 text-center">STL</span>
                            <span className="flex-1 text-center">BLK</span>
                            <span className="flex-1 text-center">ORB</span>
                            <span className="flex-1 text-center">DRB</span>
                            <span className="flex-[1.5] text-center">FG%</span>
                            <span className="flex-[1.5] text-center">FT%</span>
                            <span className="flex-1 text-center">MIN</span>
                          </div>
                        </div>
                        {/* Player Rows */}
                        {team1Games.map((player, idx) => {
                          const nameParts = player.playerName.split(' ');
                          const firstInitial = nameParts[0] ? nameParts[0][0].toUpperCase() : '';
                          
                          const suffixes = ['JR', 'SR', 'II', 'III', 'IV', 'V', 'JR.', 'SR.'];
                          const lastPart = nameParts[nameParts.length - 1].toUpperCase();
                          const isSuffix = suffixes.includes(lastPart.replace('.', ''));
                          
                          let surname;
                          if (isSuffix && nameParts.length > 2) {
                            surname = `${nameParts[nameParts.length - 2].toUpperCase()} ${lastPart}`;
                          } else {
                            surname = lastPart;
                          }
                          
                          const displayName = firstInitial ? `${firstInitial}. ${surname}` : surname;
                          const hasStarted = (player.min || 0) >= 1;
                          
                          return (
                            <div key={idx} className="flex items-center py-1 text-gray-300">
                              <span className="w-28 flex-shrink-0 font-medium truncate">{displayName}</span>
                              <div className="flex flex-1 text-[10px]">
                                <span className="flex-1 text-center">{formatStat(player.pts, hasStarted)}</span>
                                <span className="flex-1 text-center">{formatStat(player.threePm, hasStarted)}</span>
                                <span className="flex-1 text-center">{formatStat(player.ast, hasStarted)}</span>
                                <span className="flex-1 text-center">{formatStat(player.stl, hasStarted)}</span>
                                <span className="flex-1 text-center">{formatStat(player.blk, hasStarted)}</span>
                                <span className="flex-1 text-center">{formatStat(player.orb, hasStarted)}</span>
                                <span className="flex-1 text-center">{formatStat(player.drb, hasStarted)}</span>
                                <span className="flex-[1.5] text-center">{formatPercentStat(player.fgPercent)}</span>
                                <span className="flex-[1.5] text-center">{formatPercentStat(player.ftPercent)}</span>
                                <span className="flex-1 text-center">{formatStat(player.min, hasStarted)}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Team 2 Today's Games */}
                    {team2Games.length > 0 && (
                      <div>
                        {/* Header Row */}
                        <div className="flex items-center py-1 text-gray-500 font-bold border-b border-gray-700 mb-1">
                          <span className="w-28 flex-shrink-0">{getShortTeamName(matchup.team2Id)}</span>
                          <div className="flex flex-1 text-[10px]">
                            <span className="flex-1 text-center">PTS</span>
                            <span className="flex-1 text-center">3PM</span>
                            <span className="flex-1 text-center">AST</span>
                            <span className="flex-1 text-center">STL</span>
                            <span className="flex-1 text-center">BLK</span>
                            <span className="flex-1 text-center">ORB</span>
                            <span className="flex-1 text-center">DRB</span>
                            <span className="flex-[1.5] text-center">FG%</span>
                            <span className="flex-[1.5] text-center">FT%</span>
                            <span className="flex-1 text-center">MIN</span>
                          </div>
                        </div>
                        {/* Player Rows */}
                        {team2Games.map((player, idx) => {
                          const nameParts = player.playerName.split(' ');
                          const firstInitial = nameParts[0] ? nameParts[0][0].toUpperCase() : '';
                          
                          const suffixes = ['JR', 'SR', 'II', 'III', 'IV', 'V', 'JR.', 'SR.'];
                          const lastPart = nameParts[nameParts.length - 1].toUpperCase();
                          const isSuffix = suffixes.includes(lastPart.replace('.', ''));
                          
                          let surname;
                          if (isSuffix && nameParts.length > 2) {
                            surname = `${nameParts[nameParts.length - 2].toUpperCase()} ${lastPart}`;
                          } else {
                            surname = lastPart;
                          }
                          
                          const displayName = firstInitial ? `${firstInitial}. ${surname}` : surname;
                          const hasStarted = (player.min || 0) >= 1;
                          
                          return (
                            <div key={idx} className="flex items-center py-1 text-gray-300">
                              <span className="w-28 flex-shrink-0 font-medium truncate">{displayName}</span>
                              <div className="flex flex-1 text-[10px]">
                                <span className="flex-1 text-center">{formatStat(player.pts, hasStarted)}</span>
                                <span className="flex-1 text-center">{formatStat(player.threePm, hasStarted)}</span>
                                <span className="flex-1 text-center">{formatStat(player.ast, hasStarted)}</span>
                                <span className="flex-1 text-center">{formatStat(player.stl, hasStarted)}</span>
                                <span className="flex-1 text-center">{formatStat(player.blk, hasStarted)}</span>
                                <span className="flex-1 text-center">{formatStat(player.orb, hasStarted)}</span>
                                <span className="flex-1 text-center">{formatStat(player.drb, hasStarted)}</span>
                                <span className="flex-[1.5] text-center">{formatPercentStat(player.fgPercent)}</span>
                                <span className="flex-[1.5] text-center">{formatPercentStat(player.ftPercent)}</span>
                                <span className="flex-1 text-center">{formatStat(player.min, hasStarted)}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Bottom padding for navigation */}
      <div className="h-40"></div>
    </div>
  );
}