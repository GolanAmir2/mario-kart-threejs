# Mario Kart Three.js

A Mario Kart style racing game built with Three.js that runs in the browser.

## Play Online

You can play the game online at: [https://YOUR_USERNAME.github.io/mario-kart-threejs/](https://YOUR_USERNAME.github.io/mario-kart-threejs/)

(Replace YOUR_USERNAME with your GitHub username after deployment)

## Features

- 3D racing game with simple graphics
- Offline single-player mode with AI opponents
- Complex track with different turns and challenges
- Powerups (speed boost, shield)
- Jumps and obstacles
- Collision detection
- Lap counting and timing

## Controls

- **W / Up Arrow**: Accelerate
- **S / Down Arrow**: Brake/Reverse
- **A / Left Arrow**: Turn Left
- **D / Right Arrow**: Turn Right
- **Space**: Drift
- **Shift**: Jump
- **E**: Use Powerup

## Game Elements

- **Red Kart**: Player
- **Green/Blue/Yellow Karts**: AI opponents
- **Red Boxes**: Speed boost powerups
- **Blue Boxes**: Shield powerups
- **Yellow Ramps**: Jumps
- **Trees/Barriers**: Obstacles (avoid collision)

## Getting Started Locally

### Prerequisites

- Node.js (v14 or higher recommended)
- npm or yarn

### Installation

1. Clone the repository:
```
git clone https://github.com/YOUR_USERNAME/mario-kart-threejs.git
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

## Building for Production

To build the project for production:

```
npm run build
```

The built files will be in the `dist` directory.

## Deployment

The game is deployed using GitHub Pages from the `gh-pages` branch. To deploy updates:

1. Make your changes
2. Run the deployment script:
```
./deploy.sh
```
3. Commit and push the changes:
```
git add .
git commit -m "Update game"
git push origin gh-pages
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by Nintendo's Mario Kart series
- Built with Three.js (https://threejs.org/) 