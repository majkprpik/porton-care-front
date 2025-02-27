import { MobileHomeStatus } from './mobile-home-status.enum';

export interface MobileHome {
  id: string;
  number: string;
  status: MobileHomeStatus;
  date?: string;
}