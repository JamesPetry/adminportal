import { redirect } from "next/navigation";

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminClientEditorPage({ params }: PageProps) {
  const { id } = await params;
  redirect(`/admin/projects/${id}`);
}
