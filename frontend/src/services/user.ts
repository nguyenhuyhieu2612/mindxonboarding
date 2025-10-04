import api from "./api";
import { User } from "@/types/user.types";

const root = "/users";

export const getCurrentUser = async () => {
  const response = await api.get<User>(`${root}/me`);

  return response.data;
};
