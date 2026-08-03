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
  Info
} from "lucide-react";
import { V2Viewport } from '../viewport/V2Viewport';

export const PlannerV2Layout: React.FC = () => {
  const [showTree, setShowTree] = useState(true);
  const [showChat, setShowChat] = useState(true);
  const [focusMode, setFocusMode] = useState(false);

  return (
    <div className="flex flex-col h-screen w-full bg-background overflow-hidden text-foreground">
      {/* Header */}
      {!focusMode && (
        <header className="h-12 border-b flex items-center justify-between px-4 bg-card shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-primary">Planner V2 — Protótipo</span>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">BETA</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground italic">
            <Info className="w-3 h-3" />
            Este módulo está isolado do Planner atual e não altera seus projetos.
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setFocusMode(!focusMode)}>
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative">
        <ResizablePanelGroup direction="horizontal" className="h-full w-full">
          {/* Project Tree */}
          {showTree && !focusMode && (
            <>
              <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
                <div className="h-full border-r bg-card flex flex-col">
                  <div className="p-3 border-b flex items-center justify-between">
                    <span className="text-sm font-semibold">Árvore do Projeto</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowTree(false)}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex-1 p-4 text-sm text-muted-foreground">
                    Ambiente Vazio
                  </div>
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle />
            </>
          )}

          {/* Viewport */}
          <ResizablePanel defaultSize={showTree && showChat ? 60 : showTree || showChat ? 80 : 100}>
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

              {!showChat && !focusMode && (
                <Button 
                  variant="secondary" 
                  size="icon" 
                  className="absolute right-2 top-2 z-10 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => setShowChat(true)}
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

          {/* Chat */}
          {showChat && !focusMode && (
            <>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
                <div className="h-full border-l bg-card flex flex-col">
                  <div className="p-3 border-b flex items-center justify-between">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowChat(false)}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                    <span className="text-sm font-semibold text-right">IA Assistant</span>
                  </div>
                  <div className="flex-1 flex flex-col justify-end p-4">
                     <div className="bg-muted p-3 rounded-lg text-sm mb-4">
                       Olá! Este é o novo motor do Planner V2. Como posso ajudar?
                     </div>
                     <div className="h-10 border rounded px-3 flex items-center text-sm text-muted-foreground bg-background">
                       Digite sua mensagem...
                     </div>
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
            <span>Objects: 0</span>
          </div>
        </footer>
      )}

      {/* Mobile Navigation */}
      <nav className="md:hidden h-16 border-t bg-card flex items-center justify-around shrink-0 px-2">
        <Button variant="ghost" className="flex flex-col gap-1 h-auto py-2">
          <Box className="w-5 h-5" />
          <span className="text-[10px]">Projeto</span>
        </Button>
        <Button variant="ghost" className="flex flex-col gap-1 h-auto py-2 text-primary">
          <Layers className="w-5 h-5" />
          <span className="text-[10px]">3D</span>
        </Button>
        <Button variant="ghost" className="flex flex-col gap-1 h-auto py-2">
          <MessageSquare className="w-5 h-5" />
          <span className="text-[10px]">IA</span>
        </Button>
        <Button variant="ghost" className="flex flex-col gap-1 h-auto py-2">
          <Settings className="w-5 h-5" />
          <span className="text-[10px]">Prop</span>
        </Button>
      </nav>
    </div>
  );
};
