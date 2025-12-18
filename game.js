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
let rageMode = false;

// Physics
const gravity = 0.9;

// Screen shake
let shakeFrames = 0;

// Player
const player = {
  x: 50,
  y: 220,
  w: 45,
  h: 45,
  vy: 0,
  jumping: false
};

// Obstacles & environment
let obstacles = [];
let clouds = [];
let rocks = [];
let stars = [];
let groundOffset = 0;
let spawnTimer = null;

// Malayalam death messages
const deathMessages = [
  "ഇത് ചാടാൻ പറ്റില്ലേ ഡാ 😂",
  "കാക്ടസ് നിന്നെ കളിയാക്കി 🌵",
  "കണ്ണ് തുറന്ന് കളിക്കു ബ്രോ 😭",
  "ചാടാൻ മറന്നോ അതോ പേടിച്ചോ 😆",
  "ഇതെന്താ slow motion കളി ആണോ 😜",
  "ഇന്നും കാക്ടസ് ജയിച്ചു 💀",
  "അയ്യോ… നേരെ കയറി 🫠"
];

// Easter egg sequence (tap 5 times fast)
let tapCount = 0;
let lastTap = 0;

// ---------- SPAWN ----------

function spawnObstacle() {
  const chance = Math.random();

  if (score > 400 && chance > 0.8) {
    obstacles.push({
      type: "fly",
      x: canvas.width,
      y: 170 + Math.random() * 30,
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

function spawnCloud() {
  clouds.push({
    x: canvas.width,
    y: 40 + Math.random() * 40,
    w: 30 + Math.random() * 20
  });
}

function spawnRock() {
  rocks.push({
    x: canvas.width,
    y: 248,
    w: 4 + Math.random() * 4
  });
}

function spawnStars() {
  stars = [];
  for (let i = 0; i < 30; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * 120,
      r: Math.random() * 1.5 + 0.5
    });
  }
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
  groundOffset = 0;
  score = 0;
  speed = 3.2;
  isNight = false;
  rageMode = false;
  shakeFrames = 0;
  player.y = 220;
  player.vy = 0;
  player.jumping = false;
  spawnStars();
}

// ---------- DRAW HELPERS ----------

function drawCactus(o, color) {
  ctx.fillStyle = color;
  ctx.fillRect(o.x, o.y, 18, 40);

  if (o.variant === "double") {
    ctx.fillRect(o.x - 10, o.y + 12, 10, 8);
    ctx.fillRect(o.x - 6, o.y + 20, 6, 12);
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

function drawStars() {
  ctx.fillStyle = "#fff";
  stars.forEach(s => {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawMoon() {
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(700, 60, 18, 0, Math.PI * 2);
  ctx.fill();
}

// ---------- GAME LOOP ----------

function gameLoop() {
  if (!gameRunning) return;

  if (score > 0 && score % 600 === 0) {
    isNight = !isNight;
  }

  // Rage mode unlock
  if (score > 1200 && !rageMode) {
    rageMode = true;
    speed += 1.2;
  }

  const bgColor = isNight ? "#000" : "#fff";
  const objColor = isNight ? "#fff" : "#000";

  if (shakeFrames > 0) {
    ctx.save();
    ctx.translate(Math.random() * 4 - 2, Math.random() * 4 - 2);
    shakeFrames--;
  }

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (isNight) {
    drawStars();
    drawMoon();
  }

  drawClouds(objColor);
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

  drawRocks(objColor);

  obstacles.forEach(o => {
    o.x -= speed;
    if (o.type === "cactus") drawCactus(o, objColor);
    if (o.type === "fly") drawFly(o, objColor);

    if (isColliding(player, o)) {
      gameRunning = false;
      shakeFrames = 14;
      endSound.currentTime = 0;
      endSound.play();

      const msg = deathMessages[Math.floor(Math.random() * deathMessages.length)];
      startScreen.style.display = "flex";
      startBtn.textContent = `RETRY – ${msg}`;
    }
  });

  obstacles = obstacles.filter(o => o.x + o.w > 0);

  score++;
  speed += 0.0006;

  ctx.fillStyle = objColor;
  ctx.font = "14px system-ui";
  ctx.fillText(`Score: ${score}`, 10, 20);

  if (rageMode) {
    ctx.fillText("🔥 RAGE MODE 🔥", canvas.width - 130, 20);
  }

  if (shakeFrames > 0) ctx.restore();

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

  // Easter egg detection
  const now = Date.now();
  if (now - lastTap < 300) tapCount++;
  else tapCount = 1;

  lastTap = now;

  if (tapCount === 5) {
    speed += 2;
    tapCount = 0;
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
