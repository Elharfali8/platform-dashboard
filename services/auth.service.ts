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


export type ApplicationMembership = {
  membershipId: string;
  role: "OWNER" | "ADMIN" | "DRIVER" | "STAFF" | "USER";
  application: {
    id: string;
    name: string;
    slug: string;
  };
};

export type ProfileResponse = {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string | null;
    platformRole: "PLATFORM_OWNER" | "PLATFORM_ADMIN" | "MEMBER";
    mustChangePassword: boolean;
  };
  applications: ApplicationMembership[];
};


export async function getProfile(
  accessToken: string,
): Promise<ProfileResponse> {
  const response = await api.get<ProfileResponse>(
    "/auth/profile",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  return response.data;
}