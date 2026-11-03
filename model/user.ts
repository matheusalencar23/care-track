import type { BrazilianState } from "@/shared/brazilianStates";

export interface User {
  name: string;
  email: string;
  coren: string;
  corenState: BrazilianState;
}

export interface SignupData extends User {
  password: string;
}
