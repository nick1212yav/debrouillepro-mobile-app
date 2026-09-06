export interface BedConfig {
  type: string;
  count: number;
}

export interface RoomLayout {
  id: string;
  name: string;
  beds: BedConfig[];
}
