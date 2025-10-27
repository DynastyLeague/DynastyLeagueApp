import { RosterPlayer } from "@/lib/types";

export default function PlayerCard({ p }: { p: RosterPlayer }) {
  const latest = p.contract?.[0];
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold">{p.name}</div>
          <div className="text-xs text-gray-400">{p.team} • {p.pos}</div>
        </div>
        <span className="text-xs rounded-full px-2 py-0.5 border border-gray-700">
          {p.slot === "ACTIVE" ? "Active" : "Dev"}
        </span>
      </div>
      {latest && (
        <div className="mt-2 text-sm text-gray-300">
          Contract: {latest.season} • ${latest.salary.toFixed(2)}
        </div>
      )}
    </div>
  );
}
