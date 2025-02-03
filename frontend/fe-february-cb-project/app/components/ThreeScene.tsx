"use client"; // Required for Next.js (if using App Router)

import * as THREE from "three";
import { useEffect, useRef } from "react";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const ThreeScene = () => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mountRef.current) return; // Guard clause to prevent null reference

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);

    // Controls (only one instance is needed)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(10, 10, 10);
    scene.add(directionalLight);

    // // Main floor
    const floorGeometry = new THREE.PlaneGeometry(40, 40);
    const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x8b5a2b });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // Camera position
    camera.position.set(0, 10, 20);
    camera.lookAt(0, 0, 0);

    // Create the hallway
    const hallwayGeometry = new THREE.BoxGeometry(25, 5, .01);
    const hallwayMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B4513, // Brown color for hardwood
      roughness: 0.8,
    });
    const hallway = new THREE.Mesh(hallwayGeometry, hallwayMaterial);
    hallway.position.set(0, 0, 0);
    scene.add(hallway);

    // Define room colors
    const roomColors = [
      0xFFDAB9, // Pastel Orange
      0xCCCCFF, // Periwinkle
      0xFFB6C1, // Light Red
      0xBCE2C1, // Sage Green
      0xFFFFE0, // Pastel Yellow
    ];

    // Create rooms
    const roomGeometry = new THREE.BoxGeometry(5, 5, 5);
    const rooms = [];

    for (let i = 0; i < 5; i++) {
      const roomMaterial = new THREE.MeshStandardMaterial({
        color: roomColors[i],
        roughness: 0.7,
      });
      const room = new THREE.Mesh(roomGeometry, roomMaterial);

      // Position rooms: side rooms for the first 4 and a main room at the end
      if (i < 4) {
        room.position.set((i - 2) * 6, 0, -10);
      } else {
        room.position.set(0, 0, 15);
      }

      scene.add(room);
      rooms.push(room);
    }

    // Create tables for hallway rooms
    const tableGeometry = new THREE.BoxGeometry(1, 0.5, 1);

    rooms.forEach((room, index) => {
      if (index < 4) { // Only add tables to the 4 hallway rooms
        for (let j = 0; j < 3; j++) {
          // Create a slightly darker shade for each table by subtracting a value
          const tableColor = roomColors[index] - (j * 0x101010);
          const tableMaterial = new THREE.MeshStandardMaterial({
            color: tableColor,
            roughness: 0.6,
          });
          const table = new THREE.Mesh(tableGeometry, tableMaterial);

          // Position tables: spread them horizontally within the room
          table.position.set(
            room.position.x + (j - 1) * 2,
            0.25, // Half the height of the table
            room.position.z - 2 // Place tables inside the room
          );

          scene.add(table);
        }
      }
    });

    // Create floors for each room
    // (Renamed to roomFloorGeometry to avoid naming conflicts with the main floor)
    const roomFloorGeometry = new THREE.BoxGeometry(5, 0.1, 5);
    const roomFloorMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B4513, // Brown color for hardwood
      roughness: 0.8,
    });

    rooms.forEach((room) => {
      const roomFloor = new THREE.Mesh(roomFloorGeometry, roomFloorMaterial);
      roomFloor.position.set(room.position.x, -2.55, room.position.z); // Position below the room
      scene.add(roomFloor);
    });

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update(); // Update controls for smooth damping
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup function: remove the renderer's canvas when the component unmounts
    return () => {
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, []); // Empty dependency array ensures this runs only once

  return <div ref={mountRef} style={{ width: "100%", height: "100vh" }} />;
};

export default ThreeScene;
