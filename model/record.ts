export const RECORD_CONTENT_MAX_LENGTH = 20_000;

export const RECORD_REASON_MAX_LENGTH = 500;

export const RECORD_VOID_REASONS = ["wrong_patient", "duplicate", "other"] as const;

export type RecordVoidReason = (typeof RECORD_VOID_REASONS)[number];

export type RecordStatus = "active" | "voided";

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
  status: RecordStatus;
  cursor?: string;
  limit: number;
}

export interface CreateRecordData {
  content: string;
}

export interface UpdateRecordData {
  recordId: string;
  content: string;
  version: number;
  reason?: string;
}

export interface RecordVersion {
  version: number;
  content: string | null;
  reason: string | null;
  author: RecordAuthor;
  createdAt: string;
}

export interface VoidRecordData {
  recordId: string;
  reason: RecordVoidReason;
  details?: string;
}
