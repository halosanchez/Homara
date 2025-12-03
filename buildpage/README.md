# Homara BUILD PAGE - Point Cloud Animation System

## 🌐 **View Live on GitHub Pages**

**🚀 Recommended:** View the live demo (no setup required):
- **Main Demo:** `https://halosanchez.github.io/Homara/buildpage/buildpage-index.html`
- **Tree Demo:** `https://halosanchez.github.io/Homara/buildpage/tree-version/tree-index.html`

## ⚠️ **Important: Cannot Open HTML Files Directly**

**This project uses ES modules and MUST be run through a web server.**

- ❌ **Opening `buildpage-index.html` directly will NOT work** (CORS error)
- ✅ **Use GitHub Pages link above** (works immediately)
- ✅ **Or run a local server** (see Quick Start below)

This is a browser security restriction, not a bug. The code works perfectly on GitHub Pages and local servers.

---

## 🎯 What This Is

An interactive 3D point cloud animation system that converts 2D logo images into animated particle systems. Users can toggle between a static logo and an animated point cloud, with particles responding to mouse movement.

**Core Concept**: Individual particles (User Points) form a collective shape (the community).

---

## 🚀 Quick Start

### 1. Start the Server
```bash
cd /Users/halosanchez/Documents/Homara
python3 -m http.server 8000
```

### 2. Open in Browser
```
http://localhost:8000/BUILD%20PAGE/buildpage-index.html
```

### 3. Test the Features
- **Press C** - Toggle between logo and point cloud
- **Move Mouse** - Particles push away from cursor
- **Watch** - Particles float and sway organically

---

## 📁 File Structure

```
BUILD PAGE/
├── buildpage-index.html          # Main HTML file
├── buildpage-engine.js           # All JavaScript logic
├── buildpage-styles.css          # Styling & animations
├── README.md                      # This file
├── QUICK_REFERENCE.md            # Quick tweaks & commands
├── POINT_CLOUD_GUIDE.md          # Detailed implementation
├── FIXES_APPLIED.md              # What was fixed
└── REPLICATION_TEMPLATE.md       # How to add new figures
```

---

## ✨ Features

✅ **Image to Particle Conversion** - Automatically samples dark pixels from images  
✅ **3D Positioning** - Particles positioned in 3D space with depth variation  
✅ **Organic Animation** - Floating, swaying, and wind effects  
✅ **Mouse Interaction** - Particles respond to cursor proximity  
✅ **Smooth Transitions** - 0.3s fade in/out between views  
✅ **Continuous Rendering** - 60fps animation loop  
✅ **Scalable** - Easy to add new figures  

---

## 🔧 How It Works

### 3-Step Process:

**1. IMAGE SAMPLING**
- Load PNG image with transparency
- Extract dark pixels (the logo/figure)
- Each pixel becomes a particle

**2. 3D POSITIONING**
- Place particles in 3D space
- Add random depth for 3D effect
- Center at origin

**3. ANIMATION**
- **Floating**: Vertical sway (sine wave)
- **Swaying**: Horizontal sway (cosine wave)
- **Wind**: Particles pushed by mouse cursor
- **Return**: Smooth easing back to original position

---

## 📊 Configuration

All settings in `buildpage-engine.js`:

```javascript
const CONFIG = {
  logo: {
    size: 500,              // Canvas size for sampling
    particleSize: 2.5,      // Visual size of particles
    depthRange: 80,         // 3D depth variation
    floatSpeed: 0.001,      // Animation speed
    floatAmount: 5,         // Vertical sway distance
    swayAmount: 4,          // Horizontal sway distance
    mouseWindRadius: 80,    // Mouse interaction radius
    mouseWindStrength: 25,  // Wind push strength
    windReturnSpeed: 0.08,  // Return to original speed
    samplingDensity: 1      // Pixel sampling (1=all, 2=every 2nd)
  }
};
```

---

## 🎨 Customization

### Make Particles More Visible
```javascript
particleSize: 3.5,      // Increase size
opacity: 1.0,           // Increase opacity
```

### Speed Up Animation
```javascript
floatSpeed: 0.002,      // Increase speed
floatAmount: 8,         // Increase sway
```

### Strengthen Wind Effect
```javascript
mouseWindRadius: 120,   // Larger radius
mouseWindStrength: 40,  // Stronger push
```

### Reduce Particle Count (Faster)
```javascript
samplingDensity: 2,     // Every 2nd pixel
samplingDensity: 3,     // Every 3rd pixel
```

---

## 🔄 Adding New Figures

### Quick Steps:

1. **Prepare Image**
   - PNG format with transparency
   - Dark pixels = particles, light = empty
   - Place in `/BUILD PAGE/` folder

2. **Add Configuration**
   - Add new config object to CONFIG
   - Adjust parameters as needed

3. **Load Image**
   - Create load function
   - Call in initialization

4. **Create Point Cloud**
   - Use generic creator function
   - Add to scene

5. **Add Toggle**
   - Create keyboard shortcut
   - Switch between figures

**See `REPLICATION_TEMPLATE.md` for complete code example**

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| No particles appear | Check image brightness/alpha, adjust threshold |
| Toggle doesn't work | Open DevTools (F12), check console for errors |
| Animation jerky | Reduce particles (increase samplingDensity) |
| Wind effect weak | Increase mouseWindStrength in CONFIG |
| Particles too small | Increase particleSize in CONFIG |

---

## 📚 Documentation

- **QUICK_REFERENCE.md** - Quick tweaks and console commands
- **POINT_CLOUD_GUIDE.md** - Detailed implementation guide
- **FIXES_APPLIED.md** - What was fixed and how to test
- **REPLICATION_TEMPLATE.md** - Step-by-step guide for new figures

---

## 🛠️ Technologies Used

- **Three.js** - 3D graphics library (WebGL)
- **Canvas API** - Image sampling and pixel manipulation
- **RequestAnimationFrame** - Smooth 60fps animation
- **ES6 Modules** - Modern JavaScript imports
- **CSS Transitions** - Smooth opacity changes

---

## 📝 Key Concepts

**Sampling**: Converting 2D image to 3D particles by reading pixel data

**Brightness Threshold**: Only dark pixels (brightness < 128) become particles

**Phase Randomization**: Each particle has random animation offset for organic look

**Wind Effect**: Particles pushed away from mouse, smoothly return using easing

**BufferGeometry**: Efficient Three.js geometry for thousands of particles

**PointsMaterial**: Three.js material optimized for rendering point clouds

---

## 🎯 Next Steps

1. ✅ Test the current logo animation
2. ✅ Adjust CONFIG parameters to your liking
3. ✅ Prepare images for other figures (magnolia tree, city skylines, etc.)
4. ✅ Add new figures using REPLICATION_TEMPLATE.md
5. ✅ Create smooth transitions between figures
6. ✅ Add UI controls for parameter adjustment

---

## 📞 Support

For detailed implementation questions, see:
- `POINT_CLOUD_GUIDE.md` - How the system works
- `REPLICATION_TEMPLATE.md` - How to add new figures
- `QUICK_REFERENCE.md` - Quick tweaks and debugging


