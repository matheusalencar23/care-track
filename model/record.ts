export const RECORD_CONTENT_MAX_LENGTH = 20_000;

export type RecordVoidReason = "wrong_patient" | "duplicate" | "other";

export interface RecordAuthor {
  id: string;
  name: string;
  coren: string;
  corenState: string;
}

export interface RecordAttachment {
  id: string;
  patientId: string;
  recordId: string | null;
  fileName: string;
  contentType: string;
  size: number;
  sha256: string;
  createdAt: string;
}

export interface PatientRecord {
  id: string;
  patientId: string;
  content: string | null;
  version: number;
  author: RecordAuthor;
  createdAt: string;
  editedAt: string | null;
  voidedAt: string | null;
  voidReason: RecordVoidReason | null;
  voidReasonDetails: string | null;
  attachments: RecordAttachment[];
}

export interface RecordPage {
  items: PatientRecord[];
  nextCursor: string | null;
}

export interface RecordPageParams {
  cursor?: string;
  limit: number;
}

export interface CreateRecordData {
  content: string;
}
