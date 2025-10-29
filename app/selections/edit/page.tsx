'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { Selection, Team, Matchup, Player, Game, WeekDate } from '@/lib/types';

export default function EditSelectionsPage() {
  const { role, isLoading: authLoading } = useAuth();
  const router = useRouter();
  
  const [weekDates, setWeekDates] = useState<WeekDate[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [matchups, setMatchups] = useState<Matchup[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [selections, setSelections] = useState<Selection[]>([]);
  
  const [selectedWeek, setSelectedWeek] = useState<number>(0);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [selectedMatchupId, setSelectedMatchupId] = useState<string>('');
  
  const [editingSelection, setEditingSelection] = useState<Selection | null>(null);
  const [editingPlayerId, setEditingPlayerId] = useState<string>('');
  const [editingGameDate, setEditingGameDate] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Check authorization on mount
  useEffect(() => {
    if (!authLoading && role !== 'commissioner') {
      router.push('/');
    }
  }, [role, authLoading, router]);

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [weekDatesRes, teamsRes, matchupsRes] = await Promise.all([
          fetch('/api/weekdates'),
          fetch('/api/teams'),
          fetch('/api/matchups'),
        ]);

        if (weekDatesRes.ok) {
          const weekDatesData = await weekDatesRes.json();
          setWeekDates(weekDatesData.sort((a: WeekDate, b: WeekDate) => a.week - b.week));
          if (weekDatesData.length > 0) {
            setSelectedWeek(weekDatesData[0].week);
          }
        }

        if (teamsRes.ok) {
          const teamsData = await teamsRes.json();
          setTeams(teamsData);
        }

        if (matchupsRes.ok) {
          const matchupsData = await matchupsRes.json();
          setMatchups(matchupsData);
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };

    if (role === 'commissioner') {
      fetchInitialData();
    }
  }, [role]);

  // Fetch selections when filters change
  useEffect(() => {
    const loadSelections = async () => {
      if (selectedWeek && selectedTeamId && selectedMatchupId) {
        try {
          const res = await fetch(`/api/selections?week=${selectedWeek}&teamId=${encodeURIComponent(selectedTeamId)}&matchupId=${encodeURIComponent(selectedMatchupId)}`);
          if (res.ok) {
            const data = await res.json();
            setSelections(data);
          }
        } catch (error) {
          console.error('Error fetching selections:', error);
        }
      } else {
        setSelections([]);
      }
    };
    loadSelections();
  }, [selectedWeek, selectedTeamId, selectedMatchupId]);

  // Fetch games when week changes
  useEffect(() => {
    if (selectedWeek) {
      fetch(`/api/schedule?week=${selectedWeek}`)
        .then(res => res.json())
        .then(data => setGames(data))
        .catch(err => console.error('Error fetching games:', err));
    }
  }, [selectedWeek]);

  // Fetch players when team changes
  useEffect(() => {
    if (selectedTeamId) {
      fetch(`/api/players?teamId=${encodeURIComponent(selectedTeamId)}`)
        .then(res => res.json())
        .then(data => setPlayers(data))
        .catch(err => console.error('Error fetching players:', err));
    }
  }, [selectedTeamId]);


  // Get filtered matchups for selected week and team
  const getFilteredMatchups = () => {
    if (!selectedWeek || !selectedTeamId) return [];
    return matchups.filter(m => 
      m.week === selectedWeek && 
      (m.team1Id === selectedTeamId || m.team2Id === selectedTeamId)
    );
  };

  // Get available players for a position
  const getPlayersForPosition = (position: string): Player[] => {
    return players.filter(player => {
      const playerPos = player.position.toUpperCase();
      switch (position) {
        case 'Guard 1':
        case 'Guard 2':
        case 'Res Guard':
          return playerPos.includes('G');
        case 'Forward 1':
        case 'Forward 2':
          return playerPos.includes('F') && !playerPos.includes('C');
        case 'Centre':
          return playerPos === 'C' || playerPos === 'F/C';
        case 'Guard/Forward':
          return playerPos.includes('G') || playerPos.includes('F');
        case 'Forward/Centre':
        case 'Res Forward/Center':
          return playerPos.includes('F') || playerPos.includes('C');
        case 'Flex 1':
        case 'Flex 2':
        case 'Res Flex':
        case 'Res Forward/Center':
        case 'Res Forward/Centre':
          return true;
        default:
          return false;
      }
    });
  };

  // Format game display
  const formatGameDisplay = (game: Game): string => {
    try {
      let dateStr = game.date;
      if (dateStr.includes('/')) {
        const [day, month, year] = dateStr.split('/');
        dateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      } else if (dateStr.includes('-') && !dateStr.includes('T')) {
        const parts = dateStr.split('-');
        if (parts[0].length === 4) {
          dateStr = dateStr;
        } else {
          const [day, month, year] = dateStr.split('-');
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

  // Get available games for a player
  const getGamesForPlayer = (player: Player | null): Game[] => {
    if (!player) return [];
    return games.filter(g => g.nbaTeam === player.nbaTeam);
  };

  // Handle edit button click
  const handleEdit = (selection: Selection) => {
    setEditingSelection(selection);
    setEditingPlayerId(selection.playerId);
    setEditingGameDate(selection.gameDate);
  };

  // Handle save changes
  const handleSave = async () => {
    if (!editingSelection) return;

    const selectedPlayer = players.find(p => p.playerId === editingPlayerId);
    const selectedGame = games.find(g => 
      g.date === editingGameDate && 
      selectedPlayer?.nbaTeam === g.nbaTeam
    );

    if (!selectedPlayer || !selectedGame) {
      setMessage({ type: 'error', text: 'Please select both a player and a game' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      // Format selectedGame similar to weekly-selection page
      const formattedGame = formatGameDisplay(selectedGame);

      const changes: {
        playerId?: string;
        playerName?: string;
        nbaTeam?: string;
        gameDate?: string;
        selectedGame?: string;
        nbaOpposition?: string;
      } = {
        playerId: editingPlayerId,
        playerName: selectedPlayer.name,
        nbaTeam: selectedPlayer.nbaTeam,
        gameDate: editingGameDate,
        selectedGame: formattedGame,
        nbaOpposition: formattedGame,
      };

      const res = await fetch('/api/selections/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          week: editingSelection.week,
          matchupId: editingSelection.matchupId,
          teamName: editingSelection.teamName,
          position: editingSelection.position,
          changes,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: 'Selection updated successfully!' });
        setEditingSelection(null);
        // Refresh selections
        if (selectedWeek && selectedTeamId && selectedMatchupId) {
          try {
            const refreshRes = await fetch(`/api/selections?week=${selectedWeek}&teamId=${encodeURIComponent(selectedTeamId)}&matchupId=${encodeURIComponent(selectedMatchupId)}`);
            if (refreshRes.ok) {
              const data = await refreshRes.json();
              setSelections(data);
            }
          } catch (error) {
            console.error('Error refreshing selections:', error);
          }
        }
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update selection' });
      }
    } catch (error) {
      console.error('Error updating selection:', error);
      setMessage({ type: 'error', text: 'An error occurred while updating' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel edit
  const handleCancel = () => {
    setEditingSelection(null);
    setEditingPlayerId('');
    setEditingGameDate('');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-800 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (role !== 'commissioner') {
    return null;
  }

  const filteredMatchups = getFilteredMatchups();
  const selectedTeam = teams.find(t => t.teamId === selectedTeamId);

  return (
    <div className="min-h-screen bg-gray-800">
      {/* Header */}
      <div className="bg-orange-500 text-white p-6">
        <h1 className="text-3xl font-bold text-center">COMMISSIONER: EDIT SELECTIONS</h1>
      </div>

      <div className="px-6 pb-40 space-y-6">
        {/* Filters */}
        <div className="bg-gray-700 p-6 rounded-lg space-y-4">
          <h2 className="text-white text-xl font-bold mb-4">Filters</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Week Selector */}
            <div>
              <label className="block text-white mb-2">Week</label>
              <select
                className="w-full bg-gray-600 text-white px-4 py-2 rounded"
                value={selectedWeek}
                onChange={(e) => {
                  const newWeek = parseInt(e.target.value);
                  setSelectedWeek(newWeek);
                  // Auto-select matchup if team is already selected and only one matchup available
                  if (newWeek && selectedTeamId) {
                    const availableMatchups = matchups.filter(m => 
                      m.week === newWeek && 
                      (m.team1Id === selectedTeamId || m.team2Id === selectedTeamId)
                    );
                    if (availableMatchups.length === 1) {
                      setSelectedMatchupId(availableMatchups[0].matchupId);
                    } else {
                      setSelectedMatchupId('');
                    }
                  } else {
                    setSelectedMatchupId('');
                  }
                }}
              >
                <option value="0">Select Week</option>
                {weekDates.map(week => (
                  <option key={week.week} value={week.week}>
                    Week {week.week}
                  </option>
                ))}
              </select>
            </div>

            {/* Team Selector */}
            <div>
              <label className="block text-white mb-2">Team</label>
              <select
                className="w-full bg-gray-600 text-white px-4 py-2 rounded"
                value={selectedTeamId}
                onChange={(e) => {
                  const newTeamId = e.target.value;
                  setSelectedTeamId(newTeamId);
                  // Auto-select matchup if only one available
                  if (selectedWeek && newTeamId) {
                    const availableMatchups = matchups.filter(m => 
                      m.week === selectedWeek && 
                      (m.team1Id === newTeamId || m.team2Id === newTeamId)
                    );
                    if (availableMatchups.length === 1) {
                      setSelectedMatchupId(availableMatchups[0].matchupId);
                    } else {
                      setSelectedMatchupId('');
                    }
                  } else {
                    setSelectedMatchupId('');
                  }
                }}
              >
                <option value="">Select Team</option>
                {teams.map(team => (
                  <option key={team.teamId} value={team.teamId}>
                    {team.teamName}
                  </option>
                ))}
              </select>
            </div>

            {/* Matchup Selector */}
            <div>
              <label className="block text-white mb-2">Matchup</label>
              <select
                className="w-full bg-gray-600 text-white px-4 py-2 rounded"
                value={selectedMatchupId}
                onChange={(e) => setSelectedMatchupId(e.target.value)}
                disabled={!selectedWeek || !selectedTeamId || filteredMatchups.length === 0}
              >
                <option value="">Select Matchup</option>
                {filteredMatchups.map(matchup => (
                  <option key={matchup.matchupId} value={matchup.matchupId}>
                    {matchup.team1Id === selectedTeamId ? matchup.team2Name : matchup.team1Name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          } text-white`}>
            {message.text}
          </div>
        )}

        {/* Selections Table */}
        {selections.length > 0 && (
          <div className="bg-gray-700 p-6 rounded-lg">
            <h2 className="text-white text-xl font-bold mb-4">
              Selections for {selectedTeam?.teamName} - Week {selectedWeek} ({selections.length} positions)
            </h2>
            
            <div className="overflow-x-auto -mx-6 px-6 overflow-y-visible">
              <table className="w-full text-white min-w-full">
                <thead>
                  <tr className="border-b border-gray-600">
                    <th className="text-left py-3 px-4 whitespace-nowrap">Position</th>
                    <th className="text-left py-3 px-4">Player</th>
                    <th className="text-left py-3 px-4 whitespace-nowrap">NBA Team</th>
                    <th className="text-left py-3 px-4">Selected Game</th>
                    <th className="text-left py-3 px-4 whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {selections
                    .sort((a, b) => {
                      const positionOrder: Record<string, number> = {
                        'Guard 1': 1, 'Guard 2': 2,
                        'Forward 1': 3, 'Forward 2': 4,
                        'Centre': 5, 'Guard/Forward': 6,
                        'Forward/Centre': 7, 'Flex 1': 8, 'Flex 2': 9,
                        'Res Guard': 10, 'Res Forward/Center': 11, 'Res Forward/Centre': 11, 'Res Flex': 12,
                      };
                      // Normalize position names for comparison
                      const posA = a.position.trim();
                      const posB = b.position.trim();
                      const orderA = positionOrder[posA] || 999;
                      const orderB = positionOrder[posB] || 999;
                      return orderA - orderB;
                    })
                    .map((selection, idx) => (
                      <tr key={idx} className="border-b border-gray-600 hover:bg-gray-600 transition-colors">
                        <td className="py-4 px-4 font-medium whitespace-nowrap">{selection.position}</td>
                        <td className="py-4 px-4">{selection.playerName}</td>
                        <td className="py-4 px-4 whitespace-nowrap">{selection.nbaTeam}</td>
                        <td className="py-4 px-4">
                          {selection.selectedGame || selection.nbaOpposition || 'N/A'}
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          <button
                            onClick={() => handleEdit(selection)}
                            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editingSelection && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-700 p-8 rounded-lg max-w-2xl w-full mx-4">
              <h2 className="text-white text-2xl font-bold mb-6">
                Edit Selection: {editingSelection.position}
              </h2>

              {/* Player Selection */}
              <div className="mb-4">
                <label className="block text-white mb-2">Player</label>
                <select
                  className="w-full bg-gray-600 text-white px-4 py-2 rounded"
                  value={editingPlayerId}
                  onChange={(e) => {
                    setEditingPlayerId(e.target.value);
                    setEditingGameDate(''); // Reset game when player changes
                  }}
                >
                  <option value="">Select Player</option>
                  {getPlayersForPosition(editingSelection.position).map(player => (
                    <option key={player.playerId} value={player.playerId}>
                      {player.name} ({player.position}) - {player.nbaTeam}
                    </option>
                  ))}
                </select>
              </div>

              {/* Game Selection */}
              <div className="mb-6">
                <label className="block text-white mb-2">Game</label>
                <select
                  className="w-full bg-gray-600 text-white px-4 py-2 rounded"
                  value={editingGameDate}
                  onChange={(e) => setEditingGameDate(e.target.value)}
                  disabled={!editingPlayerId}
                >
                  <option value="">Select Game</option>
                  {getGamesForPlayer(players.find(p => p.playerId === editingPlayerId)).map(game => (
                    <option key={`${game.nbaTeam}-${game.date}`} value={game.date}>
                      {formatGameDisplay(game)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <button
                  onClick={handleSave}
                  disabled={isSubmitting || !editingPlayerId || !editingGameDate}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white px-4 py-2 rounded"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

