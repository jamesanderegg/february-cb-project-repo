//Table Construction in THREE
const table = new THREE.Group();

const tableBaseGeometry = new THREE.CylinderGeometry(0.25, 0.75, 0.25);
const tableMaterial = new THREE.MeshBasicMaterial({color:'#3d1010', side: THREE.DoubleSide});
const tableBase = new THREE.Mesh(tableBaseGeometry, tableMaterial);
tableBase.position.set(0, 0.125, 0);
tableBase.add(table);

const tableStandGeometry = new THREE.CylinderGeometry(0, 0.15, 1);
const tableStand = new THREE.Mesh(tableStandGeometry, tableMaterial);
tableStand.position.set(-0, 0.625, 0);
tableStand.add(table);

const tableTopGeometry = new THREE.BoxGeometry(1.4, 0.025, 1.4);
const tableTop = new THREE.Mesh(tableTopGeometry, tableMaterial);
tableTop.position.set(0, 1.125, 0);
tableTop.add(table);

scene.add(table);



export default table