const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const startScreen = document.getElementById("startScreen");
const endScreen = document.getElementById("endScreen");
const berryCount = document.getElementById("berryCount");
const livesText = document.getElementById("lives");

const TILE = 48;
const COLS = 20;
const ROWS = 12;
let running = false;
let collected = 0;
let lives = 3;
let keys = {};
let lastMove = 0;
let player = { x: 1, y: 1, px: 1, py: 1, moving: false };
let berries = [];
let enemies = [];
let exit = { x: 18, y: 10 };
let messageTimer = 0;

// 0 = chão, 1 = parede
const map = [
 [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
 [1,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,0,1],
 [1,0,1,1,1,0,1,0,1,1,1,1,0,1,0,1,1,1,0,1],
 [1,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,0,1,0,1],
 [1,1,1,0,1,1,1,1,1,0,0,1,1,1,1,1,0,1,0,1],
 [1,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,1,0,1],
 [1,0,1,1,1,1,1,0,1,0,1,0,1,1,1,1,0,0,0,1],
 [1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,1,1,1],
 [1,1,1,1,1,0,1,1,1,1,1,0,1,0,1,1,0,0,0,1],
 [1,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,1,0,1],
 [1,0,1,1,1,1,1,1,1,0,0,0,1,0,0,0,0,0,0,1],
 [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

function isWall(x, y) {
  return y < 0 || y >= ROWS || x < 0 || x >= COLS || map[y][x] === 1;
}
function resetGame() {
  collected = 0; lives = 3;
  player = { x: 1, y: 1, px: 1, py: 1, moving: false };
  berries = [
    {x:3,y:1},{x:5,y:3},{x:7,y:5},{x:9,y:7},
    {x:12,y:3},{x:15,y:5},{x:16,y:8},{x:18,y:10}
  ];
  enemies = [{x:5,y:5,dir:1,step:0},{x:14,y:9,dir:-1,step:0}];
  updateHUD();
  draw();
}
function updateHUD() {
  berryCount.textContent = `${collected}/8`;
  livesText.textContent = lives;
}
function drawTile(x,y) {
  const wall = map[y][x] === 1;
  const px=x*TILE, py=y*TILE;
  if (wall) {
    ctx.fillStyle = "#647f91"; ctx.fillRect(px,py,TILE,TILE);
    ctx.fillStyle = "#789bad"; ctx.fillRect(px+3,py+3,TILE-6,TILE-6);
    ctx.fillStyle = "#506b7d"; ctx.fillRect(px+5,py+5,TILE-10,5);
    ctx.fillStyle = "#8eafbc"; ctx.fillRect(px+6,py+13,TILE-12,3);
    ctx.fillStyle = "#536f80"; ctx.fillRect(px+5,py+TILE-8,TILE-10,4);
  } else {
    ctx.fillStyle = ((x+y)%2===0) ? "#e4fbff" : "#d8f5fb";
    ctx.fillRect(px,py,TILE,TILE);
    ctx.strokeStyle="#c3eaf1"; ctx.lineWidth=1;
    ctx.strokeRect(px+.5,py+.5,TILE-1,TILE-1);
    if ((x*7+y*3)%9===0) {
      ctx.fillStyle="#a9e1ee"; ctx.fillRect(px+12,py+12,4,4); ctx.fillRect(px+18,py+16,3,3);
    }
  }
}
function drawBerry(x,y) {
  const cx=x*TILE+24, cy=y*TILE+25;
  ctx.fillStyle="#4a236b"; ctx.fillRect(cx-8,cy-7,16,15);
  ctx.fillStyle="#8d48bf"; ctx.fillRect(cx-7,cy-8,14,14);
  ctx.fillStyle="#b77ae1"; ctx.fillRect(cx-4,cy-6,5,5);
  ctx.fillStyle="#d9b4ff"; ctx.fillRect(cx-3,cy-5,2,2);
  ctx.fillStyle="#3a9258"; ctx.fillRect(cx-1,cy-12,4,5);
  ctx.fillStyle="#65bd72"; ctx.fillRect(cx+2,cy-13,6,3);
}
function drawPlayer(x,y) {
  const cx=x*TILE+24, cy=y*TILE+25;
  // sombra
  ctx.fillStyle="#a4cbd2"; ctx.fillRect(cx-13,cy+12,26,5);
  // copo de açaí
  ctx.fillStyle="#3b2053"; ctx.fillRect(cx-13,cy-13,26,27);
  ctx.fillStyle="#7b36a3"; ctx.fillRect(cx-11,cy-11,22,23);
  ctx.fillStyle="#a34ec5"; ctx.fillRect(cx-8,cy-8,16,7);
  ctx.fillStyle="#e8d5ff"; ctx.fillRect(cx-7,cy-6,5,3);
  // tampa
  ctx.fillStyle="#ffc629"; ctx.fillRect(cx-15,cy-15,30,5);
  ctx.fillStyle="#ffe68a"; ctx.fillRect(cx-11,cy-14,18,2);
  // rosto
  ctx.fillStyle="#fff"; ctx.fillRect(cx-7,cy-1,4,5); ctx.fillRect(cx+3,cy-1,4,5);
  ctx.fillStyle="#291831"; ctx.fillRect(cx-6,cy,2,4); ctx.fillRect(cx+4,cy,2,4);
  ctx.fillStyle="#291831"; ctx.fillRect(cx-2,cy+7,5,2);
  // pezinhos
  ctx.fillStyle="#30203c"; ctx.fillRect(cx-10,cy+13,7,4); ctx.fillRect(cx+3,cy+13,7,4);
}
function drawEnemy(e) {
  const cx=e.x*TILE+24, cy=e.y*TILE+25;
  ctx.fillStyle="#b6a0c5"; ctx.fillRect(cx-12,cy+11,24,4);
  ctx.fillStyle="#42204f"; ctx.fillRect(cx-12,cy-9,24,22);
  ctx.fillStyle="#a44bc0"; ctx.fillRect(cx-9,cy-12,18,23);
  ctx.fillStyle="#c777dc"; ctx.fillRect(cx-6,cy-10,7,5);
  ctx.fillStyle="#fff"; ctx.fillRect(cx-7,cy-2,5,6); ctx.fillRect(cx+3,cy-2,5,6);
  ctx.fillStyle="#25152c"; ctx.fillRect(cx-6,cy-1,3,4); ctx.fillRect(cx+4,cy-1,3,4);
  ctx.fillStyle="#42204f"; ctx.fillRect(cx-3,cy+7,7,2);
}
function drawExit() {
  const x=exit.x*TILE, y=exit.y*TILE;
  ctx.fillStyle="#4e8c70"; ctx.fillRect(x+8,y+7,32,35);
  ctx.fillStyle="#83dca5"; ctx.fillRect(x+12,y+11,24,31);
  ctx.fillStyle="#fff5b0"; ctx.fillRect(x+17,y+16,14,26);
  ctx.fillStyle="#3e815f"; ctx.fillRect(x+27,y+27,3,3);
  ctx.fillStyle="#3d6a56"; ctx.fillRect(x+5,y+4,38,7);
}
function draw() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  for(let y=0;y<ROWS;y++) for(let x=0;x<COLS;x++) drawTile(x,y);
  drawExit();
  berries.forEach(b=>drawBerry(b.x,b.y));
  enemies.forEach(drawEnemy);
  drawPlayer(player.x,player.y);
  // pequenas placas decorativas
  ctx.fillStyle="#35566b"; ctx.fillRect(12,12,210,27);
  ctx.fillStyle="#efffff"; ctx.font="bold 13px monospace"; ctx.fillText("LABORATÓRIO DO AÇAÍ",22,30);
}
function movePlayer(dx,dy) {
  const nx=player.x+dx, ny=player.y+dy;
  if(isWall(nx,ny)) return;
  player.x=nx; player.y=ny;
  const idx=berries.findIndex(b=>b.x===nx&&b.y===ny);
  if(idx>=0) { berries.splice(idx,1); collected++; updateHUD(); }
  if(enemies.some(e=>e.x===player.x&&e.y===player.y)) {
    lives--; updateHUD();
    if(lives<=0) return finish(false);
    player.x=1; player.y=1;
  }
  if(player.x===exit.x && player.y===exit.y && collected===8) return finish(true);
  if(player.x===exit.x && player.y===exit.y && collected<8) messageTimer=45;
  draw();
}
function finish(won) {
  running=false;
  document.getElementById("endEmoji").textContent=won?"🏆":"💜";
  document.getElementById("endKicker").textContent=won?"FASE CONCLUÍDA":"FIM DE JOGO";
  document.getElementById("endTitle").textContent=won?"MANDOU BEM!":"OPS, TENTE DE NOVO";
  document.getElementById("endText").textContent=won?"Você coletou todas as frutinhas e encontrou a saída!":"Os monstrinhos pegaram você. Vamos tentar outra vez?";
  endScreen.classList.remove("hidden");
}
function loop(time) {
  if(!running) return;
  if(time-lastMove>125) {
    let dx=0,dy=0;
    if(keys.ArrowLeft||keys.a) dx=-1;
    else if(keys.ArrowRight||keys.d) dx=1;
    else if(keys.ArrowUp||keys.w) dy=-1;
    else if(keys.ArrowDown||keys.s) dy=1;
    if(dx||dy) { movePlayer(dx,dy); lastMove=time; }
    // inimigos se movimentam lentamente pelos corredores
    if(Math.floor(time/700)!==Math.floor((time-16)/700)) {
      enemies.forEach(e=>{
        e.step++;
        const dirs=[{x:e.dir,y:0},{x:0,y:1},{x:0,y:-1},{x:-e.dir,y:0}];
        let moved=false;
        for(const d of dirs) {
          if(!isWall(e.x+d.x,e.y+d.y) && !(d.x===0&&d.y===0)) {
            e.x+=d.x; e.y+=d.y; moved=true; break;
          }
        }
        if(!moved) e.dir*=-1;
        if(e.x===player.x&&e.y===player.y) {
          lives--; updateHUD();
          if(lives<=0) finish(false);
          else { player.x=1; player.y=1; }
        }
      });
      draw();
    }
  }
  if(messageTimer>0) {
    messageTimer--;
    ctx.fillStyle="#2b1a36"; ctx.fillRect(250,530,460,38);
    ctx.fillStyle="#fff"; ctx.font="bold 15px monospace"; ctx.textAlign="center";
    ctx.fillText("COLETE TODAS AS FRUTINHAS PRIMEIRO!",480,554); ctx.textAlign="left";
  }
  requestAnimationFrame(loop);
}
document.addEventListener("keydown", e=>{
  const key=e.key.length===1?e.key.toLowerCase():e.key;
  if(["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"," "].includes(key)) e.preventDefault();
  keys[key]=true;
});
document.addEventListener("keyup", e=>{
  const key=e.key.length===1?e.key.toLowerCase():e.key;
  keys[key]=false;
});
document.getElementById("startBtn").addEventListener("click",()=>{
  resetGame(); startScreen.classList.add("hidden"); endScreen.classList.add("hidden");
  running=true; lastMove=0; requestAnimationFrame(loop);
});
document.getElementById("restartBtn").addEventListener("click",()=>{
  resetGame(); endScreen.classList.add("hidden"); running=true; lastMove=0; requestAnimationFrame(loop);
});
resetGame();
