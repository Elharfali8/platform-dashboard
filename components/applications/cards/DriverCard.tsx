import {
  Bike,
  Mail,
  Phone,
  User,
} from "lucide-react";

interface DriverProps {
  firstName: string;
  lastName?: string | null;
  email: string;
  phone: string;
  vehiclePlate?: string | null;
  isActive?: boolean;
  isAvailable?: boolean;
}

const DriverCard = ({
  firstName,
  lastName,
  email,
  phone,
  vehiclePlate,
  isActive = true,
  isAvailable = false,
}: DriverProps) => {
  const fullName = [firstName, lastName].filter(Boolean).join(" ");

  return (
    <article className="group rounded-lg border border-border bg-surface p-4 shadow-[var(--card-shadow)] transition duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-lg motion-reduce:hover:translate-y-0">
      <div className="flex items-start gap-3">
        <span className="grid size-12 shrink-0 place-items-center rounded-lg border border-border bg-muted text-primary transition duration-200 group-hover:bg-primary/10">
          <User className="size-6" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold tracking-normal text-foreground">
                {fullName || "Unnamed driver"}
              </h3>
              <p className="mt-1 text-xs font-medium text-muted-foreground">
                {isActive ? "Active profile" : "Inactive profile"}
              </p>
            </div>

            <span
              className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${
                isAvailable
                  ? "bg-success/10 text-success"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {isAvailable ? "Available" : "Away"}
            </span>
          </div>

          <div className="mt-4 space-y-2 text-sm">
            <p className="flex min-w-0 items-center gap-2 text-muted-foreground">
              <Mail className="size-4 shrink-0" />
              <span className="truncate">{email}</span>
            </p>
            <p className="flex min-w-0 items-center gap-2 text-muted-foreground">
              <Phone className="size-4 shrink-0" />
              <span className="truncate">{phone}</span>
            </p>
            {vehiclePlate ? (
              <p className="flex min-w-0 items-center gap-2 text-muted-foreground">
                <Bike className="size-4 shrink-0" />
                <span className="truncate">{vehiclePlate}</span>
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
};

export default DriverCard;
