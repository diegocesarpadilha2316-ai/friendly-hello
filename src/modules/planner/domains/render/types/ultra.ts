/**
 * Fase 3.12 — Dioris Ultra Real Engine (tipos).
 *
 * Camada puramente descritiva: catálogos consumidos pelos providers
 * existentes (Local, IA, Nuvem, Vídeo, Marketing). Nada de motor real,
 * nada de novo store/provider — apenas metadados.
 */

// ————— Materiais Ultra —————
export type UltraWoodId =
  | "mdf"
  | "mdp"
  | "carvalho"
  | "freijo"
  | "imbuia"
  | "nogueira"
  | "louro-freijo"
  | "cumaru"
  | "tauari"
  | "jequitiba"
  | "pinus"
  | "cedro";

export type UltraStoneId = "marmore" | "quartzo" | "granito" | "limestone" | "onix" | "ardosia";

export type UltraMetalFinishId =
  "inox" | "escovado" | "cromado" | "preto-fosco" | "ouro" | "bronze" | "cobre";

export type UltraGlassId =
  "transparente" | "extra-clear" | "bronze" | "fume" | "canelado" | "reflecta";

export type UltraPaintId = "fosco" | "semi-brilho" | "alto-brilho" | "laca" | "pu";

export type UltraFabricId = "linho" | "veludo" | "suede" | "couro" | "algodao" | "boucle";

// ————— Céu / atmosfera —————
export type SkyMoodId =
  "dia" | "noite" | "nublado" | "tempestade" | "blue-hour" | "por-do-sol" | "amanhecer" | "studio";

export interface SkyPreset {
  readonly id: SkyMoodId;
  readonly label: string;
  readonly turbidity: number;
  readonly rayleigh: number;
  readonly sunElevationDeg: number;
  readonly sunAzimuthDeg: number;
  readonly luminance: number;
  readonly temperatureK: number;
  readonly hdriHint: string;
}

// ————— Lentes —————
export type LensPresetId = "24mm" | "35mm" | "50mm" | "85mm";
export interface LensPreset {
  readonly id: LensPresetId;
  readonly focalLengthMm: number;
  readonly label: string;
  readonly usage: readonly string[];
  readonly recommendedApertureF: number;
  readonly minFocusMm: number;
}

// ————— Assets 3D (arquitetura, sem binários) —————
export type VegetationKind =
  | "arvore"
  | "palmeira"
  | "arbusto"
  | "flor"
  | "planta-interna"
  | "jardim"
  | "grama"
  | "pedra-decorativa";

export interface VegetationAsset {
  readonly id: string;
  readonly kind: VegetationKind;
  readonly label: string;
  readonly heightMm: number;
  readonly tags?: readonly string[];
}

export type PeoplePose = "em-pe" | "sentado" | "caminhando" | "silhueta";

export type PeopleAgeGroup = "adulto" | "crianca";

export interface PeopleAsset {
  readonly id: string;
  readonly label: string;
  readonly age: PeopleAgeGroup;
  readonly pose: PeoplePose;
  readonly heightMm: number;
}

export type PropCategory =
  | "livros"
  | "vasos"
  | "quadros"
  | "tapetes"
  | "cortinas"
  | "persianas"
  | "tv"
  | "notebook"
  | "utensilios"
  | "loucas"
  | "sofa"
  | "poltrona"
  | "mesa"
  | "cadeira"
  | "decorativo";

export interface PropAsset {
  readonly id: string;
  readonly category: PropCategory;
  readonly label: string;
  readonly dimensionsMm: readonly [number, number, number];
  readonly tags?: readonly string[];
}

// ————— Reflexos físicos / GI / RT —————
export interface UltraFeatureFlags {
  readonly rayTracing: boolean;
  readonly pathTracing: boolean;
  readonly globalIllumination: boolean;
  readonly screenSpaceReflection: boolean;
  readonly screenSpaceGI: boolean;
  readonly denoiser: "off" | "temporal" | "oidn" | "optix" | "ai";
  readonly softShadows: boolean;
  readonly contactShadows: boolean;
  readonly rayShadows: boolean;
  readonly ambientOcclusion: boolean;
  readonly fresnel: boolean;
  readonly refraction: boolean;
  readonly realMirrors: boolean;
  readonly realGlass: boolean;
}

// ————— Performance —————
export interface PerformanceConfig {
  readonly lod: boolean;
  readonly instancing: boolean;
  readonly lazyLoading: boolean;
  readonly textureStreaming: boolean;
  readonly cache: boolean;
  readonly compression: "off" | "basisu" | "ktx2" | "dds";
  readonly gpuOptimization: boolean;
  readonly mipmaps: boolean;
  readonly maxTextureSizePx: number;
  readonly maxTrianglesPerFrame: number;
}

// ————— Hooks de IA —————
export type AiHookId =
  | "render.enhance"
  | "render.swap-materials"
  | "render.relight"
  | "render.new-scene"
  | "render.adjust-camera"
  | "render.generate-image"
  | "render.generate-video";

export interface AiHook {
  readonly id: AiHookId;
  readonly label: string;
  readonly description: string;
  readonly capability: readonly ("still" | "video" | "ai" | "marketing" | "panorama")[];
  readonly requiresProvider: readonly (
    "dioris.local" | "dioris.cloud" | "dioris.ai" | "dioris.video" | "dioris.marketing"
  )[];
}
