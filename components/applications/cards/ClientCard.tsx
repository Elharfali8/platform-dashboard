import { MapPin, Phone } from "lucide-react";

type ClientCardProps = {
  fullName: string;
  phone: string;
  address: string;
  notes: string;
};

const ClientCard = ({
  fullName,
  phone,
  address,
  notes,
}: ClientCardProps) => {
  return (
    <div className="rounded-lg border border-border bg-background p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-foreground">
            {fullName}
          </h3>

          <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="size-4" />
            <span>{phone}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-start gap-2 text-sm text-muted-foreground">
        <MapPin className="mt-0.5 size-4 shrink-0" />

        <span>
          {address}
        </span>
      </div>

      {notes && (
        <div className="mt-3 rounded-md bg-muted/50 p-2.5">
          <p className="text-xs font-medium text-foreground">
            Notes
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            {notes}
          </p>
        </div>
      )}
    </div>
  );
};

export default ClientCard;