import * as THREE from 'three';

export interface PerformanceMetrics {
  fps: number;
  drawCalls: number;
  triangles: number;
  geometries: number;
  textures: number;
}

export const getPerformanceMetrics = (gl: THREE.WebGLRenderer): PerformanceMetrics => {
  const info = gl.info;
  return {
    fps: 0, // Calculado no componente
    drawCalls: info.render.calls,
    triangles: info.render.triangles,
    geometries: info.memory.geometries,
    textures: info.memory.textures,
  };
};
