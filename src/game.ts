
import { getDirectionName } from './util.js';
import { Map } from './Map.js'

window.addEventListener('DOMContentLoaded', async () => {
  try {
    console.log("DOMContentLoaded");
    await go();
  } catch (e) {
    console.error("Error handling DomContentLoaded: ", e);
  }   
});

async function go() {
  console.log("go() started");
  const canvas = document.getElementById("canvas") as HTMLCanvasElement;
  if (!canvas) throw new Error("Canvas element not found");
  const ctx = canvas.getContext("2d")!;
  const cellWidth = 10;
  const cellHeight = 20;

  const playerStart = { x: 1, y: 1 };
  const map = await Map.create(100, 100);

  const infoPanel = document.getElementById("info1") as HTMLDivElement;
  if (!infoPanel) throw new Error("infoPanel element not found");

  function appendMessageToInfoPanel(text: string, color?: string) {
    const div = document.createElement("div");
    div.textContent = text;
    if (color) {
      div.style.color = color;
    }
    infoPanel.appendChild(div);
    infoPanel.scrollTop = infoPanel.scrollHeight; // auto-scroll to bottom
  }

  function echoCommand(text: string) {
    const line = document.createElement("div");
    line.textContent = `> ${text}`;
    infoPanel!.appendChild(line);
    infoPanel!.scrollTop = infoPanel!.scrollHeight; // Auto-scroll to bottom
  }

  let viewportWidth = 0;
  let viewportHeight = 0;

  let player = { x: playerStart.x, y: playerStart.y };

  const controls = {
    q: [-1, -1], w: [0, -1], e: [1, -1],
    a: [-1, 0],  s: [0, 0],  d: [1, 0],
    z: [-1, 1],  x: [0, 1],  c: [1, 1]
  };

  function resizeCanvasToFit() {
    console.log('resize');
    viewportWidth = Math.floor(canvas.offsetWidth / cellWidth);
    viewportHeight = Math.floor(canvas.offsetHeight / cellHeight);

    canvas.width = viewportWidth * cellWidth;
    canvas.height = viewportHeight * cellHeight;
    ctx.font = `${cellHeight}px monospace`;
    ctx.textBaseline = "top";
    drawMap();
  }

  function isWalkable(x: number, y: number) {
    console.log("isWalkable " + x + ", " + y)
    const terrainType = map.getCell(x, y)!.terrain;
    return terrainType.hindrance < 2 || (player.x == x && player.y == y);
  }

  function moveEntity(entity: { x: number, y: number }, dx: number, dy: number) {
    const nx = entity.x + dx;
    const ny = entity.y + dy;
    if (isWalkable(nx, ny)) {
      entity.x = nx;
      entity.y = ny;
    }
  }
  
  function playerTurn(dx: number, dy: number) {
    console.log("playerTurn x y: " , dx, dy);
    const direction = getDirectionName(dx, dy);
    echoCommand(direction);
    moveEntity(player, dx, dy);
    const mapCell = map.getCell(player.x, player.y);
    console.log(`player turn ${dx}, ${dy} to ${player.x}, ${player.y}`);        
    if (!mapCell) {
      console.error("couldn't get cell " + player.x + ", " + player.y);
      return;
    }
    const tType = mapCell.terrain;
    if (tType) {
      const msg = `You are ${tType.interactionWording} ${tType.description}.`;
      appendMessageToInfoPanel(msg, tType.fg);
    } else {
      appendMessageToInfoPanel("You are in unknown terrain.", "gray");
    }

    drawMap();
  }

  function drawMap() {
    console.log('drawMap');
    echoCommand(`viewport w, h: ${viewportWidth}, ${viewportHeight}` );
    const mapWidth = map.getWidth();
    const mapHeight = map.getHeight();
    echoCommand(`player x, y: ${player.x}, ${player.y}` );
    
    const halfX = Math.floor(viewportWidth / 2);
    const halfY = Math.floor(viewportHeight / 2);
    const startX = Math.min(Math.max(0, player.x - halfX), mapHeight - viewportWidth);
    const startY = Math.min(Math.max(0, player.y - halfY), mapHeight - viewportHeight);
    echoCommand(`start x, y: ${startX}, ${startY}` );
    const endX = Math.min(mapWidth, startX + viewportWidth);
    const endY = Math.min(mapHeight, startY + viewportHeight);
    echoCommand(`end x, y: ${endX}, ${endY}` );

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {

        let mapCell = map.getCell(x, y);
        console.log("mapCell", mapCell);
        if (!mapCell) {
          console.error("couldn't get cell " + x + ", " + y);
          return;
        }
        const terrainType = mapCell.terrain;
        console.log("cell x y ", x, y);
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
        ctx.fillText(topGlyph, (x - startX) * cellWidth, (y - startY) * cellHeight);
      }
    }
  }

  document.addEventListener('keydown', (e) => {
    const move = controls[e.key];
    if (Array.isArray(move) && move.length === 2) {
      e.preventDefault();
      playerTurn(move[0], move[1]);
    }
  });

  // we need this timeout or resize happens incorrectly
  let resizeTimeout: number | undefined;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = window.setTimeout(() => {
      requestAnimationFrame(resizeCanvasToFit);
    }, 100);
  });

  resizeCanvasToFit();
}
console.log('oops');
export {};