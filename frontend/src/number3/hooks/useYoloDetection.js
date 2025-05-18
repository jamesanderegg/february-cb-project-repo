// hooks/useYoloDetection.js
import { useEffect, useRef } from "react";

const YOLO_INTERVAL_MS = 400;

export default function useYoloDetection({
    liveStateRef,
    recordingBufferRef,
    isRecordingActiveRef,
    getCameraCanvas, // function that returns canvas or image element
}) {
    const lastSentRef = useRef(0);
    const pendingResultsRef = useRef({});

    useEffect(() => {
        const loop = () => {
            const now = performance.now();

            if (now - lastSentRef.current >= YOLO_INTERVAL_MS) {
                lastSentRef.current = now;

                const canvas = getCameraCanvas();
                if (!canvas || !canvas.toBlob) {
                    console.warn("❌ No valid canvas from getCameraCanvas()");
                    return;
                }

                canvas.toBlob(async (blob) => {
                    if (!blob) return;

                    const frame_number = liveStateRef.current?.frame_number;
                    const formData = new FormData();
                    formData.append("image", blob, `frame_${frame_number}.png`);

                    try {
                        console.log("📤 Sending image to YOLO backend...");

                        const res = await fetch("http://localhost:5001/yolo_predict", {
                            method: "POST",
                            body: formData,
                        });

                        const result = await res.json(); // expects { detectedObjects: [...] }
                        console.log("✅ YOLO response:", result);
                        if (frame_number != null && result?.detectedObjects) {
                            // Update live state
                            liveStateRef.current.detectedObjects = result.detectedObjects;

                            // Update replay frame if recording
                            if (isRecordingActiveRef?.current && Array.isArray(recordingBufferRef.current)) {
                                const replayFrame = recordingBufferRef.current.find(
                                    (f) => f.frame_number === frame_number
                                );
                                if (replayFrame) {
                                    replayFrame.detectedObjects = result.detectedObjects;
                                }
                            }
                        }
                    } catch (err) {
                        console.error("YOLO backend error:", err);
                    }
                }, "image/png");
            }

            requestAnimationFrame(loop);
        };

        const id = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(id);
    }, [liveStateRef, recordingBufferRef, isRecordingActiveRef, getCameraCanvas]);
}
