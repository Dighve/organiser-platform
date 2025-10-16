#!/bin/bash

# PostgreSQL Local Testing Setup Script for HikeHub
# This script helps you quickly set up and test PostgreSQL migrations locally

set -e  # Exit on any error

echo "🐘 HikeHub PostgreSQL Local Testing Setup"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if PostgreSQL is installed
echo "1️⃣  Checking PostgreSQL installation..."
if command -v psql &> /dev/null; then
    echo -e "${GREEN}✅ PostgreSQL is installed${NC}"
    psql --version
else
    echo -e "${RED}❌ PostgreSQL is not installed${NC}"
    echo ""
    echo "Please install PostgreSQL:"
    echo "  macOS:   brew install postgresql@15"
    echo "  Ubuntu:  sudo apt install postgresql"
    echo "  Windows: https://www.postgresql.org/download/windows/"
    exit 1
fi

echo ""

# Check if PostgreSQL is running
echo "2️⃣  Checking if PostgreSQL is running..."
if pg_isready -q; then
    echo -e "${GREEN}✅ PostgreSQL is running${NC}"
else
    echo -e "${YELLOW}⚠️  PostgreSQL is not running${NC}"
    echo "Starting PostgreSQL..."
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        brew services start postgresql@15 || brew services start postgresql
        sleep 2
        if pg_isready -q; then
            echo -e "${GREEN}✅ PostgreSQL started successfully${NC}"
        else
            echo -e "${RED}❌ Failed to start PostgreSQL${NC}"
            exit 1
        fi
    else
        echo "Please start PostgreSQL manually:"
        echo "  Linux: sudo systemctl start postgresql"
        echo "  macOS: brew services start postgresql@15"
        exit 1
    fi
fi

echo ""

# Create test database
echo "3️⃣  Setting up test database..."
DB_NAME="hikehub_test"
DB_USER="postgres"

# Check if database exists
if psql -U $DB_USER -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
    echo -e "${YELLOW}⚠️  Database '$DB_NAME' already exists${NC}"
    read -p "Do you want to drop and recreate it? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Dropping existing database..."
        psql -U $DB_USER -c "DROP DATABASE $DB_NAME;" postgres
        echo "Creating fresh database..."
        psql -U $DB_USER -c "CREATE DATABASE $DB_NAME;" postgres
        echo -e "${GREEN}✅ Database recreated${NC}"
    else
        echo "Using existing database..."
    fi
else
    echo "Creating database '$DB_NAME'..."
    psql -U $DB_USER -c "CREATE DATABASE $DB_NAME;" postgres
    echo -e "${GREEN}✅ Database created${NC}"
fi

echo ""

# Navigate to backend directory
echo "4️⃣  Navigating to backend directory..."
BACKEND_DIR="$(cd "$(dirname "$0")/backend" && pwd)"
if [ -d "$BACKEND_DIR" ]; then
    cd "$BACKEND_DIR"
    echo -e "${GREEN}✅ In directory: $BACKEND_DIR${NC}"
else
    echo -e "${RED}❌ Backend directory not found${NC}"
    exit 1
fi

echo ""

# Check if Gradle wrapper exists
if [ ! -f "./gradlew" ]; then
    echo -e "${RED}❌ Gradle wrapper not found${NC}"
    exit 1
fi

echo "5️⃣  Running application with PostgreSQL..."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Starting Spring Boot application..."
echo "Profile: postgres-local"
echo "Database: postgresql://localhost:5432/$DB_NAME"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Watch for:"
echo "  ✅ 'Successfully validated 4 migrations'"
echo "  ✅ 'Successfully applied 4 migrations'"
echo "  ✅ 'Started OrganiserPlatformApplication'"
echo ""
echo "Press Ctrl+C to stop the application"
echo ""

# Run the application
./gradlew bootRun --args='--spring.profiles.active=postgres-local'
