import { api } from "@/lib/api";
import type {
  Paginated,
  Patient,
  PatientData,
  PatientListParams,
} from "@/model/patient";

export async function listPatients({
  search,
  status,
  page,
  limit,
}: PatientListParams): Promise<Paginated<Patient>> {
  const response = await api.get("/patients", {
    params: { search: search || undefined, status, page, limit },
  });
  return response.data;
}

export async function createPatient(data: PatientData): Promise<Patient> {
  const response = await api.post("/patients", data);
  return response.data;
}

export async function getPatient(id: string): Promise<Patient> {
  const response = await api.get(`/patients/${encodeURIComponent(id)}`);
  return response.data;
}
