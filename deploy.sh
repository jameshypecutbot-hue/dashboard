#!/bin/bash
# Deploy script for James OS to Vercel

echo "🚀 James OS - Vercel Deployment"
echo "================================"
echo ""

# Check if vercel is installed
if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI..."
    npm install -g vercel
fi

echo "Building project..."
npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build successful!"
    echo ""
    echo "To deploy to Vercel, run:"
    echo "  vercel --prod"
    echo ""
    echo "If not logged in, first run:"
    echo "  vercel login"
else
    echo "❌ Build failed. Please fix errors and try again."
    exit 1
fi
