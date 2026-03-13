"use client";

import { useState, useEffect, useRef, useCallback } from "react";

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

const defaultTransform: FaceTransform = {
  position: { x: 0.5, y: 0.5, z: 0 },
  rotation: { pitch: 0, yaw: 0, roll: 0 },
  scale: 1,
  blendShapes: {
    mouthOpen: 0,
    eyeBlinkLeft: 0,
    eyeBlinkRight: 0,
    smile: 0,
  },
  landmarks: [],
  detected: false,
};

interface UseFaceTrackingOptions {
  enabled?: boolean;
}

interface UseFaceTrackingResult {
  ready: boolean;
  error: string | null;
  faceTransform: FaceTransform;
  videoRef: React.RefObject<HTMLVideoElement>;
  videoWidth: number;
  videoHeight: number;
}

/**
 * MediaPipe Face Landmarker hook — provides real face geometry
 * computed from 478 3D landmarks.
 *
 * Usage:
 *   const { ready, faceTransform, videoRef, error, videoWidth, videoHeight } =
 *     useFaceTracking({ enabled: true });
 *   <video ref={videoRef} ... />
 *
 * The hook handles camera setup, MediaPipe loading, and per-frame detection.
 *
 * Coordinate system:
 *   x ∈ [0, 1] — left (0) to right (1) in the RAW camera image
 *   y ∈ [0, 1] — top (0) to bottom (1)
 *   z — depth from camera (negative = closer)
 *
 * Rotation:
 *   pitch — looking up/down, radians
 *   yaw   — looking left/right, radians
 *   roll  — head tilt, radians
 *
 * Scale:
 *   Approximate vertical face size as fraction of frame * 3.5
 */
export function useFaceTracking({
  enabled = true,
}: UseFaceTrackingOptions = {}): UseFaceTrackingResult {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [faceTransform, setFaceTransform] =
    useState<FaceTransform>(defaultTransform);
  const [videoWidth, setVideoWidth] = useState(640);
  const [videoHeight, setVideoHeight] = useState(480);

  const videoRef = useRef<HTMLVideoElement>(null!);
  const landmarkerRef = useRef<any>(null);
  const rafRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Start camera
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            if (videoRef.current) {
              const vw = videoRef.current.videoWidth;
              const vh = videoRef.current.videoHeight;
              setVideoWidth(vw || 640);
              setVideoHeight(vh || 480);
            }
          };
          await videoRef.current.play();
        }
      } catch (err: any) {
        if (!cancelled) {
          setError("Camera error: " + (err.message || String(err)));
        }
      }
    }

    startCamera();

    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [enabled]);

  // Load MediaPipe Face Landmarker
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    async function init() {
      try {
        const vision = await import("@mediapipe/tasks-vision");
        const { FaceLandmarker, FilesetResolver } = vision;

        const filesetResolver = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );

        const landmarker = await FaceLandmarker.createFromOptions(
          filesetResolver,
          {
            baseOptions: {
              modelAssetPath:
                "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
              delegate: "GPU",
            },
            runningMode: "VIDEO",
            numFaces: 1,
            outputFaceBlendshapes: true,
            outputFacialTransformationMatrixes: true,
            minFaceDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5,
          }
        );

        if (!cancelled) {
          landmarkerRef.current = landmarker;
          setReady(true);
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error("MediaPipe init error:", err);
          setError(err.message || "Failed to load MediaPipe");
        }
      }
    }

    init();

    return () => {
      cancelled = true;
      if (landmarkerRef.current) {
        landmarkerRef.current.close();
        landmarkerRef.current = null;
      }
    };
  }, [enabled]);

  // Frame processing loop
  const processFrame = useCallback(() => {
    const video = videoRef.current;
    const landmarker = landmarkerRef.current;

    if (!video || !landmarker || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(processFrame);
      return;
    }

    try {
      const now = performance.now();
      const results = landmarker.detectForVideo(video, now);

      if (results.faceLandmarks && results.faceLandmarks.length > 0) {
        const landmarks = results.faceLandmarks[0];

        // ──────────────────────────────────────────────
        // KEY LANDMARKS
        // ──────────────────────────────────────────────
        const nose = landmarks[1]; // nose tip
        const leftEye = landmarks[133]; // left eye inner corner
        const rightEye = landmarks[362]; // right eye inner corner
        const chin = landmarks[152];
        const forehead = landmarks[10];
        const noseBridge = landmarks[6];

        // ──────────────────────────────────────────────
        // FACE POSITION — center between eyes, vertically centered
        // ──────────────────────────────────────────────
        const faceCenterX = (leftEye.x + rightEye.x) / 2;
        const faceCenterY = (forehead.y + chin.y) / 2;
        const faceCenterZ = (leftEye.z + rightEye.z + nose.z) / 3;

        // ──────────────────────────────────────────────
        // FACE SIZE — vertical span (forehead to chin)
        // ──────────────────────────────────────────────
        const faceH = Math.abs(chin.y - forehead.y);

        // ──────────────────────────────────────────────
        // ROTATION — prefer the transformation matrix from
        // MediaPipe when available (much more accurate),
        // fall back to landmark-based estimation
        // ──────────────────────────────────────────────

        // Landmark-based rotation (fallback)
        const eyeDx = rightEye.x - leftEye.x;
        const eyeDy = rightEye.y - leftEye.y;
        const eyeDz = rightEye.z - leftEye.z;
        const eyeWidth = Math.sqrt(eyeDx * eyeDx + eyeDz * eyeDz);

        const lmRoll = Math.atan2(eyeDy, eyeDx);

        const eyeDepthDiff = (leftEye.z - rightEye.z) / (eyeWidth || 0.001);
        const eyeMidX = (leftEye.x + rightEye.x) / 2;
        const noseOffsetX = (nose.x - eyeMidX) / (eyeWidth || 0.001);
        const lmYaw = Math.atan2(
          eyeDepthDiff * 0.7 + noseOffsetX * 1.2,
          1
        );

        const noseVert = nose.y - noseBridge.y;
        const noseDepth = noseBridge.z - nose.z;
        const lmPitch =
          Math.atan2(noseVert - faceH * 0.18, noseDepth + 0.01) - 0.25;

        let finalPitch = lmPitch;
        let finalYaw = lmYaw;
        let finalRoll = lmRoll;

        // Try transformation matrix (MediaPipe outputs 4x4 column-major)
        if (
          results.facialTransformationMatrixes &&
          results.facialTransformationMatrixes.length > 0
        ) {
          try {
            const matrix = results.facialTransformationMatrixes[0];
            const m = matrix.data || matrix;
            if (m && m.length >= 16) {
              // Column-major 4x4 rotation extraction
              // R = | m[0] m[4] m[8]  |
              //     | m[1] m[5] m[9]  |
              //     | m[2] m[6] m[10] |
              finalPitch = Math.atan2(m[9], m[10]);
              finalYaw = Math.atan2(
                -m[8],
                Math.sqrt(m[9] * m[9] + m[10] * m[10])
              );
              finalRoll = Math.atan2(m[4], m[0]);
            }
          } catch {
            // Use landmark-based values (already set)
          }
        }

        // ──────────────────────────────────────────────
        // BLEND SHAPES
        // ──────────────────────────────────────────────
        let mouthOpen = 0;
        let eyeBlinkLeft = 0;
        let eyeBlinkRight = 0;
        let smile = 0;

        if (
          results.faceBlendshapes &&
          results.faceBlendshapes.length > 0
        ) {
          const bs = results.faceBlendshapes[0].categories;
          const bsMap: Record<string, number> = {};
          for (const cat of bs) {
            bsMap[cat.categoryName] = cat.score;
          }

          mouthOpen = Math.min(1, (bsMap["jawOpen"] || 0) * 1.5);
          eyeBlinkLeft = bsMap["eyeBlinkLeft"] || 0;
          eyeBlinkRight = bsMap["eyeBlinkRight"] || 0;
          smile =
            ((bsMap["mouthSmileLeft"] || 0) +
              (bsMap["mouthSmileRight"] || 0)) /
            2;
        } else {
          // Fallback: estimate from landmarks
          const upperLip = landmarks[13];
          const lowerLip = landmarks[14];
          const lipGap = Math.abs(lowerLip.y - upperLip.y);
          mouthOpen = Math.min(1, lipGap / (faceH * 0.15));

          const leftEyeTop = landmarks[159];
          const leftEyeBottom = landmarks[145];
          const leftEyeGap = Math.abs(leftEyeTop.y - leftEyeBottom.y);
          eyeBlinkLeft =
            1 - Math.min(1, leftEyeGap / (faceH * 0.045));

          const rightEyeTop = landmarks[386];
          const rightEyeBottom = landmarks[374];
          const rightEyeGap = Math.abs(rightEyeTop.y - rightEyeBottom.y);
          eyeBlinkRight =
            1 - Math.min(1, rightEyeGap / (faceH * 0.045));

          const mouthLeft = landmarks[61];
          const mouthRight = landmarks[291];
          const mouthWidth = Math.abs(mouthRight.x - mouthLeft.x);
          smile = Math.min(
            1,
            Math.max(0, mouthWidth / (eyeWidth || 0.01) - 0.8)
          );
        }

        setFaceTransform({
          position: {
            x: faceCenterX,
            y: faceCenterY,
            z: faceCenterZ,
          },
          rotation: {
            pitch: finalPitch,
            yaw: finalYaw,
            roll: finalRoll,
          },
          scale: faceH * 3.5,
          blendShapes: {
            mouthOpen,
            eyeBlinkLeft,
            eyeBlinkRight,
            smile,
          },
          landmarks,
          detected: true,
        });
      } else {
        setFaceTransform((prev) => ({
          ...prev,
          detected: false,
        }));
      }
    } catch (err: any) {
      console.warn("Face tracking frame error:", err.message);
    }

    rafRef.current = requestAnimationFrame(processFrame);
  }, []);

  // Start/stop tracking loop
  useEffect(() => {
    if (!enabled || !ready) return;

    rafRef.current = requestAnimationFrame(processFrame);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [enabled, ready, processFrame]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, []);

  return { ready, error, faceTransform, videoRef, videoWidth, videoHeight };
}
