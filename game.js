/* ================= BASIC SETUP ================= */
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const startScreen = document.getElementById("startScreen");
const startBtn = document.getElementById("startBtn");
const retryBtn = document.getElementById("retryBtn");
const homeBtn = document.getElementById("homeBtn");
const deathMessageEl = document.getElementById("deathMessage");
const scoreTextEl = document.getElementById("scoreText");

/* ================= AUDIO ================= */
const jumpSound = new Audio("assets/jump.opus");
const endSound = new Audio("assets/end.opus");

/* ================= CHARACTERS ================= */
const characters = {
  p1: { img: "assets/player.png" },
  p2: { img: "assets/char_friend1.jpg", code: "4729" }
};

let activeChar = "p1";
const playerImg = new Image();
playerImg.src = characters.p1.img;

window.selectPlayer = function (id) {
  const c = characters[id];
  if (!c) return;

  if (c.code && !localStorage.getItem("unlock_" + id)) {
    if (prompt("Enter 4-digit code") !== c.code) return;
    localStorage.setItem("unlock_" + id, "1");
  }

  document.querySelectorAll(".player-card").forEach(e => e.classList.remove("selected"));
  document.getElementById("card-" + id).classList.add("selected");

  activeChar = id;
  playerImg.src = c.img;
};

/* ================= GAME STATE ================= */
let running = false;
let gameOver = false;
let score = 0;
let speed = 6;
let gravity = 0.9;
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

/* ================= WORLD OBJECTS ================= */
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

function genStars() {
  stars = [];
  for (let i = 0; i < 30; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * 120,
      r: Math.random() * 1.5 + 0.5
    });
  }
}

/* ================= SPAWN LOGIC ================= */
function spawnCactus() {
  const last = cacti[cacti.length - 1];
  const minGap = 200 + speed * 15;

  if (last && last.x > canvas.width - minGap) return;

  const count = Math.random() < 0.6 ? 1 : Math.random() < 0.85 ? 2 : 3;
  cacti.push({
    x: canvas.width,
    y: 230,
    count,
    w: count * 18,
    h: 40
  });
}

function spawnBird() {
  if (score < 300 || birds.length > 0) return;
  const heights = [200, 180, 160];
  birds.push({
    x: canvas.width,
    y: heights[score % heights.length],
    w: 34,
    h: 14,
    frame: 0
  });
}

/* ================= DRAW ================= */
function drawCactus(c, col) {
  ctx.fillStyle = col;
  for (let i = 0; i < c.count; i++) {
    ctx.fillRect(c.x + i * 18, c.y, 14, 40);
    ctx.fillRect(c.x + i * 18 + 10, c.y + 18, 6, 12);
  }
}

function drawBird(b, col) {
  ctx.fillStyle = col;
  const wing = b.frame < 10 ? -4 : 0;
  ctx.fillRect(b.x, b.y, 18, 6);
  ctx.fillRect(b.x + 4, b.y + wing, 6, 4);
  ctx.fillRect(b.x + 12, b.y + wing, 6, 4);
}

/* ================= MAIN LOOP ================= */
function loop(t) {
  if (!running) return;
  const delta = t - lastTime;
  lastTime = t;

  score += delta * 0.02;

  if (Math.floor(score) % 600 === 0 && Math.floor(score) !== 0) {
    isNight = !isNight;
    if (isNight) genStars();
  }

  if (Math.floor(score) % 500 === 0 && Math.floor(score) !== 0) {
    speed += 0.4;
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

  // Clouds
  clouds.forEach(c => {
    c.x -= 0.3;
    ctx.fillStyle = fg;
    ctx.fillRect(c.x, c.y, c.w, 6);
  });
  if (Math.random() < 0.005) {
    clouds.push({ x: canvas.width, y: 40 + Math.random() * 60, w: 40 });
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

  // Obstacles
  spawnCactus();
  spawnBird();

  cacti.forEach(c => {
    c.x -= speed;
    drawCactus(c, fg);
    if (collide(player, c)) endGame();
  });

  birds.forEach(b => {
    b.x -= speed + 1;
    b.frame = (b.frame + 1) % 20;
    drawBird(b, fg);
    if (collide(player, b)) endGame();
  });

  cacti = cacti.filter(c => c.x + c.w > 0);
  birds = birds.filter(b => b.x + b.w > 0);
  clouds = clouds.filter(c => c.x + c.w > 0);

  ctx.fillStyle = fg;
  ctx.fillText("Score: " + Math.floor(score), 10, 20);

  requestAnimationFrame(loop);
}

/* ================= END GAME ================= */
function endGame() {
  if (gameOver) return;
  gameOver = true;
  running = false;
  endSound.play();

  setTimeout(() => {
    deathMessageEl.textContent = "ഇത് ചാടാൻ പറ്റില്ലേ ഡാ 😭";
    scoreTextEl.textContent = "Score: " + Math.floor(score);
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

/* ================= START ================= */
startBtn.onclick = retryBtn.onclick = () => {
  startScreen.style.display = "none";
  cacti = [];
  birds = [];
  clouds = [];
  score = 0;
  speed = 6;
  running = true;
  gameOver = false;
  lastTime = performance.now();
  requestAnimationFrame(loop);
};

homeBtn.onclick = () => location.reload();
