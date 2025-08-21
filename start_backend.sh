#!/bin/bash

# Backend startup script for prototype-report
# This script activates the conda environment and starts only the FastAPI backend

set -e  # Exit on any error

echo "🔧 Starting prototype-report backend server..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if conda is available
if ! command -v conda &> /dev/null; then
    print_error "Conda is not installed or not in PATH"
    exit 1
fi

# Activate conda environment
print_status "Activating conda environment: nodejs-lts"
source $(conda info --base)/etc/profile.d/conda.sh
conda activate nodejs-lts

# Verify environment activation
if [[ "$CONDA_DEFAULT_ENV" != "nodejs-lts" ]]; then
    print_error "Failed to activate conda environment"
    exit 1
fi

print_success "Conda environment activated: $CONDA_DEFAULT_ENV"

# Navigate to backend directory
print_status "Setting up backend environment..."
cd backend

# Check if virtual environment exists, create if not
if [ ! -d "venv" ]; then
    print_status "Creating Python virtual environment..."
    python -m venv venv
fi

# Activate virtual environment
print_status "Activating Python virtual environment..."
source venv/bin/activate

# Install/update Python dependencies
print_status "Installing Python dependencies..."
pip install -r requirements.txt
print_success "Python dependencies installed"

# Check if requirements.txt exists
if [ ! -f "requirements.txt" ]; then
    print_warning "requirements.txt not found, creating basic requirements..."
    echo "fastapi" > requirements.txt
    echo "uvicorn" >> requirements.txt
    echo "pydantic" >> requirements.txt
    pip install -r requirements.txt
fi

# Function to cleanup background processes on exit
cleanup() {
    print_status "Shutting down backend server..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
        print_status "Backend server stopped"
    fi
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM EXIT

# Start backend server
print_status "Starting FastAPI backend server..."
print_status "Server will be available at: http://localhost:8000"
print_status "API documentation at: http://localhost:8000/docs"
echo ""

# Start the server with uvicorn
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Check if backend is running
if curl -s http://localhost:8000/ > /dev/null; then
    print_success "✅ Backend server is running successfully!"
    echo ""
    echo "🌐 Server URL: http://localhost:8000"
    echo "📚 API Docs:  http://localhost:8000/docs"
    echo "🔍 Health Check: http://localhost:8000/"
    echo ""
    echo "Press Ctrl+C to stop the backend server"
    
    # Wait for the backend process
    wait $BACKEND_PID
else
    print_error "❌ Backend server failed to start"
    print_status "Checking for errors..."
    
    # Try to get more information about the failure
    if [ -f "uvicorn.log" ]; then
        print_status "Last few lines of uvicorn log:"
        tail -10 uvicorn.log
    fi
    
    exit 1
fi
