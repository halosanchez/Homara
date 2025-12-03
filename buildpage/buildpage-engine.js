// BUILD PAGE: Interactive Homara Logo with Grid Background
// Replicates the homepage with mouse tracking and point cloud animation

import * as THREE from 'https://esm.sh/three@0.160.0';
import gsap from 'https://esm.sh/gsap@3.12.2';

// ===== CONFIGURATION =====
const CONFIG = {
  grid: {
    spacing: 40,
    dotSize: 1.5,
    color: '#cccccc',
    opacity: 0.4
  },
  logo: {
    size: 500,                    // Match the display size (500px × 500px)
    particleSize: 2.5,
    depthRange: 80,
    floatSpeed: 0.001,
    floatAmount: 5,
    swayAmount: 4,
    mouseWindRadius: 80,
    mouseWindStrength: 25,
    windReturnSpeed: 0.08,
    samplingDensity: 1
  }
};

// ===== GLOBAL STATE =====
let logoImageElement = null;
let mouseX = 0;
let mouseY = 0;
let scene, camera, renderer;
let particleSystem = null;
let logoImage = null;
let particles = [];
let animationTime = 0;
let showPointCloud = false;

// ===== BACKGROUND GRID =====
function createBackgroundGrid() {
  const canvas = document.getElementById('background-canvas');
  if (!canvas) {
    console.error('Background canvas not found');
    return;
  }

  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    draw();
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = CONFIG.grid.color;
    ctx.globalAlpha = CONFIG.grid.opacity;

    const cols = Math.ceil(canvas.width / CONFIG.grid.spacing);
    const rows = Math.ceil(canvas.height / CONFIG.grid.spacing);

    for (let i = 0; i <= cols; i++) {
      for (let j = 0; j <= rows; j++) {
        const x = i * CONFIG.grid.spacing;
        const y = j * CONFIG.grid.spacing;

        ctx.beginPath();
        ctx.arc(x, y, CONFIG.grid.dotSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    console.log('Grid drawn:', cols, 'x', rows);
  }

  resize();
  window.addEventListener('resize', resize);
}

// ===== MOUSE TRACKING =====
function setupMouseTracking() {
  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });
}

// ===== INPUT CONTROLS (Keyboard & Mouse) =====
function setupInputControls() {
  // Toggle on any key press
  document.addEventListener('keydown', (e) => {
    showPointCloud = !showPointCloud;
    updateVisibility();
    console.log('Point cloud mode:', showPointCloud, '(triggered by key)');
  });

  // Toggle on any mouse click
  document.addEventListener('click', (e) => {
    showPointCloud = !showPointCloud;
    updateVisibility();
    console.log('Point cloud mode:', showPointCloud, '(triggered by click)');
  });
}

function updateVisibility() {
  const pointCloudCanvas = document.getElementById('pointcloud-canvas');

  if (showPointCloud) {
    // Show point cloud
    if (pointCloudCanvas) {
      pointCloudCanvas.style.opacity = '1';
      pointCloudCanvas.style.pointerEvents = 'auto';
    }
    // Hide original logo
    if (logoImageElement) {
      logoImageElement.style.opacity = '0';
      logoImageElement.style.pointerEvents = 'none';
    }
    console.log('✅ Point cloud visible');
  } else {
    // Hide point cloud
    if (pointCloudCanvas) {
      pointCloudCanvas.style.opacity = '0';
      pointCloudCanvas.style.pointerEvents = 'none';
    }
    // Show original logo
    if (logoImageElement) {
      logoImageElement.style.opacity = '1';
      logoImageElement.style.pointerEvents = 'auto';
    }
    console.log('✅ Logo visible');
  }
}

// ===== THREE.JS SETUP =====
function initThreeJS() {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 400;

  // Use existing canvas from HTML instead of creating new one
  const canvas = document.getElementById('pointcloud-canvas');
  if (!canvas) {
    console.error('❌ Point cloud canvas not found in DOM');
    return;
  }

  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: true
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  console.log('✅ Three.js renderer initialized with existing canvas');
}

// ===== LOAD LOGO IMAGE =====
function loadLogoImage() {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      console.log('✅ Logo image loaded successfully');
      logoImage = img;
      resolve(img);
    };
    img.onerror = (e) => {
      console.error('❌ Failed to load logo image:', e);
      reject(e);
    };
    console.log('Loading logo from: /homaralogo.png');
    img.src = '/homaralogo.png';
  });
}

// ===== CREATE POINT CLOUD FROM LOGO =====
function createPointCloud() {
  if (!logoImage) {
    console.error('❌ Logo image not loaded yet');
    return null;
  }

  console.log('🔄 Creating point cloud from logo:', logoImage.width, 'x', logoImage.height);

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = CONFIG.logo.size;
  canvas.height = CONFIG.logo.size;

  // Fill with white background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw the logo image
  ctx.drawImage(logoImage, 0, 0, CONFIG.logo.size, CONFIG.logo.size);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  const positions = [];
  const samplingStep = CONFIG.logo.samplingDensity;

  // Sample pixels to create point cloud
  for (let y = 0; y < canvas.height; y += samplingStep) {
    for (let x = 0; x < canvas.width; x += samplingStep) {
      const i = (y * canvas.width + x) * 4;

      const r = imageData.data[i];
      const g = imageData.data[i + 1];
      const b = imageData.data[i + 2];
      const alpha = imageData.data[i + 3];

      const brightness = (r + g + b) / 3;

      // Include pixels that are dark (part of logo) and have alpha
      if (alpha > 128 && brightness < 128) {
        const posX = x - canvas.width / 2;
        const posY = -(y - canvas.height / 2);
        const posZ = (Math.random() - 0.5) * CONFIG.logo.depthRange;

        positions.push({ x: posX, y: posY, z: posZ });
      }
    }
  }

  if (positions.length === 0) {
    console.warn('⚠️ No particles created - logo might be too light or transparent');
    return null;
  }

  console.log(`✅ Created point cloud with ${positions.length} particles`);

  // Create particle data with animation properties
  particles = positions.map(pos => ({
    originalX: pos.x,
    originalY: pos.y,
    originalZ: pos.z,
    phaseY: Math.random() * Math.PI * 2,
    phaseX: Math.random() * Math.PI * 2,
    speedMultiplier: 0.8 + Math.random() * 0.4,
    windOffsetX: 0,
    windOffsetY: 0
  }));

  // Create Three.js geometry
  const geometry = new THREE.BufferGeometry();
  const positionsArray = new Float32Array(positions.length * 3);

  positions.forEach((pos, i) => {
    positionsArray[i * 3] = pos.x;
    positionsArray[i * 3 + 1] = pos.y;
    positionsArray[i * 3 + 2] = pos.z;
  });

  geometry.setAttribute('position', new THREE.BufferAttribute(positionsArray, 3));

  // Create material for particles
  const material = new THREE.PointsMaterial({
    color: 0x000000,
    size: CONFIG.logo.particleSize,
    transparent: true,
    opacity: 0.8,
    sizeAttenuation: true,
    depthTest: true,
    depthWrite: false
  });

  // Create and add point cloud to scene
  particleSystem = new THREE.Points(geometry, material);
  scene.add(particleSystem);

  console.log('✅ Point cloud added to scene');
  return particleSystem;
}



// ===== ANIMATION LOOP =====
function animate() {
  requestAnimationFrame(animate);

  // Always update animation time for smooth motion
  animationTime += CONFIG.logo.floatSpeed;

  // Helper function to update particle positions
  const updateParticlePositions = (particleSystem, particleArray) => {
    if (!particleSystem || particleArray.length === 0) return;

    const positions = particleSystem.geometry.attributes.position.array;
    const mouseWorldX = mouseX - window.innerWidth / 2;
    const mouseWorldY = -(mouseY - window.innerHeight / 2);

    particleArray.forEach((particle, i) => {
      const time = animationTime * particle.speedMultiplier;

      const floatOffsetY = Math.sin(time + particle.phaseY) * CONFIG.logo.floatAmount;
      const swayOffsetX = Math.cos(time * 0.7 + particle.phaseX) * CONFIG.logo.swayAmount;

      const dx = particle.originalX - mouseWorldX;
      const dy = particle.originalY - mouseWorldY;
      const distanceToMouse = Math.sqrt(dx * dx + dy * dy);

      if (distanceToMouse < CONFIG.logo.mouseWindRadius) {
        const pushStrength = (1 - distanceToMouse / CONFIG.logo.mouseWindRadius) * CONFIG.logo.mouseWindStrength;
        const angle = Math.atan2(dy, dx);
        const pushX = Math.cos(angle) * pushStrength;
        const pushY = Math.sin(angle) * pushStrength;

        particle.windOffsetX += (pushX - particle.windOffsetX) * 0.15;
        particle.windOffsetY += (pushY - particle.windOffsetY) * 0.15;
      } else {
        particle.windOffsetX += (0 - particle.windOffsetX) * CONFIG.logo.windReturnSpeed;
        particle.windOffsetY += (0 - particle.windOffsetY) * CONFIG.logo.windReturnSpeed;
      }

      positions[i * 3] = particle.originalX + swayOffsetX + particle.windOffsetX;
      positions[i * 3 + 1] = particle.originalY + floatOffsetY + particle.windOffsetY;
      positions[i * 3 + 2] = particle.originalZ;
    });

    particleSystem.geometry.attributes.position.needsUpdate = true;
  };

  // Update logo particles
  updateParticlePositions(particleSystem, particles);

  // Always render the scene
  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}

// ===== INITIALIZATION =====
async function init() {
  try {
    console.log('🚀 Initializing Build Page...');

    // Step 1: Create background grid
    createBackgroundGrid();
    console.log('✅ Grid created');

    // Step 2: Setup logo image element
    logoImageElement = document.getElementById('logo-image');
    if (!logoImageElement) {
      console.error('❌ Logo image element not found in DOM');
      return;
    }
    logoImageElement.src = '/homaralogo.png';
    console.log('✅ Logo element set');

    // Step 3: Setup input handlers
    setupMouseTracking();
    console.log('✅ Mouse tracking enabled');

    setupInputControls();
    console.log('✅ Input controls enabled (any key or click to toggle)');

    // Step 4: Initialize Three.js
    initThreeJS();
    console.log('✅ Three.js initialized');

    // Step 5: Load logo image
    try {
      await loadLogoImage();
      console.log('✅ Logo image loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load logo image:', error);
      throw error;
    }

    // Step 6: Create point cloud
    const pointCloud = createPointCloud();
    if (!pointCloud) {
      console.warn('⚠️ Point cloud creation failed or returned null');
    } else {
      console.log('✅ Point cloud created successfully');
    }

    // Step 7: Start animation loop
    animate();
    console.log('✅ Animation loop started');

    console.log('✅ Build Page Fully Initialized');
    console.log('📌 Press any key or click to toggle between logo and point cloud');
    console.log('🖱️ Move your mouse over the logo to see the wind effect');

  } catch (error) {
    console.error('❌ Failed to initialize build page:', error);
    console.error(error.stack);
  }
}

console.log('Script loaded, waiting for DOM...');
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

