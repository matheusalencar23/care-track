import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().min(2, "Nome muito curto"),
  email: z.email("Email inválido"),
  password: z.string().min(8, "Senha muito curta"),
});
