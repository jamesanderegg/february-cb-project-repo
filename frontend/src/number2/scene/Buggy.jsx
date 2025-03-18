import React, { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { useGLTF, useTexture } from "@react-three/drei";
import { Quaternion, Vector3 } from "three";
import { useFrame } from "@react-three/fiber";
import { RigidBody } from "@react-three/rapier";
import RobotCamera from "../camera/RobotCamera";

const Buggy = forwardRef(({ 
  scale = 1,
  color,
  texturePath,
  visible = true,
  robotCameraRef,
  YOLOdetectObject,
  robotPositionRef,
  robotRotationRef,
  collisionIndicator,
  objectPositions,
  setObjectPositions,
  COLAB_API_URL,
  objectsInViewRef,
  target,  // Added target prop
  timerRef   // Added timerRef prop
}, ref) => {
  const buggyRef = useRef();
  const keysPressed = useRef({});
  const moveSpeed = 90;
  const rotationSpeed = 4;

  // Load GLTF Model & Texture
  const { scene: loadedScene } = useGLTF("/models/robot.glb");
  const texture = texturePath ? useTexture(texturePath) : null;

  const handleCollisionEnter = (event) => {
    const collidedObject = event.other.colliderObject;
    if (!collidedObject) return;
    if (["RoomFloor", "HallFloor", "Plane"].includes(collidedObject.name)) return;
    collisionIndicator.current = true;
    setObjectPositions([]);
  };

  useEffect(() => {
    if (!loadedScene) return;
    loadedScene.traverse((child) => {
      if (child.isMesh) {
        if (color) child.material.color.set(color);
        if (texture) {
          child.material.map = texture;
          child.material.needsUpdate = true;
        }
      }
    });
  }, [loadedScene, color, texture]);

  useEffect(() => {
    const handleKey = (event, isPressed) => {
      keysPressed.current[event.key] = isPressed;
    };

    window.addEventListener("keydown", (e) => handleKey(e, true));
    window.addEventListener("keyup", (e) => handleKey(e, false));

    return () => {
      window.removeEventListener("keydown", (e) => handleKey(e, true));
      window.removeEventListener("keyup", (e) => handleKey(e, false));
    };
  }, []);

  useFrame(() => {
    if (!buggyRef.current) return;
    const body = buggyRef.current;
    let moveDirection = 0;
    let turnDirection = 0;
  
    if (keysPressed.current["w"]) moveDirection = moveSpeed;
    if (keysPressed.current["s"]) moveDirection = -moveSpeed;
    if (keysPressed.current["a"]) turnDirection = rotationSpeed;
    if (keysPressed.current["d"]) turnDirection = -rotationSpeed;
    
    // Handle 'v' key press
    if (keysPressed.current["v"]) {
      // Reset the key press to prevent repeated actions
      keysPressed.current["v"] = false;
      
      // Get the current state data
      const currentState = {
        robot_position: robotPositionRef.current,
        robot_rotation: robotRotationRef.current,
        detections: YOLOdetectObject.current || [],
        objects_in_view: objectsInViewRef.current || [],
        target_object: target, // Use the target prop
        collision_indicator: collisionIndicator.current,
        time_left: timerRef?.current || 0 // Use the timerRef prop
      };

      console.log("📸 'v' key pressed - taking picture", currentState);

      // Send to backend to calculate reward and process
      fetch(`${COLAB_API_URL}/process_action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'v',
          state: currentState
        })
      })
      .then(response => response.json())
      .then(data => {
        console.log("✅ Action processed:", data);
        
        // Display reward if applicable
        if (data.reward) {
          const rewardDisplay = document.createElement('div');
          rewardDisplay.className = 'reward-popup';
          rewardDisplay.innerHTML = `Reward: ${data.reward.toFixed(2)}`;
          rewardDisplay.style.position = 'absolute';
          rewardDisplay.style.top = '50%';
          rewardDisplay.style.left = '50%';
          rewardDisplay.style.transform = 'translate(-50%, -50%)';
          rewardDisplay.style.backgroundColor = 'rgba(0, 255, 0, 0.7)';
          rewardDisplay.style.color = 'white';
          rewardDisplay.style.padding = '10px 20px';
          rewardDisplay.style.borderRadius = '5px';
          rewardDisplay.style.fontSize = '24px';
          rewardDisplay.style.zIndex = '1000';
          document.body.appendChild(rewardDisplay);
          
          // Remove after 2 seconds
          setTimeout(() => {
            document.body.removeChild(rewardDisplay);
            
            // Reset buggy position after showing reward
            if (ref.current && ref.current.resetBuggy) {
              ref.current.resetBuggy();
            }
          }, 2000);
        } else {
          // Reset buggy immediately if no reward data
          if (ref.current && ref.current.resetBuggy) {
            ref.current.resetBuggy();
          }
        }
      })
      .catch(error => {
        console.error("❌ Error processing action:", error);
        if (ref.current && ref.current.resetBuggy) {
          ref.current.resetBuggy();
        }
      });
    }
  
    const currentRotation = new Quaternion().copy(body.rotation());
    if (turnDirection !== 0) {
      const turnQuaternion = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), turnDirection * 0.05);
      currentRotation.multiply(turnQuaternion);
      body.setRotation(currentRotation, true);
    }
  
    let forward = new Vector3(0, 0, -moveDirection);
    forward.applyQuaternion(currentRotation);
    body.setLinvel({ x: forward.x, y: body.linvel().y, z: forward.z }, true);
  
    const { x, y, z } = body.translation();
    const rotationQuat = body.rotation();
    robotPositionRef.current = [x, y, z];
    robotRotationRef.current = [rotationQuat.x, rotationQuat.y, rotationQuat.z, rotationQuat.w];
  });

  useImperativeHandle(ref, () => ({
    resetBuggy: () => {
      if (buggyRef.current) {
        const body = buggyRef.current;
        body.setTranslation({ x: 7, y: 0.1, z: 15 }, true);
        const resetQuaternion = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), -Math.PI / 2);
        body.setRotation(resetQuaternion, true);
        body.setLinvel({ x: 0, y: 0, z: 0 }, true);
        body.setAngvel({ x: 0, y: 0, z: 0 }, true);
        
        // Optional: reset collision indicator
        if (collisionIndicator) {
          collisionIndicator.current = false;
        }
      }
    }
  }));

  return (
    <RigidBody
      ref={buggyRef}
      type="dynamic"
      colliders="cuboid"
      position={[7, 0.1, 15]}
      rotation={[0, -Math.PI / 2, 0]}
      lockRotations={[true, false, true]}
      linearDamping={1000}
      angularDamping={1000}
      onCollisionEnter={handleCollisionEnter}
      name="buggy"
    >
      <group scale={scale} visible={visible}>
        <primitive object={loadedScene} />
      </group>

      <RobotCamera
        robotRef={buggyRef}
        ref={robotCameraRef}
        YOLOdetectObject={YOLOdetectObject}
        robotPositionRef={robotPositionRef}
        robotRotationRef={robotRotationRef}
        collisionIndicator={collisionIndicator}
        objectPositions={objectPositions}
        COLAB_API_URL={COLAB_API_URL}
        objectsInViewRef={objectsInViewRef}
      />
    </RigidBody>
  );
});

export default Buggy;