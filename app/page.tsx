"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Standing } from "@/app/api/standings/route";

export default function Home() {
  const router = useRouter();
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentTeam, isLoading } = useAuth();

  useEffect(() => {
    const load = async () => {
      try {
        const standingsRes = await fetch("/api/standings");
        
        if (standingsRes.ok) {
          const standingsData: Standing[] = await standingsRes.json();
          setStandings(standingsData);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // If not logged in, redirect to login
  useEffect(() => {
    if (!isLoading && !currentTeam) {
      router.replace('/login');
    }
  }, [isLoading, currentTeam, router]);

  // Don't render until auth is checked
  if (isLoading || !currentTeam) {
    return <div className="p-4 bg-white">Loading...</div>;
  }

  const westernStandings = standings
    .filter(s => s.conference?.toLowerCase() === 'western')
    .sort((a, b) => a.position - b.position);
  
  const easternStandings = standings
    .filter(s => s.conference?.toLowerCase() === 'eastern')
    .sort((a, b) => a.position - b.position);

  return (
    <div className="min-h-screen bg-gray-800">
      {currentTeam && (
        <>
          {/* Dynasty League Logo for logged-in users - Clickable Home Button */}
          <div className="text-center mb-8 pt-6">
            <Link href="/">
              <img
                src={`/api/image?url=${encodeURIComponent("https://drive.google.com/uc?export=view&id=1hOy_hcD3zCKG4ajLx9fSgZcF4Wp1Rfqo")}`}
                alt="Dynasty League"
                className="mx-auto h-32 object-contain cursor-pointer hover:opacity-90 transition-opacity"
              />
            </Link>
          </div>

          {/* Standings Section */}
          <div className="mb-8 px-6 pb-60">
            {/* Header */}
            <div className="bg-orange-500 text-white p-6 sm:p-12 pb-8 sm:pb-16 mb-6 sm:mb-12">
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-center">2025-26 STANDINGS</h1>
            </div>
            
            {/* Spacer */}
            <div className="h-6 bg-gray-800"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Eastern Conference */}
              <div>
                <h2 className="text-2xl font-bold mb-4 text-center text-white">EASTERN CONFERENCE</h2>
                <div className="overflow-x-auto bg-blue-900 p-4">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-gray-600">
                        <th 
                          className="text-center p-3 font-bold text-white w-10" 
                          style={{ backgroundColor: '#60a5fa', background: '#60a5fa', backgroundImage: 'none' }}
                        >#</th>
                        <th 
                          className="text-center p-3 font-bold text-white" 
                          style={{ backgroundColor: '#60a5fa', background: '#60a5fa', backgroundImage: 'none' }}
                        >TEAM</th>
                        <th 
                          className="text-center p-3 font-bold text-white" 
                          style={{ backgroundColor: '#60a5fa', background: '#60a5fa', backgroundImage: 'none' }}
                        >RECORD</th>
                        <th 
                          className="text-center p-3 font-bold text-white" 
                          style={{ backgroundColor: '#60a5fa', background: '#60a5fa', backgroundImage: 'none' }}
                        >F/A%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={4} className="p-3 text-center text-gray-300">Loading...</td>
                        </tr>
                      ) : easternStandings.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-3 text-center text-gray-300">No data available</td>
                        </tr>
                      ) : (
                        easternStandings.map((standing) => (
                          <tr
                            key={standing.teamId}
                            className={`border-b border-gray-700 ${
                              standing.position <= 4 ? 'bg-gray-700' : 'bg-gray-800'
                            } hover:bg-gray-700 transition-colors`}
                          >
                            <td className="p-3 font-semibold text-white text-center w-10">
                              {standing.position <= 4 ? (
                                <span className="text-green-400">{standing.position}</span>
                              ) : (
                                <span className="text-white">{standing.position}</span>
                              )}
                            </td>
                            <td className="p-3 text-white text-center">{standing.teamName.toUpperCase()}</td>
                            <td className="p-3 text-gray-300 text-center">{standing.record || `${standing.wins}-${standing.losses}-${standing.ties}`}</td>
                            <td className="p-3 text-gray-300 text-center">{(standing.percentage * 100).toFixed(1)}%</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Western Conference */}
              <div>
                <h2 className="text-2xl font-bold mb-4 text-center text-white">WESTERN CONFERENCE</h2>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-gray-600">
                        <th 
                          className="text-center p-3 font-bold text-white w-10" 
                          style={{ backgroundColor: '#991b1b', background: '#991b1b', backgroundImage: 'none' }}
                        >#</th>
                        <th 
                          className="text-center p-3 font-bold text-white" 
                          style={{ backgroundColor: '#991b1b', background: '#991b1b', backgroundImage: 'none' }}
                        >TEAM</th>
                        <th 
                          className="text-center p-3 font-bold text-white" 
                          style={{ backgroundColor: '#991b1b', background: '#991b1b', backgroundImage: 'none' }}
                        >RECORD</th>
                        <th 
                          className="text-center p-3 font-bold text-white" 
                          style={{ backgroundColor: '#991b1b', background: '#991b1b', backgroundImage: 'none' }}
                        >F/A%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={4} className="p-3 text-center text-gray-300">Loading...</td>
                        </tr>
                      ) : westernStandings.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-3 text-center text-gray-300">No data available</td>
                        </tr>
                      ) : (
                        westernStandings.map((standing) => (
                          <tr
                            key={standing.teamId}
                            className={`border-b border-gray-700 ${
                              standing.position <= 4 ? 'bg-gray-700' : 'bg-gray-800'
                            } hover:bg-gray-700 transition-colors`}
                          >
                            <td className="p-3 font-semibold text-white text-center w-10">
                              {standing.position <= 4 ? (
                                <span className="text-green-400">{standing.position}</span>
                              ) : (
                                <span className="text-white">{standing.position}</span>
                              )}
                            </td>
                            <td className="p-3 text-white text-center">{standing.teamName.toUpperCase()}</td>
                            <td className="p-3 text-gray-300 text-center">{standing.record || `${standing.wins}-${standing.losses}-${standing.ties}`}</td>
                            <td className="p-3 text-gray-300 text-center">{(standing.percentage * 100).toFixed(1)}%</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
