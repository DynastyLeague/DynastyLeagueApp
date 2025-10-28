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
      'GUARD/FORWARD': ['Guard/Forward'],
      'FORWARD/CENTER': ['Forward/Centre', 'Forward/Center'],
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
    // Desired: "NBA TEAM - nba_opposition"
    const { nbaOpposition, nbaTeam } = selection;

    if (!nbaTeam) {
      return 'No Game Selected';
    }

    // Format: "OKC - vs HOU" or "OKC - nba_opposition" as stored in sheet
    return `${nbaTeam} - ${nbaOpposition || 'No Game Selected'}`;
  };

  const formatStatValue = (value: number | undefined, hasPlayed: boolean, isPercentage: boolean = false) => {
    if (value === undefined || value === null) return '-';
    if (!hasPlayed) return '-';
    if (value === 0 && !hasPlayed) return '-';
    if (isPercentage) {
      return value.toFixed(3);
    }
    return value.toString();
  };

  const formatPercentOneDecimal = (value: number | undefined, hasPlayed: boolean) => {
    if (value === undefined || value === null) return '-';
    if (!hasPlayed) return '-';
    const numeric = Number(value);
    if (Number.isNaN(numeric)) return '-';
    
    // Convert to decimal format (0.000 to 1.000)
    const asDecimal = numeric > 1 ? numeric / 100 : numeric;
    
    // Format with 3 decimal places
    const formatted = asDecimal.toFixed(3);
    
    // If it's exactly 1, return as 1.000
    if (asDecimal >= 0.9995) return '1.000'; // Handle floating point rounding
    
    // If it's 0, return 0.000 (valid 0% FT%)
    if (asDecimal === 0) return '0.000';
    
    // If less than 1, remove the leading 0 (e.g., 0.456 becomes .456)
    return formatted.substring(1); // Remove the '0' to show '.xxx'
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
            <div className="flex justify-center" style={{gap: '1.25rem'}}>
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
                <div className="text-gray-400 text-xs">DRB</div>
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
          <div className={`absolute top-2 ${isTeam1 ? 'right-0' : 'left-0'} w-6 h-6 flex items-center justify-center`}>
            <Image src={selection.photoUrl} alt={selection.playerName} width={26} height={26} className="object-contain w-full h-full" />
          </div>
        )}
 
        <div className="flex items-center justify-between mb-4">
          {(() => {
            // Check if game is today
            const isToday = (() => {
              if (!selection.gameDate) return false;
              
              const today = new Date();
              let gameDate: Date;
              
              // Parse game date (DD/MM/YYYY format)
              if (selection.gameDate.includes('/')) {
                const parts = selection.gameDate.split('/');
                if (parts.length === 3) {
                  const day = parseInt(parts[0]);
                  const month = parseInt(parts[1]) - 1;
                  const year = parseInt(parts[2]);
                  gameDate = new Date(year, month, day);
                } else {
                  gameDate = new Date(selection.gameDate);
                }
              } else {
                gameDate = new Date(selection.gameDate);
              }
              
              return today.getDate() === gameDate.getDate() &&
                     today.getMonth() === gameDate.getMonth() &&
                     today.getFullYear() === gameDate.getFullYear();
            })();
            
            const gameTextColor = isToday ? 'text-green-400' : 'text-white';
            
            // Adjust font size based on name length
            const nameFontSize = selection.playerName.length > 18 ? 'text-sm' : selection.playerName.length > 15 ? 'text-base' : 'text-lg';
            
            return isTeam1 ? (
              <>
                {/* Left: Text, Right: Photo */}
                <div className="text-left flex-1">
                  <div className={`text-white font-bold ${nameFontSize}`}>&nbsp;{selection.playerName}</div>
                  <div className={`${gameTextColor} text-sm`}>&nbsp;{formatGameDisplay(selection)}</div>
                </div>
              </>
            ) : (
              <>
                <div className="text-right flex-1">
                  <div className={`text-white font-bold ${nameFontSize}`}>{selection.playerName}&nbsp;</div>
                  <div className={`${gameTextColor} text-sm`}>{formatGameDisplay(selection)}&nbsp;</div>
                </div>
              </>
            );
          })()}
        </div>
        
        {/* Stats */}
        <div className="space-y-4">
          {(() => {
            // Player has played if they have minutes > 0
            const hasPlayed = (selection.min || 0) > 0;
            
            return (
              <>
                {/* Row 1: 3 stats */}
                <div className="flex justify-center" style={{gap: '2rem'}}>
                  <div className="text-center">
                    <div className="text-gray-400 text-xs">PTS</div>
                    <div className="text-white text-sm font-bold">{formatStatValue(selection.pts, hasPlayed)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-400 text-xs">3PM</div>
                    <div className="text-white text-sm font-bold">{formatStatValue(selection.threePm, hasPlayed)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-400 text-xs">AST</div>
                    <div className="text-white text-sm font-bold">{formatStatValue(selection.ast, hasPlayed)}</div>
                  </div>
                </div>

                {/* Row 2: 4 stats */}
                <div className="flex justify-center" style={{gap: '1.25rem'}}>
                  <div className="text-center">
                    <div className="text-gray-400 text-xs">STL</div>
                    <div className="text-white text-sm font-bold">{formatStatValue(selection.stl, hasPlayed)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-400 text-xs">BLK</div>
                    <div className="text-white text-sm font-bold">{formatStatValue(selection.blk, hasPlayed)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-400 text-xs">ORB</div>
                    <div className="text-white text-sm font-bold">{formatStatValue(selection.orb, hasPlayed)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-400 text-xs">DRB</div>
                    <div className="text-white text-sm font-bold">{formatStatValue(selection.drb, hasPlayed)}</div>
                  </div>
                </div>

                {/* Row 3: 3 stats */}
                <div className="flex justify-center" style={{gap: '2rem'}}>
                  <div className="text-center">
                    <div className="text-gray-400 text-xs">FG%</div>
                    <div className="text-white text-sm font-bold">{formatPercentOneDecimal(selection.fgPercent, hasPlayed)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-400 text-xs">FT%</div>
                    <div className="text-white text-sm font-bold">{formatPercentOneDecimal(selection.ftPercent, hasPlayed)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-400 text-xs">MIN</div>
                    <div className="text-white text-sm font-bold">{formatStatValue(selection.min, hasPlayed)}</div>
                  </div>
                </div>
              </>
            );
          })()}
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
            <div className="flex items-baseline justify-center text-white gap-3 sm:gap-6">
              <span className={`text-4xl sm:text-6xl font-bold min-w-[2rem] sm:min-w-[3rem] ${((matchup?.team1Score || 0) > (matchup?.team2Score || 0)) ? 'text-green-400' : ((matchup?.team1Score || 0) < (matchup?.team2Score || 0)) ? 'text-red-400' : 'text-gray-400'}`}>{matchup?.team1Score || 0}</span>
              <span className="text-2xl sm:text-4xl font-bold text-gray-300">vs</span>
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
        <div className="bg-gray-700 p-6">
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
                <div className={`text-lg ${(matchup?.team1FgPercent || 0) > (matchup?.team2FgPercent || 0) ? 'text-green-400' : (matchup?.team1FgPercent || 0) < (matchup?.team2FgPercent || 0) ? 'text-red-400' : 'text-gray-400'}`}>{formatPercentOneDecimal(matchup?.team1FgPercent || 0, true)}</div>
                <div className="text-sm text-gray-400">{matchup?.team1Fgm || 0}/{matchup?.team1Fga || 0}</div>
                <div className={`text-lg ${(matchup?.team1FtPercent || 0) > (matchup?.team2FtPercent || 0) ? 'text-green-400' : (matchup?.team1FtPercent || 0) < (matchup?.team2FtPercent || 0) ? 'text-red-400' : 'text-gray-400'}`}>{formatPercentOneDecimal(matchup?.team1FtPercent || 0, true)}</div>
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
                <div className={`text-lg ${(matchup?.team2FgPercent || 0) > (matchup?.team1FgPercent || 0) ? 'text-green-400' : (matchup?.team2FgPercent || 0) < (matchup?.team1FgPercent || 0) ? 'text-red-400' : 'text-gray-400'}`}>{formatPercentOneDecimal(matchup?.team2FgPercent || 0, true)}</div>
                <div className="text-sm text-gray-400">{matchup?.team2Fgm || 0}/{matchup?.team2Fga || 0}</div>
                <div className={`text-lg ${(matchup?.team2FtPercent || 0) > (matchup?.team1FtPercent || 0) ? 'text-green-400' : (matchup?.team2FtPercent || 0) < (matchup?.team1FtPercent || 0) ? 'text-red-400' : 'text-gray-400'}`}>{formatPercentOneDecimal(matchup?.team2FtPercent, true)}</div>
                <div className="text-sm text-gray-400">{matchup?.team2Ftm || 0}/{matchup?.team2Fta || 0}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Small Blank Space */}
      <div className="h-3"></div>

      {/* Still To Play Section */}
      <div className="p-6">
        <h2 className="text-white text-3xl font-bold mb-4 text-center bg-[var(--secondary)] p-4">STILL TO PLAY</h2>
        
        <div className="flex justify-between gap-8 px-6">
          {/* Team 1 - Still To Play */}
          <div className="flex-1">
            {(() => {
              // Check if any active players are selected
              const activePlayerSelections = team1Selections.filter(sel => 
                !sel.position.toLowerCase().includes('res')
              );

              // If no active players selected at all
              if (activePlayerSelections.length === 0) {
                return <div className="text-gray-400 text-sm italic">No players selected</div>;
              }

              // Filter unplayed active players (less than 10 minutes played)
              const unplayedPlayers = activePlayerSelections.filter(sel => 
                (sel.min || 0) < 10
              );

              // If all active players have played 10+ mins
              if (unplayedPlayers.length === 0) {
                return <div className="text-gray-400 text-sm italic">All games have been played</div>;
              }

              // Group by game date
              const groupedByDate: { [key: string]: typeof unplayedPlayers } = {};
              unplayedPlayers.forEach(sel => {
                const dateKey = sel.gameDate || 'TBD';
                if (!groupedByDate[dateKey]) {
                  groupedByDate[dateKey] = [];
                }
                groupedByDate[dateKey].push(sel);
              });

              // Sort dates chronologically
              const sortedDates = Object.keys(groupedByDate).sort((a, b) => {
                if (a === 'TBD') return 1;
                if (b === 'TBD') return -1;
                
                const parseDate = (dateStr: string) => {
                  if (dateStr.includes('/')) {
                    const parts = dateStr.split('/');
                    if (parts.length === 3) {
                      return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
                    }
                  }
                  return new Date(dateStr);
                };
                
                return parseDate(a).getTime() - parseDate(b).getTime();
              });

              return (
                <div className="space-y-4">
                  {sortedDates.map((dateKey) => {
                    const players = groupedByDate[dateKey];
                    
                    // Format date header
                    let dayName = '';
                    let formattedDate = '';
                    let monthAbbr = '';
                    
                    if (dateKey !== 'TBD') {
                      try {
                        let date = new Date(dateKey);
                        if (dateKey.includes('/')) {
                          const parts = dateKey.split('/');
                          if (parts.length === 3) {
                            const day = parseInt(parts[0]);
                            const month = parseInt(parts[1]) - 1;
                            const year = parseInt(parts[2]);
                            date = new Date(year, month, day);
                          }
                        }
                        dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
                        const dayNumber = date.getDate();
                        
                        // Add ordinal suffix
                        let suffix = 'th';
                        if (dayNumber % 10 === 1 && dayNumber !== 11) suffix = 'st';
                        else if (dayNumber % 10 === 2 && dayNumber !== 12) suffix = 'nd';
                        else if (dayNumber % 10 === 3 && dayNumber !== 13) suffix = 'rd';
                        
                        formattedDate = dayNumber + suffix;
                        monthAbbr = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
                      } catch {}
                    }

                    return (
                      <div key={dateKey}>
                        {/* Date Header */}
                        <div className="text-yellow-400 font-bold text-sm mb-1">
                          {dateKey === 'TBD' ? 'TBD' : `${dayName}, ${formattedDate} ${monthAbbr}`}
                        </div>
                        
                        {/* Players for this date */}
                        <div className="space-y-1">
                          {players.map((sel, index) => {
                            let shortPosition = sel.position;
                            if (sel.position === 'Guard 1') shortPosition = 'G';
                            else if (sel.position === 'Guard 2') shortPosition = 'G';
                            else if (sel.position === 'Forward 1') shortPosition = 'F';
                            else if (sel.position === 'Forward 2') shortPosition = 'F';
                            else if (sel.position === 'Centre') shortPosition = 'C';
                            else if (sel.position === 'Guard/Forward') shortPosition = 'G/F';
                            else if (sel.position === 'Forward/Centre') shortPosition = 'F/C';
                            else if (sel.position === 'Flex 1') shortPosition = 'FLX';
                            else if (sel.position === 'Flex 2') shortPosition = 'FLX';
                            
                            return (
                              <div key={index} className="text-white text-sm">
                                {sel.playerName} ({shortPosition})
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          {/* Team 2 - Still To Play */}
          <div className="flex-1 text-right">
            {(() => {
              // Check if any active players are selected
              const activePlayerSelections = team2Selections.filter(sel => 
                !sel.position.toLowerCase().includes('res')
              );

              // If no active players selected at all
              if (activePlayerSelections.length === 0) {
                return <div className="text-gray-400 text-sm italic">No players selected</div>;
              }

              // Filter unplayed active players (less than 10 minutes played)
              const unplayedPlayers = activePlayerSelections.filter(sel => 
                (sel.min || 0) < 10
              );

              // If all active players have played 10+ mins
              if (unplayedPlayers.length === 0) {
                return <div className="text-gray-400 text-sm italic">All games have been played</div>;
              }

              // Group by game date
              const groupedByDate: { [key: string]: typeof unplayedPlayers } = {};
              unplayedPlayers.forEach(sel => {
                const dateKey = sel.gameDate || 'TBD';
                if (!groupedByDate[dateKey]) {
                  groupedByDate[dateKey] = [];
                }
                groupedByDate[dateKey].push(sel);
              });

              // Sort dates chronologically
              const sortedDates = Object.keys(groupedByDate).sort((a, b) => {
                if (a === 'TBD') return 1;
                if (b === 'TBD') return -1;
                
                const parseDate = (dateStr: string) => {
                  if (dateStr.includes('/')) {
                    const parts = dateStr.split('/');
                    if (parts.length === 3) {
                      return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
                    }
                  }
                  return new Date(dateStr);
                };
                
                return parseDate(a).getTime() - parseDate(b).getTime();
              });

              return (
                <div className="space-y-4">
                  {sortedDates.map((dateKey) => {
                    const players = groupedByDate[dateKey];
                    
                    // Format date header
                    let dayName = '';
                    let formattedDate = '';
                    let monthAbbr = '';
                    
                    if (dateKey !== 'TBD') {
                      try {
                        let date = new Date(dateKey);
                        if (dateKey.includes('/')) {
                          const parts = dateKey.split('/');
                          if (parts.length === 3) {
                            const day = parseInt(parts[0]);
                            const month = parseInt(parts[1]) - 1;
                            const year = parseInt(parts[2]);
                            date = new Date(year, month, day);
                          }
                        }
                        dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
                        const dayNumber = date.getDate();
                        
                        // Add ordinal suffix
                        let suffix = 'th';
                        if (dayNumber % 10 === 1 && dayNumber !== 11) suffix = 'st';
                        else if (dayNumber % 10 === 2 && dayNumber !== 12) suffix = 'nd';
                        else if (dayNumber % 10 === 3 && dayNumber !== 13) suffix = 'rd';
                        
                        formattedDate = dayNumber + suffix;
                        monthAbbr = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
                      } catch {}
                    }

                    return (
                      <div key={dateKey}>
                        {/* Date Header */}
                        <div className="text-yellow-400 font-bold text-sm mb-1">
                          {dateKey === 'TBD' ? 'TBD' : `${dayName}, ${formattedDate} ${monthAbbr}`}
                        </div>
                        
                        {/* Players for this date */}
                        <div className="space-y-1">
                          {players.map((sel, index) => {
                            let shortPosition = sel.position;
                            if (sel.position === 'Guard 1') shortPosition = 'G';
                            else if (sel.position === 'Guard 2') shortPosition = 'G';
                            else if (sel.position === 'Forward 1') shortPosition = 'F';
                            else if (sel.position === 'Forward 2') shortPosition = 'F';
                            else if (sel.position === 'Centre') shortPosition = 'C';
                            else if (sel.position === 'Guard/Forward') shortPosition = 'G/F';
                            else if (sel.position === 'Forward/Centre') shortPosition = 'F/C';
                            else if (sel.position === 'Flex 1') shortPosition = 'FLX';
                            else if (sel.position === 'Flex 2') shortPosition = 'FLX';
                            
                            return (
                              <div key={index} className="text-white text-sm">
                                {sel.playerName} ({shortPosition})
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Small Blank Space */}
      <div className="h-6"></div>

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
              <div className="text-gray-400 text-sm font-bold whitespace-nowrap" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
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
              <div className="text-gray-400 text-sm font-bold whitespace-nowrap" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
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
              <div className="text-gray-400 text-sm font-bold whitespace-nowrap" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
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
              <div className="text-gray-400 text-sm font-bold whitespace-nowrap" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
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
              <div className="text-gray-400 text-sm font-bold whitespace-nowrap" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
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

          {/* Guard/Forward */}
          <div className="flex">
            <PlayerStatsBox 
              selection={getSelectionByPosition(team1Selections, "GUARD/FORWARD")} 
              isTeam1={true} 
                          />

            {/* Column 2: Position Label (Rotated) - Extends full height */}
            <div className="w-[10%] flex justify-center items-center">
              <div className="text-gray-400 text-sm font-bold whitespace-nowrap" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                GUARD/FORWARD
              </div>
            </div>

            <PlayerStatsBox 
              selection={getSelectionByPosition(team2Selections, "GUARD/FORWARD")} 
              isTeam1={false} 
            />
          </div>

          {/* Small Blank Space */}
          <div className="h-3"></div>

          {/* Forward/Center */}
          <div className="flex">
            <PlayerStatsBox 
              selection={getSelectionByPosition(team1Selections, "FORWARD/CENTER")} 
              isTeam1={true} 
                          />

            {/* Column 2: Position Label (Rotated) - Extends full height */}
            <div className="w-[10%] flex justify-center items-center">
              <div className="text-gray-400 text-sm font-bold whitespace-nowrap" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                FORWARD/CENTER
              </div>
            </div>

            <PlayerStatsBox 
              selection={getSelectionByPosition(team2Selections, "FORWARD/CENTER")} 
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
              <div className="text-gray-400 text-sm font-bold whitespace-nowrap" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
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
              <div className="text-gray-400 text-sm font-bold whitespace-nowrap" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
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
              <div className="text-gray-400 text-sm font-bold whitespace-nowrap" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
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
              <div className="text-gray-400 text-sm font-bold whitespace-nowrap" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
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
              <div className="text-gray-400 text-sm font-bold whitespace-nowrap" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
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