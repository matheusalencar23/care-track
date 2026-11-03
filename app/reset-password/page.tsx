import ExternalLayout from "../ui/components/external-layout";
import ResetPasswordForm from "./components/resetPasswordForm";

interface Props {
  searchParams: Promise<{ token?: string | string[] }>;
}

// Sem `GuestOnly`: quem está logado também pode usar o link para trocar a senha.
export default async function ResetPasswordPage({ searchParams }: Props) {
  const { token } = await searchParams;

  return (
    <ExternalLayout title="Crie uma nova senha">
      <ResetPasswordForm
        token={typeof token === "string" ? token : undefined}
      />
    </ExternalLayout>
  );
}
