export enum MobileHomeStatus {
  READY = 'green',      // Ready for check-in
  IN_PROGRESS = 'yellow',  // Cleaning/maintenance in progress
  URGENT = 'red',       // Requires immediate attention
  OCCUPIED = 'black',   // Currently occupied
  PENDING = 'orange',    // Waiting for inspection/approval
  FREE = 'green'
} 