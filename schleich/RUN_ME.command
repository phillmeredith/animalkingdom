#!/bin/bash
# Double-click this file to download all Schleich animal images
# and create the JSON file with local image paths.

cd "$(dirname "$0")"
echo "=== Schleich Animal Downloader ==="
echo ""
echo "This will download 566 animal images to ./images/"
echo "and create schleich_animals.json with local paths."
echo ""

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed."
    echo "Please install it from https://nodejs.org/"
    echo ""
    echo "Press any key to exit..."
    read -n 1
    exit 1
fi

echo "Starting download..."
echo ""
node download_schleich.js

echo ""
echo "=== Complete! ==="
echo "Press any key to close this window..."
read -n 1
