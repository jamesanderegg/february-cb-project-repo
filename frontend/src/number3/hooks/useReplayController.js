import { useState, useEffect, useRef, useCallback } from 'react';
import { socket } from '../controls/socket.js';
import { movableModels } from "../scene/ModelFunctions/ImportModels.js";

const COLAB_API_URL = 'http://localhost:5001';
const isLoading = { current: false };

export function useReplayController(liveStateRef,
  replayStepTriggerRef,
  controlMode,
  robotPositionRef,
  robotRotationRef,
  setControlMode,
  modelPositionsRef, targetObject, setReplayPositions) {
  const [replays, setReplays] = useState([]);
  const [selectedReplay, setSelectedReplay] = useState('');
  const [isReplayPlaying, setIsReplayPlaying] = useState(false);
  const [replayFilename, setReplayFilename] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const recordingBufferRef = useRef([]);
  const isRecordingActiveRef = useRef(false);
  const currentActionRef = useRef([]);

  const replayFrameQueue = useRef([]);
  const replayFrameIndex = useRef(0);
  const replayTimeoutRef = useRef(null);
  const accumulatedTimeRef = useRef(0);
  const lastTimestampRef = useRef(null);

  const controlModeRef = useRef('manual');

  useEffect(() => {
    controlModeRef.current = controlMode;
  }, [controlMode]);

  const handleStartRecording = () => {
    console.log('🔁 Resetting scene before recording...');
    window.dispatchEvent(new CustomEvent('sceneReset'));
    setTimeout(() => {
      console.log('🔴 Start Recording clicked');
      isRecordingActiveRef.current = true;
      recordingBufferRef.current = [];
      setSuccessMessage('Recording started.');
    }, 250);
  };

  const handleStopRecording = () => {
    console.log('⏹ Stop Recording clicked');
    isRecordingActiveRef.current = false;
    const framesRecorded = recordingBufferRef.current.length;
    console.log(`🛑 Recording stopped. Frames recorded: ${framesRecorded}`);
    setSuccessMessage(`Recording stopped. ${framesRecorded} frames recorded.`);
  };

  // const handleStartReplay = async () => {
  //   if (selectedReplay) {
  //     console.log(`▶️ Requesting replay: ${selectedReplay}`);
  //     try {
  //       const response = await fetch(`${COLAB_API_URL}/load_replay`, {
  //         method: 'POST',
  //         headers: { 'Content-Type': 'application/json' },
  //         body: JSON.stringify({ filename: selectedReplay })
  //       });
  //       const result = await response.json();
  //       console.log('✅ Replay request sent:', result);
  //     } catch (error) {
  //       console.error('❌ Error starting replay:', error);
  //       setErrorMessage('Failed to start replay');
  //     }
  //   }
  // };

  const handleStartReplay = () => {
    if (selectedReplay) {
      console.log(`▶️ Requesting replay: ${selectedReplay}`);
      socket.emit('start_replay', { filename: selectedReplay });

      // ✅ Load .obj.json file
      const objFilename = selectedReplay.replace(/\.json$/, '.obj.json');
      fetch(`${COLAB_API_URL}/replays/${objFilename}`)
        .then(res => res.json())
        .then(data => {
          console.log("🎯 Target from metadata:", data.target);
          const objects = data.objects || {};
          const formatted = Object.entries(objects).map(([name, { position, rotation, isTarget }]) => ({
            ...movableModels.find(m => m.name === name),
            id: name,
            position,
            rotation,
            physicsProps: {
              mass: 1,
              type: 'dynamic',
              linearDamping: 0.5,
              angularDamping: 0.5,
              friction: 0.7,
              restitution: 0,
            },
            isTarget
          }));
          console.log("📦 Loaded replay object positions:", formatted);
          setReplayPositions(formatted);
        })
        .catch(err => console.error("❌ Failed to load .obj.json", err));
    }
  };


  const stepReplay = (timestamp) => {
    if (lastTimestampRef.current === null) {
      lastTimestampRef.current = timestamp;
      replayTimeoutRef.current = requestAnimationFrame(stepReplay);
      return;
    }

    const delta = timestamp - lastTimestampRef.current;
    accumulatedTimeRef.current += delta;
    lastTimestampRef.current = timestamp;

    while (true) {
      const frame = replayFrameQueue.current[replayFrameIndex.current];
      if (!frame) {
        handleStopReplay();
        return;
      }

      const frameDuration = (frame.frameTime || 0.05) * 1000;

      if (accumulatedTimeRef.current < frameDuration) break;

      if (controlModeRef.current === "replay") {
        Object.assign(liveStateRef.current, frame);
        currentActionRef.current = frame.currentActions || [];

        // ✅ Inject position/rotation for Buggy
        if (frame.robot_pos && frame.robot_rot) {
          robotPositionRef.current = [...frame.robot_pos];
          robotRotationRef.current = [...frame.robot_rot];
        }

        replayStepTriggerRef.current = true;
      }


      accumulatedTimeRef.current -= frameDuration;
      replayFrameIndex.current++;
    }

    replayTimeoutRef.current = requestAnimationFrame(stepReplay);
  };

  const startReplayPlayback = () => {
    if (!replayFrameQueue.current.length) return;
    replayFrameIndex.current = 0;
    accumulatedTimeRef.current = 0;
    lastTimestampRef.current = null;
    setIsReplayPlaying(true);
    replayTimeoutRef.current = requestAnimationFrame(stepReplay);
    setControlMode('replay');
  };

  const stopReplayPlayback = () => {
    cancelAnimationFrame(replayTimeoutRef.current);
    replayTimeoutRef.current = null;
    accumulatedTimeRef.current = 0;
    lastTimestampRef.current = null;
    replayFrameIndex.current = 0;
    replayFrameQueue.current = [];
    setIsReplayPlaying(false);
    currentActionRef.current = [];
  };

  const handleStopReplay = () => {
    console.log('⏹ Stopping replay playback');
    stopReplayPlayback();
    setControlMode('manual');
    // if (typeof setReplayPositions === 'function') {
    //   setReplayPositions(null);  // ✅ clear it
    // }
  };


  const handleFetchReplays = useCallback(() => {
    if (isLoading.current) return;
    isLoading.current = true;

    fetch(`${COLAB_API_URL}/list_replays`)
      .then((response) => response.json())
      .then((data) => {
        setReplays(data.replays || []);
        isLoading.current = false;
      })
      .catch((error) => {
        console.error('Error fetching replays:', error);
        setErrorMessage('Failed to fetch replays');
        isLoading.current = false;
      });
  }, []);

  const handleSaveReplay = () => {
    if (!replayFilename) {
      setErrorMessage("Please enter a filename before saving.");
      return;
    }

    const filename = `${replayFilename}.json`;
    const objFilename = `${replayFilename}.obj.json`;

    const replayData = recordingBufferRef.current;

    const rawObjects = modelPositionsRef.current;

    const enrichedObjects = Object.entries(rawObjects).reduce(
      (acc, [id, data]) => {
        acc[id] = {
          ...data,
          isTarget: id === targetObject,
        };
        return acc;
      },
      {}
    );

    const objectMetadata = {
      target: targetObject,
      objects: enrichedObjects,
    };

    fetch(`${COLAB_API_URL}/save_replay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename, data: replayData }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("✅ Replay saved:", data);
        setSuccessMessage(`Replay saved: ${filename}`);
        setReplayFilename("");
        handleFetchReplays();

        // Save the .obj.json file
        return fetch(`${COLAB_API_URL}/save_replay`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: objFilename, data: objectMetadata }),
        });
      })
      .then((res) => res.json())
      .then((objData) => {
        console.log("🗂️ Object metadata saved:", objData);
      })
      .catch((err) => {
        console.error("❌ Failed to save replay", err);
        setErrorMessage("Failed to save replay");
      });
  };

  const handleClearMessages = () => {
    setErrorMessage('');
    setSuccessMessage('');
  };

  useEffect(() => {
    socket.on('replay_data', ({ frames }) => {
      console.log(`📥 Received ${frames.length} replay frames`);
      replayFrameQueue.current = frames;
      startReplayPlayback();
    });

    return () => socket.off('replay_data');
  }, []);

  useEffect(() => {
    socket.on('replay_data', ({ frames, object_data }) => {
      console.log(`📥 Received ${frames.length} replay frames`);
      replayFrameQueue.current = frames;
      
      if (object_data && object_data.objects) {
        console.log('🗂️ Repositioning objects for replay:', object_data);
        
        // Dispatch repositioning event
        window.dispatchEvent(new CustomEvent('repositionObjects', {
          detail: {
            objects: object_data.objects,
            target: object_data.target
          }
        }));
        
        // Listen for settlement notification (fired by ObjectRandomizer)
        const handleSettlement = () => {
          console.log('✅ Objects settled, starting replay...');
          startReplayPlayback();
          window.removeEventListener('objectsSettled', handleSettlement);
        };
        
        window.addEventListener('objectsSettled', handleSettlement);
        
      } else {
        startReplayPlayback();
      }
    });

    return () => socket.off('replay_data');
  }, []);

  return {
    replays,
    selectedReplay,
    setSelectedReplay,
    isReplayPlaying,
    replayFilename,
    setReplayFilename,
    errorMessage,
    successMessage,
    recordingBufferRef,
    isRecordingActiveRef,
    currentActionRef,
    handleStartRecording,
    handleStopRecording,
    handleStartReplay,
    handleStopReplay,
    handleFetchReplays,
    handleSaveReplay,
    handleClearMessages,
    COLAB_API_URL
  };
}

export default useReplayController;