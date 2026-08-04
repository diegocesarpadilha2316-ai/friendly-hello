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
        "group flex items-center h-7 px-2 hover:bg-white/[0.03] cursor-pointer text-[10px] text-muted-foreground/80 hover:text-white transition-all duration-150 border-l-2 border-transparent",
        level > 0 && "ml-4 border-l border-white/5"
      )}
      style={{ paddingLeft: `${level * 6 + 6}px` }}
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
    <div className="h-full flex flex-col bg-[#12141C] select-none border-r border-[#2A2D3A]">
      {/* Header */}
      <div className="h-10 px-4 flex items-center justify-between border-b border-border/30 bg-black/20">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/80">Projeto</span>
        <div className="flex items-center gap-1">
          <button className="p-1.5 hover:bg-white/5 rounded transition-colors">
            <Layout className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Explorer Content */}
      <div className="flex-1 overflow-y-auto py-2">
        <ExplorerItem label="Ambiente Principal" icon={Home} hasChildren isExpanded />
        
        <div className="mb-2">
          <ExplorerItem level={1} label="Paredes" icon={WallTower} hasChildren />
          <ExplorerItem level={1} label="Piso" icon={Layout} />
          <ExplorerItem level={1} label="Teto" icon={Box} />
        </div>

        <ExplorerItem label="Mobiliário" icon={Package} hasChildren isExpanded />
        
        <div className="mb-2">
          {items.length === 0 ? (
             <div className="px-8 py-2 text-[10px] text-muted-foreground italic opacity-50 uppercase tracking-tighter">
                Nenhum móvel inserido
             </div>
          ) : (
            items.map(item => (
              <ExplorerItem 
                key={item.id} 
                level={1} 
                label={`${item.family} ${item.variant || ''}`} 
                icon={Box} 
              />
            ))
          )}
        </div>

        <ExplorerItem label="Acabamentos" icon={Palette} hasChildren />
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
