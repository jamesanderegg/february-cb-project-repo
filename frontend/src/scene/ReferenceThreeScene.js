//uploading the three.js file for now so you guys have it too :)

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Initialize the scene
const scene = new THREE.Scene();  

// Set up Axes Helper
const axesHelper = new THREE.AxesHelper(2); //Number represents the size of the axes lines--default is 1
scene.add(axesHelper); //Add the axes to the scene

//Set up Grid Helper
const gridHelper = new THREE.GridHelper(100, 100, 'white'); //First number is the size of the grid, second number is the number of divisions
scene.add(gridHelper); //Add the grid to the scene

// Initialize Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); //Color, Intensity
scene.add(ambientLight); //Add the light to the scene

// Initialize a pane
// const pane = new Pane();

// Add elements to the scene

// Add floors group
const floors = new THREE.Group();

// Add walls group
const doorWall = new THREE.Group(); //doorway wall
const blueWalls = new THREE.Group();
const redWalls = new THREE.Group();
const yellowWalls = new THREE.Group();
const orangeWalls = new THREE.Group();
const greenWalls = new THREE.Group();

// room floor size
const floorPlaneGeometry = new THREE.PlaneGeometry(5, 5);
const wallPlaneGeometry = new THREE.PlaneGeometry(5, 5);
const LwallPlaneGeometry = new THREE.PlaneGeometry(2, 5);//door wall construction L
const MwallPlaneGeometry = new THREE.PlaneGeometry(1, 2);//door wall construction M
const RwallPlaneGeometry = new THREE.PlaneGeometry(2, 5);//door wall construction R

// room floor material
const floorMaterialBlue = new THREE.MeshBasicMaterial({color:'blue', side: THREE.DoubleSide});
const floorMaterialRed = new THREE.MeshBasicMaterial({color:'red', side: THREE.DoubleSide});
const floorMaterialYellow = new THREE.MeshBasicMaterial({color:'yellow', side: THREE.DoubleSide});
const floorMaterialOrange = new THREE.MeshBasicMaterial({color:'#cc5801', side: THREE.DoubleSide});
const floorMaterialGreen = new THREE.MeshBasicMaterial({color:'darkgreen', side: THREE.DoubleSide});
const hallFloor = new THREE.MeshBasicMaterial({color:'brown', side: THREE.DoubleSide});
const hall1 = new THREE.PlaneGeometry(5, 17.5);//vertical hallway
const hall2 = new THREE.PlaneGeometry(10, 5);//horizontal hallway

// room Floor Construction
const roomFloorBlue = new THREE.Mesh(floorPlaneGeometry, floorMaterialBlue)
roomFloorBlue.rotation.x = Math.PI / 2;
roomFloorBlue.position.set(0, 0, 0);
scene.add(roomFloorBlue);
floors.add(roomFloorBlue);

const roomFloorRed = new THREE.Mesh(floorPlaneGeometry, floorMaterialRed)
roomFloorRed.rotation.x = Math.PI / 2;
roomFloorRed.position.set(0, 0, 12);
scene.add(roomFloorRed);
floors.add(roomFloorRed);

const roomFloorYellow = new THREE.Mesh(floorPlaneGeometry, floorMaterialYellow)
roomFloorYellow.rotation.x = Math.PI / 2;
roomFloorYellow.position.set(15, 0, 12);
scene.add(roomFloorYellow);
floors.add(roomFloorYellow);

const roomFloorOrange = new THREE.Mesh(floorPlaneGeometry, floorMaterialOrange)
roomFloorOrange.rotation.x = Math.PI / 2;
roomFloorOrange.position.set(10, 0, 2);
scene.add(roomFloorOrange);
floors.add(roomFloorOrange);

const roomFloorGreen = new THREE.Mesh(floorPlaneGeometry, floorMaterialGreen)
roomFloorGreen.rotation.x = Math.PI / 2;
roomFloorGreen.position.set(5, 0, -10.25);
scene.add(roomFloorGreen);
floors.add(roomFloorGreen);

// Hallways
//vertical hallway
const hallFloor1 = new THREE.Mesh(hall1, hallFloor)
hallFloor1.rotation.x = Math.PI / 2;
hallFloor1.position.set(5, 0, 1);
scene.add(hallFloor1);
floors.add(hallFloor1);

//horizontal hallway
const hallFloor2 = new THREE.Mesh(hall2, hallFloor)
hallFloor2.rotation.x = Math.PI / 2;
hallFloor2.position.set(7.5, 0, 12); //between red/yellow, 0, nowhere/green
scene.add(hallFloor2);
floors.add(hallFloor2);

// Add Elements to Scene
scene.add(floors);

//room wall material
const blueWall = new THREE.MeshBasicMaterial({color:'#0f4c5c', side: THREE.DoubleSide});
const redWall = new THREE.MeshBasicMaterial({color:'#9a031e', side: THREE.DoubleSide});
const yellowWall = new THREE.MeshBasicMaterial({color:'#fcf4a3', side: THREE.DoubleSide});
const orangeWall = new THREE.MeshBasicMaterial({color:'orange', side: THREE.DoubleSide});
const greenWall = new THREE.MeshBasicMaterial({color:'olive', side: THREE.DoubleSide});

const roomColors = [blueWall, redWall, yellowWall, orangeWall, greenWall];

let colorW;

//door wall construction
let wall1 = new THREE.Mesh(wallPlaneGeometry, colorW);
let wall2 = new THREE.Mesh(wallPlaneGeometry, colorW);
let wall3 = new THREE.Mesh(wallPlaneGeometry, colorW);
//walls 4-6 are part of the door wall: .doorWall
let wall4 = new THREE.Mesh(LwallPlaneGeometry, colorW);
let wall5 = new THREE.Mesh(MwallPlaneGeometry, colorW);
let wall6 = new THREE.Mesh(RwallPlaneGeometry, colorW);

//DONT TOUCH (3 lines)--position stuff
wall3.rotation.y = Math.PI / 2;
doorWall.position.set(2.5, 0, 0);
doorWall.rotation.y = Math.PI / 2;
//--

// Define a configuration for each room, including positions for each wall
const roomConfigs = [
  {
    name: 'blue',
    material: blueWall,
    group: blueWalls,
    positions: {
      wall1: { x: 0,    y: 2.5, z: 2.5  }, // Left wall
      wall2: { x: 0,    y: 2.5, z: -2.5 }, // Right wall
      wall3: { x: -2.5, y: 2.5, z: 0    }, // Back wall
      wall4: { x: -1.5, y: 2.5, z: 0    }, // Left door wall
      wall5: { x: 0,    y: 4,   z: 0    }, // Middle door wall
      wall6: { x: 1.5,  y: 2.5, z: 0    }  // Right door wall
    }
  },
  {
    name: 'red',
    material: redWall,
    group: redWalls,
    positions: {
      wall1: { x: 0,    y: 2.5, z: 14.5 },
      wall2: { x: 0,    y: 2.5, z: 9.5  },
      wall3: { x: -2.5, y: 2.5, z: 12   },
      wall4: { x: -13.5,y: 2.5, z: 0    },
      wall5: { x: -12,  y: 4,   z: 0    },
      wall6: { x: -10.5,y: 2.5, z: 0    }
    }
  },
  {
    name: 'yellow',
    material: yellowWall,
    group: yellowWalls,
    positions: {
      wall1: { x: 15,   y: 2.5, z: 14.5 },
      wall2: { x: 15,   y: 2.5, z: 9.5  },
      wall3: { x: 17.5, y: 2.5, z: 12   },
      wall4: { x: -13.5,y: 2.5, z: 10   },
      wall5: { x: -12,  y: 4,   z: 10   },
      wall6: { x: -10.5,y: 2.5, z: 10   }
    }
  },
  {
    name: 'orange',
    material: orangeWall,
    group: orangeWalls,
    positions: {
      wall1: { x: 10,   y: 2.5, z: 4.5  },
      wall2: { x: 10,   y: 2.5, z: -0.5 },
      wall3: { x: 12.5, y: 2.5, z: 2    },
      wall4: { x: -3.5, y: 2.5, z: 5    },
      wall5: { x: -2,   y: 4,   z: 5    },
      wall6: { x: -0.5, y: 2.5, z: 5    }
    }
  },
  {
    name: 'green',
    material: greenWall,
    group: greenWalls,
    positions: {
      wall1: { x: 5,    y: 2.5, z: -12.75 },
      wall2: { x: 2.5,  y: 2.5, z: -10.25 },
      wall3: { x: 7.5,  y: 2.5, z: -10.25 },
      wall4: { x: 1,    y: 2.5, z: -7.75  },
      wall5: { x: 2.5,  y: 4,   z: -7.75  },
      wall6: { x: 4,    y: 2.5, z: -7.75  }
    },
  }
];

// Loop through each room configuration to create its walls and add them to the scene
roomConfigs.forEach(config => {
  const { material, group, positions, extra } = config;

  // Create a group for the door section
  const doorWall = new THREE.Group();

  // Create the main walls with the room's material
  const wall1 = new THREE.Mesh(wallPlaneGeometry, material);
  const wall2 = new THREE.Mesh(wallPlaneGeometry, material);
  const wall3 = new THREE.Mesh(wallPlaneGeometry, material);
  
  // Create the door-section walls
  const wall4 = new THREE.Mesh(LwallPlaneGeometry, material);
  const wall5 = new THREE.Mesh(MwallPlaneGeometry, material);
  const wall6 = new THREE.Mesh(RwallPlaneGeometry, material);

  // Common rotations and door wall setup:
  wall3.rotation.y = Math.PI / 2; // Rotate the back wall
  doorWall.position.set(2.5, 0, 0);
  doorWall.rotation.y = Math.PI / 2;
  doorWall.add(wall4, wall5, wall6);

  // Add all walls to the room's group and then add that group to the scene
  group.add(wall1, wall2, wall3, doorWall);
  scene.add(group);

  // Set positions for the walls using the configuration
  wall1.position.set(positions.wall1.x, positions.wall1.y, positions.wall1.z);
  wall2.position.set(positions.wall2.x, positions.wall2.y, positions.wall2.z);
  wall3.position.set(positions.wall3.x, positions.wall3.y, positions.wall3.z);
  wall4.position.set(positions.wall4.x, positions.wall4.y, positions.wall4.z);
  wall5.position.set(positions.wall5.x, positions.wall5.y, positions.wall5.z);
  wall6.position.set(positions.wall6.x, positions.wall6.y, positions.wall6.z);

  // Rotate the walls if the room is green
  if (config.name === 'green') {
    wall2.rotation.y = Math.PI / 2;
    doorWall.rotation.y = Math.PI * 2;
  }
});

// context & reference for green walls positions (8 lines)
//     wall1.position.set(5, 2.5, -12.75);//Left wall //becomes back wall on green
//     wall2.position.set(2.5, 2.5, -10.25);//Right wall
//     wall2.rotation.y = Math.PI / 2; //rotate right wall on green
//     wall3.position.set(7.5, 2.5, -10.25);//back wall //becomes left wall on green
//     wall4.position.set(1, 2.5, -7.75);
//     wall5.position.set(2.5, 4, -7.75);
//     wall6.position.set(4, 2.5, -7.75);
//     doorWall.rotation.y = Math.PI * 2;
// --

// Initialize the camera
const camera = new THREE.PerspectiveCamera(
  20, //field of vision angle (fov)
  window.innerWidth / window.innerHeight, //aspect ratio--can find in dev tools to cover screen size
  0.1, //if it's closer than this number, we won't be able to see it, technically SI units (meters), but is proportional to the objects in virtual environment
  400 //if it's farther than this number, we won't be able to see it
);

//Position the camera
camera.position.set(0, 0, 100); //x,y,z coordinates
scene.add(camera); //add camera to scene

// Initialize the renderer
const canvas = document.querySelector('canvas.threejs')
const renderer = new THREE.WebGLRenderer({
  canvas:canvas,
  antialias:true
}) //takes canvas as an argument within an object
//can also write const renderer = new THREE.WebGLRenderer({canvas}); and it means the same thing

//set original size of the window
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

//instantiate the controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
// controls.autoRotate = true

window.addEventListener('resize', () => { //only when window resize detected
  //update camera
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()

  //update renderer according to the updating size of the window
  renderer.setSize(window.innerWidth, window.innerHeight)
});

// Render Loop
const renderloop = () => {
  controls.update();
  renderer.render(scene, camera);
  window.requestAnimationFrame(renderloop);
};

renderloop();