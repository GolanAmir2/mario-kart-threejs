import * as THREE from 'three';

// Debug flag
const DEBUG = true;

// Create a race track
export function createTrack(scene) {
    const track = new THREE.Group();
    scene.add(track);
    
    // Ground
    const groundGeometry = new THREE.PlaneGeometry(200, 200);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x358c27, // Grass green
        roughness: 0.8,
        metalness: 0.2
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    track.add(ground);
    
    // Track path
    const trackPath = createComplexTrack();
    track.add(trackPath);
    
    // Add track boundaries
    const { outerBoundary, innerBoundary } = createTrackBoundaries(trackPath);
    track.add(outerBoundary);
    track.add(innerBoundary);
    
    // Add checkpoints for lap detection
    const checkpoints = createCheckpoints();
    track.add(checkpoints);
    
    // Add start gate
    const startGate = createStartGate();
    track.add(startGate);
    
    // Add powerups
    const powerups = createPowerups();
    track.add(powerups);
    
    // Add jumps
    const jumps = createJumps();
    track.add(jumps);
    
    // Add some decorations
    addDecorations(track);
    
    // Store track data for collision detection and lap counting
    track.userData = {
        path: trackPath,
        outerBoundary,
        innerBoundary,
        checkpoints,
        startGate,
        powerups,
        jumps,
        checkpointStates: new Array(checkpoints.children.length).fill(false),
        startLine: {
            position: new THREE.Vector3(20, 0, 0), // Start line position
            direction: new THREE.Vector3(0, 0, 1)  // Direction
        },
        lastCheckpointPassed: -1
    };
    
    if (DEBUG) {
        console.log("Track created with boundaries:", {
            outerBoundary: outerBoundary.geometry.parameters,
            innerBoundary: innerBoundary.geometry.parameters
        });
    }
    
    return track;
}

// Create a complex track with different turns
function createComplexTrack() {
    const trackGroup = new THREE.Group();
    
    // Create a custom track shape
    const trackShape = new THREE.Shape();
    
    // Define track points for a more complex shape
    const trackPoints = [
        { x: 20, y: 0 },    // Start point (right side)
        { x: 40, y: 10 },   // First turn (wide)
        { x: 50, y: 30 },   // Continue turn
        { x: 40, y: 50 },   // Second turn
        { x: 20, y: 60 },   // Continue turn
        { x: 0, y: 50 },    // Third turn
        { x: -20, y: 30 },  // Continue turn
        { x: -30, y: 0 },   // Fourth turn
        { x: -20, y: -30 }, // Continue turn
        { x: 0, y: -40 },   // Fifth turn
        { x: 20, y: -20 },  // Final turn back to start
    ];
    
    // Start the shape at the first point
    trackShape.moveTo(trackPoints[0].x, trackPoints[0].y);
    
    // Create a smooth curve through all points
    for (let i = 1; i < trackPoints.length; i++) {
        const prevPoint = trackPoints[i - 1];
        const currentPoint = trackPoints[i];
        const nextPoint = trackPoints[(i + 1) % trackPoints.length];
        
        // Calculate control points for smooth curve
        const controlPoint1 = {
            x: prevPoint.x + (currentPoint.x - prevPoint.x) * 0.5,
            y: prevPoint.y + (currentPoint.y - prevPoint.y) * 0.5
        };
        
        const controlPoint2 = {
            x: currentPoint.x + (nextPoint.x - currentPoint.x) * 0.5,
            y: currentPoint.y + (nextPoint.y - currentPoint.y) * 0.5
        };
        
        // Add curve segment
        trackShape.bezierCurveTo(
            controlPoint1.x, controlPoint1.y,
            controlPoint2.x, controlPoint2.y,
            nextPoint.x, nextPoint.y
        );
    }
    
    // Create a hole for the inner track
    const holeShape = new THREE.Shape();
    const scaleFactor = 0.7; // Scale factor for inner track
    
    // Start the hole at the scaled first point
    holeShape.moveTo(
        trackPoints[0].x * scaleFactor,
        trackPoints[0].y * scaleFactor
    );
    
    // Create a smooth curve through all scaled points
    for (let i = 1; i < trackPoints.length; i++) {
        const prevPoint = trackPoints[i - 1];
        const currentPoint = trackPoints[i];
        const nextPoint = trackPoints[(i + 1) % trackPoints.length];
        
        // Calculate control points for smooth curve (scaled)
        const controlPoint1 = {
            x: (prevPoint.x + (currentPoint.x - prevPoint.x) * 0.5) * scaleFactor,
            y: (prevPoint.y + (currentPoint.y - prevPoint.y) * 0.5) * scaleFactor
        };
        
        const controlPoint2 = {
            x: (currentPoint.x + (nextPoint.x - currentPoint.x) * 0.5) * scaleFactor,
            y: (currentPoint.y + (nextPoint.y - currentPoint.y) * 0.5) * scaleFactor
        };
        
        // Add curve segment
        holeShape.bezierCurveTo(
            controlPoint1.x, controlPoint1.y,
            controlPoint2.x, controlPoint2.y,
            nextPoint.x * scaleFactor, nextPoint.y * scaleFactor
        );
    }
    
    // Add the hole to the track shape
    trackShape.holes.push(holeShape);
    
    // Create the track geometry
    const trackGeometry = new THREE.ShapeGeometry(trackShape);
    const trackMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333, // Dark gray for the track
        roughness: 0.7,
        metalness: 0.1
    });
    
    const trackMesh = new THREE.Mesh(trackGeometry, trackMaterial);
    trackMesh.rotation.x = -Math.PI / 2;
    trackMesh.position.y = 0.01; // Slightly above ground to prevent z-fighting
    trackMesh.receiveShadow = true;
    
    trackGroup.add(trackMesh);
    
    // Add racing line markings
    addTrackMarkings(trackGroup, trackPoints);
    
    return trackGroup;
}

// Add track markings
function addTrackMarkings(trackGroup, trackPoints) {
    // Start/finish line
    const startLineGeometry = new THREE.PlaneGeometry(10, 1);
    const startLineMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.5,
        metalness: 0.2
    });
    
    const startLine = new THREE.Mesh(startLineGeometry, startLineMaterial);
    startLine.rotation.x = -Math.PI / 2;
    startLine.position.set(20, 0.02, 0); // Position at the start point
    startLine.rotation.z = Math.PI / 2; // Rotated to be perpendicular to the track
    startLine.receiveShadow = true;
    
    trackGroup.add(startLine);
    
    // Add dashed center line along the track
    const centerLinePoints = [];
    const numSegments = 100;
    
    // Create points along the track center
    for (let i = 0; i < numSegments; i++) {
        // Skip every other segment to create dashed line
        if (i % 2 === 0) {
            const t = i / numSegments;
            const pointIndex = Math.floor(t * trackPoints.length);
            const nextPointIndex = (pointIndex + 1) % trackPoints.length;
            
            const point1 = trackPoints[pointIndex];
            const point2 = trackPoints[nextPointIndex];
            
            const x = point1.x + (point2.x - point1.x) * (t * trackPoints.length - pointIndex);
            const z = point1.y + (point2.y - point1.y) * (t * trackPoints.length - pointIndex);
            
            centerLinePoints.push(new THREE.Vector3(x, 0.02, z));
        }
    }
    
    const centerLineGeometry = new THREE.BufferGeometry().setFromPoints(centerLinePoints);
    const centerLineMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.3
    });
    
    const centerLine = new THREE.Points(centerLineGeometry, centerLineMaterial);
    trackGroup.add(centerLine);
}

// Create a start gate for the track
function createStartGate() {
    const gate = new THREE.Group();
    
    // Gate posts
    const postGeometry = new THREE.BoxGeometry(0.5, 5, 0.5);
    const postMaterial = new THREE.MeshStandardMaterial({
        color: 0xdddddd, // Light gray
        roughness: 0.5,
        metalness: 0.7
    });
    
    // Left post
    const leftPost = new THREE.Mesh(postGeometry, postMaterial);
    leftPost.position.set(20, 2.5, -5); // Left side of track
    leftPost.castShadow = true;
    leftPost.receiveShadow = true;
    gate.add(leftPost);
    
    // Right post
    const rightPost = new THREE.Mesh(postGeometry, postMaterial);
    rightPost.position.set(20, 2.5, 5); // Right side of track
    rightPost.castShadow = true;
    rightPost.receiveShadow = true;
    gate.add(rightPost);
    
    // Top banner
    const bannerGeometry = new THREE.BoxGeometry(0.5, 1, 11);
    const bannerMaterial = new THREE.MeshStandardMaterial({
        color: 0xff0000, // Red
        roughness: 0.5,
        metalness: 0.3
    });
    
    const banner = new THREE.Mesh(bannerGeometry, bannerMaterial);
    banner.position.set(20, 5, 0); // Top of the posts
    banner.castShadow = true;
    banner.receiveShadow = true;
    gate.add(banner);
    
    // Banner text (START)
    const textGeometry = new THREE.BoxGeometry(0.1, 0.6, 8);
    const textMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff, // White
        roughness: 0.5,
        metalness: 0.3
    });
    
    const text = new THREE.Mesh(textGeometry, textMaterial);
    text.position.set(19.7, 5, 0); // Slightly in front of the banner
    text.castShadow = true;
    gate.add(text);
    
    // Checkered flags on top of posts
    const flagGeometry = new THREE.BoxGeometry(1, 1, 0.1);
    const flagMaterial = new THREE.MeshStandardMaterial({
        color: 0x000000, // Black and white checkered pattern (simplified)
        roughness: 0.5,
        metalness: 0.3
    });
    
    const leftFlag = new THREE.Mesh(flagGeometry, flagMaterial);
    leftFlag.position.set(20, 6, -5);
    leftFlag.castShadow = true;
    gate.add(leftFlag);
    
    const rightFlag = new THREE.Mesh(flagGeometry, flagMaterial);
    rightFlag.position.set(20, 6, 5);
    rightFlag.castShadow = true;
    gate.add(rightFlag);
    
    // Add a finish line on the ground
    const finishLineGeometry = new THREE.PlaneGeometry(1, 10);
    const finishLineMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.5,
        metalness: 0.2
    });
    
    const finishLine = new THREE.Mesh(finishLineGeometry, finishLineMaterial);
    finishLine.rotation.x = -Math.PI / 2;
    finishLine.position.set(20, 0.03, 0); // Slightly above the track
    finishLine.receiveShadow = true;
    gate.add(finishLine);
    
    // Add collision detection for the gate
    gate.userData = {
        isGate: true,
        collisionBox: new THREE.Box3().setFromObject(gate)
    };
    
    return gate;
}

// Create track boundaries
function createTrackBoundaries(trackPath) {
    // Create invisible boundaries for collision detection
    const boundaryMaterial = new THREE.MeshStandardMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: DEBUG ? 0.2 : 0.0 // Slightly visible in debug mode
    });
    
    // Create outer boundary from the track path
    const outerBoundaryGeometry = new THREE.BoxGeometry(150, 1, 150);
    const outerBoundary = new THREE.Mesh(outerBoundaryGeometry, boundaryMaterial);
    outerBoundary.position.y = 0.5;
    outerBoundary.visible = false; // Hide the boundary
    
    // Create inner boundary from the track path
    const innerBoundaryGeometry = new THREE.BoxGeometry(50, 1, 50);
    const innerBoundary = new THREE.Mesh(innerBoundaryGeometry, boundaryMaterial);
    innerBoundary.position.y = 0.5;
    innerBoundary.visible = false; // Hide the boundary
    
    return { outerBoundary, innerBoundary };
}

// Create checkpoints for lap detection
function createCheckpoints() {
    const checkpoints = new THREE.Group();
    
    // Define checkpoint positions around the track
    const checkpointPositions = [
        { x: 20, z: 0 },    // Start/finish line
        { x: 40, z: 10 },   // First turn
        { x: 50, z: 30 },   // Second turn
        { x: 40, z: 50 },   // Third turn
        { x: 20, z: 60 },   // Fourth turn
        { x: 0, z: 50 },    // Fifth turn
        { x: -20, z: 30 },  // Sixth turn
        { x: -30, z: 0 },   // Seventh turn
        { x: -20, z: -30 }, // Eighth turn
        { x: 0, z: -40 },   // Ninth turn
        { x: 20, z: -20 },  // Final turn
    ];
    
    // Create checkpoints
    checkpointPositions.forEach((pos, index) => {
        const checkpointGeometry = new THREE.BoxGeometry(2, 1, 10);
        const checkpointMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: DEBUG ? 0.3 : 0.0 // Slightly visible in debug mode
        });
        
        const checkpoint = new THREE.Mesh(checkpointGeometry, checkpointMaterial);
        checkpoint.position.set(pos.x, 0.5, pos.z);
        
        // Calculate direction to next checkpoint for orientation
        const nextPos = checkpointPositions[(index + 1) % checkpointPositions.length];
        const direction = new THREE.Vector3(nextPos.x - pos.x, 0, nextPos.z - pos.z).normalize();
        
        // Calculate perpendicular direction for checkpoint orientation
        const perpDirection = new THREE.Vector3(-direction.z, 0, direction.x);
        
        // Create a temporary target to look at
        const target = new THREE.Vector3(
            pos.x + perpDirection.x,
            0.5,
            pos.z + perpDirection.z
        );
        checkpoint.lookAt(target);
        
        checkpoint.userData = { 
            index,
            isFinishLine: index === 0 // First checkpoint is the finish line
        };
        checkpoints.add(checkpoint);
    });
    
    return checkpoints;
}

// Create powerups for the track
function createPowerups() {
    const powerupGroup = new THREE.Group();
    
    // Define powerup positions
    const powerupPositions = [
        { x: 35, z: 20, type: 'speedBoost' },
        { x: 30, z: 55, type: 'shield' },
        { x: -10, z: 40, type: 'speedBoost' },
        { x: -25, z: 10, type: 'shield' },
        { x: -10, z: -30, type: 'speedBoost' },
        { x: 10, z: -30, type: 'shield' }
    ];
    
    // Create powerups
    powerupPositions.forEach((pos) => {
        // Create powerup box
        const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
        const boxMaterial = new THREE.MeshStandardMaterial({
            color: pos.type === 'speedBoost' ? 0xff0000 : 0x0000ff, // Red for speed, blue for shield
            roughness: 0.3,
            metalness: 0.8,
            emissive: pos.type === 'speedBoost' ? 0xff0000 : 0x0000ff,
            emissiveIntensity: 0.5
        });
        
        const powerup = new THREE.Mesh(boxGeometry, boxMaterial);
        powerup.position.set(pos.x, 1, pos.z);
        powerup.castShadow = true;
        
        // Add rotation animation
        powerup.userData = {
            type: pos.type,
            rotationSpeed: 0.02,
            bounceHeight: 0.5,
            bounceSpeed: 0.01,
            originalY: 1,
            bounceTime: 0,
            active: true,
            respawnTime: 0,
            collisionBox: new THREE.Box3().setFromObject(powerup),
            update: function() {
                if (this.active) {
                    // Rotate the powerup
                    powerup.rotation.y += this.rotationSpeed;
                    
                    // Make it bounce
                    this.bounceTime += this.bounceSpeed;
                    powerup.position.y = this.originalY + Math.sin(this.bounceTime) * this.bounceHeight;
                    
                    // Update collision box
                    this.collisionBox.setFromObject(powerup);
                } else {
                    // Handle respawn timer
                    if (this.respawnTime > 0) {
                        this.respawnTime -= 16.67; // Approximate time per frame at 60fps
                        if (this.respawnTime <= 0) {
                            this.active = true;
                            powerup.visible = true;
                        }
                    }
                }
            },
            collect: function() {
                if (this.active) {
                    this.active = false;
                    powerup.visible = false;
                    this.respawnTime = 10000; // 10 seconds to respawn
                    return this.type;
                }
                return null;
            }
        };
        
        powerupGroup.add(powerup);
    });
    
    return powerupGroup;
}

// Create jumps for the track
function createJumps() {
    const jumpGroup = new THREE.Group();
    
    // Define jump positions
    const jumpPositions = [
        { x: 45, z: 40, rotation: Math.PI / 4 },
        { x: -15, z: 45, rotation: Math.PI / 2 },
        { x: -25, z: -15, rotation: -Math.PI / 4 }
    ];
    
    // Create jumps
    jumpPositions.forEach((pos) => {
        // Create jump ramp
        const rampGeometry = new THREE.BoxGeometry(5, 1, 10);
        const rampMaterial = new THREE.MeshStandardMaterial({
            color: 0xffcc00, // Yellow
            roughness: 0.5,
            metalness: 0.3
        });
        
        const ramp = new THREE.Mesh(rampGeometry, rampMaterial);
        ramp.position.set(pos.x, 0.5, pos.z);
        ramp.rotation.y = pos.rotation;
        
        // Tilt the ramp upward
        ramp.rotation.x = Math.PI / 12; // 15 degrees
        
        ramp.castShadow = true;
        ramp.receiveShadow = true;
        
        // Add collision detection
        ramp.userData = {
            isJump: true,
            jumpForce: 0.8,
            collisionBox: new THREE.Box3().setFromObject(ramp)
        };
        
        jumpGroup.add(ramp);
    });
    
    return jumpGroup;
}

// Add decorative elements to the track
function addDecorations(track) {
    // Add trees around the track
    const treePositions = [
        { x: 30, z: 30 },
        { x: 50, z: 10 },
        { x: 60, z: 40 },
        { x: 30, z: 70 },
        { x: 10, z: 60 },
        { x: -10, z: 70 },
        { x: -30, z: 50 },
        { x: -50, z: 20 },
        { x: -40, z: -10 },
        { x: -30, z: -40 },
        { x: -10, z: -50 },
        { x: 20, z: -40 },
        { x: 40, z: -20 }
    ];
    
    treePositions.forEach(pos => {
        const tree = createSimpleTree();
        tree.position.set(pos.x, 0, pos.z);
        
        // Add collision detection
        tree.userData = {
            isObstacle: true,
            collisionBox: new THREE.Box3().setFromObject(tree)
        };
        
        track.add(tree);
    });
    
    // Add barriers around the track
    const barrierPositions = [
        // Outer barriers
        { x: 25, z: 5, rotation: Math.PI / 2 },
        { x: 35, z: 15, rotation: Math.PI / 4 },
        { x: 45, z: 25, rotation: Math.PI / 4 },
        { x: 45, z: 40, rotation: 0 },
        { x: 35, z: 55, rotation: -Math.PI / 4 },
        { x: 25, z: 65, rotation: -Math.PI / 4 },
        { x: 10, z: 65, rotation: -Math.PI / 2 },
        { x: -5, z: 60, rotation: -Math.PI * 3/4 },
        { x: -15, z: 45, rotation: -Math.PI * 3/4 },
        { x: -25, z: 35, rotation: -Math.PI },
        { x: -35, z: 15, rotation: -Math.PI * 5/4 },
        { x: -35, z: 0, rotation: -Math.PI * 3/2 },
        { x: -30, z: -15, rotation: Math.PI * 3/4 },
        { x: -15, z: -35, rotation: Math.PI * 3/4 },
        { x: 0, z: -45, rotation: Math.PI / 2 },
        { x: 15, z: -35, rotation: Math.PI / 4 },
        { x: 25, z: -15, rotation: Math.PI / 4 }
    ];
    
    barrierPositions.forEach(pos => {
        const barrier = createBarrier();
        barrier.position.set(pos.x, 0, pos.z);
        barrier.rotation.y = pos.rotation;
        
        // Add collision detection
        barrier.userData = {
            isObstacle: true,
            collisionBox: new THREE.Box3().setFromObject(barrier)
        };
        
        track.add(barrier);
    });
}

// Create a simple tree
function createSimpleTree() {
    const tree = new THREE.Group();
    
    // Tree trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.7, 3, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({
        color: 0x8B4513, // Brown
        roughness: 0.8,
        metalness: 0.2
    });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 1.5;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    tree.add(trunk);
    
    // Tree top
    const topGeometry = new THREE.ConeGeometry(2, 4, 8);
    const topMaterial = new THREE.MeshStandardMaterial({
        color: 0x228B22, // Forest green
        roughness: 0.8,
        metalness: 0.2
    });
    const top = new THREE.Mesh(topGeometry, topMaterial);
    top.position.y = 5;
    top.castShadow = true;
    top.receiveShadow = true;
    tree.add(top);
    
    return tree;
}

// Create a simple barrier
function createBarrier() {
    const barrier = new THREE.Group();
    
    // Barrier post
    const postGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1, 8);
    const postMaterial = new THREE.MeshStandardMaterial({
        color: 0x888888, // Gray
        roughness: 0.5,
        metalness: 0.5
    });
    
    // Create two posts
    const post1 = new THREE.Mesh(postGeometry, postMaterial);
    post1.position.set(-1, 0.5, 0);
    post1.castShadow = true;
    post1.receiveShadow = true;
    barrier.add(post1);
    
    const post2 = new THREE.Mesh(postGeometry, postMaterial);
    post2.position.set(1, 0.5, 0);
    post2.castShadow = true;
    post2.receiveShadow = true;
    barrier.add(post2);
    
    // Barrier rail
    const railGeometry = new THREE.BoxGeometry(2.5, 0.2, 0.1);
    const railMaterial = new THREE.MeshStandardMaterial({
        color: 0xff0000, // Red
        roughness: 0.5,
        metalness: 0.3
    });
    const rail = new THREE.Mesh(railGeometry, railMaterial);
    rail.position.y = 0.7;
    rail.castShadow = true;
    rail.receiveShadow = true;
    barrier.add(rail);
    
    return barrier;
} 