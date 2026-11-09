import { api } from "@/lib/api";
import type {
  CreateRecordData,
  PatientRecord,
  RecordPage,
  RecordPageParams,
  RecordVersion,
  UpdateRecordData,
  VoidRecordData,
} from "@/model/record";

function recordsPath(patientId: string) {
  return `/patients/${encodeURIComponent(patientId)}/records`;
}

function recordPath(patientId: string, recordId: string) {
  return `${recordsPath(patientId)}/${encodeURIComponent(recordId)}`;
}

export async function updateRecord(
  patientId: string,
  { recordId, content, version, reason }: UpdateRecordData,
): Promise<PatientRecord> {
  const response = await api.put(recordPath(patientId, recordId), {
    content,
    version,
    ...(reason && { reason }),
  });
  return response.data;
}

export async function listRecordVersions(
  patientId: string,
  recordId: string,
): Promise<RecordVersion[]> {
  const response = await api.get(`${recordPath(patientId, recordId)}/versions`);
  return response.data;
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
    `${recordPath(patientId, recordId)}/void`,
    details ? { reason, details } : { reason },
  );
  return response.data;
}
