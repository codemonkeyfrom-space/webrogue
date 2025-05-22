
import { TerrainType } from './TerrainType.js';
import { createNoise2D } from 'simplex-noise';
const noise2D = createNoise2D();

export function getNoiseValue(x: number, y: number): number {
  const rotatedX = x;
  const rotatedY = y;

  const baseFreq = 0.02; // lowered frequency to get bigger features

  const NOISE_MULTIPLIER = 0.05;
  const warpX = noise2D(rotatedY * baseFreq + 800, rotatedX * baseFreq + 300) * NOISE_MULTIPLIER;
  const warpY = noise2D(rotatedX * baseFreq + 200, rotatedY * baseFreq + 1000) * NOISE_MULTIPLIER;

  let value = 0;
  let amplitude = 1;
  let frequency = 1;
  let max = 0;
  const octaves = 2; // fewer octaves

  for (let i = 0; i < octaves; i++) {
    const nx = (rotatedX + warpX) * baseFreq * frequency;
    const ny = (rotatedY + warpY) * baseFreq * frequency;

    value += noise2D(nx, ny) * amplitude;
    max += amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }

  return value / max;
}

export function pickTerrainFromFrequency(noiseValue: number, terrainTypes: TerrainType[]): TerrainType {
  // Normalize frequencies to a cumulative range [0, 1]
  const total = terrainTypes.reduce((sum, t) => sum + t.frequency, 0);
  const normalized = terrainTypes.map(t => ({
    ...t,
    weight: t.frequency / total,
  }));

  // Create a cumulative distribution
  let cumulative = 0;
  const ranges = normalized.map(t => {
    const entry = { ...t, min: cumulative, max: cumulative + t.weight };
    cumulative += t.weight;
    return entry;
  });
  return ranges.find(t => noiseValue >= t.min && noiseValue < t.max) ?? ranges[ranges.length - 1];

}

export function getDirectionName(dx: number, dy: number): string {
  const map: Record<string, string> = {
    "-1,-1": "northwest",
    "0,-1": "north",
    "1,-1": "northeast",
    "-1,0": "west",
    "0,0": "wait",
    "1,0": "east",
    "-1,1": "southwest",
    "0,1": "south",
    "1,1": "southeast",
  };
  return map[`${dx},${dy}`] || `move ${dx},${dy}`;
}
