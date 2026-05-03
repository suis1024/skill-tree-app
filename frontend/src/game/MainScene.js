import Phaser from "phaser";
import { computeStats } from "./skills";

const PLAYER_BASE_SPEED = 220;
const BULLET_SPEED = 500;
const BULLET_BASE_INTERVAL_MS = 350;
const ENEMY_SPAWN_INTERVAL_MS = 1000;
const ENEMY_SPEED = 90;
const COIN_BASE_PICKUP_RADIUS = 60;
const COIN_MAGNET_SPEED = 320;
const ENEMY_BASE_HP = 1;
const BULLET_BASE_DAMAGE = 1;

export default class MainScene extends Phaser.Scene {
  constructor() {
    super("MainScene");
  }

  create() {
    this.cameras.main.setBackgroundColor("#0f172a");

    this.worldWidth = this.scale.width;
    this.worldHeight = this.scale.height;
    this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight);

    this.scale.on("resize", (gameSize) => {
      this.worldWidth = gameSize.width;
      this.worldHeight = gameSize.height;
      this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight);
      if (this.timeText) this.timeText.setX(this.worldWidth - 16);
    });

    const skillLevels = this.registry.get("skillLevels") || {};
    this.stats = computeStats(skillLevels);

    this.maxHp = this.stats.maxHp;
    this.hp = this.maxHp;
    this.coins = this.stats.startBonus;
    this.elapsedMs = 0;
    this.regenAccum = 0;
    this.gameOverActive = false;
    this.invincibleUntil = 0;
    this.reviveAvailable = this.stats.hasRevive;

    this.player = this.add.rectangle(this.worldWidth / 2, this.worldHeight / 2, 28, 28, 0x60a5fa);
    this.physics.add.existing(this.player);
    this.player.body.setCollideWorldBounds(true);
    this.aimDir = new Phaser.Math.Vector2(1, 0);

    this.bullets = this.physics.add.group();
    this.enemies = this.physics.add.group();
    this.coinSprites = this.physics.add.group();

    this.keysWasd = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });
    this.keysArrow = this.input.keyboard.createCursorKeys();

    this.touchVector = { x: 0, y: 0 };
    this.joystickActive = false;
    this.joystickStart = { x: 0, y: 0 };
    this.joystickMaxDist = 60;

    this.joystickBase = this.add.circle(0, 0, this.joystickMaxDist, 0xffffff, 0.12).setVisible(false).setDepth(1000);
    this.joystickKnob = this.add.circle(0, 0, 22, 0xffffff, 0.28).setVisible(false).setDepth(1001);

    this.input.on("pointerdown", (pointer) => this.onTouchDown(pointer));
    this.input.on("pointermove", (pointer) => this.onTouchMove(pointer));
    this.input.on("pointerup", () => this.onTouchUp());
    this.input.on("pointerupoutside", () => this.onTouchUp());

    const fireDelay = Math.max(60, BULLET_BASE_INTERVAL_MS / this.stats.fireRateMul);
    this.fireTimer = this.time.addEvent({
      delay: fireDelay,
      loop: true,
      callback: () => this.fireBullet(),
    });

    this.spawnTimer = this.time.addEvent({
      delay: ENEMY_SPAWN_INTERVAL_MS,
      loop: true,
      callback: () => this.spawnEnemy(),
    });

    this.physics.add.overlap(this.bullets, this.enemies, (bullet, enemy) => this.onBulletHit(bullet, enemy));
    this.physics.add.overlap(this.player, this.enemies, (_p, enemy) => this.hitPlayer(enemy));
    this.physics.add.overlap(this.player, this.coinSprites, (_p, coin) => this.pickupCoin(coin));

    this.createHud();
  }

  createHud() {
    const style = { fontFamily: "system-ui, sans-serif", fontSize: "18px", color: "#e2e8f0" };
    const top = this.registry.get("safeAreaTop") || 12;
    this.hudTop = top;
    this.hpText = this.add.text(16, top, "", style).setDepth(2000);
    this.coinText = this.add.text(16, top + 24, "", style).setDepth(2000);
    this.timeText = this.add.text(this.worldWidth - 16, top, "", style).setOrigin(1, 0).setDepth(2000);
    this.refreshHud();
  }

  refreshHud() {
    const hp = Math.max(0, Math.floor(this.hp));
    const empty = Math.max(0, this.maxHp - hp);
    this.hpText.setText(`HP: ${"♥".repeat(hp)}${"·".repeat(empty)}`);
    this.coinText.setText(`COIN: ${this.coins}`);
    const total = Math.floor(this.elapsedMs / 1000);
    const m = String(Math.floor(total / 60)).padStart(2, "0");
    const s = String(total % 60).padStart(2, "0");
    this.timeText.setText(`TIME: ${m}:${s}`);
  }

  update(_time, delta) {
    if (this.gameOverActive) return;

    this.elapsedMs += delta;

    if (this.stats.regenPerSec > 0 && this.hp < this.maxHp) {
      this.regenAccum += this.stats.regenPerSec * (delta / 1000);
      if (this.regenAccum >= 1) {
        const heal = Math.floor(this.regenAccum);
        this.hp = Math.min(this.maxHp, this.hp + heal);
        this.regenAccum -= heal;
      }
    }

    const body = this.player.body;
    const speed = PLAYER_BASE_SPEED * this.stats.speedMul;

    let vx = 0, vy = 0;
    if (this.joystickActive) {
      vx = this.touchVector.x;
      vy = this.touchVector.y;
    } else {
      const leftDown = this.keysWasd.left.isDown || this.keysArrow.left.isDown;
      const rightDown = this.keysWasd.right.isDown || this.keysArrow.right.isDown;
      const upDown = this.keysWasd.up.isDown || this.keysArrow.up.isDown;
      const downDown = this.keysWasd.down.isDown || this.keysArrow.down.isDown;
      vx = (leftDown ? -1 : 0) + (rightDown ? 1 : 0);
      vy = (upDown ? -1 : 0) + (downDown ? 1 : 0);
    }

    const mag = Math.hypot(vx, vy);
    if (mag > 0.01) {
      const nx = vx / mag;
      const ny = vy / mag;
      const intensity = Math.min(mag, 1);
      body.setVelocity(nx * speed * intensity, ny * speed * intensity);
      this.aimDir.set(nx, ny);
    } else {
      body.setVelocity(0, 0);
    }

    this.enemies.children.iterate((enemy) => {
      if (!enemy || !enemy.body) return;
      const dx = this.player.x - enemy.x;
      const dy = this.player.y - enemy.y;
      const len = Math.hypot(dx, dy) || 1;
      enemy.body.setVelocity((dx / len) * ENEMY_SPEED, (dy / len) * ENEMY_SPEED);
    });

    const magnetRadius = COIN_BASE_PICKUP_RADIUS * this.stats.magnetMul;
    this.coinSprites.children.iterate((coin) => {
      if (!coin || !coin.body) return;
      const dx = this.player.x - coin.x;
      const dy = this.player.y - coin.y;
      const dist = Math.hypot(dx, dy);
      if (dist < magnetRadius) {
        const len = dist || 1;
        coin.body.setVelocity((dx / len) * COIN_MAGNET_SPEED, (dy / len) * COIN_MAGNET_SPEED);
      } else {
        coin.body.setVelocity(0, 0);
      }
    });

    if (this.invincibleUntil > 0 && this.time.now > this.invincibleUntil) {
      this.invincibleUntil = 0;
      this.player.setAlpha(1);
    }

    this.refreshHud();
  }

  onTouchDown(pointer) {
    this.joystickActive = true;
    this.joystickStart.x = pointer.x;
    this.joystickStart.y = pointer.y;
    this.touchVector.x = 0;
    this.touchVector.y = 0;
    this.joystickBase.setPosition(pointer.x, pointer.y).setVisible(true);
    this.joystickKnob.setPosition(pointer.x, pointer.y).setVisible(true);
  }

  onTouchMove(pointer) {
    if (!this.joystickActive) return;
    const dx = pointer.x - this.joystickStart.x;
    const dy = pointer.y - this.joystickStart.y;
    const len = Math.hypot(dx, dy);
    if (len < 1) {
      this.touchVector.x = 0;
      this.touchVector.y = 0;
      this.joystickKnob.setPosition(this.joystickStart.x, this.joystickStart.y);
      return;
    }
    const clamped = Math.min(len, this.joystickMaxDist);
    const nx = dx / len;
    const ny = dy / len;
    this.touchVector.x = nx * (clamped / this.joystickMaxDist);
    this.touchVector.y = ny * (clamped / this.joystickMaxDist);
    this.joystickKnob.setPosition(
      this.joystickStart.x + nx * clamped,
      this.joystickStart.y + ny * clamped,
    );
  }

  onTouchUp() {
    this.joystickActive = false;
    this.touchVector.x = 0;
    this.touchVector.y = 0;
    this.joystickBase.setVisible(false);
    this.joystickKnob.setVisible(false);
  }

  fireBullet() {
    if (this.gameOverActive) return;
    const count = this.stats.bulletCount;
    const spread = (count - 1) * 0.18;
    const baseAngle = Math.atan2(this.aimDir.y, this.aimDir.x);
    const start = baseAngle - spread / 2;
    for (let i = 0; i < count; i++) {
      const angle = count === 1 ? baseAngle : start + (spread * i) / (count - 1);
      const isCrit = Math.random() < this.stats.critChance;
      const damage = BULLET_BASE_DAMAGE * this.stats.damageMul * (isCrit ? 2 : 1);
      const color = isCrit ? 0xfb923c : 0xfacc15;
      const bullet = this.add.rectangle(this.player.x, this.player.y, isCrit ? 10 : 8, isCrit ? 10 : 8, color);
      this.bullets.add(bullet);
      bullet.body.setVelocity(Math.cos(angle) * BULLET_SPEED, Math.sin(angle) * BULLET_SPEED);
      bullet.damage = damage;
      bullet.pierceLeft = this.stats.pierce;
      this.time.delayedCall(2000, () => bullet.destroy());
    }
  }

  spawnEnemy() {
    if (this.gameOverActive) return;
    const side = Phaser.Math.Between(0, 3);
    let x, y;
    if (side === 0) { x = 0; y = Phaser.Math.Between(0, this.worldHeight); }
    else if (side === 1) { x = this.worldWidth; y = Phaser.Math.Between(0, this.worldHeight); }
    else if (side === 2) { x = Phaser.Math.Between(0, this.worldWidth); y = 0; }
    else { x = Phaser.Math.Between(0, this.worldWidth); y = this.worldHeight; }
    const enemy = this.add.rectangle(x, y, 24, 24, 0xef4444);
    this.enemies.add(enemy);
    enemy.hp = ENEMY_BASE_HP;
  }

  onBulletHit(bullet, enemy) {
    enemy.hp -= bullet.damage;
    if (bullet.pierceLeft > 0) {
      bullet.pierceLeft -= 1;
    } else {
      bullet.destroy();
    }
    if (enemy.hp <= 0) this.killEnemy(enemy);
  }

  killEnemy(enemy) {
    const x = enemy.x;
    const y = enemy.y;
    enemy.destroy();
    const isLucky = Math.random() < this.stats.luckyChance;
    this.dropCoin(x, y, isLucky);
  }

  dropCoin(x, y, isLucky) {
    const coin = this.add.circle(x, y, isLucky ? 7 : 5, isLucky ? 0xfde047 : 0xfde047);
    if (isLucky) coin.setStrokeStyle(2, 0xf97316);
    coin.value = isLucky ? 3 : 1;
    this.coinSprites.add(coin);
    coin.body.setCircle(coin.radius);
  }

  pickupCoin(coin) {
    const value = coin.value || 1;
    coin.destroy();
    this.coins += Math.round(value * this.stats.coinMul);
  }

  hitPlayer(enemy) {
    if (this.time.now < this.invincibleUntil) return;
    enemy.destroy();
    const dmg = Math.max(0.1, 1 * (1 - this.stats.damageReduction));
    this.hp -= dmg;
    this.invincibleUntil = this.time.now + 800;
    this.player.setAlpha(0.4);
    this.cameras.main.shake(120, 0.008);
    if (this.hp <= 0) {
      if (this.reviveAvailable) {
        this.reviveAvailable = false;
        this.hp = this.maxHp;
        this.invincibleUntil = this.time.now + 1500;
        this.cameras.main.flash(300, 100, 255, 200);
      } else {
        this.endRun();
      }
    }
  }

  endRun() {
    if (this.gameOverActive) return;
    this.gameOverActive = true;
    this.fireTimer.remove();
    this.spawnTimer.remove();
    this.physics.pause();
    this.player.setFillStyle(0x475569);
    this.player.setAlpha(1);

    const baseCoins = this.coins - this.stats.startBonus;
    const retryBonus = Math.round(baseCoins * this.stats.retryRate);
    const totalCoins = this.coins + retryBonus;
    const totalSec = Math.floor(this.elapsedMs / 1000);

    this.game.events.emit("run-ended", {
      coins: totalCoins,
      retryBonus,
      survivedSec: totalSec,
      cleared: false,
    });
  }
}

export function makeGameConfig(parent) {
  return {
    type: Phaser.AUTO,
    parent,
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: "100%",
      height: "100%",
    },
    physics: {
      default: "arcade",
      arcade: { gravity: { y: 0 } },
    },
    scene: [MainScene],
  };
}
