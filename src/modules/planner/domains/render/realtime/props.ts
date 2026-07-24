/**
 * Fase 3.17 — Biblioteca de objetos decorativos.
 */
import type { RealtimeAssetItem } from "./types";

export const REALTIME_PROPS: readonly RealtimeAssetItem[] = [
  { id: "prop-livros-3", label: "Pilha de Livros", category: "livros", widthMm: 250, heightMm: 90, depthMm: 180, tags: ["decor"] },
  { id: "prop-livros-linha", label: "Livros em Fila", category: "livros", widthMm: 600, heightMm: 240, depthMm: 200, tags: ["decor"] },
  { id: "prop-copo-agua", label: "Copo de Água", category: "copos", widthMm: 80, heightMm: 120, depthMm: 80, tags: ["cozinha"] },
  { id: "prop-taca-vinho", label: "Taça de Vinho", category: "copos", widthMm: 85, heightMm: 220, depthMm: 85, tags: ["cozinha"] },
  { id: "prop-prato-raso", label: "Prato Raso", category: "pratos", widthMm: 260, heightMm: 25, depthMm: 260, tags: ["cozinha"] },
  { id: "prop-prato-fundo", label: "Prato Fundo", category: "pratos", widthMm: 240, heightMm: 55, depthMm: 240, tags: ["cozinha"] },
  { id: "prop-panela-inox", label: "Panela Inox", category: "panelas", widthMm: 260, heightMm: 150, depthMm: 260, tags: ["cozinha", "inox"] },
  { id: "prop-frigideira", label: "Frigideira", category: "panelas", widthMm: 300, heightMm: 60, depthMm: 300, tags: ["cozinha"] },
  { id: "prop-quadro-p", label: "Quadro Pequeno", category: "quadros", widthMm: 400, heightMm: 500, depthMm: 30, tags: ["decor"] },
  { id: "prop-quadro-m", label: "Quadro Médio", category: "quadros", widthMm: 800, heightMm: 1000, depthMm: 40, tags: ["decor"] },
  { id: "prop-quadro-g", label: "Quadro Grande", category: "quadros", widthMm: 1400, heightMm: 900, depthMm: 45, tags: ["decor"] },
  { id: "prop-almofada-q", label: "Almofada Quadrada", category: "almofadas", widthMm: 500, heightMm: 150, depthMm: 500, tags: ["decor", "tecido"] },
  { id: "prop-almofada-l", label: "Almofada Lombar", category: "almofadas", widthMm: 600, heightMm: 150, depthMm: 350, tags: ["decor", "tecido"] },
  { id: "prop-tapete-2x3", label: "Tapete 2x3m", category: "tapetes", widthMm: 2000, heightMm: 20, depthMm: 3000, tags: ["decor", "tecido"] },
  { id: "prop-tapete-3x4", label: "Tapete 3x4m", category: "tapetes", widthMm: 3000, heightMm: 20, depthMm: 4000, tags: ["decor", "tecido"] },
  { id: "prop-cortina-linho", label: "Cortina Linho", category: "cortinas", widthMm: 2400, heightMm: 2700, depthMm: 80, tags: ["tecido"] },
  { id: "prop-cortina-blackout", label: "Cortina Blackout", category: "cortinas", widthMm: 2800, heightMm: 2700, depthMm: 100, tags: ["tecido"] },
  { id: "prop-espelho-red", label: "Espelho Redondo", category: "espelhos", widthMm: 800, heightMm: 800, depthMm: 40, tags: ["decor"] },
  { id: "prop-espelho-oval", label: "Espelho Oval", category: "espelhos", widthMm: 700, heightMm: 1000, depthMm: 40, tags: ["decor"] },
  { id: "prop-vaso-decor", label: "Vaso Decorativo", category: "decor", widthMm: 250, heightMm: 400, depthMm: 250, tags: ["decor"] },
  { id: "prop-luminaria-mesa", label: "Luminária de Mesa", category: "decor", widthMm: 300, heightMm: 500, depthMm: 300, tags: ["luz"] },
  { id: "prop-luminaria-piso", label: "Luminária de Piso", category: "decor", widthMm: 400, heightMm: 1600, depthMm: 400, tags: ["luz"] },
  { id: "prop-bandeja", label: "Bandeja Decor", category: "decor", widthMm: 500, heightMm: 40, depthMm: 300, tags: ["decor"] },
  { id: "prop-relogio-parede", label: "Relógio de Parede", category: "decor", widthMm: 400, heightMm: 400, depthMm: 60, tags: ["decor"] },
];