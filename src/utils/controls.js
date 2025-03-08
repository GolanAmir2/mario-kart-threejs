import * as THREE from 'three';

// Debug flag
const DEBUG = true;

// Setup keyboard controls for the kart
export function setupControls(kart) {
    console.log("Setting up controls for kart:", kart);
    
    // Control state
    const controlState = {
        forward: false,
        backward: false,
        left: false,
        right: false,
        drift: false,
        jump: false,
        usePowerup: false,
        canControl: false // Start with controls disabled until countdown finishes
    };
    
    // Key mappings
    const keyMap = {
        KeyW: 'forward',
        ArrowUp: 'forward',
        KeyS: 'backward',
        ArrowDown: 'backward',
        KeyA: 'left',
        ArrowLeft: 'left',
        KeyD: 'right',
        ArrowRight: 'right',
        Space: 'drift',
        ShiftLeft: 'jump',
        ShiftRight: 'jump',
        KeyE: 'usePowerup'
    };
    
    // Event listeners
    window.addEventListener('keydown', (event) => {
        const control = keyMap[event.code];
        if (control && controlState.canControl) {
            controlState[control] = true;
            if (DEBUG) {
                console.log(`Control ${control} set to true from key ${event.code}`);
                console.log("Current control state:", {...controlState});
            }
        }
    });
    
    window.addEventListener('keyup', (event) => {
        const control = keyMap[event.code];
        if (control) {
            controlState[control] = false;
            if (DEBUG) {
                console.log(`Control ${control} set to false from key ${event.code}`);
            }
        }
    });
    
    // Enable controls after countdown
    function enableControls() {
        controlState.canControl = true;
        console.log("Controls enabled!");
    }
    
    // Update function to be called in animation loop
    function update() {
        // Get kart data
        const kartData = kart.userData;
        
        // Skip if not player controlled
        if (!kartData.isPlayer) return;
        
        // Apply acceleration based on controls
        if (controlState.forward && controlState.canControl) {
            // Apply speed boost if active
            const accelerationMultiplier = kartData.powerups.speedBoost ? 2 : 1;
            kartData.acceleration = 0.15 * accelerationMultiplier; // Increased from 0.1 for faster acceleration
            if (DEBUG) {
                console.log("Applying forward acceleration:", kartData.acceleration);
            }
        } else if (controlState.backward && controlState.canControl) {
            kartData.acceleration = -0.12; // Increased from -0.08 for faster braking/reverse
            if (DEBUG) {
                console.log("Applying backward acceleration:", kartData.acceleration);
            }
        } else {
            // Apply friction when no acceleration input
            kartData.acceleration = 0;
            kartData.speed *= 0.98; // Friction
        }
        
        // Apply steering based on controls
        let steering = 0;
        if (controlState.left && controlState.canControl) {
            steering = -kartData.handling;
            if (DEBUG) {
                console.log("Turning left, steering value:", steering);
            }
        } else if (controlState.right && controlState.canControl) {
            steering = kartData.handling;
            if (DEBUG) {
                console.log("Turning right, steering value:", steering);
            }
        }
        
        // Apply drift effect
        if (controlState.drift && controlState.canControl) {
            kartData.drift = 0.03; // Increased from 0.02 for more pronounced drift
            // Visual effect for drifting (tilt the kart)
            kart.rotation.z = steering * 0.5;
        } else {
            kartData.drift = 0;
            kart.rotation.z *= 0.9; // Return to upright position
        }
        
        // Handle jumping
        if (controlState.jump && !kartData.isJumping && controlState.canControl) {
            kartData.isJumping = true;
            kartData.jumpForce = 0.5; // Initial jump force
            if (DEBUG) {
                console.log("Jump initiated");
            }
        }
        
        // Process jumping physics
        if (kartData.isJumping) {
            // Apply jump force
            kartData.jumpHeight += kartData.jumpForce;
            kartData.jumpForce -= kartData.gravity; // Reduce jump force over time
            
            // Update kart position for jump
            kart.position.y = 0.6 + kartData.jumpHeight;
            
            // Check if jump is complete
            if (kartData.jumpHeight <= 0) {
                kartData.isJumping = false;
                kartData.jumpHeight = 0;
                kartData.jumpForce = 0;
                kart.position.y = 0.6; // Reset to ground level
                if (DEBUG) {
                    console.log("Jump completed");
                }
            }
        }
        
        // Use powerup if activated
        if (controlState.usePowerup && controlState.canControl) {
            // Reset flag to prevent continuous activation
            controlState.usePowerup = false;
            
            // Activate speed boost if available
            if (kartData.powerups.speedBoost) {
                console.log("Speed boost activated!");
                kartData.powerups.speedBoostTime = 3000; // 3 seconds of boost
            }
            
            // Activate shield if available
            if (kartData.powerups.shield) {
                console.log("Shield activated!");
                kartData.powerups.shieldTime = 5000; // 5 seconds of shield
            }
        }
        
        // Update powerup timers
        if (kartData.powerups.speedBoostTime > 0) {
            kartData.powerups.speedBoostTime -= 16.67; // Approximate time per frame at 60fps
            if (kartData.powerups.speedBoostTime <= 0) {
                kartData.powerups.speedBoost = false;
                console.log("Speed boost ended");
            }
        }
        
        if (kartData.powerups.shieldTime > 0) {
            kartData.powerups.shieldTime -= 16.67; // Approximate time per frame at 60fps
            if (kartData.powerups.shieldTime <= 0) {
                kartData.powerups.shield = false;
                console.log("Shield ended");
            }
        }
        
        // Apply steering based on speed
        // Make turning more responsive at low speeds but still scale with speed
        const minSteeringFactor = 0.5; // Minimum steering effect even at low speeds
        const speedFactor = Math.max(minSteeringFactor, Math.abs(kartData.speed) / 5);
        const steeringAmount = steering * speedFactor;
        
        // Apply the steering rotation
        kart.rotation.y -= steeringAmount;
        
        if (DEBUG && Math.abs(steeringAmount) > 0.001) {
            console.log("Applied steering amount:", steeringAmount);
            console.log("New kart rotation:", kart.rotation.y);
        }
        
        // Animate wheels based on speed and steering
        animateWheels(kartData.wheels, kartData.speed, steering);
        
        // Animate exhaust particles
        if (Math.abs(kartData.speed) > 0.5) {
            kartData.exhaustParticles.userData.update();
        }
        
        // Update collision box
        kartData.collisionBox.setFromObject(kart);
        
        // Debug output for kart data
        if (DEBUG && (controlState.forward || controlState.backward || controlState.left || controlState.right)) {
            console.log("Kart data after update:", {
                speed: kartData.speed,
                acceleration: kartData.acceleration,
                steering: steering,
                position: kart.position.clone(),
                rotation: kart.rotation.y,
                isJumping: kartData.isJumping,
                jumpHeight: kartData.jumpHeight
            });
        }
    }
    
    return { 
        update,
        enableControls,
        // Expose control state for debugging
        getControlState: () => ({...controlState})
    };
}

// Animate the wheels based on kart speed and steering
function animateWheels(wheels, speed, steering) {
    const rotationSpeed = speed * 0.1;
    
    wheels.forEach((wheel, index) => {
        // Rotate wheels based on speed
        wheel.rotation.x += rotationSpeed;
        
        // Steer front wheels (index 0 and 1)
        if (index < 2) {
            // Apply steering to front wheels for visual effect
            // Reset wheel rotation first to avoid accumulation
            wheel.rotation.y = 0;
            // Then apply new steering angle (scaled for visual effect)
            wheel.rotation.y = steering * 2;
        }
    });
} 