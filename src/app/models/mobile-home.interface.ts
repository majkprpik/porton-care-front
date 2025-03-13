export interface MobileHome {
  // Core properties from house_statuses_view
  house_id: number;
  housename: string;
  housetype: number;
  housetypename: string;
  availabilityid: number;
  availabilityname: string;
  housetasks: HouseTask[];
  status?: MobileHomeStatus;
  number?: string;
  
  // Additional properties from the view
  venueStatuses?: VenueStatus[];
  
  // Add any other properties that exist in your house_statuses_view
  location?: string;
  capacity?: number;
  amenities?: string[];
  lastCleaned?: string;
  nextReservation?: Reservation;
  
  // Flag for tracking if there are active tasks
  hasTasks?: boolean;
}

export interface HouseTask {
  taskId: number;
  endTime: string | null;
  startTime: string;
  taskTypeId: number;
  taskTypeName: string;
  taskProgressTypeId: number;
  taskProgressTypeName: string;
}

// Supporting interfaces based on your view structure
export interface VenueStatus {
  id: string;
  statusType: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export interface Reservation {
  id: string;
  startTime: string;
  endTime: string;
  guestName?: string;
  guestCount?: number;
}

// Update the enum to match your availability names
export enum MobileHomeStatus {
  FREE = 'Free',
  OCCUPIED = 'Occupied',
}