#!/bin/bash

# Build the project
npm run build

# Copy the dist contents to the root directory
cp -r dist/* .

# Create a .nojekyll file to bypass Jekyll processing
touch .nojekyll

echo "Files copied to root directory for GitHub Pages deployment" 