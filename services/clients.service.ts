import { api } from "@/lib/api";

export type Client = {
  fullName: string;
  phone: string;
  address: string;
  notes: string;
};

export type ClientsResponse = {
  data: Client[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type ListClientsParams = {
  applicationId: string;
  accessToken: string;
  search?: string;
  limit?: number;
};

export async function listClients({
  applicationId,
  accessToken,
  search,
  limit = 100,
}: ListClientsParams) {
  const response = await api.get(
    `/applications/${applicationId}/delivery/clients`,
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


export type CreateClientData = {
  fullName: string;
  phone: string;
  address: string;
  notes: string;
};

type CreateClientParams = {
  applicationId: string;
  accessToken: string;
  data: CreateClientData;
};

export async function createClient({
  applicationId,
  accessToken,
  data,
}: CreateClientParams) {
  const response = await api.post(
    `/applications/${applicationId}/delivery/clients`,
    data,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  return response.data;
}