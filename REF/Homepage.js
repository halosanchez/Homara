// ABOUTME: Home page JavaScript that creates the navigation menu and handles page routing
// ABOUTME: Navigation pages load in same tab, Launch Homara button opens application in new tab

import UrlManager from '../../Services/UrlManager.js';
import { DatabaseService } from '../../Services/DatabaseService.js';
import ServiceWorkerManager from '../../Services/ServiceWorkerManager.js';

// Global state
let preloadComplete = false;
let preloadInProgress = false;
let swManager = null;
let worker = null;

document.addEventListener('DOMContentLoaded', function() {
  initializeHomePage();
});

async function initializeHomePage() {
  const app = document.getElementById('app');

  // Initialize UrlManager and log simulated URL
  console.log('[Homepage] Initializing...');
  console.log('[Homepage] Current simulated URL:', UrlManager.getSimulatedURL());

  // Detect mobile devices and small screens
  const isMobileOS = /iPhone|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isSmallScreen = window.innerWidth < 768;
  const isMobile = isMobileOS || isSmallScreen;

  if (isMobile) {
    console.log('[Homepage] Mobile device detected - showing mobile message');
    showMobileMessage(app);
    return; // Skip Service Worker, preloading, and normal UI
  }

  // Initialize Service Worker
  swManager = new ServiceWorkerManager();
  await swManager.register();

  // Create navigation menu
  const navMenu = document.createElement('nav');
  navMenu.className = 'nav-menu';

  const menuItems = [
    { text: 'Apply', url: '/src/Website/Apply/Apply.html' },
    { text: 'Build', url: '/src/Website/Build/build.html' },
    { text: 'Shop', url: '/src/Website/Shop/shop.html' },
    { text: 'Newsletter', url: '/src/Website/Newsletter/newsletter.html' },
    { text: 'Our Journey', url: '/src/Website/Journey/journey.html' }
  ];

  menuItems.forEach((item, index) => {
    const link = document.createElement('a');
    link.className = 'nav-item';
    link.textContent = item.text;
    link.href = item.url;
    // Ensure links open in same tab
    link.target = '_self';

    navMenu.appendChild(link);

    if (index < menuItems.length - 1) {
      const separator = document.createElement('span');
      separator.className = 'nav-separator';
      separator.textContent = '|';
      navMenu.appendChild(separator);
    }
  });

  app.appendChild(navMenu);

  // Create Homara logo in top right corner
  const logoImg = document.createElement('img');
  logoImg.src = '/assets/images/BlackLogo.png';
  logoImg.className = 'homara-logo';
  logoImg.alt = 'Homara Logo';
  app.appendChild(logoImg);

  // Create Launch Homara button
  const launchButton = document.createElement('button');
  launchButton.className = 'launch-button';
  launchButton.textContent = 'Launch Homara';
  launchButton.addEventListener('click', () => {
    console.log('[Homepage] Launch Homara clicked!');

    // Get community name from URL or use default
    let communityName = UrlManager.getCommunityNameFromURL();
    if (!communityName || communityName === '') {
      communityName = UrlManager.getDefaultCommunity();
    }

    console.log('[Homepage] Launching community:', communityName);

    // Update simulated URL to include community name
    UrlManager.setSimulatedURL(`${UrlManager.productionBaseURL}/${communityName}`);
    console.log('[Homepage] Updated simulated URL:', UrlManager.getSimulatedURL());

    // Open viewer in new tab with community parameter
    const viewerURL = `/viewer.html?community=${encodeURIComponent(communityName)}`;
    console.log('[Homepage] Opening viewer:', viewerURL);
    window.open(viewerURL, '_blank');
  });

  app.appendChild(launchButton);

  // Create video container
  createVideoContainer(app);

  // Create hover text
  createHoverText(app);

  // Start preloading pointcloud in background
  startPreloading();
}

/**
 * Create and configure the video container
 * @param {HTMLElement} container - Parent container to append video to
 */
function createVideoContainer(container) {
  // Video configuration - easily adjustable
  const videoConfig = {
    position: 'bottom-right', // Position: 'bottom-right', 'middle-right', 'top-right', etc.
    x: 0,         // Distance from right edge in pixels
    y: 0,         // Distance from bottom edge in pixels (0 = bottom aligned with screen)
    width: 750,   // Video width in pixels
    height: window.innerHeight - 100,  // Full viewport height + 100px
    fadeDelay: 500, // Delay before fade-in starts (ms)
    playbackRate: 0.7 // Playback speed
  };

  // Create video container
  const videoContainer = document.createElement('div');
  videoContainer.className = 'video-container';

  // Apply custom positioning via CSS variables
  videoContainer.style.setProperty('--video-width', `${videoConfig.width}px`);
  videoContainer.style.setProperty('--video-height', `${videoConfig.height}px`);

  // Position in bottom-right corner
  videoContainer.style.right = `${videoConfig.x}px`;
  videoContainer.style.bottom = `${videoConfig.y}px`;
  videoContainer.style.top = 'auto';
  videoContainer.style.transform = 'none';

  // Create video element
  const video = document.createElement('video');
  video.src = '/assets/videos/whitefire1.mov';
  video.autoplay = true;
  video.loop = true;
  video.muted = true;
  video.playsInline = true;
  video.playbackRate = videoConfig.playbackRate;

  videoContainer.appendChild(video);

  // Create overlay text on video
  const videoOverlayText = document.createElement('div');
  videoOverlayText.className = 'video-overlay-text';
  videoOverlayText.textContent = 'homara loves you';
  videoContainer.appendChild(videoOverlayText);

  container.appendChild(videoContainer);

  // Trigger fade-in after delay
  setTimeout(() => {
    videoContainer.classList.add('fade-in');

    // Fade in button and text 200ms after video
    setTimeout(() => {
      const launchButton = document.querySelector('.launch-button');
      const textGlowOverlay = document.querySelector('.text-glow-overlay');
      if (launchButton) launchButton.classList.add('fade-in');
      if (textGlowOverlay) textGlowOverlay.classList.add('fade-in');

      // Fade in menu 100ms after button/text (300ms total after video)
      setTimeout(() => {
        const navMenu = document.querySelector('.nav-menu');
        if (navMenu) navMenu.classList.add('fade-in');

        // Fade in logo 200ms after menu (500ms total after video)
        setTimeout(() => {
          const logo = document.querySelector('.homara-logo');
          if (logo) logo.classList.add('fade-in');
        }, 200);
      }, 100);
    }, 200);
  }, videoConfig.fadeDelay);

  console.log('[Homepage] Video container created with config:', videoConfig);
}

/**
 * Create and configure the hover text with fire flicker effect
 * @param {HTMLElement} container - Parent container to append text to
 */
function createHoverText(container) {
  // Create text glow overlay
  const textGlowOverlay = document.createElement('div');
  textGlowOverlay.className = 'text-glow-overlay';

  const textGlowContent = document.createElement('div');
  textGlowContent.className = 'text-glow-content';
  textGlowContent.textContent = 'FIND YOUR COMMUNITY';

  textGlowOverlay.appendChild(textGlowContent);
  container.appendChild(textGlowOverlay);

  // Add hover listeners to video container to trigger text glow
  const videoContainer = document.querySelector('.video-container');
  if (videoContainer) {
    videoContainer.addEventListener('mouseenter', () => {
      textGlowOverlay.classList.add('video-hovered');
    });
    videoContainer.addEventListener('mouseleave', () => {
      textGlowOverlay.classList.remove('video-hovered');
    });
  }

  console.log('[Homepage] Hover text created');
}

/**
 * Start preloading pointcloud data in background
 */
async function startPreloading() {
  if (preloadInProgress || preloadComplete) {
    return;
  }

  preloadInProgress = true;

  try {
    // Get community name from URL or use default
    let communityName = UrlManager.getCommunityNameFromURL();
    if (!communityName || communityName === '') {
      communityName = UrlManager.getDefaultCommunity();
    }

    const lod = 'medium';
    const shape = 'tree';

    console.log(`[Homepage] Detected community from URL: ${communityName}`);
    console.log(`[Homepage] Starting pointcloud preload for: ${communityName}`);

    // Check if already cached
    const cacheStatus = await swManager.checkCache(communityName, lod);
    if (cacheStatus.exists) {
      console.log(`[Homepage] ✅ Pointcloud already cached (${cacheStatus.chunkCount}/10 chunks)`);
      preloadComplete = true;
      preloadInProgress = false;
      return;
    }

    console.log(`[Homepage] Cache miss, fetching from backend...`);

    // Fetch pointcloud data from backend
    const databaseService = new DatabaseService();
    const response = await databaseService.getPointcloudData(communityName, shape, lod);

    if (!response || !response.data || !response.data.geometry) {
      throw new Error('Invalid response from backend');
    }

    const { geometry } = response.data;
    console.log(`[Homepage] ✅ Pointcloud data fetched: ${geometry.positions.length / 3} points`);

    // Create Web Worker to process chunks
    console.log('[Homepage] Creating PointcloudWorker...');
    worker = new Worker(
      new URL('../../Viewer/Workers/PointcloudWorker.js', import.meta.url),
      { type: 'module' }
    );

    // Handle worker messages
    worker.onmessage = async (event) => {
      const { type, chunkIndex, positions, colors, count, progress } = event.data;

      if (type === 'CHUNK_READY') {
        console.log(`[Homepage] Chunk ${chunkIndex} processed: ${count} points (${progress}%)`);

        // Store chunk in service worker cache
        const chunkData = {
          positions: Array.from(positions),
          colors: Array.from(colors),
          count,
          progress
        };

        await swManager.storeChunk(communityName, lod, chunkIndex, chunkData);
        console.log(`[Homepage] ✅ Chunk ${chunkIndex} cached`);

        // Send ACK to worker so it processes the next chunk
        worker.postMessage({ type: 'ACK_CHUNK' });
      } else if (type === 'PROCESSING_COMPLETE') {
        console.log('[Homepage] ✅ All chunks preloaded and cached!');
        preloadComplete = true;
        preloadInProgress = false;
        worker.terminate();
      }
    };

    worker.onerror = (error) => {
      console.error('[Homepage] ❌ Worker error:', error);
      preloadInProgress = false;
    };

    // Send data to worker for processing
    console.log('[Homepage] Sending data to worker for processing...');
    worker.postMessage({
      type: 'PROCESS_POINTCLOUD',
      geometry: {
        positions: geometry.positions,
        colors: geometry.colors
      }
    });

  } catch (error) {
    console.error('[Homepage] ❌ Preload error:', error);
    preloadInProgress = false;
  }
}

/**
 * Display mobile message for unsupported devices
 * @param {HTMLElement} container - Parent container to append message to
 */
function showMobileMessage(container) {
  // Create mobile message container
  const messageContainer = document.createElement('div');
  messageContainer.className = 'mobile-message';

  // Create main message
  const mainMessage = document.createElement('p');
  mainMessage.className = 'mobile-message-text';
  mainMessage.textContent = 'Sorry, Homara is not available on Mobile Browsers - Please check it out on a computer. We also have an app for a quick peek.';

  // Create iOS tablet tip
  const tip = document.createElement('p');
  tip.className = 'mobile-message-tip';
  tip.textContent = 'If on iOS tablet please request desktop mode!';

  messageContainer.appendChild(mainMessage);
  messageContainer.appendChild(tip);
  container.appendChild(messageContainer);

  console.log('[Homepage] Mobile message displayed');
}
