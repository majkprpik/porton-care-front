export interface CleaningPerson {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  available: boolean;
  currentTask?: string;
} 