/* ================= SETUP ================= */
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

/* UI */
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
  x: 50, y: 220, w: 44, h: 44,
  vy: 0, jumping: false
};

/* ================= OBJECTS ================= */
let cacti = [];
let birds = [];
let clouds = [];
let rocks = [];
let stars = [];

/* ================= HELPERS ================= */
function collide(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

function generateStars() {
  stars = [];
  for (let i = 0; i < 30; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * 120,
      r: Math.random() * 1.5 + 0.5
    });
  }
}

/* ================= SPAWN ================= */
function spawnCactus() {
  // OG rule: check LAST cactus distance
  const last = cacti[cacti.length - 1];
  const minGap = 180 + speed * 20;

  if (last && last.x > canvas.width - minGap) return;

  const count =
    Math.random() < 0.6 ? 1 :
    Math.random() < 0.85 ? 2 : 3;

  cacti.push({
    x: canvas.width,
    y: 230,
    count,
    w: count * 18,
    h: 40
  });
}

function spawnBird() {
  if (score < 300) return;
  if (birds.length > 0) return;

  const heights = [200, 180, 160];
  birds.push({
    x: canvas.width,
    y: heights[score % heights.length],
    w: 34,
    h: 14
  });
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

  // Day / Night toggle
  if (score > 0 && score % 600 === 0) {
    isNight = !isNight;
    if (isNight) generateStars();
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
    ctx.fillStyle = "#fff";
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

  // Player physics
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

  // Birds
  birds.forEach(b => {
    b.x -= speed + 1;
    drawBird(b, fg);
    if (collide(player, b)) endGame();
  });

  // Cleanup
  cacti = cacti.filter(c => c.x + c.w > 0);
  birds = birds.filter(b => b.x + b.w > 0);

  spawnCactus();
  spawnBird();

  // Speed milestones
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
