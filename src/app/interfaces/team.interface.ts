export interface Staff {
  id: string;
  name: string;
}

export interface Home {
  number: string;
  status?: string;
}

export interface Task {
  id: string;
  number: string;
  status?: string;
  house?: string;
  taskType?: string;
  progressType?: string;
  index?: number | null;
}

export interface LockedTeam {
  id: string;
  name: string;
  members: Staff[];
  homes?: Home[];
  tasks?: Task[];
  isLocked?: boolean;
} 