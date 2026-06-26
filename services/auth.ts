export async function validateSession(cookieHeader: string) {
  try {
    const response = await fetch("http://localhost:3001/api/v1/users/me", {
      method: "GET",
      headers: {
        ...(cookieHeader && { Cookie: cookieHeader }),
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data as { name: string; email: string };
  } catch (err) {
    console.error("Erro ao validar sessão: ", err);
    return null;
  }
}
