import { api } from "@/lib/api";

export type TransactionType = "PAYMENT" | "DEBT";

export type TransactionClient = {
  id: string;
  fullName: string;
  phone: string | null;
  isActive: boolean;
};

export type TransactionDriver = {
  id: string;
  userId: string;
  phone: string | null;
  vehiclePlate: string | null;
  isActive: boolean;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string | null;
    isActive: boolean;
  };
};

export type TransactionCreatedBy = {
  id: string;
  email: string;
  firstName: string;
  lastName: string | null;
  isActive: boolean;
};

export type Transaction = {
  id: string;
  applicationId: string;
  clientId: string;
  driverId: string;
  createdById: string;
  type: TransactionType;
  amount: string;
  notes: string | null;
  occurredAt: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;

  client: TransactionClient;
  driver: TransactionDriver;
  createdBy: TransactionCreatedBy;
};

export type TransactionsResponse = {
  data: Transaction[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type ListTransactionsParams = {
  applicationId: string;
  accessToken: string;

  page?: number;
  limit?: number;

  type?: TransactionType;
  clientId?: string;
  driverId?: string;
  isActive?: boolean;

  occurredFrom?: string;
  occurredTo?: string;
};

export async function listTransactions({
  applicationId,
  accessToken,
  page = 1,
  limit = 20,
  type,
  clientId,
  driverId,
  isActive,
  occurredFrom,
  occurredTo,
}: ListTransactionsParams): Promise<TransactionsResponse> {
  const response = await api.get<TransactionsResponse>(
    `/applications/${applicationId}/delivery/transactions`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        page,
        limit,

        ...(type ? { type } : {}),
        ...(clientId ? { clientId } : {}),
        ...(driverId ? { driverId } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
        ...(occurredFrom ? { occurredFrom } : {}),
        ...(occurredTo ? { occurredTo } : {}),
      },
    },
  );

  return response.data;
}