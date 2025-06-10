
import { getNoiseValue, pickTerrainFromFrequency } from './util'
import { MapCell } from './MapCell';
import { TerrainType } from './TerrainType';
export class Map {
  private cells: MapCell[][];
  private width: number;
  private height: number;
  private baseFreq: number;
  private noiseMultiplier: number;
  private terrainTypes: Record<string, TerrainType>;

  private constructor(xLen: number, yLen: number, terrainTypes: Record<string, TerrainType>, baseFreq: number, noiseMultiplier: number) {
    this.width = xLen;
    this.height = yLen;
    this.terrainTypes = terrainTypes;
    this.cells = [];
    this.baseFreq = baseFreq;
    this.noiseMultiplier = noiseMultiplier;
    this.generateMap();
  }

  static async create(xLen: number, yLen: number, terrainTypes: Record<string, TerrainType>, baseFreq: number, noiseMultiplier: number) {
    return new Map(xLen, yLen, terrainTypes, baseFreq, noiseMultiplier);
  }

  private generateMap(): void {
    const tempCells: MapCell[][] = [];
    for (let y = 0; y < this.height; y++) {
      const row: MapCell[] = [];
      for (let x = 0; x < this.width; x++) {
        const terrainKey = this.generateTerrainForCell(x, y).name;
        const terrainData = this.terrainTypes[terrainKey];
        row.push(new MapCell({ ...terrainData, name: terrainKey }));
      }
      tempCells.push(row);
    }
    this.cells = tempCells;
  }

  generateTerrainForCell(x: number, y: number): TerrainType {
    const noiseValue = getNoiseValue(x, y, this.getWidth(), this.getHeight(), this.baseFreq, this.noiseMultiplier);
    const candidates = Object.values(this.terrainTypes).filter(t => t.noiseThreshold <= noiseValue);
    if (candidates.length === 0) {
      const terrain = pickTerrainFromFrequency(noiseValue, Object.values(this.terrainTypes));
      candidates.push(terrain);
    }
    candidates.sort((a, b) => b.noiseThreshold - a.noiseThreshold);
    const noiseBasedTerrain = candidates[0];
    return noiseBasedTerrain;
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