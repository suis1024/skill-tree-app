import Phaser from "phaser";
import { computeStats } from "./skills";
import { ENEMY_TYPES, pickEnemyType, spawnIntervalMs, spawnBatchSize } from "./enemies";
import { WAVE_DURATION_MS, difficultyMul, clearBonusCoins } from "./stages";
import { bossForStage } from "./bosses";
import { WEAPONS, updateOrbitals, updateHomingBullets } from "./weapons";
import { spawnDeathBurst, popDamageText, popCoinText } from "./effects";

const PLAYER_BASE_SPEED = 220;
const COIN_BASE_PICKUP_RADIUS = 60;
const COIN_MAGNET_SPEED = 320;
const ENEMY_BULLET_DAMAGE = 1;

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
      if (this.timeText) this.timeText.setX(this.worldWidth / 2);
      if (this.stageText) this.stageText.setX(this.worldWidth / 2);
    });

    const skillLevels = this.registry.get("skillLevels") || {};
    this.stats = computeStats(skillLevels);
    this.settings = this.registry.get("settings") || { screenShake: true };

    this.stageNumber = this.registry.get("stageNumber") || 1;
    this.difficultyMul = difficultyMul(this.stageNumber);
    this.phase = "wave";
    this.boss = null;

    this.maxHp = this.stats.maxHp;
    this.hp = this.maxHp;
    this.coins = this.stats.startBonus;
    this.elapsedMs = 0;
    this.lastSpawnTuneMs = 0;
    this.regenAccum = 0;
    this.lastDamagedAt = 0;
    this.gameOverActive = false;
    this.invincibleUntil = 0;
    this.reviveAvailable = this.stats.hasRevive;

    this.player = this.add.rectangle(this.worldWidth / 2, this.worldHeight / 2, 28, 28, 0x60a5fa);
    this.physics.add.existing(this.player);
    this.player.body.setCollideWorldBounds(true);
    this.aimDir = new Phaser.Math.Vector2(1, 0);

    this.bullets = this.physics.add.group();
    this.enemies = this.physics.add.group();
    this.enemyBullets = this.physics.add.group();
    this.coinSprites = this.physics.add.group();
    this.enemyHpBars = [];

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

    this.weaponTimers = [];
    for (const wid of this.stats.weapons) {
      const w = WEAPONS[wid];
      if (!w) continue;
      const delay = Math.max(60, w.fireIntervalMs / this.stats.fireRateMul);
      const timer = this.time.addEvent({
        delay,
        loop: true,
        callback: () => w.fire(this),
      });
      this.weaponTimers.push(timer);
      // オービタルは初回 fire ですぐ展開しておく (タイマー1周分待たない)
      if (wid === "orbital") w.fire(this);
    }

    this.currentSpawnInterval = spawnIntervalMs(0);
    this.spawnTimer = this.time.addEvent({
      delay: this.currentSpawnInterval,
      loop: true,
      callback: () => this.spawnWave(),
    });

    this.physics.add.overlap(this.bullets, this.enemies, (bullet, enemy) => this.onBulletHit(bullet, enemy));
    this.physics.add.overlap(this.player, this.enemies, (_p, enemy) => this.hitPlayer(enemy, enemy.contactDamage || 1));
    this.physics.add.overlap(this.player, this.enemyBullets, (_p, eb) => this.onPlayerHitByEnemyBullet(eb));
    this.physics.add.overlap(this.player, this.coinSprites, (_p, coin) => this.pickupCoin(coin));

    this.createHud();
  }

  createHud() {
    const style = { fontFamily: "system-ui, sans-serif", fontSize: "18px", color: "#e2e8f0" };
    const small = { ...style, fontSize: "14px", color: "#94a3b8" };
    const top = this.registry.get("safeAreaTop") || 12;
    this.hudTop = top;
    this.hpText = this.add.text(16, top, "", style).setDepth(2000);
    this.coinText = this.add.text(16, top + 24, "", style).setDepth(2000);
    this.stageText = this.add.text(this.worldWidth / 2, top, `STAGE ${this.stageNumber}`, style)
      .setOrigin(0.5, 0).setDepth(2000);
    // 時間表示は STAGE の下に 2 段で。HP の右、⏸ ボタンの下に来るので被らない。
    this.timeText = this.add.text(this.worldWidth / 2, top + 24, "", style).setOrigin(0.5, 0).setDepth(2000);
    this.bossHpBar = null;
    this.bossHpBarBg = null;
    this.bossLabel = this.add.text(this.worldWidth / 2, top + 48, "", small)
      .setOrigin(0.5, 0).setDepth(2000);
    this.refreshHud();
  }

  refreshHud() {
    const hp = Math.max(0, Math.floor(this.hp));
    this.hpText.setText(`HP ${hp}/${this.maxHp}`);
    this.coinText.setText(`COIN: ${this.coins}`);
    if (this.phase === "wave") {
      const remain = Math.max(0, WAVE_DURATION_MS - this.elapsedMs);
      const total = Math.ceil(remain / 1000);
      const m = String(Math.floor(total / 60)).padStart(2, "0");
      const s = String(total % 60).padStart(2, "0");
      this.timeText.setText(`BOSS in ${m}:${s}`);
      this.bossLabel.setText("");
    } else if (this.phase === "boss" && this.boss && this.boss.active) {
      this.timeText.setText("BOSS");
      this.bossLabel.setText(`BOSS HP: ${Math.max(0, Math.ceil(this.boss.hp))} / ${this.boss.hpMax}`);
      this.updateBossHpBar();
    } else {
      this.timeText.setText("");
      this.bossLabel.setText("");
    }
  }

  updateBossHpBar() {
    if (!this.boss) return;
    const top = this.hudTop;
    const w = Math.min(360, this.worldWidth - 60);
    const h = 6;
    const x = (this.worldWidth - w) / 2;
    const y = top + 70;
    if (!this.bossHpBarBg) {
      this.bossHpBarBg = this.add.rectangle(x, y, w, h, 0x334155).setOrigin(0, 0).setDepth(2000);
      this.bossHpBar = this.add.rectangle(x, y, w, h, 0xef4444).setOrigin(0, 0).setDepth(2001);
    }
    const ratio = Math.max(0, this.boss.hp) / this.boss.hpMax;
    this.bossHpBar.width = w * ratio;
  }

  update(_time, delta) {
    if (this.gameOverActive) return;

    this.elapsedMs += delta;

    if (
      this.stats.regenPerSec > 0 &&
      this.hp < this.maxHp &&
      this.time.now - this.lastDamagedAt > 3000
    ) {
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
      const dist = Math.hypot(dx, dy) || 1;
      const nx = dx / dist;
      const ny = dy / dist;

      if (enemy.isBoss) {
        const p = enemy.pattern;
        if (p && p.startsWith("shoot")) {
          const diff = dist - (enemy.preferredDistance || 240);
          const dir = Math.abs(diff) < 20 ? 0 : Math.sign(diff);
          enemy.body.setVelocity(nx * enemy.speed * dir, ny * enemy.speed * dir);
          if (this.time.now >= enemy.nextShotAt) {
            enemy.nextShotAt = this.time.now + (enemy.shootIntervalMs || 1500);
            this.fireBossBullets(enemy, nx, ny);
          }
        } else if (p === "chase_burst") {
          enemy.body.setVelocity(nx * enemy.speed, ny * enemy.speed);
          if (this.time.now >= enemy.nextBurstAt) {
            enemy.nextBurstAt = this.time.now + 2200;
            this.fireRing(enemy, 14, 230);
          }
        } else {
          // chase デフォルト: 追跡しつつ 1.8 秒に 1 回リング弾
          enemy.body.setVelocity(nx * enemy.speed, ny * enemy.speed);
          if (this.time.now >= enemy.nextBurstAt) {
            enemy.nextBurstAt = this.time.now + 1800;
            this.fireRing(enemy, 10, 220);
          }
        }
      } else if (enemy.canShoot && enemy.preferredDistance) {
        const diff = dist - enemy.preferredDistance;
        const dir = Math.abs(diff) < 16 ? 0 : Math.sign(diff);
        enemy.body.setVelocity(nx * enemy.speed * dir, ny * enemy.speed * dir);

        if (this.time.now >= enemy.nextShotAt) {
          enemy.nextShotAt = this.time.now + enemy.shootIntervalMs;
          this.fireEnemyBullet(enemy, nx, ny);
        }
      } else {
        enemy.body.setVelocity(nx * enemy.speed, ny * enemy.speed);
      }
    });

    this.enemyBullets.children.iterate((eb) => {
      if (!eb) return;
      if (eb.x < -20 || eb.x > this.worldWidth + 20 || eb.y < -20 || eb.y > this.worldHeight + 20) {
        eb.destroy();
      }
    });

    if (this.phase === "wave") {
      if (this.elapsedMs - this.lastSpawnTuneMs > 2000) {
        this.lastSpawnTuneMs = this.elapsedMs;
        const baseInterval = spawnIntervalMs(this.elapsedMs / 1000);
        const next = Math.max(150, Math.round(baseInterval / this.difficultyMul));
        if (next !== this.currentSpawnInterval) {
          this.currentSpawnInterval = next;
          this.spawnTimer.delay = next;
        }
      }
      if (this.elapsedMs >= WAVE_DURATION_MS) {
        this.startBossPhase();
      }
    } else if (this.phase === "boss" && (!this.boss || !this.boss.active)) {
      // ボススポーン後 3 秒経ってもボスがいなければリトライ (タイマー失火対策)
      if (this.elapsedMs - (this.bossPhaseStartedMs || 0) > 3000) {
        this.spawnBoss();
      }
    }

    // コイン磁力: 範囲に入ったら、プレイヤー速度を上回る速度で追従させる
    const magnetRadius = COIN_BASE_PICKUP_RADIUS * this.stats.magnetMul;
    const playerSpeed = PLAYER_BASE_SPEED * this.stats.speedMul;
    const magnetSpeed = Math.max(COIN_MAGNET_SPEED, playerSpeed * 1.6);
    this.coinSprites.children.iterate((coin) => {
      if (!coin || !coin.body) return;
      const dx = this.player.x - coin.x;
      const dy = this.player.y - coin.y;
      const dist = Math.hypot(dx, dy);
      if (dist < magnetRadius) {
        const len = dist || 1;
        coin.body.setVelocity((dx / len) * magnetSpeed, (dy / len) * magnetSpeed);
      } else {
        coin.body.setVelocity(0, 0);
      }
    });

    if (this.invincibleUntil > 0 && this.time.now > this.invincibleUntil) {
      this.invincibleUntil = 0;
      this.player.setAlpha(1);
    }

    updateHomingBullets(this);
    updateOrbitals(this, delta);
    this.updateEnemyHpBars();

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

  spawnWave() {
    if (this.gameOverActive || this.phase !== "wave") return;
    const elapsedSec = this.elapsedMs / 1000;
    const batch = spawnBatchSize(elapsedSec, this.stageNumber);
    for (let i = 0; i < batch; i++) {
      const type = pickEnemyType(elapsedSec, this.stageNumber);
      this.spawnEnemy(type);
    }
  }

  startBossPhase() {
    if (this.phase !== "wave") return;
    this.phase = "boss";
    this.bossPhaseStartedMs = this.elapsedMs;
    this.spawnTimer.remove();
    this.enemies.children.iterate((e) => {
      if (!e) return;
      if (e.hpBar) e.hpBar.destroy();
      if (e.hpBarBg) e.hpBarBg.destroy();
      e.destroy();
    });
    this.enemyBullets.children.iterate((e) => e && e.destroy());
    this.cameras.main.flash(400, 200, 50, 50);
    this.shake(300, 0.01);

    const fontPx = Math.min(64, Math.floor(this.worldWidth / 6));
    const banner = this.add.text(this.worldWidth / 2, this.worldHeight / 2, "BOSS!", {
      fontFamily: "system-ui, sans-serif",
      fontSize: `${fontPx}px`,
      color: "#ef4444",
      fontStyle: "bold",
    }).setOrigin(0.5).setDepth(3000);
    this.tweens.add({
      targets: banner,
      alpha: { from: 1, to: 0 },
      scale: { from: 1, to: 1.4 },
      duration: 1200,
      onComplete: () => banner.destroy(),
    });

    // ボス出現位置に脈動マーカーを出して、800ms 後に本体スポーン
    const tx = this.worldWidth / 2;
    const ty = Math.min(120, this.worldHeight * 0.2);
    const marker = this.add.circle(tx, ty, 50, 0xef4444, 0).setStrokeStyle(3, 0xef4444, 0.9).setDepth(2999);
    this.tweens.add({
      targets: marker,
      scale: { from: 0.4, to: 1.2 },
      alpha: { from: 1, to: 0 },
      duration: 700,
      onComplete: () => marker.destroy(),
    });

    this.time.delayedCall(800, () => this.spawnBoss());
  }

  spawnBoss() {
    if (this.gameOverActive || this.phase !== "boss") return;
    if (this.boss && this.boss.active) return; // 重複防止
    const def = bossForStage(this.stageNumber);
    if (!def) {
      console.warn("spawnBoss: no def for stage", this.stageNumber);
      return;
    }
    const x = this.worldWidth / 2;
    const y = Math.min(120, this.worldHeight * 0.2);
    const boss = this.add.rectangle(x, y, def.size, def.size, def.color);
    boss.setStrokeStyle(3, 0xfacc15);
    this.enemies.add(boss);
    boss.isBoss = true;
    boss.typeId = "boss";
    boss.hp = def.hp;
    boss.hpMax = def.hp;
    boss.speed = def.speed;
    boss.contactDamage = def.contactDamage;
    boss.coinDrop = 0; // クリアボーナスで別途付与
    boss.pattern = def.pattern;
    boss.shotSpeed = def.shotSpeed;
    boss.shootIntervalMs = def.shotIntervalMs;
    boss.preferredDistance = def.preferredDistance;
    boss.nextShotAt = this.time.now + 1000;
    boss.nextBurstAt = this.time.now + 3000;
    this.boss = boss;
    // プレイヤーがボススポーン位置に重なってたら一瞬無敵 (即死防止)
    this.invincibleUntil = Math.max(this.invincibleUntil, this.time.now + 800);
    this.player.setAlpha(0.4);
  }

  fireBossBullets(boss, nx, ny) {
    if (boss.pattern === "shoot3way") {
      this.fireSpread(boss, nx, ny, 3, 0.25, boss.shotSpeed);
    } else if (boss.pattern === "shoot5way") {
      this.fireSpread(boss, nx, ny, 5, 0.22, boss.shotSpeed);
    } else if (boss.pattern === "shoot8way") {
      this.fireRing(boss, 8, boss.shotSpeed);
    }
  }

  fireSpread(src, nx, ny, count, spread, speed) {
    const baseAngle = Math.atan2(ny, nx);
    const start = baseAngle - (spread * (count - 1)) / 2;
    for (let i = 0; i < count; i++) {
      const angle = count === 1 ? baseAngle : start + spread * i;
      const eb = this.add.circle(src.x, src.y, 6, 0xfca5a5);
      this.enemyBullets.add(eb);
      eb.body.setCircle(eb.radius);
      eb.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
      this.time.delayedCall(4000, () => eb.destroy());
    }
  }

  fireRing(src, count, speed) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const eb = this.add.circle(src.x, src.y, 6, 0xfca5a5);
      this.enemyBullets.add(eb);
      eb.body.setCircle(eb.radius);
      eb.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
      this.time.delayedCall(4000, () => eb.destroy());
    }
  }

  spawnEnemy(typeId) {
    const def = ENEMY_TYPES[typeId];
    if (!def) return;
    const side = Phaser.Math.Between(0, 3);
    let x, y;
    if (side === 0) { x = 0; y = Phaser.Math.Between(0, this.worldHeight); }
    else if (side === 1) { x = this.worldWidth; y = Phaser.Math.Between(0, this.worldHeight); }
    else if (side === 2) { x = Phaser.Math.Between(0, this.worldWidth); y = 0; }
    else { x = Phaser.Math.Between(0, this.worldWidth); y = this.worldHeight; }
    const enemy = this.add.rectangle(x, y, def.size, def.size, def.color);
    this.enemies.add(enemy);
    enemy.typeId = typeId;
    enemy.hp = Math.max(1, Math.round(def.hp * this.difficultyMul));
    enemy.hpMax = enemy.hp;
    enemy.speed = def.speed * (1 + (this.difficultyMul - 1) * 0.4);
    enemy.contactDamage = Math.max(1, Math.round(def.contactDamage * this.difficultyMul));
    enemy.coinDrop = def.coinDrop;
    enemy.canShoot = def.canShoot;
    if (def.canShoot) {
      enemy.shootIntervalMs = def.shootIntervalMs;
      enemy.preferredDistance = def.preferredDistance;
      enemy.shotSpeed = def.shotSpeed;
      enemy.nextShotAt = this.time.now + Phaser.Math.Between(500, def.shootIntervalMs);
    }
  }

  fireEnemyBullet(enemy, nx, ny) {
    const eb = this.add.circle(enemy.x, enemy.y, 5, 0xfca5a5);
    this.enemyBullets.add(eb);
    eb.body.setCircle(eb.radius);
    eb.body.setVelocity(nx * enemy.shotSpeed, ny * enemy.shotSpeed);
    this.time.delayedCall(4000, () => eb.destroy());
  }

  onPlayerHitByEnemyBullet(eb) {
    if (this.time.now < this.invincibleUntil) {
      eb.destroy();
      return;
    }
    eb.destroy();
    this.applyDamage(ENEMY_BULLET_DAMAGE);
  }

  onBulletHit(bullet, enemy) {
    if (bullet.isOrbital) {
      const now = this.time.now;
      enemy._orbitalImmuneUntil = enemy._orbitalImmuneUntil || 0;
      if (now < enemy._orbitalImmuneUntil) return;
      enemy._orbitalImmuneUntil = now + 250;
      this.damageEnemy(enemy, bullet.damage, !!bullet.isCrit);
      return;
    }
    this.damageEnemy(enemy, bullet.damage, !!bullet.isCrit);
    if (bullet.pierceLeft > 0) {
      bullet.pierceLeft -= 1;
    } else {
      bullet.destroy();
    }
  }

  damageEnemy(enemy, dmg, isCrit = false) {
    if (!enemy || !enemy.active) return;
    enemy.hp -= dmg;
    popDamageText(this, enemy.x, enemy.y - (enemy.displayHeight || 24) / 2, dmg, isCrit);
    if (enemy.hp <= 0) {
      this.killEnemy(enemy);
      return;
    }
    this.ensureEnemyHpBar(enemy);
    if (isCrit) this.hitStop(40);
  }

  // 設定で OFF にされていたらシェイクをスキップ。
  shake(duration, intensity) {
    if (this.settings && this.settings.screenShake === false) return;
    this.cameras.main.shake(duration, intensity);
  }

  // 物理だけを短時間止めて手応えを出す。tween/演出は通常通り進む。
  hitStop(ms) {
    if (this.gameOverActive) return;
    this.physics.world.pause();
    this.time.delayedCall(ms, () => {
      if (!this.gameOverActive) this.physics.world.resume();
    });
  }

  ensureEnemyHpBar(enemy) {
    if (enemy.hpBar || enemy.isBoss) return;
    const w = Math.max(18, (enemy.displayWidth || 24) * 0.9);
    const h = 4;
    enemy.hpBarWidth = w;
    enemy.hpBarBg = this.add.rectangle(enemy.x, enemy.y + (enemy.displayHeight || 24) / 2 + 8, w, h, 0x1f2937)
      .setOrigin(0.5, 0).setDepth(1500);
    enemy.hpBar = this.add.rectangle(enemy.x - w / 2, enemy.y + (enemy.displayHeight || 24) / 2 + 8, w, h, 0xef4444)
      .setOrigin(0, 0).setDepth(1501);
    if (!this.enemyHpBars) this.enemyHpBars = [];
    this.enemyHpBars.push({ owner: enemy, bg: enemy.hpBarBg, fg: enemy.hpBar });
  }

  updateEnemyHpBars() {
    if (!this.enemyHpBars) return;
    // 所有者が消えたバーを掃除しつつ、生きてるものだけ位置更新
    this.enemyHpBars = this.enemyHpBars.filter((entry) => {
      const e = entry.owner;
      if (!e || !e.active) {
        if (entry.bg && entry.bg.scene) entry.bg.destroy();
        if (entry.fg && entry.fg.scene) entry.fg.destroy();
        return false;
      }
      const yOff = (e.displayHeight || 24) / 2 + 8;
      entry.bg.setPosition(e.x, e.y + yOff);
      entry.fg.setPosition(e.x - e.hpBarWidth / 2, e.y + yOff);
      const ratio = Math.max(0, e.hp) / e.hpMax;
      entry.fg.width = e.hpBarWidth * ratio;
      return true;
    });
  }

  killEnemy(enemy) {
    const x = enemy.x;
    const y = enemy.y;
    const dropCount = enemy.coinDrop || 1;
    const wasBoss = enemy.isBoss;
    const burstColor = enemy.fillColor ?? 0xffffff;
    const burstScale = wasBoss ? 2.2 : 1;
    if (enemy.hpBar) enemy.hpBar.destroy();
    if (enemy.hpBarBg) enemy.hpBarBg.destroy();
    enemy.destroy();
    spawnDeathBurst(this, x, y, burstColor, burstScale);
    for (let i = 0; i < dropCount; i++) {
      const isLucky = Math.random() < this.stats.luckyChance;
      const ox = dropCount === 1 ? 0 : Phaser.Math.Between(-12, 12);
      const oy = dropCount === 1 ? 0 : Phaser.Math.Between(-12, 12);
      this.dropCoin(x + ox, y + oy, isLucky);
    }
    if (wasBoss) {
      this.boss = null;
      this.hitStop(150);
      this.onBossDefeated(x, y);
    }
  }

  onBossDefeated(x, y) {
    if (this.phase !== "boss") return;
    this.phase = "clearing";
    this.cameras.main.flash(500, 250, 220, 100);
    this.shake(400, 0.015);

    // 視覚演出のみ (実数値ボーナスは endRun 内で別途加算)。
    const sparkles = 12;
    for (let i = 0; i < sparkles; i++) {
      this.time.delayedCall(i * 40, () => {
        const ang = (Math.PI * 2 * i) / sparkles;
        const r = Phaser.Math.Between(40, 100);
        const sx = x + Math.cos(ang) * r;
        const sy = y + Math.sin(ang) * r;
        const star = this.add.circle(sx, sy, 6, 0xfde047).setDepth(2500);
        this.tweens.add({
          targets: star,
          alpha: { from: 1, to: 0 },
          scale: { from: 1.2, to: 0.4 },
          duration: 800,
          onComplete: () => star.destroy(),
        });
      });
    }

    const fontPx = Math.min(56, Math.floor(this.worldWidth / 8));
    const banner = this.add.text(this.worldWidth / 2, this.worldHeight / 2, "STAGE CLEAR!", {
      fontFamily: "system-ui, sans-serif",
      fontSize: `${fontPx}px`,
      color: "#fde047",
      fontStyle: "bold",
    }).setOrigin(0.5).setDepth(3000);
    this.tweens.add({
      targets: banner,
      scale: { from: 0.5, to: 1.0 },
      duration: 600,
    });

    this.time.delayedCall(2400, () => this.endRun(true));
  }

  dropCoin(x, y, isLucky) {
    const coin = this.add.circle(x, y, isLucky ? 7 : 5, 0xfde047);
    if (isLucky) coin.setStrokeStyle(2, 0xf97316);
    coin.value = isLucky ? 3 : 1;
    this.coinSprites.add(coin);
    coin.body.setCircle(coin.radius);
  }

  pickupCoin(coin) {
    const value = coin.value || 1;
    const gained = Math.round(value * this.stats.coinMul);
    const x = coin.x;
    const y = coin.y;
    coin.destroy();
    this.coins += gained;
    popCoinText(this, x, y, gained);
  }

  hitPlayer(enemy, rawDamage) {
    if (this.time.now < this.invincibleUntil) return;
    enemy.destroy();
    this.applyDamage(rawDamage);
  }

  applyDamage(rawDamage) {
    const dmg = Math.max(0.1, rawDamage * (1 - this.stats.damageReduction));
    this.hp -= dmg;
    this.lastDamagedAt = this.time.now;
    this.regenAccum = 0;
    this.invincibleUntil = this.time.now + 800;
    this.player.setAlpha(0.4);
    this.shake(120, 0.008);
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

  endRun(cleared = false) {
    if (this.gameOverActive) return;
    this.gameOverActive = true;
    if (this.weaponTimers) this.weaponTimers.forEach((t) => t.remove());
    if (this.spawnTimer) this.spawnTimer.remove();
    if (!cleared) this.player.setFillStyle(0x475569);
    this.player.setAlpha(1);

    const baseCoins = this.coins - this.stats.startBonus;
    const retryBonus = cleared ? 0 : Math.round(baseCoins * this.stats.retryRate);
    const clearBonus = cleared ? clearBonusCoins(this.stageNumber) : 0;
    const totalCoins = this.coins + retryBonus + clearBonus;
    const totalSec = Math.floor(this.elapsedMs / 1000);

    this.game.events.emit("run-ended", {
      coins: totalCoins,
      retryBonus,
      clearBonus,
      survivedSec: totalSec,
      cleared,
      stageNumber: this.stageNumber,
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
