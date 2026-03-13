"use client";

import { useRef, useEffect, useMemo, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

interface FaceTransform {
  position: { x: number; y: number; z: number };
  rotation: { pitch: number; yaw: number; roll: number };
  scale: number;
  blendShapes: {
    mouthOpen: number;
    eyeBlinkLeft: number;
    eyeBlinkRight: number;
    smile: number;
  };
  landmarks: any[];
  detected: boolean;
}

/**
 * Normalize a GLB model so its bounding box is centered and
 * fits within a 1×1×1 cube. This makes all models predictable
 * regardless of how they were exported.
 */
function normalizeModel(scene: THREE.Object3D): THREE.Object3D {
  const box = new THREE.Box3().setFromObject(scene);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);

  // Center the model at origin
  scene.position.sub(center);

  // Wrap in a group so we can scale uniformly
  const wrapper = new THREE.Group();
  wrapper.add(scene);
  if (maxDim > 0) {
    wrapper.scale.setScalar(1 / maxDim);
  }

  return wrapper;
}

function MaskModel({
  modelUrl,
  faceTransform,
  videoAspect,
  maskOffset = { x: 0, y: 0, z: 0 },
  maskScale = 1.0,
}: {
  modelUrl: string;
  faceTransform: FaceTransform;
  videoAspect: number;
  maskOffset?: { x: number; y: number; z: number };
  maskScale?: number;
}) {
  const { scene } = useGLTF(modelUrl);
  const { camera } = useThree();
  const meshRef = useRef<THREE.Object3D>(null!);

  // Smoothing refs
  const smoothPos = useRef(new THREE.Vector3(0, 0, 0));
  const smoothRot = useRef(new THREE.Vector3(0, 0, 0));
  const smoothScale = useRef(0.001);
  const wasDetected = useRef(false);

  const model = useMemo(() => {
    const cloned = scene.clone(true);
    return normalizeModel(cloned);
  }, [scene]);

  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.visible = false;
    }
  }, [model]);

  useFrame(() => {
    if (!meshRef.current) return;

    const { position, rotation, scale, blendShapes, detected } = faceTransform;

    if (!detected) {
      // Fade out smoothly
      smoothScale.current *= 0.85;
      if (smoothScale.current < 0.01) {
        meshRef.current.visible = false;
      }
      meshRef.current.scale.setScalar(smoothScale.current);
      wasDetected.current = false;
      return;
    }

    meshRef.current.visible = true;

    // ──────────────────────────────────────────────
    // COORDINATE SYSTEM:
    //
    // MediaPipe landmarks: x ∈ [0,1] (left→right in image), y ∈ [0,1] (top→bottom)
    // The video element uses CSS scaleX(-1) to mirror for selfie view.
    // The Canvas overlay ALSO has scaleX(-1) applied via CSS so they match.
    //
    // Three.js camera is set up with perspective projection.
    // We use a fixed camera distance and calculate the visible area to match.
    // ──────────────────────────────────────────────

    const cam = camera as THREE.PerspectiveCamera;
    const camDist = 2; // camera at z=2
    const fov = cam.fov * (Math.PI / 180);
    const visibleHeight = 2 * Math.tan(fov / 2) * camDist;
    const canvasAspect = cam.aspect;

    // The video feed has its own aspect ratio (e.g., 4:3 = 1.333).
    // The canvas may be a different aspect (e.g., 9:20 portrait = 0.45).
    // object-cover on the video means it crops to fill.
    // We need to figure out what portion of the video is visible
    // and scale our coordinate mapping accordingly.

    // object-cover: scale to fill, then crop overflow
    const videoVisibleFractionX = Math.min(1, canvasAspect / videoAspect);
    const videoVisibleFractionY = Math.min(1, videoAspect / canvasAspect);

    // The center of the video is always visible; edges may be cropped
    const videoOffsetX = (1 - videoVisibleFractionX) / 2;
    const videoOffsetY = (1 - videoVisibleFractionY) / 2;

    // Map face position from video [0,1] to canvas three.js coords
    const visibleWidth = visibleHeight * canvasAspect;

    const normX = (position.x - videoOffsetX) / videoVisibleFractionX; // 0..1 within visible area
    const normY = (position.y - videoOffsetY) / videoVisibleFractionY;

    // Three.js: x right positive, y up positive
    // Video: x right, y down
    // We do NOT flip X here because the canvas has CSS scaleX(-1) just like the video
    const targetX = (normX - 0.5) * visibleWidth + maskOffset.x;
    const targetY = (0.5 - normY) * visibleHeight + maskOffset.y;
    const targetZ = (position.z || 0) * -2 + maskOffset.z;

    // ──────────────────────────────────────────────
    // ROTATION
    // Since both video and canvas are CSS-mirrored, yaw and roll
    // work naturally (no extra flip needed).
    // ──────────────────────────────────────────────
    const targetPitch = rotation.pitch;
    const targetYaw = rotation.yaw;
    const targetRoll = rotation.roll;

    // ──────────────────────────────────────────────
    // SCALE
    // `scale` from useFaceTracking is faceH * 3.5.
    // faceH is the vertical face fraction of the frame.
    // In visible canvas terms: faceH * visibleHeight
    // Our model is normalized to 1 unit. We want it ~2.2× the
    // face height (masks are bigger than measured landmarks).
    // ──────────────────────────────────────────────
    const faceH = scale / 3.5; // undo the *3.5 from the hook
    const targetScale = faceH * visibleHeight * maskScale * 2.2;

    // Smoothing — snap on first detection, lerp after
    const lerpFactor = wasDetected.current ? 0.4 : 1.0;

    smoothPos.current.x += (targetX - smoothPos.current.x) * lerpFactor;
    smoothPos.current.y += (targetY - smoothPos.current.y) * lerpFactor;
    smoothPos.current.z += (targetZ - smoothPos.current.z) * lerpFactor;

    smoothRot.current.x += (targetPitch - smoothRot.current.x) * lerpFactor;
    smoothRot.current.y += (targetYaw - smoothRot.current.y) * lerpFactor;
    smoothRot.current.z += (targetRoll - smoothRot.current.z) * lerpFactor;

    smoothScale.current += (targetScale - smoothScale.current) * lerpFactor;

    meshRef.current.position.copy(smoothPos.current);
    meshRef.current.rotation.set(
      smoothRot.current.x,
      smoothRot.current.y,
      smoothRot.current.z
    );
    meshRef.current.scale.setScalar(Math.max(0.001, smoothScale.current));

    wasDetected.current = true;

    // ──────────────────────────────────────────────
    // BLEND SHAPES
    // ──────────────────────────────────────────────
    meshRef.current.traverse((child) => {
      if (
        child instanceof THREE.Mesh &&
        child.morphTargetInfluences &&
        child.morphTargetDictionary
      ) {
        const dict = child.morphTargetDictionary;
        const influences = child.morphTargetInfluences;

        const mappings: Record<string, string[]> = {
          mouthOpen: ["jawOpen", "mouthOpen", "mouth_open", "Jaw_Open", "MouthOpen"],
          eyeBlinkLeft: ["eyeBlinkLeft", "eyeBlink_L", "eye_blink_l", "EyeBlink_L", "EyeBlinkLeft"],
          eyeBlinkRight: ["eyeBlinkRight", "eyeBlink_R", "eye_blink_r", "EyeBlink_R", "EyeBlinkRight"],
          smile: ["mouthSmile", "smile", "mouth_smile", "Mouth_Smile", "MouthSmile"],
        };

        for (const [bsName, targetNames] of Object.entries(mappings)) {
          const weight = blendShapes[bsName as keyof typeof blendShapes];
          for (const targetName of targetNames) {
            if (dict[targetName] !== undefined) {
              influences[dict[targetName]] = weight;
              break;
            }
          }
        }
      }
    });
  });

  return <primitive ref={meshRef} object={model} />;
}

interface FaceMaskOverlayProps {
  modelUrl: string;
  faceTransform: FaceTransform;
  videoWidth?: number;
  videoHeight?: number;
  className?: string;
  maskOffset?: { x: number; y: number; z: number };
  maskScale?: number;
}

/**
 * Transparent Three.js Canvas overlay that renders a GLB mask
 * positioned on the tracked face.
 *
 * KEY: The canvas has the same CSS scaleX(-1) as the video
 * so the mirror behavior matches exactly.
 */
export default function FaceMaskOverlay({
  modelUrl,
  faceTransform,
  videoWidth = 640,
  videoHeight = 480,
  className = "",
  maskOffset,
  maskScale,
}: FaceMaskOverlayProps) {
  const videoAspect = videoWidth / videoHeight;

  return (
    <div
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{
        zIndex: 10,
        // CRITICAL: Mirror the canvas the same way the video is mirrored
        transform: "scaleX(-1)",
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 2], fov: 50, near: 0.01, far: 100 }}
        gl={{ alpha: true, antialias: true, preserveDrawingBuffer: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.9} />
        <directionalLight position={[0, 2, 3]} intensity={0.5} />
        <directionalLight position={[0, -1, 2]} intensity={0.2} />
        <Suspense fallback={null}>
          <MaskModel
            modelUrl={modelUrl}
            faceTransform={faceTransform}
            videoAspect={videoAspect}
            maskOffset={maskOffset}
            maskScale={maskScale}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
