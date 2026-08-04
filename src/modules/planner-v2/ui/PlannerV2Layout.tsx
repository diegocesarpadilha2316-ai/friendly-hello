import React, { useState } from 'react';
import { 
  ResizableHandle, 
  ResizablePanel, 
  ResizablePanelGroup 
} from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { 
  Box, 
  MessageSquare, 
  Layers, 
  Settings, 
  Maximize2, 
  Layout,
  ChevronLeft,
  ChevronRight,
  Plus,
  Zap
} from "lucide-react";
import { V2Viewport } from '../viewport/V2Viewport';
import { PropertiesPanel } from './PropertiesPanel';
import { usePlannerV2Store } from '../core/store';

export const PlannerV2Layout: React.FC = () => {
  const [showTree, setShowTree] = useState(true);
  const [showProps, setShowProps] = useState(true);
  const { roomSpec, viewMode, setViewMode, addItem } = usePlannerV2Store();
  const [focusMode, setFocusMode] = useState(false);

  return (
    <div className="flex flex-col h-screen w-full bg-background overflow-hidden text-foreground">
      {/* Header */}
      {!focusMode && (
        <header className="h-12 border-b flex items-center justify-between px-4 bg-card shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-primary">Dioris Planner V2</span>
            <span className="text-[10px] text-white bg-purple-600 px-2 py-0.5 rounded uppercase tracking-tighter animate-pulse">Etapa 4 - Parametric Furniture</span>
          </div>
          
          <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-md border">
            <Button 
              variant={viewMode === 'presentation' ? "secondary" : "ghost"} 
              size="sm" 
              className="h-7 text-[10px] px-3"
              onClick={() => setViewMode('presentation')}
            >
              Apresentação
            </Button>
            <Button 
              variant={viewMode === 'technical' ? "secondary" : "ghost"} 
              size="sm" 
              className="h-7 text-[10px] px-3"
              onClick={() => setViewMode('technical')}
            >
              Técnico
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setFocusMode(!focusMode)}>
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative">
        <ResizablePanelGroup orientation="horizontal" className="h-full w-full">
          {/* Project Tree */}
          {showTree && !focusMode && (
            <>
              <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
                <div className="h-full border-r bg-card flex flex-col">
                  <div className="p-3 border-b flex items-center justify-between">
                    <span className="text-sm font-semibold flex items-center gap-2">
                      <Layers className="w-4 h-4 text-primary" />
                      Biblioteca
                    </span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowTree(false)}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="p-4 space-y-4">
                    <div className="space-y-2">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-widest px-1 block">Cozinha</span>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start gap-3 h-14 bg-white/5 border-white/10 hover:bg-white/10 group transition-all"
                        onClick={() => addItem('one-door')}
                      >
                        <div className="w-10 h-10 rounded bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                          <Plus className="w-5 h-5 text-primary" />
                        </div>
                        <div className="text-left">
                          <div className="text-xs font-semibold">Gabinete Inferior</div>
                          <div className="text-[10px] text-muted-foreground">Cozinha V2</div>
                        </div>
                      </Button>
                    </div>
                  </div>

                  <div className="mt-auto border-t bg-black/20 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-3 h-3 text-yellow-500" />
                      <span className="text-[10px] font-bold uppercase tracking-tight">AI Assistant</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      Conectando IA na Etapa 5...<br/>
                      Use os controles manuais por enquanto.
                    </p>
                  </div>
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle />
            </>
          )}

          {/* Viewport */}
          <ResizablePanel defaultSize={showTree && showProps ? 60 : showTree || showProps ? 80 : 100}>
            <div className="h-full w-full relative group">
              {!showTree && !focusMode && (
                <Button 
                  variant="secondary" 
                  size="icon" 
                  className="absolute left-2 top-2 z-10 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => setShowTree(true)}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              )}
              
              <V2Viewport />

              {!showProps && !focusMode && (
                <Button 
                  variant="secondary" 
                  size="icon" 
                  className="absolute right-2 top-2 z-10 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => setShowProps(true)}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              )}

              {focusMode && (
                <Button 
                  variant="secondary" 
                  size="icon" 
                  className="absolute right-2 top-2 z-10 h-8 w-8"
                  onClick={() => setFocusMode(false)}
                >
                  <Layout className="w-4 h-4" />
                </Button>
              )}
            </div>
          </ResizablePanel>

          {/* Properties */}
          {showProps && !focusMode && (
            <>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
                <div className="h-full border-l bg-card flex flex-col">
                  <div className="p-3 border-b flex items-center justify-between">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowProps(false)}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                    <span className="text-sm font-semibold text-right">Propriedades</span>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <PropertiesPanel />
                  </div>
                </div>
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </main>

      {/* Footer */}
      {!focusMode && (
        <footer className="h-8 border-t flex items-center justify-between px-4 bg-card text-[10px] text-muted-foreground shrink-0 uppercase tracking-wider">
          <div className="flex items-center gap-4">
            <span>Ready</span>
            <span>FPS: 60</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Grid: 100mm</span>
            <span>Room: {roomSpec.widthMm} x {roomSpec.depthMm} x {roomSpec.heightMm}mm</span>
          </div>
        </footer>
      )}

      {/* Mobile Navigation */}
      <nav className="md:hidden h-16 border-t bg-card flex items-center justify-around shrink-0 px-2">
        <Button variant="ghost" className="flex flex-col gap-1 h-auto py-2" onClick={() => setShowTree(true)}>
          <Layers className="w-5 h-5" />
          <span className="text-[10px]">Biblioteca</span>
        </Button>
        <Button variant="ghost" className="flex flex-col gap-1 h-auto py-2 text-primary">
          <Layout className="w-5 h-5" />
          <span className="text-[10px]">Viewport</span>
        </Button>
        <Button variant="ghost" className="flex flex-col gap-1 h-auto py-2" onClick={() => setShowProps(true)}>
          <Settings className="w-5 h-5" />
          <span className="text-[10px]">Prop</span>
        </Button>
      </nav>
    </div>
  );
};
