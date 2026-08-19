import type { ConstructionProfile } from "../contracts/ConstructionProfile";
import type { FurnitureAssemblyRule } from "../contracts/HardwareApplicationRule";
import { GOLDEN_CONSTRUCTION_PROFILES } from "../families/kitchen/constructionProfiles";
import { GOLDEN_71B3550_173H7100_RULE } from "../families/kitchen/applicationRules";

function requireNonEmpty(value: string, field: string): void {
  if (!value.trim()) throw new Error(`ConstructionProfile inválido: ${field} é obrigatório.`);
}

export class ConstructionProfileRegistryImpl {
  private readonly profiles = new Map<string, ConstructionProfile>();
  private readonly professionalDefinitionIds = new Set<string>();
  private defaultHardwareApplicationRule?: FurnitureAssemblyRule;

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
    this.profiles.set(profile.moduleDefinitionId, profile);
    this.professionalDefinitionIds.add(profile.moduleDefinitionId);
    return profile;
  }

  registerMany(profiles: ConstructionProfile[]): void {
    for (const profile of profiles) this.register(profile);
  }

  registerDefaultHardwareApplicationRule(rule: FurnitureAssemblyRule): void {
    requireNonEmpty(rule.id, "hardwareApplicationRule.id");
    if (this.defaultHardwareApplicationRule) {
      throw new Error("Default HardwareApplicationRule já registrada.");
    }
    this.defaultHardwareApplicationRule = rule;
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

  getHardwareApplicationRule(moduleDefinitionId: string): FurnitureAssemblyRule | undefined {
    const profile = this.profiles.get(moduleDefinitionId);
    return profile?.hardwareApplicationRule ?? this.defaultHardwareApplicationRule;
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
ConstructionProfileRegistry.registerDefaultHardwareApplicationRule(GOLDEN_71B3550_173H7100_RULE);
