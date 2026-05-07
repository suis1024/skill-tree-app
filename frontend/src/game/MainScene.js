import Phaser from "phaser";
import { computeStats } from "./skills";
import { ENEMY_TYPES } from "./enemies";
import { makeEnemyShape, setCircleBody } from "./shapes";
import { WAVE_DURATION_MS, stageMul, clearBonusCoins } from "./stages";
import { getStageWaves } from "./waves";
import { bossForStage } from "./bosses";
import { WEAPONS, updateOrbitals, updateHomingBullets } from "./weapons";
import { spawnDeathBurst, popDamageText, popCoinText } from "./effects";
import { hapticLight, hapticMedium, hapticHeavy } from "../haptics";
import { AUDIO_KEYS, preloadAllAudio, playSe } from "./audio";

const PLAYER_BASE_SPEED = 220;
const COIN_BASE_PICKUP_RADIUS = 60;
const COIN_MAGNET_SPEED = 320;
const ENEMY_BULLET_DAMAGE = 10;

export default class MainScene extends Phaser.Scene {
  constructor() {
    super("MainScene");
  }

  preload() {
    preloadAllAudio(this);
  }

  create() {
    this.cameras.main.setBackgroundColor("#0f172a");
    this.audio = { settings: this.registry.get("settings") || {} };

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
    this.stageMul = stageMul(this.stageNumber);
    this.phase = "wave";
    this.boss = null;

    this.maxHp = this.stats.maxHp;
    this.hp = this.maxHp;
    this.coins = this.stats.startBonus;
    this.elapsedMs = 0;
    this.regenAccum = 0;
    this.lastDamagedAt = 0;
    this.gameOverActive = false;
    this.invincibleUntil = 0;
    this.reviveAvailable = this.stats.hasRevive;

    // 自機: 矢じり型の三角。rotation は aimDir に追従。
    this.player = makeEnemyShape(this, this.worldWidth / 2, this.worldHeight / 2, 28, 0x38bdf8, "triangle");
    this.physics.add.existing(this.player);
    setCircleBody(this.player, 28);
    this.player.body.setCollideWorldBounds(true);
    this.aimDir = new Phaser.Math.Vector2(1, 0);

    this.bullets = this.physics.add.group();
    this.enemies = this.physics.add.group();
    this.enemyBullets = this.physics.add.group();
    this.coinSprites = this.physics.add.group();
    this.enemyHpBarGfx = this.add.graphics().setDepth(1500);

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
      const speedMul = (this.stats.weaponSpeedMul && this.stats.weaponSpeedMul[wid]) || 1;
      const delay = Math.max(60, w.fireIntervalMs / speedMul);
      const timer = this.time.addEvent({
        delay,
        loop: true,
        callback: () => w.fire(this),
      });
      this.weaponTimers.push(timer);
      // オービタルは初回 fire ですぐ展開しておく (タイマー1周分待たない)
      if (wid === "orbital") w.fire(this);
    }

    this.setupWaves();

    // bullets × enemies は自前のグリッド判定 (updateBulletEnemyCollision) で処理する。
    // arcade overlap は弾数 × 敵数 が増えるとボトルネックになるため。
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
    // 左上の HP は小さめで補助表示
    this.hpText = this.add.text(16, top, "", small).setDepth(2000);
    this.coinText = this.add.text(16, top + 18, "", style).setDepth(2000);
    this.stageText = this.add.text(this.worldWidth / 2, top, `STAGE ${this.stageNumber}`, style)
      .setOrigin(0.5, 0).setDepth(2000);
    this.timeText = this.add.text(this.worldWidth / 2, top + 24, "", style).setOrigin(0.5, 0).setDepth(2000);
    this.bossHpBar = null;
    this.bossHpBarBg = null;
    this.bossLabel = this.add.text(this.worldWidth / 2, top + 48, "", small)
      .setOrigin(0.5, 0).setDepth(2000);

    // プレイヤー追従 HP バー (自機の下に出る、画面下端に近いときは上に出す)
    this.playerHpBarW = 36;
    this.playerHpBarH = 4;
    this.playerHpBarBg = this.add.rectangle(0, 0, this.playerHpBarW, this.playerHpBarH, 0x1f2937)
      .setOrigin(0.5, 0).setDepth(1500);
    this.playerHpBar = this.add.rectangle(0, 0, this.playerHpBarW, this.playerHpBarH, 0x22c55e)
      .setOrigin(0, 0).setDepth(1501);

    this.refreshHud();
  }

  updatePlayerHpBar() {
    if (!this.playerHpBar || !this.player) return;
    const px = this.player.x;
    // 通常は下、画面下端にいるときは上に
    const offsetBelow = (this.player.displayHeight || 28) / 2 + 8;
    const wantY = this.player.y + offsetBelow;
    const fitsBelow = wantY + this.playerHpBarH < this.worldHeight - 4;
    const py = fitsBelow
      ? wantY
      : this.player.y - (this.player.displayHeight || 28) / 2 - 8 - this.playerHpBarH;
    this.playerHpBarBg.setPosition(px, py);
    this.playerHpBar.setPosition(px - this.playerHpBarW / 2, py);
    const ratio = Math.max(0, this.hp) / this.maxHp;
    this.playerHpBar.width = this.playerHpBarW * ratio;
    // 残量で色を変える
    const color = ratio > 0.6 ? 0x22c55e : ratio > 0.3 ? 0xfde047 : 0xef4444;
    this.playerHpBar.fillColor = color;
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
    this.player.rotation = Math.atan2(this.aimDir.y, this.aimDir.x);

    // flocker (grunt) の群れボーナス事前計算: 半径 80px 以内の同種数を数える。
    // 仲間 3 体以上で +20% 速度、5 体以上で +35% にスケール。
    const FLOCK_RADIUS_SQ = 80 * 80;
    const flockers = [];
    this.enemies.children.iterate((e) => {
      if (e && e.active && e.isFlocker) flockers.push(e);
    });
    for (let i = 0; i < flockers.length; i++) {
      let n = 0;
      const a = flockers[i];
      for (let j = 0; j < flockers.length; j++) {
        if (i === j) continue;
        const b = flockers[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        if (dx * dx + dy * dy <= FLOCK_RADIUS_SQ) n++;
      }
      a.flockBonus = n >= 5 ? 1.35 : n >= 3 ? 1.20 : 1.0;
    }

    // プレイヤーの現在速度 (リード予測で使う)
    const playerVx = this.player.body ? this.player.body.velocity.x : 0;
    const playerVy = this.player.body ? this.player.body.velocity.y : 0;

    this.enemies.children.iterate((enemy) => {
      if (!enemy || !enemy.active || !enemy.body) return;
      if (enemy.isSpawning) return;

      // リード予測 (tank): プレイヤーの未来位置を狙う
      let targetX = this.player.x;
      let targetY = this.player.y;
      if (enemy.leadAim && enemy.speed > 0) {
        const rawDist = Math.sqrt(
          (this.player.x - enemy.x) ** 2 + (this.player.y - enemy.y) ** 2,
        );
        const t = Math.min(1.5, rawDist / enemy.speed); // 秒。1.5s でクランプ
        targetX = this.player.x + playerVx * t;
        targetY = this.player.y + playerVy * t;
      }
      const dx = targetX - enemy.x;
      const dy = targetY - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const nx = dx / dist;
      const ny = dy / dist;

      // 群れボーナスで速度を一時的に増す (この iter 内だけ)
      const speedMul = enemy.flockBonus || 1.0;
      const effSpeed = enemy.speed * speedMul;

      if (enemy.isBoss) {
        this.updateBossPattern(enemy, nx, ny, delta);
      } else if (enemy.isBouncer) {
        this.updateBouncer(enemy);
      } else if (enemy.isTurret) {
        this.updateTurret(enemy);
      } else if (enemy.isCharger) {
        this.updateCharger(enemy, nx, ny, dist);
      } else if (enemy.canShoot) {
        enemy.body.setVelocity(0, 0);
        if (this.time.now >= enemy.nextShotAt) {
          enemy.nextShotAt = this.time.now + enemy.shootIntervalMs;
          this.fireEnemyBullet(enemy, nx, ny);
        }
      } else if (enemy.isWanderer) {
        this.updateWanderer(enemy, nx, ny, dist, effSpeed);
      } else {
        enemy.body.setVelocity(nx * effSpeed, ny * effSpeed);
      }

      // 見た目の rotation 制御。turret / charger は専用 update で設定済みなのでスキップ。
      if (!enemy.isTurret && !enemy.isCharger) {
        if (enemy.spinRate) {
          enemy.rotation += enemy.spinRate;
        } else if (enemy.aimByVelocity && enemy.body) {
          const vx = enemy.body.velocity.x;
          const vy = enemy.body.velocity.y;
          if (vx * vx + vy * vy > 1) {
            enemy.rotation = Math.atan2(vy, vx);
          }
        }
      }
    });

    this.enemyBullets.children.iterate((eb) => {
      if (!eb || !eb.active) return;
      if (eb.x < -20 || eb.x > this.worldWidth + 20 || eb.y < -20 || eb.y > this.worldHeight + 20) {
        eb.destroy();
      }
    });

    // 自機弾も画面外に出たら即座に消す (collision 判定対象を減らす)。
    // orbital と homing は射程ロジックが別なのでスキップ。
    this.bullets.children.iterate((b) => {
      if (!b || !b.active) return;
      if (b.isOrbital || b.homing) return;
      if (b.x < -20 || b.x > this.worldWidth + 20 || b.y < -20 || b.y > this.worldHeight + 20) {
        b.destroy();
      }
    });

    if (this.phase === "wave") {
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
    const magnetRadiusSq = magnetRadius * magnetRadius;
    this.coinSprites.children.iterate((coin) => {
      if (!coin || !coin.active || !coin.body) return;
      const dx = this.player.x - coin.x;
      const dy = this.player.y - coin.y;
      const distSq = dx * dx + dy * dy;
      if (distSq < magnetRadiusSq) {
        const len = Math.sqrt(distSq) || 1;
        coin.body.setVelocity((dx / len) * magnetSpeed, (dy / len) * magnetSpeed);
      } else if (coin.body.velocity.x !== 0 || coin.body.velocity.y !== 0) {
        coin.body.setVelocity(0, 0);
      }
    });

    if (this.invincibleUntil > 0 && this.time.now > this.invincibleUntil) {
      this.invincibleUntil = 0;
      this.player.setAlpha(1);
    }

    updateHomingBullets(this);
    updateOrbitals(this, delta);
    this.updateBulletEnemyCollision();
    this.updateEnemyHpBars();
    this.updatePlayerHpBar();

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

  // ステージごとの wave 群を読み、それぞれに専用タイマーを張る。
  setupWaves() {
    this.waveTimers = [];
    const waves = getStageWaves(this.stageNumber);
    for (const w of waves) {
      const startMs = (w.startSec ?? 0) * 1000;
      const endMs   = (w.endSec ?? 90) * 1000;
      const startWave = () => {
        if (this.gameOverActive || this.phase !== "wave") return;
        let count = 0;
        const tick = () => {
          if (this.gameOverActive || this.phase !== "wave") return;
          if (this.elapsedMs >= endMs) return;
          if (typeof w.count === "number" && count >= w.count) return;
          this.spawnEnemy(w.type, {
            hpMul: w.hpMul, speedMul: w.speedMul, damageMul: w.damageMul,
          });
          count++;
        };
        // 即時 1 体 + 以降 intervalMs ごと
        tick();
        const t = this.time.addEvent({
          delay: w.intervalMs ?? 1000,
          loop: true,
          callback: tick,
        });
        this.waveTimers.push(t);
      };
      if (startMs <= 0) {
        startWave();
      } else {
        const delayed = this.time.delayedCall(startMs, startWave);
        this.waveTimers.push(delayed);
      }
    }
  }

  startBossPhase() {
    if (this.phase !== "wave") return;
    this.phase = "boss";
    this.bossPhaseStartedMs = this.elapsedMs;
    if (this.waveTimers) this.waveTimers.forEach((t) => t.remove());
    this.enemies.children.iterate((e) => {
      if (!e) return;
      e.destroy();
    });
    this.enemyBullets.children.iterate((e) => e && e.destroy());
    this.cameras.main.flash(400, 200, 50, 50);
    this.shake(300, 0.01);
    playSe(this, AUDIO_KEYS.seBossAppear.key, { volume: 0.3 });

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
    const boss = makeEnemyShape(this, x, y, def.size, def.color, def.shape || "rect");
    boss.setStrokeStyle(3, 0xfacc15);
    this.enemies.add(boss);
    setCircleBody(boss, def.size);
    boss.isBoss = true;
    boss.typeId = "boss";
    const bossHp = Math.round(def.hp * (this.stageMul.bossHp ?? 1));
    boss.hp = bossHp;
    boss.hpMax = bossHp;
    boss.size = def.size;
    boss.speed = 0; // updateBossPattern が直接位置制御するので一般 speed は使わない
    boss.contactDamage = def.contactDamage;
    boss.coinDrop = 0; // クリアボーナスで別途付与
    boss.pattern = def.pattern;
    boss.shotSpeed = def.shotSpeed;
    boss.shootIntervalMs = def.shotIntervalMs;
    boss.bulletCount = def.bulletCount || 8;
    boss.moveSpeed = def.moveSpeed || 100;
    boss.amplitude = def.amplitude || 200;
    boss.nextShotAt = this.time.now + 1000;
    boss.patternStartAt = this.time.now;
    boss.spawnX = x;
    boss.spawnY = y;
    // pendulum 用
    boss.pendDir = 1;
    boss.pendNextSwitchAt = 0;
    // zigzag 用
    boss.zigzagPhase = 0;
    // 形に応じた rotation 制御
    if (def.shape === "star") {
      boss.spinRate = 0.012; // ラスボス: 速めの自転で威圧感
    } else if (def.shape === "octagon" || def.shape === "pentagon" || def.shape === "hexagon") {
      boss.spinRate = (Math.random() < 0.5 ? -1 : 1) * 0.006;
    } else if (def.shape === "rect" || def.shape === "diamond") {
      boss.spinRate = (Math.random() < 0.5 ? -1 : 1) * 0.008;
    } else if (def.shape === "triangle") {
      boss.aimByVelocity = true; // 矢じり: 進行方向を向く
    }
    this.boss = boss;
    // プレイヤーがボススポーン位置に重なってたら一瞬無敵 (即死防止)
    this.invincibleUntil = Math.max(this.invincibleUntil, this.time.now + 800);
    this.player.setAlpha(0.4);
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
    this.fireRingOffset(src, count, speed, 0);
  }

  fireRingOffset(src, count, speed, angOffset) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + angOffset;
      const eb = this.add.circle(src.x, src.y, 6, 0xfca5a5);
      this.enemyBullets.add(eb);
      eb.body.setCircle(eb.radius);
      eb.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
      this.time.delayedCall(4000, () => eb.destroy());
    }
  }

  spawnEnemy(typeId, mods = {}) {
    const def = ENEMY_TYPES[typeId];
    if (!def) return;
    const hpMul = (mods.hpMul ?? 1) * this.stageMul.hp;
    const speedMul = (mods.speedMul ?? 1) * this.stageMul.speed;
    const damageMul = (mods.damageMul ?? 1) * this.stageMul.damage;
    const { x, y } = this.pickSpawnPositionInside(def.size);
    const enemy = makeEnemyShape(this, x, y, def.size, def.color, def.shape);
    this.enemies.add(enemy);
    setCircleBody(enemy, def.size);
    if (enemy.body) enemy.body.setCollideWorldBounds(true);
    enemy.typeId = typeId;
    enemy.shape = def.shape;
    enemy.aimByVelocity = !!def.aimByVelocity;
    enemy.isFlocker = !!def.isFlocker;
    enemy.leadAim = !!def.leadAim;
    enemy.isWanderer = !!def.isWanderer;
    enemy.wanderHomingRange = def.wanderHomingRange || 200;
    if (def.shape === "rect" || def.alwaysSpin) {
      // ランダム方向に一定速度で自転 (rect 敵 + alwaysSpin 指定の敵)
      const sign = Math.random() < 0.5 ? -1 : 1;
      enemy.spinRate = sign * Phaser.Math.FloatBetween(0.01, 0.03);
    }
    if (def.isWanderer) {
      // 初期方向: ランダム。壁反射しつつ進む
      const ang = Math.random() * Math.PI * 2;
      enemy.wanderVx = Math.cos(ang);
      enemy.wanderVy = Math.sin(ang);
    }
    enemy.hp = Math.max(1, Math.round(def.hp * hpMul));
    enemy.hpMax = enemy.hp;
    enemy.speed = def.speed * speedMul;
    enemy.contactDamage = Math.max(1, Math.round(def.contactDamage * damageMul));
    enemy.coinDrop = def.coinDrop;
    enemy.canShoot = def.canShoot;
    if (def.canShoot) {
      enemy.shootIntervalMs = def.shootIntervalMs;
      enemy.shotSpeed = def.shotSpeed;
      enemy.nextShotAt = this.time.now + Phaser.Math.Between(500, def.shootIntervalMs);
    }
    if (def.isBouncer) {
      enemy.isBouncer = true;
      // ランダム方向に等速直線で動かす
      const ang = Math.random() * Math.PI * 2;
      enemy.bounceVx = Math.cos(ang) * enemy.speed;
      enemy.bounceVy = Math.sin(ang) * enemy.speed;
    }
    if (def.isTurret) {
      enemy.isTurret = true;
      enemy.turretShotIntervalMs = def.turretShotIntervalMs;
      enemy.turretShotSpeed = def.turretShotSpeed;
      enemy.turretRotateRate = def.turretRotateRate;
      enemy.turretAngle = Math.random() * Math.PI * 2;
      enemy.nextTurretShotAt = this.time.now + 600;
    }
    if (def.isCharger) {
      enemy.isCharger = true;
      enemy.chargeDetectRange = def.chargeDetectRange;
      enemy.chargeTelegraphMs = def.chargeTelegraphMs;
      enemy.chargeDurationMs = def.chargeDurationMs;
      enemy.chargeSpeed = def.chargeSpeed;
      enemy.chargeState = "idle"; // idle / telegraphing / charging / cooldown
      enemy.chargeStateUntil = 0;
      enemy.chargeDirX = 0;
      enemy.chargeDirY = 0;
    }
    this.runSpawnAnim(enemy);
  }

  updateBouncer(enemy) {
    enemy.body.setVelocity(enemy.bounceVx, enemy.bounceVy);
    // 端に当たったら反転 (sprite の半サイズで判定)
    const half = (enemy.displayWidth || 22) / 2;
    if (enemy.x <= half && enemy.bounceVx < 0) enemy.bounceVx = -enemy.bounceVx;
    if (enemy.x >= this.worldWidth - half && enemy.bounceVx > 0) enemy.bounceVx = -enemy.bounceVx;
    if (enemy.y <= half && enemy.bounceVy < 0) enemy.bounceVy = -enemy.bounceVy;
    if (enemy.y >= this.worldHeight - half && enemy.bounceVy > 0) enemy.bounceVy = -enemy.bounceVy;
  }

  // wanderer (grunt): 普段は壁反射の直進、プレイヤーが範囲内なら追跡。
  updateWanderer(enemy, nx, ny, dist, effSpeed) {
    if (dist <= enemy.wanderHomingRange) {
      enemy.body.setVelocity(nx * effSpeed, ny * effSpeed);
      return;
    }
    enemy.body.setVelocity(enemy.wanderVx * effSpeed, enemy.wanderVy * effSpeed);
    const half = (enemy.displayWidth || 24) / 2;
    if (enemy.x <= half && enemy.wanderVx < 0) enemy.wanderVx = -enemy.wanderVx;
    if (enemy.x >= this.worldWidth - half && enemy.wanderVx > 0) enemy.wanderVx = -enemy.wanderVx;
    if (enemy.y <= half && enemy.wanderVy < 0) enemy.wanderVy = -enemy.wanderVy;
    if (enemy.y >= this.worldHeight - half && enemy.wanderVy > 0) enemy.wanderVy = -enemy.wanderVy;
  }

  updateTurret(enemy) {
    enemy.body.setVelocity(0, 0);
    enemy.turretAngle += enemy.turretRotateRate;
    enemy.rotation = enemy.turretAngle;
    if (this.time.now >= enemy.nextTurretShotAt) {
      enemy.nextTurretShotAt = this.time.now + enemy.turretShotIntervalMs;
      // 5 方向に放射
      for (let i = 0; i < 5; i++) {
        const a = enemy.turretAngle + (Math.PI * 2 * i) / 5;
        const eb = this.add.circle(enemy.x, enemy.y, 5, 0xfca5a5);
        this.enemyBullets.add(eb);
        eb.body.setCircle(eb.radius);
        eb.body.setVelocity(Math.cos(a) * enemy.turretShotSpeed, Math.sin(a) * enemy.turretShotSpeed);
        this.time.delayedCall(4000, () => eb.destroy());
      }
    }
  }

  // ボスの移動 + 攻撃パターン。決定論的に動く (弾幕避けゲー寄り)。
  updateBossPattern(boss, nx, ny, delta) {
    const now = this.time.now;
    const elapsed = now - boss.patternStartAt;
    const margin = boss.size * 0.6 + 20;
    const minX = margin;
    const maxX = this.worldWidth - margin;
    const minY = margin;
    const maxY = this.worldHeight - margin;

    switch (boss.pattern) {
      case "pendulum": {
        // 左右に振り子。両端 (or amplitude 端) に到達したら 600ms 停止して扇撃ち。
        if (boss.pendStopUntil && now < boss.pendStopUntil) {
          boss.body.setVelocity(0, 0);
          if (now >= boss.nextShotAt) {
            boss.nextShotAt = boss.pendStopUntil + 200;
            this.fireSpread(boss, nx, ny, boss.bulletCount, 0.18, boss.shotSpeed);
          }
        } else {
          boss.body.setVelocity(boss.pendDir * boss.moveSpeed, 0);
          const limitL = Math.max(minX, boss.spawnX - boss.amplitude / 2);
          const limitR = Math.min(maxX, boss.spawnX + boss.amplitude / 2);
          if (boss.pendDir > 0 && boss.x >= limitR) {
            boss.x = limitR;
            boss.body.reset(boss.x, boss.y);
            boss.pendDir = -1;
            boss.pendStopUntil = now + 600;
          } else if (boss.pendDir < 0 && boss.x <= limitL) {
            boss.x = limitL;
            boss.body.reset(boss.x, boss.y);
            boss.pendDir = 1;
            boss.pendStopUntil = now + 600;
          }
        }
        break;
      }
      case "figure8": {
        // 中央 (spawn 位置) を中心に 8 の字 (リサジュー)。x = A sin(t), y = A/2 sin(2t)
        const t = (elapsed / 1000) * (boss.moveSpeed / 100); // 1.0 = base period
        const A = boss.amplitude;
        const tx = boss.spawnX + Math.sin(t) * A * 0.5;
        const ty = boss.spawnY + Math.sin(t * 2) * A * 0.25;
        boss.body.setVelocity(0, 0);
        boss.x = Phaser.Math.Clamp(tx, minX, maxX);
        boss.y = Phaser.Math.Clamp(ty, minY, maxY);
        boss.body.reset(boss.x, boss.y);
        if (now >= boss.nextShotAt) {
          boss.nextShotAt = now + boss.shootIntervalMs;
          this.fireRing(boss, boss.bulletCount, boss.shotSpeed);
        }
        break;
      }
      case "circle_orbit": {
        // 中心 (spawn 位置) を中心に円運動。
        const omega = boss.moveSpeed / 80; // rad/sec
        const t = (elapsed / 1000) * omega;
        const tx = boss.spawnX + Math.cos(t) * boss.amplitude * 0.5;
        const ty = boss.spawnY + Math.sin(t) * boss.amplitude * 0.5;
        boss.body.setVelocity(0, 0);
        boss.x = Phaser.Math.Clamp(tx, minX, maxX);
        boss.y = Phaser.Math.Clamp(ty, minY, maxY);
        boss.body.reset(boss.x, boss.y);
        if (now >= boss.nextShotAt) {
          boss.nextShotAt = now + boss.shootIntervalMs;
          // 放射弾: ボスから見た外側方向 (= 円の接線方向ではなく中心からの放射状)
          this.fireRing(boss, boss.bulletCount, boss.shotSpeed);
        }
        break;
      }
      case "anchored_ring": {
        // 中央固定。リング弾を周期的に撒く。回転オフセットで弾道が毎周回少し変わる。
        boss.body.setVelocity(0, 0);
        boss.x = boss.spawnX;
        boss.y = boss.spawnY;
        boss.body.reset(boss.x, boss.y);
        if (now >= boss.nextShotAt) {
          boss.nextShotAt = now + boss.shootIntervalMs;
          const angOffset = (boss.ringIndex || 0) * 0.13;
          this.fireRingOffset(boss, boss.bulletCount, boss.shotSpeed, angOffset);
          boss.ringIndex = (boss.ringIndex || 0) + 1;
        }
        break;
      }
      case "zigzag_descend": {
        // 画面上部の帯 (y = spawnY .. spawnY + amplitude) を上下しつつ横揺れ。
        const t = (elapsed / 1000) * (boss.moveSpeed / 100);
        const A = boss.amplitude;
        const tx = boss.spawnX + Math.sin(t * 1.5) * A * 0.5;
        const ty = boss.spawnY + (1 - Math.cos(t)) * A * 0.4;
        boss.body.setVelocity(0, 0);
        boss.x = Phaser.Math.Clamp(tx, minX, maxX);
        boss.y = Phaser.Math.Clamp(ty, minY, maxY);
        boss.body.reset(boss.x, boss.y);
        if (now >= boss.nextShotAt) {
          boss.nextShotAt = now + boss.shootIntervalMs;
          // 下方向に扇撃ち (プレイヤー方向ではなく、画面下に向かって)
          this.fireSpread(boss, 0, 1, boss.bulletCount, 0.30, boss.shotSpeed);
        }
        break;
      }
      default: {
        // 未知パターンは中央固定
        boss.body.setVelocity(0, 0);
      }
    }
  }

  updateCharger(enemy, nx, ny, dist) {
    const now = this.time.now;
    const turnRate = 0.08; // rad/frame の最大回転速度
    let targetAngle = null;

    switch (enemy.chargeState) {
      case "idle": {
        // 検知範囲内に入った瞬間、現プレイヤー方向で方向ロック → telegraph 開始
        if (dist <= enemy.chargeDetectRange) {
          enemy.chargeDirX = nx;
          enemy.chargeDirY = ny;
          enemy.rotation = Math.atan2(ny, nx); // フラッシュ前に瞬間で向き合わせる
          enemy.chargeState = "telegraphing";
          enemy.chargeStateUntil = now + enemy.chargeTelegraphMs;
          enemy.body.setVelocity(0, 0);
          this.tweens.add({
            targets: enemy,
            alpha: { from: 1, to: 0.4 },
            yoyo: true,
            repeat: 3,
            duration: enemy.chargeTelegraphMs / 8,
          });
        } else {
          enemy.body.setVelocity(nx * enemy.speed, ny * enemy.speed);
          targetAngle = Math.atan2(ny, nx); // 追跡中も滑らかにプレイヤー方向
        }
        break;
      }
      case "telegraphing": {
        enemy.body.setVelocity(0, 0);
        if (now >= enemy.chargeStateUntil) {
          enemy.chargeState = "charging";
          enemy.chargeStateUntil = now + enemy.chargeDurationMs;
          enemy.alpha = 1;
        }
        // ロック済み方向を維持 (rotation は変えない)
        break;
      }
      case "charging": {
        if (now >= enemy.chargeStateUntil) {
          enemy.chargeState = "cooldown";
          enemy.chargeStateUntil = now + 800;
        } else {
          enemy.body.setVelocity(
            enemy.chargeDirX * enemy.chargeSpeed,
            enemy.chargeDirY * enemy.chargeSpeed,
          );
        }
        // rotation は chargeDir のまま固定
        break;
      }
      case "cooldown": {
        enemy.body.setVelocity(0, 0);
        if (now >= enemy.chargeStateUntil) {
          enemy.chargeState = "idle";
        }
        // cooldown 中も滑らかにプレイヤー方向へ向き直し始める
        targetAngle = Math.atan2(ny, nx);
        break;
      }
    }

    // 滑らかな方向転換 (idle 追跡中 / cooldown)
    if (targetAngle !== null) {
      const diff = Phaser.Math.Angle.Wrap(targetAngle - enemy.rotation);
      const step = Phaser.Math.Clamp(diff, -turnRate, turnRate);
      enemy.rotation += step;
    }
  }

  // 画面内のランダム位置を選ぶ。プレイヤーから最低 MIN_DIST 離した位置。
  pickSpawnPositionInside(size) {
    const margin = size + 8;
    const MIN_DIST = 120;
    // ステージ 6 以降は「プレイヤーから遠い側」優先。隅でぐるぐる回避を抑止する目的。
    // 複数候補を引いて、その中で最遠を選ぶ (= プレイヤー反対側に偏る)。
    const farMode = this.stageNumber >= 6;
    const trials = farMode ? 8 : 1;

    let bestX = margin;
    let bestY = margin;
    let bestDist = -1;
    for (let i = 0; i < 20; i++) {
      const x = Phaser.Math.Between(margin, this.worldWidth - margin);
      const y = Phaser.Math.Between(margin, this.worldHeight - margin);
      const d = Math.hypot(this.player.x - x, this.player.y - y);
      if (d < MIN_DIST) continue;

      if (!farMode) return { x, y };

      if (d > bestDist) {
        bestDist = d;
        bestX = x;
        bestY = y;
      }
      if (i + 1 >= trials && bestDist > 0) return { x: bestX, y: bestY };
    }
    if (bestDist > 0) return { x: bestX, y: bestY };
    return { x: margin, y: margin };
  }

  // 出現アニメ: 半透明 + 小スケール + 回転しながら通常状態へ。
  // アニメ中は物理を止めて無敵扱いにする。
  runSpawnAnim(enemy) {
    enemy.isSpawning = true;
    if (enemy.body) enemy.body.enable = false;
    enemy.setAlpha(0);
    enemy.setScale(0.2);
    enemy.rotation = 0;
    this.tweens.add({
      targets: enemy,
      alpha: { from: 0, to: 1 },
      scale: { from: 0.2, to: 1 },
      rotation: { from: 0, to: Math.PI * 2 },
      duration: 500,
      ease: "Cubic.easeOut",
      onComplete: () => {
        if (!enemy.active) return;
        enemy.isSpawning = false;
        enemy.rotation = 0;
        if (enemy.body) enemy.body.enable = true;
      },
    });
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

  // bullets × enemies の自前グリッド判定。
  // 雑魚はセルに登録して近隣セルだけ判定。ボスは別途全弾と判定 (1 体なので軽い)。
  updateBulletEnemyCollision() {
    const bullets = this.bullets.getChildren();
    const enemies = this.enemies.getChildren();
    if (bullets.length === 0 || enemies.length === 0) return;

    const CELL = 96;
    const grid = new Map(); // key: "cx,cy" -> enemy[]
    let boss = null;
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (!e || !e.active || e.isSpawning) continue;
      if (e.isBoss) { boss = e; continue; }
      const cx = Math.floor(e.x / CELL);
      const cy = Math.floor(e.y / CELL);
      const key = cx + "," + cy;
      let arr = grid.get(key);
      if (!arr) { arr = []; grid.set(key, arr); }
      arr.push(e);
    }

    for (let i = 0; i < bullets.length; i++) {
      const b = bullets[i];
      if (!b || !b.active) continue;
      const br = b.radius || (b.width ? b.width * 0.5 : 5);
      const bcx = Math.floor(b.x / CELL);
      const bcy = Math.floor(b.y / CELL);
      let consumed = false;

      for (let dy = -1; dy <= 1 && !consumed; dy++) {
        for (let dx = -1; dx <= 1 && !consumed; dx++) {
          const arr = grid.get((bcx + dx) + "," + (bcy + dy));
          if (!arr) continue;
          for (let k = 0; k < arr.length; k++) {
            const e = arr[k];
            if (!e.active) continue;
            const er = (e.displayWidth || 24) * 0.45; // 円判定半径と揃える
            const rx = b.x - e.x;
            const ry = b.y - e.y;
            const rr = br + er;
            if (rx * rx + ry * ry <= rr * rr) {
              this.onBulletHit(b, e);
              if (!b.active) { consumed = true; break; }
            }
          }
        }
      }

      // ボスは grid 外なので個別判定
      if (boss && b.active) {
        const er = (boss.displayWidth || 60) * 0.5;
        const rx = b.x - boss.x;
        const ry = b.y - boss.y;
        const rr = br + er;
        if (rx * rx + ry * ry <= rr * rr) {
          this.onBulletHit(b, boss);
        }
      }
    }
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
    if (this.settings.damageNumbers !== false) {
      popDamageText(this, enemy.x, enemy.y - (enemy.displayHeight || 24) / 2, dmg, isCrit);
    }
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

  // ダメージを受けた敵にフラグだけ立てる。実描画は updateEnemyHpBars が一括でやる。
  ensureEnemyHpBar(enemy) {
    if (enemy.isBoss) return;
    if (!enemy.hpBarWidth) {
      enemy.hpBarWidth = Math.max(18, (enemy.displayWidth || 24) * 0.9);
    }
    enemy.showHpBar = true;
  }

  updateEnemyHpBars() {
    const gfx = this.enemyHpBarGfx;
    if (!gfx) return;
    gfx.clear();
    const h = 4;
    this.enemies.children.iterate((e) => {
      if (!e || !e.active || !e.showHpBar || e.isBoss) return;
      const w = e.hpBarWidth || Math.max(18, (e.displayWidth || 24) * 0.9);
      const yOff = (e.displayHeight || 24) / 2 + 8;
      const x = e.x - w / 2;
      const y = e.y + yOff;
      gfx.fillStyle(0x1f2937, 1).fillRect(x, y, w, h);
      const ratio = Math.max(0, Math.min(1, e.hp / e.hpMax));
      gfx.fillStyle(0xef4444, 1).fillRect(x, y, w * ratio, h);
    });
  }

  killEnemy(enemy) {
    const x = enemy.x;
    const y = enemy.y;
    const dropCount = enemy.coinDrop || 1;
    const wasBoss = enemy.isBoss;
    const burstColor = enemy.fillColor ?? 0xffffff;
    const burstScale = wasBoss ? 2.2 : 1;
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
      hapticHeavy();
      this.onBossDefeated(x, y);
    } else {
      hapticLight();
    }
  }

  onBossDefeated(x, y) {
    if (this.phase !== "boss") return;
    this.phase = "clearing";
    this.cameras.main.flash(500, 250, 220, 100);
    this.shake(400, 0.015);
    playSe(this, AUDIO_KEYS.seStageClear.key, { volume: 0.6 });

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
    const baseValue = isLucky ? 3 : 1;
    coin.value = baseValue * (this.stageMul.coin ?? 1);
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
    hapticLight();
  }

  hitPlayer(enemy, rawDamage) {
    if (this.time.now < this.invincibleUntil) return;
    enemy.destroy();
    this.applyDamage(rawDamage);
  }

  applyDamage(rawDamage) {
    const dmg = Math.max(1, rawDamage * (1 - this.stats.damageReduction));
    this.hp -= dmg;
    this.lastDamagedAt = this.time.now;
    this.regenAccum = 0;
    this.invincibleUntil = this.time.now + 800;
    this.player.setAlpha(0.4);
    this.shake(120, 0.008);
    hapticMedium();
    playSe(this, AUDIO_KEYS.sePlayerHit.key, { volume: 0.5, minIntervalMs: 200 });
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
    if (this.waveTimers) this.waveTimers.forEach((t) => t.remove());
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
    type: Phaser.WEBGL,
    parent,
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: "100%",
      height: "100%",
    },
    physics: {
      default: "arcade",
      arcade: {
        gravity: { y: 0 },
        useTree: true,
        maxEntries: 16,
      },
    },
    fps: {
      target: 60,
      forceSetTimeOut: false,
    },
    render: {
      antialias: false,
      pixelArt: false,
      powerPreference: "high-performance",
    },
    scene: [MainScene],
  };
}
