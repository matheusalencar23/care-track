import type { PatientListParams } from "@/model/patient";

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
  },
};
