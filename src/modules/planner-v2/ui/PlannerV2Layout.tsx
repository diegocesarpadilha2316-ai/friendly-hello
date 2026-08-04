import React from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { cn } from '@/lib/utils';
import { V2Viewport } from '../viewport/V2Viewport';
import { usePlannerV2Store } from '../core/store';
import { TopBar } from '../components/TopBar';
import { BottomBar } from '../components/BottomBar';
import { SideNav } from './panels/SideNav';
import { InspectorPanel } from './panels/InspectorPanel';

export const PlannerV2Layout: React.FC = () => {
  const { leftPanelCollapsed, rightPanelCollapsed, setLeftPanelCollapsed, setRightPanelCollapsed } = usePlannerV2Store();
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  if (isMobile) {
    return (
      <div className="flex flex-col h-screen w-full bg-[#0a0a0c]">
        <main className="flex-1 relative overflow-hidden">
          <V2Viewport />
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full bg-[#0a0a0c] overflow-hidden text-foreground antialiased font-sans">
      <TopBar />

      <main className="flex-1 overflow-hidden relative">
        <PanelGroup direction="horizontal">
          {/* Explorer */}
          <Panel 
            defaultSize={20} 
            minSize={15} 
            maxSize={30}
            collapsible 
            onCollapse={() => setLeftPanelCollapsed(true)}
            onExpand={() => setLeftPanelCollapsed(false)}
            className={cn("bg-[#0f0f12] border-r border-border/50", leftPanelCollapsed && "hidden")}
          >
            <SideNav />
          </Panel>
          
          <PanelResizeHandle className="w-1 bg-border/50 hover:bg-primary/50 transition-colors" />

          {/* Viewport */}
          <Panel className="bg-[#0d0d0f] relative shadow-inner">
            <V2Viewport />
          </Panel>

          <PanelResizeHandle className="w-1 bg-border/50 hover:bg-primary/50 transition-colors" />

          {/* AI Inspector */}
          <Panel 
            defaultSize={25} 
            minSize={20} 
            maxSize={40}
            collapsible
            onCollapse={() => setRightPanelCollapsed(true)}
            onExpand={() => setRightPanelCollapsed(false)}
            className={cn("bg-[#0f0f12] border-l border-border/50", rightPanelCollapsed && "hidden")}
          >
            <InspectorPanel />
          </Panel>
        </PanelGroup>
      </main>

      <BottomBar />
    </div>
  );
};
