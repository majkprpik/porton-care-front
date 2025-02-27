export interface Staff {
  id: string;
  name: string;
}

export interface Home {
  number: string;
  status?: string;
}

export interface LockedTeam {
  id: string;
  name: string;
  members: Staff[];
  homes: Home[];
} 