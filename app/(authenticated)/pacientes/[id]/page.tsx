import PatientDetail from "./components/patient-detail";

export default async function PatientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <PatientDetail id={id} />;
}
