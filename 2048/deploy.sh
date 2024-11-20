#!/bin/bash

# Configuration variables
APP_NAME="2048-game"
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

# Check if script is run as root
if [ "$EUID" -ne 0 ]; then 
    print_error "Please run as root (use sudo)"
fi

# Check for domain argument
if [ "$1" ]; then
    DOMAIN=$1
    print_message "Domain set to: $DOMAIN"
else
    print_warning "No domain provided. Will only set up with IP address."
fi

# Update system
print_message "Updating system packages..."
apt-get update && apt-get upgrade -y || print_error "Failed to update system packages"

# Install required packages
print_message "Installing required packages..."
apt-get install -y curl git ufw build-essential || print_error "Failed to install basic packages"

# Install Node.js
print_message "Installing Node.js $NODE_VERSION..."
curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash - || print_error "Failed to setup Node.js repository"
apt-get install -y nodejs || print_error "Failed to install Node.js"

# Install PM2 globally
print_message "Installing PM2..."
npm install -g pm2 || print_error "Failed to install PM2"

# Create application directory
print_message "Creating application directory..."
mkdir -p $APP_DIR || print_error "Failed to create application directory"

# Copy all files to app directory
print_message "Copying application files..."
cp -r * $APP_DIR/ || print_error "Failed to copy application files"

# Install dependencies
print_message "Installing npm dependencies..."
cd $APP_DIR
npm install || print_error "Failed to install npm dependencies"

# Configure firewall
print_message "Configuring firewall..."
ufw allow ssh
ufw allow http
ufw allow https
ufw --force enable

# Install and configure Nginx
print_message "Installing and configuring Nginx..."
apt-get install -y nginx || print_error "Failed to install Nginx"

# Configure Nginx using external config file
print_message "Configuring Nginx..."
# Replace domain placeholder in nginx config
sed "s/\$DOMAIN/$DOMAIN/" nginx.conf > /etc/nginx/sites-available/$APP_NAME

# Enable the site
ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t || print_error "Nginx configuration test failed"

# Restart Nginx
systemctl restart nginx

# Start application with PM2
print_message "Starting application with PM2..."
cd $APP_DIR
pm2 start server.js --name "$APP_NAME" || print_error "Failed to start application with PM2"
pm2 save || print_error "Failed to save PM2 configuration"

# Configure PM2 to start on boot
pm2 startup systemd || print_error "Failed to setup PM2 startup script"

# Install and configure SSL if domain is provided
if [ ! -z "$DOMAIN" ]; then
    print_message "Setting up SSL with Let's Encrypt..."
    apt-get install -y certbot python3-certbot-nginx || print_error "Failed to install Certbot"
    certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN || print_warning "SSL setup failed, please run 'certbot --nginx' manually"
fi

print_message "Deployment completed successfully!"
if [ ! -z "$DOMAIN" ]; then
    echo -e "${GREEN}Your application is now available at: https://$DOMAIN${NC}"
else
    echo -e "${GREEN}Your application is now available at: http://YOUR_SERVER_IP${NC}"
fi
echo -e "${YELLOW}Please make sure to set up your domain's DNS to point to this server if you provided a domain.${NC}"
