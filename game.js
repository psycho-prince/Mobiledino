/* ================= SETUP ================= */
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

/* ================= PLAYERS ================= */
const players = [
  { id: "p1", img: "assets/player.png", jump: "assets/jump.opus", end: "assets/end.opus" },
  { id: "p2", img: "assets/char_friend1.jpg", jump: "assets/char_friend1_jump.mp3", end: "assets/char_friend1_end.mp3", code: "4729" }
];

let currentPlayer = players[0];
const playerImg = new Image();
playerImg.src = currentPlayer.img;

let jumpSound = audio(currentPlayer.jump);
let endSound = audio(currentPlayer.end);

/* ================= DEATH MESSAGES ================= */
const deathMessages = [
  "ഇത് ചാടാൻ പറ്റില്ലേ ഡാ 😭",
  "കണ്ണ് തുറന്ന് കളിച്ചാൽ മതിയായിരുന്നു 👀",
  "കാക്ടസ്: 1 | നീ: 0 💀",
  "ഇന്നും reflex vacation എടുത്തു 🏖️",
  "GG bro, next life try 😵"
];

/* ================= GAME STATE ================= */
let running = false;
let gameOver = false;
let score = 0;
let speed = 3;
let groundOffset = 0;
let isNight = false;

const gravity = 0.9;

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
let clouds = [];
let rocks = [];
let stars = [];

/* ================= OG PATTERNS ================= */
let lastCactusX = 0;
let birdHeights = [200, 180, 160];
let birdIndex = 0;

/* ================= CHARACTER SELECT ================= */
window.selectPlayer = function (id) {
  const p = players.find(x => x.id === id);
  if (!p) return;

  if (p.code && !localStorage.getItem("unlock_" + p.id)) {
    if (prompt("Enter 4-digit code") !== p.code) return;
    localStorage.setItem("unlock_" + p.id, "1");
  }

  document.querySelectorAll(".player-card").forEach(c => c.classList.remove("selected"));
  document.getElementById("card-" + id).classList.add("selected");

  currentPlayer = p;
  playerImg.src = p.img;
  jumpSound = audio(p.jump);
  endSound = audio(p.end);
};

/* ================= HELPERS ================= */
function collide(a, b) {
  return a.x < b.x + b.w &&
         a.x + a.w > b.x &&
         a.y < b.y + b.h &&
         a.y + a.h > b.y;
}

function generateStars() {
  stars = [];
  for (let i = 0; i < 30; i++) {
    stars.push({ x: Math.random() * 800, y: Math.random() * 120, r: Math.random() * 1.5 + 0.5 });
  }
}

/* ================= SPAWN ================= */
function spawnCactus() {
  const gap = 180 + Math.random() * 120 + speed * 15;
  if (canvas.width - lastCactusX < gap) return;

  const count = Math.random() < 0.6 ? 1 : Math.random() < 0.85 ? 2 : 3;
  cacti.push({
    x: canvas.width,
    y: 230,
    count,
    w: count * 18,
    h: 40
  });
  lastCactusX = canvas.width;
}

function spawnBird() {
  if (score < 300 || birds.length > 0) return;

  birds.push({
    x: canvas.width,
    y: birdHeights[birdIndex],
    w: 34,
    h: 14
  });

  birdIndex = (birdIndex + 1) % birdHeights.length;
}

/* ================= DRAW ================= */
function drawCactus(c, color) {
  ctx.fillStyle = color;
  for (let i = 0; i < c.count; i++) {
    ctx.fillRect(c.x + i * 18, c.y, 14, 40);
    ctx.fillRect(c.x + i * 18 + 12, c.y + 18, 6, 12);
  }
}

function drawBird(b, color) {
  ctx.fillStyle = color;
  ctx.fillRect(b.x, b.y, 18, 6);
  ctx.fillRect(b.x + 4, b.y - 4, 6, 4);
  ctx.fillRect(b.x + 12, b.y - 4, 6, 4);
}

/* ================= LOOP ================= */
function loop() {
  if (!running) return;

  if (score > 0 && score % 600 === 0) {
    isNight = !isNight;
    if (isNight) generateStars();
  }

  const bg = isNight ? "#000" : "#fff";
  const fg = isNight ? "#fff" : "#000";

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 800, 300);

  if (isNight) {
    ctx.fillStyle = "#fff";
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.beginPath();
    ctx.arc(720, 60, 18, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = "#ffeb3b";
    ctx.beginPath();
    ctx.arc(720, 60, 18, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = fg;
  for (let i = 0; i < 800; i += 20) {
    ctx.fillRect(i - groundOffset, 260, 10, 2);
  }
  groundOffset = (groundOffset + speed) % 20;

  player.vy += gravity;
  player.y += player.vy;
  if (player.y >= 220) {
    player.y = 220;
    player.vy = 0;
    player.jumping = false;
  }

  ctx.drawImage(playerImg, player.x, player.y, player.w, player.h);

  cacti.forEach(c => {
    c.x -= speed;
    drawCactus(c, fg);
    if (collide(player, c)) endGame();
  });

  birds.forEach(b => {
    b.x -= speed + 1;
    drawBird(b, fg);
    if (collide(player, b)) endGame();
  });

  cacti = cacti.filter(c => c.x + c.w > 0);
  birds = birds.filter(b => b.x + b.w > 0);

  spawnCactus();
  spawnBird();

  if (score === 500 || score === 1000 || score === 1500) speed += 0.8;

  score++;
  ctx.fillStyle = fg;
  ctx.fillText("Score: " + score, 10, 20);

  requestAnimationFrame(loop);
}

/* ================= GAME OVER ================= */
function endGame() {
  if (gameOver) return;
  gameOver = true;
  running = false;

  endSound.play();

  setTimeout(() => {
    deathMessageEl.textContent =
      deathMessages[Math.floor(Math.random() * deathMessages.length)];
    scoreTextEl.textContent = "Score: " + score;

    deathMessageEl.style.display = "block";
    scoreTextEl.style.display = "block";
    startBtn.style.display = "none";
    retryBtn.style.display = homeBtn.style.display = "inline-block";
    startScreen.style.display = "flex";
  }, 900);
}

/* ================= INPUT ================= */
function jump() {
  if (!player.jumping && running) {
    player.vy = -22;
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
  speed = 3;
  groundOffset = 0;
  isNight = false;
  running = true;
  gameOver = false;
  loop();
};

homeBtn.onclick = () => location.reload();
