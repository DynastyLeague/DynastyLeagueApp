'use client';

import { Player } from '@/lib/types';

interface RosterTableProps {
  players: Player[];
  title: string;
  maxSlots: number;
}

export default function RosterTable({ players, title, maxSlots }: RosterTableProps) {
  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold mb-4 text-white">
        {title} ({players.length}/{maxSlots})
      </h2>
      
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="sticky left-0 bg-gray-700 px-4 py-3 text-left text-sm font-medium text-gray-300 border-r border-gray-600">
                  Player Name
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">NBA Team</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Position</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Age</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Rank Type</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Rank Avg</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">25-26</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">26-27</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">27-28</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">28-29</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">29-30</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">30-31</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">31-32</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Contract Year</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Signed Via</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Contract Notes</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Option</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Accept/Decline</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Ext Elig</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-600">
              {players.map((player, index) => (
                <tr key={player.playerId} className={index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750'}>
                  <td className="sticky left-0 bg-inherit px-4 py-3 text-sm text-white font-medium border-r border-gray-600">
                    {player.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">{player.nbaTeam}</td>
                  <td className="px-4 py-3 text-sm text-gray-300">{player.position}</td>
                  <td className="px-4 py-3 text-sm text-gray-300">{player.age}</td>
                  <td className="px-4 py-3 text-sm text-gray-300">{player.rankType}</td>
                  <td className="px-4 py-3 text-sm text-gray-300">{player.rankAvg}</td>
                  <td className="px-4 py-3 text-sm text-gray-300">${player.contractYears["25-26"]}M</td>
                  <td className="px-4 py-3 text-sm text-gray-300">${player.contractYears["26-27"]}M</td>
                  <td className="px-4 py-3 text-sm text-gray-300">${player.contractYears["27-28"]}M</td>
                  <td className="px-4 py-3 text-sm text-gray-300">${player.contractYears["28-29"]}M</td>
                  <td className="px-4 py-3 text-sm text-gray-300">${player.contractYears["29-30"]}M</td>
                  <td className="px-4 py-3 text-sm text-gray-300">${player.contractYears["30-31"]}M</td>
                  <td className="px-4 py-3 text-sm text-gray-300">${player.contractYears["31-32"]}M</td>
                  <td className="px-4 py-3 text-sm text-gray-300">{player.contractYear}</td>
                  <td className="px-4 py-3 text-sm text-gray-300">{player.signedVia}</td>
                  <td className="px-4 py-3 text-sm text-gray-300">{player.contractNotes}</td>
                  <td className="px-4 py-3 text-sm text-gray-300">{player.option}</td>
                  <td className="px-4 py-3 text-sm text-gray-300">{player.acceptDecline}</td>
                  <td className="px-4 py-3 text-sm text-gray-300">{player.extElig}</td>
                </tr>
              ))}
              
              {/* Empty slots */}
              {Array.from({ length: maxSlots - players.length }).map((_, index) => (
                <tr key={`empty-${index}`} className={(players.length + index) % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750'}>
                  <td className="sticky left-0 bg-inherit px-4 py-3 text-sm text-gray-500 border-r border-gray-600">
                    Empty Slot
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">-</td>
                  <td className="px-4 py-3 text-sm text-gray-500">-</td>
                  <td className="px-4 py-3 text-sm text-gray-500">-</td>
                  <td className="px-4 py-3 text-sm text-gray-500">-</td>
                  <td className="px-4 py-3 text-sm text-gray-500">-</td>
                  <td className="px-4 py-3 text-sm text-gray-500">-</td>
                  <td className="px-4 py-3 text-sm text-gray-500">-</td>
                  <td className="px-4 py-3 text-sm text-gray-500">-</td>
                  <td className="px-4 py-3 text-sm text-gray-500">-</td>
                  <td className="px-4 py-3 text-sm text-gray-500">-</td>
                  <td className="px-4 py-3 text-sm text-gray-500">-</td>
                  <td className="px-4 py-3 text-sm text-gray-500">-</td>
                  <td className="px-4 py-3 text-sm text-gray-500">-</td>
                  <td className="px-4 py-3 text-sm text-gray-500">-</td>
                  <td className="px-4 py-3 text-sm text-gray-500">-</td>
                  <td className="px-4 py-3 text-sm text-gray-500">-</td>
                  <td className="px-4 py-3 text-sm text-gray-500">-</td>
                  <td className="px-4 py-3 text-sm text-gray-500">-</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

