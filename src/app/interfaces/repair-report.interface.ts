export enum RepairStatus {
  OPENED = 'opened',
  SEEN = 'seen',
  REPAIRED = 'repaired',
  NEEDS_TIME = 'needs_time',
  NEEDS_CONSULTING = 'needs_consulting'
}

export interface RepairReport {
  id?: string;
  description: string;
  location: string;
  status: RepairStatus;
  createdAt: Date;
  updatedAt?: Date;
  createdBy: string;
} 