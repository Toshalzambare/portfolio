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
    antialias: true
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Particle properties
  const particleCount = 150;
  const positions = new Float32Array(particleCount * 3);
  const velocities = [];
  
  // Initial positions & velocities
  const spaceRange = 60; // Spread range
  for (let i = 0; i < particleCount; i++) {
    // Position
    positions[i * 3] = (Math.random() - 0.5) * spaceRange * 1.5;
    positions[i * 3 + 1] = (Math.random() - 0.5) * spaceRange;
    positions[i * 3 + 2] = (Math.random() - 0.5) * spaceRange * 0.5;

    // Velocity
    velocities.push({
      x: (Math.random() - 0.5) * 0.05,
      y: (Math.random() - 0.5) * 0.05,
      z: (Math.random() - 0.5) * 0.02
    });
  }

  // Create Particle Geometry
  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute(
    'position',
    new THREE.BufferAttribute(positions, 3)
  );

  // Material: Custom circle particle with soft edges (simulated via canvas or built-in point)
  // To avoid external file loading errors, we can generate a round circle texture procedurally in code!
  const createCircleTexture = () => {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    // Draw glowing circle
    const gradient = ctx.createRadialGradient(
      size / 2, size / 2, 0,
      size / 2, size / 2, size / 2
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, 'rgba(197, 168, 128, 0.8)'); // Gold tint
    gradient.addColorStop(0.5, 'rgba(197, 168, 128, 0.2)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    
    return new THREE.CanvasTexture(canvas);
  };

  const particleMaterial = new THREE.PointsMaterial({
    color: 0xc5a880, // Gold / Bronze accent
    size: 1.5,
    transparent: true,
    opacity: 0.8,
    map: createCircleTexture(),
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const particlePoints = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(particlePoints);

  // Lines setup
  const lineMaterial = new THREE.LineBasicMaterial({
    color: 0xc5a880,
    transparent: true,
    opacity: 0.08,
    blending: THREE.AdditiveBlending
  });

  const linePositions = [];
  const lineGeometry = new THREE.BufferGeometry();
  const lineMesh = new THREE.LineSegments(lineGeometry, lineMaterial);
  scene.add(lineMesh);

  // Mouse interaction
  const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
  const raycaster = new THREE.Raycaster();
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const mouse3D = new THREE.Vector3();

  window.addEventListener('mousemove', (event) => {
    // Normalised mouse coordinates
    mouse.targetX = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.targetY = -(event.clientY / window.innerHeight) * 2 + 1;
    
    // Get mouse coordinates projected onto the Z=0 plane for particle attraction
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
  const animate = () => {
    requestAnimationFrame(animate);

    // Smooth camera mouse follow (parallax)
    mouse.x += (mouse.targetX - mouse.x) * 0.05;
    mouse.y += (mouse.targetY - mouse.y) * 0.05;

    camera.position.x = mouse.x * 6;
    camera.position.y = mouse.y * 4;
    camera.lookAt(scene.position);

    // Rotate scene based on scroll
    particlePoints.rotation.y = scrollY * 0.0003;
    particlePoints.rotation.x = scrollY * 0.0001;
    lineMesh.rotation.y = scrollY * 0.0003;
    lineMesh.rotation.x = scrollY * 0.0001;

    // Update particle positions
    const posAttribute = particleGeometry.getAttribute('position');
    const positions = posAttribute.array;

    const linePoints = [];

    for (let i = 0; i < particleCount; i++) {
      let x = positions[i * 3];
      let y = positions[i * 3 + 1];
      let z = positions[i * 3 + 2];

      // Regular velocity update
      x += velocities[i].x;
      y += velocities[i].y;
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
        const interactionRadius = 15;
        
        if (distanceSq < interactionRadius * interactionRadius) {
          const distance = Math.sqrt(distanceSq);
          const force = (interactionRadius - distance) / interactionRadius;
          // Pull gently towards mouse
          x += (dx / distance) * force * 0.08;
          y += (dy / distance) * force * 0.08;
        }
      }

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
    }

    posAttribute.needsUpdate = true;

    // Build connections (lines between close particles)
    for (let i = 0; i < particleCount; i++) {
      const x1 = positions[i * 3];
      const y1 = positions[i * 3 + 1];
      const z1 = positions[i * 3 + 2];

      // We only check a subset or restrict comparisons to keep performance solid
      // Check next 20 particles (sufficient to form a network without O(N^2) load)
      const scanLimit = Math.min(particleCount, i + 25);
      for (let j = i + 1; j < scanLimit; j++) {
        const x2 = positions[j * 3];
        const y2 = positions[j * 3 + 1];
        const z2 = positions[j * 3 + 2];

        const dx = x1 - x2;
        const dy = y1 - y2;
        const dz = z1 - z2;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < 10) {
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
