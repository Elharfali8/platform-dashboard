"use client";

import { useCallback, useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { Filter, Plus, RefreshCw, Search, Users } from "lucide-react";
import { useParams, usePathname, useRouter } from "next/navigation";

import PageTitle from "@/components/applications/global/PageTitle";
import SearchInput from "@/components/applications/global/SearchInput";
import { Button } from "@/components/ui/button";
import { getProfile } from "@/services/auth.service";
import {
  createClient,
  listClients,
  type Client,
} from "@/services/clients.service";
import { useAuthStore } from "@/store/auth.store";
import ClientCard from "@/components/applications/cards/ClientCard";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const ClientsClientPage = () => {
  const params = useParams<{ applicationSlug: string }>();
  const pathname = usePathname();
  const router = useRouter();

  const accessToken = useAuthStore((state) => state.accessToken);
  const logout = useAuthStore((state) => state.logout);

  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);

  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");

  const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [createModal, setCreateModal] = useState(false);

const handleCreateModal = () => {
  setCreateModal((prev) => !prev);
    };
    
    const [createForm, setCreateForm] = useState({
  fullName: "",
  phone: "",
  address: "",
  notes: "",
});

const [isCreating, setIsCreating] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);
    
    const handleCreateInputChange = (
  event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
) => {
  const { name, value } = event.target;

  setCreateForm((prev) => ({
    ...prev,
    [name]: value,
  }));
    };
    
    const handleCreateClient = async (
  event: React.FormEvent<HTMLFormElement>,
) => {
  event.preventDefault();

  if (!accessToken || !applicationId) {
    return;
  }

  setIsCreating(true);
  setCreateError(null);

  try {
    await createClient({
      applicationId,
      accessToken,
      data: createForm,
    });

    setCreateModal(false);

    setCreateForm({
      fullName: "",
      phone: "",
      address: "",
      notes: "",
    });

    await fetchClients();
  } catch (createError) {
    setCreateError(
      handleApiError(
        createError,
        "Could not create client.",
      ),
    );
  } finally {
    setIsCreating(false);
  }
};

  const handleApiError = useCallback(
    (apiError: unknown, fallbackMessage: string) => {
      if (isAxiosError<{ message?: string }>(apiError)) {
        if (apiError.response?.status === 401) {
          logout();

          router.replace(
            `/auth/login?redirect=${encodeURIComponent(pathname)}`,
          );

          return "Your session expired. Please sign in again.";
        }

        return apiError.response?.data?.message ?? fallbackMessage;
      }

      return apiError instanceof Error
        ? apiError.message
        : fallbackMessage;
    },
    [logout, pathname, router],
  );

  // Resolve application ID
  useEffect(() => {
    if (!accessToken || !params.applicationSlug) {
      return;
    }

    let cancelled = false;

    const token = accessToken;

    async function resolveApplication() {
      try {
        const profile = await getProfile(token);

        const application = profile.applications.find(
          (item) =>
            item.application.slug === params.applicationSlug,
        )?.application;

        if (!application) {
          throw new Error(
            "Application not found for this account.",
          );
        }

        if (!cancelled) {
          setApplicationId(application.id);
        }
      } catch (resolveError) {
        if (!cancelled) {
          setError(
            handleApiError(
              resolveError,
              "Could not load this application.",
            ),
          );

          setIsLoading(false);
        }
      }
    }

    resolveApplication();

    return () => {
      cancelled = true;
    };
  }, [
    accessToken,
    handleApiError,
    params.applicationSlug,
  ]);

  // Fetch clients
  const fetchClients = useCallback(async () => {
    if (!accessToken || !applicationId) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await listClients({
        applicationId,
        accessToken,
        search: submittedSearch,
      });

      setClients(response.data);
    } catch (fetchError) {
      setError(
        handleApiError(
          fetchError,
          "Could not load clients.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    accessToken,
    applicationId,
    handleApiError,
    submittedSearch,
  ]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setSubmittedSearch(search);
  }

  return (
    <div>
      <PageTitle title="Clients" icon={Users} />

      <div className="my-3 h-px w-full bg-gray-300 lg:my-5" />

      {/* Search */}
      <form
        onSubmit={handleSubmit}
        className="flex w-full flex-col gap-3 md:flex-row md:items-center md:justify-between"
      >
        <SearchInput
          value={search}
          onChange={setSearch}
        />

        <div className="flex w-full flex-wrap gap-2 md:w-auto">
          <Button
            type="submit"
            className="h-10 flex-1 gap-2 px-4 md:flex-none"
          >
            <Search size={16} />
            Search
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setSearch("");
              setSubmittedSearch("");
            }}
            className="h-10 flex-1 gap-2 px-4 md:flex-none"
          >
            <Filter size={16} />
            Filters
          </Button>

          <Button
  type="button"
  onClick={handleCreateModal}
  className="h-10 flex-1 gap-2 bg-blue-500 px-4 hover:bg-blue-600 md:flex-none"
>
  <Plus size={16} />
  Add client
</Button>
        </div>
      </form>

      {/* Clients */}
      <section className="mt-5 rounded-lg border border-border bg-surface p-4 shadow-[var(--card-shadow)] lg:mt-8">
        <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Client grid
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              {clients.length} clients
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={fetchClients}
            disabled={isLoading}
            className="h-9 gap-2"
          >
            <RefreshCw
              className={`size-4 ${
                isLoading ? "animate-spin" : ""
              }`}
            />

            Refresh
          </Button>
        </div>

        {/* Error */}
        {error ? (
          <div className="rounded-lg border border-danger/30 bg-danger/5 p-4 text-sm text-danger">
            {error}
          </div>
        ) : null}

        {/* Loading */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="h-40 animate-pulse rounded-lg border border-border bg-muted/60"
              />
            ))}
          </div>
        ) : clients.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {clients.map((client, index) => (
  <ClientCard
    key={`${client.phone}-${index}`}
    fullName={client.fullName}
    phone={client.phone}
    address={client.address}
    notes={client.notes}
  />
))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-muted/35 p-8 text-center">
            <p className="text-sm font-medium text-foreground">
              No clients found
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Try another name or phone number.
            </p>
          </div>
        )}
          </section>
          {createModal && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    onClick={handleCreateModal}
  >
    <form
  onSubmit={handleCreateClient}
  className="w-full max-w-lg rounded-xl bg-background p-6 shadow-xl"
  onClick={(event) => event.stopPropagation()}
>
      <h2 className="text-xl font-semibold">
        Create Client
      </h2>

      <p className="mt-1 text-sm text-muted-foreground">
        Add a new client to your application.
                      </p>
                      
                      {createError && (
  <div className="mt-4 rounded-lg border border-danger/30 bg-danger/5 p-3 text-sm text-danger">
    {createError}
  </div>
)}

      <div className="mt-6 grid gap-4">
  {/* Full Name */}
  <div className="grid gap-2">
    <Label htmlFor="fullName">
      Full name
    </Label>

    <Input
      id="fullName"
      name="fullName"
      type="text"
      placeholder="Ada Lovelace"
      value={createForm.fullName}
      onChange={handleCreateInputChange}
      required
    />
  </div>

  {/* Phone */}
  <div className="grid gap-2">
    <Label htmlFor="phone">
      Phone
    </Label>

    <Input
      id="phone"
      name="phone"
      type="tel"
      placeholder="+15550101"
      value={createForm.phone}
      onChange={handleCreateInputChange}
      required
    />
  </div>

  {/* Address */}
  <div className="grid gap-2">
    <Label htmlFor="address">
      Address
    </Label>

    <Input
      id="address"
      name="address"
      type="text"
      placeholder="12 Example Street"
      value={createForm.address}
      onChange={handleCreateInputChange}
      required
    />
  </div>

  {/* Notes */}
  <div className="grid gap-2">
    <Label htmlFor="notes">
      Notes
    </Label>

    <Textarea
      id="notes"
      name="notes"
      placeholder="VIP client"
      value={createForm.notes}
      onChange={handleCreateInputChange}
    />
  </div>
</div>

      <div className="mt-6 flex justify-end gap-2">
  <Button
    type="button"
    variant="outline"
    onClick={handleCreateModal}
    disabled={isCreating}
  >
    Cancel
  </Button>

  <Button
    type="submit"
    disabled={isCreating}
    className="bg-blue-500 hover:bg-blue-600"
  >
    {isCreating ? "Creating..." : "Create Client"}
  </Button>
</div>
    </form>
  </div>
)}
    </div>
  );
};

export default ClientsClientPage;