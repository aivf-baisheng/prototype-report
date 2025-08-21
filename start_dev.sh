#!/bin/bash

# Development startup script for prototype-report
# This script activates the conda environment and starts both backend and frontend

set -e  # Exit on any error

echo "🚀 Starting prototype-report development environment..."

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

# Install Python dependencies
print_status "Installing Python dependencies..."
cd backend
if [ ! -d "venv" ]; then
    print_status "Creating Python virtual environment..."
    python -m venv venv
fi

source venv/bin/activate
pip install -r requirements.txt
print_success "Python dependencies installed"
cd ..

# Install Node.js dependencies
print_status "Installing Node.js dependencies..."
npm install
print_success "Node.js dependencies installed"

# Function to cleanup background processes on exit
cleanup() {
    print_status "Shutting down development servers..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
        print_status "Backend server stopped"
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
        print_status "Frontend server stopped"
    fi
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM EXIT

# Start backend server
print_status "Starting FastAPI backend server..."
cd backend
source venv/bin/activate
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Check if backend is running
if ! curl -s http://localhost:8000/ > /dev/null; then
    print_error "Backend server failed to start"
    exit 1
fi

print_success "Backend server started on http://localhost:8000"

# Start frontend server
print_status "Starting Next.js frontend server..."
npm run dev &
FRONTEND_PID=$!

# Wait a moment for frontend to start
sleep 5

# Check if frontend is running
if ! curl -s http://localhost:3000/ > /dev/null; then
    print_warning "Frontend server may still be starting up..."
else
    print_success "Frontend server started on http://localhost:3000"
fi

echo ""
echo "🎉 Development environment is ready!"
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend:  http://localhost:8000"
echo "📊 API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for user to stop the script
wait
