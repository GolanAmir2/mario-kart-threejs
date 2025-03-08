import * as THREE from 'three';

// Create a simple kart
export function createKart(scene, isPlayer = true, kartColor = 0xff0000) {
    const kart = new THREE.Group();
    scene.add(kart);
    
    // Kart body
    const bodyGeometry = new THREE.BoxGeometry(2, 0.5, 3);
    const bodyMaterial = new THREE.MeshStandardMaterial({
        color: kartColor, // Color parameter for different karts
        roughness: 0.5,
        metalness: 0.5
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.5;
    body.castShadow = true;
    body.receiveShadow = true;
    kart.add(body);
    
    // Kart cockpit
    const cockpitGeometry = new THREE.BoxGeometry(1.2, 0.4, 1);
    const cockpitMaterial = new THREE.MeshStandardMaterial({
        color: 0x0000ff, // Blue
        roughness: 0.5,
        metalness: 0.5
    });
    const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
    cockpit.position.set(0, 0.9, -0.2);
    cockpit.castShadow = true;
    cockpit.receiveShadow = true;
    kart.add(cockpit);
    
    // Driver (simple representation)
    const driverHeadGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const driverBodyGeometry = new THREE.BoxGeometry(0.6, 0.6, 0.6);
    const driverMaterial = new THREE.MeshStandardMaterial({
        color: 0xffcc00, // Yellow
        roughness: 0.7,
        metalness: 0.3
    });
    
    const driverHead = new THREE.Mesh(driverHeadGeometry, driverMaterial);
    driverHead.position.set(0, 1.4, -0.2);
    driverHead.castShadow = true;
    kart.add(driverHead);
    
    const driverBody = new THREE.Mesh(driverBodyGeometry, driverMaterial);
    driverBody.position.set(0, 1, -0.2);
    driverBody.castShadow = true;
    kart.add(driverBody);
    
    // Wheels
    const wheels = createWheels();
    wheels.forEach(wheel => kart.add(wheel));
    
    // Front bumper
    const bumperGeometry = new THREE.BoxGeometry(1.8, 0.3, 0.3);
    const bumperMaterial = new THREE.MeshStandardMaterial({
        color: 0xcccccc, // Light gray
        roughness: 0.5,
        metalness: 0.7
    });
    const bumper = new THREE.Mesh(bumperGeometry, bumperMaterial);
    bumper.position.set(0, 0.3, 1.5);
    bumper.castShadow = true;
    bumper.receiveShadow = true;
    kart.add(bumper);
    
    // Exhaust pipes
    const exhaustGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.5, 8);
    const exhaustMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333, // Dark gray
        roughness: 0.3,
        metalness: 0.8
    });
    
    const exhaustLeft = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
    exhaustLeft.position.set(0.5, 0.5, -1.5);
    exhaustLeft.rotation.x = Math.PI / 2;
    exhaustLeft.castShadow = true;
    kart.add(exhaustLeft);
    
    const exhaustRight = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
    exhaustRight.position.set(-0.5, 0.5, -1.5);
    exhaustRight.rotation.x = Math.PI / 2;
    exhaustRight.castShadow = true;
    kart.add(exhaustRight);
    
    // Add exhaust particles (simple representation)
    const exhaustParticles = createExhaustParticles();
    kart.add(exhaustParticles);
    
    // Store kart data for physics and controls
    kart.userData = {
        speed: 0,
        acceleration: 0,
        maxSpeed: 80, // Increased from 50 for much faster racing
        handling: isPlayer ? 0.15 : 0.12, // Increased from 0.1 for better turning
        drift: 0,
        jumpForce: 0,
        isJumping: false,
        jumpHeight: 0,
        maxJumpHeight: 3,
        gravity: 0.2,
        wheels,
        exhaustParticles,
        isPlayer: isPlayer,
        powerups: {
            speedBoost: false,
            speedBoostTime: 0,
            shield: false,
            shieldTime: 0
        },
        collisionBox: new THREE.Box3().setFromObject(kart)
    };
    
    console.log(`Kart created with handling: ${kart.userData.handling}, max speed: ${kart.userData.maxSpeed}, and color: ${kartColor.toString(16)}`);
    
    return kart;
}

// Create wheels for the kart
function createWheels() {
    const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
    const wheelMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333, // Dark gray
        roughness: 0.7,
        metalness: 0.5
    });
    
    // Wheel positions
    const wheelPositions = [
        { x: 1, y: 0.4, z: 1 },   // Front right
        { x: -1, y: 0.4, z: 1 },  // Front left
        { x: 1, y: 0.4, z: -1 },  // Rear right
        { x: -1, y: 0.4, z: -1 }  // Rear left
    ];
    
    const wheels = [];
    
    wheelPositions.forEach(pos => {
        const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel.position.set(pos.x, pos.y, pos.z);
        wheel.rotation.z = Math.PI / 2;
        wheel.castShadow = true;
        wheel.receiveShadow = true;
        wheels.push(wheel);
    });
    
    return wheels;
}

// Create simple exhaust particles
function createExhaustParticles() {
    const particles = new THREE.Group();
    
    // Create particle system for exhaust
    const particleCount = 20;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        particlePositions[i3] = (Math.random() - 0.5) * 0.3;
        particlePositions[i3 + 1] = (Math.random() - 0.5) * 0.3;
        particlePositions[i3 + 2] = -1.5 - Math.random() * 2;
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    
    const particleMaterial = new THREE.PointsMaterial({
        color: 0xaaaaaa,
        size: 0.1,
        transparent: true,
        opacity: 0.6
    });
    
    const exhaustParticleSystem = new THREE.Points(particleGeometry, particleMaterial);
    exhaustParticleSystem.position.y = 0.5;
    particles.add(exhaustParticleSystem);
    
    // Store original positions for animation
    particles.userData = {
        originalPositions: particlePositions.slice(),
        update: function() {
            const positions = exhaustParticleSystem.geometry.attributes.position.array;
            
            for (let i = 0; i < particleCount; i++) {
                const i3 = i * 3;
                
                // Move particles back
                positions[i3 + 2] -= 0.1;
                
                // Reset particles that go too far
                if (positions[i3 + 2] < -3) {
                    positions[i3] = (Math.random() - 0.5) * 0.3;
                    positions[i3 + 1] = (Math.random() - 0.5) * 0.3;
                    positions[i3 + 2] = -1.5;
                }
            }
            
            exhaustParticleSystem.geometry.attributes.position.needsUpdate = true;
        }
    };
    
    return particles;
} 