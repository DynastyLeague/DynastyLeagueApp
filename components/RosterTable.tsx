'use client';

import { Player } from '@/lib/types';
import { useState } from 'react';

interface RosterTableProps {
  players: Player[];
  title: string;
  maxSlots: number;
  headerTitle?: string;
}

export default function RosterTable({ players, title, maxSlots, headerTitle }: RosterTableProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Sort players by 25-26 salary (highest to lowest)
  const sortedPlayers = [...players].sort((a, b) => {
    const salaryA = typeof a.salary25_26 === 'number' ? a.salary25_26 : 0;
    const salaryB = typeof b.salary25_26 === 'number' ? b.salary25_26 : 0;
    return salaryB - salaryA; // Highest to lowest
  });

  const openHistoryModal = (player: Player) => {
    setSelectedPlayer(player);
    setShowHistoryModal(true);
  };

  const closeHistoryModal = () => {
    setSelectedPlayer(null);
    setShowHistoryModal(false);
  };

  const getSalaryDisplay = (salary: number | string | undefined, option?: string) => {
    // Check if the option column indicates a contract status
    if (option) {
      if (option.includes('TO')) return { text: typeof salary === 'number' && salary > 0 ? `$${salary.toFixed(2)}m` : 'N/A', color: 'text-green-400 bg-green-900/20' };
      if (option.includes('RFA')) return { text: typeof salary === 'number' && salary > 0 ? `$${salary.toFixed(2)}m` : 'N/A', color: 'text-red-400 bg-red-900/20' };
      if (option.includes('UFA') && !option.includes('EXT')) return { text: typeof salary === 'number' && salary > 0 ? `$${salary.toFixed(2)}m` : 'N/A', color: 'text-blue-400 bg-blue-900/20' };
      if (option.includes('EXT/UFA')) return { text: typeof salary === 'number' && salary > 0 ? `$${salary.toFixed(2)}m` : 'N/A', color: 'text-orange-400 bg-orange-900/20' };
      if (option.includes('DEV')) return { text: 'DEV', color: 'text-red-800 bg-red-900/20' };
      // Handle DEV/RFA combination
      if (option.includes('DEV/RFA')) return { text: 'DEV/RFA', color: 'text-red-400 bg-red-900/20' };
    }

    if (typeof salary === 'string') {
      // Handle contract status values in salary field itself
      if (salary.includes('TO')) return { text: 'TO', color: 'text-green-400 bg-green-900/20' };
      if (salary.includes('RFA')) return { text: 'RFA', color: 'text-red-400 bg-red-900/20' };
      if (salary.includes('UFA') && !salary.includes('EXT')) return { text: 'UFA', color: 'text-blue-400 bg-blue-900/20' };
      if (salary.includes('EXT/UFA')) return { text: 'EXT/UFA', color: 'text-orange-400 bg-orange-900/20' };
      if (salary.includes('DEV')) return { text: 'DEV', color: 'text-red-800 bg-red-900/20' };
      // Handle DEV/RFA combination
      if (salary.includes('DEV/RFA')) return { text: 'DEV/RFA', color: 'text-red-400 bg-red-900/20' };
      return { text: salary, color: 'text-gray-300' };
    }
    
    if (typeof salary === 'number') {
      if (salary === 0) {
        return { text: '$0.00m', color: 'text-gray-300' };
      }
      if (salary > 0) {
        return { text: `$${salary.toFixed(2)}m`, color: 'text-gray-300' };
      }
    }
    
    return { text: 'N/A', color: 'text-gray-500' };
  };

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold mb-4 text-white">
        {title}
      </h2>
      
      <div className="bg-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed">
            <thead className="bg-gray-700 sticky top-0 z-20">
              <tr>
                <th className="sticky left-0 bg-gray-700 px-4 py-3 text-left text-sm font-medium text-gray-300 border-r border-gray-600 w-[182px] z-30">
                  {headerTitle || ''}
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
              {sortedPlayers.map((player, index) => (
                <tr key={player.playerId} className={index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-700'}>
                  <td className="sticky left-0 bg-inherit px-4 py-2 text-sm border-r border-gray-600 w-[182px] z-10">
                    <div className="flex items-start gap-3">
                      {/* Player Photo */}
                      <div className="flex-shrink-0 pt-1 pb-1">
                        {player.photo ? (
                          <img
                            src={`/api/image?url=${encodeURIComponent(player.photo)}`}
                            alt={`${player.name} photo`}
                            className="h-12 w-12 object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className={`h-12 w-12 bg-gray-600 flex items-center justify-center text-white text-xs font-bold ${player.photo ? 'hidden' : ''}`}
                        >
                          {player.name?.slice(0, 2).toUpperCase()}
                        </div>
                      </div>
                      
                      {/* Player Info */}
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-medium text-base leading-tight">{player.name}</div>
                        <div className="text-gray-400 text-sm mt-1 leading-tight">
                          {player.position} - {player.nbaTeam} - {player.age}
                        </div>
                        <div className="text-gray-300 text-xs mt-1 leading-tight">
                          {player.rankType} = {player.careerRank ? (typeof player.careerRank === 'number' && player.careerRank % 1 === 0 ? String(player.careerRank) : player.careerRank) : 'N/A'}
                        </div>
                        <button
                          onClick={() => openHistoryModal(player)}
                          className="text-gray-400 hover:text-white text-xs mt-1 transition-colors"
                        >
                          📝 History Log
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center text-base w-24">
                    <span className={getSalaryDisplay(player.salary25_26, player.option25_26).color}>
                      {getSalaryDisplay(player.salary25_26, player.option25_26).text}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center text-base w-24">
                    <span className={getSalaryDisplay(player.salary26_27, player.option26_27).color}>
                      {getSalaryDisplay(player.salary26_27, player.option26_27).text}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center text-base w-24">
                    <span className={getSalaryDisplay(player.salary27_28, player.option27_28).color}>
                      {getSalaryDisplay(player.salary27_28, player.option27_28).text}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center text-base w-24">
                    <span className={getSalaryDisplay(player.salary28_29, player.option28_29).color}>
                      {getSalaryDisplay(player.salary28_29, player.option28_29).text}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center text-base w-24">
                    <span className={getSalaryDisplay(player.salary29_30, player.option29_30).color}>
                      {getSalaryDisplay(player.salary29_30, player.option29_30).text}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center text-base w-24">
                    <span className={getSalaryDisplay(player.salary30_31, player.option30_31).color}>
                      {getSalaryDisplay(player.salary30_31, player.option30_31).text}
                    </span>
                  </td>
                </tr>
              ))}
              
              {/* Empty slots */}
              {Array.from({ length: maxSlots - players.length }).map((_, index) => (
                <tr key={`empty-${index}`} className={(players.length + index) % 2 === 0 ? 'bg-gray-800' : 'bg-gray-700'}>
                  <td className="sticky left-0 bg-inherit px-4 py-2 text-sm text-gray-500 border-r border-gray-600 w-[182px] z-10">
                    <div className="flex items-start gap-3">
                      {/* Empty Photo Placeholder */}
                      <div className="flex-shrink-0 pt-1 pb-1">
                        <div className="h-12 w-12 bg-gray-600 flex items-center justify-center text-gray-400 text-xs font-bold">
                          --
                        </div>
                      </div>
                      
                      {/* Empty Slot Text */}
                      <div className="flex-1 min-w-0 flex items-center">
                        <div className="text-gray-500">Empty Slot</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center text-base text-gray-500 w-24">N/A</td>
                  <td className="px-3 py-3 text-center text-base text-gray-500 w-24">N/A</td>
                  <td className="px-3 py-3 text-center text-base text-gray-500 w-24">N/A</td>
                  <td className="px-3 py-3 text-center text-base text-gray-500 w-24">N/A</td>
                  <td className="px-3 py-3 text-center text-base text-gray-500 w-24">N/A</td>
                  <td className="px-3 py-3 text-center text-base text-gray-500 w-24">N/A</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* History Log Popup */}
      {showHistoryModal && selectedPlayer && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
            <div className="bg-white border-2 border-black shadow-2xl w-80 max-h-96 overflow-hidden">
              <div className="flex justify-between items-center p-3 bg-gray-100 border-b border-black">
                <h3 className="text-sm font-bold text-black">
                History Log - {selectedPlayer.name}
              </h3>
              <button
                onClick={closeHistoryModal}
                  className="text-gray-600 hover:text-black text-lg font-bold"
              >
                ×
              </button>
            </div>
              <div className="p-3 max-h-80 overflow-y-auto">
                <div className="text-black whitespace-pre-wrap text-xs leading-relaxed">
              {selectedPlayer.playerHistoryLog || 'No history log available for this player.'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

