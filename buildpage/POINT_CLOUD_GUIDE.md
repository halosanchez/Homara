# Point Cloud Animation System - Implementation Guide

## Overview
The point cloud system converts a 2D logo image into an interactive 3D particle system that responds to mouse movement with organic floating and swaying animations.

## Core Concept
1. **Image Sampling**: Extract dark pixels from the logo image
2. **Particle Creation**: Convert each pixel into a 3D particle with randomized depth
3. **Animation**: Apply floating, swaying, and wind effects to each particle
4. **Rendering**: Use Three.js to render particles in real-time

---

## Step-by-Step Implementation

### 1. IMAGE LOADING
```javascript
function loadLogoImage() {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      logoImage = img;
      resolve(img);
    };
    img.onerror = (e) => reject(e);
    img.src = '/path-to-image.png';
  });
}
```
**Key Points:**
- Use `crossOrigin = 'anonymous'` for CORS compatibility
- Image must be accessible via HTTP (not file://)
- Store reference globally for later use

### 2. POINT CLOUD GENERATION
```javascript
function createPointCloud() {
  // Create temporary canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = CONFIG.logo.size;
  canvas.height = CONFIG.logo.size;

  // Draw image on canvas
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(logoImage, 0, 0, CONFIG.logo.size, CONFIG.logo.size);

  // Extract pixel data
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  // Sample pixels
  const positions = [];
  for (let y = 0; y < canvas.height; y += samplingStep) {
    for (let x = 0; x < canvas.width; x += samplingStep) {
      const i = (y * canvas.width + x) * 4;
      const r = imageData.data[i];
      const g = imageData.data[i + 1];
      const b = imageData.data[i + 2];
      const alpha = imageData.data[i + 3];
      const brightness = (r + g + b) / 3;

      // Include dark pixels with alpha
      if (alpha > 128 && brightness < 128) {
        positions.push({
          x: x - canvas.width / 2,
          y: -(y - canvas.height / 2),
          z: (Math.random() - 0.5) * depthRange
        });
      }
    }
  }
}
```
**Key Points:**
- **Sampling Step**: Controls particle density (1 = every pixel, 2 = every 2nd pixel)
- **Brightness Threshold**: `brightness < 128` captures dark pixels (logo)
- **Alpha Check**: `alpha > 128` ensures pixel is visible
- **Coordinate Transform**: Center coordinates at origin for proper 3D positioning

### 3. THREE.JS GEOMETRY SETUP
```javascript
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
  size: 2.5,
  transparent: true,
  opacity: 0.8,
  sizeAttenuation: true,
  depthTest: true,
  depthWrite: false
});

particleSystem = new THREE.Points(geometry, material);
scene.add(particleSystem);
```

### 4. ANIMATION SYSTEM
Each particle has:
- **Original Position**: Stored for reference
- **Phase Values**: Random offsets for animation variety
- **Speed Multiplier**: Individual animation speed
- **Wind Offsets**: Mouse interaction effects

```javascript
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
```

### 5. ANIMATION LOOP
```javascript
function animate() {
  requestAnimationFrame(animate);
  animationTime += floatSpeed;

  particles.forEach((particle, i) => {
    const time = animationTime * particle.speedMultiplier;

    // Floating motion (vertical sway)
    const floatOffsetY = Math.sin(time + particle.phaseY) * floatAmount;

    // Swaying motion (horizontal sway)
    const swayOffsetX = Math.cos(time * 0.7 + particle.phaseX) * swayAmount;

    // Mouse wind effect
    const dx = particle.originalX - mouseWorldX;
    const dy = particle.originalY - mouseWorldY;
    const distanceToMouse = Math.sqrt(dx * dx + dy * dy);

    if (distanceToMouse < mouseWindRadius) {
      const pushStrength = (1 - distanceToMouse / mouseWindRadius) * mouseWindStrength;
      const angle = Math.atan2(dy, dx);
      particle.windOffsetX += (Math.cos(angle) * pushStrength - particle.windOffsetX) * 0.15;
      particle.windOffsetY += (Math.sin(angle) * pushStrength - particle.windOffsetY) * 0.15;
    } else {
      particle.windOffsetX += (0 - particle.windOffsetX) * windReturnSpeed;
      particle.windOffsetY += (0 - particle.windOffsetY) * windReturnSpeed;
    }

    // Update position
    positions[i * 3] = particle.originalX + swayOffsetX + particle.windOffsetX;
    positions[i * 3 + 1] = particle.originalY + floatOffsetY + particle.windOffsetY;
    positions[i * 3 + 2] = particle.originalZ;
  });

  particleSystem.geometry.attributes.position.needsUpdate = true;
  renderer.render(scene, camera);
}
```

---

## Configuration Parameters

```javascript
const CONFIG = {
  logo: {
    size: 500,                    // Canvas size for sampling
    particleSize: 2.5,            // Particle visual size
    depthRange: 80,               // 3D depth variation
    floatSpeed: 0.001,            // Vertical animation speed
    floatAmount: 5,               // Vertical sway distance
    swayAmount: 4,                // Horizontal sway distance
    mouseWindRadius: 80,          // Mouse interaction radius
    mouseWindStrength: 25,        // Wind push strength
    windReturnSpeed: 0.08,        // Return to original speed
    samplingDensity: 1            // Pixel sampling (1=all, 2=every 2nd)
  }
};
```

---

## Replicating for Other Figures

### To create a point cloud for a new image:

1. **Prepare Image**
   - Ensure image is PNG with transparency
   - Place in accessible location (HTTP server)
   - Dark pixels = particles, light pixels = empty space

2. **Create New Function**
   ```javascript
   async function createFigurePointCloud(imagePath, configOverrides) {
     const img = await loadImage(imagePath);
     return createPointCloudFromImage(img, configOverrides);
   }
   ```

3. **Adjust Configuration**
   - `samplingDensity`: Increase for fewer particles (faster)
   - `particleSize`: Adjust for visual prominence
   - `floatAmount/swayAmount`: Control animation intensity

4. **Toggle Between Figures**
   - Create separate particle systems for each figure
   - Use visibility toggle to switch between them

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No particles appear | Check image brightness/alpha values |
| Particles too sparse | Decrease `samplingDensity` |
| Particles too dense | Increase `samplingDensity` |
| Animation too slow | Increase `floatSpeed` |
| Wind effect weak | Increase `mouseWindStrength` |
| Particles not responding to mouse | Check mouse tracking is enabled |


