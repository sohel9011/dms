import * as THREE from 'three';
import { PlayerSkin } from '../types';

export interface CharacterRig {
  group: THREE.Group;
  bodyMesh: THREE.Mesh;
  headGroup: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  leftShin: THREE.Group;
  rightShin: THREE.Group;
  thrusterGroup: THREE.Group;
  thrusterFlames: THREE.Mesh[];
  shieldBubble: THREE.Mesh;
  magnetHalo: THREE.Mesh;
  shadowDecal: THREE.Mesh;
  updateAnimation: (
    delta: number,
    isGrounded: boolean,
    isJumping: boolean,
    isSliding: boolean,
    speedRatio: number,
    isShieldActive: boolean,
    isMagnetActive: boolean
  ) => void;
  setSkin: (skin: PlayerSkin) => void;
  cleanup: () => void;
}

/**
 * Creates a procedural 3D runner character (DMS)
 */
export function createDMSCharacter(initialSkin: PlayerSkin): CharacterRig {
  const root = new THREE.Group();

  // Materials mapped to skin colors
  const primaryMat = new THREE.MeshStandardMaterial({
    color: initialSkin.primaryColor,
    roughness: 0.35,
    metalness: 0.25,
  });

  const secondaryMat = new THREE.MeshStandardMaterial({
    color: initialSkin.secondaryColor,
    roughness: 0.7,
    metalness: 0.1,
  });

  const accentMat = new THREE.MeshStandardMaterial({
    color: initialSkin.accentColor,
    roughness: 0.2,
    metalness: 0.6,
    emissive: initialSkin.accentColor,
    emissiveIntensity: 0.3,
  });

  const skinToneMat = new THREE.MeshStandardMaterial({
    color: 0xdeb887,
    roughness: 0.8,
    metalness: 0.0,
  });

  const visorMat = new THREE.MeshPhysicalMaterial({
    color: 0x00ffff,
    emissive: 0x00c8ff,
    emissiveIntensity: 0.6,
    roughness: 0.1,
    metalness: 0.9,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
  });

  const soleMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.9,
    metalness: 0.05,
  });

  // Base inner container that shifts Y for jumping/sliding
  const characterModel = new THREE.Group();
  root.add(characterModel);

  // 1. Torso & Jacket (Primary Silhouette)
  const torsoGroup = new THREE.Group();
  torsoGroup.position.set(0, 0.95, 0);
  characterModel.add(torsoGroup);

  const torsoGeom = new THREE.BoxGeometry(0.55, 0.6, 0.35);
  const torsoMesh = new THREE.Mesh(torsoGeom, primaryMat);
  torsoMesh.castShadow = true;
  torsoMesh.receiveShadow = true;
  torsoGroup.add(torsoMesh);

  // Chest Stripe / DMS Emblem badge
  const emblemGeom = new THREE.BoxGeometry(0.36, 0.16, 0.37);
  const emblemMesh = new THREE.Mesh(emblemGeom, accentMat);
  emblemMesh.position.set(0, 0.08, 0.01);
  torsoGroup.add(emblemMesh);

  // Collar
  const collarGeom = new THREE.CylinderGeometry(0.18, 0.22, 0.12, 12);
  const collarMesh = new THREE.Mesh(collarGeom, secondaryMat);
  collarMesh.position.set(0, 0.34, 0);
  torsoGroup.add(collarMesh);

  // 2. Head & Visor
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.45, 0);
  torsoGroup.add(headGroup);

  const headGeom = new THREE.SphereGeometry(0.22, 16, 14);
  const headMesh = new THREE.Mesh(headGeom, skinToneMat);
  headMesh.castShadow = true;
  headGroup.add(headMesh);

  // Sporty Cyber Helmet / Cap
  const helmetGeom = new THREE.SphereGeometry(0.23, 16, 14, 0, Math.PI * 2, 0, Math.PI * 0.55);
  const helmetMesh = new THREE.Mesh(helmetGeom, secondaryMat);
  helmetMesh.position.set(0, 0.03, -0.02);
  helmetMesh.rotation.x = -0.15;
  headGroup.add(helmetMesh);

  // Cap Visor Brim
  const brimGeom = new THREE.BoxGeometry(0.28, 0.04, 0.16);
  const brimMesh = new THREE.Mesh(brimGeom, secondaryMat);
  brimMesh.position.set(0, 0.08, 0.22);
  headGroup.add(brimMesh);

  // High-Tech Cyber Visor (Eyes)
  const visorGeom = new THREE.BoxGeometry(0.34, 0.1, 0.14);
  const visorMesh = new THREE.Mesh(visorGeom, visorMat);
  visorMesh.position.set(0, 0.02, 0.16);
  headGroup.add(visorMesh);

  // 3. Jet Thruster Backpack
  const thrusterGroup = new THREE.Group();
  thrusterGroup.position.set(0, 0.02, -0.22);
  torsoGroup.add(thrusterGroup);

  const packGeom = new THREE.BoxGeometry(0.32, 0.42, 0.12);
  const packMesh = new THREE.Mesh(packGeom, secondaryMat);
  thrusterGroup.add(packMesh);

  // Twin Thruster Nozzles
  const nozzleGeom = new THREE.CylinderGeometry(0.06, 0.09, 0.16, 8);
  const nozzleMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.3, metalness: 0.8 });
  
  const leftNozzle = new THREE.Mesh(nozzleGeom, nozzleMat);
  leftNozzle.position.set(-0.1, -0.22, 0);
  thrusterGroup.add(leftNozzle);

  const rightNozzle = new THREE.Mesh(nozzleGeom, nozzleMat);
  rightNozzle.position.set(0.1, -0.22, 0);
  thrusterGroup.add(rightNozzle);

  // Thruster Flames (scale dynamically with speed)
  const flameGeom = new THREE.ConeGeometry(0.06, 0.25, 8);
  flameGeom.rotateX(Math.PI);
  const flameMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.85,
  });

  const leftFlame = new THREE.Mesh(flameGeom, flameMat);
  leftFlame.position.set(-0.1, -0.38, 0);
  thrusterGroup.add(leftFlame);

  const rightFlame = new THREE.Mesh(flameGeom, flameMat);
  rightFlame.position.set(0.1, -0.38, 0);
  thrusterGroup.add(rightFlame);

  // 4. Arms (Pendulum Joints at Shoulders)
  const armGeom = new THREE.CylinderGeometry(0.07, 0.06, 0.5, 10);
  armGeom.translate(0, -0.22, 0); // Pivot at shoulder

  // Left Arm
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.35, 0.22, 0);
  torsoGroup.add(leftArm);
  const leftArmMesh = new THREE.Mesh(armGeom, primaryMat);
  leftArmMesh.castShadow = true;
  leftArm.add(leftArmMesh);

  // Left Hand Glove
  const gloveGeom = new THREE.SphereGeometry(0.08, 8, 8);
  const gloveMeshL = new THREE.Mesh(gloveGeom, secondaryMat);
  gloveMeshL.position.set(0, -0.48, 0);
  leftArm.add(gloveMeshL);

  // Right Arm
  const rightArm = new THREE.Group();
  rightArm.position.set(0.35, 0.22, 0);
  torsoGroup.add(rightArm);
  const rightArmMesh = new THREE.Mesh(armGeom, primaryMat);
  rightArmMesh.castShadow = true;
  rightArm.add(rightArmMesh);

  // Right Hand Glove
  const gloveMeshR = new THREE.Mesh(gloveGeom, secondaryMat);
  gloveMeshR.position.set(0, -0.48, 0);
  rightArm.add(gloveMeshR);

  // 5. Legs & Running Sneakers (Joints at Hips)
  const legGeom = new THREE.CylinderGeometry(0.09, 0.075, 0.42, 10);
  legGeom.translate(0, -0.2, 0); // Pivot at hip

  const shinGeom = new THREE.CylinderGeometry(0.075, 0.065, 0.42, 10);
  shinGeom.translate(0, -0.2, 0); // Pivot at knee

  // Left Leg
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.16, 0.65, 0);
  characterModel.add(leftLeg);
  const leftThighMesh = new THREE.Mesh(legGeom, secondaryMat);
  leftThighMesh.castShadow = true;
  leftLeg.add(leftThighMesh);

  const leftShin = new THREE.Group();
  leftShin.position.set(0, -0.4, 0);
  leftLeg.add(leftShin);
  const leftShinMesh = new THREE.Mesh(shinGeom, secondaryMat);
  leftShinMesh.castShadow = true;
  leftShin.add(leftShinMesh);

  // Left Sneaker
  const shoeGeom = new THREE.BoxGeometry(0.16, 0.12, 0.32);
  const leftShoe = new THREE.Mesh(shoeGeom, primaryMat);
  leftShoe.position.set(0, -0.42, 0.07);
  leftShoe.castShadow = true;
  leftShin.add(leftShoe);

  const shoeSoleL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04, 0.34), soleMat);
  shoeSoleL.position.set(0, -0.47, 0.07);
  leftShin.add(shoeSoleL);

  // Right Leg
  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.16, 0.65, 0);
  characterModel.add(rightLeg);
  const rightThighMesh = new THREE.Mesh(legGeom, secondaryMat);
  rightThighMesh.castShadow = true;
  rightLeg.add(rightThighMesh);

  const rightShin = new THREE.Group();
  rightShin.position.set(0, -0.4, 0);
  rightLeg.add(rightShin);
  const rightShinMesh = new THREE.Mesh(shinGeom, secondaryMat);
  rightShinMesh.castShadow = true;
  rightShin.add(rightShinMesh);

  // Right Sneaker
  const rightShoe = new THREE.Mesh(shoeGeom, primaryMat);
  rightShoe.position.set(0, -0.42, 0.07);
  rightShoe.castShadow = true;
  rightShin.add(rightShoe);

  const shoeSoleR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04, 0.34), soleMat);
  shoeSoleR.position.set(0, -0.47, 0.07);
  rightShin.add(shoeSoleR);

  // 6. Shield Bubble Effect (Procedural Hexagonal / Translucent energy bubble)
  const shieldGeom = new THREE.IcosahedronGeometry(1.25, 2);
  const shieldMat = new THREE.MeshPhysicalMaterial({
    color: 0x10b981,
    emissive: 0x34d399,
    emissiveIntensity: 0.7,
    roughness: 0.1,
    metalness: 0.1,
    transmission: 0.8,
    transparent: true,
    opacity: 0.65,
    wireframe: false,
  });
  const shieldBubble = new THREE.Mesh(shieldGeom, shieldMat);
  shieldBubble.position.set(0, 0.95, 0);
  shieldBubble.visible = false;
  characterModel.add(shieldBubble);

  // 7. Magnet Energy Halo
  const haloGeom = new THREE.TorusGeometry(0.7, 0.04, 8, 24);
  const haloMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.75,
  });
  const magnetHalo = new THREE.Mesh(haloGeom, haloMat);
  magnetHalo.rotation.x = Math.PI / 2;
  magnetHalo.position.set(0, 0.95, 0);
  magnetHalo.visible = false;
  characterModel.add(magnetHalo);

  // 8. Ground Contact Shadow Decal
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 64;
  shadowCanvas.height = 64;
  const sctx = shadowCanvas.getContext('2d')!;
  const grad = sctx.createRadialGradient(32, 32, 0, 32, 32, 30);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
  grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.3)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  sctx.fillStyle = grad;
  sctx.fillRect(0, 0, 64, 64);

  const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
  const shadowGeom = new THREE.PlaneGeometry(1.4, 1.4);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTexture,
    transparent: true,
    depthWrite: false,
    opacity: 0.6,
  });
  const shadowDecal = new THREE.Mesh(shadowGeom, shadowMat);
  shadowDecal.rotation.x = -Math.PI / 2;
  shadowDecal.position.set(0, 0.02, 0);
  root.add(shadowDecal);

  // Animation cycle internal clock
  let runAnimTime = 0;

  const updateAnimation = (
    delta: number,
    isGrounded: boolean,
    isJumping: boolean,
    isSliding: boolean,
    speedRatio: number,
    isShieldActive: boolean,
    isMagnetActive: boolean
  ) => {
    // 1. Power-up Visuals
    shieldBubble.visible = isShieldActive;
    if (isShieldActive) {
      shieldBubble.rotation.y += delta * 1.5;
      shieldBubble.rotation.z += delta * 0.8;
      const s = 1.0 + Math.sin(runAnimTime * 8) * 0.04;
      shieldBubble.scale.set(s, s, s);
    }

    magnetHalo.visible = isMagnetActive;
    if (isMagnetActive) {
      magnetHalo.rotation.z += delta * 3.0;
      magnetHalo.position.y = 0.95 + Math.sin(runAnimTime * 6) * 0.15;
    }

    // 2. Thruster Flame pulsing
    const flameScale = speedRatio * (1 + Math.sin(runAnimTime * 25) * 0.25);
    leftFlame.scale.set(flameScale, flameScale * 1.2, flameScale);
    rightFlame.scale.set(flameScale, flameScale * 1.2, flameScale);

    // 3. Stance / Pose handling
    if (isSliding) {
      // SLIDE / ROLL POSE: Tuck low to ground
      characterModel.position.y = -0.45;
      characterModel.rotation.x = 0.55; // Lean back

      torsoGroup.rotation.x = 0.4;
      headGroup.rotation.x = -0.25;

      leftArm.rotation.x = -1.2;
      rightArm.rotation.x = -1.2;

      leftLeg.rotation.x = -1.3;
      rightLeg.rotation.x = 0.6;
      leftShin.rotation.x = 0.2;
      rightShin.rotation.x = 1.4;

      // Contact shadow elongates during slide
      shadowDecal.scale.set(1.1, 1.8, 1);
      shadowDecal.material.opacity = 0.65;
    } else if (isJumping || !isGrounded) {
      // JUMP POSE: Dynamic athletic leap
      characterModel.position.y = 0;
      characterModel.rotation.x = 0.1;

      torsoGroup.rotation.x = 0.1;
      headGroup.rotation.x = 0.1;

      // Arms swing up and back for balance
      leftArm.rotation.x = -0.8;
      leftArm.rotation.z = -0.4;
      rightArm.rotation.x = -0.8;
      rightArm.rotation.z = 0.4;

      // Legs bent backward or tucked
      leftLeg.rotation.x = 0.6;
      leftShin.rotation.x = 0.9;
      rightLeg.rotation.x = -0.4;
      rightShin.rotation.x = 0.7;

      // Shadow scales down as player ascends
      const height = root.position.y;
      const shadowFactor = Math.max(0.2, 1 - height / 4);
      shadowDecal.scale.set(shadowFactor, shadowFactor, shadowFactor);
      shadowDecal.material.opacity = 0.5 * shadowFactor;
    } else {
      // NORMAL RUN CYCLE
      characterModel.position.y = 0;
      characterModel.rotation.x = 0.1; // Forward runner momentum tilt

      runAnimTime += delta * 15 * Math.max(0.8, speedRatio);
      const stride = Math.sin(runAnimTime);
      const strideCos = Math.cos(runAnimTime);

      // Torso slight runner bounce
      torsoGroup.position.y = 0.95 + Math.abs(stride) * 0.08;
      torsoGroup.rotation.y = -stride * 0.1;

      // Head remains focused forward
      headGroup.rotation.y = stride * 0.08;

      // Counter-phase Arm swings
      leftArm.rotation.x = stride * 0.85;
      leftArm.rotation.z = -0.15;
      rightArm.rotation.x = -stride * 0.85;
      rightArm.rotation.z = 0.15;

      // Leg running stride & knee flexion
      leftLeg.rotation.x = -stride * 0.9;
      leftShin.rotation.x = stride > 0 ? stride * 1.1 : 0.1;

      rightLeg.rotation.x = stride * 0.9;
      rightShin.rotation.x = stride < 0 ? -stride * 1.1 : 0.1;

      // Normal shadow
      shadowDecal.scale.set(1.1, 1.2, 1);
      shadowDecal.material.opacity = 0.6;
    }
  };

  const setSkin = (skin: PlayerSkin) => {
    primaryMat.color.set(skin.primaryColor);
    secondaryMat.color.set(skin.secondaryColor);
    accentMat.color.set(skin.accentColor);
    accentMat.emissive.set(skin.accentColor);
  };

  const cleanup = () => {
    primaryMat.dispose();
    secondaryMat.dispose();
    accentMat.dispose();
    skinToneMat.dispose();
    visorMat.dispose();
    soleMat.dispose();
    flameMat.dispose();
    shieldMat.dispose();
    haloMat.dispose();
    shadowMat.dispose();
    shadowTexture.dispose();
  };

  return {
    group: root,
    bodyMesh: torsoMesh,
    headGroup,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    leftShin,
    rightShin,
    thrusterGroup,
    thrusterFlames: [leftFlame, rightFlame],
    shieldBubble,
    magnetHalo,
    shadowDecal,
    updateAnimation,
    setSkin,
    cleanup,
  };
}
