import PatientConsents from "./components/patient-consents";

export default async function PatientConsentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <PatientConsents id={id} />;
}
