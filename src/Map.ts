
import terrainModule from './terrainTypes.json' assert { type: 'json' };

import { getNoiseValue, pickTerrainFromFrequency } from './util.js'
import { MapCell } from './MapCell.js';
import { TerrainType } from './TerrainType.js';
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
    return new Map(xLen, yLen, terrainModule);
  }

  private getPassableTerrainTypes(): [string, TerrainType][] {
    return Object.entries(this.terrainTypes)
      .filter(([_, t]) => t.hindrance < 2);
  }

  private getRandomPassableTerrainType() {
    const passable = this.getPassableTerrainTypes();
    const randomTerrain = passable[Math.floor(Math.random() * passable.length)];
    return randomTerrain;
  }

  private generateMap(): void {
    const tempCells: MapCell[][] = [];

    for (let y = 0; y < this.height; y++) {
      const row: MapCell[] = [];
      for (let x = 0; x < this.width; x++) {
        const terrainKey = this.generateTerrainForCell(x, y).name;
        const terrainData = this.terrainTypes[terrainKey];
        row.push(new MapCell(0, { ...terrainData, name: terrainKey }));
      }
      tempCells.push(row);
    }

    this.cells = tempCells;
  }


    // Get all neighbors around (x, y) — 8-directional (including diagonals)
  getNeighbors(x: number, y: number): MapCell[] {
    const neighbors: MapCell[] = [];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue; // skip the cell itself

        const nx = x + dx;
        const ny = y + dy;

        // Check bounds
        if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
          const cell = this.cells[ny][nx];
          if (cell) {
            neighbors.push(cell);
          }
        }
      }
    }
    return neighbors;
  }

  generateTerrainForCell(x: number, y: number): TerrainType {
    const noiseValue = getNoiseValue(x, y);
    const neighbors: TerrainType[] = [];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;

        const nx = (x + dx + this.width) % this.width;
        const ny = (y + dy + this.height) % this.height;

        const neighborCell = this.getCell(nx, ny);
        if (neighborCell) {
          neighbors.push(neighborCell.terrain);
        }
      }
    }

    // Pick terrain based on noise threshold
    const candidates = Object.values(this.terrainTypes)
      .filter(t => t.noiseThreshold <= noiseValue);

    // If no candidates, fallback
    if (candidates.length === 0) {
      const terrain = pickTerrainFromFrequency(noiseValue, Object.values(this.terrainTypes));
      candidates.push(terrain);
    }

    // Sort descending by noiseThreshold to get closest below noiseValue
    candidates.sort((a, b) => b.noiseThreshold - a.noiseThreshold);
    const noiseBasedTerrain = candidates[0];

    const roll = Math.random();
    if (roll < 0.85 && neighbors.length > 0) {
      const freqMap = new globalThis.Map<string, { count: number; terrain: TerrainType }>();
      for (const t of neighbors) {
        const entry = freqMap.get(t.name);
        if (entry) {
          entry.count += 1;
        } else {
          freqMap.set(t.name, { count: 1, terrain: t });
        }
      }

      let majorityTerrain = neighbors[0];
      let maxCount = 0;
      for (const { count, terrain } of freqMap.values()) {
        if (count > maxCount) {
          maxCount = count;
          majorityTerrain = terrain;
        }
      }

      return majorityTerrain;
    } else {
      return noiseBasedTerrain;
    }
  }



  public getCell(x: number, y: number): MapCell | undefined {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
      return undefined;
    }
    return this.cells[y]?.[x];
  }

  public getWidth(): number {
    return this.width;
  }
  
  public getHeight(): number {
    return this.height;
  }
}