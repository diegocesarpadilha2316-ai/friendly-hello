import React from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  Eye, 
  EyeOff, 
  MoreVertical, 
  Box, 
  Layout, 
  Palette, 
  Zap, 
  Wrench,
  Square as WallTower,
  Home,
  Package,
  Cpu
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePlannerV2Store } from '../../core/store';

interface ExplorerItemProps {
  level?: number;
  label: string;
  icon?: any;
  hasChildren?: boolean;
  isExpanded?: boolean;
  isVisible?: boolean;
}

const ExplorerItem: React.FC<ExplorerItemProps> = ({ 
  level = 0, 
  label, 
  icon: Icon, 
  hasChildren = false, 
  isExpanded = false,
  isVisible = true 
}) => {
  return (
    <div 
      className={cn(
        "group flex items-center h-[36px] hover:bg-[#1b1f2a] cursor-pointer text-[12px] text-[#F8FAFC] transition-all duration-150 border-b border-white/[0.02]",
        level > 0 && "child"
      )}
      style={{ paddingLeft: level > 0 ? '32px' : '16px' }}
    >
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        {hasChildren ? (
          isExpanded ? <ChevronDown className="w-3 h-3 shrink-0" /> : <ChevronRight className="w-3 h-3 shrink-0" />
        ) : (
          <div className="w-3" />
        )}
        
        {Icon && <Icon className="w-3.5 h-3.5 shrink-0 text-primary/70" />}
        <span className="truncate font-medium tracking-tight uppercase">{label}</span>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pr-1">
        <button className="p-1 hover:text-primary transition-colors">
          {isVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
        </button>
        <button className="p-1 hover:text-primary transition-colors">
          <MoreVertical className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

export const SideNav: React.FC = () => {
  const { items } = usePlannerV2Store();

  return (
    <div className="h-full flex flex-col bg-[#12141C] select-none">
      {/* Header */}
      <div className="h-12 px-4 flex items-center justify-between border-b border-[#2A2D3A] bg-[#171A24] shrink-0">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6366F1]">Explorer</span>
        <div className="flex items-center gap-1">
          <button className="p-1.5 hover:bg-white/5 rounded transition-colors">
            <Layout className="w-3.5 h-3.5 text-[#94A3B8]" />
          </button>
        </div>
      </div>

      {/* Explorer Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar py-0">
        <ExplorerItem label="Projeto Atual" icon={Home} hasChildren isExpanded />
        
        <div className="border-b border-white/[0.03] mb-1">
          <ExplorerItem level={1} label="Paredes" icon={WallTower} hasChildren />
          <ExplorerItem level={1} label="Piso" icon={Layout} />
          <ExplorerItem level={1} label="Teto" icon={Box} />
        </div>

        <ExplorerItem label="Mobiliário" icon={Package} hasChildren isExpanded />
        
        <div className="border-b border-white/[0.03] mb-1">
          {items.length === 0 ? (
             <div className="px-10 py-3 text-[10px] text-[#94A3B8]/40 italic uppercase tracking-widest font-bold">
                Cena vazia
             </div>
          ) : (
            items.map(item => (
              <ExplorerItem 
                key={item.id} 
                level={1} 
                label={`${item.family}`} 
                icon={Box} 
              />
            ))
          )}
        </div>

        <ExplorerItem label="Materiais" icon={Palette} hasChildren />
        <ExplorerItem label="Iluminação" icon={Zap} hasChildren />
        <ExplorerItem label="Engenharia" icon={Wrench} hasChildren />
        <ExplorerItem label="Automação" icon={Cpu} hasChildren />
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-[#2A2D3A] bg-black/10">
        <div className="flex items-center justify-between text-[9px] text-muted-foreground font-bold uppercase tracking-widest">
          <span>Itens: {items.length}</span>
          <span>V2.4.0</span>
        </div>
      </div>
    </div>
  );
};
