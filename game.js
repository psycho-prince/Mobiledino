/* ================= BASIC SETUP ================= */
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const startScreen = document.getElementById("startScreen");
const startBtn = document.getElementById("startBtn");
const retryBtn = document.getElementById("retryBtn");
const homeBtn = document.getElementById("homeBtn");
const deathMessageEl = document.getElementById("deathMessage");
const scoreTextEl = document.getElementById("scoreText");
const highScoreTextEl = document.getElementById("highScoreText");
const soundToggle = document.getElementById("soundToggle");

/* ================= AUDIO ================= */
const jumpSound = new Audio("assets/jump.opus");
const endSound = new Audio("assets/end.opus");
let soundEnabled = true;

soundToggle.onclick = () => {
  soundEnabled = !soundEnabled;
  soundToggle.textContent = `Sound: ${soundEnabled ? 'ON' : 'OFF'}`;
  jumpSound.muted = !soundEnabled;
  endSound.muted = !soundEnabled;
};

/* ================= CHARACTERS ================= */
const characters = {
  p1: { img: "assets/player.png" },
  p2: { img: "assets/char_friend1.jpg", code: "4729" }
};

let activeChar = "p1";
const playerImg = new Image();
playerImg.src = characters.p1.img;
playerImg.onerror = () => console.log("Player image failed to load — using fallback rect");

window.selectPlayer = function (id) {
  const c = characters[id];
  if (!c) return;

  if (c.code && !localStorage.getItem("unlock_" + id)) {
    const input = prompt("Enter 4-digit code to unlock:");
    if (input !== c.code) {
      alert("Wrong code da 😭 Try again!");
      return;
    }
    localStorage.setItem("unlock_" + id, "1");
    alert("Unlocked! Now select it 🎉");
  }

  // Update UI
  document.querySelectorAll(".player-card").forEach(e => {
    e.classList.remove("selected");
    if (localStorage.getItem("unlock_" + id)) e.classList.remove("locked");
  });
  document.getElementById("card-" + id).classList.add("selected");

  activeChar = id;
  playerImg.src = c.img + "?v=" + Date.now(); // Force reload
  console.log(`Selected character: ${id}`);
};

/* ================= GAME STATE ================= */
let running = false;
let gameOver = false;
let score = 0;
let highScore = parseInt(localStorage.getItem("highScore")) || 0;
let speed = 6;
let gravity = 0.9;
let groundOffset = 0;
let cloudOffset = 0;
let isNight = false;

let lastTime = 0;

highScoreTextEl.textContent = `High Score: ${highScore}`;

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
let stars = [];

/* ================= HELPERS ================= */
function collide(a, b) {
  // Fair hitbox: shrink player by 20%
  const aHit = { x: a.x + a.w * 0.1, y: a.y + a.h * 0.1, w: a.w * 0.8, h: a.h * 0.8 };
  return (
    aHit.x < b.x + b.w &&
    aHit.x + aHit.w > b.x &&
    aHit.y < b.y + b.h &&
    aHit.y + aHit.h > b.y
  );
}

function genStars() {
  stars = [];
  for (let i = 0; i < 30; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * 120,
      r: Math.random() * 1.5 + 0.5,
      twinkle: Math.random() * Math.PI * 2
    });
  }
}

const deathMessages = [
  "ഇത് ചാടാൻ പറ്റില്ലേ ഡാ 😭",
  "അയ്യോ, അടിച്ചു! Try again da 🦕",
  "Game over da, but you're a legend! 🔥"
];

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

let birdSpawnTimer = 0;
function spawnBird() {
  if (score < 300) return;
  birdSpawnTimer += 1;
  if (birdSpawnTimer < 300 / speed || birds.length > 0) return; // Delay after threshold
  birdSpawnTimer = 0;

  const heights = [160, 180, 200];
  const idx = Math.floor(Math.random() * heights.length);
  birds.push({
    x: canvas.width + 50,
    y: heights[idx],
    w: 52,
    h: 40,
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
  const wing = Math.sin(b.frame * 0.3) > 0 ? -6 : 2; // Smoother animation
  // Body
  ctx.fillRect(b.x + 10, b.y + 10, 26, 12);
  // Wings
  ctx.fillRect(b.x, b.y + 8 + wing, 16, 8);
  ctx.fillRect(b.x + 26, b.y + 8 + wing, 16, 8);
  // Beak
  ctx.fillStyle = "#ff9800";
  ctx.fillRect(b.x + 36, b.y + 14, 10, 6);
  ctx.fillStyle = col;
}

function drawCloud(c, col) {
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.arc(c.x + 20, c.y, 20, 0, Math.PI * 2);
  ctx.arc(c.x + 40, c.y - 5, 25, 0, Math.PI * 2);
  ctx.arc(c.x + 60, c.y, 20, 0, Math.PI * 2);
  ctx.fill();
}

/* ================= MAIN LOOP ================= */
function loop(t) {
  if (!running) return;
  const delta = (t - lastTime) / 16; // Normalize to 60fps
  lastTime = t;

  score += delta * 0.02 * speed; // Score scales with speed

  // Cycles
  if (Math.floor(score) % 600 === 0 && Math.floor(score) > 0) {
    isNight = !isNight;
    if (isNight) genStars();
  }
  if (Math.floor(score) % 500 === 0 && Math.floor(score) > 0) {
    speed += 0.4;
  }

  const bg = isNight ? "#000011" : "#87CEEB"; // Better colors
  const fg = isNight ? "#fff" : "#333";

  // Background
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Sun/Moon
  ctx.fillStyle = isNight ? "#ccc" : "#ffeb3b";
  ctx.beginPath();
  ctx.arc(canvas.width - 80, 60, 18, 0, Math.PI * 2);
  ctx.fill();

  // Stars (twinkle)
  if (isNight) {
    stars.forEach(s => {
      s.twinkle += 0.1;
      ctx.globalAlpha = 0.8 + Math.sin(s.twinkle) * 0.2;
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  // Parallax Clouds
  cloudOffset -= 0.5;
  clouds.forEach(c => {
    c.x -= 0.3 * delta;
    drawCloud(c, isNight ? "#444" : "#fff");
  });
  clouds = clouds.filter(c => c.x > -80);
  if (Math.random() < 0.005 * delta) {
    clouds.push({ x: canvas.width, y: 40 + Math.random() * 60, w: 60 + Math.random() * 40 });
  }

  // Ground
  groundOffset = (groundOffset + speed * delta) % 40;
  ctx.fillStyle = fg;
  for (let i = 0; i < canvas.width + 40; i += 20) {
    ctx.fillRect((i - groundOffset) % (canvas.width + 40) - 40, 260, 10, 4);
  }

  // Player Physics
  player.vy += gravity * delta;
  player.y += player.vy * delta;
  if (player.y >= 220) {
    player.y = 220;
    player.vy = 0;
    player.jumping = false;
  }

  // Draw Player (fallback to rect if image fails)
  if (playerImg.complete && playerImg.naturalHeight !== 0) {
    ctx.drawImage(playerImg, player.x, player.y, player.w, player.h);
  } else {
    ctx.fillStyle = fg;
    ctx.fillRect(player.x, player.y, player.w, player.h);
  }

  // Spawn & Update Obstacles
  spawnCactus();
  spawnBird();

  cacti.forEach((c, i) => {
    c.x -= speed * delta;
    drawCactus(c, fg);
    if (collide(player, c)) endGame();
  });

  birds.forEach((b, i) => {
    b.x -= (speed + 1) * delta;
    b.frame += delta;
    drawBird(b, fg);
    if (collide(player, b)) endGame();
  });

  // Cleanup
  cacti = cacti.filter(c => c.x + c.w > -50);
  birds = birds.filter(b => b.x + b.w > -50);

  // UI
  ctx.fillStyle = fg;
  ctx.font = "bold 16px Arial";
  ctx.fillText(`Score: ${Math.floor(score)}`, 10, 25);
  ctx.fillText(`High: ${highScore}`, 10, 45);

  requestAnimationFrame(loop);
}

/* ================= END GAME ================= */
function endGame() {
  if (gameOver) return;
  gameOver = true;
  running = false;
  if (soundEnabled) endSound.play();

  if (Math.floor(score) > highScore) {
    highScore = Math.floor(score);
    localStorage.setItem("highScore", highScore);
    highScoreTextEl.textContent = `New High Score: ${highScore} 🎉`;
  } else {
    highScoreTextEl.textContent = `High Score: ${highScore}`;
  }

  const msg = deathMessages[Math.floor(Math.random() * deathMessages.length)];
  deathMessageEl.textContent = msg;
  scoreTextEl.textContent = `Final Score: ${Math.floor(score)}`;

  setTimeout(() => {
    startBtn.style.display = "none";
    retryBtn.style.display = "inline-block";
    homeBtn.style.display = "inline-block";
    startScreen.classList.remove("hidden");
    startScreen.style.display = "flex";
  }, 1000);
}

/* ================= INPUT ================= */
function jump(e) {
  if (e) e.preventDefault();
  if (player.jumping || !running) return;
  player.vy = -18;
  player.jumping = true;
  if (soundEnabled) {
    jumpSound.currentTime = 0;
    jumpSound.play().catch(() => console.log("Audio play failed"));
  }
}

document.addEventListener("keydown", (e) => {
  if (e.code === "Space") jump(e);
});
document.addEventListener("touchstart", jump);
canvas.addEventListener("click", jump); // Fallback for desktop

/* ================= START/RESET ================= */
function resetGame() {
  cacti = [];
  birds = [];
  clouds = [];
  if (isNight) stars = [];
  score = 0;
  speed = 6;
  isNight = false;
  player.y = 220;
  player.vy = 0;
  player.jumping = false;
  birdSpawnTimer = 0;
  running = true;
  gameOver = false;
  lastTime = performance.now();
  startScreen.classList.add("hidden");
  requestAnimationFrame(loop);
}

startBtn.onclick = resetGame;
retryBtn.onclick = resetGame;
homeBtn.onclick = () => location.reload();

// Init: Load high score display
highScoreTextEl.textContent = `High Score: ${highScore}`;
console.log("Mobile Dino Enhanced loaded! Ready to run. 🦖");
