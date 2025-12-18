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
let playerImg = new Image();
playerImg.src = currentPlayer.img;
let jumpSound = audio(currentPlayer.jump);
let endSound = audio(currentPlayer.end);

/* ================= MESSAGES ================= */
const deathMessages = [
  "ഇത് ചാടാൻ പറ്റില്ലേ ഡാ 😭",
  "കാക്ടസ്: 1 | നീ: 0 💀",
  "ബ്രോ… jump ബട്ടൺ ഉണ്ടല്ലോ 🤡",
  "ഇന്നും reflex vacation എടുത്തു 🏖️",
  "GG bro, next life try 😵"
];

/* ================= GAME STATE ================= */
let running = false, gameOver = false;
let score = 0, speed = 3;
let phase = "ground"; // ground | air
let groundOffset = 0;
let isNight = false;

const gravity = 0.9;

/* ================= PLAYER ================= */
const player = { x: 50, y: 220, w: 45, h: 45, vy: 0, jumping: false };

/* ================= OBJECTS ================= */
let cacti = [], birds = [], clouds = [], rocks = [], stars = [];

/* ================= CHARACTER SELECT ================= */
window.selectPlayer = function(id) {
  const p = players.find(x => x.id === id);
  if (!p) return;

  if (p.code && !localStorage.getItem("unlock_" + p.id)) {
    if (prompt("Enter code") !== p.code) return;
    localStorage.setItem("unlock_" + p.id, "1");
  }

  document.querySelectorAll(".player-card").forEach(c => c.classList.remove("selected"));
  document.getElementById("card-" + id).classList.add("selected");

  currentPlayer = p;
  playerImg.src = p.img;
  jumpSound = audio(p.jump);
  endSound = audio(p.end);
};

/* ================= SPAWN ================= */
setInterval(() => clouds.push({ x: 800, y: 40 + Math.random()*60, w: 40 }), 4000);
setInterval(() => rocks.push({ x: 800, y: 248, w: 4 }), 1500);
setInterval(() => phase === "ground" && cacti.push({ x: 800, y: 230 }), 2200);

/* ================= LOOP ================= */
function loop() {
  if (!running) return;

  if (score === 400) phase = "air";
  if (score === 800) speed += 0.8;

  ctx.fillStyle = isNight ? "#000" : "#fff";
  ctx.fillRect(0, 0, 800, 300);

  /* Ground */
  ctx.fillStyle = isNight ? "#fff" : "#000";
  for (let i=0;i<800;i+=20) ctx.fillRect(i-groundOffset,260,10,2);
  groundOffset = (groundOffset + speed) % 20;

  /* Player */
  player.vy += gravity;
  player.y += player.vy;
  if (player.y >= 220) { player.y = 220; player.vy = 0; player.jumping = false; }
  ctx.drawImage(playerImg, player.x, player.y, player.w, player.h);

  /* Cactus */
  cacti.forEach(o => { o.x -= speed; ctx.fillRect(o.x,o.y,18,40); });
  birds.forEach(b => { b.x -= speed+1; ctx.fillRect(b.x,b.y,18,6); });

  score++;
  ctx.fillText("Score: "+score, 10, 20);

  requestAnimationFrame(loop);
}

/* ================= GAME OVER ================= */
function endGame() {
  running = false;
  gameOver = true;
  endSound.play();

  setTimeout(() => {
    deathMessageEl.textContent = deathMessages[Math.floor(Math.random()*deathMessages.length)];
    scoreTextEl.textContent = "Score: " + score;
    deathMessageEl.style.display = scoreTextEl.style.display = "block";
    startBtn.style.display = "none";
    retryBtn.style.display = homeBtn.style.display = "inline-block";
    startScreen.style.display = "flex";
  }, 900);
}

/* ================= INPUT ================= */
document.addEventListener("keydown", () => {
  if (!player.jumping && running) {
    player.vy = -22;
    player.jumping = true;
    jumpSound.play();
  }
});

/* ================= BUTTONS ================= */
startBtn.onclick = retryBtn.onclick = () => {
  startScreen.style.display = "none";
  cacti = birds = clouds = rocks = [];
  score = 0; speed = 3; phase = "ground";
  running = true; gameOver = false;
  loop();
};

homeBtn.onclick = () => location.reload();
