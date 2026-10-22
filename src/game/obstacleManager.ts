import * as THREE from 'three';
import { LANES, POWER_UP_CONFIG } from './constants';
import { ObstacleType, PowerUpType } from '../types';

export interface ObstacleInstance {
  id: number;
  type: ObstacleType;
  group: THREE.Group;
  lane: number; // -1, 0, 1 (maps to LANES[idx])
  laneX: number;
  z: number;
  length: number;
  width: number;
  height: number;
  minY: number;
  maxY: number;
  isTrain: boolean;
  trainRamp?: boolean; // Can be jumped onto
  isPassed: boolean;
}

export interface CoinInstance {
  id: number;
  mesh: THREE.Group;
  x: number;
  y: number;
  z: number;
  collected: boolean;
  baseY: number;
}

export interface PowerUpInstance {
  id: number;
  type: PowerUpType;
  mesh: THREE.Group;
  x: number;
  y: number;
  z: number;
  collected: boolean;
  light: THREE.PointLight;
}

export interface ObstacleManager {
  group: THREE.Group;
  obstacles: ObstacleInstance[];
  coins: CoinInstance[];
  powerUps: PowerUpInstance[];
  update: (
    delta: number,
    speed: number,
    playerPos: THREE.Vector3,
    isMagnetActive: boolean,
    onCollectCoin: (coin: CoinInstance) => void,
    onCollectPowerUp: (powerUp: PowerUpInstance) => void
  ) => void;
  reset: () => void;
  cleanup: () => void;
}

export function createObstacleManager(): ObstacleManager {
  const root = new THREE.Group();

  let nextId = 1;
  const obstacles: ObstacleInstance[] = [];
  const coins: CoinInstance[] = [];
  const powerUps: PowerUpInstance[] = [];

  let nextSpawnZ = -60;
  const SPAWN_INTERVAL = 26; // Distance between obstacle waves
  let coinsUntilPowerUp = 18;

  // 1. Shared Materials & Geometries
  // --- Subway Train Assets ---
  const trainBodyGeom = new THREE.BoxGeometry(2.2, 2.6, 14);
  const trainMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7, // Subway blue
    roughness: 0.35,
    metalness: 0.6,
  });

  const trainRoofGeom = new THREE.BoxGeometry(2.24, 0.2, 14.05);
  const trainRoofMat = new THREE.MeshStandardMaterial({
    color: 0x334155, // Dark non-slip walk roof
    roughness: 0.8,
    metalness: 0.2,
  });

  const trainStripeGeom = new THREE.BoxGeometry(2.22, 0.4, 14.02);
  const trainStripeMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b }); // Bright orange stripe

  const headlightGeom = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 12);
  headlightGeom.rotateX(Math.PI / 2);
  const headlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

  // Train ramp at front so player can jump up
  const rampGeom = new THREE.BoxGeometry(2.1, 1.2, 2.8);
  rampGeom.rotateX(Math.PI * 0.12);

  // --- Hurdle (Jump over) ---
  const hurdlePoleGeom = new THREE.CylinderGeometry(0.06, 0.06, 0.95, 8);
  const hurdleBarGeom = new THREE.BoxGeometry(2.1, 0.22, 0.1);
  const hurdleMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4, metalness: 0.2 });
  const hurdleStripeMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });

  // --- Overhead Barrier (Slide under) ---
  const overheadFrameGeom = new THREE.BoxGeometry(2.4, 0.4, 0.3);
  const overheadLegGeom = new THREE.CylinderGeometry(0.08, 0.08, 2.4, 8);
  const overheadWarningMat = new THREE.MeshBasicMaterial({ color: 0xef4444 }); // Flashing red warning
  const metalFrameMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.3, metalness: 0.7 });

  // --- Roadblock (Full lane block) ---
  const roadblockGeom = new THREE.BoxGeometry(2.2, 2.8, 0.6);
  const roadblockMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.5, metalness: 0.3 });

  // --- Gold Coin ---
  const coinGeom = new THREE.CylinderGeometry(0.36, 0.36, 0.08, 16);
  coinGeom.rotateX(Math.PI / 2);
  const coinMat = new THREE.MeshStandardMaterial({
    color: 0xffb703,
    roughness: 0.2,
    metalness: 0.85,
    emissive: 0xd97706,
    emissiveIntensity: 0.35,
  });
  const coinStarGeom = new THREE.BoxGeometry(0.24, 0.24, 0.09);
  const coinStarMat = new THREE.MeshBasicMaterial({ color: 0xffe885 });

  // --- Power-up Orbs ---
  const powerUpBaseGeom = new THREE.IcosahedronGeometry(0.48, 1);
  const powerUpRingGeom = new THREE.TorusGeometry(0.65, 0.05, 8, 20);

  // Helper to spawn a 3D Subway Train
  const createTrainMesh = (hasRamp: boolean): THREE.Group => {
    const group = new THREE.Group();

    // Main train body
    const body = new THREE.Mesh(trainBodyGeom, trainMat);
    body.position.set(0, 1.4, 0);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Roof (climbable walkway)
    const roof = new THREE.Mesh(trainRoofGeom, trainRoofMat);
    roof.position.set(0, 2.7, 0);
    roof.receiveShadow = true;
    group.add(roof);

    // Hazard orange side stripe
    const stripe = new THREE.Mesh(trainStripeGeom, trainStripeMat);
    stripe.position.set(0, 1.3, 0);
    group.add(stripe);

    // Front glowing headlights (pointing toward player at +Z)
    const lightL = new THREE.Mesh(headlightGeom, headlightMat);
    lightL.position.set(-0.7, 1.0, 7.02);
    group.add(lightL);

    const lightR = new THREE.Mesh(headlightGeom, headlightMat);
    lightR.position.set(0.7, 1.0, 7.02);
    group.add(lightR);

    // Optional front wedge ramp for leaping onto train
    if (hasRamp) {
      const ramp = new THREE.Mesh(rampGeom, trainRoofMat);
      ramp.position.set(0, 0.6, 7.6);
      ramp.castShadow = true;
      group.add(ramp);
    }

    return group;
  };

  // Helper to spawn a Low Hurdle
  const createHurdleMesh = (): THREE.Group => {
    const group = new THREE.Group();

    const bar = new THREE.Mesh(hurdleBarGeom, hurdleMat);
    bar.position.set(0, 0.65, 0);
    bar.castShadow = true;
    group.add(bar);

    const stripes = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.24, 0.11), hurdleStripeMat);
    stripes.position.set(0, 0.65, 0);
    group.add(stripes);

    const poleL = new THREE.Mesh(hurdlePoleGeom, metalFrameMat);
    poleL.position.set(-0.95, 0.48, 0);
    poleL.castShadow = true;
    group.add(poleL);

    const poleR = new THREE.Mesh(hurdlePoleGeom, metalFrameMat);
    poleR.position.set(0.95, 0.48, 0);
    poleR.castShadow = true;
    group.add(poleR);

    return group;
  };

  // Helper to spawn Overhead Slide Barrier
  const createOverheadBarrierMesh = (): THREE.Group => {
    const group = new THREE.Group();

    // Top warning barrier (at y = 1.6 to 2.1)
    const bar = new THREE.Mesh(overheadFrameGeom, overheadWarningMat);
    bar.position.set(0, 1.75, 0);
    bar.castShadow = true;
    group.add(bar);

    const poleL = new THREE.Mesh(overheadLegGeom, metalFrameMat);
    poleL.position.set(-1.05, 1.2, 0);
    poleL.castShadow = true;
    group.add(poleL);

    const poleR = new THREE.Mesh(overheadLegGeom, metalFrameMat);
    poleR.position.set(1.05, 1.2, 0);
    poleR.castShadow = true;
    group.add(poleR);

    // Warning text / hazard sign in center
    const sign = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.35, 0.32), metalFrameMat);
    sign.position.set(0, 1.75, 0);
    group.add(sign);

    return group;
  };

  // Helper to spawn Roadblock
  const createRoadblockMesh = (): THREE.Group => {
    const group = new THREE.Group();

    const block = new THREE.Mesh(roadblockGeom, roadblockMat);
    block.position.set(0, 1.4, 0);
    block.castShadow = true;
    block.receiveShadow = true;
    group.add(block);

    // Hazard lights on top
    const light = new THREE.Mesh(headlightGeom, overheadWarningMat);
    light.position.set(0, 2.9, 0);
    group.add(light);

    return group;
  };

  // Helper to spawn a Gold Coin
  const spawnCoin = (x: number, y: number, z: number) => {
    const coinGroup = new THREE.Group();
    coinGroup.position.set(x, y, z);

    const coin = new THREE.Mesh(coinGeom, coinMat);
    coin.castShadow = true;
    coinGroup.add(coin);

    const star = new THREE.Mesh(coinStarGeom, coinStarMat);
    star.position.set(0, 0, 0);
    coinGroup.add(star);

    root.add(coinGroup);

    coins.push({
      id: nextId++,
      mesh: coinGroup,
      x,
      y,
      z,
      collected: false,
      baseY: y,
    });
  };

  // Helper to spawn an Arc of Coins
  const spawnCoinArc = (laneX: number, startZ: number, count = 5, apexY = 2.8) => {
    const spacing = 2.4;
    for (let i = 0; i < count; i++) {
      const z = startZ - i * spacing;
      const progress = i / (count - 1); // 0 to 1
      const y = 0.8 + Math.sin(progress * Math.PI) * (apexY - 0.8);
      spawnCoin(laneX, y, z);
    }
  };

  // Helper to spawn a Row of Coins
  const spawnCoinRow = (laneX: number, startZ: number, count = 5, y = 0.8) => {
    const spacing = 2.2;
    for (let i = 0; i < count; i++) {
      spawnCoin(laneX, y, startZ - i * spacing);
    }
  };

  // Helper to spawn a Power-up pickup
  const spawnPowerUp = (laneX: number, y: number, z: number, type: PowerUpType) => {
    const group = new THREE.Group();
    group.position.set(laneX, y, z);

    const cfg = POWER_UP_CONFIG[type];
    const mat = new THREE.MeshStandardMaterial({
      color: cfg.color,
      emissive: cfg.color,
      emissiveIntensity: 0.6,
      roughness: 0.1,
      metalness: 0.3,
    });

    const orb = new THREE.Mesh(powerUpBaseGeom, mat);
    orb.castShadow = true;
    group.add(orb);

    const ringMat = new THREE.MeshBasicMaterial({ color: cfg.color });
    const ring = new THREE.Mesh(powerUpRingGeom, ringMat);
    group.add(ring);

    // Glowing point light
    const pointLight = new THREE.PointLight(cfg.color, 1.2, 5);
    pointLight.position.set(0, 0.2, 0);
    group.add(pointLight);

    root.add(group);

    powerUps.push({
      id: nextId++,
      type,
      mesh: group,
      x: laneX,
      y,
      z,
      collected: false,
      light: pointLight,
    });
  };

  // Spawn an Obstacle wave
  const spawnWave = (z: number) => {
    // Pick 1-2 lanes to block with varied obstacles, always keeping at least one safe path
    const patternType = Math.floor(Math.random() * 6);
    const laneIndices = [0, 1, 2].sort(() => Math.random() - 0.5);

    coinsUntilPowerUp--;
    const shouldSpawnPowerUp = coinsUntilPowerUp <= 0;
    if (shouldSpawnPowerUp) {
      coinsUntilPowerUp = Math.floor(Math.random() * 12) + 14;
    }

    if (patternType === 0) {
      // 1 Train on a random lane (with coins on roof!)
      const trainLane = laneIndices[0];
      const hasRamp = Math.random() > 0.4;
      const trainMesh = createTrainMesh(hasRamp);
      const trainX = LANES[trainLane];
      trainMesh.position.set(trainX, 0, z);
      root.add(trainMesh);

      obstacles.push({
        id: nextId++,
        type: 'TRAIN',
        group: trainMesh,
        lane: trainLane,
        laneX: trainX,
        z,
        length: 14,
        width: 2.2,
        height: 2.7,
        minY: 0,
        maxY: 2.7,
        isTrain: true,
        trainRamp: hasRamp,
        isPassed: false,
      });

      // Coins along train roof!
      spawnCoinRow(trainX, z + 5, 5, 3.2);

      // Coins in another lane
      const freeLane = LANES[laneIndices[1]];
      spawnCoinRow(freeLane, z + 6, 6, 0.8);

      // Maybe power-up on the train roof or free lane!
      if (shouldSpawnPowerUp) {
        const types: PowerUpType[] = ['MAGNET', 'MULTIPLIER', 'SHIELD', 'SUPER_JUMP'];
        const type = types[Math.floor(Math.random() * types.length)];
        spawnPowerUp(LANES[laneIndices[2]], 0.9, z, type);
      }
    } else if (patternType === 1) {
      // Hurdle to jump over in one lane, roadblock in another
      const hurdleLane = laneIndices[0];
      const hurdleX = LANES[hurdleLane];
      const hurdleMesh = createHurdleMesh();
      hurdleMesh.position.set(hurdleX, 0, z);
      root.add(hurdleMesh);

      obstacles.push({
        id: nextId++,
        type: 'HURDLE',
        group: hurdleMesh,
        lane: hurdleLane,
        laneX: hurdleX,
        z,
        length: 0.4,
        width: 2.1,
        height: 0.9,
        minY: 0,
        maxY: 0.9,
        isTrain: false,
        isPassed: false,
      });

      // Arc of coins over the hurdle
      spawnCoinArc(hurdleX, z + 3, 5, 2.6);

      // Roadblock on 2nd lane
      const roadLane = laneIndices[1];
      const roadX = LANES[roadLane];
      const roadMesh = createRoadblockMesh();
      roadMesh.position.set(roadX, 0, z);
      root.add(roadMesh);

      obstacles.push({
        id: nextId++,
        type: 'ROADBLOCK',
        group: roadMesh,
        lane: roadLane,
        laneX: roadX,
        z,
        length: 0.6,
        width: 2.2,
        height: 2.8,
        minY: 0,
        maxY: 2.8,
        isTrain: false,
        isPassed: false,
      });

      // 3rd lane has a coin row
      spawnCoinRow(LANES[laneIndices[2]], z + 4, 4, 0.8);
    } else if (patternType === 2) {
      // Overhead barrier (slide under)
      const overheadLane = laneIndices[0];
      const overheadX = LANES[overheadLane];
      const barrierMesh = createOverheadBarrierMesh();
      barrierMesh.position.set(overheadX, 0, z);
      root.add(barrierMesh);

      obstacles.push({
        id: nextId++,
        type: 'OVERHEAD_BARRIER',
        group: barrierMesh,
        lane: overheadLane,
        laneX: overheadX,
        z,
        length: 0.4,
        width: 2.2,
        height: 1.6,
        minY: 1.1, // Clearance below 1.1m (player can slide!)
        maxY: 2.4,
        isTrain: false,
        isPassed: false,
      });

      // Low coin line underneath the barrier
      spawnCoinRow(overheadX, z + 3, 4, 0.5);

      // Train on lane 2
      const trainLane = laneIndices[1];
      const trainX = LANES[trainLane];
      const trainMesh = createTrainMesh(false);
      trainMesh.position.set(trainX, 0, z - 4);
      root.add(trainMesh);

      obstacles.push({
        id: nextId++,
        type: 'TRAIN',
        group: trainMesh,
        lane: trainLane,
        laneX: trainX,
        z: z - 4,
        length: 14,
        width: 2.2,
        height: 2.7,
        minY: 0,
        maxY: 2.7,
        isTrain: true,
        isPassed: false,
      });

      if (shouldSpawnPowerUp) {
        const types: PowerUpType[] = ['MAGNET', 'MULTIPLIER', 'SHIELD', 'SUPER_JUMP'];
        const type = types[Math.floor(Math.random() * types.length)];
        spawnPowerUp(LANES[laneIndices[2]], 0.9, z, type);
      }
    } else if (patternType === 3) {
      // Two Hurdles on adjacent lanes, coins on third
      laneIndices.slice(0, 2).forEach((lIdx) => {
        const hX = LANES[lIdx];
        const hMesh = createHurdleMesh();
        hMesh.position.set(hX, 0, z);
        root.add(hMesh);

        obstacles.push({
          id: nextId++,
          type: 'HURDLE',
          group: hMesh,
          lane: lIdx,
          laneX: hX,
          z,
          length: 0.4,
          width: 2.1,
          height: 0.9,
          minY: 0,
          maxY: 0.9,
          isTrain: false,
          isPassed: false,
        });

        spawnCoinArc(hX, z + 3, 5, 2.4);
      });

      spawnCoinRow(LANES[laneIndices[2]], z + 6, 6, 0.8);
    } else if (patternType === 4) {
      // Two Trains flanking a central running strip with coins
      const laneA = 0;
      const laneC = 2;
      [laneA, laneC].forEach((lIdx) => {
        const tX = LANES[lIdx];
        const tMesh = createTrainMesh(true);
        tMesh.position.set(tX, 0, z);
        root.add(tMesh);

        obstacles.push({
          id: nextId++,
          type: 'TRAIN',
          group: tMesh,
          lane: lIdx,
          laneX: tX,
          z,
          length: 14,
          width: 2.2,
          height: 2.7,
          minY: 0,
          maxY: 2.7,
          isTrain: true,
          trainRamp: true,
          isPassed: false,
        });

        spawnCoinRow(tX, z + 5, 5, 3.2);
      });

      // Middle lane free with coin canyon
      spawnCoinRow(LANES[1], z + 7, 7, 0.8);

      if (shouldSpawnPowerUp) {
        const types: PowerUpType[] = ['MAGNET', 'MULTIPLIER', 'SHIELD', 'SUPER_JUMP'];
        const type = types[Math.floor(Math.random() * types.length)];
        spawnPowerUp(LANES[1], 0.9, z - 5, type);
      }
    } else {
      // Mixed: Roadblock + Overhead Barrier
      const rLane = laneIndices[0];
      const rX = LANES[rLane];
      const rMesh = createRoadblockMesh();
      rMesh.position.set(rX, 0, z);
      root.add(rMesh);

      obstacles.push({
        id: nextId++,
        type: 'ROADBLOCK',
        group: rMesh,
        lane: rLane,
        laneX: rX,
        z,
        length: 0.6,
        width: 2.2,
        height: 2.8,
        minY: 0,
        maxY: 2.8,
        isTrain: false,
        isPassed: false,
      });

      const oLane = laneIndices[1];
      const oX = LANES[oLane];
      const oMesh = createOverheadBarrierMesh();
      oMesh.position.set(oX, 0, z);
      root.add(oMesh);

      obstacles.push({
        id: nextId++,
        type: 'OVERHEAD_BARRIER',
        group: oMesh,
        lane: oLane,
        laneX: oX,
        z,
        length: 0.4,
        width: 2.2,
        height: 1.6,
        minY: 1.1,
        maxY: 2.4,
        isTrain: false,
        isPassed: false,
      });

      spawnCoinRow(oX, z + 3, 3, 0.5);
      spawnCoinRow(LANES[laneIndices[2]], z + 6, 6, 0.8);
    }
  };

  const update = (
    delta: number,
    speed: number,
    playerPos: THREE.Vector3,
    isMagnetActive: boolean,
    onCollectCoin: (coin: CoinInstance) => void,
    onCollectPowerUp: (powerUp: PowerUpInstance) => void
  ) => {
    const shift = speed * delta;

    // 1. Check if we need to spawn new waves ahead
    while (nextSpawnZ > -180) {
      spawnWave(nextSpawnZ);
      nextSpawnZ -= SPAWN_INTERVAL + Math.random() * 8;
    }

    // Advance spawn marker
    nextSpawnZ += shift;

    // 2. Update Obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const obs = obstacles[i];
      obs.z += shift;
      obs.group.position.z = obs.z;

      // Despawn obstacles behind player
      if (obs.z > 25) {
        root.remove(obs.group);
        obstacles.splice(i, 1);
      }
    }

    // 3. Update Coins & Magnet Physics
    for (let i = coins.length - 1; i >= 0; i--) {
      const coin = coins[i];
      coin.z += shift;

      // Spin rotation
      coin.mesh.rotation.y += delta * 4.5;

      // Magnet attraction physics
      if (isMagnetActive && !coin.collected) {
        const dx = playerPos.x - coin.x;
        const dy = (playerPos.y + 0.9) - coin.y;
        const dz = playerPos.z - coin.z;
        const distSq = dx * dx + dy * dy + dz * dz;

        if (distSq < 18 * 18) {
          const pullSpeed = Math.min(38, 22 + (18 - Math.sqrt(distSq)) * 2);
          const dist = Math.sqrt(distSq);
          coin.x += (dx / dist) * pullSpeed * delta;
          coin.y += (dy / dist) * pullSpeed * delta;
          coin.z += (dz / dist) * pullSpeed * delta;
        }
      }

      coin.mesh.position.set(coin.x, coin.y, coin.z);

      // Check coin collection proximity
      const dx = Math.abs(playerPos.x - coin.x);
      const dy = Math.abs(playerPos.y + 0.9 - coin.y);
      const dz = Math.abs(playerPos.z - coin.z);

      if (!coin.collected && dx < 0.9 && dy < 1.2 && dz < 1.0) {
        coin.collected = true;
        onCollectCoin(coin);
        root.remove(coin.mesh);
        coins.splice(i, 1);
        continue;
      }

      // Despawn coins behind player
      if (coin.z > 20) {
        root.remove(coin.mesh);
        coins.splice(i, 1);
      }
    }

    // 4. Update Power-ups
    for (let i = powerUps.length - 1; i >= 0; i--) {
      const pup = powerUps[i];
      pup.z += shift;

      // Float bobbing & spin
      pup.mesh.rotation.y += delta * 2.8;
      pup.mesh.rotation.x = Math.sin(pup.z * 0.5) * 0.2;
      pup.y = 0.9 + Math.sin(pup.z * 0.8) * 0.15;
      pup.mesh.position.set(pup.x, pup.y, pup.z);

      // Collection check
      const dx = Math.abs(playerPos.x - pup.x);
      const dy = Math.abs(playerPos.y + 0.9 - pup.y);
      const dz = Math.abs(playerPos.z - pup.z);

      if (!pup.collected && dx < 1.2 && dy < 1.5 && dz < 1.2) {
        pup.collected = true;
        onCollectPowerUp(pup);
        root.remove(pup.mesh);
        powerUps.splice(i, 1);
        continue;
      }

      if (pup.z > 20) {
        root.remove(pup.mesh);
        powerUps.splice(i, 1);
      }
    }
  };

  const reset = () => {
    // Clear all existing objects from scene
    obstacles.forEach((obs) => root.remove(obs.group));
    coins.forEach((c) => root.remove(c.mesh));
    powerUps.forEach((p) => root.remove(p.mesh));

    obstacles.length = 0;
    coins.length = 0;
    powerUps.length = 0;

    nextSpawnZ = -60;
    coinsUntilPowerUp = 18;
  };

  const cleanup = () => {
    reset();
    trainBodyGeom.dispose();
    trainMat.dispose();
    trainRoofGeom.dispose();
    trainRoofMat.dispose();
    trainStripeGeom.dispose();
    trainStripeMat.dispose();
    headlightGeom.dispose();
    headlightMat.dispose();
    rampGeom.dispose();
    hurdlePoleGeom.dispose();
    hurdleBarGeom.dispose();
    hurdleMat.dispose();
    hurdleStripeMat.dispose();
    overheadFrameGeom.dispose();
    overheadLegGeom.dispose();
    overheadWarningMat.dispose();
    metalFrameMat.dispose();
    roadblockGeom.dispose();
    roadblockMat.dispose();
    coinGeom.dispose();
    coinMat.dispose();
    coinStarGeom.dispose();
    coinStarMat.dispose();
    powerUpBaseGeom.dispose();
    powerUpRingGeom.dispose();
  };

  return {
    group: root,
    obstacles,
    coins,
    powerUps,
    update,
    reset,
    cleanup,
  };
}
