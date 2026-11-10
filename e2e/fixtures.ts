import { test as base, type BrowserContext, type Page, type Route } from "@playwright/test";

export const nurse = {
  name: "Ana Souza",
  email: "ana@exemplo.com",
  password: "senha-segura",
  coren: "123456",
  corenState: "SP",
};

export interface FakePatient {
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

export function fakePatient(overrides: Partial<FakePatient> & Pick<FakePatient, "id" | "name">): FakePatient {
  return {
    birthDate: "1950-03-15",
    cpf: null,
    cns: null,
    phone: null,
    archivedAt: null,
    createdAt: "2026-01-01T12:00:00.000Z",
    updatedAt: "2026-01-01T12:00:00.000Z",
    ...overrides,
  };
}

export const defaultPatients: FakePatient[] = [
  fakePatient({ id: "0b6f1c2a-1111-4000-8000-000000000001", name: "José Antônio Pereira", cpf: "52998224725" }),
  fakePatient({ id: "0b6f1c2a-1111-4000-8000-000000000002", name: "Maria das Dores", birthDate: "1962-08-20", cns: "898001160660004" }),
  fakePatient({
    id: "0b6f1c2a-1111-4000-8000-000000000003",
    name: "Benedita Ramos",
    birthDate: "1938-12-02",
    archivedAt: "2026-10-01T12:00:00.000Z",
  }),
];

export interface FakeConsent {
  id: string;
  patientId: string;
  type: string;
  method: string;
  grantor: string;
  representativeName: string | null;
  collectedAt: string;
  status: "active" | "revoked";
  needsRenewal?: boolean;
  revokedAt: string | null;
  revocationReason: string | null;
  createdAt: string;
}

export interface FakeRecord {
  id: string;
  patientId: string;
  content: string | null;
  version: number;
  author: { id: string; name: string; coren: string; corenState: string };
  createdAt: string;
  editedAt: string | null;
  voidedAt: string | null;
  voidReason: string | null;
  voidReasonDetails: string | null;
  attachments: FakeAttachment[];
}

export interface FakeAttachment {
  id: string;
  patientId: string;
  recordId: string | null;
  fileName: string;
  contentType: string;
  size: number;
  sha256: string;
  createdAt: string;
}

export const STORAGE_ORIGIN = "https://storage.e2e.test";

const tinyPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

const extensionTypes: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  pdf: "application/pdf",
  mp4: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
};

export function fakeAttachment(
  overrides: Partial<FakeAttachment> & Pick<FakeAttachment, "id" | "patientId" | "fileName">,
): FakeAttachment {
  const extension = overrides.fileName.split(".").pop()?.toLowerCase() ?? "";

  return {
    recordId: null,
    contentType: extensionTypes[extension] ?? "application/pdf",
    size: tinyPng.length,
    sha256: "e2e",
    createdAt: "2026-11-01T12:00:00.000Z",
    ...overrides,
  };
}

function isMedia(contentType: string) {
  return contentType.startsWith("image/") || contentType.startsWith("video/");
}

const consentRequired = {
  status: 409,
  json: {
    code: "ATTACHMENT_CONSENT_REQUIRED",
    message: "Enviar ou abrir fotos e vídeos exige um consentimento de uso de imagem ativo para o paciente.",
  },
};

export interface FakeRecordVersion {
  version: number;
  content: string | null;
  reason: string | null;
  author: FakeRecord["author"];
  createdAt: string;
}

const fakeAuthor = { id: "0b6f1c2a-7777-4000-8000-000000000001", name: nurse.name, coren: nurse.coren, corenState: nurse.corenState };

export function fakeRecord(overrides: Partial<FakeRecord> & Pick<FakeRecord, "id" | "patientId">): FakeRecord {
  return {
    content: "Registro de teste",
    version: 1,
    author: fakeAuthor,
    createdAt: "2026-11-01T12:00:00.000Z",
    editedAt: null,
    voidedAt: null,
    voidReason: null,
    voidReasonDetails: null,
    attachments: [],
    ...overrides,
  };
}

const SESSION_IDLE_MS = 30 * 60 * 1000;

function withoutAccents(value: string) {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

interface ApiOptions {
  signedIn?: boolean;
  meStatus?: number;
  patients?: FakePatient[];
  patientsStatus?: number;
  consents?: FakeConsent[];
  records?: FakeRecord[];
}

export class FakeApi {
  signedIn: boolean;
  meStatus?: number;
  patients: FakePatient[];
  patientsStatus?: number;
  readonly calls: string[] = [];
  readonly patientQueries: URLSearchParams[] = [];
  readonly createdPatients: unknown[] = [];
  readonly updatedPatients: unknown[] = [];
  readonly grantedConsents: unknown[] = [];
  readonly revocations: unknown[] = [];
  consents: FakeConsent[] = [];
  records: FakeRecord[] = [];
  readonly createdRecords: unknown[] = [];
  readonly voidedRecords: unknown[] = [];
  readonly updatedRecords: unknown[] = [];
  readonly recordVersions = new Map<string, FakeRecordVersion[]>();
  readonly signupBodies: unknown[] = [];
  attachments: FakeAttachment[] = [];

  constructor(
    private readonly page: Page,
    private readonly context: BrowserContext,
    options: ApiOptions,
  ) {
    this.signedIn = options.signedIn ?? false;
    this.meStatus = options.meStatus;
    this.patients = options.patients ?? defaultPatients;
    this.patientsStatus = options.patientsStatus;
    this.consents = options.consents ?? [];
    this.records = options.records ?? [];
  }

  async install() {
    if (this.signedIn) {
      await this.setCookie();
    }

    await this.page.route("**/api/v1/**", (route) => this.handle(route));
    await this.page.route(`${STORAGE_ORIGIN}/**`, (route) => {
      this.calls.push(`STORAGE ${new URL(route.request().url()).pathname}`);
      return route.fulfill({ body: tinyPng, contentType: "image/png" });
    });
  }

  count(call: string) {
    return this.calls.filter((item) => item === call).length;
  }

  private async setCookie() {
    await this.context.addCookies([
      { name: "token", value: "e2e", url: "http://localhost:3100", httpOnly: true, sameSite: "Strict" },
    ]);
  }

  private sessionHeaders() {
    const now = Date.now();

    return {
      "x-session-expires-at": new Date(now + SESSION_IDLE_MS).toISOString(),
      date: new Date(now).toUTCString(),
    };
  }

  private async handle(route: Route) {
    const request = route.request();
    const path = new URL(request.url()).pathname.replace("/api/v1", "");
    const call = `${request.method()} ${path}`;
    this.calls.push(call);

    if (call === "GET /auth/me") {
      const status = this.meStatus ?? (this.signedIn ? 200 : 401);

      if (status === 200) {
        return route.fulfill({
          json: { ...nurse, password: undefined, sessionExpiresAt: this.sessionHeaders()["x-session-expires-at"] },
          headers: this.sessionHeaders(),
        });
      }

      return route.fulfill({
        status,
        json: status === 401
          ? { code: "UNAUTHORIZED", message: "Sessão inválida ou expirada. Faça login novamente." }
          : { code: "INTERNAL_SERVER_ERROR", message: "Ocorreu um erro inesperado." },
        headers: { "x-request-id": "req-e2e-1" },
      });
    }

    if (call === "GET /patients") {
      return this.listPatients(route, new URL(request.url()).searchParams);
    }

    if (call === "POST /patients") {
      return this.createPatient(route, request.postDataJSON());
    }

    const patientMatch = /^GET \/patients\/([^/]+)$/.exec(call);

    if (patientMatch) {
      return this.getPatient(route, decodeURIComponent(patientMatch[1]));
    }

    const consentsMatch = /^(GET|POST) \/patients\/([^/]+)\/consents$/.exec(call);

    if (consentsMatch) {
      const patientId = decodeURIComponent(consentsMatch[2]);

      return consentsMatch[1] === "GET"
        ? route.fulfill({
            json: this.consents.filter((consent) => consent.patientId === patientId),
            headers: this.sessionHeaders(),
          })
        : this.grantConsent(route, patientId, request.postDataJSON());
    }

    const revokeMatch = /^POST \/patients\/([^/]+)\/consents\/([^/]+)\/revoke$/.exec(call);

    if (revokeMatch) {
      return this.revokeConsent(route, decodeURIComponent(revokeMatch[2]), request.postDataJSON());
    }

    const recordsMatch = /^(GET|POST) \/patients\/([^/]+)\/records$/.exec(call);

    if (recordsMatch) {
      const patientId = decodeURIComponent(recordsMatch[2]);

      return recordsMatch[1] === "GET"
        ? this.listRecords(route, patientId, new URL(request.url()).searchParams)
        : this.createRecord(route, patientId, request.postDataJSON());
    }

    const updateRecordMatch = /^PUT \/patients\/([^/]+)\/records\/([^/]+)$/.exec(call);

    if (updateRecordMatch) {
      return this.updateRecord(
        route,
        decodeURIComponent(updateRecordMatch[1]),
        decodeURIComponent(updateRecordMatch[2]),
        request.postDataJSON(),
      );
    }

    const versionsMatch = /^GET \/patients\/([^/]+)\/records\/([^/]+)\/versions$/.exec(call);

    if (versionsMatch) {
      const record = this.records.find((item) => item.id === decodeURIComponent(versionsMatch[2]));

      return record
        ? route.fulfill({ json: this.versionsOf(record).toReversed(), headers: this.sessionHeaders() })
        : route.fulfill({ status: 404, json: { code: "RECORD_NOT_FOUND", message: "Registro não encontrado!" } });
    }

    const voidMatch = /^POST \/patients\/([^/]+)\/records\/([^/]+)\/void$/.exec(call);

    if (voidMatch) {
      return this.voidRecord(route, decodeURIComponent(voidMatch[2]), request.postDataJSON());
    }

    const uploadMatch = /^POST \/patients\/([^/]+)\/attachments$/.exec(call);

    if (uploadMatch) {
      return this.uploadAttachment(route, decodeURIComponent(uploadMatch[1]), request.postDataBuffer());
    }

    const downloadMatch = /^GET \/patients\/([^/]+)\/attachments\/([^/]+)\/download$/.exec(call);

    if (downloadMatch) {
      return this.downloadAttachment(route, decodeURIComponent(downloadMatch[1]), decodeURIComponent(downloadMatch[2]));
    }

    const archiveMatch = /^POST \/patients\/([^/]+)\/(archive|unarchive)$/.exec(call);

    if (archiveMatch) {
      return this.setArchived(route, decodeURIComponent(archiveMatch[1]), archiveMatch[2] === "archive");
    }

    const updateMatch = /^PUT \/patients\/([^/]+)$/.exec(call);

    if (updateMatch) {
      return this.updatePatient(route, decodeURIComponent(updateMatch[1]), request.postDataJSON());
    }

    if (call === "POST /auth/signin") {
      const body = request.postDataJSON() as { email: string; password: string };

      if (body.email !== nurse.email || body.password !== nurse.password) {
        return route.fulfill({
          status: 400,
          json: { code: "INVALID_CREDENTIALS", message: "Credenciais inválidas!" },
        });
      }

      this.signedIn = true;
      await this.setCookie();

      return route.fulfill({ json: { message: "ok" }, headers: this.sessionHeaders() });
    }

    if (call === "POST /users/signup") {
      this.signupBodies.push(request.postDataJSON());

      return route.fulfill({ status: 201, json: {} });
    }

    if (call === "POST /auth/signout") {
      this.signedIn = false;
      await this.context.clearCookies();

      return route.fulfill({ status: 204 });
    }

    return route.fulfill({ status: 404, json: { code: "NOT_FOUND", message: "Rota não simulada" } });
  }

  private getPatient(route: Route, id: string) {
    if (!/^[0-9a-f-]{36}$/.test(id)) {
      return route.fulfill({
        status: 422,
        json: {
          code: "VALIDATION_FAILED",
          message: "Dados inválidos. Verifique os campos e tente novamente.",
          errors: [{ location: "params", path: "id", message: "ID de paciente inválido" }],
        },
      });
    }

    const patient = this.patients.find((item) => item.id === id);

    if (!patient) {
      return route.fulfill({ status: 404, json: { code: "PATIENT_NOT_FOUND", message: "Paciente não encontrado!" } });
    }

    return route.fulfill({ json: patient, headers: this.sessionHeaders() });
  }

  private listRecords(route: Route, patientId: string, query: URLSearchParams) {
    const limit = Number(query.get("limit") ?? 20);
    const cursor = query.get("cursor");
    const voided = query.get("status") === "voided";
    const matches = this.records.filter(
      (record) => record.patientId === patientId && Boolean(record.voidedAt) === voided,
    );
    const start = cursor ? matches.findIndex((record) => record.id === cursor) + 1 : 0;
    const items = matches.slice(start, start + limit);
    const hasMore = start + limit < matches.length;

    return route.fulfill({
      json: { items, nextCursor: hasMore ? (items.at(-1)?.id ?? null) : null },
      headers: this.sessionHeaders(),
    });
  }

  hasImageConsent(patientId: string) {
    return this.consents.some(
      (consent) => consent.patientId === patientId && consent.status === "active" && !consent.needsRenewal,
    );
  }

  private uploadAttachment(route: Route, patientId: string, body: Buffer | null) {
    const fileName = /filename="([^"]+)"/.exec(body?.toString("utf8") ?? "")?.[1];

    if (!fileName) {
      return route.fulfill({
        status: 422,
        json: {
          code: "VALIDATION_FAILED",
          message: "Dados inválidos.",
          errors: [{ location: "body", path: "file", message: "O arquivo é obrigatório" }],
        },
      });
    }

    if (this.patients.find((item) => item.id === patientId)?.archivedAt) {
      return route.fulfill({
        status: 409,
        json: { code: "PATIENT_ARCHIVED", message: "Este paciente está arquivado. Reative-o para alterar os dados." },
      });
    }

    const attachment = fakeAttachment({
      id: `0b6f1c2a-aaaa-4000-8000-${String(this.attachments.length).padStart(12, "0")}`,
      patientId,
      fileName,
      createdAt: new Date().toISOString(),
    });

    if (isMedia(attachment.contentType) && !this.hasImageConsent(patientId)) {
      return route.fulfill(consentRequired);
    }

    this.attachments = [...this.attachments, attachment];

    return route.fulfill({ status: 201, json: attachment, headers: this.sessionHeaders() });
  }

  private downloadAttachment(route: Route, patientId: string, attachmentId: string) {
    const attachment =
      this.attachments.find((item) => item.id === attachmentId) ??
      this.records.flatMap((record) => record.attachments).find((item) => item.id === attachmentId);

    if (!attachment) {
      return route.fulfill({ status: 404, json: { code: "ATTACHMENT_NOT_FOUND", message: "Anexo não encontrado!" } });
    }

    if (isMedia(attachment.contentType) && !this.hasImageConsent(patientId)) {
      return route.fulfill(consentRequired);
    }

    return route.fulfill({
      json: {
        ...attachment,
        downloadUrl: `${STORAGE_ORIGIN}/${attachment.id}`,
        downloadUrlExpiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      },
      headers: this.sessionHeaders(),
    });
  }

  private createRecord(route: Route, patientId: string, body: { content?: string; attachmentIds?: string[] }) {
    this.createdRecords.push(body);
    const patient = this.patients.find((item) => item.id === patientId);

    if (patient?.archivedAt) {
      return route.fulfill({
        status: 409,
        json: { code: "PATIENT_ARCHIVED", message: "Este paciente está arquivado. Reative-o para alterar os dados." },
      });
    }

    const recordId = `0b6f1c2a-6666-4000-8000-${String(this.records.length).padStart(12, "0")}`;
    const linked = (body.attachmentIds ?? []).map((id) => {
      const attachment = this.attachments.find((item) => item.id === id && !item.recordId);

      return attachment ? { ...attachment, recordId } : null;
    });

    if (linked.includes(null)) {
      return route.fulfill({
        status: 409,
        json: { code: "ATTACHMENT_NOT_AVAILABLE", message: "Um dos anexos informados não está disponível para este registro." },
      });
    }

    const attachments = linked as FakeAttachment[];
    this.attachments = this.attachments.map(
      (item) => attachments.find((attachment) => attachment.id === item.id) ?? item,
    );

    const record = fakeRecord({
      id: recordId,
      patientId,
      content: body.content ?? null,
      createdAt: new Date().toISOString(),
      attachments,
    });
    this.records = [record, ...this.records];

    return route.fulfill({ status: 201, json: record, headers: this.sessionHeaders() });
  }

  private versionsOf(record: FakeRecord) {
    const versions = this.recordVersions.get(record.id) ?? [
      { version: 1, content: record.content, reason: null, author: record.author, createdAt: record.createdAt },
    ];
    this.recordVersions.set(record.id, versions);

    return versions;
  }

  editRecordElsewhere(recordId: string, content: string) {
    const current = this.records.find((record) => record.id === recordId);

    if (current) {
      this.saveRecordVersion(current, content, null);
    }
  }

  private saveRecordVersion(current: FakeRecord, content: string, reason: string | null) {
    const now = new Date().toISOString();
    const version = current.version + 1;
    this.versionsOf(current).push({ version, content, reason, author: current.author, createdAt: now });
    const updated: FakeRecord = { ...current, content, version, editedAt: now };
    this.records = this.records.map((record) => (record.id === current.id ? updated : record));

    return updated;
  }

  private updateRecord(
    route: Route,
    patientId: string,
    recordId: string,
    body: { content: string; version: number; reason?: string },
  ) {
    this.updatedRecords.push(body);
    const current = this.records.find((record) => record.id === recordId);

    if (!current) {
      return route.fulfill({ status: 404, json: { code: "RECORD_NOT_FOUND", message: "Registro não encontrado!" } });
    }

    if (this.patients.find((patient) => patient.id === patientId)?.archivedAt) {
      return route.fulfill({
        status: 409,
        json: { code: "PATIENT_ARCHIVED", message: "Este paciente está arquivado. Reative-o para alterar os dados." },
      });
    }

    if (current.voidedAt) {
      return route.fulfill({ status: 409, json: { code: "RECORD_VOIDED", message: "Este registro foi anulado e não pode ser alterado." } });
    }

    if (current.version !== body.version) {
      return route.fulfill({
        status: 409,
        json: {
          code: "RECORD_VERSION_OUTDATED",
          message: "Este registro foi alterado depois que você o abriu. Recarregue-o e tente novamente.",
        },
      });
    }

    if (current.content === body.content) {
      return route.fulfill({
        status: 422,
        json: {
          code: "RECORD_CONTENT_UNCHANGED",
          message: "O conteúdo informado é igual ao da versão atual do registro.",
          errors: [],
        },
      });
    }

    const updated = this.saveRecordVersion(current, body.content, body.reason ?? null);

    return route.fulfill({ json: updated, headers: this.sessionHeaders() });
  }

  private voidRecord(route: Route, recordId: string, body: { reason: string; details?: string }) {
    this.voidedRecords.push(body);
    const current = this.records.find((record) => record.id === recordId);

    if (!current) {
      return route.fulfill({ status: 404, json: { code: "RECORD_NOT_FOUND", message: "Registro não encontrado!" } });
    }

    if (current.voidedAt) {
      return route.fulfill({ status: 409, json: { code: "RECORD_ALREADY_VOIDED", message: "Este registro já foi anulado." } });
    }

    const voided: FakeRecord = {
      ...current,
      voidedAt: new Date().toISOString(),
      voidReason: body.reason,
      voidReasonDetails: body.details ?? null,
    };
    this.records = this.records.map((record) => (record.id === recordId ? voided : record));

    return route.fulfill({ json: voided, headers: this.sessionHeaders() });
  }

  private grantConsent(route: Route, patientId: string, body: Partial<FakeConsent>) {
    this.grantedConsents.push(body);
    const patient = this.patients.find((item) => item.id === patientId);

    if (patient?.archivedAt) {
      return route.fulfill({
        status: 409,
        json: { code: "PATIENT_ARCHIVED", message: "Este paciente está arquivado. Reative-o para alterar os dados." },
      });
    }

    if (this.consents.some((consent) => consent.patientId === patientId && consent.status === "active")) {
      return route.fulfill({
        status: 409,
        json: { code: "CONSENT_ALREADY_ACTIVE", message: "Já existe um consentimento ativo deste tipo para o paciente." },
      });
    }

    const now = new Date().toISOString();
    const consent: FakeConsent = {
      id: `0b6f1c2a-4444-4000-8000-${String(this.consents.length).padStart(12, "0")}`,
      patientId,
      type: body.type ?? "image_capture",
      method: body.method ?? "written",
      grantor: body.grantor ?? "patient",
      representativeName: body.representativeName ?? null,
      collectedAt: body.collectedAt ?? now,
      status: "active",
      needsRenewal: false,
      revokedAt: null,
      revocationReason: null,
      createdAt: now,
    };
    this.consents = [consent, ...this.consents];

    return route.fulfill({ status: 201, json: consent, headers: this.sessionHeaders() });
  }

  private revokeConsent(route: Route, consentId: string, body: { reason?: string }) {
    this.revocations.push(body);
    const current = this.consents.find((consent) => consent.id === consentId);

    if (!current) {
      return route.fulfill({ status: 404, json: { code: "CONSENT_NOT_FOUND", message: "Consentimento não encontrado!" } });
    }

    const revoked: FakeConsent = {
      ...current,
      status: "revoked",
      revokedAt: new Date().toISOString(),
      revocationReason: body.reason ?? null,
    };
    this.consents = this.consents.map((consent) => (consent.id === consentId ? revoked : consent));

    return route.fulfill({ json: revoked, headers: this.sessionHeaders() });
  }

  private setArchived(route: Route, id: string, archive: boolean) {
    const current = this.patients.find((patient) => patient.id === id);

    if (!current) {
      return route.fulfill({ status: 404, json: { code: "PATIENT_NOT_FOUND", message: "Paciente não encontrado!" } });
    }

    if (Boolean(current.archivedAt) === archive) {
      return route.fulfill({
        status: 409,
        json: archive
          ? { code: "PATIENT_ALREADY_ARCHIVED", message: "Este paciente já está arquivado." }
          : { code: "PATIENT_NOT_ARCHIVED", message: "Este paciente não está arquivado." },
      });
    }

    const updated: FakePatient = { ...current, archivedAt: archive ? new Date().toISOString() : null };
    this.patients = this.patients.map((patient) => (patient.id === id ? updated : patient));

    return route.fulfill({ json: updated, headers: this.sessionHeaders() });
  }

  private updatePatient(route: Route, id: string, body: Partial<FakePatient>) {
    this.updatedPatients.push(body);
    const current = this.patients.find((patient) => patient.id === id);

    if (!current) {
      return route.fulfill({ status: 404, json: { code: "PATIENT_NOT_FOUND", message: "Paciente não encontrado!" } });
    }

    if (current.archivedAt) {
      return route.fulfill({
        status: 409,
        json: { code: "PATIENT_ARCHIVED", message: "Este paciente está arquivado e não pode ser alterado." },
      });
    }

    const updated: FakePatient = {
      ...current,
      name: body.name ?? current.name,
      birthDate: body.birthDate ?? current.birthDate,
      cpf: body.cpf ?? null,
      cns: body.cns ?? null,
      phone: body.phone ?? null,
      updatedAt: new Date().toISOString(),
    };
    this.patients = this.patients.map((patient) => (patient.id === id ? updated : patient));

    return route.fulfill({ json: updated, headers: this.sessionHeaders() });
  }

  private createPatient(route: Route, body: Partial<FakePatient>) {
    this.createdPatients.push(body);

    const duplicate = this.patients.some(
      (patient) => (body.cpf && patient.cpf === body.cpf) || (body.cns && patient.cns === body.cns),
    );

    if (duplicate) {
      return route.fulfill({ status: 409, json: { code: "CONFLICT", message: "Este registro já existe." } });
    }

    const patient = fakePatient({
      id: `0b6f1c2a-3333-4000-8000-${String(this.patients.length).padStart(12, "0")}`,
      name: body.name ?? "",
      birthDate: body.birthDate,
      cpf: body.cpf ?? null,
      cns: body.cns ?? null,
      phone: body.phone ?? null,
    });
    this.patients = [...this.patients, patient];

    return route.fulfill({ status: 201, json: patient, headers: this.sessionHeaders() });
  }

  private listPatients(route: Route, query: URLSearchParams) {
    this.patientQueries.push(query);

    if (this.patientsStatus) {
      return route.fulfill({
        status: this.patientsStatus,
        json: { code: "INTERNAL_SERVER_ERROR", message: "Ocorreu um erro inesperado." },
        headers: { "x-request-id": "req-e2e-patients" },
      });
    }

    const search = query.get("search") ?? "";
    const archived = query.get("status") === "archived";
    const page = Number(query.get("page") ?? 1);
    const limit = Number(query.get("limit") ?? 20);
    const digits = /^\d+$/.test(search);

    const matches = this.patients
      .filter((patient) => Boolean(patient.archivedAt) === archived)
      .filter(
        (patient) =>
          !search ||
          withoutAccents(patient.name).includes(withoutAccents(search)) ||
          (digits && (patient.cpf === search || patient.cns === search)),
      )
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

    return route.fulfill({
      json: {
        items: matches.slice((page - 1) * limit, page * limit),
        page,
        limit,
        total: matches.length,
        totalPages: Math.ceil(matches.length / limit),
      },
      headers: this.sessionHeaders(),
    });
  }
}

export const test = base.extend<{ api: FakeApi; apiOptions: ApiOptions; cspViolations: string[] }>({
  apiOptions: [{}, { option: true }],
  api: [
    async ({ page, context, apiOptions }, use) => {
      const api = new FakeApi(page, context, apiOptions);
      await api.install();
      await use(api);
    },
    { auto: true },
  ],
  cspViolations: [
    async ({ page }, use) => {
      const violations: string[] = [];
      page.on("console", (message) => {
        if (message.type() === "error" && /Content Security Policy/i.test(message.text())) {
          violations.push(message.text());
        }
      });
      await use(violations);
    },
    { auto: true },
  ],
});

export { expect } from "@playwright/test";
