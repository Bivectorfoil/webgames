# 2048 Game with AI

A web-based implementation of the 2048 game with an AI auto-play feature.

## Local Development

Simply open `index.html` in your browser, or use VS Code's Live Server extension for auto-reload functionality.

## Deployment Instructions

### Prerequisites
- A Linux-based VPS with SSH access
- Basic understanding of terminal commands
- Sudo privileges on the server

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

### VPS Deployment

The game comes with an automated deployment script that handles everything for you, including:
- Creating a dedicated user for the application
- Installing all required dependencies
- Setting up Nginx as the web server
- Configuring proper permissions and security settings

#### Quick Deployment

1. Connect to your VPS via SSH:
   ```bash
   ssh username@your-vps-ip
   ```

2. Copy the deployment files to your server:
   ```bash
   # From your local machine
   scp -r deploy.sh username@your-vps-ip:~/
   ```

3. Run the deployment script:
   ```bash
   # Without a domain
   sudo ./deploy.sh

   # With a domain
   sudo ./deploy.sh yourdomain.com
   ```

The script will:
- Create a dedicated `webgames` user for running the application
- Install Node.js and other required dependencies
- Set up Nginx as the web server
- Configure the firewall (UFW)
- Deploy the application securely

#### Post-Deployment

After successful deployment:
1. Your game will be accessible at:
   - `http://your-server-ip` (if no domain was provided)
   - `http://yourdomain.com` (if a domain was provided)

2. The application files will be located at `/var/www/2048-game`

3. The web server configuration will be at `/etc/nginx/sites-available/2048-game`

### Security Notes

- The application runs under a dedicated non-root user for improved security
- Only necessary system ports (80, 443, and SSH) are opened in the firewall
- All system-level operations use sudo with minimal required permissions
- Application files are owned by the dedicated user

### Troubleshooting

If you encounter any issues:
1. Check the Nginx error logs:
   ```bash
   sudo tail -f /var/nginx/error.log
   ```

2. Verify the Nginx configuration:
   ```bash
   sudo nginx -t
   ```

3. Check the application file permissions:
   ```bash
   ls -la /var/www/2048-game
   ```

### Need Help?

If you encounter any problems during deployment, please:
1. Check the error messages in the terminal
2. Review the troubleshooting steps above
3. Open an issue in the repository with details about the problem
