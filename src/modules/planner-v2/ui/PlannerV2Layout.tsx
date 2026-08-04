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
      <div className="flex flex-col h-screen w-full bg-[#0A0B10] overflow-hidden text-[#F8FAFC] antialiased selection:bg-[#6366F1]/30">
        <TopBar />
        <main className="flex-1 relative overflow-hidden bg-[#111]">
          <V2Viewport />
          
          {/* Mobile Overlay Controls */}
          <div className="absolute top-4 left-4 z-40">
             <button className="w-10 h-10 rounded-lg bg-[#12141C]/90 border border-[#2A2D3A] backdrop-blur-md flex items-center justify-center text-[#F8FAFC] shadow-xl">
                <div className="w-5 h-5 flex flex-col justify-center gap-1.5">
                   <div className="h-0.5 w-full bg-current rounded-full" />
                   <div className="h-0.5 w-full bg-current rounded-full" />
                   <div className="h-0.5 w-full bg-current rounded-full" />
                </div>
             </button>
          </div>
          
          <div className="absolute bottom-6 right-6 z-40">
             <button className="w-14 h-14 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#6366F1] flex items-center justify-center text-white shadow-[0_8px_25px_rgba(99,102,241,0.5)] border border-white/20">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>
             </button>
          </div>
        </main>
        <BottomBar />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full bg-[#0A0B10] overflow-hidden text-[#F8FAFC] antialiased font-sans selection:bg-[#6366F1]/30">
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
            className={cn("bg-[#12141C] border-r border-[#2A2D3A] transition-all duration-300 ease-in-out shadow-xl z-20 overflow-hidden flex flex-col")}
          >
            <SideNav />
          </Panel>
          
          <PanelResizeHandle id="explorer-resizer" className="w-[2px] bg-[#2A2D3A] hover:bg-[#6366F1]/50 transition-colors cursor-col-resize" />

          {/* Viewport */}
          <Panel id="viewport-panel" className="bg-[#0A0B10] relative shadow-inner overflow-hidden flex-1">
            <V2Viewport />
          </Panel>

          <PanelResizeHandle id="inspector-resizer" className="w-[2px] bg-[#2A2D3A] hover:bg-[#6366F1]/50 transition-colors cursor-col-resize" />

          {/* AI Inspector */}
          <Panel 
            id="inspector-panel"
            defaultSize={rightPanelWidth} 
            minSize={15} 
            maxSize={40}
            collapsible
            onResize={setRightPanelWidth}
            className={cn("bg-[#12141C] border-l border-[#2A2D3A] transition-all duration-300 ease-in-out shadow-xl z-20 overflow-hidden flex flex-col")}
          >
            <InspectorPanel />
          </Panel>
        </PanelGroup>
      </main>

      <BottomBar />
    </div>
  );
};
