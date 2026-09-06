export interface KeyValuePair<T = any> {
  key: string;
  value: T;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface DateRange {
  startDate: string;
  endDate: string;
}
