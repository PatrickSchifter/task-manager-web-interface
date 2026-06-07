import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/attachments/${id}/url`,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      cache: "no-store",
    },
  );

  if (!response.ok) {
    return new Response("Arquivo não encontrado ou sem permissão.", {
      status: response.status,
    });
  }

  const { url } = await response.json();
  redirect(url);
}
