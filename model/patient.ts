export interface Patient {
  id: string;
  name: string;
  birthDate: string;
  cpf: string | null;
  cns: string | null;
  phone: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type PatientStatus = "active" | "archived";

export interface PatientListParams {
  search: string;
  status: PatientStatus;
  page: number;
  limit: number;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
