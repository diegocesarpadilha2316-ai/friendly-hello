import React, { useState } from 'react';
import { 
  MessageSquare, 
  Info, 
  Palette, 
  Wrench, 
  Sun, 
  Send, 
  Zap,
  Maximize2,
  ChevronRight,
  Sparkles,
  History,
  Settings2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PropertiesPanel } from '../PropertiesPanel';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { usePlannerV2Store } from '../../core/store';

export const InspectorPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ia' | 'props' | 'materials' | 'hardware' | 'light'>('ia');
  const { items, selectedId } = usePlannerV2Store();
  const selectedItem = items.find(i => i.id === selectedId);

  return (
    <div className="h-full flex flex-col bg-[#0f0f12] select-none border-l border-border/50">
      {/* Tabs */}
      <div className="flex border-b border-white/5 bg-black/40 h-10 overflow-x-auto no-scrollbar">
        {[
          { id: 'ia', icon: MessageSquare, label: 'IA Copiloto' },
          { id: 'props', icon: Info, label: 'Inspetor' },
          { id: 'materials', icon: Palette, label: 'Materiais' },
          { id: 'hardware', icon: Wrench, label: 'Ferragens' },
          { id: 'light', icon: Sun, label: 'Luz' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-4 whitespace-nowrap text-[9px] font-bold uppercase tracking-widest transition-all border-b border-transparent h-full",
              activeTab === tab.id 
                ? "border-primary text-primary bg-primary/[0.03] shadow-[inset_0_-1px_0_0_#8B5CF6]" 
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-white/5"
            )}
          >
            <tab.icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-hidden flex flex-col relative">
        {activeTab === 'ia' && (
          <div className="flex flex-col h-full">
            {/* IA Context Info */}
            <div className="px-4 py-2 bg-primary/5 border-b border-primary/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(139,92,246,0.8)]" />
                <span className="text-[10px] font-bold text-primary/80 uppercase tracking-widest">IA Analisando Projeto</span>
              </div>
              <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-tighter">GPT-4 Vision</span>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-4 space-y-6">
                {/* AI Suggestion Card */}
                <div className="relative group">
                   <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-blue-500/30 rounded-lg blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
                   <div className="relative bg-[#16161d] border border-white/5 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span className="text-[11px] font-bold uppercase text-white/90">Sugestão de Layout</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed mb-4">
                        Analisei sua cozinha. Sugiro adicionar iluminação embutida no balcão superior para realçar a bancada de quartzo. Posso aplicar agora?
                      </p>
                      <div className="flex gap-2">
                        <Button size="sm" className="h-7 text-[10px] font-bold uppercase tracking-wider bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30">
                          Sim, Aplicar
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Ignorar
                        </Button>
                      </div>
                   </div>
                </div>

                {/* Chat History Placeholder */}
                <div className="flex flex-col gap-4 opacity-50">
                   <div className="flex items-start gap-3 justify-end">
                      <div className="bg-primary/10 border border-primary/20 rounded-2xl rounded-tr-none px-4 py-2 max-w-[80%]">
                         <p className="text-[11px] text-primary-foreground/90">O orçamento subiu muito com o LED?</p>
                      </div>
                   </div>
                   <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                        <Zap className="w-3 h-3 text-primary" />
                      </div>
                      <div className="bg-white/5 border border-white/5 rounded-2xl rounded-tl-none px-4 py-2 max-w-[80%]">
                         <p className="text-[11px] text-muted-foreground">Apenas R$ 340. O valor agregado visual é excelente para este projeto.</p>
                      </div>
                   </div>
                </div>
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 border-t border-border/30 bg-black/20">
              <div className="flex flex-wrap gap-2 mb-3">
                <button className="px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[9px] font-bold uppercase text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all flex items-center gap-1.5">
                  <Sun className="w-3 h-3" /> Iluminação
                </button>
                <button className="px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[9px] font-bold uppercase text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all flex items-center gap-1.5">
                   + Prateleira
                </button>
              </div>
              <div className="relative group">
                <textarea 
                  placeholder="Peça algo ao IA Copiloto..."
                  className="w-full bg-[#12121a] border border-white/[0.03] rounded-lg p-3 pr-10 text-[10px] min-h-[80px] focus:outline-none focus:border-primary/40 transition-all resize-none placeholder:text-muted-foreground/20 text-slate-200"

                />
                <button className="absolute bottom-4 right-4 p-2 rounded-lg bg-primary text-white shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="mt-3 flex items-center justify-between px-1">
                <div className="flex items-center gap-1.5">
                   <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                   <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Copilot Ativo</span>
                </div>
                <span className="text-[9px] font-bold text-primary uppercase tracking-widest">182 créditos restantes</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'props' && (
          <ScrollArea className="h-full">
            <div className="p-4 border-b border-border/30 bg-black/10 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/70">Propriedades</span>
              {selectedItem && (
                <div className="flex items-center gap-1 text-[9px] font-bold uppercase text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                  <Zap className="w-3 h-3" />
                  Paramétrico
                </div>
              )}
            </div>
            <PropertiesPanel />
          </ScrollArea>
        )}

        {activeTab !== 'ia' && activeTab !== 'props' && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/5">
               <Settings2 className="w-8 h-8 opacity-40" />
            </div>
            <span className="text-[10px] uppercase tracking-[0.2em] font-black mb-2">Painel Técnico</span>
            <p className="text-[11px] opacity-40 leading-relaxed uppercase tracking-tighter">
               Este módulo de configuração de {activeTab} está sendo carregado da engine de engenharia Dioris.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
