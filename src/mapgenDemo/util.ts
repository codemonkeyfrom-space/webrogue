
import { TerrainType } from './TerrainType';
import { createNoise2D } from 'simplex-noise';
const noise2D = createNoise2D();

export function getNoiseValue(
  x: number, 
  y: number,
  mapWidth: number = 100,
  mapHeight: number = 100,
  baseFreq: number = 3.0,
  noiseMultiplier: number = 0.3,
  padding: number = 32
): number {

  const paddedX = (x + padding) / (mapWidth + padding * 2);
  const paddedY = (y + padding) / (mapHeight + padding * 2);

  const warpX = noise2D(paddedY * baseFreq + 800, paddedX * baseFreq + 300) * noiseMultiplier;
  const warpY = noise2D(paddedX * baseFreq + 200, paddedY * baseFreq + 1000) * noiseMultiplier;

  let value = 0;
  let amplitude = 1;
  let frequency = 1;
  let max = 0;
  const octaves = 2;

  for (let i = 0; i < octaves; i++) {
    const nx = (paddedX + warpX) * baseFreq * frequency;
    const ny = (paddedY + warpY) * baseFreq * frequency;

    value += noise2D(nx, ny) * amplitude;
    max += amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }
  return (value / max + 1) / 2; // normalized to [0,1]
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

export function downloadFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
