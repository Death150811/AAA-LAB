"use client";

import { Check } from "lucide-react";
import { useHydrated } from "@/store/hydrate";
import { useUserStore } from "@/store/user-store";
import { Badge } from "@/components/ui/primitives";

export function ProjectStatus({ projectId }: { projectId: string }) {
  const done = useUserStore((s) => !!s.completedProjects[projectId]);
  const hydrated = useHydrated();
  if (!hydrated || !done) return null;
  return (
    <Badge tone="emerald">
      <Check size={10} aria-hidden /> завершён
    </Badge>
  );
}
