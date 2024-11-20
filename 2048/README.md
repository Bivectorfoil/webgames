# 2048 Game with AI

A web-based implementation of the 2048 game with an AI auto-play feature.

## Deployment Instructions

### Prerequisites
- Node.js (v14 or higher)
- npm (Node Package Manager)
- A VPS with SSH access

### Local Setup
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   npm start
   ```
4. Visit `http://localhost:3000` in your browser

### VPS Deployment Steps

1. Connect to your VPS via SSH:
   ```bash
   ssh username@your-vps-ip
   ```

2. Install Node.js and npm (if not already installed):
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. Create a directory for the game and navigate to it:
   ```bash
   mkdir 2048-game
   cd 2048-game
   ```

4. Upload the game files to your VPS:
   - Using SCP from your local machine:
     ```bash
     scp -r * username@your-vps-ip:/path/to/2048-game/
     ```
   - Or using Git if you have a repository:
     ```bash
     git clone your-repository-url
     ```

5. Install dependencies:
   ```bash
   npm install
   ```

6. Install PM2 (process manager) to keep the server running:
   ```bash
   sudo npm install -g pm2
   ```

7. Start the server with PM2:
   ```bash
   pm2 start server.js --name "2048-game"
   ```

8. (Optional) Configure PM2 to start on system boot:
   ```bash
   pm2 startup
   pm2 save
   ```

9. Configure your firewall to allow traffic on port 3000:
   ```bash
   sudo ufw allow 3000
   ```

Your game should now be accessible at `http://your-vps-ip:3000`

### Quick Deployment

A deployment script (`deploy.sh`) is provided for easy deployment to Ubuntu 22.04 VPS servers. The script automates all the necessary setup steps including Node.js installation, Nginx configuration, and SSL setup.

### Using the Deployment Script

1. Make the script executable:
   ```bash
   chmod +x deploy.sh
   ```

2. Upload your project files to your VPS:
   ```bash
   scp -r * username@your-vps-ip:~/2048-game/
   ```

3. SSH into your VPS:
   ```bash
   ssh username@your-vps-ip
   ```

4. Run the deployment script:
   - With a domain:
     ```bash
     cd 2048-game
     sudo ./deploy.sh your-domain.com
     ```
   - Without a domain:
     ```bash
     cd 2048-game
     sudo ./deploy.sh
     ```

The script will automatically:
- Update system packages
- Install Node.js 18 and required dependencies
- Set up PM2 for process management
- Configure Nginx as a reverse proxy
- Set up UFW firewall rules
- Install SSL certificate (if domain provided)
- Start your application

After deployment, your game will be:
- Available on HTTP (port 80) and HTTPS (port 443, if domain provided)
- Managed by PM2 with auto-restart capability
- Protected by UFW firewall
- Served through Nginx reverse proxy
- Configured to start automatically on system reboot

### Optional: Setting up with Nginx (Recommended)

1. Install Nginx:
   ```bash
   sudo apt-get install nginx
   ```

2. Create an Nginx configuration file:
   ```bash
   sudo nano /etc/nginx/sites-available/2048-game
   ```

3. Add the following configuration:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

4. Enable the site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/2048-game /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

5. (Optional) Set up SSL with Let's Encrypt:
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

Your game will now be accessible at `http://your-domain.com` (or `https://` if you set up SSL).
