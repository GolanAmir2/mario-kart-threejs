import * as THREE from 'three';

// Debug flag
const DEBUG = true;

// Setup physics for the kart and track
export function setupPhysics(kart, track) {
    console.log("Setting up physics for kart:", kart);
    
    // Physics state
    const physicsState = {
        velocity: new THREE.Vector3(0, 0, 0),
        direction: new THREE.Vector3(0, 0, -1),
        isGrounded: true,
        isColliding: false,
        checkpointsPassed: new Array(track.userData.checkpoints.children.length).fill(false),
        lastCheckpoint: -1,
        lapCompleted: false,
        finishLineCrossed: false,
        allCheckpointsPassed: false,
        collisionCooldown: 0
    };
    
    // Raycaster for ground detection
    const raycaster = new THREE.Raycaster();
    
    // Update function to be called in animation loop
    function update() {
        // Get kart data
        const kartData = kart.userData;
        
        if (DEBUG) {
            console.log("Physics update - Current kart data:", {
                speed: kartData.speed,
                acceleration: kartData.acceleration,
                position: kart.position.clone()
            });
        }
        
        // Apply acceleration to speed
        kartData.speed += kartData.acceleration;
        
        // Apply max speed limit
        if (kartData.speed > kartData.maxSpeed) {
            kartData.speed = kartData.maxSpeed;
        } else if (kartData.speed < -kartData.maxSpeed / 2) { // Slower reverse speed
            kartData.speed = -kartData.maxSpeed / 2;
        }
        
        // Update direction vector based on kart rotation
        physicsState.direction.set(0, 0, -1).applyQuaternion(kart.quaternion);
        
        // Apply velocity based on direction and speed
        physicsState.velocity.copy(physicsState.direction).multiplyScalar(kartData.speed);
        
        if (DEBUG && Math.abs(kartData.speed) > 0.01) {
            console.log("Calculated velocity:", physicsState.velocity.clone());
        }
        
        // Apply drift if active
        if (kartData.drift !== 0) {
            // Calculate drift direction (perpendicular to forward direction)
            const driftDirection = new THREE.Vector3(-physicsState.direction.z, 0, physicsState.direction.x);
            driftDirection.normalize().multiplyScalar(kartData.drift * kartData.speed);
            
            // Add drift to velocity
            physicsState.velocity.add(driftDirection);
        }
        
        // Move kart based on velocity
        const oldPosition = kart.position.clone();
        kart.position.add(physicsState.velocity);
        
        // Update collision cooldown
        if (physicsState.collisionCooldown > 0) {
            physicsState.collisionCooldown -= 16.67; // Approximate time per frame at 60fps
        }
        
        // Check for collisions with track boundaries AFTER moving
        const collisionResult = checkCollisions();
        
        if (collisionResult.colliding) {
            // Handle collision (bounce back)
            handleCollision(collisionResult);
            if (DEBUG) {
                console.log("Collision detected, bouncing back");
            }
        } else if (DEBUG && Math.abs(kartData.speed) > 0.01) {
            console.log("Kart moved from", oldPosition, "to", kart.position.clone());
            console.log("Movement delta:", kart.position.clone().sub(oldPosition));
        }
        
        // Check for checkpoint/lap completion
        checkCheckpoints();
        
        // Check for powerup collection
        checkPowerups();
        
        // Check for jumps
        checkJumps();
        
        // Reset lap completion flag
        physicsState.lapCompleted = false;
    }
    
    // Check for collisions with track boundaries and obstacles
    function checkCollisions() {
        const result = {
            colliding: false,
            normal: new THREE.Vector3(),
            isObstacle: false
        };
        
        // Skip collision detection if shield is active
        if (kart.userData.powerups.shield) {
            return result;
        }
        
        // Simple collision detection with track boundaries
        const outerBoundary = track.userData.outerBoundary;
        const innerBoundary = track.userData.innerBoundary;
        
        // Create a bounding box for the kart
        const kartBoundingBox = kart.userData.collisionBox;
        
        // Check collision with outer boundary
        const outerBoundaryBox = new THREE.Box3().setFromObject(outerBoundary);
        if (!outerBoundaryBox.containsBox(kartBoundingBox)) {
            result.colliding = true;
            
            // Calculate approximate normal (direction to push back)
            const trackCenter = new THREE.Vector3();
            outerBoundaryBox.getCenter(trackCenter);
            
            result.normal.subVectors(kart.position, trackCenter).normalize();
            
            if (DEBUG) {
                console.log("Outer boundary collision detected");
                console.log("Kart position:", kart.position.clone());
                console.log("Boundary center:", trackCenter);
            }
        }
        
        // Check collision with inner boundary
        const innerBoundaryBox = new THREE.Box3().setFromObject(innerBoundary);
        if (innerBoundaryBox.intersectsBox(kartBoundingBox)) {
            result.colliding = true;
            
            // Calculate approximate normal (direction to push back)
            const trackCenter = new THREE.Vector3();
            innerBoundaryBox.getCenter(trackCenter);
            
            result.normal.subVectors(kart.position, trackCenter).normalize();
            result.normal.negate(); // Reverse direction for inner boundary
            
            if (DEBUG) {
                console.log("Inner boundary collision detected");
                console.log("Kart position:", kart.position.clone());
                console.log("Boundary center:", trackCenter);
            }
        }
        
        // Check collision with obstacles (trees, barriers)
        if (!result.colliding && physicsState.collisionCooldown <= 0) {
            // Check trees
            const trees = Array.from(track.children).filter(child => 
                child.userData && child.userData.isObstacle);
            
            for (const obstacle of trees) {
                if (obstacle.userData.collisionBox.intersectsBox(kartBoundingBox)) {
                    result.colliding = true;
                    result.isObstacle = true;
                    
                    // Calculate normal (direction to push back)
                    const obstacleCenter = new THREE.Vector3();
                    obstacle.userData.collisionBox.getCenter(obstacleCenter);
                    
                    result.normal.subVectors(kart.position, obstacleCenter).normalize();
                    
                    if (DEBUG) {
                        console.log("Obstacle collision detected");
                        console.log("Kart position:", kart.position.clone());
                        console.log("Obstacle center:", obstacleCenter);
                    }
                    
                    break;
                }
            }
        }
        
        return result;
    }
    
    // Handle collision response
    function handleCollision(collisionResult) {
        // Bounce back from collision
        const bounceFactor = collisionResult.isObstacle ? 0.8 : 0.5;
        
        // Reflect velocity based on collision normal
        const dot = physicsState.velocity.dot(collisionResult.normal);
        physicsState.velocity.sub(collisionResult.normal.multiplyScalar(2 * dot));
        
        // Reduce speed due to collision
        kart.userData.speed *= bounceFactor;
        
        // Move kart away from collision
        const bounceDistance = collisionResult.isObstacle ? 0.5 : 0.1;
        kart.position.add(collisionResult.normal.clone().multiplyScalar(bounceDistance));
        
        // Set collision cooldown for obstacles
        if (collisionResult.isObstacle) {
            physicsState.collisionCooldown = 500; // 500ms cooldown
        }
    }
    
    // Check for checkpoint and lap completion
    function checkCheckpoints() {
        const checkpoints = track.userData.checkpoints.children;
        
        // Create a bounding box for the kart
        const kartBoundingBox = kart.userData.collisionBox;
        
        // Check each checkpoint
        let finishLineCrossed = false;
        
        checkpoints.forEach((checkpoint, index) => {
            // Create checkpoint bounding box
            const checkpointBox = new THREE.Box3().setFromObject(checkpoint);
            
            // Check if kart intersects with checkpoint
            if (checkpointBox.intersectsBox(kartBoundingBox)) {
                // Check if this is the finish line checkpoint
                if (checkpoint.userData.isFinishLine) {
                    finishLineCrossed = true;
                    if (DEBUG) {
                        console.log("Finish line crossed!");
                    }
                } else {
                    // Mark regular checkpoint as passed
                    physicsState.checkpointsPassed[index] = true;
                    physicsState.lastCheckpoint = index;
                    
                    if (DEBUG) {
                        console.log(`Checkpoint ${index} passed`);
                    }
                    
                    // Update track's last checkpoint passed
                    track.userData.lastCheckpointPassed = index;
                }
            }
        });
        
        // Check if all regular checkpoints have been passed
        const allCheckpointsPassed = physicsState.checkpointsPassed.every(passed => passed);
        
        // If all checkpoints are passed and we cross the finish line, complete a lap
        if (allCheckpointsPassed && finishLineCrossed) {
            // Lap completed
            physicsState.lapCompleted = true;
            
            if (DEBUG) {
                console.log("LAP COMPLETED!");
                console.log("Checkpoints state:", [...physicsState.checkpointsPassed]);
            }
            
            // Reset checkpoints for next lap
            physicsState.checkpointsPassed.fill(false);
        }
    }
    
    // Check for powerup collection
    function checkPowerups() {
        if (!track.userData.powerups) return;
        
        const powerups = track.userData.powerups.children;
        const kartBoundingBox = kart.userData.collisionBox;
        
        // Check each powerup
        powerups.forEach(powerup => {
            // Skip if not active
            if (!powerup.userData.active) return;
            
            // Check collision
            if (powerup.userData.collisionBox.intersectsBox(kartBoundingBox)) {
                // Collect powerup
                const powerupType = powerup.userData.collect();
                
                if (powerupType) {
                    // Apply powerup effect
                    if (powerupType === 'speedBoost') {
                        kart.userData.powerups.speedBoost = true;
                        kart.userData.powerups.speedBoostTime = 3000; // 3 seconds
                        console.log("Speed boost collected!");
                    } else if (powerupType === 'shield') {
                        kart.userData.powerups.shield = true;
                        kart.userData.powerups.shieldTime = 5000; // 5 seconds
                        console.log("Shield collected!");
                    }
                }
            }
            
            // Update powerup animation
            powerup.userData.update();
        });
    }
    
    // Check for jumps
    function checkJumps() {
        if (!track.userData.jumps) return;
        
        const jumps = track.userData.jumps.children;
        const kartBoundingBox = kart.userData.collisionBox;
        
        // Check each jump
        jumps.forEach(jump => {
            // Check collision
            if (jump.userData.collisionBox.intersectsBox(kartBoundingBox) && !kart.userData.isJumping) {
                // Trigger jump
                kart.userData.isJumping = true;
                kart.userData.jumpForce = jump.userData.jumpForce;
                console.log("Jump triggered!");
            }
        });
    }
    
    // Get current speed
    function getSpeed() {
        return kart.userData.speed;
    }
    
    // Check if lap is complete
    function checkLapComplete() {
        return physicsState.lapCompleted;
    }
    
    // Expose debug methods
    const debug = {
        getPhysicsState: () => ({...physicsState}),
        applyTestForce: (force) => {
            kart.userData.speed = force;
            console.log("Applied test force:", force);
        }
    };
    
    return {
        update,
        getSpeed,
        checkLapComplete,
        debug
    };
} 