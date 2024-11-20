#!/bin/bash

# Configuration variables
APP_NAME="2048-game"
APP_USER="webgames"
APP_DIR="/var/www/$APP_NAME"
DOMAIN="" # Will be set from command line argument
NODE_VERSION="18"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

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

# Check for domain argument
if [ "$1" ]; then
    DOMAIN=$1
    print_message "Domain set to: $DOMAIN"
else
    print_warning "No domain provided. Will only set up with IP address."
fi

# Create application user if it doesn't exist
print_message "Setting up application user..."
if ! id "$APP_USER" &>/dev/null; then
    sudo useradd -m -s /bin/bash "$APP_USER" || print_error "Failed to create user $APP_USER"
    print_message "Created user $APP_USER"
fi

# Update system
print_message "Updating system packages..."
sudo apt-get update && sudo apt-get upgrade -y || print_error "Failed to update system packages"

# Install required packages
print_message "Installing required packages..."
sudo apt-get install -y curl git ufw build-essential || print_error "Failed to install basic packages"

# Install Node.js
print_message "Installing Node.js $NODE_VERSION..."
if ! command -v node &>/dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
    sudo apt-get install -y nodejs || print_error "Failed to install Node.js"
fi

# Set up application directory
print_message "Setting up application directory..."
sudo mkdir -p "$APP_DIR"
sudo chown "$APP_USER:$APP_USER" "$APP_DIR"

# Clone or update repository
print_message "Deploying application code..."
if [ -d "$APP_DIR/.git" ]; then
    cd "$APP_DIR" || print_error "Failed to change to $APP_DIR"
    sudo -u "$APP_USER" git pull || print_error "Failed to pull latest changes"
else
    sudo -u "$APP_USER" git clone https://github.com/gabrielecirulli/2048.git "$APP_DIR" || print_error "Failed to clone repository"
fi

# Install dependencies
print_message "Installing dependencies..."
cd "$APP_DIR" || print_error "Failed to change to $APP_DIR"
sudo -u "$APP_USER" npm install || print_error "Failed to install dependencies"

# Set up Nginx
print_message "Setting up Nginx..."
sudo apt-get install -y nginx || print_error "Failed to install Nginx"

# Create Nginx configuration
print_message "Creating Nginx configuration..."
sudo tee "/etc/nginx/sites-available/$APP_NAME" > /dev/null << EOF
server {
    listen 80;
    server_name ${DOMAIN:-_};
    root $APP_DIR;
    index index.html;

    location / {
        try_files \$uri \$uri/ =404;
    }
}
EOF

# Enable the site
sudo ln -sf "/etc/nginx/sites-available/$APP_NAME" "/etc/nginx/sites-enabled/"
sudo rm -f "/etc/nginx/sites-enabled/default"

# Configure firewall
print_message "Configuring firewall..."
sudo ufw allow 'Nginx Full' || print_warning "Failed to configure firewall for Nginx"
sudo ufw allow OpenSSH || print_warning "Failed to configure firewall for SSH"
sudo ufw --force enable || print_warning "Failed to enable firewall"

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
