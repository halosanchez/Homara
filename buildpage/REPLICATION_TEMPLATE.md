# Replication Template - Adding New Figures to Point Cloud System

## Overview
This template shows exactly how to add a new figure (like the magnolia tree, city skyline, etc.) to the point cloud system.

---

## Step 1: Prepare Your Image

**Requirements:**
- Format: PNG with transparency
- Background: Transparent (not white)
- Logo/Figure: Dark pixels (black or dark color)
- Size: Recommended 1000x1000px or larger
- Location: Place in `/BUILD PAGE/` folder

**Example:**
```
/BUILD PAGE/
├── homaralogo.png          (existing)
├── magnolia-tree.png       (new)
├── city-skyline.png        (new)
└── buildpage-engine.js
```

---

## Step 2: Add Configuration for New Figure

In `buildpage-engine.js`, add to CONFIG:

```javascript
const CONFIG = {
  grid: { /* existing */ },
  logo: { /* existing */ },
  
  // ADD NEW FIGURE CONFIG
  magnolia: {
    size: 500,
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
```

---

## Step 3: Add Global State Variables

```javascript
// ===== GLOBAL STATE =====
let logoImageElement = null;
let logoImage = null;
let particleSystem = null;
let particles = [];

// ADD FOR NEW FIGURE
let magnoliaImage = null;
let magnoliaParticleSystem = null;
let magnoliaParticles = [];

let currentFigure = 'logo'; // Track which figure is active
```

---

## Step 4: Create Generic Point Cloud Function

```javascript
// ===== GENERIC POINT CLOUD CREATOR =====
function createPointCloudFromImage(image, config, particlesArray) {
  if (!image) {
    console.error('❌ Image not loaded');
    return null;
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = config.size;
  canvas.height = config.size;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, 0, 0, config.size, config.size);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const positions = [];
  const samplingStep = config.samplingDensity;

  for (let y = 0; y < canvas.height; y += samplingStep) {
    for (let x = 0; x < canvas.width; x += samplingStep) {
      const i = (y * canvas.width + x) * 4;
      const r = imageData.data[i];
      const g = imageData.data[i + 1];
      const b = imageData.data[i + 2];
      const alpha = imageData.data[i + 3];
      const brightness = (r + g + b) / 3;

      if (alpha > 128 && brightness < 128) {
        positions.push({
          x: x - canvas.width / 2,
          y: -(y - canvas.height / 2),
          z: (Math.random() - 0.5) * config.depthRange
        });
      }
    }
  }

  if (positions.length === 0) {
    console.warn('⚠️ No particles created');
    return null;
  }

  // Store particles in provided array
  particlesArray.length = 0; // Clear existing
  positions.forEach(pos => {
    particlesArray.push({
      originalX: pos.x,
      originalY: pos.y,
      originalZ: pos.z,
      phaseY: Math.random() * Math.PI * 2,
      phaseX: Math.random() * Math.PI * 2,
      speedMultiplier: 0.8 + Math.random() * 0.4,
      windOffsetX: 0,
      windOffsetY: 0
    });
  });

  const geometry = new THREE.BufferGeometry();
  const positionsArray = new Float32Array(positions.length * 3);

  positions.forEach((pos, i) => {
    positionsArray[i * 3] = pos.x;
    positionsArray[i * 3 + 1] = pos.y;
    positionsArray[i * 3 + 2] = pos.z;
  });

  geometry.setAttribute('position', new THREE.BufferAttribute(positionsArray, 3));

  const material = new THREE.PointsMaterial({
    color: 0x000000,
    size: config.particleSize,
    transparent: true,
    opacity: 0.8,
    sizeAttenuation: true,
    depthTest: true,
    depthWrite: false
  });

  const pointCloud = new THREE.Points(geometry, material);
  scene.add(pointCloud);

  return pointCloud;
}
```

---

## Step 5: Load New Figure Image

```javascript
// ===== LOAD MAGNOLIA IMAGE =====
function loadMagnoliaImage() {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      console.log('✅ Magnolia image loaded');
      magnoliaImage = img;
      resolve(img);
    };
    img.onerror = (e) => {
      console.error('❌ Failed to load magnolia:', e);
      reject(e);
    };
    img.src = '/BUILD%20PAGE/magnolia-tree.png';
  });
}
```

---

## Step 6: Create Point Cloud for New Figure

```javascript
// ===== CREATE MAGNOLIA POINT CLOUD =====
function createMagnoliaPointCloud() {
  magnoliaParticleSystem = createPointCloudFromImage(
    magnoliaImage,
    CONFIG.magnolia,
    magnoliaParticles
  );
  
  if (magnoliaParticleSystem) {
    magnoliaParticleSystem.visible = false; // Hidden by default
    console.log('✅ Magnolia point cloud created');
  }
}
```

---

## Step 7: Update Animation Loop

```javascript
// ===== UPDATED ANIMATION LOOP =====
function animate() {
  requestAnimationFrame(animate);
  animationTime += CONFIG.logo.floatSpeed;

  // Update active particle system
  let activeParticles = particles;
  let activeSystem = particleSystem;

  if (currentFigure === 'magnolia') {
    activeParticles = magnoliaParticles;
    activeSystem = magnoliaParticleSystem;
  }

  if (activeSystem && activeParticles.length > 0) {
    const positions = activeSystem.geometry.attributes.position.array;
    const mouseWorldX = mouseX - window.innerWidth / 2;
    const mouseWorldY = -(mouseY - window.innerHeight / 2);

    activeParticles.forEach((particle, i) => {
      const time = animationTime * particle.speedMultiplier;
      const floatOffsetY = Math.sin(time + particle.phaseY) * CONFIG.logo.floatAmount;
      const swayOffsetX = Math.cos(time * 0.7 + particle.phaseX) * CONFIG.logo.swayAmount;

      const dx = particle.originalX - mouseWorldX;
      const dy = particle.originalY - mouseWorldY;
      const distanceToMouse = Math.sqrt(dx * dx + dy * dy);

      if (distanceToMouse < CONFIG.logo.mouseWindRadius) {
        const pushStrength = (1 - distanceToMouse / CONFIG.logo.mouseWindRadius) * CONFIG.logo.mouseWindStrength;
        const angle = Math.atan2(dy, dx);
        particle.windOffsetX += (Math.cos(angle) * pushStrength - particle.windOffsetX) * 0.15;
        particle.windOffsetY += (Math.sin(angle) * pushStrength - particle.windOffsetY) * 0.15;
      } else {
        particle.windOffsetX += (0 - particle.windOffsetX) * CONFIG.logo.windReturnSpeed;
        particle.windOffsetY += (0 - particle.windOffsetY) * CONFIG.logo.windReturnSpeed;
      }

      positions[i * 3] = particle.originalX + swayOffsetX + particle.windOffsetX;
      positions[i * 3 + 1] = particle.originalY + floatOffsetY + particle.windOffsetY;
      positions[i * 3 + 2] = particle.originalZ;
    });

    activeSystem.geometry.attributes.position.needsUpdate = true;
  }

  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}
```

---

## Step 8: Add Toggle Function

```javascript
// ===== TOGGLE BETWEEN FIGURES =====
function toggleFigure(figureName) {
  currentFigure = figureName;

  // Hide all
  if (particleSystem) particleSystem.visible = false;
  if (magnoliaParticleSystem) magnoliaParticleSystem.visible = false;

  // Show selected
  if (figureName === 'logo' && particleSystem) {
    particleSystem.visible = true;
  } else if (figureName === 'magnolia' && magnoliaParticleSystem) {
    magnoliaParticleSystem.visible = true;
  }

  console.log('Switched to:', figureName);
}
```

---

## Step 9: Update Initialization

```javascript
async function init() {
  // ... existing code ...

  await loadLogoImage();
  createPointCloud();

  // ADD NEW FIGURE LOADING
  await loadMagnoliaImage();
  createMagnoliaPointCloud();

  animate();
  console.log('✅ All figures loaded');
}
```

---

## Step 10: Add Keyboard Controls for Switching

```javascript
function setupKeyboardControls() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'c' || e.key === 'C') {
      showPointCloud = !showPointCloud;
      updateVisibility();
    }
    if (e.key === '1') toggleFigure('logo');
    if (e.key === '2') toggleFigure('magnolia');
  });
}
```

---

## Testing Your New Figure

1. **Prepare image** - PNG with dark logo on transparent background
2. **Place in folder** - `/BUILD PAGE/magnolia-tree.png`
3. **Add config** - Add to CONFIG object
4. **Add state** - Add global variables
5. **Load image** - Create load function
6. **Create point cloud** - Call generic creator
7. **Test** - Press '2' to toggle to magnolia


