"use client";

import { useCallback, useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { useParams, usePathname, useRouter } from "next/navigation";

import { getProfile } from "@/services/auth.service";
import {
  listTransactions,
  type Transaction,
} from "@/services/transactions.service";
import { useAuthStore } from "@/store/auth.store";

type DateFilter =
  | "ALL"
  | "TODAY"
  | "YESTERDAY"
  | "LAST_7_DAYS"
  | "LAST_10_DAYS"
  | "THIS_WEEK"
  | "THIS_MONTH";

const TransactionsClientPage = () => {
const params = useParams<{ applicationSlug: string }>();
const pathname = usePathname();
const router = useRouter();

const accessToken = useAuthStore((state) => state.accessToken);
const logout = useAuthStore((state) => state.logout);

const [applicationId, setApplicationId] = useState<string | null>(null);

const [transactions, setTransactions] = useState<Transaction[]>([]);

const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

const [dateFilter, setDateFilter] =
  useState<DateFilter>("THIS_WEEK");

const [selectedDriverId, setSelectedDriverId] =
  useState("");
    
    function getDateRange(filter: DateFilter) {
  const now = new Date();

  if (filter === "ALL") {
    return {
      occurredFrom: undefined,
      occurredTo: undefined,
    };
  }

  if (filter === "TODAY") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);

    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    return {
      occurredFrom: start.toISOString(),
      occurredTo: end.toISOString(),
    };
  }

  if (filter === "YESTERDAY") {
    const start = new Date(now);
    start.setDate(start.getDate() - 1);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setHours(23, 59, 59, 999);

    return {
      occurredFrom: start.toISOString(),
      occurredTo: end.toISOString(),
    };
  }

  if (filter === "LAST_7_DAYS") {
    const start = new Date(now);
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);

    return {
      occurredFrom: start.toISOString(),
      occurredTo: now.toISOString(),
    };
  }

  if (filter === "LAST_10_DAYS") {
    const start = new Date(now);
    start.setDate(start.getDate() - 9);
    start.setHours(0, 0, 0, 0);

    return {
      occurredFrom: start.toISOString(),
      occurredTo: now.toISOString(),
    };
  }

  if (filter === "THIS_WEEK") {
    const start = new Date(now);

    const day = start.getDay();

    // Monday = first day of week
    const daysFromMonday = day === 0 ? 6 : day - 1;

    start.setDate(start.getDate() - daysFromMonday);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return {
      occurredFrom: start.toISOString(),
      occurredTo: end.toISOString(),
    };
  }

  if (filter === "THIS_MONTH") {
    const start = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
    );

    start.setHours(0, 0, 0, 0);

    const end = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
    );

    end.setHours(23, 59, 59, 999);

    return {
      occurredFrom: start.toISOString(),
      occurredTo: end.toISOString(),
    };
  }

  return {
    occurredFrom: undefined,
    occurredTo: undefined,
  };
}
 
    const range = getDateRange(dateFilter);


    
  return (
    <div>TransactionsClientPage</div>
  )
}

export default TransactionsClientPage