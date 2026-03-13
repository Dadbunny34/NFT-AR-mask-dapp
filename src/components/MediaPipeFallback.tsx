"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

/**
 * MediaPipeFallback v3
 *
 * Changes from v2:
 * - Uses landmark 10 (forehead center) as head anchor
 * - Derives head rotation from eye-to-eye and nose vectors
 * - Smooth lerp on position + rotation to avoid jitter
 * - Ref-based render loop (no state deps) matching BanubaAR v4 pattern
 * - Falls back to landmark-based tracking when transformation matrix unavailable
 */

interface MediaPipeFallbackProps {
  glbUrl?: string;
  className?: string;
}

// Key MediaPipe FaceLandmarker landmark indices
const LM = {
  FOREHEAD: 10,
  NOSE_TIP: 1,
  LEFT_EYE: 33,
  RIGHT_EYE: 263,
  CHIN: 152,
};

export default function MediaPipeFallback({ glbUrl, className }: MediaPipeFallbackProps) {
  const videoRef = useRef<HTMLVideoElement>(null!);
  const canvasRef = useRef<HTMLCanvasElement>(null!);
  const overlayRef = useRef<HTMLCanvasElement>(null!);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const rafRef = useRef<number>(0);

  const targetPosRef = useRef(new THREE.Vector3());
  const targetRotRef = useRef(new THREE.Euler());
  const targetScaleRef = useRef(1);
  const trackingRef = useRef(false);

  const faceLandmarkerRef = useRef<any>(null);
  const lastVideoTimeRef = useRef(-1);

  // Initialize Three.js scene — ONCE
  useEffect(() => {
    const canvas = overlayRef.current;
    if (!canvas) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    camera.position.z = 3;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    rendererRef.current = renderer;

    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambient);
    const directional = new THREE.DirectionalLight(0xffffff, 0.8);
    directional.position.set(0, 1, 2);
    scene.add(directional);

    const group = new THREE.Group();
    group.visible = false;
    scene.add(group);
    modelGroupRef.current = group;

    const onResize = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      rendererRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
    };
  }, []);

  // Load 3D model
  useEffect(() => {
    if (!glbUrl || !modelGroupRef.current) return;
    const loader = new GLTFLoader();
    loader.load(
      glbUrl,
      (gltf) => {
        const group = modelGroupRef.current;
        if (!group) return;
        while (group.children.length) group.remove(group.children[0]);
        const model = gltf.scene;
        model.scale.set(0.4, 0.4, 0.4);
        group.add(model);
        console.log("[MediaPipeFallback] Model loaded:", glbUrl);
      },
      undefined,
      (err) => console.error("[MediaPipeFallback] Model load error:", err)
    );
  }, [glbUrl]);

  // Stable render loop with smooth lerp — ONCE
  useEffect(() => {
    let running = true;
    const lerpFactor = 0.3;

    function renderLoop() {
      if (!running) return;
      const renderer = rendererRef.current;
      const scene = sceneRef.current;
      const camera = cameraRef.current;
      const group = modelGroupRef.current;

      if (renderer && scene && camera && group) {
        if (trackingRef.current) {
          group.visible = true;
          group.position.lerp(targetPosRef.current, lerpFactor);
          group.rotation.x += (targetRotRef.current.x - group.rotation.x) * lerpFactor;
          group.rotation.y += (targetRotRef.current.y - group.rotation.y) * lerpFactor;
          group.rotation.z += (targetRotRef.current.z - group.rotation.z) * lerpFactor;
          const s = group.scale.x + (targetScaleRef.current - group.scale.x) * lerpFactor;
          group.scale.setScalar(s);
        } else {
          group.visible = false;
        }
        renderer.render(scene, camera);
      }
      rafRef.current = requestAnimationFrame(renderLoop);
    }

    rafRef.current = requestAnimationFrame(renderLoop);
    return () => {
      running = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Initialize MediaPipe + camera
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const vision = await import("@mediapipe/tasks-vision");
        const { FaceLandmarker, FilesetResolver } = vision;

        const filesetResolver = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );

        const faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numFaces: 1,
          outputFacialTransformationMatrixes: true,
          outputFaceBlendshapes: false,
        });

        if (cancelled) return;
        faceLandmarkerRef.current = faceLandmarker;
        console.log("[MediaPipeFallback] FaceLandmarker ready");

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: 640, height: 480 },
        });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }

        const video = videoRef.current;
        if (video) { video.srcObject = stream; video.play(); }
        detectLoop();
      } catch (err) {
        console.error("[MediaPipeFallback] Init error:", err);
      }
    }

    function detectLoop() {
      if (cancelled) return;
      const video = videoRef.current;
      const fl = faceLandmarkerRef.current;

      if (video && fl && video.readyState >= 2 && video.currentTime !== lastVideoTimeRef.current) {
        lastVideoTimeRef.current = video.currentTime;
        const results = fl.detectForVideo(video, performance.now());

        if (results?.faceLandmarks?.length > 0) {
          trackingRef.current = true;
          let usedMatrix = false;

          // Strategy 1: Transformation matrix (best accuracy)
          if (results.facialTransformationMatrixes?.length > 0) {
            const matrix = results.facialTransformationMatrixes[0];
            if (matrix?.data?.length === 16) {
              const m = new THREE.Matrix4();
              m.fromArray(matrix.data);
              const pos = new THREE.Vector3();
              const quat = new THREE.Quaternion();
              const scl = new THREE.Vector3();
              m.decompose(pos, quat, scl);
              targetPosRef.current.set(pos.x * 0.01, -pos.y * 0.01, -pos.z * 0.01 + 2);
              const euler = new THREE.Euler().setFromQuaternion(quat, "XYZ");
              targetRotRef.current.set(euler.x, -euler.y, -euler.z);
              targetScaleRef.current = 0.4;
              usedMatrix = true;
            }
          }

          // Strategy 2: Landmark 10 (forehead center) — fallback
          if (!usedMatrix) {
            const lm = results.faceLandmarks[0];
            const head = lm[LM.FOREHEAD];

            // Convert normalized coords (0-1) to scene space
            targetPosRef.current.set(
              (head.x - 0.5) * 4,
              -(head.y - 0.5) * 3,
              -head.z * 2 + 1
            );

            // Derive rotation from eye/nose vectors
            const le = lm[LM.LEFT_EYE];
            const re = lm[LM.RIGHT_EYE];
            const chin = lm[LM.CHIN];

            const eyeDx = re.x - le.x;
            const eyeDz = (re.z || 0) - (le.z || 0);
            const yaw = Math.atan2(eyeDz, eyeDx);

            const htcDy = chin.y - head.y;
            const htcDz = (chin.z || 0) - (head.z || 0);
            const pitch = Math.atan2(htcDz, htcDy);

            const roll = Math.atan2(re.y - le.y, eyeDx);

            targetRotRef.current.set(pitch, yaw, -roll);

            // Scale from inter-eye distance
            const faceW = Math.sqrt(Math.pow(eyeDx, 2) + Math.pow(re.y - le.y, 2));
            targetScaleRef.current = faceW * 3;
          }
        } else {
          trackingRef.current = false;
        }
      }
      requestAnimationFrame(detectLoop);
    }

    init();
    return () => {
      cancelled = true;
      const video = videoRef.current;
      if (video?.srcObject) (video.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      faceLandmarkerRef.current?.close();
    };
  }, []);

  // Draw mirrored video background
  useEffect(() => {
    let running = true;
    function drawVideo() {
      if (!running) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && video.readyState >= 2) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.save();
          ctx.scale(-1, 1);
          ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
          ctx.restore();
        }
      }
      requestAnimationFrame(drawVideo);
    }
    drawVideo();
    return () => { running = false; };
  }, []);

  return (
    <div className={"relative w-full h-full " + (className || "")}>
      <video ref={videoRef} className="hidden" playsInline muted autoPlay />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ zIndex: 1 }}
      />
      <canvas
        ref={overlayRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 2 }}
      />
      <div className="absolute bottom-4 left-4 z-10 bg-black/60 text-white text-xs px-3 py-1 rounded-full">
        MediaPipe Face Mesh (Fallback)
      </div>
    </div>
  );
}
