const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');

const keys = {};
const player = {
  x: canvas.width / 2,
  y: canvas.height - 60,
  width: 32,
  height: 32,
  speed: 5,
  cooldown: 0,
  lives: 3,
  invulnerable: 0,
};

const bullets = [];
const enemies = [];
const explosions = [];
const stars = [];
let score = 0;
let gameOver = false;
let lastTime = 0;

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function resetStars() {
  stars.length = 0;
  for (let i = 0; i < 100; i += 1) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 2 + 1,
      speed: Math.random() * 1.5 + 0.5,
    });
  }
}

function shoot() {
  if (gameOver) return;
  bullets.push({
    x: player.x,
    y: player.y - 16,
    width: 5,
    height: 14,
    speed: 8,
  });
}

function createEnemy() {
  enemies.push({
    x: randomBetween(30, canvas.width - 30),
    y: -20,
    width: 28,
    height: 28,
    speed: randomBetween(1.1, 2.6),
    drift: randomBetween(-1.2, 1.2),
  });
}

function createExplosion(x, y, color) {
  for (let i = 0; i < 12; i += 1) {
    explosions.push({
      x,
      y,
      vx: randomBetween(-2.5, 2.5),
      vy: randomBetween(-2.5, 2.5),
      radius: randomBetween(2, 5),
      color,
      life: 28,
    });
  }
}

function hitPlayer() {
  if (player.invulnerable > 0 || gameOver) return;

  player.lives -= 1;
  player.invulnerable = 90;
  createExplosion(player.x, player.y, '#fbbf24');

  if (player.lives <= 0) {
    gameOver = true;
  }
}

function updateHud() {
  scoreEl.textContent = score;
  livesEl.textContent = player.lives;
}

function handleInput() {
  if (keys.ArrowLeft || keys.a) player.x -= player.speed;
  if (keys.ArrowRight || keys.d) player.x += player.speed;
  if (keys.ArrowUp || keys.w) player.y -= player.speed;
  if (keys.ArrowDown || keys.s) player.y += player.speed;

  player.x = Math.max(18, Math.min(canvas.width - 18, player.x));
  player.y = Math.max(30, Math.min(canvas.height - 30, player.y));

  if (keys[' ']) {
    if (player.cooldown <= 0) {
      shoot();
      player.cooldown = 220;
    }
  }

  player.cooldown = Math.max(0, player.cooldown - 16.67);
}

function updateGame() {
  if (gameOver) {
    return;
  }

  handleInput();

  if (Math.random() < 0.018) {
    createEnemy();
  }

  for (const star of stars) {
    star.y += star.speed;
    if (star.y > canvas.height) {
      star.y = 0;
      star.x = Math.random() * canvas.width;
    }
  }

  for (const bullet of bullets) {
    bullet.y -= bullet.speed;
  }

  for (const enemy of enemies) {
    enemy.x += enemy.drift;
    enemy.y += enemy.speed;

    if (enemy.x < 15 || enemy.x > canvas.width - 15) {
      enemy.drift *= -1;
    }
  }

  for (let i = bullets.length - 1; i >= 0; i -= 1) {
    const bullet = bullets[i];
    if (bullet.y < -20) {
      bullets.splice(i, 1);
      continue;
    }

    for (let j = enemies.length - 1; j >= 0; j -= 1) {
      const enemy = enemies[j];
      if (bullet.x < enemy.x + enemy.width &&
          bullet.x + bullet.width > enemy.x &&
          bullet.y < enemy.y + enemy.height &&
          bullet.y + bullet.height > enemy.y) {
        bullets.splice(i, 1);
        enemies.splice(j, 1);
        score += 10;
        createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#7dd3fc');
        break;
      }
    }
  }

  for (let i = enemies.length - 1; i >= 0; i -= 1) {
    const enemy = enemies[i];
    if (enemy.y > canvas.height + 20) {
      enemies.splice(i, 1);
      continue;
    }

    if (
      enemy.x < player.x + player.width &&
      enemy.x + enemy.width > player.x &&
      enemy.y < player.y + player.height &&
      enemy.y + enemy.height > player.y
    ) {
      enemies.splice(i, 1);
      hitPlayer();
    }
  }

  for (let i = explosions.length - 1; i >= 0; i -= 1) {
    const particle = explosions[i];
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.life -= 1;

    if (particle.life <= 0) {
      explosions.splice(i, 1);
    }
  }

  if (player.invulnerable > 0) {
    player.invulnerable -= 1;
  }

  updateHud();
}

function drawShip(x, y, width, height) {
  ctx.beginPath();
  ctx.moveTo(x, y - height / 2);
  ctx.lineTo(x + width / 2, y + height / 2);
  ctx.lineTo(x, y + height / 4);
  ctx.lineTo(x - width / 2, y + height / 2);
  ctx.closePath();
  ctx.fillStyle = '#7dd3fc';
  ctx.fill();

  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(x - 3, y + 5, 6, 10);
}

function drawBullets() {
  ctx.fillStyle = '#fbbf24';
  for (const bullet of bullets) {
    ctx.fillRect(bullet.x - bullet.width / 2, bullet.y, bullet.width, bullet.height);
  }
}

function drawEnemies() {
  ctx.fillStyle = '#f472b6';
  for (const enemy of enemies) {
    ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    ctx.fillStyle = '#fbcfe8';
    ctx.fillRect(enemy.x + 7, enemy.y + 7, 5, 5);
    ctx.fillRect(enemy.x + 16, enemy.y + 7, 5, 5);
    ctx.fillStyle = '#f472b6';
  }
}

function drawStars() {
  ctx.fillStyle = '#dbeafe';
  for (const star of stars) {
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawExplosions() {
  for (const particle of explosions) {
    ctx.fillStyle = particle.color;
    ctx.globalAlpha = Math.max(0, particle.life / 28);
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function drawGameOver() {
  if (!gameOver) return;

  ctx.fillStyle = 'rgba(2, 6, 23, 0.7)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 12);

  ctx.font = '24px Arial';
  ctx.fillText('Score: ' + score, canvas.width / 2, canvas.height / 2 + 28);
  ctx.fillText('Press R to retry', canvas.width / 2, canvas.height / 2 + 68);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawStars();

  if (player.invulnerable > 0 && Math.floor(player.invulnerable / 8) % 2 === 0) {
    ctx.globalAlpha = 0.4;
  }

  drawShip(player.x, player.y, player.width, player.height);
  ctx.globalAlpha = 1;

  drawBullets();
  drawEnemies();
  drawExplosions();
  drawGameOver();
}

function gameLoop(timestamp) {
  const delta = timestamp - lastTime || 16.67;
  lastTime = timestamp;

  if (delta > 0) {
    updateGame();
    draw();
  }

  requestAnimationFrame(gameLoop);
}

window.addEventListener('keydown', (event) => {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  keys[key] = true;

  if (gameOver && key === 'r') {
    player.lives = 3;
    player.x = canvas.width / 2;
    player.y = canvas.height - 60;
    bullets.length = 0;
    enemies.length = 0;
    explosions.length = 0;
    score = 0;
    gameOver = false;
    updateHud();
  }

  if (key === ' ') {
    event.preventDefault();
  }
});

window.addEventListener('keyup', (event) => {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  keys[key] = false;
});

resetStars();
updateHud();
requestAnimationFrame(gameLoop);
