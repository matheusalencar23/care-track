import { api } from "@/lib/api";
import type {
  CreateRecordData,
  PatientRecord,
  RecordPage,
  RecordPageParams,
} from "@/model/record";

function recordsPath(patientId: string) {
  return `/patients/${encodeURIComponent(patientId)}/records`;
}

export async function listRecords(
  patientId: string,
  params: RecordPageParams,
): Promise<RecordPage> {
  const response = await api.get(recordsPath(patientId), { params });
  return response.data;
}

export async function createRecord(
  patientId: string,
  data: CreateRecordData,
): Promise<PatientRecord> {
  const response = await api.post(recordsPath(patientId), data);
  return response.data;
}
