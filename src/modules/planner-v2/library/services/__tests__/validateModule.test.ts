import { describe, it, expect } from 'vitest';
import { validateModule, type ValidateModuleInput } from '../validateModule';
import { MaterialRegistry } from '../../registry/MaterialRegistry';
import { HardwareRegistry } from '../../registry/HardwareRegistry';

// Mock minimal ModuleDefinition
const mockDefinition = {
  id: 'test-cabinet',
  familyId: 'generic',
  name: 'Test Cabinet',
  description: 'Test',
  thumbnail: '',
  minDimensionsMm: { width: 100, height: 100, depth: 100 },
  maxDimensionsMm: { width: 2000, height: 2000, depth: 1000 },
  defaultDimensionsMm: { width: 600, height: 720, depth: 580 },
  placementRules: { floorMounted: true, wallMounted: false, minHeightFromFloorMm: 0 },
} as any;

describe('validateModule', () => {
  it('should pass with a valid configuration', () => {
    const input: ValidateModuleInput = {
      definition: mockDefinition,
      dimensionsMm: { width: 600, height: 720, depth: 580 },
      parts: [
        {
          id: 'base-1',
          name: 'Base',
          materialId: 'mdf-white',
          dimensionsMm: { width: 600, height: 18, depth: 580 },
          positionMm: { x: 0, y: 9, z: 0 },
          rotationDeg: { x: 0, y: 0, z: 0 },
          role: 'base',
          moduleId: 'test-instance'
        }
      ],
      hardwareIds: ['screw-fixation']
    };

    const result = validateModule(input);
    if (!result.valid) {
      console.log('Validation Errors:', JSON.stringify(result.errors, null, 2));
    }
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should fail if dimensions are out of bounds', () => {
    const input: ValidateModuleInput = {
      definition: mockDefinition,
      dimensionsMm: { width: 50, height: 720, depth: 580 }, // below min width
      parts: []
    };

    const result = validateModule(input);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.code === 'dimension-below-min')).toBe(true);
  });

  it('should fail if parts are missing', () => {
    const input: ValidateModuleInput = {
      definition: mockDefinition,
      dimensionsMm: { width: 600, height: 720, depth: 580 },
      parts: []
    };

    const result = validateModule(input);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.code === 'no-parts')).toBe(true);
  });

  it('should fail for invalid material', () => {
    const input: ValidateModuleInput = {
      definition: mockDefinition,
      dimensionsMm: { width: 600, height: 720, depth: 580 },
      parts: [
        {
          id: 'base-1',
          name: 'Base',
          materialId: 'invalid-mat',
          dimensionsMm: { width: 600, height: 18, depth: 580 },
          positionMm: { x: 0, y: 9, z: 0 },
          rotationDeg: { x: 0, y: 0, z: 0 },
          role: 'base',
          moduleId: 'test-instance'
        }
      ]
    };

    const result = validateModule(input);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.code === 'invalid-material')).toBe(true);
  });

  it('should validate door and drawer configuration', () => {
    const input: ValidateModuleInput = {
      definition: mockDefinition,
      dimensionsMm: { width: 600, height: 720, depth: 580 },
      parts: [
        {
          id: 'door-1',
          name: 'Door',
          materialId: 'mdf-white',
          dimensionsMm: { width: 300, height: 720, depth: 18 },
          positionMm: { x: 0, y: 360, z: 300 },
          rotationDeg: { x: 0, y: 0, z: 0 },
          role: 'door',
          moduleId: 'test-instance',
          interactive: { type: 'door', maxOpenAngleDeg: 90 } // Missing hingeSide
        }
      ]
    };

    const result = validateModule(input);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.code === 'door-without-hinge')).toBe(true);
  });

  it('should validate collision with room bounds', () => {
    const input: ValidateModuleInput = {
      definition: mockDefinition,
      dimensionsMm: { width: 600, height: 720, depth: 580 },
      parts: [
        {
          id: 'p1',
          name: 'Part',
          materialId: 'mdf-white',
          dimensionsMm: { width: 100, height: 100, depth: 100 },
          positionMm: { x: 0, y: 50, z: 0 },
          rotationDeg: { x: 0, y: 0, z: 0 },
          role: 'base',
          moduleId: 'test-instance'
        }
      ],
      positionMm: { x: 3000, y: 0, z: 0 }, // Far outside room
      room: { widthMm: 4500, heightMm: 2700, depthMm: 3500 }
    };

    const result = validateModule(input);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.code === 'module-outside-room')).toBe(true);
  });
});
