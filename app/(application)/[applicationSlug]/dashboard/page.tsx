import {
  ArrowDownRight,
  ArrowUpRight,
  Bike,
  CreditCard,
  ReceiptText,
  WalletCards,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type SummaryCard = {
  label: string;
  value: string;
  detail: string;
  trend: string;
  trendDirection: "up" | "down";
  icon: LucideIcon;
};

const summaryCards = [
  {
    label: "Orders Today",
    value: "148",
    detail: "23 awaiting assignment",
    trend: "+12.5%",
    trendDirection: "up",
    icon: ReceiptText,
  },
  {
    label: "Payments Today",
    value: "42,860 MAD",
    detail: "Collected across 96 orders",
    trend: "+8.2%",
    trendDirection: "up",
    icon: CreditCard,
  },
  {
    label: "Debts Today",
    value: "6,420 MAD",
    detail: "11 pending client balances",
    trend: "-3.1%",
    trendDirection: "down",
    icon: WalletCards,
  },
  {
    label: "Active Drivers",
    value: "32",
    detail: "8 currently delivering",
    trend: "+4 online",
    trendDirection: "up",
    icon: Bike,
  },
] satisfies SummaryCard[];

const transactions = [
  ["ORD-2048", "Amal Market", "Paid", "1,240 MAD"],
  ["ORD-2047", "Yassine Foods", "Debt", "680 MAD"],
  ["ORD-2046", "Casa Fresh", "Paid", "920 MAD"],
  ["ORD-2045", "Atlas Stores", "Pending", "1,100 MAD"],
];

const drivers = [
  ["Said Bennani", "24 deliveries", "98%"],
  ["Imane Chraibi", "21 deliveries", "96%"],
  ["Omar El Fassi", "18 deliveries", "94%"],
  ["Meryem Alaoui", "17 deliveries", "93%"],
];

function SummaryCardItem({ card }: { card: SummaryCard }) {
  const Icon = card.icon;
  const TrendIcon =
    card.trendDirection === "up" ? ArrowUpRight : ArrowDownRight;

  return (
    <article className="group rounded-xl border border-border bg-surface p-5 shadow-[var(--card-shadow)] transition duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-lg motion-reduce:hover:translate-y-0">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[13px] font-medium text-muted-foreground">
            {card.label}
          </p>
          <p className="mt-3 text-2xl font-semibold tracking-normal text-foreground sm:text-3xl">
            {card.value}
          </p>
        </div>
        <span className="grid size-10 place-items-center rounded-lg border border-border bg-muted text-primary transition duration-200 group-hover:bg-primary/10">
          <Icon className="size-5" />
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="truncate text-sm text-muted-foreground">{card.detail}</p>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
          <TrendIcon className="size-3" />
          {card.trend}
        </span>
      </div>
    </article>
  );
}

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-surface p-5 shadow-[var(--card-shadow)] transition duration-200 hover:border-border-strong">
      <div className="mb-5">
        <h2 className="text-lg font-semibold tracking-normal text-foreground sm:text-xl">
          {title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}

function ActivityBars() {
  const bars = [44, 62, 51, 78, 69, 86, 74];

  return (
    <div className="flex h-52 items-end gap-3 rounded-lg border border-border bg-muted/35 p-4">
      {bars.map((height, index) => (
        <div key={index} className="flex flex-1 flex-col items-center gap-2">
          <div
            className="w-full rounded-t-md bg-primary/75 transition duration-200 hover:bg-primary"
            style={{ height: `${height}%` }}
          />
          <span className="text-xs text-muted-foreground">
            {["M", "T", "W", "T", "F", "S", "S"][index]}
          </span>
        </div>
      ))}
    </div>
  );
}

function PaymentDebtSplit() {
  return (
    <div className="space-y-5">
      <div>
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-foreground">Payments</span>
          <span className="text-muted-foreground">87%</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-[87%] rounded-full bg-primary" />
        </div>
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-foreground">Debt</span>
          <span className="text-muted-foreground">13%</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-[13%] rounded-full bg-warning" />
        </div>
      </div>
      <div className="rounded-lg border border-border bg-muted/35 p-4">
        <p className="text-sm font-medium text-foreground">Net collection</p>
        <p className="mt-2 text-3xl font-semibold tracking-normal">
          36,440 MAD
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Payment balance after today&apos;s recorded debts.
        </p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <h2 className="text-2xl font-semibold tracking-normal text-foreground sm:text-3xl">
            Delivery operations
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Monitor today&apos;s orders, driver activity, payments, and client
            balances from one clean workspace.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-muted-foreground shadow-sm">
          <span className="size-2 rounded-full bg-success" />
          Live workspace data mock
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <SummaryCardItem key={card.label} card={card} />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Panel
          title="Recent Transactions"
          description="Latest payment and debt activity across active clients."
        >
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">Client</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {transactions.map(([order, client, status, amount]) => (
                  <tr
                    key={order}
                    className="transition duration-200 hover:bg-muted/40"
                  >
                    <td className="px-4 py-3 font-medium text-foreground">
                      {order}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {client}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full border border-border bg-muted px-2 py-1 text-xs font-medium text-foreground">
                        {status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-foreground">
                      {amount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel
          title="Top Drivers"
          description="Best performers ranked by completed deliveries."
        >
          <div className="space-y-3">
            {drivers.map(([name, deliveries, score], index) => (
              <div
                key={name}
                className="flex items-center gap-3 rounded-lg border border-border bg-muted/25 p-3 transition duration-200 hover:bg-muted/50"
              >
                <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {name}
                  </p>
                  <p className="text-xs text-muted-foreground">{deliveries}</p>
                </div>
                <span className="text-sm font-semibold text-foreground">
                  {score}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Panel
          title="Weekly Activity"
          description="Delivery volume trend for the current week."
        >
          <ActivityBars />
        </Panel>

        <Panel
          title="Payment vs Debt"
          description="Collection health across today&apos;s processed orders."
        >
          <PaymentDebtSplit />
        </Panel>
      </section>
    </div>
  );
}
