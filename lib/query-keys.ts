import type { AttachmentDisposition } from "@/model/attachment";
import type { PatientListParams } from "@/model/patient";
import type { RecordStatus } from "@/model/record";

export const queryKeys = {
  auth: {
    me: ["auth", "me"] as const,
  },
  patients: {
    all: ["patients"] as const,
    lists: ["patients", "list"] as const,
    list: (params: PatientListParams) =>
      ["patients", "list", params] as const,
    detail: (id: string) => ["patients", "detail", id] as const,
    consents: (id: string) => ["patients", "consents", id] as const,
    allRecords: (id: string) => ["patients", "records", id] as const,
    records: (id: string, status: RecordStatus) =>
      ["patients", "records", id, status] as const,
    recordVersions: (id: string, recordId: string) =>
      ["patients", "records", id, "versions", recordId] as const,
    attachmentList: (id: string) => ["patients", "attachment-list", id] as const,
    attachmentDownload: (
      id: string,
      attachmentId: string,
      disposition: AttachmentDisposition,
    ) =>
      ["patients", "attachments", id, "download", attachmentId, disposition] as const,
  },
};
