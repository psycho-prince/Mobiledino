/* ================= CORE ================= */
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const startScreen = document.getElementById("startScreen");
const startBtn = document.getElementById("startBtn");
const retryBtn = document.getElementById("retryBtn");
const homeBtn = document.getElementById("homeBtn");
const deathMessageEl = document.getElementById("deathMessage");
const scoreTextEl = document.getElementById("scoreText");

/* ================= AUDIO ================= */
function audio(src) {
  const a = new Audio(src);
  a.preload = "auto";
  return a;
}

/* ================= PLAYER SETUP ================= */
const players = [
  { id: "p1", img: "assets/player.png", jump: "assets/jump.opus", end: "assets/end.opus" },
  { id: "p2", img: "assets/char_friend1.jpg", jump: "assets/char_friend1_jump.mp3", end: "assets/char_friend1_end.mp3", code: "4729" }
];

let currentPlayer = players[0];
const playerImg = new Image();
playerImg.src = currentPlayer.img;

let jumpSound = audio(currentPlayer.jump);
let endSound = audio(currentPlayer.end);

/* ================= GAME STATE ================= */
let running = false;
let gameOver = false;
let score = 0;
let speed = 6;
let gravity = 0.8;
let groundOffset = 0;
let isNight = false;
let lastTime = 0;

/* ================= PLAYER ================= */
const player = {
  x: 50,
  y: 220,
  w: 44,
  h: 44,
  vy: 0,
  jumping: false
};

/* ================= OBJECTS ================= */
let cacti = [];
let birds = [];
let stars = [];

/* ================= TIMERS ================= */
let cactusTimer = 0;
let birdTimer = 0;

/* ================= UTILS ================= */
function collide(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

function genStars() {
  stars = [];
  for (let i = 0; i < 30; i++) {
    stars.push({ x: Math.random() * 800, y: Math.random() * 120, r: Math.random() * 1.5 + 0.5 });
  }
}

/* ================= SPAWN ================= */
function spawnCactus() {
  const count = Math.random() < 0.6 ? 1 : Math.random() < 0.85 ? 2 : 3;
  cacti.push({
    x: canvas.width,
    y: 230,
    w: count * 18,
    h: 40,
    count
  });
}

function spawnBird() {
  const heights = [200, 180, 160];
  birds.push({
    x: canvas.width,
    y: heights[Math.floor(Math.random() * heights.length)],
    w: 34,
    h: 14,
    frame: 0
  });
}

/* ================= DRAW ================= */
function drawCactus(c, color) {
  ctx.fillStyle = color;
  for (let i = 0; i < c.count; i++) {
    ctx.fillRect(c.x + i * 18, c.y, 14, 40);
    ctx.fillRect(c.x + i * 18 + 10, c.y + 18, 6, 12);
  }
}

function drawBird(b, color) {
  ctx.fillStyle = color;
  const wing = b.frame < 10 ? -4 : 0;
  ctx.fillRect(b.x, b.y, 18, 6);
  ctx.fillRect(b.x + 4, b.y + wing, 6, 4);
  ctx.fillRect(b.x + 12, b.y + wing, 6, 4);
}

/* ================= LOOP ================= */
function gameLoop(timestamp) {
  if (!running) return;
  const delta = timestamp - lastTime;
  lastTime = timestamp;

  cactusTimer += delta;
  birdTimer += delta;

  // Spawn logic (TIME-BASED, NEVER STOPS)
  if (cactusTimer > 1400) {
    spawnCactus();
    cactusTimer = 0;
  }

  if (score > 300 && birdTimer > 2600) {
    spawnBird();
    birdTimer = 0;
  }

  // Day / Night
  if (score > 0 && score % 700 === 0) {
    isNight = !isNight;
    if (isNight) genStars();
  }

  const bg = isNight ? "#000" : "#fff";
  const fg = isNight ? "#fff" : "#000";

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Sun / Moon
  ctx.fillStyle = isNight ? "#fff" : "#ffeb3b";
  ctx.beginPath();
  ctx.arc(720, 60, 18, 0, Math.PI * 2);
  ctx.fill();

  if (isNight) {
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // Ground
  ctx.fillStyle = fg;
  for (let i = 0; i < canvas.width; i += 20) {
    ctx.fillRect(i - groundOffset, 260, 10, 2);
  }
  groundOffset = (groundOffset + speed) % 20;

  // Player
  player.vy += gravity;
  player.y += player.vy;
  if (player.y >= 220) {
    player.y = 220;
    player.vy = 0;
    player.jumping = false;
  }
  ctx.drawImage(playerImg, player.x, player.y, player.w, player.h);

  // Cactus
  cacti.forEach(c => {
    c.x -= speed;
    drawCactus(c, fg);
    if (collide(player, c)) endGame();
  });

  // Birds (animated)
  birds.forEach(b => {
    b.x -= speed + 1;
    b.frame = (b.frame + 1) % 20;
    drawBird(b, fg);
    if (collide(player, b)) endGame();
  });

  cacti = cacti.filter(c => c.x + c.w > 0);
  birds = birds.filter(b => b.x + b.w > 0);

  score++;
  if (score % 500 === 0) speed += 0.6;

  ctx.fillStyle = fg;
  ctx.fillText("Score: " + score, 10, 20);

  requestAnimationFrame(gameLoop);
}

/* ================= END ================= */
function endGame() {
  if (gameOver) return;
  gameOver = true;
  running = false;

  endSound.play();

  setTimeout(() => {
    deathMessageEl.textContent = "ഇത് ചാടാൻ പറ്റില്ലേ ഡാ 😭";
    scoreTextEl.textContent = "Score: " + score;
    deathMessageEl.style.display = scoreTextEl.style.display = "block";
    startBtn.style.display = "none";
    retryBtn.style.display = homeBtn.style.display = "inline-block";
    startScreen.style.display = "flex";
  }, 900);
}

/* ================= INPUT ================= */
function jump() {
  if (!player.jumping && running) {
    player.vy = -18;
    player.jumping = true;
    jumpSound.currentTime = 0;
    jumpSound.play();
  }
}

document.addEventListener("keydown", jump);
document.addEventListener("touchstart", jump);

/* ================= BUTTONS ================= */
startBtn.onclick = retryBtn.onclick = () => {
  startScreen.style.display = "none";
  cacti = [];
  birds = [];
  score = 0;
  speed = 6;
  cactusTimer = 0;
  birdTimer = 0;
  running = true;
  gameOver = false;
  lastTime = performance.now();
  requestAnimationFrame(gameLoop);
};

homeBtn.onclick = () => location.reload();
