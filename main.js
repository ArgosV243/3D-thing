import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as CANNON from 'cannon-es';

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

  // Background image texture
  const loader = new THREE.TextureLoader();
  loader.load('./skybox.jpg', (backgroundImage) => {
    scene.background = backgroundImage;

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
    const floorSize = 40;
    const floorGeometry = new THREE.BoxGeometry(floorSize, 0.1, floorSize); // Floor size 
    const floorTexture = loader.load('./touchgrass.jpg'); // Floor texture
    const floorMaterial = new THREE.MeshBasicMaterial({ map: floorTexture });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = -0.5;
    scene.add(floor);

    // The obstacles
    const obstacleSize = 2;
    const obstacleGeometry = new THREE.BoxGeometry(obstacleSize, obstacleSize, obstacleSize);
    const obstacleTexture = loader.load('./mr-world.jpg');
    const obstacleMaterial = new THREE.MeshBasicMaterial({ map: obstacleTexture });
    
    const obstacle1 = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
    obstacle1.position.set(-5, 1, 5);
    scene.add(obstacle1);
    
    const obstacle2 = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
    obstacle2.position.set(5, 1, 5);
    scene.add(obstacle2);
    
    const obstacle3 = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
    obstacle3.position.set(0, 1, -5);
    scene.add(obstacle3);
    
    
    // The border wall
    const borderThickness = 0.1;
    const borderGeometry = new THREE.BoxGeometry(floorSize + borderThickness * 2, 2, floorSize + borderThickness * 2);
    const borderTexture = loader.load('./border_texture.png');//placeholder border overlays grass
    const borderMaterial = new THREE.MeshStandardMaterial({ map: borderTexture, transparent: true, alphaTest: 0.5 });

    const borderWall = new THREE.Mesh(borderGeometry, borderMaterial);
    borderWall.position.y = -1 - borderThickness;
    scene.add(borderWall);

    const world = new CANNON.World();
    // world.gravity.set(0, -9.82, 0);
    world.gravity.set(0, -17.82, 0);

    // The cube
    const cubeShape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));
    const cubeBody = new CANNON.Body({ mass: 1 });
    cubeBody.addShape(cubeShape);
    cubeBody.position.set(0, 2, 0); // Set cube initial position on top of the floor
    world.addBody(cubeBody);

    // The floor
    const floorShape = new CANNON.Box(new CANNON.Vec3(floorSize / 2, 0.1, floorSize / 2));
    const floorBody = new CANNON.Body({ mass: 0 });
    floorBody.addShape(floorShape);
    floorBody.position.set(0, 0.01, 0);
    world.addBody(floorBody);

    // The obstacles
    const obstacleShape = new CANNON.Box(new CANNON.Vec3(obstacleSize / 2, obstacleSize / 2, obstacleSize / 2));

    const obstacle1Body = new CANNON.Body({ mass: 0 });
    obstacle1Body.addShape(obstacleShape);
    obstacle1Body.position.set(-5, 1, 5);
    world.addBody(obstacle1Body);

    const obstacle2Body = new CANNON.Body({ mass: 0 });
    obstacle2Body.addShape(obstacleShape);
    obstacle2Body.position.set(5, 1, 5);
    world.addBody(obstacle2Body);

    const obstacle3Body = new CANNON.Body({ mass: 0 });
    obstacle3Body.addShape(obstacleShape);
    obstacle3Body.position.set(0, 1, -5);
    world.addBody(obstacle3Body);

    // The border wall
    const borderShape = new CANNON.Box(new CANNON.Vec3(floorSize / 2 + borderThickness, 1, floorSize / 2 + borderThickness));

    const borderWallBody = new CANNON.Body({ mass: 0 });
    borderWallBody.addShape(borderShape);
    borderWallBody.position.set(0, -1 - borderThickness, 0);
    world.addBody(borderWallBody);

    //this is here to prevent the cube from passing through the floor
    const cubeFloorContact = new CANNON.ContactMaterial(floorShape, cubeShape, {
      friction: 1.0,
      restitution: 1.0,
    });
    world.addContactMaterial(cubeFloorContact);

    const moveSpeed = 2.0;
    const jumpForce = 5;
    const moveVector = new THREE.Vector3();
    const jumpVector = new THREE.Vector3(0, jumpForce, 0);
    let isJumping = false;

    function handleKeyDown(event) {
      if (event.repeat) return;
      const keyCode = event.code;
      if (keyCode === 'KeyW') {
        moveVector.z = -moveSpeed;
      } else if (keyCode === 'KeyA') {
        moveVector.x = -moveSpeed;
      } else if (keyCode === 'KeyS') {
        moveVector.z = moveSpeed;
      } else if (keyCode === 'KeyD') {
        moveVector.x = moveSpeed;
      } else if (keyCode === 'Space' && !isJumping) {
        cubeBody.applyImpulse(jumpVector, cubeBody.position);
        isJumping = true;
      }
    }

    function handleKeyUp(event) {
      const keyCode = event.code;
      if (keyCode === 'KeyW' || keyCode === 'KeyS') {
        moveVector.z = 0;
      } else if (keyCode === 'KeyA' || keyCode === 'KeyD') {
        moveVector.x = 0;
      } else if (keyCode === 'Space') {
        isJumping = false;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    function animate() {
      requestAnimationFrame(animate);

      cube.rotation.x += 0.00;
      cube.rotation.y += 0.00;

      //cube constraint
      cubeBody.position.x = Math.max(-floorSize / 2 + borderThickness + 0.5, Math.min(floorSize / 2 - borderThickness - 0.5, cubeBody.position.x));
      cubeBody.position.z = Math.max(-floorSize / 2 + borderThickness + 0.5, Math.min(floorSize / 2 - borderThickness - 0.5, cubeBody.position.z));

      cubeBody.velocity.x = moveVector.x;
      cubeBody.velocity.z = moveVector.z;

      cube.position.copy(cubeBody.position);
      cube.quaternion.copy(cubeBody.quaternion);

      world.step(1 / 60);

      if (resizeRendererToDisplaySize()) {
        const canvas = renderer.domElement;
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
      }

      renderer.render(scene, camera);
    }

    animate();
  });

  window.addEventListener('resize', onWindowResize, false);
  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
}

main();
