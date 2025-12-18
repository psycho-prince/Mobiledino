const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const overlay = document.getElementById("overlay");
const playBtn = document.getElementById("playBtn");
const message = document.getElementById("message");

/* ---------- AUDIO ---------- */
const jumpSound = new Audio("assets/jump.opus");
const endSound = new Audio("assets/end.opus");

/* ---------- PLAYER IMAGE ---------- */
const playerImg = new Image();
playerImg.src = "assets/player.png";
let playerImgReady = false;

playerImg.onload = () => (playerImgReady = true);

/* ---------- GAME STATE ---------- */
let running = false;
let score = 0;
let speed = 6;
let gravity = 0.9;
let groundOffset = 0;
let isNight = false;

/* ---------- PLAYER ---------- */
const player = {
  x: 50,
  y: 220,
  w: 40,
  h: 40,
  vy: 0,
  jumping: false,
  runFrame: 0,
  runTick: 0
};

/* ---------- OBJECTS ---------- */
let cacti = [];
let birds = [];
let clouds = [];
let stones = [];
let stars = [];

/* ---------- BIRD CONTROL ---------- */
const birdHeights = [200, 180];
let birdIndex = 0;
let birdCooldown = 0;

/* ---------- MEME DEATH MESSAGES ---------- */
const memes = [
  "ഇത് ചാടാൻ പറ്റില്ലേ ഡാ 😭",
  "Skill issue bro 🤡",
  "Kaktoos: 1  |  Nee: 0 🌵",
  "Bird പറന്നു… നീ വീണു 🐦",
  "Reflex vacation എടുത്തു 🏖️",
  "GG bro, next life try 😵",
  "Jump button exists btw 😶",
  "Slow internet alle problem 😌",
  "Practice makes perfect… today not 😭",
  "Chrome Dino proud of you 🫡",
  "ഇത് speed run അല്ല bro 😂",
  "Ayyo… നേരെ കയറി 💀"
];

function randomMeme() {
  return memes[Math.floor(Math.random() * memes.length)];
}

/* ---------- HELPERS ---------- */
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

/* ---------- SPAWN ---------- */
function spawnCactus() {
  const last = cacti[cacti.length - 1];
  if (last && last.x > 520) return;

  cacti.push({
    x: canvas.width,
    y: 230,
    w: 18,
    h: 40
  });
}

function spawnBird() {
  if (score < 400) return;
  if (birds.length > 0) return;
  if (birdCooldown > 0) return;

  birds.push({
    x: canvas.width,
    y: birdHeights[birdIndex],
    w: 34,
    h: 14,
    frame: 0
  });

  birdIndex = (birdIndex + 1) % birdHeights.length;
  birdCooldown = 240; // big gap between birds
}

function spawnCloud() {
  clouds.push({
    x: canvas.width,
    y: 40 + Math.random() * 60,
    w: 40 + Math.random() * 20
  });
}

function spawnStone() {
  stones.push({
    x: canvas.width,
    y: 252,
    w: 3 + Math.random() * 4
  });
}

/* ---------- DRAW ---------- */
function drawBird(b, color) {
  const wing = b.frame < 12 ? -4 : 0;
  ctx.fillStyle = color;
  ctx.fillRect(b.x, b.y, 18, 6);
  ctx.fillRect(b.x + 4, b.y + wing, 6, 4);
  ctx.fillRect(b.x + 12, b.y + wing, 6, 4);
}

/* ---------- MAIN LOOP ---------- */
function loop() {
  if (!running) return;

  score++;

  if (score % 600 === 0) {
    isNight = !isNight;
    if (isNight) generateStars();
  }

  if (birdCooldown > 0) birdCooldown--;

  const bg = isNight ? "#000" : "#fff";
  const fg = isNight ? "#fff" : "#000";

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Stars + Sun/Moon
  if (isNight) {
    ctx.fillStyle = "#fff";
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  ctx.fillStyle = isNight ? "#fff" : "#ffeb3b";
  ctx.beginPath();
  ctx.arc(720, 60, 16, 0, Math.PI * 2);
  ctx.fill();

  // Clouds
  if (Math.random() < 0.01) spawnCloud();
  clouds.forEach(c => {
    c.x -= 0.25;
    ctx.fillStyle = fg;
    ctx.fillRect(c.x, c.y, c.w, 6);
  });
  clouds = clouds.filter(c => c.x + c.w > 0);

  // Ground
  ctx.fillStyle = fg;
  for (let i = 0; i < canvas.width; i += 20) {
    ctx.fillRect(i - groundOffset, 260, 10, 2);
  }
  groundOffset = (groundOffset + speed) % 20;

  // Stones
  if (Math.random() < 0.04) spawnStone();
  stones.forEach(s => {
    s.x -= speed;
    ctx.fillRect(s.x, s.y, s.w, 2);
  });
  stones = stones.filter(s => s.x + s.w > 0);

  // Player physics
  player.vy += gravity;
  player.y += player.vy;
  if (player.y >= 220) {
    player.y = 220;
    player.vy = 0;
    player.jumping = false;
  }

  // Running animation
  if (!player.jumping) {
    player.runTick++;
    if (player.runTick % 6 === 0) {
      player.runFrame = 1 - player.runFrame;
    }
  }

  // Player render
  if (playerImgReady) {
    ctx.save();
    ctx.shadowColor = isNight ? "#0f0" : "#000";
    ctx.shadowBlur = 6;

    const legOffset = player.runFrame === 0 ? 0 : 2;
    ctx.drawImage(
      playerImg,
      player.x,
      player.y + legOffset,
      player.w,
      player.h
    );
    ctx.restore();
  } else {
    ctx.fillStyle = fg;
    ctx.fillRect(player.x, player.y, player.w, player.h);
  }

  // Cactus
  spawnCactus();
  cacti.forEach(c => {
    c.x -= speed;
    ctx.fillRect(c.x, c.y, c.w, c.h);
    if (collide(player, c)) endGame();
  });
  cacti = cacti.filter(c => c.x + c.w > 0);

  // Birds (slower than cactus)
  spawnBird();
  birds.forEach(b => {
    b.x -= speed * 0.7;
    b.frame = (b.frame + 1) % 24;
    drawBird(b, fg);
    if (collide(player, b)) endGame();
  });
  birds = birds.filter(b => b.x + b.w > 0);

  // HUD
  ctx.fillStyle = fg;
  ctx.fillText("Score: " + score, 10, 20);

  requestAnimationFrame(loop);
}

/* ---------- INPUT ---------- */
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

/* ---------- GAME CONTROL ---------- */
function startGame() {
  overlay.style.display = "none";
  cacti = [];
  birds = [];
  clouds = [];
  stones = [];
  score = 0;
  speed = 6;
  groundOffset = 0;
  isNight = false;
  birdCooldown = 0;

  // unlock audio on mobile
  jumpSound.play(); jumpSound.pause();
  endSound.play(); endSound.pause();

  running = true;
  loop();
}

function endGame() {
  running = false;
  endSound.currentTime = 0;
  endSound.play();
  message.textContent = `💀 ${randomMeme()} | Score: ${score}`;
  playBtn.textContent = "RETRY";
  overlay.style.display = "flex";
}

playBtn.onclick = startGame;
