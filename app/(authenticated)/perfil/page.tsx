"use client";

import { useCurrentUser } from "@/hooks/auth/useCurrentUser";

export default function ProfilePage() {
  const { data: user } = useCurrentUser();

  if (!user) {
    return null;
  }

  const fields = [
    { label: "Nome", value: user.name },
    { label: "E-mail", value: user.email },
    { label: "COREN", value: `COREN-${user.corenState} ${user.coren}` },
  ];

  return (
    <>
      <h1 className="text-2xl font-semibold">Meu perfil</h1>

      <div className="mt-6 max-w-xl rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-2xl sm:p-8">
        <dl className="space-y-5">
          {fields.map(({ label, value }) => (
            <div key={label}>
              <dt className="text-sm text-slate-300">{label}</dt>
              <dd className="mt-1 break-words font-medium">{value}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-8 text-sm text-slate-300">
          O nome e o COREN identificam a autoria dos registros que você faz nos
          prontuários. A edição desses dados ainda não está disponível.
        </p>
      </div>
    </>
  );
}
