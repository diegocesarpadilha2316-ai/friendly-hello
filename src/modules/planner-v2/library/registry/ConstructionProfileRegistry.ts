import type { ConstructionProfile } from "../contracts/ConstructionProfile";
import { GOLDEN_CONSTRUCTION_PROFILES } from "../families/kitchen/constructionProfiles";

function requireNonEmpty(value: string, field: string): void {
  if (!value.trim()) throw new Error(`ConstructionProfile inválido: ${field} é obrigatório.`);
}

export class ConstructionProfileRegistryImpl {
  private readonly profiles = new Map<string, ConstructionProfile>();
  private readonly professionalDefinitionIds = new Set<string>();

  register(profile: ConstructionProfile): ConstructionProfile {
    requireNonEmpty(profile.id, "id");
    requireNonEmpty(profile.moduleDefinitionId, "moduleDefinitionId");
    if (this.profiles.has(profile.moduleDefinitionId)) {
      throw new Error(`ConstructionProfile duplicado para ${profile.moduleDefinitionId}.`);
    }
    if (!profile.carcassRule) {
      throw new Error(`ConstructionProfile ${profile.id} exige carcassRule.`);
    }
    if (profile.carcassRule.moduleDefinitionId !== profile.moduleDefinitionId) {
      throw new Error(`CarcassRule ${profile.carcassRule.id} não pertence a ${profile.moduleDefinitionId}.`);
    }
    if (profile.frontLayoutRule && profile.frontLayoutRule.moduleDefinitionId !== profile.moduleDefinitionId) {
      throw new Error(`FrontLayoutRule ${profile.frontLayoutRule.id} não pertence a ${profile.moduleDefinitionId}.`);
    }
    if (profile.hardwareApplicationRule && profile.hardwareApplicationRule.moduleDefinitionId !== profile.moduleDefinitionId) {
      throw new Error(`HardwareApplicationRule ${profile.hardwareApplicationRule.id} não pertence a ${profile.moduleDefinitionId}.`);
    }
    if (profile.drawerStackRule && profile.drawerStackRule.moduleDefinitionId !== profile.moduleDefinitionId) {
      throw new Error(`DrawerStackRule ${profile.drawerStackRule.id} não pertence a ${profile.moduleDefinitionId}.`);
    }
    if (profile.drawerBoxRule && profile.drawerBoxRule.moduleDefinitionId !== profile.moduleDefinitionId) {
      throw new Error(`DrawerBoxRule ${profile.drawerBoxRule.id} não pertence a ${profile.moduleDefinitionId}.`);
    }
    if (profile.drawerSlideApplicationRule && profile.drawerSlideApplicationRule.moduleDefinitionId !== profile.moduleDefinitionId) {
      throw new Error(`DrawerSlideApplicationRule ${profile.drawerSlideApplicationRule.id} não pertence a ${profile.moduleDefinitionId}.`);
    }
    if (profile.drawerIndustrialSlideRule && profile.drawerIndustrialSlideRule.moduleDefinitionId !== profile.moduleDefinitionId) {
      throw new Error(`DrawerIndustrialSlideRule ${profile.drawerIndustrialSlideRule.id} não pertence a ${profile.moduleDefinitionId}.`);
    }
    this.profiles.set(profile.moduleDefinitionId, profile);
    this.professionalDefinitionIds.add(profile.moduleDefinitionId);
    return profile;
  }

  registerMany(profiles: ConstructionProfile[]): void {
    for (const profile of profiles) this.register(profile);
  }

  removeForTest(moduleDefinitionId: string): ConstructionProfile | undefined {
    const profile = this.profiles.get(moduleDefinitionId);
    this.profiles.delete(moduleDefinitionId);
    return profile;
  }

  isProfessionalDefinition(moduleDefinitionId: string): boolean {
    return this.professionalDefinitionIds.has(moduleDefinitionId);
  }

  getByModuleDefinitionId(moduleDefinitionId: string): ConstructionProfile | undefined {
    return this.profiles.get(moduleDefinitionId);
  }

  getHardwareApplicationRule(moduleDefinitionId: string) {
    return this.profiles.get(moduleDefinitionId)?.hardwareApplicationRule;
  }

  has(moduleDefinitionId: string): boolean {
    return this.profiles.has(moduleDefinitionId);
  }

  list(): ConstructionProfile[] {
    return [...this.profiles.values()];
  }
}

export const ConstructionProfileRegistry = new ConstructionProfileRegistryImpl();
ConstructionProfileRegistry.registerMany(GOLDEN_CONSTRUCTION_PROFILES);
