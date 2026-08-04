import React, { lazy } from 'react'
import { createFileRoute } from '@tanstack/react-router'

const PlannerV2Layout = lazy(() => import('@/modules/planner-v2/ui/PlannerV2Layout').then(m => ({ default: m.PlannerV2Layout })))

export const Route = createFileRoute('/planner-v2')({
  ssr: false,
  component: () => (
    <React.Suspense fallback={<div className="flex h-screen items-center justify-center bg-background text-muted-foreground uppercase tracking-widest font-black">Carregando Hub V2...</div>}>
      <PlannerV2Layout />
    </React.Suspense>
  ),
})