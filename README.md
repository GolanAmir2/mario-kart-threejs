# Mario Kart Three.js

A simple Mario Kart style racing game built with Three.js that runs in the browser.

## Features

- 3D racing game with simple graphics
- Offline single-player mode
- Kart physics with acceleration, steering, and drifting
- Track with lap counting and timing
- Simple collision detection
- Keyboard controls

## Controls

- **W / Up Arrow**: Accelerate
- **S / Down Arrow**: Brake/Reverse
- **A / Left Arrow**: Turn Left
- **D / Right Arrow**: Turn Right
- **Space**: Drift

## Getting Started

### Prerequisites

- Node.js (v14 or higher recommended)
- npm or yarn

### Installation

1. Clone the repository:
```
git clone https://github.com/yourusername/mario-kart-threejs.git
cd mario-kart-threejs
```

2. Install dependencies:
```
npm install
```

3. Start the development server:
```
npm start
```

4. Open your browser and navigate to `http://localhost:5173`

## Project Structure

- `index.html`: Main HTML file
- `src/main.js`: Main game logic and initialization
- `src/utils/`: Utility modules
  - `trackBuilder.js`: Creates the race track
  - `kartBuilder.js`: Creates the kart
  - `controls.js`: Handles user input
  - `physics.js`: Handles game physics

## Building for Production

To build the project for production:

```
npm run build
```

The built files will be in the `dist` directory.

## Future Improvements

- Add multiple tracks
- Add multiple kart options
- Add power-ups and items
- Add AI opponents
- Add sound effects and music
- Add mobile controls

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by Nintendo's Mario Kart series
- Built with Three.js (https://threejs.org/) 