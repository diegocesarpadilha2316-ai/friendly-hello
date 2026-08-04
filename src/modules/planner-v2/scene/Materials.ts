import * as THREE from 'three';

// Shared materials for the Planner V2
export const MATERIALS = {
  mdf_white: new THREE.MeshStandardMaterial({
    color: '#ffffff',
    roughness: 0.1,
    metalness: 0.05,
    name: 'mdf_white'
  }),
  mdf_wood: new THREE.MeshStandardMaterial({
    color: '#a68a64',
    roughness: 0.4,
    metalness: 0,
    name: 'mdf_wood'
  }),
  mdf_taupe: new THREE.MeshStandardMaterial({
    color: '#b8afa4',
    roughness: 0.2,
    metalness: 0.05,
    name: 'mdf_taupe'
  }),
  mdf_graphite: new THREE.MeshStandardMaterial({
    color: '#3d3d3d',
    roughness: 0.3,
    metalness: 0.1,
    name: 'mdf_graphite'
  }),
  stone_light: new THREE.MeshStandardMaterial({
    color: '#e8e6e3',
    roughness: 0.15,
    metalness: 0.1,
    name: 'stone_light'
  }),
  glass: new THREE.MeshStandardMaterial({
    color: '#ffffff',
    transparent: true,
    opacity: 0.2,
    roughness: 0,
    metalness: 0.8,
    name: 'glass'
  }),
  mirror: new THREE.MeshStandardMaterial({
    color: '#ffffff',
    roughness: 0,
    metalness: 1,
    name: 'mirror'
  }),
  metal_black: new THREE.MeshStandardMaterial({
    color: '#1a1a1a',
    roughness: 0.2,
    metalness: 0.8,
    name: 'metal_black'
  }),
  inox: new THREE.MeshStandardMaterial({
    color: '#d1d1d1',
    roughness: 0.1,
    metalness: 0.9,
    name: 'inox'
  }),
  wall: new THREE.MeshStandardMaterial({
    color: '#fdfcf0', // Warm white/beige
    roughness: 0.9,
    metalness: 0,
    name: 'wall'
  }),
  floor_porcelain: new THREE.MeshStandardMaterial({
    color: '#e5e1d8',
    roughness: 0.2,
    metalness: 0.05,
    name: 'floor_porcelain'
  }),
  ceiling: new THREE.MeshStandardMaterial({
    color: '#ffffff',
    roughness: 1,
    metalness: 0,
    name: 'ceiling'
  })
};

export const getMaterial = (id: string) => {
  return (MATERIALS as any)[id] || MATERIALS.mdf_white;
};
