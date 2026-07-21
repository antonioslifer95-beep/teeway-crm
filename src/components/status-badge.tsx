import type { ReactNode } from "react";
import { TriangleAlertIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { QUOTE_STATUS_LABELS } from "@/lib/quote-labels";
import { INVOICE_STATUS_LABELS } from "@/lib/invoice-labels";
import { ORDER_STATUS_LABELS } from "@/lib/order-labels";
import { PIPELINE_STAGE_LABELS } from "@/lib/pipeline";
import type {
  InvoiceStatus,
  OrderStatus,
  PipelineStage,
  QuoteStatus,
} from "@/generated/prisma/client";

/**
 * Strictly-monochrome status system — the brand bans color, so state is
 * conveyed by weight, not hue:
 *   solid   = positive / terminal (accepted, won, issued, received)
 *   outline = active / in progress (sent, in review, in transit…)
 *   muted   = dormant / negative (draft, lead, rejected, expired, lost)
 * ERROR is the one exception that must catch the eye — a muted chip with an
 * alert glyph, still colorless. See teeway-guia-de-marca.html.
 */
type Tone = "solid" | "outline" | "muted";

const toneClass: Record<Tone, string> = {
  solid: "bg-foreground text-background",
  outline: "border border-border text-foreground",
  muted: "bg-muted text-muted-foreground",
};

export function StatusBadge({
  tone,
  children,
  className,
}: {
  tone: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap [&>svg]:size-3",
        toneClass[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

const quoteTone: Record<QuoteStatus, Tone> = {
  DRAFT: "muted",
  SENT: "outline",
  ACCEPTED: "solid",
  REJECTED: "muted",
  EXPIRED: "muted",
};

export function QuoteStatusBadge({ value }: { value: QuoteStatus }) {
  return <StatusBadge tone={quoteTone[value]}>{QUOTE_STATUS_LABELS[value]}</StatusBadge>;
}

const invoiceTone: Record<InvoiceStatus, Tone> = {
  PENDING_REVIEW: "muted",
  READY_TO_ISSUE: "outline",
  ISSUED: "solid",
  ERROR: "muted",
};

export function InvoiceStatusBadge({ value }: { value: InvoiceStatus }) {
  return (
    <StatusBadge tone={invoiceTone[value]}>
      {value === "ERROR" && <TriangleAlertIcon />}
      {INVOICE_STATUS_LABELS[value]}
    </StatusBadge>
  );
}

const pipelineTone: Record<PipelineStage, Tone> = {
  LEAD: "muted",
  CONTACTED: "outline",
  BUDGET_SENT: "outline",
  WON: "solid",
  LOST: "muted",
};

export function PipelineBadge({ value }: { value: PipelineStage }) {
  return (
    <StatusBadge tone={pipelineTone[value]}>
      {PIPELINE_STAGE_LABELS[value]}
    </StatusBadge>
  );
}

const orderTone: Record<OrderStatus, Tone> = {
  PLANNED: "muted",
  IN_TRANSIT: "outline",
  CLEARED: "outline",
  RECEIVED: "solid",
};

export function OrderStatusBadge({ value }: { value: OrderStatus }) {
  return <StatusBadge tone={orderTone[value]}>{ORDER_STATUS_LABELS[value]}</StatusBadge>;
}
