"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { Matchup, Team, Selection } from "@/lib/types";

export default function DetailedMatchupPage() {
  const router = useRouter();
  const params = useParams<{ matchupId: string }>();
  const [matchup, setMatchup] = useState<Matchup | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [team1Selections, setTeam1Selections] = useState<Selection[]>([]);
  const [team2Selections, setTeam2Selections] = useState<Selection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch teams data
        const teamsResponse = await fetch('/api/teams');
        const teamsData = await teamsResponse.json();
        setTeams(teamsData);

        // Fetch matchups data
        const matchupsResponse = await fetch('/api/matchups');
        const matchupsData = await matchupsResponse.json();
        
        // Find the specific matchup
        const foundMatchup = matchupsData.find((m: Matchup) => m.matchupId === params.matchupId);
        setMatchup(foundMatchup || null);

        if (foundMatchup) {
          // Fetch selections for both teams for this matchup
          const [team1SelectionsResponse, team2SelectionsResponse] = await Promise.all([
            fetch(`/api/selections?matchupId=${foundMatchup.matchupId}&teamId=${foundMatchup.team1Id}`),
            fetch(`/api/selections?matchupId=${foundMatchup.matchupId}&teamId=${foundMatchup.team2Id}`)
          ]);

          const team1SelectionsData = await team1SelectionsResponse.json();
          const team2SelectionsData = await team2SelectionsResponse.json();

          setTeam1Selections(team1SelectionsData);
          setTeam2Selections(team2SelectionsData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.matchupId]);

  const getTeamById = (teamId: string) => {
    return teams.find(team => team.teamId === teamId);
  };

  const getSelectionByPosition = (selections: Selection[], expectedPosition: string) => {
    // Create a mapping from the page's expected positions to the Google Sheets format
    const positionMapping: { [key: string]: string[] } = {
      'GUARD 1': ['Guard 1'],
      'GUARD 2': ['Guard 2'], 
      'FORWARD 1': ['Forward 1'],
      'FORWARD 2': ['Forward 2'],
      'CENTER': ['Centre', 'Center'],
      'FLEX 1': ['Flex 1'],
      'FLEX 2': ['Flex 2'],
      'RES GUARD': ['Res Guard'],
      'RES FORWARD/CENTER': ['Res Forward/Center', 'Res Forward/Centre'],
      'RES FLEX': ['Res Flex']
    };

    // Get the possible Google Sheets position names for this expected position
    const possiblePositions = positionMapping[expectedPosition] || [expectedPosition];
    
    const found = selections.find(selection => 
      possiblePositions.some(pos => 
        selection.position.toLowerCase() === pos.toLowerCase()
      )
    );
    
    return found;
  };

  const formatGameDisplay = (selection: Selection) => {
    // Desired: "Wednesday OKC vs HOU" or "Wednesday OKC @ HOU"
    const { gameDate, nbaOpposition, nbaTeam } = selection;

    // 1) Day name from gameDate
    let dayName = '';
    if (gameDate) {
      try {
        let date = new Date(gameDate);
        if (isNaN(date.getTime())) {
          const parts = gameDate.split('/');
          if (parts.length === 3) {
            date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
          }
        }
        if (!isNaN(date.getTime())) {
          dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        }
      } catch {}
    }

    // 2) Parse opposition text, which may look like "Wed vs HOU", "Tue @ LAL", or just "HOU"
    let indicator = 'vs';
    let opponent = '';
    const oppRaw = (nbaOpposition || '').trim();

    // Prefer explicit indicator in the string
    const match = oppRaw.match(/(?:vs|@)\s*([A-Za-z]+)/i);
    if (match) {
      indicator = oppRaw.toLowerCase().includes('@') ? '@' : 'vs';
      opponent = (match[1] || '').replace(/[^A-Za-z]/g, '').toUpperCase();
    } else if (oppRaw) {
      // No indicator present; take the last token as team code
      const tokens = oppRaw.split(/\s+/);
      opponent = (tokens[tokens.length - 1] || '').replace(/[^A-Za-z]/g, '').toUpperCase();
    }

    if (!opponent || !nbaTeam) {
      return dayName || 'No Game Selected';
    }

    return `${dayName ? dayName + ' ' : ''}${nbaTeam} ${indicator} ${opponent}`;
  };

  const formatStatValue = (value: number | undefined, isPercentage: boolean = false) => {
    if (value === undefined || value === null) return '-';
    if (isPercentage) {
      return value.toFixed(3);
    }
    return value.toString();
  };

  const formatPercentOneDecimal = (value: number | undefined) => {
    if (value === undefined || value === null) return '-';
    const numeric = Number(value);
    if (Number.isNaN(numeric)) return '-';
    const asPercent = numeric <= 1 ? numeric * 100 : numeric;
    return asPercent.toFixed(1);
  };

  const PlayerStatsBox = ({ 
    selection, 
    isTeam1
  }: { 
    selection: Selection | undefined; 
    isTeam1: boolean;
  }) => {
    if (!selection) {
      return (
        <div className={`w-[45%] bg-gray-700 p-8 relative`}>
          {/* No photo box when no selection */}
          
          <div className="flex items-center justify-between mb-4">
            <div className={`text-left flex-1 ${isTeam1 ? '' : 'text-right'}`}>
              <div className="text-white font-bold">&nbsp;No Player Selected</div>
              <div className="text-gray-400 text-sm">&nbsp;No Game Selected</div>
              <div className="text-white text-sm">&nbsp;</div>
            </div>
          </div>
          
          {/* Stats */}
          <div className="space-y-4">
            {/* Row 1: 3 stats */}
            <div className="flex justify-center" style={{gap: '2rem'}}>
              <div className="text-center">
                <div className="text-gray-400 text-xs">PTS</div>
                <div className="text-white text-sm font-bold">-</div>
              </div>
              <div className="text-center">
                <div className="text-gray-400 text-xs">3PM</div>
                <div className="text-white text-sm font-bold">-</div>
              </div>
              <div className="text-center">
                <div className="text-gray-400 text-xs">AST</div>
                <div className="text-white text-sm font-bold">-</div>
              </div>
            </div>

            {/* Row 2: 4 stats */}
            <div className="flex justify-center" style={{gap: '2rem'}}>
              <div className="text-center">
                <div className="text-gray-400 text-xs">STL</div>
                <div className="text-white text-sm font-bold">-</div>
              </div>
              <div className="text-center">
                <div className="text-gray-400 text-xs">BLK</div>
                <div className="text-white text-sm font-bold">-</div>
              </div>
              <div className="text-center">
                <div className="text-gray-400 text-xs">ORB</div>
                <div className="text-white text-sm font-bold">-</div>
              </div>
              <div className="text-center">
                <div className="text-gray-400 text-xs">DREB</div>
                <div className="text-white text-sm font-bold">-</div>
              </div>
            </div>

            {/* Row 3: 3 stats */}
            <div className="flex justify-center" style={{gap: '2rem'}}>
              <div className="text-center">
                <div className="text-gray-400 text-xs">FG%</div>
                <div className="text-white text-sm font-bold">-</div>
              </div>
              <div className="text-center">
                <div className="text-gray-400 text-xs">FT%</div>
                <div className="text-white text-sm font-bold">-</div>
              </div>
              <div className="text-center">
                <div className="text-gray-400 text-xs">MIN</div>
                <div className="text-white text-sm font-bold">-</div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={`w-[45%] bg-gray-700 p-8 relative`}>
        {/* Corner photo (only if photo exists) */}
        {selection.photoUrl && (
          <div className={`absolute -top-1 ${isTeam1 ? '-right-3' : '-left-3'} w-8 h-8 flex items-center justify-center overflow-hidden`}>
            <Image src={selection.photoUrl} alt={selection.playerName} width={32} height={32} className="object-contain w-8 h-8 p-1" />
          </div>
        )}
 
        <div className="flex items-center justify-between mb-4">
          {isTeam1 ? (
            <>
              {/* Left: Text, Right: Photo */}
              <div className="text-left flex-1">
                <div className="text-white font-bold">&nbsp;{selection.playerName}</div>
                <div className="text-white text-sm">&nbsp;{formatGameDisplay(selection)}</div>
              </div>
            </>
          ) : (
            <>
              <div className="text-right flex-1">
                <div className="text-white font-bold">{selection.playerName}&nbsp;</div>
                <div className="text-white text-sm">{formatGameDisplay(selection)}&nbsp;</div>
              </div>
            </>
          )}
        </div>
        
        {/* Stats */}
        <div className="space-y-4">
          {/* Row 1: 3 stats */}
          <div className="flex justify-center" style={{gap: '2rem'}}>
            <div className="text-center">
              <div className="text-gray-400 text-xs">PTS</div>
              <div className="text-white text-sm font-bold">{formatStatValue(selection.pts)}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-400 text-xs">3PM</div>
              <div className="text-white text-sm font-bold">{formatStatValue(selection.threePm)}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-400 text-xs">AST</div>
              <div className="text-white text-sm font-bold">{formatStatValue(selection.ast)}</div>
            </div>
          </div>

          {/* Row 2: 4 stats */}
          <div className="flex justify-center" style={{gap: '1.25rem'}}>
            <div className="text-center">
              <div className="text-gray-400 text-xs">STL</div>
              <div className="text-white text-sm font-bold">{formatStatValue(selection.stl)}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-400 text-xs">BLK</div>
              <div className="text-white text-sm font-bold">{formatStatValue(selection.blk)}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-400 text-xs">ORB</div>
              <div className="text-white text-sm font-bold">{formatStatValue(selection.orb)}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-400 text-xs">DRB</div>
              <div className="text-white text-sm font-bold">{formatStatValue(selection.drb)}</div>
            </div>
          </div>

          {/* Row 3: 3 stats */}
          <div className="flex justify-center" style={{gap: '2rem'}}>
            <div className="text-center">
              <div className="text-gray-400 text-xs">FG%</div>
              <div className="text-white text-sm font-bold">{formatPercentOneDecimal(selection.fgPercent)}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-400 text-xs">FT%</div>
              <div className="text-white text-sm font-bold">{formatPercentOneDecimal(selection.ftPercent)}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-400 text-xs">MIN</div>
              <div className="text-white text-sm font-bold">{formatStatValue(selection.min)}</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-800 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!matchup) {
    return (
      <div className="min-h-screen bg-gray-800 flex items-center justify-center">
        <div className="text-white text-xl">Matchup not found</div>
      </div>
    );
  }

  const team1 = getTeamById(matchup.team1Id);
  const team2 = getTeamById(matchup.team2Id);

  return (
    <div className="min-h-screen bg-gray-800">
      {/* Header with Back Button */}
      <div className="bg-orange-500 text-white p-6">
        <div className="flex items-center mb-4">
          <button
            onClick={() => router.back()}
            className="mr-4 p-2 hover:bg-orange-600 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold">WEEK {matchup?.week} MATCHUPS</h1>
        </div>

        {/* Team Logos and Scores */}
        <div className="flex items-center justify-center space-x-4 sm:space-x-8 bg-gray-800 p-4 sm:p-6">
          {/* Team 1 */}
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center">
              {team1?.teamId ? (
                <Image
                  src={`/logos/${team1.teamId}-main.png.png`}
                  alt={team1.teamName}
                  width={80}
                  height={80}
                  className="object-contain w-20 h-20 sm:w-24 sm:h-24"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <span className="text-white text-sm sm:text-lg">T1</span>
              )}
            </div>
          </div>

          {/* Score */}
          <div className="text-center px-4 sm:px-8">
            <div className="flex items-baseline justify-center text-white">
              <span className={`text-4xl sm:text-6xl font-bold min-w-[2rem] sm:min-w-[3rem] ${((matchup?.team1Score || 0) > (matchup?.team2Score || 0)) ? 'text-green-400' : ((matchup?.team1Score || 0) < (matchup?.team2Score || 0)) ? 'text-red-400' : 'text-gray-400'}`}>{matchup?.team1Score || 0}</span>
              <span className="text-2xl sm:text-4xl font-bold mx-4 sm:mx-6 text-gray-300">vs</span>
              <span className={`text-4xl sm:text-6xl font-bold min-w-[2rem] sm:min-w-[3rem] ${((matchup?.team2Score || 0) > (matchup?.team1Score || 0)) ? 'text-green-400' : ((matchup?.team2Score || 0) < (matchup?.team1Score || 0)) ? 'text-red-400' : 'text-gray-400'}`}>{matchup?.team2Score || 0}</span>
            </div>
          </div>

          {/* Team 2 */}
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center">
              {team2?.teamId ? (
                <Image
                  src={`/logos/${team2.teamId}-main.png.png`}
                  alt={team2.teamName}
                  width={80}
                  height={80}
                  className="object-contain w-20 h-20 sm:w-24 sm:h-24"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <span className="text-white text-sm sm:text-lg">T2</span>
              )}
            </div>
          </div>
        </div>
        </div>

        {/* Matchup Summary */}
        <div className="p-6">
        <h2 className="text-white text-3xl font-bold mb-2 text-center">MATCHUP SUMMARY</h2>
        
        {/* Small Blank Space */}
        <div className="h-3"></div>
        <div className="bg-gray-700 rounded-lg p-6">
          <div className="flex items-center">
            {/* Column 1: Team 1 Stats */}
            <div className="text-center flex-1">
              <div className="space-y-2">
                <div className="text-lg text-gray-300">{matchup?.team1Gp || 0}/9</div>
                <div className={`text-lg ${(matchup?.team1Pts || 0) > (matchup?.team2Pts || 0) ? 'text-green-400' : (matchup?.team1Pts || 0) < (matchup?.team2Pts || 0) ? 'text-red-400' : 'text-gray-400'}`}>{matchup?.team1Pts || 0}</div>
                <div className={`text-lg ${(matchup?.team13pm || 0) > (matchup?.team23pm || 0) ? 'text-green-400' : (matchup?.team13pm || 0) < (matchup?.team23pm || 0) ? 'text-red-400' : 'text-gray-400'}`}>{matchup?.team13pm || 0}</div>
                <div className={`text-lg ${(matchup?.team1Ast || 0) > (matchup?.team2Ast || 0) ? 'text-green-400' : (matchup?.team1Ast || 0) < (matchup?.team2Ast || 0) ? 'text-red-400' : 'text-gray-400'}`}>{matchup?.team1Ast || 0}</div>
                <div className={`text-lg ${(matchup?.team1Stl || 0) > (matchup?.team2Stl || 0) ? 'text-green-400' : (matchup?.team1Stl || 0) < (matchup?.team2Stl || 0) ? 'text-red-400' : 'text-gray-400'}`}>{matchup?.team1Stl || 0}</div>
                <div className={`text-lg ${(matchup?.team1Blk || 0) > (matchup?.team2Blk || 0) ? 'text-green-400' : (matchup?.team1Blk || 0) < (matchup?.team2Blk || 0) ? 'text-red-400' : 'text-gray-400'}`}>{matchup?.team1Blk || 0}</div>
                <div className={`text-lg ${(matchup?.team1Orb || 0) > (matchup?.team2Orb || 0) ? 'text-green-400' : (matchup?.team1Orb || 0) < (matchup?.team2Orb || 0) ? 'text-red-400' : 'text-gray-400'}`}>{matchup?.team1Orb || 0}</div>
                <div className={`text-lg ${(matchup?.team1Drb || 0) > (matchup?.team2Drb || 0) ? 'text-green-400' : (matchup?.team1Drb || 0) < (matchup?.team2Drb || 0) ? 'text-red-400' : 'text-gray-400'}`}>{matchup?.team1Drb || 0}</div>
                <div className={`text-lg ${(matchup?.team1FgPercent || 0) > (matchup?.team2FgPercent || 0) ? 'text-green-400' : (matchup?.team1FgPercent || 0) < (matchup?.team2FgPercent || 0) ? 'text-red-400' : 'text-gray-400'}`}>{formatPercentOneDecimal(matchup?.team1FgPercent || 0)}</div>
                <div className="text-sm text-gray-400">{matchup?.team1Fgm || 0}/{matchup?.team1Fga || 0}</div>
                <div className={`text-lg ${(matchup?.team1FtPercent || 0) > (matchup?.team2FtPercent || 0) ? 'text-green-400' : (matchup?.team1FtPercent || 0) < (matchup?.team2FtPercent || 0) ? 'text-red-400' : 'text-gray-400'}`}>{formatPercentOneDecimal(matchup?.team1FtPercent || 0)}</div>
                <div className="text-sm text-gray-400">{matchup?.team1Ftm || 0}/{matchup?.team1Fta || 0}</div>
              </div>
            </div>

            {/* Column 2: Titles */}
            <div className="text-center flex-1">
              <div className="space-y-2 text-white font-bold">
                <div className="text-lg">GP</div>
                <div className="text-lg">PTS</div>
                <div className="text-lg">3PM</div>
                <div className="text-lg">AST</div>
                <div className="text-lg">STL</div>
                <div className="text-lg">BLK</div>
                <div className="text-lg">ORB</div>
                <div className="text-lg">DRB</div>
                <div className="text-lg">FG%</div>
                <div className="text-sm text-gray-400">FGM/FGA</div>
                <div className="text-lg">FT%</div>
                <div className="text-sm text-gray-400">FTM/FTA</div>
              </div>
            </div>

            {/* Column 3: Team 2 Stats */}
            <div className="text-center flex-1">
              <div className="space-y-2">
                <div className="text-lg text-gray-300">{matchup?.team2Gp || 0}/9</div>
                <div className={`text-lg ${(matchup?.team2Pts || 0) > (matchup?.team1Pts || 0) ? 'text-green-400' : (matchup?.team2Pts || 0) < (matchup?.team1Pts || 0) ? 'text-red-400' : 'text-gray-400'}`}>{matchup?.team2Pts || 0}</div>
                <div className={`text-lg ${(matchup?.team23pm || 0) > (matchup?.team13pm || 0) ? 'text-green-400' : (matchup?.team23pm || 0) < (matchup?.team13pm || 0) ? 'text-red-400' : 'text-gray-400'}`}>{matchup?.team23pm || 0}</div>
                <div className={`text-lg ${(matchup?.team2Ast || 0) > (matchup?.team1Ast || 0) ? 'text-green-400' : (matchup?.team2Ast || 0) < (matchup?.team1Ast || 0) ? 'text-red-400' : 'text-gray-400'}`}>{matchup?.team2Ast || 0}</div>
                <div className={`text-lg ${(matchup?.team2Stl || 0) > (matchup?.team1Stl || 0) ? 'text-green-400' : (matchup?.team2Stl || 0) < (matchup?.team1Stl || 0) ? 'text-red-400' : 'text-gray-400'}`}>{matchup?.team2Stl || 0}</div>
                <div className={`text-lg ${(matchup?.team2Blk || 0) > (matchup?.team1Blk || 0) ? 'text-green-400' : (matchup?.team2Blk || 0) < (matchup?.team1Blk || 0) ? 'text-red-400' : 'text-gray-400'}`}>{matchup?.team2Blk || 0}</div>
                <div className={`text-lg ${(matchup?.team2Orb || 0) > (matchup?.team1Orb || 0) ? 'text-green-400' : (matchup?.team2Orb || 0) < (matchup?.team1Orb || 0) ? 'text-red-400' : 'text-gray-400'}`}>{matchup?.team2Orb || 0}</div>
                <div className={`text-lg ${(matchup?.team2Drb || 0) > (matchup?.team1Drb || 0) ? 'text-green-400' : (matchup?.team2Drb || 0) < (matchup?.team1Drb || 0) ? 'text-red-400' : 'text-gray-400'}`}>{matchup?.team2Drb || 0}</div>
                <div className={`text-lg ${(matchup?.team2FgPercent || 0) > (matchup?.team1FgPercent || 0) ? 'text-green-400' : (matchup?.team2FgPercent || 0) < (matchup?.team1FgPercent || 0) ? 'text-red-400' : 'text-gray-400'}`}>{formatPercentOneDecimal(matchup?.team2FgPercent || 0)}</div>
                <div className="text-sm text-gray-400">{matchup?.team2Fgm || 0}/{matchup?.team2Fga || 0}</div>
                <div className={`text-lg ${(matchup?.team2FtPercent || 0) > (matchup?.team1FtPercent || 0) ? 'text-green-400' : (matchup?.team2FtPercent || 0) < (matchup?.team1FtPercent || 0) ? 'text-red-400' : 'text-gray-400'}`}>{formatPercentOneDecimal(matchup?.team2FtPercent || 0)}</div>
                <div className="text-sm text-gray-400">{matchup?.team2Ftm || 0}/{matchup?.team2Fta || 0}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Small Blank Space */}
      <div className="h-3"></div>

      {/* Box Scores Section */}
      <div className="p-6">
        <h2 className="text-white text-3xl font-bold mb-2 text-center bg-[var(--secondary)] p-4">ACTIVE PLAYERS</h2>
        
        {/* Small Blank Space */}
        <div className="h-3"></div>

        {/* Player Stats - 3 Column Layout */}
        <div className="space-y-4">
          {/* Guard 1 */}
          <div className="flex">
            <PlayerStatsBox 
              selection={getSelectionByPosition(team1Selections, "GUARD 1")} 
              isTeam1={true} 
            />

            {/* Column 2: Position Label (Rotated) - Extends full height */}
            <div className="w-[10%] flex justify-center items-center">
              <div className="text-gray-400 text-lg font-bold transform -rotate-90 whitespace-nowrap">
                GUARD 1
              </div>
            </div>

            <PlayerStatsBox 
              selection={getSelectionByPosition(team2Selections, "GUARD 1")} 
              isTeam1={false} 
            />
          </div>

          {/* Small Blank Space */}
          <div className="h-3"></div>

          {/* Guard 2 */}
          <div className="flex">
            <PlayerStatsBox 
              selection={getSelectionByPosition(team1Selections, "GUARD 2")} 
              isTeam1={true} 
            />

            {/* Column 2: Position Label (Rotated) - Extends full height */}
            <div className="w-[10%] flex justify-center items-center">
              <div className="text-gray-400 text-lg font-bold transform -rotate-90 whitespace-nowrap">
                GUARD 2
              </div>
            </div>

            <PlayerStatsBox 
              selection={getSelectionByPosition(team2Selections, "GUARD 2")} 
              isTeam1={false} 
            />
          </div>

          {/* Small Blank Space */}
          <div className="h-3"></div>

          {/* Forward 1 */}
          <div className="flex">
            <PlayerStatsBox 
              selection={getSelectionByPosition(team1Selections, "FORWARD 1")} 
              isTeam1={true} 
                          />

            {/* Column 2: Position Label (Rotated) - Extends full height */}
            <div className="w-[10%] flex justify-center items-center">
              <div className="text-gray-400 text-lg font-bold transform -rotate-90 whitespace-nowrap">
                FORWARD 1
              </div>
            </div>

            <PlayerStatsBox 
              selection={getSelectionByPosition(team2Selections, "FORWARD 1")} 
              isTeam1={false} 
            />
          </div>

          {/* Small Blank Space */}
          <div className="h-3"></div>

          {/* Forward 2 */}
          <div className="flex">
            <PlayerStatsBox 
              selection={getSelectionByPosition(team1Selections, "FORWARD 2")} 
              isTeam1={true} 
                          />

            {/* Column 2: Position Label (Rotated) - Extends full height */}
            <div className="w-[10%] flex justify-center items-center">
              <div className="text-gray-400 text-lg font-bold transform -rotate-90 whitespace-nowrap">
                FORWARD 2
              </div>
            </div>

            <PlayerStatsBox 
              selection={getSelectionByPosition(team2Selections, "FORWARD 2")} 
              isTeam1={false} 
            />
          </div>

          {/* Small Blank Space */}
          <div className="h-3"></div>

          {/* Center */}
          <div className="flex">
            <PlayerStatsBox 
              selection={getSelectionByPosition(team1Selections, "CENTER")} 
              isTeam1={true} 
                          />

            {/* Column 2: Position Label (Rotated) - Extends full height */}
            <div className="w-[10%] flex justify-center items-center">
              <div className="text-gray-400 text-lg font-bold transform -rotate-90 whitespace-nowrap">
                CENTER
              </div>
            </div>

            <PlayerStatsBox 
              selection={getSelectionByPosition(team2Selections, "CENTER")} 
              isTeam1={false} 
            />
          </div>

          {/* Small Blank Space */}
          <div className="h-3"></div>

          {/* Flex 1 */}
          <div className="flex">
            <PlayerStatsBox 
              selection={getSelectionByPosition(team1Selections, "FLEX 1")} 
              isTeam1={true} 
                          />

            {/* Column 2: Position Label (Rotated) - Extends full height */}
            <div className="w-[10%] flex justify-center items-center">
              <div className="text-gray-400 text-lg font-bold transform -rotate-90 whitespace-nowrap">
                FLEX 1
              </div>
            </div>

            <PlayerStatsBox 
              selection={getSelectionByPosition(team2Selections, "FLEX 1")} 
              isTeam1={false} 
            />
          </div>

          {/* Small Blank Space */}
          <div className="h-3"></div>

          {/* Flex 2 */}
          <div className="flex">
            <PlayerStatsBox 
              selection={getSelectionByPosition(team1Selections, "FLEX 2")} 
              isTeam1={true} 
                          />

            {/* Column 2: Position Label (Rotated) - Extends full height */}
            <div className="w-[10%] flex justify-center items-center">
              <div className="text-gray-400 text-lg font-bold transform -rotate-90 whitespace-nowrap">
                FLEX 2
              </div>
            </div>

            <PlayerStatsBox 
              selection={getSelectionByPosition(team2Selections, "FLEX 2")} 
              isTeam1={false} 
            />
          </div>
        </div>
      </div>

      {/* Small Blank Space */}
      <div className="h-3"></div>

      {/* Reserve Players Section */}
      <div className="p-6">
        <h2 className="text-white text-3xl font-bold mb-2 text-center bg-[var(--primary)] p-4">RESERVE PLAYERS</h2>
        
        {/* Small Blank Space */}
        <div className="h-3"></div>

        {/* Reserve Player Stats - 3 Column Layout */}
        <div className="space-y-4">
          {/* Reserve Guard */}
          <div className="flex">
            <PlayerStatsBox 
              selection={getSelectionByPosition(team1Selections, "RES GUARD")} 
              isTeam1={true} 
                          />

            {/* Column 2: Position Label (Rotated) - Extends full height */}
            <div className="w-[10%] flex justify-center items-center">
              <div className="text-gray-400 text-lg font-bold transform -rotate-90 whitespace-nowrap">
                RES GUARD
              </div>
            </div>

            <PlayerStatsBox 
              selection={getSelectionByPosition(team2Selections, "RES GUARD")} 
              isTeam1={false} 
            />
          </div>

          {/* Small Blank Space */}
          <div className="h-3"></div>

          {/* Reserve Forward/Center */}
          <div className="flex">
            <PlayerStatsBox 
              selection={getSelectionByPosition(team1Selections, "RES FORWARD/CENTER")} 
              isTeam1={true} 
                          />

            {/* Column 2: Position Label (Rotated) - Extends full height */}
            <div className="w-[10%] flex justify-center items-center">
              <div className="text-gray-400 text-lg font-bold transform -rotate-90 whitespace-nowrap">
                RES FORWARD/CENTER
              </div>
            </div>

            <PlayerStatsBox 
              selection={getSelectionByPosition(team2Selections, "RES FORWARD/CENTER")} 
              isTeam1={false} 
            />
          </div>

          {/* Small Blank Space */}
          <div className="h-3"></div>

          {/* Reserve Flex */}
          <div className="flex">
            <PlayerStatsBox 
              selection={getSelectionByPosition(team1Selections, "RES FLEX")} 
              isTeam1={true} 
                          />

            {/* Column 2: Position Label (Rotated) - Extends full height */}
            <div className="w-[10%] flex justify-center items-center">
              <div className="text-gray-400 text-lg font-bold transform -rotate-90 whitespace-nowrap">
                RES FLEX
              </div>
            </div>

            <PlayerStatsBox 
              selection={getSelectionByPosition(team2Selections, "RES FLEX")} 
              isTeam1={false} 
            />
          </div>
        </div>

        {/* Black Space */}
        <div className="h-24 bg-gray-800"></div>
      </div>

      {/* Bottom padding for navigation */}
      <div className="pb-20"></div>
    </div>
  );
}