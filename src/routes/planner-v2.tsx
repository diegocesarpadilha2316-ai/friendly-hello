import { createFileRoute } from '@tanstack/react-router'
import { PlannerV2Layout } from '@/modules/planner-v2/ui/PlannerV2Layout'

export const Route = createFileRoute('/planner-v2')({
  component: PlannerV2Layout,
})
