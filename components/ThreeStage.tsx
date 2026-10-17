'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

interface ThreeStageProps {
  progress: number; // 0.0 to 1.0
  activeActId: number;
  isOrbiting: boolean;
  isBlueprintMode: boolean;
  onCameraChange?: (pos: { x: number; y: number; z: number }) => void;
}

// Pre-allocated scratch helpers for zero GC in animation loop
const _vec3 = new THREE.Vector3();
const _camTarget = new THREE.Vector3();

export default function ThreeStage({
  progress,
  activeActId,
  isOrbiting,
  isBlueprintMode,
}: ThreeStageProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  // Store mutable state in ref to avoid recreation inside animation tick
  const stateRef = useRef({
    progress,
    activeActId,
    isOrbiting,
    isBlueprintMode,
  });

  useEffect(() => {
    stateRef.current = { progress, activeActId, isOrbiting, isBlueprintMode };
  }, [progress, activeActId, isOrbiting, isBlueprintMode]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // --- RENDERER SETUP ---
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // --- SCENE & ATMOSPHERE ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x07090e);
    scene.fog = new THREE.FogExp2(0x07090e, 0.022);

    // Environment reflections using RoomEnvironment + PMREMGenerator
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // --- CAMERA & CONTROLS ---
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 150);
    camera.position.set(0, 7, 16);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.05;
    controls.minDistance = 3;
    controls.maxDistance = 45;
    controls.enabled = false;
    controlsRef.current = controls;

    // --- LIGHTING RIG ---
    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x07090e, 0.8);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfffaed, 2.8);
    keyLight.position.set(12, 18, 14);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 40;
    const d = 14;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.0004;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.PointLight(0x76b900, 3.5, 30);
    rimLight.position.set(-10, 8, -10);
    scene.add(rimLight);

    const cyanFill = new THREE.PointLight(0x06b6d4, 2.0, 25);
    cyanFill.position.set(10, 4, -8);
    scene.add(cyanFill);

    // --- GROUND & BLUEPRINT GRID ---
    const groundGeo = new THREE.PlaneGeometry(100, 100);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x090d16,
      roughness: 0.9,
      metalness: 0.2,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    ground.receiveShadow = true;
    scene.add(ground);

    // Concentric blueprint circular grid
    const gridHelper = new THREE.PolarGridHelper(24, 16, 8, 64, 0x1e293b, 0x0f172a);
    gridHelper.position.y = 0.02;
    scene.add(gridHelper);

    // Soft contact shadow disc
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const sctx = shadowCanvas.getContext('2d');
    if (sctx) {
      const grad = sctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      grad.addColorStop(0, 'rgba(0,0,0,0.85)');
      grad.addColorStop(0.5, 'rgba(0,0,0,0.4)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      sctx.fillStyle = grad;
      sctx.fillRect(0, 0, 128, 128);
    }
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const contactShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(8, 8),
      new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        opacity: 0.7,
        depthWrite: false,
      })
    );
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.y = 0.03;
    scene.add(contactShadow);

    // =========================================================================
    // HERO 3D COMPONENT 1: IMMUTABLE STATE CRYSTAL (deft_state.json)
    // 3–12 part composite group:
    // 1. Faceted crystal core
    // 2. Inner glowing nucleus
    // 3-5. 3 nested rotating gimbal rings
    // 6. Translucent protective forcefield cage
    // 7-10. 4 Cardinal lock cylinders with script key slots
    // =========================================================================
    const stateCrystalGroup = new THREE.Group();
    stateCrystalGroup.position.set(0, 2.5, 0);

    // 1. Faceted crystal core (Icosahedron with emissive PBR)
    const crystalGeo = new THREE.IcosahedronGeometry(1.2, 0);
    const crystalMat = new THREE.MeshPhysicalMaterial({
      color: 0x10b981,
      emissive: 0x064e3b,
      emissiveIntensity: 0.8,
      roughness: 0.15,
      metalness: 0.85,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      transmission: 0.35,
      ior: 1.6,
      thickness: 1.2,
      wireframe: false,
    });
    const crystalMesh = new THREE.Mesh(crystalGeo, crystalMat);
    crystalMesh.castShadow = true;
    stateCrystalGroup.add(crystalMesh);

    // 2. Inner glowing nucleus
    const nucleusGeo = new THREE.OctahedronGeometry(0.5, 0);
    const nucleusMat = new THREE.MeshBasicMaterial({
      color: 0x76b900,
      wireframe: true,
    });
    const nucleusMesh = new THREE.Mesh(nucleusGeo, nucleusMat);
    stateCrystalGroup.add(nucleusMesh);

    // 3, 4, 5. Three nested rotating gimbal rings
    const createGimbalRing = (radius: number, tube: number, color: number) => {
      const ringGeo = new THREE.TorusGeometry(radius, tube, 16, 64);
      const ringMat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.25,
        metalness: 0.9,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.castShadow = true;
      return ring;
    };
    const gimbalX = createGimbalRing(1.8, 0.04, 0x38bdf8);
    const gimbalY = createGimbalRing(2.1, 0.04, 0x10b981);
    const gimbalZ = createGimbalRing(2.4, 0.04, 0x76b900);
    stateCrystalGroup.add(gimbalX, gimbalY, gimbalZ);

    // 6. Translucent protective forcefield cage
    const cageGeo = new THREE.IcosahedronGeometry(2.6, 1);
    const cageMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x083344,
      transparent: true,
      opacity: 0.25,
      wireframe: true,
    });
    const cageMesh = new THREE.Mesh(cageGeo, cageMat);
    stateCrystalGroup.add(cageMesh);

    // 7-10. 4 Cardinal lock cylinders with script key pins
    const lockPillars: THREE.Mesh[] = [];
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      const lockPillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.16, 1.2, 16),
        new THREE.MeshStandardMaterial({
          color: 0x1e293b,
          roughness: 0.2,
          metalness: 0.9,
        })
      );
      lockPillar.position.set(Math.cos(angle) * 3.1, -1.8, Math.sin(angle) * 3.1);
      lockPillar.castShadow = true;
      lockPillars.push(lockPillar);
      stateCrystalGroup.add(lockPillar);

      // Glowing lock status pin on top
      const pin = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 16, 16),
        new THREE.MeshStandardMaterial({
          color: 0x10b981,
          emissive: 0x10b981,
          emissiveIntensity: 1.5,
        })
      );
      pin.position.set(0, 0.65, 0);
      lockPillar.add(pin);
    }
    scene.add(stateCrystalGroup);

    // =========================================================================
    // HERO 3D COMPONENT 2: LIVING TOPOLOGY GRAPH
    // Represents driver.sh, python wrappers, and model routing boundary
    // =========================================================================
    const topologyGroup = new THREE.Group();

    // Driver.sh entrance conduit arch
    const archCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-6, 0, 4),
      new THREE.Vector3(-4, 3, 2),
      new THREE.Vector3(-2, 2.5, 0),
    ]);
    const archGeo = new THREE.TubeGeometry(archCurve, 32, 0.12, 12, false);
    const archMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      emissive: 0x0369a1,
      emissiveIntensity: 0.6,
      roughness: 0.3,
      metalness: 0.8,
    });
    const archMesh = new THREE.Mesh(archGeo, archMat);
    topologyGroup.add(archMesh);

    // Script boundary wall (semi-transparent barrier keeping model isolated)
    const barrierGeo = new THREE.CylinderGeometry(4.2, 4.2, 1.8, 32, 1, true, 0, Math.PI);
    const barrierMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    });
    const barrierMesh = new THREE.Mesh(barrierGeo, barrierMat);
    barrierMesh.position.y = 1.0;
    barrierMesh.rotation.y = Math.PI / 4;
    topologyGroup.add(barrierMesh);

    // Model Node (Peripheral satellite with floating aura)
    const modelNodeGroup = new THREE.Group();
    modelNodeGroup.position.set(5.5, 2.2, -2.5);
    const modelCore = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.8),
      new THREE.MeshStandardMaterial({
        color: 0x8b5cf6,
        emissive: 0x581c87,
        emissiveIntensity: 0.9,
        roughness: 0.2,
        metalness: 0.8,
      })
    );
    modelCore.castShadow = true;
    modelNodeGroup.add(modelCore);

    // Model repelled particle stream towards crystal
    const conduitCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(5.5, 2.2, -2.5),
      new THREE.Vector3(3.2, 2.4, -1.2),
      new THREE.Vector3(2.6, 2.5, 0),
    ]);
    const conduitGeo = new THREE.TubeGeometry(conduitCurve, 24, 0.05, 8, false);
    const conduitMat = new THREE.MeshStandardMaterial({
      color: 0xa855f7,
      emissive: 0x7e22ce,
      emissiveIntensity: 0.5,
    });
    const conduitMesh = new THREE.Mesh(conduitGeo, conduitMat);
    topologyGroup.add(conduitMesh);
    topologyGroup.add(modelNodeGroup);
    scene.add(topologyGroup);

    // =========================================================================
    // HERO 3D COMPONENT 3: PROGRESSIVE DISCLOSURE CARD PACK
    // 6 modular card tablets that fan out, then compress into dense ROM brick
    // =========================================================================
    const cardPackGroup = new THREE.Group();
    cardPackGroup.position.set(-4.5, 2.0, -3.0);

    const cardMeshes: THREE.Mesh[] = [];
    const cardCount = 6;
    const cardMatBase = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.3,
      metalness: 0.8,
    });

    for (let i = 0; i < cardCount; i++) {
      const card = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 0.08, 2.0),
        cardMatBase.clone()
      );
      card.castShadow = true;
      card.receiveShadow = true;

      // Emissive edge strip
      const edge = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.09, 1.9),
        new THREE.MeshBasicMaterial({ color: 0x10b981 })
      );
      edge.position.x = 0.68;
      card.add(edge);

      cardPackGroup.add(card);
      cardMeshes.push(card);
    }
    scene.add(cardPackGroup);

    // =========================================================================
    // HERO 3D COMPONENT 4: KPI MATH GATE IRIS & HALLUCINATION SHATTER
    // Precision mechanical aperture + shattering red hallucination debris
    // =========================================================================
    const mathIrisGroup = new THREE.Group();
    mathIrisGroup.position.set(0, 2.8, -5.5);

    // Circular iris outer casing
    const irisRing = new THREE.Mesh(
      new THREE.TorusGeometry(2.0, 0.22, 16, 48),
      new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        roughness: 0.2,
        metalness: 0.95,
      })
    );
    irisRing.castShadow = true;
    mathIrisGroup.add(irisRing);

    // 8 Mechanical aperture blades
    const blades: THREE.Mesh[] = [];
    for (let i = 0; i < 8; i++) {
      const bladeGeo = new THREE.BoxGeometry(1.2, 0.04, 0.4);
      const bladeMat = new THREE.MeshStandardMaterial({
        color: 0x334155,
        roughness: 0.3,
        metalness: 0.85,
      });
      const blade = new THREE.Mesh(bladeGeo, bladeMat);
      blade.position.set(0.6, 0, 0);
      const bladePivot = new THREE.Group();
      bladePivot.rotation.z = (i * Math.PI) / 4;
      bladePivot.add(blade);
      mathIrisGroup.add(bladePivot);
      blades.push(blade);
    }

    // Holographic laser crosshair in center
    const laserHolo = new THREE.Mesh(
      new THREE.RingGeometry(0.2, 0.9, 32),
      new THREE.MeshBasicMaterial({
        color: 0x76b900,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6,
      })
    );
    mathIrisGroup.add(laserHolo);

    // Hallucination Shatter Debris (24 red shards)
    const shardCount = 28;
    const shardGroup = new THREE.Group();
    shardGroup.position.set(0, 0, 1.2);
    const shardMeshes: { mesh: THREE.Mesh; velocity: THREE.Vector3; initialPos: THREE.Vector3 }[] = [];
    const shardGeo = new THREE.TetrahedronGeometry(0.18, 0);

    for (let i = 0; i < shardCount; i++) {
      const shardMat = new THREE.MeshStandardMaterial({
        color: 0xef4444,
        emissive: 0x991b1b,
        emissiveIntensity: 0.8,
        roughness: 0.4,
        metalness: 0.6,
      });
      const shard = new THREE.Mesh(shardGeo, shardMat);
      const angle = (i / shardCount) * Math.PI * 2;
      const rad = 0.3 + Math.random() * 0.4;
      const initialPos = new THREE.Vector3(
        Math.cos(angle) * rad,
        Math.sin(angle) * rad,
        (Math.random() - 0.5) * 0.3
      );
      shard.position.copy(initialPos);

      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 2.5,
        (Math.random() - 0.5) * 2.5,
        1.5 + Math.random() * 2.0
      );

      shardGroup.add(shard);
      shardMeshes.push({ mesh: shard, velocity, initialPos });
    }
    mathIrisGroup.add(shardGroup);
    scene.add(mathIrisGroup);

    // =========================================================================
    // HERO 3D COMPONENT 5: SUB-SKILL CONSTELLATION
    // 5 Orbiting mechanical satellite pods cycling closed-loop data
    // =========================================================================
    const constellationGroup = new THREE.Group();
    const subSkillPods: {
      group: THREE.Group;
      angleOffset: number;
      orbitRadius: number;
      speed: number;
    }[] = [];

    const podColors = [0x10b981, 0x06b6d4, 0x3b82f6, 0x8b5cf6, 0xec4899];

    for (let i = 0; i < 5; i++) {
      const podGroup = new THREE.Group();

      // Satellite main chassis (3-part composite)
      const chassis = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25, 0.3, 0.6, 12),
        new THREE.MeshStandardMaterial({
          color: 0x1e293b,
          roughness: 0.25,
          metalness: 0.9,
        })
      );
      chassis.rotation.x = Math.PI / 2;
      chassis.castShadow = true;
      podGroup.add(chassis);

      // Sensor horn / solar wing
      const wing = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, 0.04, 0.25),
        new THREE.MeshStandardMaterial({
          color: 0x0f172a,
          roughness: 0.3,
          metalness: 0.8,
        })
      );
      podGroup.add(wing);

      // Emissive status beacon
      const beacon = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 16, 16),
        new THREE.MeshStandardMaterial({
          color: podColors[i],
          emissive: podColors[i],
          emissiveIntensity: 1.8,
        })
      );
      beacon.position.z = 0.35;
      podGroup.add(beacon);

      const orbitRadius = 6.8 + (i % 2) * 1.2;
      const angleOffset = (i * Math.PI * 2) / 5;
      subSkillPods.push({ group: podGroup, angleOffset, orbitRadius, speed: 0.35 + i * 0.05 });
      constellationGroup.add(podGroup);
    }

    // Orbit trail ring
    const orbitRing = new THREE.Mesh(
      new THREE.RingGeometry(6.7, 6.78, 96),
      new THREE.MeshBasicMaterial({
        color: 0x1e293b,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.4,
      })
    );
    orbitRing.rotation.x = -Math.PI / 2;
    orbitRing.position.y = 1.2;
    constellationGroup.add(orbitRing);
    scene.add(constellationGroup);

    // =========================================================================
    // DYNAMIC FLOATING DATA PACKETS (InstancedMesh: 40 packets)
    // =========================================================================
    const packetCount = 40;
    const packetGeo = new THREE.SphereGeometry(0.06, 8, 8);
    const packetMat = new THREE.MeshBasicMaterial({ color: 0x76b900 });
    const packetMesh = new THREE.InstancedMesh(packetGeo, packetMat, packetCount);
    packetMesh.frustumCulled = false;
    scene.add(packetMesh);

    const dummy = new THREE.Object3D();
    const packetOffsets = Array.from({ length: packetCount }, (_, i) => ({
      orbitRadius: 4.0 + (i % 4) * 0.8,
      speed: 0.6 + (i % 5) * 0.2,
      phase: (i / packetCount) * Math.PI * 2,
      yOffset: 0.8 + ((i % 6) / 6) * 3.0,
    }));

    // =========================================================================
    // CAMERA CHOREOGRAPHY SPLINES (5 ACTS)
    // Smooth cinematic transitions corresponding to active acts
    // =========================================================================
    const cameraWaypoints = [
      { pos: new THREE.Vector3(0, 8, 17), target: new THREE.Vector3(0, 2, 0) },     // Act 1: Overview
      { pos: new THREE.Vector3(0.5, 3.8, 6.5), target: new THREE.Vector3(0, 2.5, 0) },// Act 2: State Crystal Macro
      { pos: new THREE.Vector3(-6.5, 4.5, 4.0), target: new THREE.Vector3(-4.5, 2.0, -2.5) }, // Act 3: Card Pack
      { pos: new THREE.Vector3(0, 3.2, 0.8), target: new THREE.Vector3(0, 2.8, -5.5) },   // Act 4: Math Iris
      { pos: new THREE.Vector3(8.5, 10.5, 14), target: new THREE.Vector3(0, 1.5, 0) },    // Act 5: Sub-Skill Constellation
    ];

    // =========================================================================
    // RESIZE LISTENER
    // =========================================================================
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // =========================================================================
    // ANIMATION RENDER LOOP (60fps, Damped Kinematics)
    // =========================================================================
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsedTime = clock.getElapsedTime();
      const current = stateRef.current;

      // Handle Free Orbit vs Cinematic Camera Spline
      if (current.isOrbiting) {
        controls.enabled = true;
        controls.update();
      } else {
        controls.enabled = false;
        // Interpolate camera between act waypoints based on progress
        const actIndex = Math.min(Math.floor(current.progress * 5), 4);
        const nextIndex = Math.min(actIndex + 1, 4);
        const localT = (current.progress * 5) % 1;

        const currentWp = cameraWaypoints[actIndex];
        const nextWp = cameraWaypoints[nextIndex];

        // Smooth hermite lerp
        const smoothT = localT * localT * (3 - 2 * localT);
        _vec3.lerpVectors(currentWp.pos, nextWp.pos, smoothT);
        _camTarget.lerpVectors(currentWp.target, nextWp.target, smoothT);

        // Exponential damping (1 - Math.exp(-k * dt))
        const dampFactor = 1 - Math.exp(-3.5 * delta);
        camera.position.lerp(_vec3, dampFactor);

        const currentLookAt = controls.target;
        currentLookAt.lerp(_camTarget, dampFactor);
        camera.lookAt(currentLookAt);
      }

      // --- ANIMATE HERO COMPONENT 1: STATE CRYSTAL ---
      crystalMesh.rotation.y += 0.4 * delta;
      crystalMesh.rotation.x += 0.2 * delta;
      nucleusMesh.rotation.y -= 0.6 * delta;

      gimbalX.rotation.x += 0.8 * delta;
      gimbalY.rotation.y += 0.6 * delta;
      gimbalZ.rotation.z += 0.5 * delta;
      cageMesh.rotation.y += 0.15 * delta;

      // Subtle levitation
      stateCrystalGroup.position.y = 2.5 + Math.sin(elapsedTime * 1.8) * 0.12;

      // --- ANIMATE HERO COMPONENT 2: MODEL ROUTER & TOPOLOGY ---
      modelCore.rotation.y += 0.7 * delta;
      modelCore.rotation.z += 0.3 * delta;

      // --- ANIMATE HERO COMPONENT 3: CARD PACK ---
      // In Act 3 (progress ~0.4 to 0.6), fan cards out; otherwise keep stacked
      const isAct3 = current.progress >= 0.38 && current.progress <= 0.62;
      const fanRatio = isAct3 ? Math.sin(((current.progress - 0.38) / 0.24) * Math.PI) : 0;

      cardMeshes.forEach((card, idx) => {
        const targetY = (idx - 2.5) * (0.12 + fanRatio * 0.45);
        const targetRotY = (idx - 2.5) * (fanRatio * 0.28);
        const targetZ = idx * (fanRatio * 0.35);

        card.position.y = THREE.MathUtils.damp(card.position.y, targetY, 4, delta);
        card.rotation.y = THREE.MathUtils.damp(card.rotation.y, targetRotY, 4, delta);
        card.position.z = THREE.MathUtils.damp(card.position.z, targetZ, 4, delta);
      });

      // --- ANIMATE HERO COMPONENT 4: MATH IRIS & SHATTER ---
      // In Act 4 (progress ~0.6 to 0.8), shatter red hallucination shards
      const isAct4 = current.progress >= 0.58 && current.progress <= 0.82;
      const shatterRatio = isAct4 ? Math.sin(((current.progress - 0.58) / 0.24) * Math.PI) : 0;

      // Rotate iris aperture blades
      blades.forEach((b, i) => {
        const openAngle = (shatterRatio > 0.4 ? 0.35 : 0.05);
        b.rotation.z = THREE.MathUtils.damp(b.rotation.z, (i * Math.PI) / 4 + openAngle, 5, delta);
      });
      laserHolo.rotation.z += 0.5 * delta;

      shardMeshes.forEach((item) => {
        if (shatterRatio > 0.1) {
          item.mesh.position.x = item.initialPos.x + item.velocity.x * shatterRatio * 1.5;
          item.mesh.position.y = item.initialPos.y + item.velocity.y * shatterRatio * 1.5;
          item.mesh.position.z = item.initialPos.z + item.velocity.z * shatterRatio * 1.5;
          item.mesh.rotation.x += delta * 4;
          item.mesh.rotation.y += delta * 3;
          item.mesh.visible = true;
        } else {
          item.mesh.position.copy(item.initialPos);
          item.mesh.visible = false;
        }
      });

      // --- ANIMATE HERO COMPONENT 5: SUB-SKILL SATELLITES ---
      subSkillPods.forEach((pod) => {
        const podAngle = elapsedTime * pod.speed + pod.angleOffset;
        pod.group.position.set(
          Math.cos(podAngle) * pod.orbitRadius,
          1.8 + Math.sin(podAngle * 2) * 0.4,
          Math.sin(podAngle) * pod.orbitRadius
        );
        pod.group.rotation.y = -podAngle;
        pod.group.rotation.z = Math.sin(elapsedTime * 2) * 0.1;
      });

      // --- ANIMATE DATA PACKETS ---
      packetOffsets.forEach((p, idx) => {
        const pAngle = elapsedTime * p.speed + p.phase;
        dummy.position.set(
          Math.cos(pAngle) * p.orbitRadius,
          p.yOffset + Math.sin(elapsedTime * 3 + idx) * 0.2,
          Math.sin(pAngle) * p.orbitRadius
        );
        dummy.scale.setScalar(0.7 + Math.sin(elapsedTime * 4 + idx) * 0.3);
        dummy.updateMatrix();
        packetMesh.setMatrixAt(idx, dummy.matrix);
      });
      packetMesh.instanceMatrix.needsUpdate = true;

      // --- BLUEPRINT WIREFRAME TOGGLE ---
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh && obj.material && obj !== ground && obj !== contactShadow) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => {
              if ('wireframe' in m) (m as THREE.MeshStandardMaterial).wireframe = current.isBlueprintMode;
            });
          } else if ('wireframe' in obj.material) {
            (obj.material as THREE.MeshStandardMaterial).wireframe = current.isBlueprintMode;
          }
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      controls.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 w-full h-full overflow-hidden pointer-events-auto"
      style={{ touchAction: 'none' }}
    />
  );
}
