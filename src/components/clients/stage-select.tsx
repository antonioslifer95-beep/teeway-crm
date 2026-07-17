"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PIPELINE_STAGE_LABELS, PIPELINE_STAGE_VALUES } from "@/lib/pipeline";
import { updateClientStageAction } from "@/lib/actions/clients";
import type { PipelineStage } from "@/generated/prisma/client";

export function StageSelect({
  clientId,
  value,
}: {
  clientId: string;
  value: PipelineStage;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Select
      value={value}
      disabled={isPending}
      onValueChange={(next) => {
        startTransition(async () => {
          const result = await updateClientStageAction(
            clientId,
            next as PipelineStage,
          );
          if (result?.error) toast.error(result.error);
        });
      }}
    >
      <SelectTrigger className="w-48">
        <SelectValue>
          {(value: PipelineStage) => PIPELINE_STAGE_LABELS[value]}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {PIPELINE_STAGE_VALUES.map((stage) => (
          <SelectItem key={stage} value={stage}>
            {PIPELINE_STAGE_LABELS[stage]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
