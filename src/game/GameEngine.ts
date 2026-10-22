import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  LANES,
  INITIAL_SPEED,
  MAX_SPEED,
  SPEED_ACCELERATION,
  JUMP_VELOCITY,
  SUPER_JUMP_VELOCITY,
  GRAVITY,
  SLIDE_DURATION,
  POWER_UP_CONFIG,
  AVAILABLE_SKINS,
} from './constants';
import { ActivePowerUp, GameState, GameStats, PlayerSkin, PowerUpType } from '../types';
import { createDMSCharacter, CharacterRig } from './character';
import { createTrackManager, TrackManager } from './trackManager';
import { createObstacleManager, ObstacleManager, CoinInstance, PowerUpInstance } from './obstacleManager';
import { soundManager } from '../audio/SoundEffects';

export interface GameEngineCallbacks {
  onScoreUpdate: (stats: GameStats) => void;
  onPowerUpsUpdate: (activePowerUps: ActivePowerUp[]) => void;
  onGameOver: (finalStats: GameStats) => void;
  onCoinCollected: (count: number) => void;
}

export class GameEngine {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private isSoftwareGl: boolean;

  private character: CharacterRig;
  private trackManager: TrackManager;
  private obstacleManager: ObstacleManager;

  // Particle systems for coin bursts & sparks
  private particleGroup: THREE.Group;
  private particles: {
    mesh: THREE.Mesh;
    velocity: THREE.Vector3;
    life: number;
    maxLife: number;
  }[] = [];
  private particleGeom: THREE.SphereGeometry;
  private coinSparkMat: THREE.MeshBasicMaterial;
  private shieldSparkMat: THREE.MeshBasicMaterial;

  // Game state
  private state: GameState = 'START';
  private stats: GameStats = {
    score: 0,
    distance: 0,
    coins: 0,
    speed: INITIAL_SPEED,
    multiplier: 1,
  };

  // Active power-up timers
  private activePowerUps: Map<PowerUpType, { duration: number; remaining: number }> = new Map();

  // Player physics state
  private currentLaneIndex = 1; // 0: Left, 1: Middle, 2: Right
  private playerX = 0;
  private targetX = 0;
  private playerY = 0;
  private verticalVelocity = 0;
  private isGrounded = true;
  private isJumping = false;
  private isSliding = false;
  private slideTimer = 0;
  private onPlatformY = 0; // If running on train roof
  private invincibilityTimer = 0; // After shield hit

  // Camera dynamics
  private cameraShake = 0;
  private baseFov = 62;

  // Render loop control
  private clock: THREE.Clock;
  private animationFrameId: number | null = null;
  private callbacks: GameEngineCallbacks;
  private currentSkin: PlayerSkin;

  constructor(container: HTMLElement, skinId: string, callbacks: GameEngineCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.currentSkin = AVAILABLE_SKINS.find((s) => s.id === skinId) || AVAILABLE_SKINS[0];

    // 1. Detect software WebGL
    this.isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    // 2. Initialize Three.js Scene, Camera, Renderer
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x090d16);
    this.scene.fog = new THREE.FogExp2(0x090d16, 0.011);

    const aspect = container.clientWidth / (container.clientHeight || 1);
    this.camera = new THREE.PerspectiveCamera(this.baseFov, aspect, 0.1, 400);
    this.camera.position.set(0, 4.3, 7.8);
    this.camera.lookAt(0, 1.2, -12);

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(this.renderer.domElement);

    // 3. Studio Environment Reflection via RoomEnvironment
    try {
      const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
      this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
      pmremGenerator.dispose();
    } catch {
      // Fallback if RoomEnvironment fails
    }

    // 4. Lighting Rig (Key warm light, cool hemisphere fill, cyber rim light)
    const keyLight = new THREE.DirectionalLight(0xffedd5, 1.8);
    keyLight.position.set(12, 22, 10);
    keyLight.castShadow = !this.isSoftwareGl;
    if (keyLight.castShadow) {
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.camera.near = 0.5;
      keyLight.shadow.camera.far = 60;
      keyLight.shadow.camera.left = -10;
      keyLight.shadow.camera.right = 10;
      keyLight.shadow.camera.top = 15;
      keyLight.shadow.camera.bottom = -5;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    this.scene.add(keyLight);

    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 0.75);
    this.scene.add(hemiLight);

    const rimLight = new THREE.DirectionalLight(0xf43f5e, 0.6);
    rimLight.position.set(-12, 10, -25);
    this.scene.add(rimLight);

    // 5. Initialize Track & Obstacle Managers
    this.trackManager = createTrackManager();
    this.scene.add(this.trackManager.group);

    this.obstacleManager = createObstacleManager();
    this.scene.add(this.obstacleManager.group);

    // 6. Initialize Character Rig
    this.character = createDMSCharacter(this.currentSkin);
    this.character.group.position.set(0, 0, 0);
    this.scene.add(this.character.group);

    // 7. Particle system
    this.particleGroup = new THREE.Group();
    this.scene.add(this.particleGroup);
    this.particleGeom = new THREE.SphereGeometry(0.08, 6, 6);
    this.coinSparkMat = new THREE.MeshBasicMaterial({ color: 0xffd700 });
    this.shieldSparkMat = new THREE.MeshBasicMaterial({ color: 0x34d399 });

    this.clock = new THREE.Clock();

    // Resize handler
    window.addEventListener('resize', this.handleResize);

    // Start render loop
    this.startLoop();
  }

  public setSkin(skin: PlayerSkin) {
    this.currentSkin = skin;
    this.character.setSkin(skin);
  }

  public startGame() {
    this.state = 'PLAYING';
    this.stats = {
      score: 0,
      distance: 0,
      coins: 0,
      speed: INITIAL_SPEED,
      multiplier: 1,
    };
    this.activePowerUps.clear();
    this.currentLaneIndex = 1;
    this.playerX = 0;
    this.targetX = 0;
    this.playerY = 0;
    this.verticalVelocity = 0;
    this.isGrounded = true;
    this.isJumping = false;
    this.isSliding = false;
    this.slideTimer = 0;
    this.onPlatformY = 0;
    this.invincibilityTimer = 0;

    this.obstacleManager.reset();
    soundManager.startBGM();

    this.callbacks.onScoreUpdate(this.stats);
    this.callbacks.onPowerUpsUpdate([]);
  }

  public pauseGame() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      soundManager.stopBGM();
    }
  }

  public resumeGame() {
    if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      soundManager.startBGM();
    }
  }

  public restartGame() {
    this.startGame();
  }

  public getGameState(): GameState {
    return this.state;
  }

  // Input actions
  public moveLeft() {
    if (this.state !== 'PLAYING') return;
    if (this.currentLaneIndex > 0) {
      this.currentLaneIndex--;
      this.targetX = LANES[this.currentLaneIndex];
      soundManager.playLaneChange();
    }
  }

  public moveRight() {
    if (this.state !== 'PLAYING') return;
    if (this.currentLaneIndex < 2) {
      this.currentLaneIndex++;
      this.targetX = LANES[this.currentLaneIndex];
      soundManager.playLaneChange();
    }
  }

  public jump() {
    if (this.state !== 'PLAYING') return;
    if (this.isGrounded || this.onPlatformY > 0) {
      const isSuperJump = this.activePowerUps.has('SUPER_JUMP');
      this.verticalVelocity = isSuperJump ? SUPER_JUMP_VELOCITY : JUMP_VELOCITY;
      this.isGrounded = false;
      this.isJumping = true;
      this.isSliding = false;
      this.slideTimer = 0;
      soundManager.playJump();
    }
  }

  public slide() {
    if (this.state !== 'PLAYING') return;

    if (!this.isGrounded) {
      // In-air fast dive slam down into slide!
      this.verticalVelocity = -36;
    }

    this.isSliding = true;
    this.slideTimer = SLIDE_DURATION;
    soundManager.playSlide();

    // Spawn skid sparks
    this.spawnSparks(this.character.group.position, 6, 'COIN');
  }

  // Particle bursts
  private spawnSparks(pos: THREE.Vector3, count = 8, type: 'COIN' | 'SHIELD' = 'COIN') {
    const mat = type === 'COIN' ? this.coinSparkMat : this.shieldSparkMat;
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(this.particleGeom, mat);
      mesh.position.copy(pos);
      mesh.position.y += 0.5;

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 6,
        Math.random() * 5 + 2,
        (Math.random() - 0.5) * 6
      );

      this.particleGroup.add(mesh);
      this.particles.push({
        mesh,
        velocity: vel,
        life: 0,
        maxLife: 0.4 + Math.random() * 0.3,
      });
    }
  }

  private handleCollectCoin = (coin: CoinInstance) => {
    const multiplier = this.stats.multiplier;
    const addedCoins = multiplier;
    this.stats.coins += addedCoins;
    this.stats.score += addedCoins * 15;

    soundManager.playCoin();
    this.spawnSparks(new THREE.Vector3(coin.x, coin.y, coin.z), 6, 'COIN');
    this.callbacks.onCoinCollected(this.stats.coins);
    this.callbacks.onScoreUpdate(this.stats);
  };

  private handleCollectPowerUp = (powerUp: PowerUpInstance) => {
    const cfg = POWER_UP_CONFIG[powerUp.type];
    this.activePowerUps.set(powerUp.type, {
      duration: cfg.duration,
      remaining: cfg.duration,
    });

    if (powerUp.type === 'MULTIPLIER') {
      this.stats.multiplier = 2;
    }

    soundManager.playPowerUp();
    this.cameraShake = 0.25;
    this.spawnSparks(new THREE.Vector3(powerUp.x, powerUp.y, powerUp.z), 12, 'SHIELD');

    this.syncPowerUpsToUI();
  };

  private syncPowerUpsToUI() {
    const list: ActivePowerUp[] = [];
    this.activePowerUps.forEach((val, type) => {
      list.push({
        type,
        duration: val.duration,
        remaining: val.remaining,
      });
    });
    this.callbacks.onPowerUpsUpdate(list);
  }

  private triggerGameOver() {
    this.state = 'GAMEOVER';
    soundManager.stopBGM();
    soundManager.playCrash();

    this.cameraShake = 0.5;
    this.spawnSparks(this.character.group.position, 18, 'SHIELD');

    // Tumble animation
    this.character.group.rotation.x = -Math.PI / 4;
    this.character.group.rotation.z = Math.PI / 6;

    this.callbacks.onGameOver(this.stats);
  }

  private update(delta: number) {
    if (this.state !== 'PLAYING') {
      // In START / PAUSE / GAMEOVER: idle animation
      this.character.updateAnimation(delta, true, false, false, 0.5, false, false);
      return;
    }

    // 1. Advance Speed & Distance
    this.stats.distance += this.stats.speed * delta;
    this.stats.score += Math.floor(this.stats.speed * delta * 2 * this.stats.multiplier);

    // Accelerate smoothly
    if (this.stats.speed < MAX_SPEED) {
      this.stats.speed += delta * SPEED_ACCELERATION;
    }

    this.callbacks.onScoreUpdate(this.stats);

    // 2. Power-up Timers
    let powerUpsChanged = false;
    this.activePowerUps.forEach((val, type) => {
      val.remaining -= delta;
      powerUpsChanged = true;
      if (val.remaining <= 0) {
        this.activePowerUps.delete(type);
        if (type === 'MULTIPLIER') {
          this.stats.multiplier = 1;
        }
      }
    });
    if (powerUpsChanged) {
      this.syncPowerUpsToUI();
    }

    const isMagnetActive = this.activePowerUps.has('MAGNET');
    const isShieldActive = this.activePowerUps.has('SHIELD');

    // 3. Invincibility blink after shield absorption
    if (this.invincibilityTimer > 0) {
      this.invincibilityTimer -= delta;
      this.character.group.visible = Math.floor(this.invincibilityTimer * 15) % 2 === 0;
    } else {
      this.character.group.visible = true;
    }

    // 4. Update Horizontal Movement (Lane Switching)
    this.playerX = THREE.MathUtils.damp(this.playerX, this.targetX, 20, delta);
    this.character.group.position.x = this.playerX;

    // Lateral banking tilt
    const roll = (this.targetX - this.playerX) * -0.16;
    this.character.group.rotation.z = roll;

    // 5. Update Sliding
    if (this.isSliding) {
      this.slideTimer -= delta;
      if (this.slideTimer <= 0) {
        this.isSliding = false;
      }
    }

    // 6. Platform Height detection (Are we over a train roof?)
    let currentRoofY = 0;
    for (const obs of this.obstacleManager.obstacles) {
      if (obs.isTrain && Math.abs(obs.laneX - this.playerX) < 1.0) {
        // Within train Z bounds
        const trainHalfLen = obs.length / 2;
        if (this.character.group.position.z >= obs.z - trainHalfLen &&
            this.character.group.position.z <= obs.z + trainHalfLen + 1.0) {
          currentRoofY = 2.7; // Top of train roof
          break;
        }
      }
    }
    this.onPlatformY = currentRoofY;

    // 7. Update Vertical Physics (Jump / Fall)
    const groundLevel = this.onPlatformY;

    if (!this.isGrounded || this.playerY > groundLevel) {
      this.verticalVelocity += GRAVITY * delta;
      this.playerY += this.verticalVelocity * delta;

      if (this.playerY <= groundLevel) {
        this.playerY = groundLevel;
        this.verticalVelocity = 0;
        this.isGrounded = true;
        this.isJumping = false;
      } else {
        this.isGrounded = false;
      }
    } else {
      this.playerY = groundLevel;
      this.verticalVelocity = 0;
      this.isGrounded = true;
      this.isJumping = false;
    }

    this.character.group.position.y = this.playerY;

    // 8. Update Character Model Animation
    const speedRatio = this.stats.speed / INITIAL_SPEED;
    this.character.updateAnimation(
      delta,
      this.isGrounded,
      this.isJumping,
      this.isSliding,
      speedRatio,
      isShieldActive,
      isMagnetActive
    );

    // 9. Update Track & Obstacles
    this.trackManager.update(delta, this.stats.speed);
    this.obstacleManager.update(
      delta,
      this.stats.speed,
      this.character.group.position,
      isMagnetActive,
      this.handleCollectCoin,
      this.handleCollectPowerUp
    );

    // 10. Collision Detection Against Obstacles
    const playerZ = this.character.group.position.z;
    const playerY = this.playerY;
    const isPlayerSliding = this.isSliding;

    if (this.invincibilityTimer <= 0) {
      for (const obs of this.obstacleManager.obstacles) {
        const halfLen = obs.length / 2;
        const dz = Math.abs(obs.z - playerZ);

        // Check if player is longitudinally overlapping this obstacle
        if (dz < halfLen + 0.35) {
          // Check lateral lane overlap
          const dx = Math.abs(obs.laneX - this.playerX);
          if (dx < 0.85) {
            let hasCollided = false;

            if (obs.type === 'TRAIN') {
              // If player is on the roof (y >= 2.6), safe!
              if (playerY < 2.5) {
                hasCollided = true;
              }
            } else if (obs.type === 'HURDLE') {
              // Low hurdle (height 0.9m). Must jump over!
              if (playerY < 0.8) {
                hasCollided = true;
              }
            } else if (obs.type === 'OVERHEAD_BARRIER') {
              // Clearance underneath is 1.1m. Must slide under!
              if (!isPlayerSliding || playerY > 0.3) {
                hasCollided = true;
              }
            } else if (obs.type === 'ROADBLOCK') {
              // Full roadblock (height 2.8m). Must have super jump or switch lane!
              if (playerY < 2.6) {
                hasCollided = true;
              }
            }

            if (hasCollided) {
              if (isShieldActive) {
                // Shield saves player!
                this.activePowerUps.delete('SHIELD');
                this.syncPowerUpsToUI();
                soundManager.playShieldBreak();
                this.cameraShake = 0.35;
                this.invincibilityTimer = 1.4; // 1.4s grace period
                this.spawnSparks(this.character.group.position, 14, 'SHIELD');
                // Push obstacle forward or mark as passed so it doesn't immediately re-hit
                obs.z = 25;
              } else {
                this.triggerGameOver();
                return;
              }
            }
          }
        }
      }
    }

    // 11. Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += delta;
      if (p.life >= p.maxLife) {
        this.particleGroup.remove(p.mesh);
        this.particles.splice(i, 1);
        continue;
      }
      p.mesh.position.addScaledVector(p.velocity, delta);
      p.velocity.y -= 12 * delta; // Gravity
      const scale = 1 - p.life / p.maxLife;
      p.mesh.scale.set(scale, scale, scale);
    }

    // 12. Dynamic Camera Follow & FOV
    const targetCamX = this.playerX * 0.35;
    const targetCamY = this.playerY * 0.45 + 4.3;
    const targetCamZ = 7.6;

    this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, targetCamX, 10, delta);
    this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, targetCamY, 10, delta);
    this.camera.position.z = targetCamZ;

    // Camera shake decay
    if (this.cameraShake > 0) {
      this.camera.position.x += (Math.random() - 0.5) * this.cameraShake;
      this.camera.position.y += (Math.random() - 0.5) * this.cameraShake;
      this.cameraShake = Math.max(0, this.cameraShake - delta * 1.5);
    }

    // Dynamic FOV widening at higher speeds
    const targetFov = this.baseFov + (this.stats.speed - INITIAL_SPEED) * 0.4;
    this.camera.fov = THREE.MathUtils.damp(this.camera.fov, Math.min(76, targetFov), 5, delta);
    this.camera.updateProjectionMatrix();

    this.camera.lookAt(this.playerX * 0.3, this.playerY * 0.4 + 1.2, -12);
  }

  private startLoop() {
    const tick = () => {
      const delta = Math.min(this.clock.getDelta(), 0.1);
      this.update(delta);
      this.renderer.render(this.scene, this.camera);

      this.animationFrameId = requestAnimationFrame(tick);
    };

    this.animationFrameId = requestAnimationFrame(tick);
  }

  private handleResize = () => {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight || 1;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
  };

  public cleanup() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }

    window.removeEventListener('resize', this.handleResize);

    soundManager.stopBGM();
    this.trackManager.cleanup();
    this.obstacleManager.cleanup();
    this.character.cleanup();

    this.particleGeom.dispose();
    this.coinSparkMat.dispose();
    this.shieldSparkMat.dispose();

    this.renderer.dispose();
    if (this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
