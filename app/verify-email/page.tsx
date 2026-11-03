import ExternalLayout from "../ui/components/external-layout";
import VerifyEmail from "./components/verifyEmail";

interface Props {
  searchParams: Promise<{ token?: string | string[] }>;
}

export default async function VerifyEmailPage({ searchParams }: Props) {
  const { token } = await searchParams;

  return (
    <ExternalLayout title="Confirmação de e-mail">
      <VerifyEmail token={typeof token === "string" ? token : undefined} />
    </ExternalLayout>
  );
}
