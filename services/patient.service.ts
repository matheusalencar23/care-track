import { api } from "@/lib/api";
import type { Paginated, Patient, PatientListParams } from "@/model/patient";

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
