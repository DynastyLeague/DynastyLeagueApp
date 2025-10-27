export type Contract = {
    season: number;
    salary: number;
    yearsRemaining?: number;
  };

export type Team = {
  teamId: string;
  teamName: string;
  mainLogo: string;
  wordLogo: string;
  email: string;
  password: string;
  established?: string;
  conference?: string;
  manager?: string;
  record?: string;
  playoffs?: string;
  conferenceTitles?: string;
  championships?: string;
};

export type Player = {
  // Core player info
  playerId: string;
  name: string;
  teamId: string;
  dynastyTeam: string;
  rosterStatus: "ACTIVE" | "DEVELOPMENT" | "INJURY";
  nbaTeam: string;
  position: string;
  birthDate: string;
  age: number;
  drafted: string;
  signedVia: string;
  year: string;
  contractLength: string;
  contractNotes: string;
  extension: string;
  awards: string;
  playerHistoryLog: string;
  
  // Rankings
  rankType: string;
  twoYearRank: string;
  careerRank: string;
  rank21_22: string;
  rank22_23: string;
  rank23_24: string;
  rank24_25: string;
  rank25_26: string;
  rank26_27: string;
  rank27_28: string;
  rank28_29: string;
  careerEarnings: string;
  
  // Salaries (can be numbers or contract status strings like "EXT/UFA", "RFA", "UFA")
  salary21_22: number | string;
  salary22_23: number | string;
  salary23_24: number | string;
  salary24_25: number | string;
  salary25_26: number | string; // This is what we'll sort by
  option25_26: string;
  salary26_27: number | string;
  option26_27: string;
  salary27_28: number | string;
  option27_28: string;
  salary28_29: number | string;
  option28_29: string;
  salary29_30: number | string;
  option29_30: string;
  salary30_31: number | string;
  option30_31: string;
  salary31_32: number | string;
  option31_32: string;
  salary32_33: number | string;
  option32_33: string;
  salary33_34: number | string;
  option33_34: string;
  salary34_35: number | string;
  option34_35: string;
  photo: string;
};

export type RosterPlayer = {
  playerId: string;
  name: string;
  pos: string;
  team: string;
  slot: "ACTIVE" | "DEV" | "INJURY";
  contract: Contract[];
};

export type Matchup = {
  week: number;
  matchupId: string;
  team1Id: string;
  team1Name: string;
  team2Id: string;
  team2Name: string;
  team1Score: number;
  team1Gp: number;
  team1Pts: number;
  team13pm: number;
  team1Ast: number;
  team1Stl: number;
  team1Blk: number;
  team1Orb: number;
  team1Drb: number;
  team1Fgm: number;
  team1Fga: number;
  team1FgPercent: number;
  team1Ftm: number;
  team1Fta: number;
  team1FtPercent: number;
  team2Score: number;
  team2Gp: number;
  team2Pts: number;
  team23pm: number;
  team2Ast: number;
  team2Stl: number;
  team2Blk: number;
  team2Orb: number;
  team2Drb: number;
  team2Fgm: number;
  team2Fga: number;
  team2FgPercent: number;
  team2Ftm: number;
  team2Fta: number;
  team2FtPercent: number;
};

export type WeekDate = {
  week: number;
  startDate: string;
  finishDate: string;
};

export type Game = {
  week: number;
  nbaTeam: string;
  date: string;
  opponent: string;
  homeAway: string;
};

export type Selection = {
  week: number;
  matchupId: string;
  teamId: string;
  teamName: string;
  opponentTeamName: string;
  position: string;
  playerId: string;
  playerName: string;
  photoUrl?: string;
  nbaTeam: string;
  gameDate: string;
  nbaOpposition: string;
  selectedGame?: string;
  submittedDateTime: string;
  dateCode: string;
  time: string;
  min: number;
  pts: number;
  threePm: number;
  ast: number;
  stl: number;
  blk: number;
  orb: number;
  drb: number;
  fgm: number;
  fga: number;
  fgPercent: number;
  ftm: number;
  fta: number;
  ftPercent: number;
};

export type LineupSlot = {
  id: string;
  name: string;
  position: string;
  playerId?: string;
  gameId?: string;
};
  