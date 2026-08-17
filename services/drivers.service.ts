import { api } from "@/lib/api";

export type Driver = {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string | null;
    isActive: boolean;
  };
  membership: {
    id: string;
    role: "DRIVER";
    isActive: boolean;
  };
  driverProfile: {
    id: string;
    phone: string;
    vehiclePlate: string | null;
    isAvailable: boolean;
    isActive: boolean;
  };
};

export type DriversResponse = {
  data: Driver[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type ListDriversParams = {
  applicationId: string;
  accessToken: string;
  search?: string;
  limit?: number;
};

export async function listDrivers({
  applicationId,
  accessToken,
  search,
  limit = 100,
}: ListDriversParams): Promise<DriversResponse> {
  const response = await api.get<DriversResponse>(
    `/applications/${applicationId}/delivery/drivers`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        limit,
        ...(search?.trim() ? { search: search.trim() } : {}),
      },
    },
  );

  return response.data;
}


// CREATE DRIVER

export type CreateDriverData = {
  email: string;
  firstName: string;
  lastName: string;
  temporaryPassword: string;
  phone: string;
};

type CreateDriverParams = {
  applicationId: string;
  accessToken: string;
  data: CreateDriverData;
};

export async function createDriver({
  applicationId,
  accessToken,
  data,
}: CreateDriverParams) {
  const response = await api.post(
    `/applications/${applicationId}/delivery/drivers`,
    data,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  return response.data;
}