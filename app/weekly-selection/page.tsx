"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from '@/lib/auth';
import LoginForm from '@/components/LoginForm';
import { Player, Matchup, WeekDate, Game, LineupSlot, Team } from '@/lib/types';

const STARTER_SLOTS: LineupSlot[] = [
  { id: "guard1", name: "Guard 1", position: "G" },
  { id: "guard2", name: "Guard 2", position: "G" },
  { id: "forward1", name: "Forward 1", position: "F" },
  { id: "forward2", name: "Forward 2", position: "F" },
  { id: "centre", name: "Centre", position: "C" },
  { id: "guardForward", name: "Guard/Forward", position: "G/F" },
  { id: "forwardCentre", name: "Forward/Centre", position: "F/C" },
  { id: "flex1", name: "Flex 1", position: "ANY" },
  { id: "flex2", name: "Flex 2", position: "ANY" },
];

const RESERVE_SLOTS: LineupSlot[] = [
  { id: "guardRes", name: "Res Guard", position: "G" },
  { id: "forwardCentreRes", name: "Res Forward/Center", position: "F/C" },
  { id: "flexRes", name: "Res Flex", position: "ANY" },
];

export default function WeeklySelectionPage() {
  const { currentTeam, role, isLoading } = useAuth();
  const [lineup, setLineup] = useState<Record<string, LineupSlot>>({});
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [matchups, setMatchups] = useState<Matchup[]>([]);
  const [weekDates, setWeekDates] = useState<WeekDate[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [currentWeek, setCurrentWeek] = useState<number>(0);
  const [currentMatchup, setCurrentMatchup] = useState<Matchup | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submittedSelections, setSubmittedSelections] = useState<unknown[]>([]);
  const [viewTeamId, setViewTeamId] = useState<string | null>(null);

  // Determine current week based on current date from Google Sheets
  const getCurrentWeek = async (weekDates: WeekDate[]): Promise<number> => {
    try {
      // Fetch current date/time from TodaysDate tab
      const currentTimeRes = await fetch('/api/current-time');
      if (!currentTimeRes.ok) {
        console.error('Failed to fetch current time');
        return 1;
      }
      
      const { date: todaysDate } = await currentTimeRes.json();
      console.log('TodaysDate from sheet:', todaysDate);
      
      // Parse the current date - handle DD/MM/YYYY format
      let currentDate: Date;
      if (todaysDate.includes('/')) {
        const parts = todaysDate.split('/');
        if (parts.length === 3) {
          // Assuming DD/MM/YYYY format
          const day = parseInt(parts[0]);
          const month = parseInt(parts[1]) - 1; // JavaScript months are 0-indexed
          const year = parseInt(parts[2]);
          currentDate = new Date(year, month, day);
        } else {
          currentDate = new Date(todaysDate);
        }
      } else {
        currentDate = new Date(todaysDate);
      }
      
      console.log('Parsed current date:', currentDate);
      
      // Sort weeks by week number to ensure proper order
      const sortedWeeks = [...weekDates].sort((a, b) => a.week - b.week);
      
      for (let i = 0; i < sortedWeeks.length; i++) {
        const week = sortedWeeks[i];
        
        // Parse start date in the same way
        let startDate: Date;
        if (week.startDate.includes('/')) {
          const parts = week.startDate.split('/');
          if (parts.length === 3) {
            const day = parseInt(parts[0]);
            const month = parseInt(parts[1]) - 1;
            const year = parseInt(parts[2]);
            startDate = new Date(year, month, day);
          } else {
            startDate = new Date(week.startDate);
          }
        } else {
          startDate = new Date(week.startDate);
        }
        
        console.log(`Week ${week.week} start date:`, startDate, 'Current >= Start:', currentDate >= startDate);
        
        // If current date is >= this week's start date, we're in or past this week
        // So we should show the NEXT week for selections
        if (currentDate >= startDate) {
          const nextWeekIndex = i + 1;
          if (nextWeekIndex < sortedWeeks.length) {
            console.log(`Current date is in/past week ${week.week}, returning next week ${sortedWeeks[nextWeekIndex].week}`);
            return sortedWeeks[nextWeekIndex].week;
          } else {
            // We're in the last week, so return the last week
            console.log(`In last week ${week.week}, returning it`);
            return week.week;
          }
        }
      }
      
      // If we haven't started any weeks yet, return the first week
      console.log('Before all weeks, returning first week:', sortedWeeks[0]?.week || 1);
      return sortedWeeks[0]?.week || 1;
    } catch (error) {
      console.error('Error calculating current week:', error);
      return 1;
    }
  };

  // Filter players by position
  const getPlayersForPosition = (position: string, availablePlayers: Player[]): Player[] => {
    return availablePlayers.filter(player => {
      const playerPos = player.position.toUpperCase();
      switch (position) {
        case "G":
          return playerPos.includes("G");
        case "F":
          return playerPos.includes("F");
        case "C":
          return playerPos === "C" || playerPos === "F/C";
        case "G/F":
          return playerPos.includes("G") || playerPos.includes("F");
        case "F/C":
          return playerPos.includes("F") || playerPos.includes("C");
        case "ANY":
          return true;
        default:
          return false;
      }
    });
  };

  // Get available players (not already selected)
  const getAvailablePlayers = (position: string, currentSlotId: string): Player[] => {
    const selectedPlayerIds = Object.values(lineup)
      .filter(slot => slot.id !== currentSlotId && slot.playerId)
      .map(slot => slot.playerId);
    
    const availablePlayers = players.filter(player => 
      !selectedPlayerIds.includes(player.playerId) &&
      (player.rosterStatus === "ACTIVE" || player.rosterStatus === "DEVELOPMENT")
    );
    
    const filteredPlayers = getPlayersForPosition(position, availablePlayers);
    
    // Sort by salary25_26 (highest to lowest) - handle both numbers and strings
    return filteredPlayers.sort((a, b) => {
      const salaryA = typeof a.salary25_26 === 'number' ? a.salary25_26 : 0;
      const salaryB = typeof b.salary25_26 === 'number' ? b.salary25_26 : 0;
      return salaryB - salaryA;
    });
  };

  // Format game display
  const formatGameDisplay = (game: Game): string => {
    try {
      // Handle Australian date format (DD/MM/YYYY or DD-MM-YYYY)
      let dateStr = game.date;
      if (dateStr.includes('/')) {
        const [day, month, year] = dateStr.split('/');
        dateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      } else if (dateStr.includes('-') && !dateStr.includes('T')) {
        const [day, month, year] = dateStr.split('-');
        if (day.length === 4) {
          // Already in YYYY-MM-DD format
          dateStr = dateStr;
        } else {
          // DD-MM-YYYY format
          dateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
      }
      
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return `Invalid date: ${game.date}`;
      }
      
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      return `${dayName} ${game.homeAway} ${game.opponent}`;
    } catch {
      return `Error: ${game.date}`;
    }
  };

  // Load previously submitted selections
  const loadPreviousSelections = async (teamId: string, week: number, gamesData?: Game[]) => {
    try {
      const selectionsRes = await fetch(`/api/selections?teamId=${encodeURIComponent(teamId)}&week=${week}`);
      if (selectionsRes.ok) {
        const selections = await selectionsRes.json();
        
        // Map position names to slot IDs
        const positionToSlotId: Record<string, string> = {
          'Guard 1': 'guard1',
          'Guard 2': 'guard2',
          'Forward 1': 'forward1',
          'Forward 2': 'forward2',
          'Centre': 'centre',
          'Guard/Forward': 'guardForward',
          'Forward/Centre': 'forwardCentre',
          'Flex 1': 'flex1',
          'Flex 2': 'flex2',
          'Res Guard': 'guardRes',
          'Res Forward/Center': 'forwardCentreRes',
          'Res Flex': 'flexRes',
        };

        // Use provided games data or fall back to state
        const gamesToSearch = gamesData || games;

        // Build lineup from selections
        const newLineup: Record<string, LineupSlot> = {};
        
        for (const selection of selections) {
          const slotId = positionToSlotId[selection.position];
          if (slotId) {
            // Find the matching game for this selection
            const matchingGame = gamesToSearch.find(g => 
              g.nbaTeam === selection.nbaTeam && g.date === selection.gameDate
            );

            newLineup[slotId] = {
              id: slotId,
              name: selection.position,
              position: STARTER_SLOTS.find(s => s.id === slotId)?.position || RESERVE_SLOTS.find(s => s.id === slotId)?.position || "ANY",
              playerId: selection.playerId,
              gameId: matchingGame ? `${matchingGame.nbaTeam}-${matchingGame.date}` : undefined,
            };
          }
        }

        setLineup(newLineup);
        setSubmittedSelections(selections);
      }
    } catch (error) {
      console.error('Error loading previous selections:', error);
    }
  };

  const loadData = useCallback(async () => {
    if (!currentTeam) return;
    
    setDataLoading(true);
    try {
      const effectiveTeamId = viewTeamId || currentTeam.teamId;
      const [playersRes, matchupsRes, weekDatesRes, teamsRes] = await Promise.all([
        fetch(`/api/players?teamId=${encodeURIComponent(effectiveTeamId)}`),
        fetch('/api/matchups'),
        fetch('/api/weekdates'),
        fetch('/api/teams'),
      ]);

      if (playersRes.ok) {
        const playersData: Player[] = await playersRes.json();
        setPlayers(playersData);
      }

      if (teamsRes.ok) {
        const teamsData: Team[] = await teamsRes.json();
        setTeams(teamsData);
      }

      if (matchupsRes.ok) {
        const matchupsData: Matchup[] = await matchupsRes.json();
        setMatchups(matchupsData);
      }

      if (weekDatesRes.ok) {
        const weekDatesData: WeekDate[] = await weekDatesRes.json();
        setWeekDates(weekDatesData);
        
        // Calculate the current/upcoming week
        const calculatedWeek = await getCurrentWeek(weekDatesData);
        
        // Set current week on initial load (when currentWeek is 0)
        if (currentWeek === 0) {
          setCurrentWeek(calculatedWeek);
        }
        
        // Use the calculated week or the already set week
        const weekToLoad = currentWeek === 0 ? calculatedWeek : currentWeek;
        
        // Load games for current week
        const gamesRes = await fetch(`/api/schedule?week=${weekToLoad}`);
        let gamesData: Game[] = [];
        if (gamesRes.ok) {
          gamesData = await gamesRes.json();
          setGames(gamesData);
        }

        // Load previously submitted selections for the current week
        await loadPreviousSelections(effectiveTeamId, weekToLoad, gamesData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setDataLoading(false);
    }
  }, [currentTeam, viewTeamId, currentWeek]);

  useEffect(() => {
    if (currentTeam) {
      loadData();
    }
  }, [currentTeam, loadData]);

  const loadDataForTeam = async (teamId: string) => {
    setDataLoading(true);
    try {
      const [playersRes, matchupsRes] = await Promise.all([
        fetch(`/api/players?teamId=${encodeURIComponent(teamId)}`),
        fetch('/api/matchups'),
      ]);

      if (playersRes.ok) {
        const playersData: Player[] = await playersRes.json();
        setPlayers(playersData);
      }

      if (matchupsRes.ok) {
        const matchupsData: Matchup[] = await matchupsRes.json();
        setMatchups(matchupsData);
      }

      // Load previously submitted selections for the current week
      await loadPreviousSelections(teamId, currentWeek);
    } catch (error) {
      console.error('Error loading team data:', error);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if ((currentTeam || viewTeamId) && matchups.length > 0) {
      const id = viewTeamId || currentTeam?.teamId || '';
      const matchup = matchups.find(m => 
        (m.team1Id === id || m.team2Id === id) && m.week === currentWeek
      );
      setCurrentMatchup(matchup || null);
    }
  }, [currentTeam, viewTeamId, matchups, currentWeek]);

  const handlePlayerChange = (slotId: string, playerId: string) => {
    const player = players.find(p => p.playerId === playerId);
    if (!player) return;

    setLineup(prev => ({
      ...prev,
      [slotId]: {
        id: slotId,
        name: STARTER_SLOTS.find(s => s.id === slotId)?.name || RESERVE_SLOTS.find(s => s.id === slotId)?.name || slotId,
        position: STARTER_SLOTS.find(s => s.id === slotId)?.position || RESERVE_SLOTS.find(s => s.id === slotId)?.position || "ANY",
        playerId,
        gameId: undefined, // Reset game when player changes
      }
    }));
  };

  const handleGameChange = (slotId: string, gameId: string) => {
    setLineup(prev => ({
      ...prev,
      [slotId]: {
        ...prev[slotId],
        gameId,
      }
    }));
  };

  const handleResetSlot = (slotId: string) => {
    setLineup(prev => ({
      ...prev,
      [slotId]: {
        id: slotId,
        name: prev[slotId]?.name || '',
        position: prev[slotId]?.position || 'ANY',
        playerId: undefined,
        gameId: undefined,
      }
    }));
  };

  // Check if all selections are complete
  const isSubmissionReady = (): boolean => {
    const allSlots = [...STARTER_SLOTS, ...RESERVE_SLOTS];
    return allSlots.every(slot => {
      const slotData = lineup[slot.id];
      return slotData?.playerId && slotData?.gameId;
    });
  };

  // Function to get short team name
  const getShortTeamName = (teamName: string): string => {
    const shortNames: { [key: string]: string } = {
      'Army': 'Army',
      'Boards': 'Boards', 
      'Magnets': 'Magnets',
      'Forevers': 'Forevers',
      'Gorillas': 'Gorillas',
      'Hellrayzors': 'Hellrayzors',
      'Jokers': 'Jokers',
      'Gunslingers': 'Gunslingers',
      'Cooked': 'Cooked',
      'Testarossas': 'Testarossas',
      'Squib': 'Squib',
      'Bronsons': 'Bronsons',
      'Gentlemen': 'Gentlemen',
      'Hardons': 'Hardons'
    };
    
    // Extract team name from full name (remove any suffixes like (T001))
    const baseName = teamName.split(' (')[0];
    return shortNames[baseName] || baseName;
  };

  // Submit selections
  const handleSubmit = async () => {
    const effectiveTeam = viewTeamId ? teams.find(t => t.teamId === viewTeamId) : currentTeam;
    if (!effectiveTeam || !isSubmissionReady()) return;

    setSubmitting(true);
    try {
      const allSlots = [...STARTER_SLOTS, ...RESERVE_SLOTS];
      const selections = allSlots.map(slot => {
        const slotData = lineup[slot.id];
        const player = players.find(p => p.playerId === slotData.playerId);
        const gameId = slotData.gameId || '';
        const [nbaTeam, gameDate] = gameId.split('-');
        const game = games.find(g => g.nbaTeam === nbaTeam && g.date === gameDate);

        return {
          position: slot.name,
          playerId: player?.playerId || '',
          playerName: player?.name || '',
          nbaTeam: player?.nbaTeam || '',
          gameDate: gameDate || '',
          nbaOpposition: game?.opponent || '',
          selectedGame: formatGameDisplay(game || { nbaTeam: '', date: '', opponent: '', homeAway: '', week: 0 }),
        };
      });

      // Get opponent team name
      const opponentTeamName = currentMatchup ? 
        getShortTeamName(currentMatchup.team1Id === effectiveTeam.teamId ? 
          currentMatchup.team2Name : currentMatchup.team1Name) : '';

      // Get matchup ID
      const matchupId = currentMatchup?.matchupId || '';

      const response = await fetch('/api/selections/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          week: currentWeek,
          teamId: effectiveTeam.teamId,
          teamName: effectiveTeam.teamName,
          opponentTeamName,
          matchupId,
          selections,
        }),
      });

      if (response.ok) {
        setSubmittedSelections(selections);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        const errorData = await response.json();
        console.error('Failed to submit selections:', response.status, errorData);
        alert(`Failed to submit: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error submitting selections:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-800 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!currentTeam) {
    return <LoginForm />;
  }

  const currentWeekData = weekDates.find(w => w.week === currentWeek);

  return (
    <div className="min-h-screen bg-gray-800">

      {/* Header */}
      <div className="bg-orange-500 text-white p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-3xl font-bold text-center md:text-left">WEEKLY SELECTION</h1>
          <div className="flex items-center gap-4 justify-center">
            {/* Week selector - only for commissioners */}
            {role === 'commissioner' && (
              <div className="flex items-center gap-2">
                <span className="text-white">Week:</span>
                <select
                  className="bg-gray-700 text-white px-2 py-1"
                  value={currentWeek}
                  onChange={async (e) => {
                    const wk = Number(e.target.value);
                    setCurrentWeek(wk);
                    // reload games for chosen week
                    try {
                      const gamesRes = await fetch(`/api/schedule?week=${wk}`);
                      let gamesData: Game[] = [];
                      if (gamesRes.ok) {
                        gamesData = await gamesRes.json();
                        setGames(gamesData);
                      }
                      // Load previous selections for the new week
                      const effectiveTeamId = viewTeamId || currentTeam?.teamId || '';
                      await loadPreviousSelections(effectiveTeamId, wk, gamesData);
                    } catch {}
                  }}
                >
                  {weekDates.sort((a,b)=>a.week-b.week).map(w => (
                    <option key={w.week} value={w.week}>{w.week}</option>
                  ))}
                </select>
              </div>
            )}
            {/* Commissioner edit team */}
            {role === 'commissioner' && (
              <div className="flex items-center gap-2">
                <span className="text-white">Edit team:</span>
                <select
                  className="bg-gray-700 text-white px-2 py-1"
                  value={viewTeamId || currentTeam?.teamId || ''}
                  onChange={(e) => {
                    const selectedTeamId = e.target.value;
                    setViewTeamId(selectedTeamId);
                    // Reload data for the selected team
                    if (selectedTeamId) {
                      loadDataForTeam(selectedTeamId);
                    }
                  }}
                >
                  {teams.map(t => (
                    <option key={t.teamId} value={t.teamId}>{t.teamName}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Matchup Display */}
      {currentMatchup && currentWeekData && (
        <div className="p-4 bg-gray-700">
          <div className="flex items-center gap-4 mb-4">
            {/* Team Logo - Half Width */}
            <div className="w-1/2 flex justify-center">
              {(() => {
                const displayTeam = viewTeamId ? teams.find(t => t.teamId === viewTeamId) : currentTeam;
                const logoPath = displayTeam?.teamId ? `/logos/${displayTeam.teamId}-main.png.png` : null;
                return logoPath ? (
                  <img
                    src={logoPath}
                    alt={`${displayTeam?.teamName} logo`}
                    className="h-24 object-contain"
                  />
                ) : (
                  <div className="h-24 w-24 bg-gray-600 flex items-center justify-center text-white text-sm">
                    {displayTeam?.teamName?.slice(0, 2).toUpperCase() || 'LOGO'}
                  </div>
                );
              })()}
            </div>
            
            {/* Matchup Info */}
            <div className="w-1/2">
              <div className="text-white text-2xl font-bold mb-1">
                WEEK {currentWeek} vs
              </div>
              <div className="text-white text-xl font-bold mb-2">
                {(() => {
                  const displayTeamId = viewTeamId || currentTeam?.teamId || '';
                  return currentMatchup.team1Id === displayTeamId ? 
                    currentMatchup.team2Name : currentMatchup.team1Name;
                })()}
              </div>
              <div className="text-gray-300 text-lg">
                {(() => {
                  try {
                    const startDate = new Date(currentWeekData.startDate);
                    const finishDate = new Date(currentWeekData.finishDate);
                    
                    if (isNaN(startDate.getTime()) || isNaN(finishDate.getTime())) {
                      return (
                        <div>
                          <div>{currentWeekData.startDate}</div>
                          <div>{currentWeekData.finishDate}</div>
                        </div>
                      );
                    }
                    
                    const formatDate = (date: Date) => {
                      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
                      const day = date.getDate();
                      const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
                      const year = date.getFullYear();
                      const suffix = day === 1 || day === 21 || day === 31 ? 'st' :
                                   day === 2 || day === 22 ? 'nd' :
                                   day === 3 || day === 23 ? 'rd' : 'th';
                      return `${dayName} ${day}${suffix}, ${month} ${year}`;
                    };
                    
                    return (
                      <div>
                        <div>{formatDate(startDate)} to</div>
                        <div>{formatDate(finishDate)}</div>
                      </div>
                    );
                  } catch {
                    return (
                      <div>
                        <div>{currentWeekData.startDate}</div>
                        <div>{currentWeekData.finishDate}</div>
                      </div>
                    );
                  }
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="px-6 pb-40 space-y-6">
        {dataLoading ? (
          <div className="text-center py-8">
            <div className="text-white">Loading data...</div>
          </div>
        ) : (
          <>
            {/* Success Message */}
            {showSuccess && (
              <div className="p-4 bg-green-600 border border-green-500 rounded-lg">
                <div className="text-white text-lg font-bold">SUCCESSFUL TEAM SUBMISSION</div>
              </div>
            )}

            {/* Success Message */}
            {submittedSelections.length > 0 && (
              <div className="bg-green-600 text-white p-6 rounded-lg mb-6 text-center">
                <h3 className="text-2xl font-bold">TEAM SUCCESSFULLY SUBMITTED</h3>
              </div>
            )}

            {/* Starters */}
            <section>
              <div className="h-6"></div>
              <h2 className="text-white text-3xl font-bold mb-3">STARTERS (9 Players)</h2>
            <div className="space-y-3">
              {STARTER_SLOTS.map(slot => {
                const availablePlayers = getAvailablePlayers(slot.position, slot.id);
                const selectedPlayer = lineup[slot.id]?.playerId ? 
                  players.find(p => p.playerId === lineup[slot.id].playerId) : null;
                const availableGames = selectedPlayer ? 
                  games.filter(g => g.nbaTeam === selectedPlayer.nbaTeam) : [];

                return (
                  <div key={slot.id} className="p-3 bg-gray-700 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-white font-bold text-2xl">{slot.name}</div>
                      <button
                        onClick={() => handleResetSlot(slot.id)}
                        className="text-red-500 hover:text-red-400 font-bold text-xl px-2 py-1"
                        title="Clear this position"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <select
                        className="col-span-2 bg-gray-600 text-white border-2 border-gray-500 px-3 py-2 rounded-none"
                        value={lineup[slot.id]?.playerId || ""}
                        onChange={e => handlePlayerChange(slot.id, e.target.value)}
                      >
                        <option value="">Select Player</option>
                        {availablePlayers.map(player => (
                          <option key={player.playerId} value={player.playerId}>
                            {player.name} ({player.position}) - {player.nbaTeam}
                          </option>
                        ))}
                      </select>
                      
                      <select
                        className="col-span-1 bg-gray-600 text-white border-2 border-gray-500 px-3 py-2 rounded-none"
                        value={lineup[slot.id]?.gameId || ""}
                        onChange={e => handleGameChange(slot.id, e.target.value)}
                        disabled={!selectedPlayer}
                      >
                        <option value="">Select Game</option>
                        {availableGames.map(game => (
                          <option key={`${game.nbaTeam}-${game.date}`} value={`${game.nbaTeam}-${game.date}`}>
                            {formatGameDisplay(game)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
          </div>
          </section>

            {/* Reserves */}
            <section>
              <div className="h-6"></div>
              <h2 className="text-white text-3xl font-bold mb-3">RESERVES (3 Players)</h2>
            <div className="space-y-3">
              {RESERVE_SLOTS.map(slot => {
                const availablePlayers = getAvailablePlayers(slot.position, slot.id);
                const selectedPlayer = lineup[slot.id]?.playerId ? 
                  players.find(p => p.playerId === lineup[slot.id].playerId) : null;
                const availableGames = selectedPlayer ? 
                  games.filter(g => g.nbaTeam === selectedPlayer.nbaTeam) : [];

                return (
                  <div key={slot.id} className="p-3 bg-gray-700 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-white font-bold text-2xl">{slot.name}</div>
                      <button
                        onClick={() => handleResetSlot(slot.id)}
                        className="text-red-500 hover:text-red-400 font-bold text-xl px-2 py-1"
                        title="Clear this position"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <select
                        className="col-span-2 bg-gray-600 text-white border-2 border-gray-500 px-3 py-2 rounded-none"
                        value={lineup[slot.id]?.playerId || ""}
                        onChange={e => handlePlayerChange(slot.id, e.target.value)}
                      >
                        <option value="">Select Player</option>
                        {availablePlayers.map(player => (
                          <option key={player.playerId} value={player.playerId}>
                            {player.name} ({player.position}) - {player.nbaTeam}
                          </option>
                        ))}
                      </select>
                      
                      <select
                        className="col-span-1 bg-gray-600 text-white border-2 border-gray-500 px-3 py-2 rounded-none"
                        value={lineup[slot.id]?.gameId || ""}
                        onChange={e => handleGameChange(slot.id, e.target.value)}
                        disabled={!selectedPlayer}
                      >
                        <option value="">Select Game</option>
                        {availableGames.map(game => (
                          <option key={`${game.nbaTeam}-${game.date}`} value={`${game.nbaTeam}-${game.date}`}>
                            {formatGameDisplay(game)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
            </section>

            {/* Blank Space */}
            <div className="h-6"></div>

            {/* Submit Button */}
            <div className="flex justify-center pt-6">
              <button
                onClick={handleSubmit}
                disabled={!isSubmissionReady() || submitting}
                className={`bg-gradient-to-r from-orange-500 to-orange-600 text-white px-32 py-12 text-4xl font-bold rounded-lg border-2 border-orange-400 shadow-xl hover:shadow-2xl hover:from-orange-600 hover:to-orange-700 transform hover:scale-105 transition-all duration-300 ${
                  !isSubmissionReady() || submitting ? 'opacity-50 cursor-not-allowed hover:scale-100' : ''
                }`}
              >
                {submitting ? 'Submitting...' : 'SUBMIT TEAM'}
              </button>
            </div>
            
            {/* Extra bottom spacing to ensure content is visible above navigation */}
            <div className="h-32"></div>
          </>
        )}
      </div>
    </div>
  );
}
