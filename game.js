const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const startScreen = document.getElementById("startScreen");
const startBtn = document.getElementById("startBtn");

/* ------------------ CHARACTERS ------------------ */

const characters = [
  {
    id: "default",
    name: "OG Hero",
    img: "assets/player.png",
    voices: {
      jump: "assets/jump.opus",
      end: "assets/end.opus"
    },
    unlocked: true
  },
  {
    id: "friend1",
    name: "Secret Friend 😈",
    img: "assets/char_friend1.png",
    code: "4729",
    voices: {
      jump: "assets/char_friend1_jump.opus",
      end: "assets/char_friend1_end.opus"
    }
  }
];

let selectedCharacter =
  JSON.parse(localStorage.getItem("selectedCharacter")) || characters[0];

const playerImg = new Image();
playerImg.src = selectedCharacter.img;

let jumpSound = null;
let endSound = null;

/* ------------------ GAME STATE ------------------ */

let gameRunning = false;
let score = 0;
let speed = 3.2;
let isNight = false;

const gravity = 0.9;
let shakeFrames = 0;

/* Player */
const player = {
  x: 50,
  y: 220,
  w: 45,
  h: 45,
  vy: 0,
  jumping: false
};

/* Environment */
let obstacles = [];
let clouds = [];
let rocks = [];
let stars = [];
let groundOffset = 0;

/* Malayalam Death Messages */
const deathMessages = [
  "ഇത് ചാടാൻ പറ്റില്ലേ ഡാ 😂",
  "കാക്ടസ് നിന്നെ കളിയാക്കി 🌵",
  "കണ്ണ് തുറന്ന് കളിക്കു ബ്രോ 😭",
  "ചാടാൻ മറന്നോ 😆",
  "ഇന്നും കാക്ടസ് ജയിച്ചു 💀"
];

/* ------------------ CHARACTER UI ------------------ */

function renderCharacters() {
  const container = document.getElementById("characterSelect");
  container.innerHTML = "";

  characters.forEach(char => {
    const unlocked =
      char.unlocked || localStorage.getItem("unlock_" + char.id) === "true";

    const div = document.createElement("div");
    div.className = "character" + (unlocked ? "" : " locked");

    div.innerHTML = `
      <img src="${char.img}">
      <span>${char.name}${unlocked ? "" : " 🔒"}</span>
    `;

    div.onclick = () => {
      if (unlocked) {
        selectCharacter(char);
      } else {
        const code = prompt("Enter 4-digit code:");
        if (code === char.code) {
          localStorage.setItem("unlock_" + char.id, "true");
          selectCharacter(char);
          alert("Unlocked 🎉");
          renderCharacters();
        } else {
          alert("Wrong code 😅");
        }
      }
    };

    container.appendChild(div);
  });
}

function selectCharacter(char) {
  selectedCharacter = char;
  playerImg.src = char.img;

  jumpSound = new Audio(char.voices.jump);
  endSound = new Audio(char.voices.end);

  localStorage.setItem("selectedCharacter", JSON.stringify(char));
}

renderCharacters();

/* ------------------ GAME HELPERS ------------------ */

function spawnObstacle() {
  obstacles.push({
    x: canvas.width,
    y: 230,
    w: 18,
    h: 40,
    variant: Math.random() > 0.5 ? "double" : "single"
  });
}

function isColliding(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

function drawCactus(o, color) {
  ctx.fillStyle = color;
  ctx.fillRect(o.x, o.y, 18, 40);
  ctx.fillRect(o.x + 18, o.y + 18, 8, 12);
}

/* ------------------ GAME LOOP ------------------ */

function gameLoop() {
  if (!gameRunning) return;

  if (score > 0 && score % 600 === 0) isNight = !isNight;

  const bg = isNight ? "#000" : "#fff";
  const fg = isNight ? "#fff" : "#000";

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Player physics
  player.vy += gravity;
  player.y += player.vy;
  if (player.y >= 220) {
    player.y = 220;
    player.vy = 0;
    player.jumping = false;
  }

  ctx.drawImage(playerImg, player.x, player.y, player.w, player.h);

  obstacles.forEach(o => {
    o.x -= speed;
    drawCactus(o, fg);

    if (isColliding(player, o)) {
      gameRunning = false;
      if (endSound) endSound.play();
      startScreen.style.display = "flex";
      startBtn.textContent =
        "RETRY – " + deathMessages[Math.floor(Math.random() * deathMessages.length)];
    }
  });

  obstacles = obstacles.filter(o => o.x + o.w > 0);

  score++;
  speed += 0.0006;

  ctx.fillStyle = fg;
  ctx.fillText(`Score: ${score}`, 10, 20);

  requestAnimationFrame(gameLoop);
}

/* ------------------ INPUT ------------------ */

function jump() {
  if (!player.jumping && gameRunning) {
    player.vy = -22;
    player.jumping = true;
    if (jumpSound) {
      jumpSound.currentTime = 0;
      jumpSound.play();
    }
  }
}

document.addEventListener("keydown", jump);
document.addEventListener("touchstart", jump);

/* ------------------ START ------------------ */

startBtn.onclick = () => {
  startScreen.style.display = "none";
  obstacles = [];
  score = 0;
  speed = 3.2;
  isNight = false;
  gameRunning = true;

  if (jumpSound) {
    jumpSound.play(); jumpSound.pause();
    endSound.play(); endSound.pause();
  }

  spawnObstacle();
  setInterval(spawnObstacle, 1700);
  gameLoop();
};
