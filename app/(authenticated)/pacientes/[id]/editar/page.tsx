import EditPatient from "./components/edit-patient";

export default async function EditPatientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <EditPatient id={id} />;
}
