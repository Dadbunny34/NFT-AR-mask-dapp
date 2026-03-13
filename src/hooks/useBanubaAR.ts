"use client";

import { useEffect, useRef, useState, useCallback } from "react";

/**
 * useBanubaAR v4
 *
 * Fixed from v3:
 * - faceData and isTracking stored as REFS (not state) — zero re-renders per frame
 * - Render loop reads from refs, not React state dependencies
 * - Watchdog restarts player if face events stop for 3 seconds
 * - Clean shutdown with no dangling event listeners
 */

export type BanubaStatus = "idle" | "loading" | "ready" | "error";

export interface FaceData {
  position: { x: number; y: number; z: number };
  rotation: { pitch: number; yaw: number; roll: number };
  scale: number;
}

const BANUBA_TOKEN = process.env.NEXT_PUBLIC_BANUBA_CLIENT_TOKEN || "";

export function useBanubaAR(containerRef: React.RefObject<HTMLDivElement | null>) {
  const [status, setStatus] = useState<BanubaStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  // High-frequency data as REFS — no re-renders
  const faceDataRef = useRef<FaceData | null>(null);
  const isTrackingRef = useRef(false);

  const playerRef = useRef<any>(null);
  const webcamRef = useRef<any>(null);
  const lastFaceEventRef = useRef<number>(0);
  const watchdogRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cleanedUpRef = useRef(false);

  // Getter for components to read current face data
  const getFaceData = useCallback(() => faceDataRef.current, []);
  const getIsTracking = useCallback(() => isTrackingRef.current, []);

  useEffect(() => {
    if (!containerRef.current || !BANUBA_TOKEN) {
      if (!BANUBA_TOKEN) {
        setError("No Banuba client token configured");
        setStatus("error");
      }
      return;
    }

    cleanedUpRef.current = false;
    let mounted = true;

    async function init() {
      try {
        setStatus("loading");
        setError(null);

        const banuba = await import("@banuba/webar") as any;
        const { Player, Module, Webcam, Dom } = banuba;

        if (!mounted || cleanedUpRef.current) return;

        const container = containerRef.current;
        if (!container) return;

        // Create player
        const player = await Player.create({
          clientToken: BANUBA_TOKEN,
          locateFile: Module.locateFile,
        });

        if (!mounted || cleanedUpRef.current) {
          player.destroy?.();
          return;
        }

        playerRef.current = player;

        // Dom module renders camera feed
        await player.addModule(new Dom(container));

        // Load face tracking module
        const faceTracker = new Module("face_tracker");
        await player.addModule(faceTracker);

        if (!mounted || cleanedUpRef.current) return;

        // Face data event handler — writes to REF, no setState
        const onFaceData = (data: any) => {
          if (cleanedUpRef.current) return;
          lastFaceEventRef.current = Date.now();

          if (data && data.faces && data.faces.length > 0) {
            const face = data.faces[0];
            faceDataRef.current = {
              position: {
                x: face.translation?.[0] || 0,
                y: face.translation?.[1] || 0,
                z: face.translation?.[2] || 0,
              },
              rotation: {
                pitch: face.rotation?.[0] || 0,
                yaw: face.rotation?.[1] || 0,
                roll: face.rotation?.[2] || 0,
              },
              scale: face.scale || 1,
            };
            if (!isTrackingRef.current) {
              isTrackingRef.current = true;
            }
          } else {
            isTrackingRef.current = false;
            faceDataRef.current = null;
          }
        };

        player.addEventListener("facedata", onFaceData);
        player.addEventListener("framedata", onFaceData); // Some SDK versions use framedata

        // Open webcam and start
        const webcam = new Webcam();
        webcamRef.current = webcam;
        player.use(webcam);
        await player.play();

        if (!mounted || cleanedUpRef.current) return;
        lastFaceEventRef.current = Date.now();
        setStatus("ready");

        // Watchdog: restart if no face events for 3 seconds
        watchdogRef.current = setInterval(() => {
          if (cleanedUpRef.current) return;
          const elapsed = Date.now() - lastFaceEventRef.current;
          if (elapsed > 3000 && playerRef.current) {
            console.warn("[Banuba] No face events for 3s — restarting player");
            try {
              playerRef.current.play();
              lastFaceEventRef.current = Date.now(); // Reset to avoid rapid restarts
            } catch (e) {
              console.error("[Banuba] Watchdog restart failed:", e);
            }
          }
        }, 2000);

      } catch (err: any) {
        if (mounted && !cleanedUpRef.current) {
          console.error("[Banuba] Init error:", err);
          setError(err.message || "Banuba initialization failed");
          setStatus("error");
        }
      }
    }

    init();

    return () => {
      mounted = false;
      cleanedUpRef.current = true;

      if (watchdogRef.current) {
        clearInterval(watchdogRef.current);
        watchdogRef.current = null;
      }

      if (playerRef.current) {
        try {
          playerRef.current.pause();
          playerRef.current.destroy?.();
        } catch {}
        playerRef.current = null;
      }

      if (webcamRef.current) {
        try { webcamRef.current.stop?.(); } catch {}
        webcamRef.current = null;
      }

      faceDataRef.current = null;
      isTrackingRef.current = false;
    };
  }, [containerRef]);

  return {
    status,
    error,
    getFaceData,
    getIsTracking,
    faceDataRef,
    isTrackingRef,
  };
}
