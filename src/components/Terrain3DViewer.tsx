import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import {
  RotateCcw,
  MapPin,
} from 'lucide-react';
import { ProcessedAnalysisResult } from '../types';

// Helper to dispose all textures on a material
function disposeMaterialTextures(material: any) {
  if (!material) return;
  const textureKeys = [
    'map', 'lightMap', 'bumpMap', 'normalMap', 'specularMap',
    'envMap', 'alphaMap', 'roughnessMap', 'metalnessMap', 'displacementMap'
  ];
  for (const key of textureKeys) {
    if (material[key] && typeof material[key].dispose === 'function') {
      material[key].dispose();
    }
  }
}

// Helper to traverse and dispose all scene objects, geometries, and materials
function disposeSceneObjects(scene: THREE.Scene) {
  scene.traverse((obj: any) => {
    if (obj.geometry && typeof obj.geometry.dispose === 'function') {
      obj.geometry.dispose();
    }
    if (obj.material) {
      if (Array.isArray(obj.material)) {
        obj.material.forEach((mat: any) => {
          disposeMaterialTextures(mat);
          mat.dispose();
        });
      } else {
        disposeMaterialTextures(obj.material);
        obj.material.dispose();
      }
    }
  });
}

export interface Terrain3DViewerProps {
  isActive?: boolean;
  // CLPS Mode Props
  isClpsMode?: boolean;
  slopeOverlayActive?: boolean;
  roughnessOverlayActive?: boolean;
  onSelectSite?: (site: any, sampledSlope: number) => void;
  onDeselectSite?: () => void;
  selectedSite?: any;
  onLoadProgress?: (progress: number, label: string) => void;
  onLoaded?: () => void;
  sunAngleDeg?: number;
  exaggeration?: number;
  wireframe?: boolean;
  autoRotate?: boolean;
  onToggleAutoRotate?: () => void;

  // Legacy Hazard Analyzer Props
  analysis?: ProcessedAnalysisResult | null;
  rawImageBitmap?: HTMLImageElement | ImageBitmap | null;
}

const Terrain3DViewerComponent: React.FC<Terrain3DViewerProps> = ({
  isActive = true,
  isClpsMode = true,
  slopeOverlayActive = false,
  roughnessOverlayActive = false,
  onSelectSite,
  onDeselectSite,
  selectedSite,
  onLoadProgress,
  onLoaded,
  sunAngleDeg: propSunAngle = 20,
  exaggeration: propExaggeration = 2.0,
  wireframe: propWireframe = false,
  autoRotate: propAutoRotate = false,
  analysis,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const dirLightRef = useRef<THREE.DirectionalLight | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const isActiveRef = useRef<boolean>(isActive);
  isActiveRef.current = isActive;
  const isDataLoadedRef = useRef<boolean>(false);
  const autoRotateRef = useRef<boolean>(propAutoRotate);
  autoRotateRef.current = propAutoRotate;

  // Markers & Raycaster references
  const markersGroupRef = useRef<THREE.Group | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseVecRef = useRef<THREE.Vector2>(new THREE.Vector2(-999, -999));
  const offscreenSlopeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenDemCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Textures cache
  const texturesRef = useRef<{
    dem?: THREE.Texture;
    slope?: THREE.Texture;
    roughness?: THREE.Texture;
    baseAlbedo?: THREE.Texture;
  }>({});

  // Loaded GeoJSON Features
  const geojsonFeaturesRef = useRef<any[]>([]);

  // Camera Orbit & Damping State (enableDamping = true with 0.08 damping factor)
  const targetSphericalRef = useRef<{ radius: number; theta: number; phi: number }>({
    radius: 72,
    theta: Math.PI / 4,
    phi: Math.PI / 3.0,
  });
  const currentSphericalRef = useRef<{ radius: number; theta: number; phi: number }>({
    radius: 72,
    theta: Math.PI / 4,
    phi: Math.PI / 3.0,
  });

  const lookAtTargetRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const cameraTargetPosRef = useRef<THREE.Vector3 | null>(null);
  const cameraLookAtTargetRef = useRef<THREE.Vector3 | null>(null);

  // Pointer drag state
  const isDraggingRef = useRef<boolean>(false);
  const prevMouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragDistanceRef = useRef<number>(0);

  // Hover Tooltip State
  const [hoveredSite, setHoveredSite] = useState<any | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // Update Camera from current spherical coordinates around lookAtTarget
  const updateCameraPosition = useCallback(() => {
    const cam = cameraRef.current;
    if (!cam) return;
    const { radius, theta, phi } = currentSphericalRef.current;
    const target = lookAtTargetRef.current;

    cam.position.x = target.x + radius * Math.sin(phi) * Math.sin(theta);
    cam.position.y = target.y + radius * Math.cos(phi);
    cam.position.z = target.z + radius * Math.sin(phi) * Math.cos(theta);
    cam.lookAt(target);
  }, []);

  // -------------------------------------------------------------
  // PIXEL SLOPE SAMPLING UTILITY
  // -------------------------------------------------------------
  const sampleSlopeAt = useCallback((x: number, z: number, fallbackSlope = 7.0): number => {
    const canvas = offscreenSlopeCanvasRef.current;
    if (!canvas) return fallbackSlope;

    const ctx = canvas.getContext('2d');
    if (!ctx) return fallbackSlope;

    const planeSize = 80;
    const u = Math.max(0, Math.min(1, (x + planeSize / 2) / planeSize));
    const v = Math.max(0, Math.min(1, (z + planeSize / 2) / planeSize));

    const px = Math.min(canvas.width - 1, Math.max(0, Math.floor(u * canvas.width)));
    const py = Math.min(canvas.height - 1, Math.max(0, Math.floor(v * canvas.height)));

    try {
      const pixel = ctx.getImageData(px, py, 1, 1).data;
      const r = pixel[0];
      const g = pixel[1];

      // Decode slope:
      // If predominantly green (r < 100, g > 150) -> 1° to 5°
      // If amber/yellow (r > 180, g > 150) -> 5° to 10°
      // If crimson red (r > 200, g < 100) -> 10° to 35°
      if (r > 200 && g < 100) {
        return Number((10.0 + (r - 200) / 4.0).toFixed(2));
      } else if (r > 150 && g > 140) {
        return Number((5.0 + ((r - 150) / 100) * 5.0).toFixed(2));
      } else {
        return Number((1.2 + (g / 255) * 3.8).toFixed(2));
      }
    } catch {
      return fallbackSlope;
    }
  }, []);

  // -------------------------------------------------------------
  // PIXEL ELEVATION SAMPLING UTILITY FROM NASA DEM
  // -------------------------------------------------------------
  const sampleElevationAt = useCallback((x: number, z: number, planeSize = 80): number => {
    const canvas = offscreenDemCanvasRef.current;
    if (!canvas) return 0;

    const ctx = canvas.getContext('2d');
    if (!ctx) return 0;

    const u = Math.max(0, Math.min(1, (x + planeSize / 2) / planeSize));
    const v = Math.max(0, Math.min(1, (z + planeSize / 2) / planeSize));

    const px = Math.min(canvas.width - 1, Math.max(0, Math.floor(u * canvas.width)));
    const py = Math.min(canvas.height - 1, Math.max(0, Math.floor(v * canvas.height)));

    try {
      const pixel = ctx.getImageData(px, py, 1, 1).data;
      const elevationNorm = pixel[0] / 255.0;
      return (elevationNorm * 18.0 - 5.0) * (propExaggeration / 2.0);
    } catch {
      return 0;
    }
  }, [propExaggeration]);

  // -------------------------------------------------------------
  // INITIALIZE THREE.JS SCENE
  // -------------------------------------------------------------
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x03050a); // Deep space obsidian
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 2000);
    cameraRef.current = camera;
    updateCameraPosition();

    // 3. WebGL Renderer with performance-optimized resolution and tone mapping
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    rendererRef.current = renderer;

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // WebGL Context Loss Handlers to prevent white-screen crashes
    const handleContextLost = (e: Event) => {
      e.preventDefault();
      console.warn('[Terrain3DViewer] WebGL context lost. Pausing render loop.');
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }
    };
    const handleContextRestored = () => {
      console.log('[Terrain3DViewer] WebGL context restored. Resuming render loop.');
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        animate();
      }
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored);

    // 4. Lighting (Simulating Lunar South Pole Stark Grazing Sunlight & Realistic Shadows)
    const ambientLight = new THREE.AmbientLight(0x182236, 0.45);
    scene.add(ambientLight);

    // Crisp Directional Sunlight with optimized 1024x1024 shadow map
    const dirLight = new THREE.DirectionalLight(0xffffff, 3.2);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 400;
    const d = 60;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.bias = -0.0005;
    dirLight.shadow.normalBias = 0.04;
    dirLightRef.current = dirLight;
    scene.add(dirLight);

    // Secondary fill light for faint earthshine
    const earthshine = new THREE.DirectionalLight(0x324a70, 0.45);
    earthshine.position.set(-80, 50, -80);
    scene.add(earthshine);

    // 5. Markers Group
    const markersGroup = new THREE.Group();
    markersGroup.name = 'clps-markers-group';
    scene.add(markersGroup);
    markersGroupRef.current = markersGroup;

    // 6. Animation Render Loop with smooth OrbitControls damping & tab-pause optimization
    let isRunning = true;
    const animate = () => {
      if (!isRunning) return;
      animFrameIdRef.current = requestAnimationFrame(animate);

      // Pause render loop if viewer is inactive or browser tab is hidden (saves 100% GPU/CPU)
      if (!isActiveRef.current || document.hidden) {
        return;
      }

      // Camera lerp animation when focusing on marker
      if (cameraTargetPosRef.current && cameraLookAtTargetRef.current) {
        camera.position.lerp(cameraTargetPosRef.current, 0.05);
        lookAtTargetRef.current.lerp(cameraLookAtTargetRef.current, 0.05);
        camera.lookAt(lookAtTargetRef.current);

        // Sync spherical coordinates from current camera offset
        const offset = new THREE.Vector3().subVectors(camera.position, lookAtTargetRef.current);
        const rad = offset.length();
        const phi = Math.acos(Math.max(-1, Math.min(1, offset.y / rad)));
        const theta = Math.atan2(offset.x, offset.z);

        targetSphericalRef.current = { radius: rad, phi, theta };
        currentSphericalRef.current = { radius: rad, phi, theta };

        if (camera.position.distanceTo(cameraTargetPosRef.current) < 0.2) {
          cameraTargetPosRef.current = null;
          cameraLookAtTargetRef.current = null;
        }
      } else {
        if (autoRotateRef.current) {
          targetSphericalRef.current.theta += 0.0035;
        }

        // OrbitControls-style Smooth Damping (enableDamping = true, dampingFactor = 0.08)
        const damping = 0.08;
        currentSphericalRef.current.theta += (targetSphericalRef.current.theta - currentSphericalRef.current.theta) * damping;
        currentSphericalRef.current.phi += (targetSphericalRef.current.phi - currentSphericalRef.current.phi) * damping;
        currentSphericalRef.current.radius += (targetSphericalRef.current.radius - currentSphericalRef.current.radius) * damping;

        updateCameraPosition();
      }

      // Gentle pulsing animation on 3D marker rings
      if (markersGroupRef.current) {
        const time = performance.now() * 0.003;
        markersGroupRef.current.children.forEach(child => {
          if (child.name.startsWith('marker-ring-')) {
            const scale = 1.0 + Math.sin(time * 2 + child.id) * 0.15;
            child.scale.set(scale, scale, 1);
          }
        });
      }

      try {
        renderer.render(scene, camera);
      } catch (err) {
        console.error('[Terrain3DViewer] Render error:', err);
      }
    };
    animate();

    // Listen for tab visibility changes
    const handleVisibilityChange = () => {
      if (!document.hidden && isActiveRef.current && rendererRef.current && sceneRef.current && cameraRef.current) {
        updateCameraPosition();
        try {
          rendererRef.current.render(sceneRef.current, cameraRef.current);
        } catch {}
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Resize Observer
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0 && cameraRef.current && rendererRef.current) {
          cameraRef.current.aspect = w / h;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(container);

    return () => {
      isRunning = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (renderer.domElement) {
        renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
        renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored);
      }
      resizeObserver.disconnect();

      // Dispose all scene objects, meshes, geometries, and materials
      disposeSceneObjects(scene);

      // Dispose all cached textures
      Object.values(texturesRef.current).forEach(tex => {
        if (tex && typeof tex.dispose === 'function') {
          tex.dispose();
        }
      });
      texturesRef.current = {};

      // Dispose WebGL renderer and force context loss to release GPU resources
      renderer.dispose();
      renderer.forceContextLoss();

      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }

      rendererRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
      meshRef.current = null;
      markersGroupRef.current = null;
      isDataLoadedRef.current = false;
    };
  }, [updateCameraPosition]);

  // -------------------------------------------------------------
  // UPDATE DIRECTIONAL SOLAR LIGHTING ANGLE
  // -------------------------------------------------------------
  useEffect(() => {
    const dirLight = dirLightRef.current;
    if (!dirLight) return;
    const rad = (propSunAngle * Math.PI) / 180;
    // Low-angle grazing sun across lunar South Pole
    dirLight.position.set(Math.cos(rad) * 140, Math.sin(rad) * 140, 100);
  }, [propSunAngle]);

  // -------------------------------------------------------------
  // RENDER 3D GLOWING MARKERS FOR CLPS CANDIDATE REGIONS
  // -------------------------------------------------------------
  const renderSiteMarkers = useCallback((features: any[]) => {
    const group = markersGroupRef.current;
    if (!group) return;

    // Clear existing markers and properly dispose geometries and materials
    while (group.children.length > 0) {
      const child = group.children[0] as THREE.Mesh;
      group.remove(child);
      if (child.geometry && typeof child.geometry.dispose === 'function') {
        child.geometry.dispose();
      }
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else if (typeof child.material.dispose === 'function') {
          child.material.dispose();
        }
      }
    }

    features.forEach((feature: any, idx: number) => {
      const coords = feature.geometry?.coordinates || [0, -90];
      const lon = coords[0];
      const lat = coords[1];

      // Polar stereographic projection: lat in [-84, -90]S, South Pole at -90
      const rho = 90 + lat; // 0 at South Pole, up to 6 at -84S
      const phi = (lon * Math.PI) / 180;
      const x = rho * Math.sin(phi) * (34 / 6);
      const z = rho * Math.cos(phi) * (34 / 6);
      // Exact ground elevation from DEM
      const groundY = sampleElevationAt(x, z);
      const isSelected = selectedSite?.properties?.name === feature.properties?.name;

      // 1. Glowing Vertical Beacon Needle
      const needleGeo = new THREE.CylinderGeometry(0.2, 0.45, 7.5, 16);
      const needleMat = new THREE.MeshBasicMaterial({
        color: isSelected ? 0x00f0ff : 0x10b981,
        transparent: true,
        opacity: isSelected ? 0.95 : 0.8,
      });
      const needle = new THREE.Mesh(needleGeo, needleMat);
      needle.position.set(x, groundY + 3.75, z);
      needle.name = `marker-needle-${idx}`;
      needle.userData = { site: feature, x, y: groundY, z };
      group.add(needle);

      // 2. Glowing Orb at Beacon Top
      const orbGeo = new THREE.SphereGeometry(1.1, 16, 16);
      const orbMat = new THREE.MeshStandardMaterial({
        color: isSelected ? 0xffffff : 0x34d399,
        emissive: isSelected ? 0x00f0ff : 0x059669,
        emissiveIntensity: isSelected ? 1.8 : 1.1,
        roughness: 0.2,
      });
      const orb = new THREE.Mesh(orbGeo, orbMat);
      orb.position.set(x, groundY + 7.5, z);
      orb.name = `marker-orb-${idx}`;
      orb.userData = { site: feature, x, y: groundY, z };
      group.add(orb);

      // 3. Ground Target Ring
      const ringGeo = new THREE.RingGeometry(1.6, 2.4, 32);
      ringGeo.rotateX(-Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({
        color: isSelected ? 0x00f0ff : 0x10b981,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.75,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(x, groundY + 0.15, z);
      ring.name = `marker-ring-${idx}`;
      ring.userData = { site: feature, x, y: groundY, z };
      group.add(ring);
    });
  }, [selectedSite, sampleElevationAt]);

  // -------------------------------------------------------------
  // LEGACY HAZARD ANALYZER MESH BUILDER
  // -------------------------------------------------------------
  const buildLegacyTerrain = useCallback((scene: THREE.Scene, res: ProcessedAnalysisResult) => {
    const planeSize = 80;
    const segs = 120;
    const geometry = new THREE.PlaneGeometry(planeSize, planeSize, segs, segs);
    geometry.rotateX(-Math.PI / 2);

    const pos = geometry.attributes.position;
    const count = pos.count;
    const colors = new Float32Array(count * 3);
    const slopeMap = res.slopeMap;
    const mapW = res.width;
    const mapH = res.height;

    for (let i = 0; i < count; i++) {
      const vx = pos.getX(i);
      const vz = pos.getZ(i);
      const px = Math.min(mapW - 1, Math.max(0, Math.round(((vx + planeSize / 2) / planeSize) * (mapW - 1))));
      const py = Math.min(mapH - 1, Math.max(0, Math.round(((vz + planeSize / 2) / planeSize) * (mapH - 1))));
      const slope = slopeMap ? slopeMap[py * mapW + px] : 0;

      const height = (slope / 45.0) * 4.0;
      pos.setY(i, height * (propExaggeration / 2.0));

      const colorIdx = i * 3;
      if (slope <= 5.0) {
        colors[colorIdx] = 0.06; colors[colorIdx + 1] = 0.72; colors[colorIdx + 2] = 0.50;
      } else if (slope <= 10.0) {
        colors[colorIdx] = 0.96; colors[colorIdx + 1] = 0.62; colors[colorIdx + 2] = 0.04;
      } else {
        colors[colorIdx] = 0.93; colors[colorIdx + 1] = 0.26; colors[colorIdx + 2] = 0.26;
      }
    }

    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.6,
      metalness: 0.15,
      flatShading: true,
    });

    const terrainMesh = new THREE.Mesh(geometry, mat);
    terrainMesh.receiveShadow = true;
    terrainMesh.castShadow = true;
    meshRef.current = terrainMesh;
    scene.add(terrainMesh);
  }, [propExaggeration]);

  // -------------------------------------------------------------
  // LOAD NASA LRO DATA & BUILD 3D TERRAIN MESH (RUNS ONCE)
  // -------------------------------------------------------------
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // If not in CLPS mode and legacy analysis exists, build legacy mesh
    if (!isClpsMode && analysis) {
      buildLegacyTerrain(scene, analysis);
      return;
    }

    if (isDataLoadedRef.current) return;

    let isCancelled = false;
    onLoadProgress?.(15, 'Loading NASA LRO LOLA Topography...');

    const planeSize = 80;
    const segs = 128; // 128x128 grid (16,384 vertices)
    const geometry = new THREE.PlaneGeometry(planeSize, planeSize, segs, segs);
    geometry.rotateX(-Math.PI / 2); // Lay flat on XZ

    const textureLoader = new THREE.TextureLoader();
    const dataUrls = {
      dem: ['/data/dem_heightmap.png', '/public/data/dem_heightmap.png'],
      slope: ['/data/slope_texture.png', '/public/data/slope_texture.png'],
      roughness: ['/data/roughness_texture.png', '/public/data/roughness_texture.png'],
      geojson: ['/data/A3_Named_regions.geojson', '/public/data/A3_Named_regions.geojson'],
    };

    // Robust texture loader with fallback URLs & GPU-optimized filtering
    const loadTextureWithFallback = (urls: string[]): Promise<THREE.Texture> => {
      return new Promise((resolve, reject) => {
        let index = 0;
        const tryNext = () => {
          if (index >= urls.length) {
            reject(new Error('All texture fallback URLs failed'));
            return;
          }
          const url = urls[index++];
          textureLoader.load(
            url,
            tex => {
              if (isCancelled) {
                tex.dispose();
                return;
              }
              tex.wrapS = THREE.ClampToEdgeWrapping;
              tex.wrapT = THREE.ClampToEdgeWrapping;
              tex.colorSpace = THREE.SRGBColorSpace;
              tex.minFilter = THREE.LinearFilter;
              tex.magFilter = THREE.LinearFilter;
              tex.generateMipmaps = false;
              resolve(tex);
            },
            undefined,
            () => tryNext()
          );
        };
        tryNext();
      });
    };

    // Load DEM, Slope, Roughness, and GeoJSON concurrently
    Promise.allSettled([
      loadTextureWithFallback(dataUrls.dem),
      loadTextureWithFallback(dataUrls.slope),
      loadTextureWithFallback(dataUrls.roughness),
      fetch(dataUrls.geojson[0]).then(r => r.ok ? r.json() : fetch(dataUrls.geojson[1]).then(r2 => r2.json())),
    ]).then(async ([demRes, slopeRes, roughRes, geoRes]) => {
      if (isCancelled || !sceneRef.current) {
        geometry.dispose();
        return;
      }

      onLoadProgress?.(60, 'Synthesizing Lunar South Pole Mesh...');

      const demTex = demRes.status === 'fulfilled' ? demRes.value : undefined;
      const slopeTex = slopeRes.status === 'fulfilled' ? slopeRes.value : undefined;
      const roughTex = roughRes.status === 'fulfilled' ? roughRes.value : undefined;

      texturesRef.current.dem = demTex;
      texturesRef.current.slope = slopeTex;
      texturesRef.current.roughness = roughTex;

      // Cache offscreen slope canvas for real pixel sampling
      if (slopeTex && slopeTex.image) {
        const img = slopeTex.image as HTMLImageElement | HTMLCanvasElement;
        const offCanvas = document.createElement('canvas');
        offCanvas.width = (img as any).width || 512;
        offCanvas.height = (img as any).height || 512;
        const offCtx = offCanvas.getContext('2d');
        if (offCtx) {
          offCtx.drawImage(img as CanvasImageSource, 0, 0);
          offscreenSlopeCanvasRef.current = offCanvas;
        }
      }

      // Cache offscreen DEM canvas and displace geometry vertices on CPU with true 3D surface normals
      if (demTex && demTex.image) {
        const dImg = demTex.image as HTMLImageElement | HTMLCanvasElement;
        const dCanvas = document.createElement('canvas');
        dCanvas.width = (dImg as any).width || 512;
        dCanvas.height = (dImg as any).height || 512;
        const dCtx = dCanvas.getContext('2d');
        if (dCtx) {
          dCtx.drawImage(dImg as CanvasImageSource, 0, 0);
          offscreenDemCanvasRef.current = dCanvas;
          const dData = dCtx.getImageData(0, 0, dCanvas.width, dCanvas.height).data;

          const pos = geometry.attributes.position;
          const count = pos.count;
          const dw = dCanvas.width;
          const dh = dCanvas.height;

          for (let i = 0; i < count; i++) {
            const vx = pos.getX(i);
            const vz = pos.getZ(i);

            const u = Math.max(0, Math.min(1, (vx + planeSize / 2) / planeSize));
            const v = Math.max(0, Math.min(1, (vz + planeSize / 2) / planeSize));

            const px = Math.min(dw - 1, Math.max(0, Math.floor(u * (dw - 1))));
            const py = Math.min(dh - 1, Math.max(0, Math.floor(v * (dh - 1))));

            const pIdx = (py * dw + px) * 4;
            const elevationNorm = dData[pIdx] / 255.0;
            const elevationMeters = (elevationNorm * 18.0 - 5.0) * (propExaggeration / 2.0);
            pos.setY(i, elevationMeters);
          }

          geometry.computeVertexNormals();
        }
      }

      // Synthesize high-definition lunar photographic albedo map (optimized 512x512) from real LOLA DEM
      const baseCanvas = document.createElement('canvas');
      baseCanvas.width = 512;
      baseCanvas.height = 512;
      const bCtx = baseCanvas.getContext('2d');
      if (bCtx) {
        if (demTex && demTex.image) {
          bCtx.drawImage(demTex.image as CanvasImageSource, 0, 0, 512, 512);
          const bData = bCtx.getImageData(0, 0, 512, 512);
          const pxs = bData.data;

          for (let i = 0; i < pxs.length; i += 4) {
            const lum = pxs[i];
            const factor = Math.pow(lum / 255.0, 1.25);
            const r = Math.round(20 + factor * 140);
            const g = Math.round(22 + factor * 145);
            const b = Math.round(28 + factor * 160);
            const noise = (Math.random() - 0.5) * 6;
            pxs[i] = Math.max(0, Math.min(255, r + noise));
            pxs[i + 1] = Math.max(0, Math.min(255, g + noise));
            pxs[i + 2] = Math.max(0, Math.min(255, b + noise));
            pxs[i + 3] = 255;
          }
          bCtx.putImageData(bData, 0, 0);
        } else {
          bCtx.fillStyle = '#1e222d';
          bCtx.fillRect(0, 0, 512, 512);
        }
      }
      const baseAlbedoTex = new THREE.CanvasTexture(baseCanvas);
      baseAlbedoTex.colorSpace = THREE.SRGBColorSpace;
      baseAlbedoTex.minFilter = THREE.LinearFilter;
      baseAlbedoTex.magFilter = THREE.LinearFilter;
      baseAlbedoTex.generateMipmaps = false;
      texturesRef.current.baseAlbedo = baseAlbedoTex;

      let activeMap: THREE.Texture = baseAlbedoTex;
      if (slopeOverlayActive && slopeTex) {
        activeMap = slopeTex;
      } else if (roughnessOverlayActive && roughTex) {
        activeMap = roughTex;
      }

      // Remove previous mesh and clean up resources
      if (meshRef.current) {
        scene.remove(meshRef.current);
        if (meshRef.current.geometry) meshRef.current.geometry.dispose();
        if (meshRef.current.material) {
          if (Array.isArray(meshRef.current.material)) {
            meshRef.current.material.forEach(m => m.dispose());
          } else {
            meshRef.current.material.dispose();
          }
        }
        meshRef.current = null;
      }

      // High-precision physical material with true 3D vertex normals
      const terrainMaterial = propWireframe
        ? new THREE.MeshBasicMaterial({ color: 0x00b4d8, wireframe: true })
        : new THREE.MeshStandardMaterial({
            map: activeMap,
            roughness: 0.82,
            metalness: 0.08,
            flatShading: false,
          });

      const terrainMesh = new THREE.Mesh(geometry, terrainMaterial);
      terrainMesh.receiveShadow = true;
      terrainMesh.castShadow = true;
      meshRef.current = terrainMesh;
      scene.add(terrainMesh);
      isDataLoadedRef.current = true;

      // Handle GeoJSON Candidate Regions
      if (geoRes.status === 'fulfilled' && geoRes.value?.features) {
        const features = geoRes.value.features;
        geojsonFeaturesRef.current = features;
        console.log('✅ [CLPS NASA LRO] Loaded Candidate Regions:', features.map((f: any) => ({
          name: f.properties?.name,
          coords: f.geometry?.coordinates,
          mission: f.properties?.clps_mission,
        })));

        onLoadProgress?.(85, 'Positioning CLPS Landing Beacons...');
        renderSiteMarkers(features);
      }

      onLoadProgress?.(100, 'Ready');
      onLoaded?.();
    });

    return () => {
      isCancelled = true;
    };
  }, [isClpsMode, analysis, buildLegacyTerrain, onLoadProgress, onLoaded, renderSiteMarkers]);

  // Dynamic texture overlay swap without recreating geometry or reloading network assets
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh || !texturesRef.current.baseAlbedo) return;
    let activeMap = texturesRef.current.baseAlbedo;
    if (slopeOverlayActive && texturesRef.current.slope) {
      activeMap = texturesRef.current.slope;
    } else if (roughnessOverlayActive && texturesRef.current.roughness) {
      activeMap = texturesRef.current.roughness;
    }
    if (mesh.material instanceof THREE.MeshStandardMaterial) {
      mesh.material.map = activeMap;
      mesh.material.needsUpdate = true;
    }
  }, [slopeOverlayActive, roughnessOverlayActive]);

  // Dynamic wireframe toggle without recreating geometry
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh || !mesh.material) return;
    (mesh.material as any).wireframe = propWireframe;
    (mesh.material as any).needsUpdate = true;
  }, [propWireframe]);

  // Dynamic vertical exaggeration updates without reloading textures
  useEffect(() => {
    const mesh = meshRef.current;
    const dCanvas = offscreenDemCanvasRef.current;
    if (!mesh || !dCanvas) return;

    const geom = mesh.geometry;
    const pos = geom.attributes.position;
    const dCtx = dCanvas.getContext('2d');
    if (!dCtx) return;

    const dData = dCtx.getImageData(0, 0, dCanvas.width, dCanvas.height).data;
    const dw = dCanvas.width;
    const dh = dCanvas.height;
    const count = pos.count;
    const planeSize = 80;

    for (let i = 0; i < count; i++) {
      const vx = pos.getX(i);
      const vz = pos.getZ(i);
      const u = Math.max(0, Math.min(1, (vx + planeSize / 2) / planeSize));
      const v = Math.max(0, Math.min(1, (vz + planeSize / 2) / planeSize));
      const px = Math.min(dw - 1, Math.max(0, Math.floor(u * (dw - 1))));
      const py = Math.min(dh - 1, Math.max(0, Math.floor(v * (dh - 1))));
      const pIdx = (py * dw + px) * 4;
      const elevationNorm = dData[pIdx] / 255.0;
      pos.setY(i, (elevationNorm * 18.0 - 5.0) * (propExaggeration / 2.0));
    }
    pos.needsUpdate = true;
    geom.computeVertexNormals();

    if (geojsonFeaturesRef.current.length > 0) {
      renderSiteMarkers(geojsonFeaturesRef.current);
    }
  }, [propExaggeration, renderSiteMarkers]);

  // Re-highlight markers when selectedSite changes
  useEffect(() => {
    if (geojsonFeaturesRef.current.length > 0) {
      renderSiteMarkers(geojsonFeaturesRef.current);
    }
  }, [selectedSite, renderSiteMarkers]);

  // -------------------------------------------------------------
  // RAYCASTER HOVER & CLICK HANDLERS
  // -------------------------------------------------------------
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    const camera = cameraRef.current;
    const group = markersGroupRef.current;
    if (!container || !camera || !group) return;

    const rect = container.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    // Track drag distance to differentiate click vs orbit rotate
    if (isDraggingRef.current) {
      const dx = e.clientX - prevMouseRef.current.x;
      const dy = e.clientY - prevMouseRef.current.y;
      dragDistanceRef.current += Math.hypot(dx, dy);

      targetSphericalRef.current.theta -= dx * 0.006;
      targetSphericalRef.current.phi = Math.max(0.1, Math.min(Math.PI / 2.05, targetSphericalRef.current.phi - dy * 0.006));
      prevMouseRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    // Normalized device coordinates [-1, 1]
    mouseVecRef.current.x = (clientX / rect.width) * 2 - 1;
    mouseVecRef.current.y = -(clientY / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseVecRef.current, camera);
    const intersects = raycasterRef.current.intersectObjects(group.children, true);

    if (intersects.length > 0) {
      const hit = intersects[0].object as THREE.Mesh;
      const site = hit.userData?.site;
      if (site) {
        container.style.cursor = 'pointer';
        setHoveredSite(site);
        setTooltipPos({ x: clientX, y: clientY });
        return;
      }
    }

    container.style.cursor = 'default';
    setHoveredSite(null);
    setTooltipPos(null);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    dragDistanceRef.current = 0;
    prevMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = false;

    // Only process click if user wasn't actively dragging/orbiting the camera
    if (dragDistanceRef.current > 5) return;

    const container = containerRef.current;
    const camera = cameraRef.current;
    const group = markersGroupRef.current;
    if (!container || !camera) return;

    const rect = container.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    mouseVecRef.current.x = (clientX / rect.width) * 2 - 1;
    mouseVecRef.current.y = -(clientY / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseVecRef.current, camera);

    if (group) {
      const intersects = raycasterRef.current.intersectObjects(group.children, true);
      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh;
        const site = hit.userData?.site;
        const hx = hit.userData?.x ?? 0;
        const hz = hit.userData?.z ?? 0;

        if (site) {
          // Read actual pixel slope at this site
          const slope = sampleSlopeAt(hx, hz, site.properties?.base_slope_deg || 6.5);
          onSelectSite?.(site, slope);

          // Animate camera to focus on this marker
          cameraTargetPosRef.current = new THREE.Vector3(hx + 18, 22, hz + 22);
          cameraLookAtTargetRef.current = new THREE.Vector3(hx, 4, hz);
          return;
        }
      }
    }

    // Clicked empty space: deselect site and close side panel
    onDeselectSite?.();
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    targetSphericalRef.current.radius = Math.max(30, Math.min(240, targetSphericalRef.current.radius + e.deltaY * 0.08));
  };

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onWheel={handleWheel}
      className="relative w-full h-full overflow-hidden select-none bg-space-950"
    >
      {/* Hover Tooltip */}
      {hoveredSite && tooltipPos && (
        <div
          style={{
            left: `${tooltipPos.x + 18}px`,
            top: `${tooltipPos.y - 12}px`,
          }}
          className="pointer-events-none absolute z-50 p-2.5 rounded-lg bg-space-900/95 border border-isro-cyan/60 shadow-2xl backdrop-blur-md font-mono text-xs text-white max-w-xs animate-fadeIn"
        >
          <div className="flex items-center gap-1.5 text-isro-cyan font-bold uppercase text-[11px] mb-1">
            <MapPin className="w-3.5 h-3.5" />
            <span>{hoveredSite.properties?.name}</span>
          </div>
          <div className="text-[10px] text-zinc-300 space-y-0.5">
            <div>Coords: {Math.abs(hoveredSite.geometry?.coordinates?.[1] || 0).toFixed(2)}°S, {Math.abs(hoveredSite.geometry?.coordinates?.[0] || 0).toFixed(2)}°{hoveredSite.geometry?.coordinates?.[0] < 0 ? 'W' : 'E'}</div>
            <div className="text-amber-300 font-semibold">{hoveredSite.properties?.clps_mission}</div>
            <div className="text-emerald-400">Base Slope: ~{hoveredSite.properties?.base_slope_deg}° • Illum: {hoveredSite.properties?.lighting_pct}%</div>
            <div className="text-[9px] text-zinc-500 pt-1">Click marker to inspect flight safety telemetry</div>
          </div>
        </div>
      )}

      {/* Floating 3D Navigation Compass / Reset Button */}
      <div className="absolute bottom-4 right-4 z-20 flex items-center space-x-2">
        <button
          onClick={() => {
            targetSphericalRef.current = { radius: 72, theta: Math.PI / 4, phi: Math.PI / 3.0 };
            lookAtTargetRef.current.set(0, 0, 0);
            cameraTargetPosRef.current = null;
            cameraLookAtTargetRef.current = null;
          }}
          className="p-2 rounded-lg bg-space-900/80 hover:bg-space-800 border border-white/10 text-zinc-300 hover:text-white transition-all shadow-lg backdrop-blur-md flex items-center gap-1.5 text-xs font-mono"
          title="Reset Orbit Camera"
        >
          <RotateCcw className="w-3.5 h-3.5 text-isro-cyan" />
          <span>Reset Camera</span>
        </button>
      </div>
    </div>
  );
};

export const Terrain3DViewer = React.memo(Terrain3DViewerComponent);
