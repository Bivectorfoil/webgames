#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# =================================================================
# Game of Life Deployment Script
# =================================================================
#
# BEFORE RUNNING THIS SCRIPT:
# 1. Make sure you have SSH access to your Linux server
# 2. Copy this script to your server:
#    scp deploy.sh username@your-server-ip:~/
#
# USAGE:
#   Without domain: sudo ./deploy.sh
#   With domain:    sudo ./deploy.sh yourdomain.com
#
# REQUIREMENTS:
# - Ubuntu/Debian-based Linux system
# - Sudo privileges on the server
# - Internet connection for package installation
#
# This script will:
# - Create a dedicated non-root user for the application
# - Install and configure all necessary dependencies
# - Set up Nginx as the web server
# - Configure basic security settings
# =================================================================

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Function to print help message
print_help() {
    echo "Game of Life Deployment Script"
    echo
    echo "Usage:"
    echo "  sudo $0 [domain]"
    echo
    echo "Options:"
    echo "  domain    Optional domain name for the server"
    echo "  -h        Display this help message"
    echo
    echo "Examples:"
    echo "  sudo $0                   # Deploy without domain"
    echo "  sudo $0 game-of-life.com  # Deploy with domain"
    echo
}

# Function to print colored messages
print_message() {
    echo -e "${GREEN}[INFO] $1${NC}"
}

# Function to print error messages
print_error() {
    echo -e "${RED}[ERROR] $1${NC}" >&2
    exit 1
}

# Function to print warning messages
print_warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

# Parse command line arguments
case "$1" in
    -h|--help)
        print_help
        exit 0
        ;;
esac

# Check if script is run as root
if [[ $EUID -ne 0 ]]; then
    print_error "This script must be run as root (sudo)"
fi

# Configuration variables
DOMAIN=${1:-localhost}
APP_USER="game-of-life"
APP_DIR="/var/www/game-of-life"
NGINX_CONF="/etc/nginx/sites-available/game-of-life"

print_message "Starting Game of Life deployment..."

# Update system packages
print_message "Updating system packages..."
apt-get update
apt-get upgrade -y

# Install required packages
print_message "Installing required packages..."
apt-get install -y nginx

# Create application user if it doesn't exist
if ! id "$APP_USER" &>/dev/null; then
    print_message "Creating application user..."
    useradd -r -s /bin/false "$APP_USER"
fi

# Create application directory
print_message "Setting up application directory..."
mkdir -p "$APP_DIR"

# Build TypeScript files
print_message "Building TypeScript files..."
npm install
npm run build

# Copy application files
print_message "Copying application files..."
cp -r index.html dist/* "$APP_DIR/"

# Set proper ownership and permissions
chown -R "$APP_USER:$APP_USER" "$APP_DIR"
chmod -R 755 "$APP_DIR"

# Configure Nginx
print_message "Configuring Nginx..."
sed "s/\$DOMAIN/$DOMAIN/g; s|\$ROOT_DIR|$APP_DIR|g" nginx.conf > "$NGINX_CONF"

# Create symbolic link if it doesn't exist
if [[ ! -L "/etc/nginx/sites-enabled/game-of-life" ]]; then
    ln -s "$NGINX_CONF" "/etc/nginx/sites-enabled/game-of-life"
fi

# Remove default Nginx site if it exists
if [[ -L "/etc/nginx/sites-enabled/default" ]]; then
    rm "/etc/nginx/sites-enabled/default"
fi

# Test Nginx configuration
print_message "Testing Nginx configuration..."
nginx -t || print_error "Nginx configuration test failed"

# Restart Nginx
print_message "Restarting Nginx..."
systemctl restart nginx

print_message "Game of Life deployment completed successfully!"
print_message "You can now access the game at: http://$DOMAIN"

if [[ "$DOMAIN" != "localhost" ]]; then
    print_warning "Don't forget to set up your DNS records to point to this server!"
fi
