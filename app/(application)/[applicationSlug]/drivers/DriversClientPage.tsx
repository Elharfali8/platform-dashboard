"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { Bike, Filter, Plus, RefreshCw, Search, X } from "lucide-react";
import { useParams, usePathname, useRouter } from "next/navigation";

import DriverCard from "@/components/applications/cards/DriverCard";
import PageTitle from "@/components/applications/global/PageTitle";
import SearchInput from "@/components/applications/global/SearchInput";
import { Button } from "@/components/ui/button";
import { getProfile } from "@/services/auth.service";
import {
  createDriver,
  listDrivers,
  type Driver,
} from "@/services/drivers.service";
import { useAuthStore } from "@/store/auth.store";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DriversClientPage = () => {
  const params = useParams<{ applicationSlug: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);
  const logout = useAuthStore((state) => state.logout);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

      return apiError instanceof Error ? apiError.message : fallbackMessage;
    },
    [logout, pathname, router],
  );

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
          (item) => item.application.slug === params.applicationSlug,
        )?.application;

        if (!application) {
          throw new Error("Application not found for this account.");
        }

        if (!cancelled) {
          setApplicationId(application.id);
        }
      } catch (resolveError) {
        if (!cancelled) {
          setError(
            handleApiError(resolveError, "Could not load this application."),
          );
          setIsLoading(false);
        }
      }
    }

    resolveApplication();

    return () => {
      cancelled = true;
    };
  }, [accessToken, handleApiError, params.applicationSlug]);

  const fetchDrivers = useCallback(async () => {
    if (!accessToken || !applicationId) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await listDrivers({
        applicationId,
        accessToken,
        search: submittedSearch,
      });

      setDrivers(response.data);
    } catch (fetchError) {
      setError(handleApiError(fetchError, "Could not load drivers."));
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, applicationId, handleApiError, submittedSearch]);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  const totals = useMemo(() => {
    return drivers.reduce(
      (current, driver) => ({
        active: current.active + (driver.driverProfile.isActive ? 1 : 0),
        available:
          current.available + (driver.driverProfile.isAvailable ? 1 : 0),
      }),
      { active: 0, available: 0 },
    );
  }, [drivers]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittedSearch(search);
  }


  // CREATE DRIVER
  const [createModal, setCreateModal] = useState(false)

  const [createForm, setCreateForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    temporaryPassword: "",
    phone: "",
  });

  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const handleCreateModal = () => {
    setCreateModal((prev) => !prev)
  }

  const handleCreateInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const { name, value } = event.target;

    setCreateForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateDriver = async (
  event: FormEvent<HTMLFormElement>,
) => {
  event.preventDefault();

  if (!accessToken || !applicationId) {
    return;
  }

  setIsCreating(true);
  setCreateError(null);

  try {
    await createDriver({
      applicationId,
      accessToken,
      data: createForm,
    });

    // Close modal
    setCreateModal(false);

    // Reset form
    setCreateForm({
      email: "",
      firstName: "",
      lastName: "",
      temporaryPassword: "",
      phone: "",
    });

    // Reload drivers
    await fetchDrivers();
  } catch (createError) {
    setCreateError(
      handleApiError(
        createError,
        "Could not create driver.",
      ),
    );
  } finally {
    setIsCreating(false);
  }
};

  return (
    <div className="">
      <PageTitle title="Drivers" icon={Bike} />
      <div className="my-3 h-px w-full bg-gray-300 lg:my-5" />

      <form
        onSubmit={handleSubmit}
        className="flex w-full flex-col gap-3 md:flex-row md:items-center md:justify-between"
      >
        <SearchInput value={search} onChange={setSearch} />

        <div className="flex flex-wrap w-full gap-2 md:w-auto">
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
            className="h-10 flex-1 gap-2 px-6 md:flex-none bg-blue-500 hover:bg-blue-600 cursor-pointer "
          >
            <Plus size={16} />
            Add driver
          </Button>
        </div>
      </form>

      <section className="mt-5 rounded-lg border border-border bg-surface p-4 shadow-[var(--card-shadow)] lg:mt-8">
        <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-semibold tracking-normal text-foreground">
              Driver grid
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {drivers.length} drivers, {totals.active} active,{" "}
              {totals.available} available
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={fetchDrivers}
            disabled={isLoading}
            className="h-9 gap-2"
          >
            <RefreshCw
              className={`size-4 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>

        {error ? (
          <div className="rounded-lg border border-danger/30 bg-danger/5 p-4 text-sm text-danger">
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="h-40 animate-pulse rounded-lg border border-border bg-muted/60"
              />
            ))}
          </div>
        ) : drivers.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {drivers.map((driver) => (
              <DriverCard
                key={driver.driverProfile.id}
                firstName={driver.user.firstName}
                lastName={driver.user.lastName}
                email={driver.user.email}
                phone={driver.driverProfile.phone}
                vehiclePlate={driver.driverProfile.vehiclePlate}
                isActive={driver.driverProfile.isActive}
                isAvailable={driver.driverProfile.isAvailable}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-muted/35 p-8 text-center">
            <p className="text-sm font-medium text-foreground">
              No drivers found
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try another name, email, or phone number.
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
  onSubmit={handleCreateDriver}
  className="w-full max-w-lg rounded-xl bg-background p-6 shadow-xl"
  onClick={(event) => event.stopPropagation()}
>
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Create Driver</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Add a new driver to your application.
        </p>
            </div>
            
            {createError && (
  <div className="mb-4 rounded-lg border border-danger/30 bg-danger/5 p-3 text-sm text-danger">
    {createError}
  </div>
)}

      <div className="grid gap-4">
        {/* First Name */}
        <div className="grid gap-2">
          <Label htmlFor="firstName">First name</Label>
          <Input
  id="firstName"
  name="firstName"
  type="text"
  placeholder="Driver"
  value={createForm.firstName}
  onChange={handleCreateInputChange}
  required
/>
        </div>

        {/* Last Name */}
        <div className="grid gap-2">
          <Label htmlFor="lastName">Last name</Label>
          <Input
  id="lastName"
  name="lastName"
  type="text"
  placeholder="One"
  value={createForm.lastName}
  onChange={handleCreateInputChange}
  required
/>
        </div>

        {/* Email */}
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
  id="email"
  name="email"
  type="email"
  placeholder="driver1@naser-delivery.com"
  value={createForm.email}
  onChange={handleCreateInputChange}
  required
/>
        </div>

        {/* Phone */}
        <div className="grid gap-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
  id="phone"
  name="phone"
  type="tel"
  placeholder="0612345678"
  value={createForm.phone}
  onChange={handleCreateInputChange}
  required
/>
        </div>

        {/* Temporary Password */}
        <div className="grid gap-2">
          <Label htmlFor="temporaryPassword">
            Temporary password
          </Label>
          <Input
  id="temporaryPassword"
  name="temporaryPassword"
  type="password"
  placeholder="Enter temporary password"
  value={createForm.temporaryPassword}
  onChange={handleCreateInputChange}
  required
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
  {isCreating ? "Creating..." : "Create Driver"}
</Button>
      </div>
    </form>
  </div>
)}

    </div>
  );
};

export default DriversClientPage;
