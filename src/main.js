import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { createTrack } from './utils/trackBuilder.js';
import { createKart } from './utils/kartBuilder.js';
import { setupControls } from './utils/controls.js';
import { setupPhysics } from './utils/physics.js';

// Game state
const gameState = {
    isPlaying: false,
    currentLap: 0,
    totalLaps: 3,
    speed: 0,
    startTime: 0,
    lapTimes: [],
    raceStartTime: 0,
    totalRaceTime: 0,
    countdownComplete: false,
    aiKarts: []
};

// DOM elements
const speedMeter = document.getElementById('speed-meter');
const lapCounter = document.getElementById('lap-counter');
const gameMenu = document.getElementById('game-menu');
const startButton = document.getElementById('start-button');

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // Sky blue background

// Camera setup
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 10);

// Renderer setup
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 20, 10);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
scene.add(directionalLight);

// Game objects
let track;
let kart;
let controls;
let physics;
let aiPhysics = [];

// Debug flag
const DEBUG = true;

// Initialize game
function initGame() {
    console.log("Initializing game...");
    
    // Create track
    track = createTrack(scene);
    
    // Create player kart
    kart = createKart(scene, true, 0xff0000); // Red kart for player
    
    // Position kart at the starting line of the track
    // Position the kart just before the gate, facing along the track
    kart.position.set(18, 0.6, 0); // Position just before the start gate on the right side
    kart.rotation.y = Math.PI / 2; // Face counterclockwise (to the left)
    
    console.log("Kart initial position:", kart.position);
    
    // Setup controls
    controls = setupControls(kart);
    
    // Setup physics
    physics = setupPhysics(kart, track);
    
    // Create AI karts
    createAIKarts();
    
    // Update UI
    updateUI();
    
    console.log("Game initialized:", { kart, controls, physics });
    
    // Add manual test buttons to the UI
    addDebugControls();
}

// Create AI-controlled karts
function createAIKarts() {
    // Clear existing AI karts
    gameState.aiKarts.forEach(aiKart => {
        scene.remove(aiKart);
    });
    gameState.aiKarts = [];
    aiPhysics = [];
    
    // Create 3 AI karts with different colors
    const aiColors = [0x00ff00, 0x0000ff, 0xffff00]; // Green, Blue, Yellow
    const aiStartPositions = [
        { x: 18, y: 0.6, z: 3 },
        { x: 18, y: 0.6, z: -3 },
        { x: 16, y: 0.6, z: 0 }
    ];
    
    for (let i = 0; i < 3; i++) {
        const aiKart = createKart(scene, false, aiColors[i]);
        aiKart.position.copy(aiStartPositions[i]);
        aiKart.rotation.y = Math.PI / 2; // Face counterclockwise
        
        // Add AI behavior data
        aiKart.userData.ai = {
            targetPoint: 0,
            steeringFactor: 0.8 + Math.random() * 0.4, // Random steering factor for variety
            speedFactor: 0.7 + Math.random() * 0.3, // Random speed factor for variety
            updateTarget: function(checkpoints) {
                // Move to next checkpoint
                this.targetPoint = (this.targetPoint + 1) % checkpoints.length;
            },
            getTargetPosition: function(checkpoints) {
                return checkpoints[this.targetPoint].position.clone();
            }
        };
        
        // Setup physics for AI kart
        const aiPhysicsInstance = setupPhysics(aiKart, track);
        aiPhysics.push(aiPhysicsInstance);
        
        // Add to game state
        gameState.aiKarts.push(aiKart);
    }
    
    console.log("Created AI karts:", gameState.aiKarts);
}

// Update AI kart behavior
function updateAIKarts() {
    if (!track || !track.userData || !track.userData.checkpoints) return;
    
    const checkpoints = track.userData.checkpoints.children;
    
    gameState.aiKarts.forEach((aiKart, index) => {
        // Skip if not active
        if (!aiKart.visible) return;
        
        // Get target position (next checkpoint)
        const targetPosition = aiKart.userData.ai.getTargetPosition(checkpoints);
        
        // Calculate direction to target
        const direction = new THREE.Vector3().subVectors(targetPosition, aiKart.position).normalize();
        
        // Calculate angle between kart forward direction and target direction
        const kartDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(aiKart.quaternion);
        const angle = kartDirection.angleTo(direction);
        
        // Determine if we need to turn left or right
        const cross = new THREE.Vector3().crossVectors(kartDirection, direction);
        const turnDirection = Math.sign(cross.y);
        
        // Apply steering based on angle and direction
        const steeringAmount = Math.min(angle, 0.05) * turnDirection * aiKart.userData.ai.steeringFactor;
        aiKart.rotation.y += steeringAmount;
        
        // Apply acceleration
        aiKart.userData.acceleration = 0.08 * aiKart.userData.ai.speedFactor;
        
        // Check if we've reached the target
        const distanceToTarget = aiKart.position.distanceTo(targetPosition);
        if (distanceToTarget < 5) {
            aiKart.userData.ai.updateTarget(checkpoints);
        }
        
        // Update physics for this AI kart
        aiPhysics[index].update();
    });
}

// Add debug control buttons to the UI
function addDebugControls() {
    const debugContainer = document.createElement('div');
    debugContainer.style.position = 'absolute';
    debugContainer.style.bottom = '20px';
    debugContainer.style.left = '20px';
    debugContainer.style.zIndex = '1000';
    
    const moveForwardBtn = document.createElement('button');
    moveForwardBtn.textContent = 'Move Forward';
    moveForwardBtn.style.padding = '10px';
    moveForwardBtn.style.marginRight = '10px';
    moveForwardBtn.addEventListener('click', () => {
        console.log("Manual forward movement triggered");
        if (!gameState.isPlaying) {
            startGame();
        }
        kart.userData.acceleration = 0.1;
        kart.userData.speed = 1.0;
    });
    
    const moveBackwardBtn = document.createElement('button');
    moveBackwardBtn.textContent = 'Move Backward';
    moveBackwardBtn.style.padding = '10px';
    moveBackwardBtn.addEventListener('click', () => {
        console.log("Manual backward movement triggered");
        if (!gameState.isPlaying) {
            startGame();
        }
        kart.userData.acceleration = -0.1;
        kart.userData.speed = -1.0;
    });
    
    const turnLeftBtn = document.createElement('button');
    turnLeftBtn.textContent = 'Turn Left';
    turnLeftBtn.style.padding = '10px';
    turnLeftBtn.style.marginRight = '10px';
    turnLeftBtn.style.marginTop = '10px';
    turnLeftBtn.addEventListener('click', () => {
        console.log("Manual left turn triggered");
        kart.rotation.y += 0.1;
    });
    
    const turnRightBtn = document.createElement('button');
    turnRightBtn.textContent = 'Turn Right';
    turnRightBtn.style.padding = '10px';
    turnRightBtn.style.marginTop = '10px';
    turnRightBtn.addEventListener('click', () => {
        console.log("Manual right turn triggered");
        kart.rotation.y -= 0.1;
    });
    
    debugContainer.appendChild(moveForwardBtn);
    debugContainer.appendChild(moveBackwardBtn);
    debugContainer.appendChild(document.createElement('br'));
    debugContainer.appendChild(turnLeftBtn);
    debugContainer.appendChild(turnRightBtn);
    
    document.body.appendChild(debugContainer);
}

// Start game
function startGame() {
    console.log("Starting game...");
    gameState.isPlaying = true;
    gameState.currentLap = 1;
    gameState.startTime = performance.now();
    gameState.raceStartTime = performance.now();
    gameState.lapTimes = [];
    gameState.countdownComplete = false;
    
    // Reset kart position
    kart.position.set(18, 0.6, 0); // Position just before the start gate
    kart.rotation.y = Math.PI / 2; // Face counterclockwise (to the left)
    kart.userData.speed = 0;
    kart.userData.acceleration = 0;
    
    // Reset AI karts
    createAIKarts();
    
    // Reset checkpoint states
    if (track && track.userData && track.userData.checkpointStates) {
        track.userData.checkpointStates.fill(false);
    }
    
    // Hide menu
    gameMenu.style.display = 'none';
    
    // Update UI
    updateUI();
    
    // Add debug key listener
    if (DEBUG) {
        window.addEventListener('keydown', (e) => {
            console.log("Key pressed:", e.code);
            if (e.code === 'KeyW') {
                console.log("W key pressed - Control state should update");
            }
        });
    }
    
    // Display countdown or start message
    showCountdown();
}

// Show countdown before race starts
function showCountdown() {
    const countdownContainer = document.createElement('div');
    countdownContainer.style.position = 'absolute';
    countdownContainer.style.top = '50%';
    countdownContainer.style.left = '50%';
    countdownContainer.style.transform = 'translate(-50%, -50%)';
    countdownContainer.style.fontSize = '100px';
    countdownContainer.style.color = 'white';
    countdownContainer.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.5)';
    countdownContainer.style.zIndex = '1000';
    countdownContainer.style.fontFamily = 'Arial, sans-serif';
    countdownContainer.style.fontWeight = 'bold';
    countdownContainer.id = 'countdown';
    
    document.body.appendChild(countdownContainer);
    
    let count = 3;
    countdownContainer.textContent = count;
    
    const countdownInterval = setInterval(() => {
        count--;
        if (count > 0) {
            countdownContainer.textContent = count;
        } else if (count === 0) {
            countdownContainer.textContent = 'GO!';
            countdownContainer.style.color = '#00ff00';
            
            // Enable controls after countdown
            gameState.countdownComplete = true;
            controls.enableControls();
            
            // Play start sound
            playStartSound();
        } else {
            clearInterval(countdownInterval);
            document.body.removeChild(countdownContainer);
        }
    }, 1000);
}

// Play a sound when the race starts
function playStartSound() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = 'square';
    oscillator.frequency.value = 440; // A4 note
    gainNode.gain.value = 0.1;
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.start();
    
    // Frequency sweep
    oscillator.frequency.exponentialRampToValueAtTime(880, audioContext.currentTime + 0.5);
    
    setTimeout(() => {
        oscillator.stop();
    }, 500);
}

// Update UI elements
function updateUI() {
    speedMeter.textContent = `Speed: ${Math.round(gameState.speed * 3.6)} km/h`; // Convert m/s to km/h
    lapCounter.textContent = `Lap: ${gameState.currentLap}/${gameState.totalLaps}`;
    
    if (DEBUG) {
        // Log speed for debugging
        if (gameState.isPlaying && Math.abs(gameState.speed) > 0.01) {
            console.log("Current speed:", gameState.speed);
        }
    }
}

// Handle window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    if (gameState.isPlaying) {
        // Update controls and physics only if countdown is complete
        if (gameState.countdownComplete) {
            // Update controls first
            controls.update();
            
            // Then update physics with the new control inputs
            physics.update();
            
            // Update AI karts
            updateAIKarts();
        }
        
        // Update camera position to follow kart
        const cameraOffset = new THREE.Vector3(0, 5, 10);
        const kartDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(kart.quaternion);
        cameraOffset.applyQuaternion(kart.quaternion);
        camera.position.copy(kart.position).add(cameraOffset);
        camera.lookAt(kart.position);
        
        // Update game state
        gameState.speed = physics.getSpeed();
        
        // Check for lap completion
        if (physics.checkLapComplete()) {
            const lapTime = performance.now() - gameState.startTime;
            gameState.lapTimes.push(lapTime);
            gameState.startTime = performance.now();
            
            // Play sound effect for lap completion
            playLapCompletionSound();
            
            // Show lap completion message
            showLapMessage(gameState.currentLap);
            
            gameState.currentLap++;
            
            // Check if race is complete
            if (gameState.currentLap > gameState.totalLaps) {
                gameState.totalRaceTime = performance.now() - gameState.raceStartTime;
                endGame();
            }
            
            // Update UI
            updateUI();
        }
        
        // Update powerups and jumps in the track
        updateTrackElements();
        
        // Update UI every frame to show current speed
        updateUI();
    }
    
    renderer.render(scene, camera);
}

// Update track elements like powerups
function updateTrackElements() {
    // Update powerups
    if (track && track.userData && track.userData.powerups) {
        track.userData.powerups.children.forEach(powerup => {
            if (powerup.userData && powerup.userData.update) {
                powerup.userData.update();
            }
        });
    }
}

// Play a sound effect for lap completion
function playLapCompletionSound() {
    // Simple beep sound using Web Audio API
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.value = 880; // A5 note
    gainNode.gain.value = 0.1;
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.start();
    setTimeout(() => {
        oscillator.stop();
    }, 300);
}

// Show a message when a lap is completed
function showLapMessage(lapNumber) {
    const lapMessageContainer = document.createElement('div');
    lapMessageContainer.style.position = 'absolute';
    lapMessageContainer.style.top = '30%';
    lapMessageContainer.style.left = '50%';
    lapMessageContainer.style.transform = 'translate(-50%, -50%)';
    lapMessageContainer.style.fontSize = '40px';
    lapMessageContainer.style.color = 'white';
    lapMessageContainer.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.5)';
    lapMessageContainer.style.zIndex = '1000';
    lapMessageContainer.style.fontFamily = 'Arial, sans-serif';
    lapMessageContainer.style.fontWeight = 'bold';
    lapMessageContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    lapMessageContainer.style.padding = '10px 20px';
    lapMessageContainer.style.borderRadius = '10px';
    
    lapMessageContainer.textContent = `Lap ${lapNumber} Complete!`;
    
    document.body.appendChild(lapMessageContainer);
    
    setTimeout(() => {
        document.body.removeChild(lapMessageContainer);
    }, 2000);
}

// End game
function endGame() {
    gameState.isPlaying = false;
    
    // Format lap times and total time
    const formattedLapTimes = gameState.lapTimes.map((time, index) => {
        return `<p>Lap ${index + 1}: ${(time / 1000).toFixed(2)}s</p>`;
    }).join('');
    
    const totalTimeFormatted = (gameState.totalRaceTime / 1000).toFixed(2);
    
    // Show menu with results
    gameMenu.style.display = 'block';
    gameMenu.innerHTML = `
        <h1>Race Complete!</h1>
        <p>Lap Times:</p>
        ${formattedLapTimes}
        <p>Total Time: ${totalTimeFormatted}s</p>
        <button id="restart-button">Restart Race</button>
    `;
    
    document.getElementById('restart-button').addEventListener('click', startGame);
    
    // Play victory sound
    playVictorySound();
}

// Play a victory sound when the race is complete
function playVictorySound() {
    // Simple victory jingle using Web Audio API
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    const playNote = (frequency, startTime, duration) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;
        gainNode.gain.value = 0.1;
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
    };
    
    // Play a simple victory melody
    const now = audioContext.currentTime;
    playNote(523.25, now, 0.2);      // C5
    playNote(659.25, now + 0.2, 0.2); // E5
    playNote(783.99, now + 0.4, 0.2); // G5
    playNote(1046.50, now + 0.6, 0.4); // C6
}

// Event listeners
window.addEventListener('resize', onWindowResize);
startButton.addEventListener('click', startGame);

// Initialize and start animation
initGame();
animate();

// Add a manual test function to verify kart movement
window.testKartMovement = function() {
    console.log("Testing kart movement...");
    if (!gameState.isPlaying) {
        console.log("Game is not playing. Starting game...");
        startGame();
    }
    
    console.log("Setting kart acceleration manually");
    kart.userData.acceleration = 0.1;
    kart.userData.speed = 1.0;
    
    console.log("Current kart data:", {
        position: kart.position,
        rotation: kart.rotation,
        userData: kart.userData
    });
}; 