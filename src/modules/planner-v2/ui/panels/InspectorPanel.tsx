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
    <div className="h-full flex flex-col bg-[#12141C] select-none">
      {/* Tabs */}
      <div className="flex border-b border-[#2A2D3A] bg-[#171A24] h-[48px] overflow-x-auto no-scrollbar shrink-0">
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
              "flex items-center gap-2 px-4 whitespace-nowrap text-[12px] font-bold transition-all border-b-2 h-full",
              activeTab === tab.id 
                ? "border-[#6366F1] text-[#F8FAFC] bg-[#6366F1]/5" 
                : "border-transparent text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/5"
            )}
          >
            <tab.icon className={cn("w-4 h-4", activeTab === tab.id ? "text-[#6366F1]" : "text-[#94A3B8]")} />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-hidden flex flex-col relative">
        {activeTab === 'ia' && (
          <div className="flex flex-col h-full">
            {/* IA Context Info */}
            <div className="px-4 h-[38px] bg-[#6366F1]/5 border-b border-[#6366F1]/10 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#6366F1] animate-pulse" />
                <span className="text-[10px] font-bold text-[#6366F1] uppercase tracking-widest">IA Analisando Projeto</span>
              </div>
              <span className="text-[9px] text-[#94A3B8] uppercase font-bold tracking-widest">DeepSeek V3</span>
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
            <div className="p-4 border-t border-[#2A2D3A] bg-[#0D0D12]">
              <div className="flex flex-wrap gap-2 mb-3">
                <button className="px-3 py-1.5 rounded-lg bg-[#171A24] border border-[#2A2D3A] text-[10px] font-bold uppercase text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/5 transition-all flex items-center gap-1.5">
                  <Sun className="w-3 h-3" /> Iluminação
                </button>
                <button className="px-3 py-1.5 rounded-lg bg-[#171A24] border border-[#2A2D3A] text-[10px] font-bold uppercase text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/5 transition-all flex items-center gap-1.5">
                   + Prateleira
                </button>
              </div>
              <div className="relative group">
                <textarea 
                  placeholder="Comando de voz ou texto..."
                  className="w-full bg-[#0D0D12] border border-[#2A2D3A] rounded-lg p-3 pr-10 text-[13px] min-h-[100px] focus:outline-none focus:border-[#6366F1]/50 transition-all resize-none placeholder:text-[#94A3B8]/20 text-[#F8FAFC] font-medium"
                />
                <button className="absolute bottom-4 right-4 p-2 rounded-lg bg-[#6366F1] text-white shadow-lg shadow-[#6366F1]/20 hover:scale-105 active:scale-95 transition-all">
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
