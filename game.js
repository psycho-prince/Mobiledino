const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

ctx.imageSmoothingEnabled = false;

const startScreen = document.getElementById("startScreen");
const startBtn = document.getElementById("startBtn");

// Assets
const playerImg = new Image();
playerImg.src = "assets/player.png";

const jumpSound = new Audio("assets/jump.opus");
const endSound = new Audio("assets/end.opus");

// Game state
let gameRunning = false;
let score = 0;
let speed = 3.2;
let isNight = false;

// Physics
const gravity = 0.9;

// Player
const player = {
  x: 50,
  y: 220,
  w: 45,
  h: 45,
  vy: 0,
  jumping: false
};

// Obstacles
let obstacles = [];
let spawnTimer = null;

// Environment
let groundOffset = 0;
let clouds = [];
let rocks = [];

// ---------- SPAWN ----------

function spawnObstacle() {
  const chance = Math.random();

  if (score > 400 && chance > 0.8) {
    obstacles.push({
      type: "fly",
      x: canvas.width,
      y: 175 + Math.random() * 25,
      w: 30,
      h: 15
    });
  } else {
    obstacles.push({
      type: "cactus",
      x: canvas.width,
      y: 230,
      w: 18,
      h: 40,
      variant: Math.random() > 0.5 ? "double" : "single"
    });
  }
}

// Clouds
function spawnCloud() {
  clouds.push({
    x: canvas.width,
    y: 40 + Math.random() * 40,
    w: 30 + Math.random() * 20
  });
}

// Rocks
function spawnRock() {
  rocks.push({
    x: canvas.width,
    y: 248,
    w: 4 + Math.random() * 4
  });
}

// ---------- COLLISION ----------

function isColliding(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

// ---------- RESET ----------

function resetGame() {
  obstacles = [];
  clouds = [];
  rocks = [];
  score = 0;
  speed = 3.2;
  isNight = false;
  groundOffset = 0;
  player.y = 220;
  player.vy = 0;
  player.jumping = false;
}

// ---------- DRAW HELPERS ----------

function drawCactus(o, color) {
  ctx.fillStyle = color;

  ctx.fillRect(o.x, o.y, 18, 40);

  if (o.variant === "double") {
    ctx.fillRect(o.x - 10, o.y + 12, 10, 8);
    ctx.fillRect(o.x - 6,  o.y + 20, 6, 12);
    ctx.fillRect(o.x + 18, o.y + 18, 8, 10);
    ctx.fillRect(o.x + 18, o.y + 26, 5, 8);
  } else {
    ctx.fillRect(o.x + 18, o.y + 18, 8, 12);
  }
}

function drawFly(o, color) {
  ctx.fillStyle = color;
  ctx.fillRect(o.x, o.y, 18, 6);
  ctx.fillRect(o.x + 2, o.y - 4, 6, 4);
  ctx.fillRect(o.x + 10, o.y - 4, 6, 4);
}

function drawGround(color) {
  ctx.fillStyle = color;
  for (let i = 0; i < canvas.width; i += 20) {
    ctx.fillRect(i - groundOffset, 260, 10, 2);
  }
  groundOffset = (groundOffset + speed) % 20;
}

function drawClouds(color) {
  ctx.fillStyle = color;
  clouds.forEach(c => {
    ctx.fillRect(c.x, c.y, c.w, 6);
    ctx.fillRect(c.x + 6, c.y - 4, c.w - 12, 4);
    c.x -= 0.3;
  });
  clouds = clouds.filter(c => c.x + c.w > 0);
}

function drawRocks(color) {
  ctx.fillStyle = color;
  rocks.forEach(r => {
    ctx.fillRect(r.x, r.y, r.w, 2);
    r.x -= speed;
  });
  rocks = rocks.filter(r => r.x + r.w > 0);
}

// ---------- GAME LOOP ----------

function gameLoop() {
  if (!gameRunning) return;

  if (score > 0 && score % 600 === 0) {
    isNight = !isNight;
  }

  const bgColor = isNight ? "#000" : "#fff";
  const objColor = isNight ? "#fff" : "#000";

  // Background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Clouds
  drawClouds(objColor);

  // Ground
  drawGround(objColor);

  // Player physics
  player.vy += gravity;
  player.y += player.vy;

  if (player.y >= 220) {
    player.y = 220;
    player.vy = 0;
    player.jumping = false;
  }

  ctx.drawImage(playerImg, player.x, player.y, player.w, player.h);

  // Rocks
  drawRocks(objColor);

  // Obstacles
  obstacles.forEach(o => {
    o.x -= speed;
    if (o.type === "cactus") drawCactus(o, objColor);
    if (o.type === "fly") drawFly(o, objColor);

    if (isColliding(player, o)) {
      gameRunning = false;
      endSound.currentTime = 0;
      endSound.play();
      startScreen.style.display = "flex";
      startBtn.textContent = "RETRY";
    }
  });

  obstacles = obstacles.filter(o => o.x + o.w > 0);

  // Score & difficulty
  score++;
  speed += 0.0006;

  ctx.fillStyle = objColor;
  ctx.font = "14px system-ui";
  ctx.fillText(`Score: ${score}`, 10, 20);

  requestAnimationFrame(gameLoop);
}

// ---------- INPUT ----------

function jump() {
  if (!player.jumping && gameRunning) {
    player.vy = -22;
    player.jumping = true;
    jumpSound.currentTime = 0;
    jumpSound.play();
  }
}

document.addEventListener("keydown", jump);
document.addEventListener("touchstart", jump);

// ---------- START ----------

startBtn.onclick = () => {
  startScreen.style.display = "none";
  resetGame();
  gameRunning = true;

  jumpSound.play(); jumpSound.pause();
  endSound.play(); endSound.pause();

  if (spawnTimer) clearInterval(spawnTimer);
  spawnObstacle();
  spawnTimer = setInterval(spawnObstacle, 1700);

  setInterval(spawnCloud, 4000);
  setInterval(spawnRock, 1500);

  gameLoop();
};
