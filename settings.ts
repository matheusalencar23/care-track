// Acesso literal a `process.env.NEXT_PUBLIC_*` é necessário para o Next.js
// substituir o valor no bundle do cliente.
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

if (!apiUrl) {
  throw new Error(
    "A variável de ambiente NEXT_PUBLIC_API_URL não está definida. Configure-a em .env.local.",
  );
}

export const API_URL = apiUrl;
