const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

ctx.imageSmoothingEnabled = false;

const startScreen = document.getElementById("startScreen");
const startBtn = document.getElementById("startBtn");

// Player image
const playerImg = new Image();
playerImg.src = "assets/player.png";

// Sounds
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

// ----------- SPAWN LOGIC -----------

function spawnObstacle() {
  const typeChance = Math.random();

  // 20% chance for flying enemy after score threshold
  if (score > 400 && typeChance > 0.8) {
    obstacles.push({
      type: "fly",
      x: canvas.width,
      y: 180 + Math.random() * 20,
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

// ----------- COLLISION -----------

function isColliding(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

// ----------- RESET -----------

function resetGame() {
  obstacles = [];
  score = 0;
  speed = 3.2;
  isNight = false;
  player.y = 220;
  player.vy = 0;
  player.jumping = false;
}

// ----------- DRAWING -----------

function drawCactus(o) {
  ctx.fillStyle = "#fff";

  // main stem
  ctx.fillRect(o.x, o.y, 18, 40);

  if (o.variant === "double") {
    // left arm
    ctx.fillRect(o.x - 10, o.y + 12, 10, 8);
    ctx.fillRect(o.x - 6,  o.y + 20, 6, 12);

    // right arm
    ctx.fillRect(o.x + 18, o.y + 18, 8, 10);
    ctx.fillRect(o.x + 18, o.y + 26, 5, 8);
  } else {
    // single arm
    ctx.fillRect(o.x + 18, o.y + 18, 8, 12);
  }
}

function drawFly(o) {
  ctx.fillStyle = "#fff";

  // body
  ctx.fillRect(o.x, o.y, 18, 6);

  // wings
  ctx.fillRect(o.x + 2, o.y - 4, 6, 4);
  ctx.fillRect(o.x + 10, o.y - 4, 6, 4);
}

// ----------- GAME LOOP -----------

function gameLoop() {
  if (!gameRunning) return;

  // Day / Night cycle
  if (score % 600 === 0 && score !== 0) {
    isNight = !isNight;
  }

  ctx.fillStyle = isNight ? "#fff" : "#222";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = isNight ? "#000" : "#fff";

  // Player physics
  player.vy += gravity;
  player.y += player.vy;

  if (player.y >= 220) {
    player.y = 220;
    player.vy = 0;
    player.jumping = false;
  }

  ctx.drawImage(playerImg, player.x, player.y, player.w, player.h);

  // Obstacles
  obstacles.forEach(o => {
    o.x -= speed;

    if (o.type === "cactus") drawCactus(o);
    if (o.type === "fly") drawFly(o);

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

  ctx.font = "14px system-ui";
  ctx.fillText(`Score: ${score}`, 10, 20);

  requestAnimationFrame(gameLoop);
}

// ----------- INPUT -----------

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

// ----------- START -----------

startBtn.onclick = () => {
  startScreen.style.display = "none";
  resetGame();
  gameRunning = true;

  // Unlock audio
  jumpSound.play(); jumpSound.pause();
  endSound.play(); endSound.pause();

  if (spawnTimer) clearInterval(spawnTimer);
  spawnObstacle();
  spawnTimer = setInterval(spawnObstacle, 1700);

  gameLoop();
};
