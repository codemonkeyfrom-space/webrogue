import { TerrainType } from './TerrainType.js';

export class MapCell {
  constructor(
    public elevation: number,
    public terrain: TerrainType
  ) {}
}
