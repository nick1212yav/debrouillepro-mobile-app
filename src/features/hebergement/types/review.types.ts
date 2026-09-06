export interface Review {
  id: string;
  authorName: string;
  authorAvatar?: string;
  rating: number;
  date: string;
  text: string;
  photos?: string[];
  accommodationId?: string;
}
