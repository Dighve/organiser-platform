#!/bin/bash

# Organiser Platform Deployment Script
# This script helps deploy the application to various environments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."
    
    if ! command_exists docker; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command_exists kubectl; then
        print_warn "kubectl is not installed. Kubernetes deployment will not be available."
    fi
    
    print_info "Prerequisites check completed."
}

# Build Docker images
build_images() {
    print_info "Building Docker images..."
    
    # Build backend
    print_info "Building backend image..."
    cd backend
    docker build -t organiser-platform-backend:latest .
    cd ..
    
    # Build frontend
    print_info "Building frontend image..."
    cd frontend
    docker build -t organiser-platform-frontend:latest .
    cd ..
    
    print_info "Docker images built successfully."
}

# Deploy using Docker Compose
deploy_docker_compose() {
    print_info "Deploying with Docker Compose..."
    docker-compose up -d
    print_info "Application deployed successfully!"
    print_info "Frontend: http://localhost:3000"
    print_info "Backend API: http://localhost:8080"
    print_info "API Docs: http://localhost:8080/actuator"
}

# Deploy to Kubernetes
deploy_kubernetes() {
    print_info "Deploying to Kubernetes..."
    
    if ! command_exists kubectl; then
        print_error "kubectl is not installed. Cannot deploy to Kubernetes."
        exit 1
    fi
    
    # Apply Kubernetes manifests
    kubectl apply -f k8s/namespace.yaml
    kubectl apply -f k8s/postgres-deployment.yaml
    kubectl apply -f k8s/redis-deployment.yaml
    
    # Wait for database to be ready
    print_info "Waiting for PostgreSQL to be ready..."
    kubectl wait --for=condition=ready pod -l app=postgres -n organiser-platform --timeout=300s
    
    print_info "Waiting for Redis to be ready..."
    kubectl wait --for=condition=ready pod -l app=redis -n organiser-platform --timeout=300s
    
    # Deploy application
    kubectl apply -f k8s/backend-deployment.yaml
    kubectl apply -f k8s/frontend-deployment.yaml
    
    print_info "Kubernetes deployment completed!"
    print_info "Run 'kubectl get services -n organiser-platform' to see service endpoints"
}

# Stop Docker Compose deployment
stop_docker_compose() {
    print_info "Stopping Docker Compose deployment..."
    docker-compose down
    print_info "Deployment stopped."
}

# Show logs
show_logs() {
    if [ "$1" == "docker" ]; then
        docker-compose logs -f
    elif [ "$1" == "k8s" ]; then
        kubectl logs -f -l app=backend -n organiser-platform
    else
        print_error "Invalid option. Use 'docker' or 'k8s'"
    fi
}

# Main menu
show_menu() {
    echo ""
    echo "========================================="
    echo "  Organiser Platform Deployment Script"
    echo "========================================="
    echo "1. Build Docker images"
    echo "2. Deploy with Docker Compose"
    echo "3. Deploy to Kubernetes"
    echo "4. Stop Docker Compose"
    echo "5. Show logs (Docker)"
    echo "6. Show logs (Kubernetes)"
    echo "7. Exit"
    echo "========================================="
}

# Main script
main() {
    check_prerequisites
    
    while true; do
        show_menu
        read -p "Select an option: " choice
        
        case $choice in
            1)
                build_images
                ;;
            2)
                deploy_docker_compose
                ;;
            3)
                deploy_kubernetes
                ;;
            4)
                stop_docker_compose
                ;;
            5)
                show_logs "docker"
                ;;
            6)
                show_logs "k8s"
                ;;
            7)
                print_info "Exiting..."
                exit 0
                ;;
            *)
                print_error "Invalid option. Please try again."
                ;;
        esac
    done
}

# Run main function
main
