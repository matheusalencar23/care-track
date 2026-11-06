"use client";

import Button from "@/app/ui/button";
import DateInput from "@/app/ui/date-input";
import Input from "@/app/ui/input";
import LinkButton from "@/app/ui/link-button";
import MaskedInput from "@/app/ui/masked-input";
import { todayIso } from "@/lib/dates";
import { isValidCpf } from "@/lib/masks";
import type { Patient, PatientData } from "@/model/patient";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, type UseFormReturn } from "react-hook-form";
import z from "zod";

const MIN_BIRTH_DATE = "1900-01-01";

const optional = (isValid: (value: string) => boolean, message: string) =>
  z.string().refine((value) => value === "" || isValid(value), message);

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "O nome é obrigatório")
    .max(200, "O nome deve ter no máximo 200 caracteres"),
  birthDate: z
    .string()
    .min(1, "Informe a data de nascimento")
    .refine(
      (value) => /^\d{4}-\d{2}-\d{2}$/.test(value) && value >= MIN_BIRTH_DATE,
      "Data de nascimento inválida",
    )
    .refine(
      (value) => value <= todayIso(),
      "A data de nascimento não pode estar no futuro",
    ),
  cpf: optional(isValidCpf, "CPF inválido"),
  cns: optional(
    (value) => /^\d{15}$/.test(value),
    "O Cartão SUS deve conter 15 números",
  ),
  phone: optional(
    (value) => /^\d{10,11}$/.test(value),
    "Informe o telefone com DDD",
  ),
});

export type PatientFormValues = z.input<typeof schema>;

export const patientFormFields = [
  "name",
  "birthDate",
  "cpf",
  "cns",
  "phone",
] as const satisfies readonly (keyof PatientFormValues)[];

const emptyValues: PatientFormValues = {
  name: "",
  birthDate: "",
  cpf: "",
  cns: "",
  phone: "",
};

export function patientToFormValues(patient: Patient): PatientFormValues {
  return {
    name: patient.name,
    birthDate: patient.birthDate.slice(0, 10),
    cpf: patient.cpf ?? "",
    cns: patient.cns ?? "",
    phone: patient.phone ?? "",
  };
}

export function toPatientData(values: PatientFormValues): PatientData {
  return {
    name: values.name.trim(),
    birthDate: values.birthDate,
    ...(values.cpf && { cpf: values.cpf }),
    ...(values.cns && { cns: values.cns }),
    ...(values.phone && { phone: values.phone }),
  };
}

export function usePatientForm(defaultValues: PatientFormValues = emptyValues) {
  return useForm<PatientFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });
}

interface Props {
  form: UseFormReturn<PatientFormValues>;
  onSubmit: (data: PatientData) => void;
  isPending: boolean;
  submitLabel: string;
  pendingLabel: string;
  cancelHref: string;
}

export default function PatientForm({
  form,
  onSubmit,
  isPending,
  submitLabel,
  pendingLabel,
  cancelHref,
}: Props) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = form;

  return (
    <form
      noValidate
      onSubmit={handleSubmit((values) => onSubmit(toPatientData(values)))}
      className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-2xl sm:p-8"
    >
      <p className="text-sm text-slate-300">
        Informe só o necessário para identificar o paciente. CPF, Cartão SUS e
        telefone são opcionais.
      </p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Input
            label="Nome completo"
            autoComplete="off"
            maxLength={200}
            error={errors.name?.message}
            {...register("name")}
          />
        </div>

        <DateInput
          label="Data de nascimento"
          min={MIN_BIRTH_DATE}
          max={todayIso()}
          error={errors.birthDate?.message}
          {...register("birthDate")}
        />

        <Controller
          control={control}
          name="cpf"
          render={({ field }) => (
            <MaskedInput
              mask="cpf"
              label="CPF"
              hint="Opcional"
              error={errors.cpf?.message}
              {...field}
            />
          )}
        />

        <Controller
          control={control}
          name="cns"
          render={({ field }) => (
            <MaskedInput
              mask="cns"
              label="Cartão SUS"
              hint="Opcional"
              error={errors.cns?.message}
              {...field}
            />
          )}
        />

        <Controller
          control={control}
          name="phone"
          render={({ field }) => (
            <MaskedInput
              mask="phone"
              label="Telefone"
              hint="Opcional. Com DDD."
              error={errors.phone?.message}
              {...field}
            />
          )}
        />
      </div>

      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <LinkButton href={cancelHref} variant="secondary" block={false}>
          Cancelar
        </LinkButton>

        <Button block={false} disabled={isPending}>
          {isPending ? pendingLabel : submitLabel}
        </Button>
      </div>
    </form>
  );
}
