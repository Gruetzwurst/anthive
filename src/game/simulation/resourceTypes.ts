import type { ResourceKind, WorldPoint } from '../world/worldTypes.ts';

export type ResourceAmount = { resource: ResourceKind; amount: number };

type ResourceLocation = { id: string; resource: ResourceKind; position: WorldPoint };

export type FiniteSourceDefinition = ResourceLocation & {
  kind: 'finite';
  capacity: number;
  amount: number;
  regenerationPerDay: number;
  recoveryDays: number;
};

export type UnlimitedSource = ResourceLocation & { kind: 'unlimited' };
export type SourceDefinition = FiniteSourceDefinition | UnlimitedSource;
export type ResourceSource = (FiniteSourceDefinition & { recoveryDaysLeft: number }) | UnlimitedSource;

export type StoreStatus = 'planned' | 'excavated' | 'furnishing' | 'operational';
export type ResourceStore = ResourceLocation & {
  capacity: number;
  amount: number;
  status: StoreStatus;
  reachable: boolean;
};
