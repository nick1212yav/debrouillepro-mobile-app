export interface Host {
  id: string;
  name: string;
  avatar?: string;
  verified: boolean;
  rating?: number;
  reviewsCount?: number;
  responseRate?: number;
  joinedDate?: string;
  description?: string;
  languages?: string[];
}
