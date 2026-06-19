export type Role =
  | "student"
  | "driver"
  | "assistant"
  | "coordinator"
  | "admin"
  | "university_admin";

export interface BusStop {
  id: string | number;
  name: string;
  code?: string;
  address?: string;
  lat: number;
  lng: number;
  routes?: Array<string | number>;
  hasShelter?: boolean;
}

export interface Route {
  id: string | number;
  code?: string;
  name: string;
  color?: string;
  stops?: Array<string | number>;
}
