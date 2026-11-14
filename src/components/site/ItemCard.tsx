import { Link } from "@tanstack/react-router";
import { accessLabels, getCollection, statusLabels, type AccessLevel, type Item, type ItemStatus } from "@/data/repository";

const accessStyle: Record<AccessLevel, string> = {
  open: "bg-success/15 text-success",
  restricted: "bg-warning/15 text-warning",
  metadata: "bg-muted text-muted-foreground",
};

export function AccessBadge({ access }: { access: AccessLevel }) {
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${accessStyle[access]}`}>{accessLabels[access]}</span>;
}

const statusStyle: Record<ItemStatus, string> = {
  pending: "bg-warning/15 text-warning",
  approved: "bg-success/15 text-success",
  revision: "bg-accent text-accent-foreground",
  rejected: "bg-destructive/15 text-destructive",
};

export function StatusBadge({ status }: { status: ItemStatus }) {
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyle[status]}`}>{statusLabels[status]}</span>;
}

export function ItemCard({ item }: { item: Item }) {
  const col = getCollection(item.collection);
  return (
    <Link to="/items/$id" params={{ id: item.id }} className="block rounded-lg border bg-card p-4 shadow-card transition hover:border-primary">
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>{col?.icon} {col?.title}</span>
        <span>•</span>
        <span>{item.date}</span>
      </div>
      <h3 className="font-display text-lg font-bold leading-snug text-primary">{item.title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{item.author}</p>
      <div className="mt-3 flex items-center justify-between">
        <AccessBadge access={item.access} />
        <span className="text-xs text-muted-foreground">👁 {item.views}</span>
      </div>
    </Link>
  );
}
