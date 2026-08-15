import * as THREE from 'three';

export function initThreeBg() {
  const canvas = document.getElementById('webgl-bg');
  if (!canvas) return;

  // Scene setup
  const scene = new THREE.Scene();
  
  // Camera
  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 40;

  // Renderer
  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance'
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Helper: Create Soft Glowing Circle Texture procedurally
  const createCircleTexture = (innerColor = 'rgba(255, 255, 255, 1)', midColor = 'rgba(197, 168, 128, 0.8)', outerColor = 'rgba(197, 168, 128, 0)') => {
    const size = 128;
    const texCanvas = document.createElement('canvas');
    texCanvas.width = size;
    texCanvas.height = size;
    const ctx = texCanvas.getContext('2d');
    
    const gradient = ctx.createRadialGradient(
      size / 2, size / 2, 0,
      size / 2, size / 2, size / 2
    );
    gradient.addColorStop(0, innerColor);
    gradient.addColorStop(0.25, midColor);
    gradient.addColorStop(0.6, 'rgba(197, 168, 128, 0.15)');
    gradient.addColorStop(1, outerColor);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    
    return new THREE.CanvasTexture(texCanvas);
  };

  // 1. Primary Constellation Layer
  const particleCount = 160;
  const positions = new Float32Array(particleCount * 3);
  const velocities = [];
  const spaceRange = 65;

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * spaceRange * 1.5;
    positions[i * 3 + 1] = (Math.random() - 0.5) * spaceRange;
    positions[i * 3 + 2] = (Math.random() - 0.5) * spaceRange * 0.6;

    velocities.push({
      x: (Math.random() - 0.5) * 0.04,
      y: (Math.random() - 0.5) * 0.04,
      z: (Math.random() - 0.5) * 0.015,
      baseSize: 1.2 + Math.random() * 0.8
    });
  }

  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const particleMaterial = new THREE.PointsMaterial({
    color: 0xc5a880,
    size: 2.0,
    transparent: true,
    opacity: 0.85,
    map: createCircleTexture(),
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const particlePoints = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(particlePoints);

  // 2. Ambient Deep Starfield Layer
  const ambientStarCount = 200;
  const starPositions = new Float32Array(ambientStarCount * 3);
  for (let i = 0; i < ambientStarCount; i++) {
    starPositions[i * 3] = (Math.random() - 0.5) * spaceRange * 2.2;
    starPositions[i * 3 + 1] = (Math.random() - 0.5) * spaceRange * 1.8;
    starPositions[i * 3 + 2] = -20 + (Math.random() - 0.5) * 30;
  }
  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));

  const starMaterial = new THREE.PointsMaterial({
    color: 0x94a3b8,
    size: 0.8,
    transparent: true,
    opacity: 0.45,
    map: createCircleTexture('rgba(255,255,255,0.9)', 'rgba(148,163,184,0.4)', 'rgba(0,0,0,0)'),
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const starPoints = new THREE.Points(starGeometry, starMaterial);
  scene.add(starPoints);

  // 3. Network Constellation Lines
  const lineMaterial = new THREE.LineBasicMaterial({
    color: 0xc5a880,
    transparent: true,
    opacity: 0.09,
    blending: THREE.AdditiveBlending
  });

  const lineGeometry = new THREE.BufferGeometry();
  const lineMesh = new THREE.LineSegments(lineGeometry, lineMaterial);
  scene.add(lineMesh);

  // Mouse Parallax & Attraction
  const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
  const raycaster = new THREE.Raycaster();
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const mouse3D = new THREE.Vector3();

  window.addEventListener('mousemove', (event) => {
    mouse.targetX = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.targetY = -(event.clientY / window.innerHeight) * 2 + 1;
    
    const ndc = new THREE.Vector2(mouse.targetX, mouse.targetY);
    raycaster.setFromCamera(ndc, camera);
    raycaster.ray.intersectPlane(plane, mouse3D);
  });

  // Scroll effect
  let scrollY = 0;
  window.addEventListener('scroll', () => {
    scrollY = window.scrollY;
  });

  // Resize handler
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  });

  // Animation Loop
  let clock = new THREE.Clock();
  const animate = () => {
    requestAnimationFrame(animate);
    const elapsedTime = clock.getElapsedTime();

    // Smooth camera mouse follow (parallax)
    mouse.x += (mouse.targetX - mouse.x) * 0.04;
    mouse.y += (mouse.targetY - mouse.y) * 0.04;

    camera.position.x = mouse.x * 6;
    camera.position.y = mouse.y * 4;
    camera.lookAt(scene.position);

    // Subtle ambient rotations
    particlePoints.rotation.y = scrollY * 0.00025 + elapsedTime * 0.02;
    particlePoints.rotation.x = scrollY * 0.0001;
    starPoints.rotation.y = -elapsedTime * 0.008;
    lineMesh.rotation.y = particlePoints.rotation.y;
    lineMesh.rotation.x = particlePoints.rotation.x;

    // Update particle positions
    const posAttribute = particleGeometry.getAttribute('position');
    const posArray = posAttribute.array;

    const linePoints = [];

    for (let i = 0; i < particleCount; i++) {
      let x = posArray[i * 3];
      let y = posArray[i * 3 + 1];
      let z = posArray[i * 3 + 2];

      // Regular velocity update with subtle harmonic drift
      x += velocities[i].x + Math.sin(elapsedTime * 0.5 + i) * 0.003;
      y += velocities[i].y + Math.cos(elapsedTime * 0.5 + i) * 0.003;
      z += velocities[i].z;

      // Boundaries check & wrap around
      const boundaryX = spaceRange * 1.5;
      const boundaryY = spaceRange;
      if (Math.abs(x) > boundaryX) velocities[i].x *= -1;
      if (Math.abs(y) > boundaryY) velocities[i].y *= -1;
      if (Math.abs(z) > 20) velocities[i].z *= -1;

      // Mouse attraction / repulsion force
      if (mouse3D.lengthSq() > 0) {
        const dx = mouse3D.x - x;
        const dy = mouse3D.y - y;
        const dz = mouse3D.z - z;
        const distanceSq = dx * dx + dy * dy + dz * dz;
        const interactionRadius = 18;
        
        if (distanceSq < interactionRadius * interactionRadius) {
          const distance = Math.sqrt(distanceSq);
          const force = (interactionRadius - distance) / interactionRadius;
          x += (dx / distance) * force * 0.08;
          y += (dy / distance) * force * 0.08;
        }
      }

      posArray[i * 3] = x;
      posArray[i * 3 + 1] = y;
      posArray[i * 3 + 2] = z;
    }

    posAttribute.needsUpdate = true;

    // Build connections
    for (let i = 0; i < particleCount; i++) {
      const x1 = posArray[i * 3];
      const y1 = posArray[i * 3 + 1];
      const z1 = posArray[i * 3 + 2];

      const scanLimit = Math.min(particleCount, i + 24);
      for (let j = i + 1; j < scanLimit; j++) {
        const x2 = posArray[j * 3];
        const y2 = posArray[j * 3 + 1];
        const z2 = posArray[j * 3 + 2];

        const dx = x1 - x2;
        const dy = y1 - y2;
        const dz = z1 - z2;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < 9.5) {
          linePoints.push(x1, y1, z1);
          linePoints.push(x2, y2, z2);
        }
      }
    }

    // Update lines geometry
    lineGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(linePoints, 3)
    );
    lineGeometry.computeBoundingSphere();

    renderer.render(scene, camera);
  };

  animate();
}
