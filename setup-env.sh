#!/bin/bash

# Setup script for OutMeets local environment
# This script helps you create .env.local and export environment variables

echo "🔧 OutMeets Environment Setup"
echo "=============================="
echo ""

# Check if we're in the right directory
if [ ! -f "backend/.env.example" ]; then
    echo "❌ Error: backend/.env.example not found"
    echo "Please run this script from the organiser-platform directory"
    exit 1
fi

# Step 1: Create .env.local if it doesn't exist
if [ ! -f "backend/.env.local" ]; then
    echo "📝 Creating backend/.env.local from .env.example..."
    cp backend/.env.example backend/.env.local
    echo "✅ Created backend/.env.local"
else
    echo "✅ backend/.env.local already exists"
fi

echo ""
echo "🔐 Environment variables ready!"
echo ""
echo "To run the backend with environment variables, use:"
echo ""
echo "  cd backend"
echo "  source ../setup-env.sh && ./gradlew bootRun"
echo ""
echo "Or export them manually:"
echo ""
echo "  export JWT_SECRET=+VmXJcX/z6pcpMsQ1F5fh6jiocGxejgNvr3Lnyt3zGIwisgVfrvORTlfJ0dp48Atrm/+rHAcVAPDT/gzLMBdTA=="
echo "  export CLOUDINARY_CLOUD_NAME=drdttgry4"
echo "  export CLOUDINARY_API_KEY=478746114596374"
echo "  export CLOUDINARY_API_SECRET=wXiHJlL_64SuSpyTUc7ajf8KdV4"
echo ""
echo "⚠️  IMPORTANT: Rotate your Cloudinary keys!"
echo "   Your secrets were exposed in Git history."
echo "   Visit: https://console.cloudinary.com/"
echo ""

# If sourced, export the variables
if [ "${BASH_SOURCE[0]}" != "${0}" ]; then
    echo "📤 Exporting environment variables..."
    export JWT_SECRET="+VmXJcX/z6pcpMsQ1F5fh6jiocGxejgNvr3Lnyt3zGIwisgVfrvORTlfJ0dp48Atrm/+rHAcVAPDT/gzLMBdTA=="
    export CLOUDINARY_CLOUD_NAME=drdttgry4
    export CLOUDINARY_API_KEY=478746114596374
    export CLOUDINARY_API_SECRET=wXiHJlL_64SuSpyTUc7ajf8KdV4
    echo "✅ Environment variables exported!"
fi
