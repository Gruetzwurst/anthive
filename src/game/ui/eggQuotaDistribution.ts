import {SPECIALIZATIONS} from '../simulation/workforceSystem.ts';
import type {Specialization} from '../simulation/workforceSystem.ts';
import type {EggQuotas} from '../simulation/queenSystem.ts';

/** Redistribute hundredths using largest remainders so the model always receives 100%. */
export function redistributeEggQuotas(current: EggQuotas, edited: Specialization, value: number): EggQuotas {
  if (!SPECIALIZATIONS.includes(edited) || !Number.isFinite(value) || value < 0 || value > 100
    || SPECIALIZATIONS.some(kind => !Number.isFinite(current[kind]) || current[kind] < 0 || current[kind] > 100)) throw new RangeError('Ungültiger Zielanteil');
  const units = Math.round(value * 100), rest = 10000 - units;
  const others = SPECIALIZATIONS.filter(kind => kind !== edited);
  const total = others.reduce((sum, kind) => sum + current[kind], 0);
  const shares = others.map(kind => {
    const exact = rest * (total ? current[kind] / total : 1 / others.length);
    return {kind, units: Math.floor(exact), remainder: exact - Math.floor(exact)};
  });
  let missing = rest - shares.reduce((sum, share) => sum + share.units, 0);
  for (const share of [...shares].sort((a, b) => b.remainder - a.remainder)) if (missing-- > 0) share.units++;
  return Object.fromEntries([[edited, units / 100], ...shares.map(share => [share.kind, share.units / 100])]) as EggQuotas;
}
