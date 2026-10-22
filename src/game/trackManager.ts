import * as THREE from 'three';
import { LANES, LANE_WIDTH, SEGMENT_LENGTH, NUM_TRACK_SEGMENTS } from './constants';

export interface TrackManager {
  group: THREE.Group;
  update: (delta: number, speed: number) => void;
  cleanup: () => void;
}

export function createTrackManager(): TrackManager {
  const root = new THREE.Group();

  // Shared Geometries & Materials for low draw calls and zero GC
  const roadBedGeom = new THREE.BoxGeometry(10.5, 0.4, SEGMENT_LENGTH);
  const roadBedMat = new THREE.MeshStandardMaterial({
    color: 0x1e2430, // Deep asphalt
    roughness: 0.85,
    metalness: 0.15,
  });

  const railGeom = new THREE.BoxGeometry(0.08, 0.12, SEGMENT_LENGTH);
  const railMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8, // Steel shine
    roughness: 0.3,
    metalness: 0.8,
  });

  const neonStripeGeom = new THREE.BoxGeometry(0.1, 0.02, SEGMENT_LENGTH);
  const neonStripeMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8, // Cyan neon lane divider
  });

  const wallGeom = new THREE.BoxGeometry(0.5, 2.8, SEGMENT_LENGTH);
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.9,
    metalness: 0.1,
  });

  const wallTrimGeom = new THREE.BoxGeometry(0.52, 0.15, SEGMENT_LENGTH);
  const wallTrimMat = new THREE.MeshBasicMaterial({
    color: 0xf43f5e, // Radiant magenta glow along side barriers
  });

  // Sleeper ties
  const sleeperGeom = new THREE.BoxGeometry(2.0, 0.05, 0.4);
  const sleeperMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.9,
    metalness: 0.05,
  });

  // Procedural Building Silhouettes on the sides
  const buildingGeomList = [
    new THREE.BoxGeometry(8, 28, 14),
    new THREE.BoxGeometry(10, 42, 16),
    new THREE.BoxGeometry(7, 34, 12),
    new THREE.BoxGeometry(9, 22, 18),
  ];

  const buildingMatList = [
    new THREE.MeshStandardMaterial({ color: 0x0a0f1d, roughness: 0.7, metalness: 0.2 }),
    new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.6, metalness: 0.3 }),
    new THREE.MeshStandardMaterial({ color: 0x1e1b4b, roughness: 0.8, metalness: 0.1 }),
  ];

  // Neon Billboards
  const billboardGeom = new THREE.BoxGeometry(4.5, 2.2, 0.2);
  const billboardCanvas = document.createElement('canvas');
  billboardCanvas.width = 256;
  billboardCanvas.height = 128;
  const bctx = billboardCanvas.getContext('2d')!;
  bctx.fillStyle = '#0f172a';
  bctx.fillRect(0, 0, 256, 128);
  bctx.strokeStyle = '#06b6d4';
  bctx.lineWidth = 6;
  bctx.strokeRect(8, 8, 240, 112);
  bctx.fillStyle = '#38bdf8';
  bctx.font = 'bold 36px sans-serif';
  bctx.textAlign = 'center';
  bctx.fillText('DMS RUN', 128, 54);
  bctx.fillStyle = '#f43f5e';
  bctx.font = 'bold 22px sans-serif';
  bctx.fillText('HYPER SPEED', 128, 92);

  const billboardTexture = new THREE.CanvasTexture(billboardCanvas);
  billboardTexture.colorSpace = THREE.SRGBColorSpace;
  const billboardMat = new THREE.MeshBasicMaterial({ map: billboardTexture });

  // Overhead Gantry truss
  const gantryBarGeom = new THREE.BoxGeometry(11.5, 0.4, 0.4);
  const gantryLegGeom = new THREE.BoxGeometry(0.4, 5.5, 0.4);
  const gantryMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.4, metalness: 0.7 });

  const segments: THREE.Group[] = [];

  // Build modular track chunks
  for (let i = 0; i < NUM_TRACK_SEGMENTS; i++) {
    const segment = new THREE.Group();
    // Space segments sequentially along negative Z
    const zPos = 45 - i * SEGMENT_LENGTH;
    segment.position.set(0, 0, zPos);

    // 1. Road bed
    const roadBed = new THREE.Mesh(roadBedGeom, roadBedMat);
    roadBed.position.set(0, -0.2, 0);
    roadBed.receiveShadow = true;
    segment.add(roadBed);

    // 2. Rails & Lane Dividers
    LANES.forEach((laneX) => {
      // Pair of steel rails per lane
      const railL = new THREE.Mesh(railGeom, railMat);
      railL.position.set(laneX - 0.75, 0.05, 0);
      railL.receiveShadow = true;
      segment.add(railL);

      const railR = new THREE.Mesh(railGeom, railMat);
      railR.position.set(laneX + 0.75, 0.05, 0);
      railR.receiveShadow = true;
      segment.add(railR);

      // Wooden / composite sleepers along rails
      const sleeperStep = 3.0;
      const count = Math.floor(SEGMENT_LENGTH / sleeperStep);
      for (let s = 0; s < count; s++) {
        const sleeper = new THREE.Mesh(sleeperGeom, sleeperMat);
        sleeper.position.set(laneX, 0.01, -SEGMENT_LENGTH / 2 + s * sleeperStep + 1.5);
        sleeper.receiveShadow = true;
        segment.add(sleeper);
      }
    });

    // Outer lane neon boundaries
    const neonLeft = new THREE.Mesh(neonStripeGeom, neonStripeMat);
    neonLeft.position.set(-LANE_WIDTH - 1.3, 0.02, 0);
    segment.add(neonLeft);

    const neonRight = new THREE.Mesh(neonStripeGeom, neonStripeMat);
    neonRight.position.set(LANE_WIDTH + 1.3, 0.02, 0);
    segment.add(neonRight);

    // 3. Side Walls
    const wallLeft = new THREE.Mesh(wallGeom, wallMat);
    wallLeft.position.set(-5.3, 1.2, 0);
    wallLeft.receiveShadow = true;
    segment.add(wallLeft);

    const trimLeft = new THREE.Mesh(wallTrimGeom, wallTrimMat);
    trimLeft.position.set(-5.3, 2.65, 0);
    segment.add(trimLeft);

    const wallRight = new THREE.Mesh(wallGeom, wallMat);
    wallRight.position.set(5.3, 1.2, 0);
    wallRight.receiveShadow = true;
    segment.add(wallRight);

    const trimRight = new THREE.Mesh(wallTrimGeom, wallTrimMat);
    trimRight.position.set(5.3, 2.65, 0);
    segment.add(trimRight);

    // 4. Overhead Gantry (placed on every 2nd segment)
    if (i % 2 === 0) {
      const gantryGroup = new THREE.Group();
      gantryGroup.position.set(0, 0, 0);

      const topBar = new THREE.Mesh(gantryBarGeom, gantryMat);
      topBar.position.set(0, 4.6, 0);
      topBar.castShadow = true;
      gantryGroup.add(topBar);

      const legL = new THREE.Mesh(gantryLegGeom, gantryMat);
      legL.position.set(-5.3, 2.5, 0);
      legL.castShadow = true;
      gantryGroup.add(legL);

      const legR = new THREE.Mesh(gantryLegGeom, gantryMat);
      legR.position.set(5.3, 2.5, 0);
      legR.castShadow = true;
      gantryGroup.add(legR);

      // Sign hanging from gantry
      const sign = new THREE.Mesh(billboardGeom, billboardMat);
      sign.position.set(0, 3.8, 0);
      gantryGroup.add(sign);

      segment.add(gantryGroup);
    }

    // 5. Buildings along side skyline (Left & Right)
    const bGeomL = buildingGeomList[i % buildingGeomList.length];
    const bMatL = buildingMatList[i % buildingMatList.length];
    const bMeshL = new THREE.Mesh(bGeomL, bMatL);
    bMeshL.position.set(-13 - (i % 3) * 3, 12, (i % 2 === 0 ? 8 : -8));
    segment.add(bMeshL);

    const bGeomR = buildingGeomList[(i + 2) % buildingGeomList.length];
    const bMatR = buildingMatList[(i + 1) % buildingMatList.length];
    const bMeshR = new THREE.Mesh(bGeomR, bMatR);
    bMeshR.position.set(13 + ((i + 1) % 3) * 3, 14, (i % 2 === 0 ? -10 : 10));
    segment.add(bMeshR);

    // Neon window accents on buildings
    const winCanvas = document.createElement('canvas');
    winCanvas.width = 64;
    winCanvas.height = 128;
    const wctx = winCanvas.getContext('2d')!;
    wctx.fillStyle = '#0f172a';
    wctx.fillRect(0, 0, 64, 128);
    wctx.fillStyle = i % 2 === 0 ? '#38bdf8' : '#f59e0b';
    for (let r = 8; r < 120; r += 16) {
      for (let c = 8; c < 56; c += 16) {
        if (Math.random() > 0.3) {
          wctx.fillRect(c, r, 8, 10);
        }
      }
    }
    const winTex = new THREE.CanvasTexture(winCanvas);
    const winGeom = new THREE.PlaneGeometry(4, 18);
    const winMat = new THREE.MeshBasicMaterial({ map: winTex });
    const winMeshL = new THREE.Mesh(winGeom, winMat);
    winMeshL.position.set(-8.8, 10, 0);
    winMeshL.rotation.y = Math.PI / 2;
    segment.add(winMeshL);

    const winMeshR = new THREE.Mesh(winGeom, winMat);
    winMeshR.position.set(8.8, 10, 0);
    winMeshR.rotation.y = -Math.PI / 2;
    segment.add(winMeshR);

    root.add(segment);
    segments.push(segment);
  }

  const update = (delta: number, speed: number) => {
    const shift = speed * delta;

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      seg.position.z += shift;

      // When segment scrolls past the camera behind player (Z > 45)
      if (seg.position.z > 60) {
        // Find current furthest segment in negative Z
        let minZ = 0;
        for (let j = 0; j < segments.length; j++) {
          if (segments[j].position.z < minZ) {
            minZ = segments[j].position.z;
          }
        }
        // Wrap to the front
        seg.position.z = minZ - SEGMENT_LENGTH;
      }
    }
  };

  const cleanup = () => {
    roadBedGeom.dispose();
    roadBedMat.dispose();
    railGeom.dispose();
    railMat.dispose();
    neonStripeGeom.dispose();
    neonStripeMat.dispose();
    wallGeom.dispose();
    wallMat.dispose();
    wallTrimGeom.dispose();
    wallTrimMat.dispose();
    sleeperGeom.dispose();
    sleeperMat.dispose();
    billboardGeom.dispose();
    billboardTexture.dispose();
    billboardMat.dispose();
    gantryBarGeom.dispose();
    gantryLegGeom.dispose();
    gantryMat.dispose();
    buildingGeomList.forEach((g) => g.dispose());
    buildingMatList.forEach((m) => m.dispose());
  };

  return {
    group: root,
    update,
    cleanup,
  };
}
