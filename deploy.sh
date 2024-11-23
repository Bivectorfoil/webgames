#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# =================================================================
# Webgames Deployment Script
# =================================================================
#
# BEFORE RUNNING THIS SCRIPT:
# 1. Make sure you have SSH access to your Linux server
# 2. Copy this script to your server:
#    scp -r * username@your-server-ip:~/webgames/
#
# USAGE:
#   Deploy all games:    sudo ./deploy.sh yourdomain.com
#   Deploy single game:  sudo ./deploy.sh yourdomain.com game_name
#   Show help:          ./deploy.sh --help
#
# REQUIREMENTS:
# - Ubuntu/Debian-based Linux system
# - Sudo privileges
# - Internet connection
# =================================================================

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Function to print help message
print_help() {
    cat << EOF
Webgames Deployment Script
=========================

This script manages the deployment of multiple web-based games to a Linux server.

Usage:
    $(basename "$0") [options] <domain> [game_name]
    
Arguments:
    domain      The domain name for deployment (e.g., games.example.com)
    game_name   (Optional) Specific game to deploy

Options:
    -h, --help  Show this help message
    
Examples:
    # Deploy all games
    sudo ./$(basename "$0") games.example.com
    
    # Deploy specific game
    sudo ./$(basename "$0") games.example.com 2048
    
Games Configuration:
    Games are configured in shared/games.conf with format:
    game_name|build_command|subdomain
    
    Example:
    2048|npm run build|2048    # Will be available at 2048.games.example.com
    
Requirements:
    - Ubuntu/Debian-based Linux system
    - Sudo privileges
    - Internet connection
    - Nginx (will be installed automatically)

For more information, see the README.md file.
EOF
    exit 0
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
        ;;
esac

# Check if domain is provided
if [ -z "$1" ]; then
    print_error "Please provide a domain name. Use --help for usage information."
fi

DOMAIN="$1"
SPECIFIC_GAME="$2"
BASE_DIR="/var/www/webgames"
NGINX_BASE="/etc/nginx/sites-available"
GAMES_CONF="shared/games.conf"

# Update system and install requirements
print_message "Updating system packages..."
apt-get update
apt-get upgrade -y
apt-get install -y nginx

# Function to deploy a single game
deploy_game() {
    local GAME_NAME="$1"
    local BUILD_CMD="$2"
    local SUBDOMAIN="$3"
    
    print_message "Deploying $GAME_NAME..."
    
    # Create game directory
    local GAME_DIR="$BASE_DIR/$GAME_NAME"
    mkdir -p "$GAME_DIR"
    
    # Copy game files
    cp -r "$GAME_NAME"/* "$GAME_DIR/"
    
    # Run build command if it exists
    if [ ! -z "$BUILD_CMD" ]; then
        print_message "Building $GAME_NAME..."
        cd "$GAME_DIR"
        npm install
        eval "$BUILD_CMD"
        cd - > /dev/null
    fi
    
    # Create nginx configuration
    local FULL_DOMAIN
    if [ "$SUBDOMAIN" = "root" ]; then
        FULL_DOMAIN="$DOMAIN"
    else
        FULL_DOMAIN="$SUBDOMAIN.$DOMAIN"
    fi
    
    print_message "Configuring nginx for $FULL_DOMAIN..."
    sed "s/\$DOMAIN/$FULL_DOMAIN/g; s|\$ROOT_DIR|$GAME_DIR|g" shared/nginx.template.conf > "$NGINX_BASE/$GAME_NAME"
    
    # Enable site
    if [ ! -L "/etc/nginx/sites-enabled/$GAME_NAME" ]; then
        ln -s "$NGINX_BASE/$GAME_NAME" "/etc/nginx/sites-enabled/$GAME_NAME"
    fi
    
    # Set permissions
    chown -R www-data:www-data "$GAME_DIR"
    chmod -R 755 "$GAME_DIR"
    
    print_message "$GAME_NAME deployed at http://$FULL_DOMAIN"
}

# Read and process games configuration
while IFS='|' read -r game_name build_cmd subdomain || [ -n "$game_name" ]; do
    # Skip comments and empty lines
    [[ $game_name =~ ^#.*$ || -z $game_name ]] && continue
    
    # If a specific game is requested, only deploy that one
    if [ ! -z "$SPECIFIC_GAME" ] && [ "$SPECIFIC_GAME" != "$game_name" ]; then
        continue
    fi
    
    deploy_game "$game_name" "$build_cmd" "$subdomain"
done < "$GAMES_CONF"

# Test and reload nginx
print_message "Testing nginx configuration..."
nginx -t || print_error "Nginx configuration test failed"

print_message "Reloading nginx..."
systemctl reload nginx

print_message "Deployment completed successfully!"

# Print DNS instructions
print_warning "Don't forget to set up your DNS records:"
while IFS='|' read -r game_name _ subdomain || [ -n "$game_name" ]; do
    [[ $game_name =~ ^#.*$ || -z $game_name ]] && continue
    if [ "$subdomain" = "root" ]; then
        echo "- Point $DOMAIN to your server IP"
    else
        echo "- Point $subdomain.$DOMAIN to your server IP"
    fi
done < "$GAMES_CONF"
