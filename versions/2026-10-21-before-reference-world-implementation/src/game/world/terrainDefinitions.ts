import type { TerrainKind } from './worldTypes.ts';

export type TerrainDefinition = {
  displayName: string;
  visualKey: 'sky' | 'surface' | 'soil' | 'stone' | 'deepRock';
  diggable: boolean;
};

// The new layers reuse the prototype's existing diggable-terrain flag. They do
// not define separate hardness values; digging grades remain depth-based.
export const terrainDefinitions: Record<TerrainKind, TerrainDefinition> = {
  air: { displayName: 'Luft', visualKey: 'sky', diggable: false },
  surface: { displayName: 'Oberfläche', visualKey: 'surface', diggable: false },
  soil: { displayName: 'Erde', visualKey: 'soil', diggable: true },
  topsoil: { displayName: 'Oberboden', visualKey: 'soil', diggable: true },
  stone: { displayName: 'Stein', visualKey: 'stone', diggable: true },
  compactEarth: { displayName: 'Kompakte Erde', visualKey: 'soil', diggable: true },
  clay: { displayName: 'Lehm', visualKey: 'soil', diggable: true },
  stoneLayer: { displayName: 'Steinschicht', visualKey: 'stone', diggable: true },
  deepRock: { displayName: 'Tiefengestein', visualKey: 'deepRock', diggable: true },
};
