import React from 'react';
import { usePlannerV2Store } from '../core/store';
import { PRESETS } from '../room/defaults';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, Box, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export const PropertiesPanel: React.FC = () => {
  const { roomSpec, setRoomSpec, applyPreset, errors, debug, toggleDebug } = usePlannerV2Store();

  const updateSpec = (key: string, value: any) => {
    setRoomSpec({ [key]: value });
  };

  return (
    <div className="flex flex-col h-full bg-background border-l">
      <div className="p-4 border-b flex items-center justify-between bg-muted/30">
        <div className="flex items-center gap-2">
          <Box className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-sm uppercase tracking-wider">Propriedades do Ambiente</h2>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {errors.length > 0 && (
            <Alert variant="destructive" className="py-2 px-3">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="text-xs">Atenção</AlertTitle>
              <AlertDescription className="text-[10px] leading-tight">
                {errors[0]}
              </AlertDescription>
            </Alert>
          )}

          {/* Presets */}
          <div className="space-y-3">
            <Label className="text-[10px] uppercase text-muted-foreground font-bold">Presets Rápidos</Label>
            <div className="grid grid-cols-2 gap-2">
              {Object.keys(PRESETS).map((name) => (
                <Button 
                  key={name}
                  variant={roomSpec.name === name ? "default" : "outline"}
                  size="sm"
                  className="text-[10px] h-8"
                  onClick={() => applyPreset(name)}
                >
                  {name}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <Label className="text-[10px] uppercase text-muted-foreground font-bold">Dimensões (mm)</Label>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Largura</span>
                <span className="font-mono">{roomSpec.widthMm}</span>
              </div>
              <Slider 
                value={[roomSpec.widthMm]} 
                min={500} max={10000} step={50}
                onValueChange={([val]) => updateSpec('widthMm', val)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Profundidade</span>
                <span className="font-mono">{roomSpec.depthMm}</span>
              </div>
              <Slider 
                value={[roomSpec.depthMm]} 
                min={500} max={10000} step={50}
                onValueChange={([val]) => updateSpec('depthMm', val)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Altura</span>
                <span className="font-mono">{roomSpec.heightMm}</span>
              </div>
              <Slider 
                value={[roomSpec.heightMm]} 
                min={2000} max={4000} step={50}
                onValueChange={([val]) => updateSpec('heightMm', val)}
              />
            </div>
          </div>

          <div className="space-y-4 pt-2 border-t border-dashed">
            <Label className="text-[10px] uppercase text-muted-foreground font-bold">Configurações</Label>
            
            <div className="flex items-center justify-between">
              <Label className="text-xs cursor-pointer" htmlFor="show-ceiling">Exibir Teto</Label>
              <Switch 
                id="show-ceiling"
                checked={roomSpec.showCeiling} 
                onCheckedChange={(val) => updateSpec('showCeiling', val)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-xs cursor-pointer" htmlFor="show-baseboard">Exibir Rodapés</Label>
              <Switch 
                id="show-baseboard"
                checked={roomSpec.showBaseboard} 
                onCheckedChange={(val) => updateSpec('showBaseboard', val)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-xs cursor-pointer" htmlFor="debug-mode">Modo Debug</Label>
              <Switch 
                id="debug-mode"
                checked={debug} 
                onCheckedChange={toggleDebug}
              />
            </div>
          </div>
          
          <div className="pt-4 border-t opacity-50 flex items-start gap-2">
            <Info className="w-3 h-3 mt-0.5" />
            <p className="text-[10px]">As dimensões são nominais internas. Paredes possuem espessura de 150mm por padrão.</p>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};
