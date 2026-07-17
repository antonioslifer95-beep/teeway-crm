import type { ActivityType, PipelineStage } from "@/generated/prisma/client";

export const PIPELINE_STAGE_VALUES = [
  "LEAD",
  "CONTACTED",
  "BUDGET_SENT",
  "WON",
  "LOST",
] as const satisfies readonly PipelineStage[];

export const PIPELINE_STAGES: PipelineStage[] = [...PIPELINE_STAGE_VALUES];

export const PIPELINE_STAGE_LABELS: Record<PipelineStage, string> = {
  LEAD: "Lead",
  CONTACTED: "Contactado",
  BUDGET_SENT: "Orçamento enviado",
  WON: "Ganho",
  LOST: "Perdido",
};

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  NOTE: "Nota",
  STAGE_CHANGE: "Mudança de fase",
  CALL: "Chamada",
  EMAIL: "Email",
  REMINDER: "Lembrete",
  SYSTEM: "Sistema",
};
