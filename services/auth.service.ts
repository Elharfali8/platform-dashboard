import { api } from "@/lib/api";

export type LoginCredentials = {
  email: string;
  password: string;
};

export type LoginResponse = {
  accessToken: string;
  mustChangePassword: boolean;
};

export async function login(
  credentials: LoginCredentials,
): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>(
    "/auth/login",
    credentials,
  );

  return response.data;
}

export type ChangePasswordData = {
  currentPassword: string;
  newPassword: string;
};

export async function changePassword(
  data: ChangePasswordData,
  accessToken: string,
) {
  const response = await api.post(
    "/auth/change-password",
    data,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  return response.data;
}