import { api } from "@/lib/api";
import type {
  CreateRecordData,
  PatientRecord,
  RecordPage,
  RecordPageParams,
  VoidRecordData,
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

export async function voidRecord(
  patientId: string,
  { recordId, reason, details }: VoidRecordData,
): Promise<PatientRecord> {
  const response = await api.post(
    `${recordsPath(patientId)}/${encodeURIComponent(recordId)}/void`,
    details ? { reason, details } : { reason },
  );
  return response.data;
}
