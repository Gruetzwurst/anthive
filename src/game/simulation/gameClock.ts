import { SIMULATION_CONFIG } from './simulationConfig.ts';
import { nonNegativeFinite, positiveFinite } from './validation.ts';

export type ClockStep = {
  elapsedGameDays: number;
  daysCrossed: number;
  totalGameDays: number;
  dayFraction: number;
};

export class GameClock {
  readonly secondsPerGameDay: number;
  private elapsedSeconds = 0;
  private compensation = 0;
  private paused = false;

  constructor(secondsPerGameDay = SIMULATION_CONFIG.secondsPerGameDay) {
    positiveFinite(secondsPerGameDay, 'secondsPerGameDay');
    this.secondsPerGameDay = secondsPerGameDay;
  }

  get totalGameDays(): number {
    return this.elapsedSeconds / this.secondsPerGameDay;
  }

  get dayFraction(): number {
    return this.totalGameDays - Math.floor(this.totalGameDays);
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
  }

  advance(realSeconds: number): ClockStep {
    nonNegativeFinite(realSeconds, 'realSeconds');
    const before = this.totalGameDays;
    const seconds = this.paused ? 0 : realSeconds;
    // Compensated summation prevents frame-sized fractions losing day boundaries.
    const corrected = seconds - this.compensation;
    const total = this.elapsedSeconds + corrected;
    nonNegativeFinite(total / this.secondsPerGameDay, 'totalGameDays');
    if (seconds > 0) {
      this.compensation = (total - this.elapsedSeconds) - corrected;
      this.elapsedSeconds = total;
    }
    return {
      elapsedGameDays: seconds / this.secondsPerGameDay,
      daysCrossed: Math.floor(this.totalGameDays) - Math.floor(before),
      totalGameDays: this.totalGameDays,
      dayFraction: this.dayFraction,
    };
  }
}
