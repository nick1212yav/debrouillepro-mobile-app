export interface DomainEvent {
  type: string;
  moduleId: string;
  payload: any;
  timestamp: number;
}

export type EventHandler = (event: DomainEvent) => void | Promise<void>;
