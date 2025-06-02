import { TerrainType } from './TerrainType';

export class MapCell {
  constructor(
    public elevation: number,
    public terrain: TerrainType
  ) {}
}
