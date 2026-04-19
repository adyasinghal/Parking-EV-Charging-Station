import api from "./client";
import type { AuthResponse } from "../types";

export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>("/auth/login", { email, password }).then((r) => r.data),
  register: (payload: {
    full_name: string;
    email: string;
    password: string;
    phone?: string;
  }) => api.post<AuthResponse>("/auth/register", payload).then((r) => r.data),
};

