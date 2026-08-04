import React, { lazy } from 'react'
import { createFileRoute } from '@tanstack/react-router'

const PlannerV2Layout = lazy(() => import('@/modules/planner-v2/ui/PlannerV2Layout').then(m => ({ default: m.PlannerV2Layout })))

export const Route = createFileRoute('/planner-v2')({
  component: () => (
    <React.Suspense fallback={<div>Carregando...</div>}>
      <PlannerV2Layout />
    </React.Suspense>
  ),
})
