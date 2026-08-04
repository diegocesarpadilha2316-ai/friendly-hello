import React from 'react';
import { V2Viewport } from '../viewport/V2Viewport';
import { V2ViewportNext } from '../viewport-next';
import { usePlannerV2Store } from '../core/store';
import { TopBar } from '../components/TopBar';
import { BottomBar } from '../components/BottomBar';
import { SideNav } from './panels/SideNav';
import { InspectorPanel } from './panels/InspectorPanel';

export const PlannerV2Layout: React.FC = () => {
  return (
    <div className="flex flex-col h-screen w-full bg-[#0a0a0c] overflow-hidden text-foreground selection:bg-primary/30 antialiased font-sans">
      {/* Top Navigation */}
      <TopBar />

      <main className="flex-1 overflow-hidden flex relative">
        {/* Left Side: Project Management & Library */}
        <SideNav />

        {/* Center Viewport: The "Big" Working Area */}
        <div className="flex-1 relative bg-[#0d0d0f] shadow-inner">
          <V2Viewport />
        </div>

        {/* Right Side: Professional Inspector & AI Assistant (Fixed) */}
        <InspectorPanel />
      </main>

      {/* Status Bar */}
      <BottomBar />
    </div>
  );
};
