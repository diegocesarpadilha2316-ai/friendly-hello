/**
 * Fase 3.17 — Biblioteca de vegetação.
 */
import type { RealtimeAssetItem } from "./types";

export const REALTIME_VEGETATION: readonly RealtimeAssetItem[] = [
  { id: "veg-oliveira", label: "Oliveira", category: "arvore", widthMm: 2400, heightMm: 3200, depthMm: 2400, tags: ["mediterranea", "externa"] },
  { id: "veg-ipe", label: "Ipê Amarelo", category: "arvore", widthMm: 3200, heightMm: 5200, depthMm: 3200, tags: ["externa"] },
  { id: "veg-palmeira-areca", label: "Palmeira Areca", category: "palmeira", widthMm: 1200, heightMm: 2200, depthMm: 1200, tags: ["interna", "externa"] },
  { id: "veg-palmeira-fenix", label: "Palmeira Fênix", category: "palmeira", widthMm: 2600, heightMm: 3800, depthMm: 2600, tags: ["externa"] },
  { id: "veg-samambaia", label: "Samambaia", category: "samambaia", widthMm: 600, heightMm: 500, depthMm: 600, tags: ["interna"] },
  { id: "veg-costela", label: "Costela de Adão", category: "planta", widthMm: 900, heightMm: 1400, depthMm: 900, tags: ["interna"] },
  { id: "veg-zamioculca", label: "Zamioculca", category: "planta", widthMm: 600, heightMm: 900, depthMm: 600, tags: ["interna"] },
  { id: "veg-lavanda", label: "Lavanda", category: "planta", widthMm: 400, heightMm: 500, depthMm: 400, tags: ["externa"] },
  { id: "veg-vaso-concreto", label: "Vaso Concreto", category: "vaso", widthMm: 500, heightMm: 500, depthMm: 500, tags: ["decor"] },
  { id: "veg-vaso-terracota", label: "Vaso Terracota", category: "vaso", widthMm: 400, heightMm: 450, depthMm: 400, tags: ["decor"] },
  { id: "veg-jardim-vertical", label: "Jardim Vertical", category: "jardim", widthMm: 2000, heightMm: 2400, depthMm: 150, tags: ["interna", "externa"] },
  { id: "veg-canteiro", label: "Canteiro Baixo", category: "jardim", widthMm: 2400, heightMm: 350, depthMm: 800, tags: ["externa"] },
];