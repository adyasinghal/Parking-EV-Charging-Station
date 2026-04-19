import api from "./client";
import type { User } from "../types";

export const usersApi = {
  me: () => api.get<User>("/users/me").then((r) => r.data),
  updateMe: (payload: { full_name?: string; phone?: string }) =>
    api.put<User>("/users/me", payload).then((r) => r.data),
  list: () => api.get<User[]>("/users").then((r) => r.data),
  getById: (id: number) => api.get<User>(`/users/${id}`).then((r) => r.data),
  remove: (id: number) => api.delete(`/users/${id}`).then((r) => r.data),
};

