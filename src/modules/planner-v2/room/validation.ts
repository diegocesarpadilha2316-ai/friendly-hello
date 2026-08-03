import { RoomSpec } from './types';

export function validateRoomSpec(spec: RoomSpec): string[] {
  const errors: string[] = [];
  if (spec.widthMm < 500) errors.push('Largura mínima de 500mm');
  if (spec.depthMm < 500) errors.push('Profundidade mínima de 500mm');
  if (spec.heightMm < 2000) errors.push('Altura mínima de 2000mm');
  if (spec.wallThicknessMm <= 0) errors.push('Espessura da parede deve ser positiva');
  
  return errors;
}
