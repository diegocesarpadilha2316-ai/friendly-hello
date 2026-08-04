import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  MessageSquare, Info, Palette, Wrench, Sun, Settings2, Send, Zap
} from 'lucide-react';
import { PropertiesPanel } from '../PropertiesPanel';
import { ScrollArea } from '@/components/ui/scroll-area';

export const InspectorPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ia' | 'props' | 'materials' | 'hardware' | 'light'>('ia');

  return (
    <div className="w-96 h-full border-l bg-card/80 backdrop-blur-md flex flex-col shrink-0 select-none">
      <div className="flex border-b">
        {[
          { id: 'ia', icon: MessageSquare, label: 'IA Copiloto' },
          { id: 'props', icon: Info, label: 'Inspetor' },
          { id: 'materials', icon: Palette, label: 'Acabamentos' },
          { id: 'hardware', icon: Wrench, label: 'Engenharia' },
          { id: 'light', icon: Sun, label: 'Luz' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-3 text-[9px] font-bold uppercase tracking-tighter transition-colors border-b-2 ${
              activeTab === tab.id ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-muted-foreground hover:bg-muted/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === 'ia' && (
          <div className="flex flex-col h-full bg-black/10">
            <div className="p-4 border-b bg-muted/20">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Dioris AI Assistant</span>
              </div>
              <p className="text-[9px] text-muted-foreground leading-tight">
                Assistente profissional de projeto e marcenaria.
              </p>
            </div>
            
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-[11px] leading-relaxed text-primary-foreground/90">
                  Olá! Sou o especialista Dioris. Posso ajudar você a planejar o ambiente, calcular peças ou sugerir materiais. Como posso auxiliar hoje?
                </div>
              </div>
            </ScrollArea>

            <div className="p-4 border-t bg-muted/20">
              <div className="relative">
                <textarea 
                  placeholder="Descreva sua intenção..."
                  className="w-full bg-background border border-border/50 rounded-md p-3 text-xs min-h-[80px] focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
                />
                <Button size="icon" className="absolute bottom-2 right-2 h-7 w-7 rounded-full">
                  <Send className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'props' && (
          <ScrollArea className="h-full">
            <PropertiesPanel />
          </ScrollArea>
        )}

        {activeTab !== 'ia' && activeTab !== 'props' && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2 opacity-30">
            <Settings2 className="w-8 h-8" />
            <span className="text-[9px] uppercase tracking-widest">Painel em Desenvolvimento</span>
          </div>
        )}
      </div>
    </div>
  );
};
