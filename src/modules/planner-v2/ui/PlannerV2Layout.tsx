import React from 'react';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { cn } from '@/lib/utils';
import { V2Viewport } from '../viewport/V2Viewport';
import { usePlannerV2Store } from '../core/store';
import { TopBar } from '../components/TopBar';
import { BottomBar } from '../components/BottomBar';
import { SideNav } from './panels/SideNav';
import { InspectorPanel } from './panels/InspectorPanel';

export const PlannerV2Layout: React.FC = () => {
  const { leftPanelCollapsed, rightPanelCollapsed, setLeftPanelCollapsed, setRightPanelCollapsed, leftPanelWidth, rightPanelWidth, setLeftPanelWidth, setRightPanelWidth } = usePlannerV2Store();
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
    <div className="flex flex-col h-screen w-full bg-[#070709] overflow-hidden text-foreground antialiased font-sans selection:bg-primary/30">
      <TopBar />

      <main className="flex-1 overflow-hidden relative">
        <PanelGroup orientation="horizontal" id="planner-v2-main-group">
          {/* Explorer */}
          <Panel 
            id="explorer-panel"
            defaultSize={leftPanelWidth} 
            minSize={10} 
            maxSize={30}
            collapsible 
            onResize={setLeftPanelWidth}
            className={cn("bg-[#0D0D12] border-r border-white/5 transition-all duration-300 ease-in-out shadow-xl z-20")}
          >
            <SideNav />
          </Panel>
          
          <PanelResizeHandle id="explorer-resizer" className="w-1 bg-border/50 hover:bg-primary/50 transition-colors" />

          {/* Viewport */}
          <Panel id="viewport-panel" className="bg-[#0d0d0f] relative shadow-inner">
            <V2Viewport />
          </Panel>

          <PanelResizeHandle id="inspector-resizer" className="w-1 bg-border/50 hover:bg-primary/50 transition-colors" />

          {/* AI Inspector */}
          <Panel 
            id="inspector-panel"
            defaultSize={rightPanelWidth} 
            minSize={15} 
            maxSize={40}
            collapsible
            onResize={setRightPanelWidth}
            className={cn("bg-[#0D0D12] border-l border-white/5 transition-all duration-300 ease-in-out shadow-xl z-20")}
          >
            <InspectorPanel />
          </Panel>
        </PanelGroup>
      </main>

      <BottomBar />
    </div>
  );
};
