import * as THREE from 'three';

// Materiais do Ambiente
const whiteWallMaterial = new THREE.MeshStandardMaterial({
  color: '#f8f8f7', // Branco quente
  roughness: 0.85,
  metalness: 0
});

const floorMaterial = new THREE.MeshStandardMaterial({
  color: '#dcd3c9', // Porcelanato/Bege
  roughness: 0.6,
  metalness: 0.05
});

const ceilingMaterial = new THREE.MeshStandardMaterial({
  color: '#ffffff',
  roughness: 1,
  metalness: 0
});

const woodMaterial = new THREE.MeshStandardMaterial({
  color: '#a67c52', // Carvalho claro
  roughness: 0.5,
  metalness: 0
});

// Materiais de Móveis
const cabinetWhiteMaterial = new THREE.MeshStandardMaterial({
  color: '#ffffff',
  roughness: 0.4,
  metalness: 0
});

const cabinetDarkWoodMaterial = new THREE.MeshStandardMaterial({
  color: '#4a3728',
  roughness: 0.3,
  metalness: 0
});

const glassMaterial = new THREE.MeshStandardMaterial({
  color: '#aaddff',
  transparent: true,
  opacity: 0.3,
  roughness: 0.1,
  metalness: 0.9
});

const metalBlackMaterial = new THREE.MeshStandardMaterial({
  color: '#1a1a1a',
  roughness: 0.2,
  metalness: 0.8
});

export const DiorisMaterials = {
  room: {
    wall: whiteWallMaterial,
    floor: floorMaterial,
    ceiling: ceilingMaterial,
    wood: woodMaterial
  },
  furniture: {
    white: cabinetWhiteMaterial,
    darkWood: cabinetDarkWoodMaterial,
    glass: glassMaterial,
    metalBlack: metalBlackMaterial
  }
};
