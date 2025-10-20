'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Matchup, WeekDate, Team } from '@/lib/types';

export default function MatchupPage() {
  const [matchups, setMatchups] = useState<Matchup[]>([]);
  const [weekDates, setWeekDates] = useState<WeekDate[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [matchupsRes, weekDatesRes, teamsRes] = await Promise.all([
          fetch('/api/matchups'),
          fetch('/api/weekdates'),
          fetch('/api/teams')
        ]);

        if (matchupsRes.ok && weekDatesRes.ok && teamsRes.ok) {
          const matchupsData = await matchupsRes.json();
          const weekDatesData = await weekDatesRes.json();
          const teamsData = await teamsRes.json();

          setMatchups(matchupsData);
          setWeekDates(weekDatesData);
          setTeams(teamsData);

          // Set first week as default (or you can implement logic to determine current week)
          if (weekDatesData.length > 0) {
            setSelectedWeek(weekDatesData[0].week);
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
          font-size: 1.875rem; /* text-3xl */
        }
        select option {
          font-size: 1.25rem; /* text-xl */
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
      <div className="bg-orange-500 text-white p-12 pb-16 mb-12">
        <h1 className="text-6xl sm:text-5xl font-bold text-center">DYNASTY LEAGUE MATCHUPS</h1>
      </div>

      {/* White Spacer */}
      <div className="h-5 bg-gray-800"></div>

      {/* Week Selection Dropdown */}
      <div className="px-6 mb-12">
        <select
          value={selectedWeek}
          onChange={(e) => setSelectedWeek(parseInt(e.target.value))}
          className="w-full bg-gray-700 text-white text-3xl px-4 py-3 border border-gray-600 rounded-none focus:outline-none focus:border-orange-500 appearance-none"
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
      <div className="px-6 pb-12" style={{gap: '10px'}}>
        {filteredMatchups.map((matchup) => (
          <Link key={matchup.matchupId} href={`/matchups/${matchup.matchupId}`}>
            <div className="bg-gray-800 py-6 px-8 sm:py-5 sm:px-7 cursor-pointer hover:bg-gray-700 transition-colors mb-2">
              <div className="flex items-center justify-between">
                {/* Team 1 */}
                <div className="flex items-center space-x-3 sm:space-x-4 flex-1 pr-3 sm:pr-5">
                  <div className="w-24 h-24 sm:w-20 sm:h-20 flex items-center justify-center flex-shrink-0">
                    {(() => {
                      const team1 = getTeamById(matchup.team1Id);
                      if (team1?.teamId) {
                        return (
                          <Image
                            src={`/logos/${team1.teamId}-main.png.png`}
                            alt={team1.teamName}
                            width={96}
                            height={96}
                            className="object-contain sm:w-20 sm:h-20"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        );
                      }
                      return <span className="text-white text-base sm:text-sm">T1</span>;
                    })()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-gray-400 text-lg sm:text-base mt-2">
                      {matchup.team1Gp}/9 GP
                    </div>
                  </div>
                </div>

                {/* Scores */}
                <div className="text-center px-8 sm:px-12 flex-shrink-0">
                  <div className="text-white text-5xl sm:text-4xl font-bold leading-loose flex items-center justify-center">
                    <span>{matchup.team1Score}</span>
                    <span className="text-lg mx-8">&nbsp;&nbsp;&nbsp;vs&nbsp;&nbsp;&nbsp;</span>
                    <span>{matchup.team2Score}</span>
                  </div>
                </div>

                {/* Team 2 */}
                <div className="flex items-center space-x-3 sm:space-x-4 flex-1 pl-3 sm:pl-5 justify-end">
                  <div className="min-w-0 flex-1 text-right">
                    <div className="text-gray-400 text-lg sm:text-base mt-2">
                      {matchup.team2Gp}/9 GP
                    </div>
                  </div>
                  <div className="w-24 h-24 sm:w-20 sm:h-20 flex items-center justify-center flex-shrink-0">
                    {(() => {
                      const team2 = getTeamById(matchup.team2Id);
                      if (team2?.teamId) {
                        return (
                          <Image
                            src={`/logos/${team2.teamId}-main.png.png`}
                            alt={team2.teamName}
                            width={96}
                            height={96}
                            className="object-contain sm:w-20 sm:h-20"
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

      {/* Bottom padding for navigation */}
      <div className="pb-20"></div>
    </div>
  );
}