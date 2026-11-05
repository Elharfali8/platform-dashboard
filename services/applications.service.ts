import { api } from "@/lib/api";

export type Application = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ApplicationsResponse = {
  data: Application[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type ListApplicationsParams = {
  accessToken: string;
  search?: string;
  limit?: number;
};

export async function listApplications({
  accessToken,
  search,
  limit = 100,
}: ListApplicationsParams): Promise<ApplicationsResponse> {
  const response = await api.get<ApplicationsResponse>("/applications", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    params: {
      limit,
      ...(search?.trim() ? { search: search.trim() } : {}),
    },
  });

  return response.data;
}

export type CreateApplicationData = {
  name: string;
  slug: string;
  logoUrl?: string;
};

type CreateApplicationParams = {
  accessToken: string;
  data: CreateApplicationData;
};

export async function createApplication({
  accessToken,
  data,
}: CreateApplicationParams): Promise<Application> {
  const response = await api.post<Application>("/applications", data, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return response.data;
}

export type CreateApplicationOwnerData = {
  email: string;
  firstName: string;
  lastName?: string;
  temporaryPassword: string;
};

export type CreateApplicationOwnerResponse = {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string | null;
    mustChangePassword: boolean;
  };
  membership: {
    id: string;
    userId: string;
    applicationId: string;
    role: "OWNER" | "ADMIN" | "DRIVER" | "STAFF" | "USER";
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
};

type CreateApplicationOwnerParams = {
  applicationId: string;
  accessToken: string;
  data: CreateApplicationOwnerData;
};

export async function createApplicationOwner({
  applicationId,
  accessToken,
  data,
}: CreateApplicationOwnerParams): Promise<CreateApplicationOwnerResponse> {
  const response = await api.post<CreateApplicationOwnerResponse>(
    `/applications/${applicationId}/owners`,
    data,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  return response.data;
}

export type UpdateApplicationData = {
  name?: string;
  /** For a riad this is also its booking site address: localhost:3030/<slug> */
  slug?: string;
  isActive?: boolean;
};

/** Platform owner: PATCH /platform/applications/:id */
export async function updateApplication({
  accessToken,
  applicationId,
  data,
}: {
  accessToken: string;
  applicationId: string;
  data: UpdateApplicationData;
}): Promise<Application> {
  const response = await api.patch<Application>(
    `/platform/applications/${applicationId}`,
    data,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  return response.data;
}

/**
 * Platform owner: DELETE /platform/applications/:id. Deletes everything in it.
 * Refused (409) when it has bookings or transactions: deactivate it instead.
 */
export async function deleteApplication({
  accessToken,
  applicationId,
}: {
  accessToken: string;
  applicationId: string;
}): Promise<Application> {
  const response = await api.delete<Application>(
    `/platform/applications/${applicationId}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  return response.data;
}
