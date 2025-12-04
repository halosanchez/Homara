// TREE PAGE: Interactive Tree with Grid Background
// Point cloud animation with mouse tracking

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
  tree: {
    size: 1024,                   // Match source image size (1024x1024) for maximum detail
    displayScale: 0.576,          // Scale to fit 590px display (590/1024 = 0.576)
    particleSize: 3.6,            // Slightly larger for better visibility
    depthRange: 25,               // Much tighter depth to prevent blob effect
    // ANIMATION SETTINGS - Continuous upward flow (tree shape stays intact)
    flowSpeed: 0.12,              // Even slower to reduce blur
    flowHeight: 8,                // Shorter travel to keep particles in branch lines
    flowTurbulence: 0.04,         // Minimal horizontal drift to maintain sharp branches
    // SLASHING WIND EFFECT (sword slash effect)
    slashWidth: 60,               // Width of the slash/cut zone (narrower)
    slashStrength: 20,            // How far particles are pushed away (subtle)
    slashSmoothness: 0.15,        // How quickly particles move (smooth)
    windReturnSpeed: 0.12,        // How quickly particles return to original position
    samplingDensity: 1,           // Sample every pixel for maximum detail
    // GROWTH ANIMATION SETTINGS
    saplingParticleRatio: 0.5,    // Show 50% of particles in sapling for denser appearance
    saplingHeightRange: [0.0, 0.45], // Show bottom 45% of tree height
    saplingTaperExtension: 150,   // Larger random upward extension (px) for gradual taper
    saplingTaperStart: 0.7,       // Start tapering from 70% of sapling height
    growthDuration: 10.0          // Growth animation duration in seconds
  }
};

// ===== GLOBAL STATE =====
let treeImageElement = null;
let mouseX = 0;
let mouseY = 0;
let prevMouseX = 0;
let prevMouseY = 0;
let mouseVelocityX = 0;
let mouseVelocityY = 0;
let scene, camera, renderer;
let particleSystem = null;
let treeImage = null;
let particles = [];
let animationTime = 0;
let showPointCloud = true;  // Always show point cloud
let isGrown = false;         // Track if tree has grown to adult
let flowAnimationEnabled = false; // Growth flow animation (triggered on click)
let saplingAnimationEnabled = true; // Sapling always animated from start!

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
    // Store previous position
    prevMouseX = mouseX;
    prevMouseY = mouseY;

    // Update current position
    mouseX = e.clientX;
    mouseY = e.clientY;

    // Calculate velocity (direction of movement)
    mouseVelocityX = mouseX - prevMouseX;
    mouseVelocityY = mouseY - prevMouseY;
  });
}

// ===== INPUT CONTROLS (Keyboard & Mouse) =====
function setupInputControls() {
  // Trigger tree growth ONLY when clicking the BUILD YOUR OWN box
  const buildTriggerBox = document.getElementById('build-trigger-box');

  if (buildTriggerBox) {
    console.log('✅ BUILD YOUR OWN trigger box found and click handler attached');

    buildTriggerBox.addEventListener('click', (e) => {
      console.log('🖱️ BUILD YOUR OWN box clicked!');

      if (!isGrown) {
        console.log('🌱 Starting tree growth animation...');

        // Hide the text box
        buildTriggerBox.classList.add('hidden');

        // Start growth animation
        growTree();
        console.log('🌱 Tree growth triggered by BUILD YOUR OWN box click');

        // Remove the box from DOM after 4 second fade out
        setTimeout(() => {
          buildTriggerBox.remove();
          console.log('🗑️ BUILD YOUR OWN box removed from DOM');
        }, 4000);
      } else {
        console.log('⚠️ Tree already grown, ignoring click');
      }
    });

    // Add hover effect logging for debugging
    buildTriggerBox.addEventListener('mouseenter', () => {
      console.log('🖱️ Mouse entered BUILD YOUR OWN box');
    });
  } else {
    console.warn('⚠️ BUILD YOUR OWN trigger box not found in DOM');
  }
}

function updateVisibility() {
  const pointCloudCanvas = document.getElementById('pointcloud-canvas');

  if (showPointCloud) {
    // Show point cloud
    if (pointCloudCanvas) {
      pointCloudCanvas.style.opacity = '1';
      pointCloudCanvas.style.pointerEvents = 'auto';
    }
    // Hide original tree
    if (treeImageElement) {
      treeImageElement.style.opacity = '0';
      treeImageElement.style.pointerEvents = 'none';
    }
    console.log('✅ Point cloud visible');
  } else {
    // Hide point cloud
    if (pointCloudCanvas) {
      pointCloudCanvas.style.opacity = '0';
      pointCloudCanvas.style.pointerEvents = 'none';
    }
    // Show original tree
    if (treeImageElement) {
      treeImageElement.style.opacity = '1';
      treeImageElement.style.pointerEvents = 'auto';
    }
    console.log('✅ Tree visible');
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

// ===== LOAD TREE IMAGE =====
function loadTreeImage() {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      console.log('✅ Tree image loaded successfully');
      treeImage = img;
      resolve(img);
    };
    img.onerror = (e) => {
      console.error('❌ Failed to load tree image:', e);
      reject(e);
    };
    console.log('Loading tree from: tree-transparent.png');
    img.src = 'tree-transparent.png';
  });
}

// ===== ROOT EXTENSION FUNCTION =====
// Creates wider, more radiating roots that spread outward for a grounded appearance
function extendRoots(positions) {
  const newParticles = [];

  // Find the bottom 15% of particles (root base area)
  const sortedByY = [...positions].sort((a, b) => a.y - b.y);
  const bottomThreshold = sortedByY[Math.floor(sortedByY.length * 0.15)].y;
  const rootBaseParticles = positions.filter(p => p.y <= bottomThreshold);

  // Find center of root base
  const centerX = rootBaseParticles.reduce((sum, p) => sum + p.x, 0) / rootBaseParticles.length;
  const centerZ = rootBaseParticles.reduce((sum, p) => sum + p.z, 0) / rootBaseParticles.length;

  // Select MORE starting points for wider root spread (but limit to prevent stack overflow)
  const rootStarts = rootBaseParticles.filter(() => Math.random() < 0.20);
  const maxRootStarts = 50; // Safety limit to prevent stack overflow
  const limitedRootStarts = rootStarts.slice(0, maxRootStarts);

  console.log(`Creating roots from ${limitedRootStarts.length} starting points (limited from ${rootStarts.length})`);

  // Create branching root structure for each starting point
  limitedRootStarts.forEach(startParticle => {
    // Calculate outward direction from center
    const outwardX = startParticle.x - centerX;
    const outwardZ = startParticle.z - centerZ;
    const outwardMag = Math.sqrt(outwardX * outwardX + outwardZ * outwardZ) || 1;

    createRootBranch(startParticle, newParticles, 0, 1.0, outwardX / outwardMag, outwardZ / outwardMag);
  });

  return newParticles;
}

// Recursive function to create a single branching root with outward bias
function createRootBranch(startPos, particleArray, depth, thickness, biasX, biasZ) {
  // Safety check to prevent infinite recursion (reduced from 3 to 2 for safety)
  if (depth >= 2 || thickness < 0.2 || particleArray.length > 100000) {
    return;
  }

  const branchLength = 50 + Math.random() * 70; // Longer roots for wider spread
  const segments = Math.floor(branchLength / 4);

  // Direction: STRONGLY outward and down (wider root system)
  let angleX = biasX * 1.2 + (Math.random() - 0.5) * 0.4; // Strong horizontal spread
  let angleY = -0.6 - Math.random() * 0.3; // Less downward, more outward
  let angleZ = biasZ * 1.2 + (Math.random() - 0.5) * 0.4; // 3D outward spread

  let currentX = startPos.x;
  let currentY = startPos.y;
  let currentZ = startPos.z;

  // Draw this root segment with curves
  for (let i = 0; i < segments; i++) {
    const progress = i / segments;

    // Add organic curves and irregularities
    angleX += (Math.random() - 0.5) * 0.25;
    angleY += (Math.random() - 0.5) * 0.15;
    angleZ += (Math.random() - 0.5) * 0.25;

    // Move along the root with outward emphasis
    currentX += angleX * 3.5;
    currentY += angleY * 3;
    currentZ += angleZ * 3.5;

    // Thickness decreases along the root (tapering) - LESS dense
    const currentThickness = thickness * (1 - progress * 0.5);
    const particlesInRing = Math.max(1, Math.floor(currentThickness * 4)); // Reduced from 6

    // Create particles around this point (gives thickness) - more sparse
    for (let p = 0; p < particlesInRing; p++) {
      const spreadRadius = currentThickness * 1.5; // Tighter spread
      const xSpread = (Math.random() - 0.5) * spreadRadius;
      const zSpread = (Math.random() - 0.5) * spreadRadius;

      particleArray.push({
        x: currentX + xSpread,
        y: currentY,
        z: currentZ + zSpread
      });
    }
  }

  // Chance to branch (split into sub-roots) - more branching for complexity
  // Reduced depth check from 2 to 1 for safety
  if (depth < 1 && Math.random() < 0.35 && particleArray.length < 80000) {
    const numBranches = Math.random() < 0.7 ? 2 : 3; // Usually 2, sometimes 3

    for (let b = 0; b < numBranches; b++) {
      const branchStart = {
        x: currentX + (Math.random() - 0.5) * 15,
        y: currentY,
        z: currentZ + (Math.random() - 0.5) * 15
      };

      // Sub-branches maintain outward direction with variation
      const newBiasX = angleX + (Math.random() - 0.5) * 0.5;
      const newBiasZ = angleZ + (Math.random() - 0.5) * 0.5;

      // Sub-branches are thinner
      createRootBranch(branchStart, particleArray, depth + 1, thickness * 0.6, newBiasX, newBiasZ);
    }
  }
}

// ===== BRANCH EXTENSION FUNCTION =====
// Extends branches outward with more spread, variation, and natural irregularity
function extendBranches(positions) {
  const newParticles = [];

  // Find center of tree mass
  const centerX = positions.reduce((sum, p) => sum + p.x, 0) / positions.length;
  const centerY = positions.reduce((sum, p) => sum + p.y, 0) / positions.length;

  // Find Y bounds
  const sortedByY = [...positions].sort((a, b) => a.y - b.y);
  const minY = sortedByY[0].y;
  const maxY = sortedByY[sortedByY.length - 1].y;
  const treeHeight = maxY - minY;

  // Focus on WIDER range 30-80% of tree height for more branching throughout
  const middleStart = minY + treeHeight * 0.3;
  const middleEnd = minY + treeHeight * 0.8;

  // Find particles in middle section
  const middleParticles = positions.filter(p => p.y >= middleStart && p.y <= middleEnd);

  // Find outer particles (branch tips) in middle section
  const particlesWithDistance = middleParticles.map(p => {
    const dx = p.x - centerX;
    const dy = p.y - centerY;
    return {
      particle: p,
      distance: Math.sqrt(dx * dx + dy * dy),
      angle: Math.atan2(dy, dx)
    };
  });

  // Sort by distance and take only the outer 25% (more branch tips)
  particlesWithDistance.sort((a, b) => b.distance - a.distance);
  const outerParticles = particlesWithDistance.slice(0, Math.floor(middleParticles.length * 0.25));

  // For each outer particle, find nearby particles to determine branch direction
  const branchTips = outerParticles.map(({ particle }) => {
    // Find particles near this one (within 15px)
    const nearby = middleParticles.filter(p => {
      const dist = Math.sqrt(
        Math.pow(p.x - particle.x, 2) +
        Math.pow(p.y - particle.y, 2) +
        Math.pow(p.z - particle.z, 2)
      );
      return dist > 0 && dist < 15;
    });

    if (nearby.length === 0) return null;

    // Calculate average direction FROM nearby particles TO this tip
    let avgDx = 0, avgDy = 0, avgDz = 0;
    nearby.forEach(p => {
      avgDx += particle.x - p.x;
      avgDy += particle.y - p.y;
      avgDz += particle.z - p.z;
    });
    avgDx /= nearby.length;
    avgDy /= nearby.length;
    avgDz /= nearby.length;

    // Normalize direction
    const magnitude = Math.sqrt(avgDx * avgDx + avgDy * avgDy + avgDz * avgDz);
    if (magnitude === 0) return null;

    return {
      particle,
      directionX: avgDx / magnitude,
      directionY: avgDy / magnitude,
      directionZ: avgDz / magnitude
    };
  }).filter(tip => tip !== null);

  // Sample MORE tips to extend (20% instead of 15%) for fuller branching
  const sampled = branchTips.filter(() => Math.random() < 0.20);

  sampled.forEach(({ particle, directionX, directionY, directionZ }) => {
    let currentX = particle.x;
    let currentY = particle.y;
    let currentZ = particle.z;

    // VARIABLE extension length for natural variation (30-60px)
    const extensionLength = 30 + Math.random() * 30;
    const extensionSegments = Math.floor(extensionLength / 3);
    const segmentLength = 3;

    // Add outward bias to spread branches horizontally
    const outwardBiasX = (particle.x - centerX) / Math.abs(particle.x - centerX || 1) * 0.3;
    const outwardBiasZ = (Math.random() - 0.5) * 0.2;

    for (let i = 1; i <= extensionSegments; i++) {
      const progress = i / extensionSegments;

      // Add MORE organic curve and irregularity
      const curveX = (Math.random() - 0.5) * 0.4;
      const curveY = (Math.random() - 0.5) * 0.3;
      const curveZ = (Math.random() - 0.5) * 0.4;

      // Move along branch direction with OUTWARD bias and variation
      currentX += (directionX + outwardBiasX) * segmentLength + curveX;
      currentY += (directionY - 0.1) * segmentLength + curveY; // Slight downward droop
      currentZ += (directionZ + outwardBiasZ) * segmentLength + curveZ;

      // VERY sparse density to keep branches as clean lines
      const density = Math.pow(1 - progress, 2.0) * 0.4; // Much less dense

      // Only add particles based on probability (very sparse, line-like branches)
      if (Math.random() < density) {
        const particlesAtSegment = 1; // Single particle only - no clustering

        for (let p = 0; p < particlesAtSegment; p++) {
          // EXTREMELY tight spread - almost no deviation from branch line
          const spread = (1 - progress) * 0.5; // Half the previous spread

          newParticles.push({
            x: currentX + (Math.random() - 0.5) * spread,
            y: currentY + (Math.random() - 0.5) * spread,
            z: currentZ + (Math.random() - 0.5) * spread * 0.3 // Even tighter in Z
          });
        }
      }
    }
  });

  return newParticles;
}

// ===== CREATE POINT CLOUD FROM TREE =====
function createPointCloud() {
  if (!treeImage) {
    console.error('❌ Tree image not loaded yet');
    return null;
  }

  console.log('🔄 Creating point cloud from tree:', treeImage.width, 'x', treeImage.height);

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = CONFIG.tree.size;
  canvas.height = CONFIG.tree.size;

  // Fill with white background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw the tree image
  ctx.drawImage(treeImage, 0, 0, CONFIG.tree.size, CONFIG.tree.size);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  const positions = [];
  const samplingStep = CONFIG.tree.samplingDensity;

  // Sample pixels to create point cloud
  for (let y = 0; y < canvas.height; y += samplingStep) {
    for (let x = 0; x < canvas.width; x += samplingStep) {
      const i = (y * canvas.width + x) * 4;

      const r = imageData.data[i];
      const g = imageData.data[i + 1];
      const b = imageData.data[i + 2];
      const alpha = imageData.data[i + 3];

      const brightness = (r + g + b) / 3;

      // Include pixels that are dark (part of tree) and have alpha
      // Threshold at 128 for more defined, solid branches
      if (alpha > 128 && brightness < 128) {
        const posX = x - canvas.width / 2;
        const posY = -(y - canvas.height / 2);

        // EXTREMELY tight depth for ALL branches - almost 2D to prevent blob
        // Y ranges from -512 (bottom) to +512 (top) for 1024px image
        const normalizedY = (posY + 512) / 1024; // 0 (bottom) to 1 (top)

        // Progressive depth reduction: only trunk base has depth, ALL branches are nearly flat
        let depthMultiplier;
        if (normalizedY > 0.5) {
          depthMultiplier = 0.12; // Upper branches: almost completely 2D
        } else if (normalizedY > 0.3) {
          depthMultiplier = 0.18; // Mid-lower branches: extremely tight
        } else if (normalizedY > 0.15) {
          depthMultiplier = 0.4;  // Lower trunk: moderate depth
        } else {
          depthMultiplier = 1.0;  // Trunk base only: full depth
        }

        const posZ = (Math.random() - 0.5) * CONFIG.tree.depthRange * depthMultiplier;

        positions.push({ x: posX, y: posY, z: posZ });

        // REMOVED extra density - keep branches clean and defined
        // (No extra particles in branch areas)
      }
    }
  }

  if (positions.length === 0) {
    console.warn('⚠️ No particles created - tree might be too light or transparent');
    return null;
  }

  console.log(`✅ Created point cloud with ${positions.length} particles`);

  // ===== EXTEND ROOTS =====
  // Find particles at the bottom (roots area) and extend some of them downward
  try {
    const rootExtensions = extendRoots(positions);
    positions.push(...rootExtensions);
    console.log(`🌱 Added ${rootExtensions.length} root extension particles`);
  } catch (error) {
    console.error('❌ Error creating roots:', error);
    console.log('⚠️ Continuing without root extensions');
  }

  // ===== EXTEND BRANCHES =====
  // Extend branch tips outward by 30px
  try {
    const branchExtensions = extendBranches(positions);
    positions.push(...branchExtensions);
    console.log(`🌿 Added ${branchExtensions.length} branch extension particles`);
  } catch (error) {
    console.error('❌ Error extending branches:', error);
    console.log('⚠️ Continuing without branch extensions');
  }

  // Calculate tree bounds
  const minY = Math.min(...positions.map(p => p.y));
  const maxY = Math.max(...positions.map(p => p.y));
  const treeHeight = maxY - minY;

  // Sapling cutoff: bottom 45% of tree
  const saplingMaxY = minY + (treeHeight * CONFIG.tree.saplingHeightRange[1]);

  // Filter particles in sapling height range
  const saplingCandidates = positions.filter(pos => pos.y <= saplingMaxY);

  // Randomly select a subset for sparse sapling (25% of candidates)
  const saplingParticleCount = Math.floor(saplingCandidates.length * CONFIG.tree.saplingParticleRatio);
  const shuffled = [...saplingCandidates].sort(() => Math.random() - 0.5);
  const saplingParticleSet = new Set(shuffled.slice(0, saplingParticleCount));

  // ===== IDENTIFY TOP EDGE PARTICLES AND EXTEND THEM =====
  // Find particles in the taper zone (top 30% of sapling height)
  const taperStartY = minY + (treeHeight * CONFIG.tree.saplingHeightRange[1] * CONFIG.tree.saplingTaperStart);
  const topEdgeParticles = Array.from(saplingParticleSet).filter(pos => pos.y >= taperStartY);

  // Create a map to store Y-extensions for top particles
  const particleExtensions = new Map();
  topEdgeParticles.forEach(pos => {
    // Calculate how close to the top (0 = at taperStart, 1 = at cutoff)
    const taperProgress = (pos.y - taperStartY) / (saplingMaxY - taperStartY);
    // More extension for particles closer to the top
    const maxExtension = CONFIG.tree.saplingTaperExtension * taperProgress;
    const extension = Math.random() * maxExtension;
    particleExtensions.set(pos, extension);
  });

  console.log(`🌿 Extending ${topEdgeParticles.length} top particles with gradual taper`);

  // Create particle data - ALL at final positions
  particles = positions.map(pos => {
    // Final position (all particles here)
    const finalX = pos.x * CONFIG.tree.displayScale;
    let finalY = pos.y * CONFIG.tree.displayScale;
    const finalZ = pos.z * CONFIG.tree.displayScale;

    // Check if this particle is visible in sapling
    const isSaplingParticle = saplingParticleSet.has(pos);

    // Apply Y-extension if this is a top edge particle
    if (particleExtensions.has(pos)) {
      finalY += particleExtensions.get(pos) * CONFIG.tree.displayScale;
    }

    // Calculate normalized Y for bottom-to-top growth (0 = bottom, 1 = top)
    const normalizedY = (pos.y + 512) / 1024;

    // Calculate distance from center (trunk) - for branch growth
    // Horizontal distance from center axis
    const distanceFromCenter = Math.sqrt(pos.x * pos.x + pos.z * pos.z);

    // Normalize distance (0 = center/trunk, 1 = outer branches)
    // Max distance is roughly 512 pixels (half width of image)
    const normalizedDistance = Math.min(distanceFromCenter / 512, 1.0);

    // Growth order: combine height (bottom-to-top) and distance (center-to-edge)
    // Lower values grow first - upside down V (^) starting from roots
    // Weight: 60% height, 40% distance (so bottom center grows first, then up and out)
    const growthOrder = normalizedY * 0.6 + normalizedDistance * 0.4;

    return {
      // Final positions (all particles at final position)
      originalX: finalX,
      originalY: finalY,
      originalZ: finalZ,
      // Growth properties
      isSaplingParticle,
      growthOrder, // Store for trunk-to-branch growth animation
      currentOpacity: isSaplingParticle ? 1.0 : 0.0, // Sapling visible, rest hidden
      targetOpacity: 1.0, // Target opacity for growth animation
      // Animation properties
      phaseY: Math.random() * Math.PI * 2,
      phaseX: Math.random() * Math.PI * 2,
      speedMultiplier: 0.8 + Math.random() * 0.4,
      windOffsetX: 0,
      windOffsetY: 0,
      flowOffset: Math.random() * CONFIG.tree.flowHeight,
      driftX: (Math.random() - 0.5) * CONFIG.tree.flowTurbulence,
      driftZ: (Math.random() - 0.5) * CONFIG.tree.flowTurbulence
    };
  });

  // Create Three.js geometry - all at final positions
  const geometry = new THREE.BufferGeometry();
  const positionsArray = new Float32Array(particles.length * 3);
  const opacityArray = new Float32Array(particles.length);

  particles.forEach((particle, i) => {
    // All particles at final position
    positionsArray[i * 3] = particle.originalX;
    positionsArray[i * 3 + 1] = particle.originalY;
    positionsArray[i * 3 + 2] = particle.originalZ;

    // Opacity: 1 for sapling particles, 0 for hidden
    opacityArray[i] = particle.currentOpacity;
  });

  geometry.setAttribute('position', new THREE.BufferAttribute(positionsArray, 3));
  geometry.setAttribute('opacity', new THREE.BufferAttribute(opacityArray, 1));

  // Create custom shader material for per-particle opacity
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthTest: true,
    depthWrite: false,
    vertexShader: `
      attribute float opacity;
      varying float vOpacity;

      void main() {
        vOpacity = opacity;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = ${CONFIG.tree.particleSize.toFixed(1)} * (300.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying float vOpacity;

      void main() {
        if (vOpacity < 0.01) discard; // Don't render invisible particles

        // Circular point shape
        vec2 center = gl_PointCoord - vec2(0.5);
        float dist = length(center);
        if (dist > 0.5) discard;

        // Very dark gray - slightly lighter than pure black (RGB: 25, 25, 25)
        vec3 particleColor = vec3(0.1, 0.1, 0.1);
        gl_FragColor = vec4(particleColor, vOpacity);
      }
    `
  });

  // Create and add point cloud to scene
  particleSystem = new THREE.Points(geometry, material);
  scene.add(particleSystem);

  console.log('✅ Point cloud added to scene');
  return particleSystem;
}

// ===== GROWTH ANIMATION =====
function growTree() {
  if (isGrown) return; // Already grown

  console.log('🌱 Starting tree growth animation...');
  isGrown = true;
  saplingAnimationEnabled = false; // Stop sapling animation
  flowAnimationEnabled = true; // Start full tree flow animation

  const startTime = performance.now();
  const duration = CONFIG.tree.growthDuration * 1000; // Convert to milliseconds

  function animateGrowth() {
    const elapsed = performance.now() - startTime;
    const progress = Math.min(elapsed / duration, 1.0);

    if (!particleSystem || particles.length === 0) return;

    const opacityArray = particleSystem.geometry.attributes.opacity.array;

    particles.forEach((particle, i) => {
      if (particle.isSaplingParticle) {
        // Sapling stays visible
        particle.currentOpacity = 1.0;
      } else {
        // Trunk-to-branch growth: particles fade in based on growthOrder
        // Growth wave moves from 0 (bottom/center) to 1 (top/edges)
        // Add a fade range so particles fade in smoothly
        const fadeRange = 0.25; // 25% fade range for smooth transitions
        const growthWave = progress * (1.0 + fadeRange); // Wave position

        // Calculate how far this particle is from the growth wave
        const distanceFromWave = growthWave - particle.growthOrder;

        // Fade in when wave reaches this particle
        if (distanceFromWave < 0) {
          // Wave hasn't reached this particle yet
          particle.currentOpacity = 0.0;
        } else if (distanceFromWave < fadeRange) {
          // Particle is in the fade zone - gradually appear
          particle.currentOpacity = distanceFromWave / fadeRange;
        } else {
          // Wave has passed - fully visible
          particle.currentOpacity = 1.0;
        }
      }

      // Update opacity attribute
      opacityArray[i] = particle.currentOpacity;
    });

    particleSystem.geometry.attributes.opacity.needsUpdate = true;

    if (progress < 1.0) {
      requestAnimationFrame(animateGrowth);
    } else {
      console.log('✅ Tree growth complete!');
      // Make sure all particles are fully visible
      particles.forEach((particle, i) => {
        particle.currentOpacity = 1.0;
        opacityArray[i] = 1.0;
      });
      particleSystem.geometry.attributes.opacity.needsUpdate = true;
    }
  }

  animateGrowth();
}

// ===== ANIMATION LOOP =====
function animate() {
  requestAnimationFrame(animate);

  // Sapling animation - only animates sapling particles before growth
  const updateSaplingAnimation = (particleSystem, particleArray) => {
    if (!particleSystem || particleArray.length === 0) return;
    if (!saplingAnimationEnabled) return; // Only run before growth

    const positions = particleSystem.geometry.attributes.position.array;

    // Calculate mouse position in world coordinates
    const mouseWorldX = mouseX - window.innerWidth / 2;
    const mouseWorldY = -(mouseY - window.innerHeight / 2);

    // Initialize sapling flow state (do once)
    if (!particleArray.saplingFlowInitialized) {
      particleArray.saplingFlowInitialized = true;

      particleArray.forEach((particle) => {
        if (particle.isSaplingParticle) {
          // Initialize flow properties for sapling particles
          if (particle.flowOffset === undefined) {
            particle.flowOffset = Math.random() * CONFIG.tree.flowHeight;
          }
          if (particle.driftX === undefined) {
            particle.driftX = (Math.random() - 0.5) * CONFIG.tree.flowTurbulence;
          }
          if (particle.driftZ === undefined) {
            particle.driftZ = (Math.random() - 0.5) * CONFIG.tree.flowTurbulence;
          }
        }
      });
    }

    // Animate ONLY sapling particles
    particleArray.forEach((particle, i) => {
      if (particle.isSaplingParticle) {
        // Move upward
        particle.flowOffset += CONFIG.tree.flowSpeed;

        // When particle reaches max height, respawn at bottom
        if (particle.flowOffset >= CONFIG.tree.flowHeight) {
          particle.flowOffset = 0;
          // New random drift direction
          particle.driftX = (Math.random() - 0.5) * CONFIG.tree.flowTurbulence;
          particle.driftZ = (Math.random() - 0.5) * CONFIG.tree.flowTurbulence;
        }

        // Sword slash effect - push particles in the direction the sword (mouse) is moving
        const dx = particle.originalX - mouseWorldX;
        const dy = particle.originalY - mouseWorldY;
        const distanceToMouse = Math.sqrt(dx * dx + dy * dy);

        // Only affect particles within the slash zone
        if (distanceToMouse < CONFIG.tree.slashWidth) {
          // Calculate velocity magnitude
          const velocityMag = Math.sqrt(mouseVelocityX * mouseVelocityX + mouseVelocityY * mouseVelocityY);

          if (velocityMag > 0.5) { // Only slash if mouse is moving
            // Normalize velocity to get slash direction
            const slashDirX = mouseVelocityX / velocityMag;
            const slashDirY = mouseVelocityY / velocityMag;

            // Push strength based on distance
            const pushStrength = (1 - distanceToMouse / CONFIG.tree.slashWidth) * CONFIG.tree.slashStrength;

            // Push particles in the direction the sword is moving
            const pushX = slashDirX * pushStrength;
            const pushY = slashDirY * pushStrength;

            particle.windOffsetX += (pushX - particle.windOffsetX) * CONFIG.tree.slashSmoothness;
            particle.windOffsetY += (pushY - particle.windOffsetY) * CONFIG.tree.slashSmoothness;
          } else {
            // No movement, return to original
            particle.windOffsetX += (0 - particle.windOffsetX) * CONFIG.tree.windReturnSpeed;
            particle.windOffsetY += (0 - particle.windOffsetY) * CONFIG.tree.windReturnSpeed;
          }
        } else {
          // Outside slash zone, return to original position
          particle.windOffsetX += (0 - particle.windOffsetX) * CONFIG.tree.windReturnSpeed;
          particle.windOffsetY += (0 - particle.windOffsetY) * CONFIG.tree.windReturnSpeed;
        }

        // Update position (rises from original position + wind effect)
        positions[i * 3] = particle.originalX + particle.driftX + particle.windOffsetX;
        positions[i * 3 + 1] = particle.originalY + particle.flowOffset + particle.windOffsetY;
        positions[i * 3 + 2] = particle.originalZ + particle.driftZ;
      }
    });

    particleSystem.geometry.attributes.position.needsUpdate = true;
  };

  // Full tree flow animation - runs after growth is triggered
  const updateFullTreeFlow = (particleSystem, particleArray) => {
    if (!particleSystem || particleArray.length === 0) return;
    if (!flowAnimationEnabled) return; // Only run after growth

    const positions = particleSystem.geometry.attributes.position.array;

    // Calculate mouse position in world coordinates
    const mouseWorldX = mouseX - window.innerWidth / 2;
    const mouseWorldY = -(mouseY - window.innerHeight / 2);

    // Initialize particle flow state (do once)
    if (!particleArray.flowInitialized) {
      particleArray.flowInitialized = true;

      particleArray.forEach((particle) => {
        // Initialize ALL particles for full tree flow
        if (particle.flowOffset === undefined) {
          particle.flowOffset = Math.random() * CONFIG.tree.flowHeight;
        }
        if (particle.driftX === undefined) {
          particle.driftX = (Math.random() - 0.5) * CONFIG.tree.flowTurbulence;
        }
        if (particle.driftZ === undefined) {
          particle.driftZ = (Math.random() - 0.5) * CONFIG.tree.flowTurbulence;
        }
      });
    }

    // Animate ALL particles
    particleArray.forEach((particle, i) => {
      // Move upward
      particle.flowOffset += CONFIG.tree.flowSpeed;

      // When particle reaches max height, respawn at bottom
      if (particle.flowOffset >= CONFIG.tree.flowHeight) {
        particle.flowOffset = 0;
        // New random drift direction
        particle.driftX = (Math.random() - 0.5) * CONFIG.tree.flowTurbulence;
        particle.driftZ = (Math.random() - 0.5) * CONFIG.tree.flowTurbulence;
      }

      // Sword slash effect - push particles in the direction the sword (mouse) is moving
      const dx = particle.originalX - mouseWorldX;
      const dy = particle.originalY - mouseWorldY;
      const distanceToMouse = Math.sqrt(dx * dx + dy * dy);

      // Only affect particles within the slash zone
      if (distanceToMouse < CONFIG.tree.slashWidth) {
        // Calculate velocity magnitude
        const velocityMag = Math.sqrt(mouseVelocityX * mouseVelocityX + mouseVelocityY * mouseVelocityY);

        if (velocityMag > 0.5) { // Only slash if mouse is moving
          // Normalize velocity to get slash direction
          const slashDirX = mouseVelocityX / velocityMag;
          const slashDirY = mouseVelocityY / velocityMag;

          // Push strength based on distance
          const pushStrength = (1 - distanceToMouse / CONFIG.tree.slashWidth) * CONFIG.tree.slashStrength;

          // Push particles in the direction the sword is moving
          const pushX = slashDirX * pushStrength;
          const pushY = slashDirY * pushStrength;

          particle.windOffsetX += (pushX - particle.windOffsetX) * CONFIG.tree.slashSmoothness;
          particle.windOffsetY += (pushY - particle.windOffsetY) * CONFIG.tree.slashSmoothness;
        } else {
          // No movement, return to original
          particle.windOffsetX += (0 - particle.windOffsetX) * CONFIG.tree.windReturnSpeed;
          particle.windOffsetY += (0 - particle.windOffsetY) * CONFIG.tree.windReturnSpeed;
        }
      } else {
        // Outside slash zone, return to original position
        particle.windOffsetX += (0 - particle.windOffsetX) * CONFIG.tree.windReturnSpeed;
        particle.windOffsetY += (0 - particle.windOffsetY) * CONFIG.tree.windReturnSpeed;
      }

      // Update position (rises from original position + wind effect)
      positions[i * 3] = particle.originalX + particle.driftX + particle.windOffsetX;
      positions[i * 3 + 1] = particle.originalY + particle.flowOffset + particle.windOffsetY;
      positions[i * 3 + 2] = particle.originalZ + particle.driftZ;
    });

    particleSystem.geometry.attributes.position.needsUpdate = true;
  };

  // Run appropriate animation based on state
  if (saplingAnimationEnabled) {
    updateSaplingAnimation(particleSystem, particles);
  } else if (flowAnimationEnabled) {
    updateFullTreeFlow(particleSystem, particles);
  }

  // Always render the scene
  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}

// ===== INITIALIZATION =====
async function init() {
  try {
    console.log('🚀 Initializing Tree Page...');

    // Step 1: Create background grid
    createBackgroundGrid();
    console.log('✅ Grid created');

    // Step 2: Setup tree image element
    treeImageElement = document.getElementById('logo-image');
    if (!treeImageElement) {
      console.error('❌ Tree image element not found in DOM');
      return;
    }
    treeImageElement.src = 'tree-transparent.png';
    console.log('✅ Tree element set');

    // Step 3: Setup input handlers
    setupMouseTracking();
    console.log('✅ Mouse tracking enabled');

    setupInputControls();
    console.log('✅ Input controls enabled (click BUILD YOUR OWN box to grow tree)');

    // Step 4: Initialize Three.js
    initThreeJS();
    console.log('✅ Three.js initialized');

    // Step 5: Load tree image
    try {
      await loadTreeImage();
      console.log('✅ Tree image loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load tree image:', error);
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

    console.log('✅ Tree Page Fully Initialized');
    console.log('🌱 Tree starts as a SAPLING - Click "BUILD YOUR OWN" to watch it GROW!');
    console.log('🖱️ After growth, particles will flow upward continuously');

  } catch (error) {
    console.error('❌ Failed to initialize tree page:', error);
    console.error(error.stack);
  }
}

console.log('Script loaded, waiting for DOM...');
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

