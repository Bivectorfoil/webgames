#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# =================================================================
# 2048 Game Deployment Script
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
NC='\033[0m' # No Color

# Function to print help message
print_help() {
    cat << EOF
Usage: $(basename $0) [OPTIONS] [DOMAIN]

Deploy the 2048 game to a Linux server.

Options:
    -h, --help     Show this help message and exit

Arguments:
    DOMAIN         Optional. Your domain name (e.g., example.com)
                   If not provided, the app will be accessible via IP address

Examples:
    $(basename $0)                    # Deploy without domain
    $(basename $0) example.com        # Deploy with domain
    $(basename $0) -h                 # Show this help message

Requirements:
    - Ubuntu/Debian-based Linux system
    - Sudo privileges
    - Internet connection

For more information, visit: https://github.com/Bivectorfoil/webgames
EOF
    exit 0
}

# Function to print colored messages
print_message() {
    echo -e "${GREEN}[INFO] $1${NC}"
}

print_error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

print_warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

# Parse command line arguments
case "$1" in
    -h|--help)
        print_help
        ;;
esac

# Configuration variables
APP_NAME="2048-game"
APP_USER="webgames"
APP_DIR="/var/www/$APP_NAME"
DOMAIN="$1" # Will be set from command line argument
NODE_VERSION="18"

# Print welcome message and script info
print_message "2048 Game Deployment Script"
print_message "=========================="
print_message "This script will deploy the 2048 game with the following configuration:"
print_message "- Application Name: $APP_NAME"
print_message "- Application User: $APP_USER"
print_message "- Install Directory: $APP_DIR"
if [ -n "$DOMAIN" ]; then
    print_message "- Domain: $DOMAIN"
else
    print_warning "No domain provided. The app will be accessible via IP address."
fi
print_message "=========================="
echo

# Check if script is run with sudo
if [ "$(id -u)" -ne 0 ]; then 
    print_error "This script must be run with sudo privileges. Try: sudo $0 $*"
fi

# Create application user if it doesn't exist
print_message "Setting up application user..."
if ! id "$APP_USER" &>/dev/null; then
    sudo useradd -m -s /bin/bash "$APP_USER" || print_error "Failed to create user $APP_USER"
    print_message "Created user $APP_USER"
fi

# Update system
print_message "Updating system packages..."
sudo apt-get update || print_error "Failed to update package list"
sudo apt-get upgrade -y || print_error "Failed to upgrade system packages"

# Install required packages
print_message "Installing required packages..."
sudo apt-get install -y curl git ufw build-essential || print_error "Failed to install basic packages"

# Install Node.js
print_message "Installing Node.js $NODE_VERSION..."
if ! command -v node &>/dev/null; then
    curl -fsSL "https://deb.nodesource.com/setup_${NODE_VERSION}.x" | sudo -E bash - || print_error "Failed to setup Node.js repository"
    sudo apt-get install -y nodejs || print_error "Failed to install Node.js"
fi

# Set up application directory
print_message "Setting up application directory..."
sudo mkdir -p "$APP_DIR" || print_error "Failed to create application directory"
sudo chown "$APP_USER:$APP_USER" "$APP_DIR" || print_error "Failed to set directory ownership"

# Copy application files
print_message "Copying application files..."
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
sudo cp -r "$SCRIPT_DIR"/* "$APP_DIR/" || print_error "Failed to copy application files"
sudo chown -R "$APP_USER:$APP_USER" "$APP_DIR" || print_error "Failed to set files ownership"

# Set up Nginx
print_message "Setting up Nginx..."
sudo apt-get install -y nginx || print_error "Failed to install Nginx"

# Create Nginx configuration
print_message "Creating Nginx configuration..."
# Replace variables in nginx.conf template
sed "s/\$DOMAIN/${DOMAIN:-_}/g; s|\$ROOT_DIR|$APP_DIR|g" "$SCRIPT_DIR/nginx.conf" | \
    sudo tee "/etc/nginx/sites-available/$APP_NAME" > /dev/null || \
    print_error "Failed to create Nginx configuration"

# Enable the site
sudo ln -sf "/etc/nginx/sites-available/$APP_NAME" "/etc/nginx/sites-enabled/" || print_error "Failed to enable Nginx site"
sudo rm -f "/etc/nginx/sites-enabled/default" || print_warning "Failed to remove default Nginx site"

# Configure firewall
print_message "Configuring firewall..."
sudo ufw allow 'Nginx Full' || print_error "Failed to configure firewall for Nginx"
sudo ufw allow OpenSSH || print_error "Failed to configure firewall for SSH"
sudo ufw --force enable || print_error "Failed to enable firewall"

# Test and reload Nginx
print_message "Testing and reloading Nginx configuration..."
sudo nginx -t || print_error "Nginx configuration test failed"
sudo systemctl reload nginx || print_error "Failed to reload Nginx"

print_message "Deployment completed successfully!"
if [ -n "$DOMAIN" ]; then
    print_message "Your application should now be accessible at: http://$DOMAIN"
else
    print_message "Your application should now be accessible at your server's IP address"
fi
