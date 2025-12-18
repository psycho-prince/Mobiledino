const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const startScreen = document.getElementById("startScreen");
const startBtn = document.getElementById("startBtn");

/* ---------- AUDIO ---------- */
function safeAudio(src) {
  const a = new Audio(src);
  a.preload = "auto";
  a.onerror = () => console.warn("Audio failed:", src);
  return a;
}

/* ---------- PLAYERS ---------- */
const players = [
  {
    id: "p1",
    img: "assets/player.png",
    jump: "assets/jump.opus",
    end: "assets/end.opus",
    unlocked: true
  },
  {
    id: "p2",
    img: "assets/char_friend1.jpg",
    jump: "assets/char_friend1_jump.mp3",
    end: "assets/char_friend1_end.mp3",
    code: "4729"
  }
];

let currentPlayer = players[0];

const playerImg = new Image();
playerImg.src = currentPlayer.img;

let jumpSound = safeAudio(currentPlayer.jump);
let endSound = safeAudio(currentPlayer.end);

/* ---------- GAME STATE ---------- */
let gameRunning = false;
let score = 0;
let speed = 3;
let obstacleTimer = null;
let cloudTimer = null;
let rockTimer = null;

let isNight = false;
let groundOffset = 0;

const gravity = 0.9;

/* ---------- PLAYER ---------- */
const player = {
  x: 50,
  y: 220,
  w: 45,
  h: 45,
  vy: 0,
  jumping: false
};

/* ---------- ENV OBJECTS ---------- */
let obstacles = [];
let birds = [];
let clouds = [];
let rocks = [];
let stars = [];

/* ---------- PLAYER SELECT ---------- */
function clearSelection() {
  document.querySelectorAll(".player-card")
    .forEach(c => c.classList.remove("selected"));
}

function selectPlayer(id) {
  const p = players.find(x => x.id === id);
  if (!p) return;

  if (p.code && !localStorage.getItem("unlock_" + p.id)) {
    const input = prompt("Enter 4-digit code:");
    if (input !== p.code) return alert("Wrong code 😅");
    localStorage.setItem("unlock_" + p.id, "true");
  }

  currentPlayer = p;
  playerImg.src = p.img;
  jumpSound = safeAudio(p.jump);
  endSound = safeAudio(p.end);

  clearSelection();
  document.getElementById("card-" + id)?.classList.add("selected");
}

/* ---------- SPAWN ---------- */
function spawnObstacle() {
  obstacles.push({
    x: canvas.width,
    y: 230,
    w: 18,
    h: 40
  });
}

function spawnBird() {
  birds.push({
    x: canvas.width,
    y: 170 + Math.random() * 30,
    w: 30,
    h: 12
  });
}

function spawnCloud() {
  clouds.push({
    x: canvas.width,
    y: 40 + Math.random() * 60,
    w: 30 + Math.random() * 30
  });
}

function spawnRock() {
  rocks.push({
    x: canvas.width,
    y: 248,
    w: 4 + Math.random() * 4
  });
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

/* ---------- COLLISION ---------- */
function isColliding(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

/* ---------- DRAW ---------- */
function drawCactus(o, c) {
  ctx.fillStyle = c;
  ctx.fillRect(o.x, o.y, 18, 40);
  ctx.fillRect(o.x + 18, o.y + 18, 8, 12);
}

function drawBird(b, c) {
  ctx.fillStyle = c;
  ctx.fillRect(b.x, b.y, 18, 6);
  ctx.fillRect(b.x + 4, b.y - 4, 6, 4);
  ctx.fillRect(b.x + 12, b.y - 4, 6, 4);
}

function drawGround(c) {
  ctx.fillStyle = c;
  for (let i = 0; i < canvas.width; i += 20) {
    ctx.fillRect(i - groundOffset, 260, 10, 2);
  }
  groundOffset = (groundOffset + speed) % 20;
}

function drawClouds(c) {
  ctx.fillStyle = c;
  clouds.forEach(cl => {
    ctx.fillRect(cl.x, cl.y, cl.w, 6);
    ctx.fillRect(cl.x + 6, cl.y - 4, cl.w - 12, 4);
    cl.x -= 0.3;
  });
  clouds = clouds.filter(c => c.x + c.w > 0);
}

function drawRocks(c) {
  ctx.fillStyle = c;
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
  ctx.arc(720, 60, 18, 0, Math.PI * 2);
  ctx.fill();
}

function drawSun() {
  ctx.fillStyle = "#ffeb3b";
  ctx.beginPath();
  ctx.arc(720, 60, 18, 0, Math.PI * 2);
  ctx.fill();
}

/* ---------- GAME LOOP ---------- */
function gameLoop() {
  if (!gameRunning) return;

  if (score > 0 && score % 600 === 0) {
    isNight = !isNight;
    if (isNight) generateStars();
  }

  const bg = isNight ? "#000" : "#fff";
  const fg = isNight ? "#fff" : "#000";

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (isNight) {
    drawStars();
    drawMoon();
  } else {
    drawSun();
  }

  drawClouds(fg);
  drawGround(fg);

  // Player physics
  player.vy += gravity;
  player.y += player.vy;
  if (player.y >= 220) {
    player.y = 220;
    player.vy = 0;
    player.jumping = false;
  }

  ctx.drawImage(playerImg, player.x, player.y, player.w, player.h);

  drawRocks(fg);

  obstacles.forEach(o => {
    o.x -= speed;
    drawCactus(o, fg);
    if (isColliding(player, o)) endGame();
  });

  birds.forEach(b => {
    b.x -= speed + 1;
    drawBird(b, fg);
    if (isColliding(player, b)) endGame();
  });

  obstacles = obstacles.filter(o => o.x + o.w > 0);
  birds = birds.filter(b => b.x + b.w > 0);

  score++;
  speed += 0.0005;

  ctx.fillStyle = fg;
  ctx.fillText(`Score: ${score}`, 10, 20);

  requestAnimationFrame(gameLoop);
}

function endGame() {
  gameRunning = false;
  endSound.currentTime = 0;
  endSound.play();
  startScreen.style.display = "flex";
  startBtn.textContent = "RETRY";
}

/* ---------- INPUT ---------- */
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

/* ---------- START ---------- */
startBtn.onclick = () => {
  startScreen.style.display = "none";

  obstacles = [];
  birds = [];
  clouds = [];
  rocks = [];
  stars = [];
  score = 0;
  speed = 3;
  isNight = false;
  groundOffset = 0;

  player.y = 220;
  player.vy = 0;
  player.jumping = false;

  if (obstacleTimer) clearInterval(obstacleTimer);
  if (cloudTimer) clearInterval(cloudTimer);
  if (rockTimer) clearInterval(rockTimer);

  jumpSound.play(); jumpSound.pause();
  endSound.play(); endSound.pause();

  gameRunning = true;
  spawnObstacle();

  obstacleTimer = setInterval(spawnObstacle, 1700);
  cloudTimer = setInterval(spawnCloud, 4000);
  rockTimer = setInterval(spawnRock, 1500);

  setInterval(() => {
    if (score > 300) spawnBird();
  }, 2500);

  gameLoop();
};
