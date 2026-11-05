import { api } from "@/lib/api";

export type MembershipRole = "OWNER" | "ADMIN" | "STAFF" | "DRIVER" | "USER";

export const MEMBERSHIP_ROLES: MembershipRole[] = ["OWNER", "ADMIN", "STAFF", "DRIVER", "USER"];

export type UserMembership = {
  applicationId: string;
  applicationName: string;
  applicationSlug: string;
  role: MembershipRole;
  isActive: boolean;
  createdAt: string;
};

export type PlatformUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string | null;
  name: string;
  platformRole: "PLATFORM_OWNER" | "MEMBER";
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: string;
  memberships: UserMembership[];
};

export type UsersResponse = {
  data: PlatformUser[];
  meta: { page: number; limit: number; total: number; totalPages: number };
};

const auth = (accessToken: string) => ({
  headers: { Authorization: `Bearer ${accessToken}` },
});

/** GET /platform/users: every user with the applications they belong to. */
export async function listUsers({
  accessToken,
  search,
  applicationId,
  limit = 100,
}: {
  accessToken: string;
  search?: string;
  applicationId?: string;
  limit?: number;
}): Promise<UsersResponse> {
  const response = await api.get<UsersResponse>("/platform/users", {
    ...auth(accessToken),
    params: {
      limit,
      ...(search?.trim() ? { search: search.trim() } : {}),
      ...(applicationId ? { applicationId } : {}),
    },
  });

  return response.data;
}

export type CreateUserData = {
  email: string;
  firstName: string;
  lastName?: string;
  temporaryPassword: string;
  /** Optional: give access to one application right away. */
  applicationId?: string;
  role?: MembershipRole;
};

/** POST /platform/users */
export async function createUser({
  accessToken,
  data,
}: {
  accessToken: string;
  data: CreateUserData;
}): Promise<PlatformUser> {
  const response = await api.post<PlatformUser>("/platform/users", data, auth(accessToken));
  return response.data;
}

export type UpdateUserData = {
  email?: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
  /** Resets the password; they must change it at their next sign-in. */
  temporaryPassword?: string;
};

/** PATCH /platform/users/:id */
export async function updateUser({
  accessToken,
  userId,
  data,
}: {
  accessToken: string;
  userId: string;
  data: UpdateUserData;
}): Promise<PlatformUser> {
  const response = await api.patch<PlatformUser>(`/platform/users/${userId}`, data, auth(accessToken));
  return response.data;
}

/** DELETE /platform/users/:id. Refused (409) for users tied to delivery transactions. */
export async function deleteUser({
  accessToken,
  userId,
}: {
  accessToken: string;
  userId: string;
}): Promise<PlatformUser> {
  const response = await api.delete<PlatformUser>(`/platform/users/${userId}`, auth(accessToken));
  return response.data;
}

/** PUT /platform/users/:id/memberships/:applicationId: add access or change the role. */
export async function setMembership({
  accessToken,
  userId,
  applicationId,
  role,
}: {
  accessToken: string;
  userId: string;
  applicationId: string;
  role: MembershipRole;
}): Promise<PlatformUser> {
  const response = await api.put<PlatformUser>(
    `/platform/users/${userId}/memberships/${applicationId}`,
    { role },
    auth(accessToken),
  );
  return response.data;
}

/** DELETE /platform/users/:id/memberships/:applicationId: removes access to that application only. */
export async function removeMembership({
  accessToken,
  userId,
  applicationId,
}: {
  accessToken: string;
  userId: string;
  applicationId: string;
}): Promise<PlatformUser> {
  const response = await api.delete<PlatformUser>(
    `/platform/users/${userId}/memberships/${applicationId}`,
    auth(accessToken),
  );
  return response.data;
}
