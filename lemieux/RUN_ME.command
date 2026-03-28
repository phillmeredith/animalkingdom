#!/bin/bash
cd "$(dirname "$0")"
echo "=== LeMieux Product Downloader ==="
echo ""
echo "This will create two folders:"
echo "  ./hobby-horses/  - Hobby horses and their accessories"
echo "  ./horsewear/     - Real horse accessories"
echo ""

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
node download_lemieux.js

echo ""
echo "=== Complete! ==="
echo "Press any key to close this window..."
read -n 1
