
import { downloadFile } from './util';
import { Map } from './Map';
import { TerrainType } from './TerrainType';
window.addEventListener('DOMContentLoaded', async () => {
  try {
    await go();
  } catch (e) {
    console.error("Error handling DomContentLoaded: ", e);
  }
});

console.log("what");
async function go() {
  console.log("go");
  const canvas = document.getElementById("canvas") as HTMLCanvasElement;
  if (!canvas) throw new Error("Canvas element not found");
  const ctx = canvas.getContext("2d")!;

  const rngCellSize = document.getElementById("rngCellSize") as HTMLInputElement;
  const spnCellSize = document.getElementById("spnCellSize") as HTMLInputElement;

  spnCellSize.textContent = rngCellSize.value;
  rngCellSize.addEventListener('input', () => {
    spnCellSize.textContent = rngCellSize.value;
    saveSettings();
  });

  const rngMapSize = document.getElementById("rngMapSize") as HTMLInputElement;
  const spnMapSize = document.getElementById("spnMapSize") as HTMLInputElement;

  spnMapSize.textContent = rngMapSize.value;
  rngMapSize.addEventListener('input', () => {
    spnMapSize.textContent = rngMapSize.value;
    saveSettings();
  });

  const txtBaseFreq = document.getElementById("txtBaseFreq") as HTMLInputElement;
  const txtNoiseMultiplier = document.getElementById("txtNoiseMultiplier") as HTMLInputElement;

  function deleteSettings() {
    localStorage.removeItem("cellWidth");
    localStorage.removeItem("cellHeight");
    localStorage.removeItem("mapWidth");
    localStorage.removeItem("mapHeight");
    localStorage.removeItem("baseFreq");
    localStorage.removeItem("noiseMultiplier");
    for (let i=1;i<=8;i++){
      const glyphId = `txtTerrain${i}Glyph`;
      const fgId = `txtTerrain${i}Color`;
      const noiseId = `txtTerrain${i}NoiseThreshold`;
      localStorage.removeItem(glyphId);
      localStorage.removeItem(fgId);
      localStorage.removeItem(noiseId);
    }
  }

  function loadSettings() {
    rngCellSize.value = localStorage.getItem("cellSize") || rngCellSize.value;
    rngMapSize.value = localStorage.getItem("mapSize") || rngMapSize.value;
    txtBaseFreq.value = localStorage.getItem("baseFreq") || txtBaseFreq.value;
    txtNoiseMultiplier.value = localStorage.getItem("noiseMultiplier") || txtNoiseMultiplier.value;

    for (let i=1;i<=8;i++){
      const glyphId = `txtTerrain${i}Glyph`;
      const fgId = `txtTerrain${i}Color`;
      const noiseId = `txtTerrain${i}NoiseThreshold`;
      let txtGlyph = document.getElementById(glyphId) as HTMLInputElement;
      let txtFg = document.getElementById(fgId) as HTMLInputElement;
      let txtNoiseThreshold = document.getElementById(noiseId) as HTMLInputElement;
      txtGlyph.value = localStorage.getItem(glyphId) || txtGlyph.value;
      txtFg.value = localStorage.getItem(fgId) || txtFg.value;
      txtNoiseThreshold.value = localStorage.getItem(noiseId) || txtNoiseThreshold.value;
    }
    
  }

  loadSettings();
  const getCellWidth = () => parseInt(rngCellSize?.value || "10");
  const getCellHeight = () => parseInt(rngCellSize?.value || "10") * 2;
  const getMapWidth = () => parseInt(rngMapSize?.value || "10");
  const getMapHeight = () => parseInt(rngMapSize?.value || "10") * 2;
  const getBaseFreq = () => parseFloat(txtBaseFreq?.value || "1.5");
  const getNoiseMultiplier = () => parseFloat(txtNoiseMultiplier?.value || "0.5");

  function saveSettings() {
    localStorage.setItem("cellSize", getCellWidth().toString());
    localStorage.setItem("mapSize", getMapWidth().toString());
    localStorage.setItem("baseFreq", getBaseFreq().toString());
    localStorage.setItem("noiseMultiplier", getNoiseMultiplier().toString());

    for (let i=1;i<=8;i++){
      const glyphId = `txtTerrain${i}Glyph`;
      const fgId = `txtTerrain${i}Color`;
      const noiseId = `txtTerrain${i}NoiseThreshold`;
      let txtGlyph = document.getElementById(glyphId) as HTMLInputElement;
      let txtFg = document.getElementById(fgId) as HTMLInputElement;
      let txtNoiseThreshold = document.getElementById(noiseId) as HTMLInputElement;
      localStorage.setItem(glyphId, txtGlyph.value || "X");
      localStorage.setItem(fgId, txtFg.value || "blue");
      localStorage.setItem(noiseId, txtNoiseThreshold.value || "0");
    }
  }

  function getTerrainTypes() {
    const terrainNames = [
      'deepWater',
      'shallowWater',
      'sand',
      'dirt',
      'gravel',
      'grass',
      'hill',
      'mountain'
    ];
    const terrainRecord: Record<string, TerrainType> = {};
    for (let i=1;i<=8;i++){
      const glyph = (document.getElementById(`txtTerrain${i}Glyph`) as HTMLInputElement).value;
      const fg = (document.getElementById(`txtTerrain${i}Color`) as HTMLInputElement).value;
      const noiseThreshold = parseFloat(
        (document.getElementById(`txtTerrain${i}NoiseThreshold`) as HTMLInputElement).value
      );
      const name = terrainNames[i - 1];
      terrainRecord[name] = {
        name,
        glyph,
        fg,
        bg: 'black',
        hindrance: 1,
        noiseThreshold,
        frequency: 0.1
      };
    }
    return terrainRecord;
  }

  const playerStart = { x: 1, y: 1 };
  const map = await Map.create(getMapWidth(), getMapHeight(), getTerrainTypes());

  let viewportWidth = 0;
  let viewportHeight = 0;

  let player = { x: playerStart.x, y: playerStart.y };

  const controls = {
    q: [-1, -1], w: [0, -1], e: [1, -1],
    a: [-1, 0],  s: [0, 0],  d: [1, 0],
    z: [-1, 1],  x: [0, 1],  c: [1, 1]
  };

  function playerTurn(dx: number, dy: number) {
    moveEntity(player, dx, dy);
    const mapCell = map.getCell(player.x, player.y);
    if (!mapCell) {
      console.error("couldn't get cell " + player.x + ", " + player.y);
      return;
    }
    drawMap();
  }

  function resizeCanvasToFit() {
    const rawWidth = canvas.offsetWidth;
    const rawHeight = canvas.offsetHeight;

    // Skip if canvas isn't visible yet
    if (rawWidth === 0 || rawHeight === 0) {
      console.warn("Canvas not sized yet. Trying again soon...");
      requestAnimationFrame(resizeCanvasToFit);
      return;
    }
    viewportWidth = Math.min(map.getWidth(), Math.floor(rawWidth / getCellWidth()));
    viewportHeight = Math.min(map.getHeight(), Math.floor(rawHeight / getCellHeight()));

    canvas.width = viewportWidth * getCellWidth();
    canvas.height = viewportHeight * getCellHeight();
    ctx.font = `${getCellHeight()}px monospace`;
    ctx.textBaseline = "top";

    drawMap();
  }

  function isWalkable(x: number, y: number) {
    const terrainType = map.getCell(x, y)!.terrain;
    return terrainType.hindrance < 2 || (player.x == x && player.y == y);
  }

  function moveEntity(entity: { x: number, y: number }, dx: number, dy: number) {
    
    let nx = entity.x + dx;
    let ny = entity.y + dy;
    // wrap around
    if (nx > map.getWidth() - 1) nx = 0;
    if (ny > map.getHeight() - 1) ny = 0;
    if (nx < 0) nx = map.getWidth() - 1;
    if (ny < 0) ny = map.getHeight() - 1;
    console.log("moveEntity to " + nx + ", " + ny);
    if (isWalkable(nx, ny)) {
      entity.x = nx;
      entity.y = ny;
    }
  }
  

  function drawMap() {
    const mapWidth = map.getWidth();
    const mapHeight = map.getHeight();    
    const halfX = Math.floor(viewportWidth / 2);
    const halfY = Math.floor(viewportHeight / 2);
    const startX = Math.min(Math.max(0, player.x - halfX), mapWidth - viewportWidth);
    const startY = Math.min(Math.max(0, player.y - halfY), mapHeight - viewportHeight);

    const endX = Math.min(mapWidth, startX + viewportWidth);
    const endY = Math.min(mapHeight, startY + viewportHeight);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    console.log("startx, starty", startX, startY);
    console.log("endX, endY", endX, endY);
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {

        let mapCell = map.getCell(x, y);
        console.log("mapcell ", x, y);
        if (!mapCell) {
          console.error("couldn't get cell " + x + ", " + y);
          return;
        }
        const terrainType = mapCell.terrain;
        // ascertain the topmost glyph and color, so we can draw it
        let topGlyph = terrainType.glyph ?? " ";
        let topFg = terrainType.fg;
        let topBg = terrainType.bg;

        if (x === player.x && y === player.y){
          topGlyph = "@";
          topFg = "magenta";
          topBg = "blue";
        } 

        ctx.fillStyle = topFg || "red";
        ctx.fillText(topGlyph, (x - startX) * getCellWidth(), (y - startY) * getCellHeight());
      }
    }
  }

  const popup = document.getElementById('popup');
    // Close if you click outside modal content
  popup?.addEventListener('click', (e) => {
    if (e.target === popup) {
      popup.style.display = 'none';
    }
  });

  document.getElementById('btnSettings')?.addEventListener('click', () => {
    if (popup){
      const isVisible = popup.style.display === 'flex';
      popup.style.display = isVisible ? 'none': 'flex';
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      popup && (popup.style.display = 'none');
    }
    // Skip movement if user is typing in an input or textarea
    const target = e.target as HTMLElement;
    if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

    const move = controls[e.key];
    if (Array.isArray(move) && move.length === 2) {
      e.preventDefault();
      playerTurn(move[0], move[1]);
    }
  });

  document.getElementById("btnApply")?.addEventListener('click', (e) => {
    saveSettings();
    window.location.reload();
  });

  document.getElementById("btnExportMap")?.addEventListener('click', () => {
    let mapText = "";
    for (let y = 0; y < map.getHeight(); y++) {
      let row = "";
      for (let x = 0; x < map.getWidth(); x++) {
        const cell = map.getCell(x, y);
        row += cell?.terrain.glyph || " ";
      }
      mapText += row + "\n";
    }
    downloadFile("map.txt", mapText);
  });

  document.getElementById("btnExportTerrain")?.addEventListener('click', () => {
    const terrainJson = JSON.stringify(getTerrainTypes(), null, 2);
    downloadFile("terrainTypes.json", terrainJson);
  });

  document.getElementById("btnRestoreDefaults")?.addEventListener('click', () => {
    deleteSettings();
    window.location.reload();
  });

  // we need this timeout or resize happens incorrectly
  let resizeTimeout: number | undefined;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = window.setTimeout(() => {
      requestAnimationFrame(resizeCanvasToFit);
    }, 100);
  });

  requestAnimationFrame(() => {
    resizeCanvasToFit();
  });
  
  console.log("end go");
}
export {};