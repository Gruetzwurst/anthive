import type { TerrainKind } from './worldTypes.ts';

export type TerrainDefinition = {
  displayName: string;
  visualKey: 'sky' | 'surface' | 'soil' | 'stone';
  diggable: boolean;
};

// Additional soil layers are defined as future terrain types, but the starting
// world continues to use the existing generic soil and depth-based test grades.
export const terrainDefinitions: Record<TerrainKind, TerrainDefinition> = {
  air: { displayName: 'Luft', visualKey: 'sky', diggable: false },
  surface: { displayName: 'Oberfläche', visualKey: 'surface', diggable: false },
  soil: { displayName: 'Erde', visualKey: 'soil', diggable: true },
  topsoil: { displayName: 'Oberboden', visualKey: 'soil', diggable: true },
  stone: { displayName: 'Stein', visualKey: 'stone', diggable: true },
  compactEarth: { displayName: 'Kompakte Erde', visualKey: 'soil', diggable: true },
  clay: { displayName: 'Lehm', visualKey: 'soil', diggable: true },
  stoneLayer: { displayName: 'Steinschicht', visualKey: 'stone', diggable: true },
  deepRock: { displayName: 'Tiefengestein', visualKey: 'stone', diggable: true },
};
