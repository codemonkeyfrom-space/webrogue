import { MapCell } from './MapCell.js';
import { TerrainType } from './TerrainType.js';
const NOISE_WEIGHT = 0.08;
export class Map {
  private cells: MapCell[][];
  private width: number;
  private height: number;
  private terrainTypes: Record<string, TerrainType>;


  private constructor(xLen: number, yLen: number, terrainTypes: Record<string, TerrainType>) {
    this.width = xLen;
    this.height = yLen;
    this.terrainTypes = terrainTypes;
    this.cells = [];
    this.generateMap();
  }

  static async create(xLen: number, yLen: number) {
    const terrainModule = await import('./terrainTypes.json', { with: { type: 'json' } });
    return new Map(xLen, yLen, terrainModule.default);
  }

  private getPassableTerrainTypes() {
    const passableTerrainTypes = Object.entries(this.terrainTypes)
      .filter(([_, t]) => t.hindrance < 2);
    return passableTerrainTypes;
  }

  private getRandomPassableTerrainType() {
    const terrainKeys = this.getPassableTerrainTypes().map(([key, _]) => key);
    const randomTerrainKey = terrainKeys[Math.floor(Math.random() * terrainKeys.length)];
    const randomTerrain = this.terrainTypes[randomTerrainKey];
    return randomTerrain;
  }

  private generateMap(): void {
    const noiseMap: number[][] = [];
    for (let y = 0; y < this.height; y++) {
      const row: number[] = [];
      for (let x = 0; x < this.width; x++) {
        row.push(Math.random()); // noise from 0 to 1
      }
      noiseMap.push(row);
    }

    for (let y = 0; y < this.height; y++) {
      const row: MapCell[] = [];
      for (let x = 0; x < this.width; x++) {

        const randomTerrainKey = this.generateTerrainForCell(x, y, noiseMap[y][x]);

        const terrainData = this.terrainTypes[randomTerrainKey];
        row.push(new MapCell(0, { ...terrainData, name: randomTerrainKey }));

      }
      this.cells.push(row);
    }
  }

  private generateTerrainForCell(cellX: number, cellY: number, noise: number): string {

    const terrainKeys = Object.keys(this.terrainTypes);
    const terrainCounts: Record<string, number> = {};

    // Count neighbors
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue;
        const neighbor = this.getCell(cellX + dx, cellY + dy);
        const name = neighbor?.terrain?.name;
        if (name) {
          terrainCounts[name] = (terrainCounts[name] || 0) + 1;
        }
      }
    }

    // Mix with noise
    const weightedEntries = terrainKeys.map((key, index) => {
      const count = terrainCounts[key] || 0;
      const weight = count + noise * NOISE_WEIGHT;
      return { key, weight };
    });

    // Normalize
    const totalWeight = weightedEntries.reduce((sum, t) => sum + t.weight, 0);
    let r = Math.random() * totalWeight;
    for (const entry of weightedEntries) {
      if (r < entry.weight) return entry.key;
      r -= entry.weight;
    }

    // Fallback
    return terrainKeys[0];

  }


  public getCell(x: number, y: number): MapCell | undefined {
    return this.cells[y]?.[x];
  }

  public getWidth(): number {
    return this.width;
  }
  
  public getHeight(): number {
    return this.height;
  }
}