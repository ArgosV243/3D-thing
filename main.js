import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

function main() {
  const canvas = document.querySelector('#c');
  const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });

  // Match window dimensions
  function resizeRendererToDisplaySize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
      renderer.setSize(width, height, false);
    }
    return needResize;
  }

  const fov = 45;
  const aspect = window.innerWidth / window.innerHeight; // window aspect ratio
  const near = 0.1;
  const far = 100;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.set(0, 1, 10); // Y-axis movement

  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 1, 0); // Same plane as cube start
  controls.update();

  const scene = new THREE.Scene();

  const myScene = scene;

  // Background image texture
  const loader = new THREE.TextureLoader();
  loader.load('./skybox.jpg', (backgroundImage) => {
    myScene.background = backgroundImage;

    // The cube
    const materials = [
      new THREE.MeshBasicMaterial({ map: loader.load('./doom-face-doomguy.gif') }),
      new THREE.MeshBasicMaterial({ map: loader.load('./IMG_1384.JPG') }),
      new THREE.MeshBasicMaterial({ map: loader.load('./cPU.PNG') }),
      new THREE.MeshBasicMaterial({ map: loader.load('./image.png') }),
      new THREE.MeshBasicMaterial({ map: loader.load('./gman.jpg') }),
      new THREE.MeshBasicMaterial({ map: loader.load('./hecucpt.jpg') })
    ];
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const cube = new THREE.Mesh(geometry, materials);
    scene.add(cube);

    // The floor
    const floorGeometry = new THREE.PlaneGeometry(40, 40); // Floor size 
    const floorTexture = loader.load('./touchgrass.jpg'); // Floor texture
    const floorMaterial = new THREE.MeshBasicMaterial({ map: floorTexture });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2; // Flat floor
    scene.add(floor);

    function animate() {
      requestAnimationFrame(animate);

      cube.rotation.x += 0.00;
      cube.rotation.y += 0.00;

      // Floor position to match the cube position
      floor.position.copy(cube.position);
      floor.position.setY(-1.0); // Floor height adjustment

      renderer.render(scene, camera);
    }

    animate();
  });

  function render() {

    if (resizeRendererToDisplaySize()) {
      const canvas = renderer.domElement;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    }

    renderer.render(scene, camera);

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

main();
