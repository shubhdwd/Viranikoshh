import { LinkButton } from "./Button";
import { BoxIcon } from "lucide-react";
interface EmptyStateProps {
  icon: typeof BoxIcon;
  title: string;
  description: string;
  actionLabel?: string | undefined;
  actionTo?: string | undefined;
}
export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionTo
}: EmptyStateProps) {
  return <div className="flex flex-col items-center text-center py-16 px-6 bg-paper border border-dashed border-sand-light rounded-card">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sand-lighter text-charcoal-muted">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <h3 className="mt-4 font-display text-lg font-semibold text-charcoal">{title}</h3>
      <p className="mt-1.5 text-sm text-charcoal-muted max-w-sm">{description}</p>
      {actionLabel && actionTo && <LinkButton to={actionTo} className="mt-5" size="sm">
          {actionLabel}
        </LinkButton>}
    </div>;
}