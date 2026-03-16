export type Team = "Sales" | "AAE" | "CS";

export interface Rep {
  name: string;
  team: Team;
  role: string;
}

export interface Action {
  id: string;
  label: string;
  points: number;
  bonus?: boolean;
}

export interface ARRTier {
  threshold: number;
  label: string;
  prize: string;
}

export interface Deal {
  id: string;
  team: Team;
  rep: string;
  actions: string[];
  points: number;
  arr: number;
  account: string;
  notes: string;
  gong: string;
  isLegacy: boolean;
  date: string;
  sfId?: string; // Salesforce opportunity ID for deduplication
}

export interface FirstCanvas {
  [repName: string]: boolean;
}

export interface Score {
  name: string;
  points: number;
  arr: number;
  deals: number;
  role: string;
}
