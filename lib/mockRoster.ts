import { RosterPlayer } from "./types";

export const mockRoster: RosterPlayer[] = [
  {
    playerId: "tatum",
    name: "Jayson Tatum",
    pos: "F",
    team: "BOS",
    slot: "ACTIVE",
    contract: [{ season: 2025, salary: 12.5, yearsRemaining: 3 }],
  },
  {
    playerId: "wemby",
    name: "Victor Wembanyama",
    pos: "F/C",
    team: "SAS",
    slot: "DEV",
    contract: [{ season: 2025, salary: 8.2, yearsRemaining: 4 }],
  },
];
