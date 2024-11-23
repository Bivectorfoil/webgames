# Conway's Game of Life

This is a simple implementation of Conway's Game of Life in TypeScript and HTML. The game is implemented using a 2D grid of cells, where each cell can be alive or dead. The game rules are as follows:

1. Any live cell with two or three live neighbors survives.
2. Any dead cell with three live neighbors becomes a live cell.
3. All other live cells die in the next generation.
4. All other dead cells stay dead.

## Features

- Interactive grid where you can click to toggle cells
- Controls for starting, stopping, clearing, and randomizing the grid
- Smooth animation using requestAnimationFrame
- Wraparound grid edges for infinite patterns
- Responsive design that works on both desktop and mobile

## Development

To set up the development environment:

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

## Deployment

The project includes a deployment script (`deploy.sh`) that helps you deploy the game to a Ubuntu/Debian server. The script handles:

- System package updates
- Nginx installation and configuration
- TypeScript compilation
- File permissions and security settings

### Prerequisites

- Ubuntu/Debian-based Linux system
- SSH access to your server
- Sudo privileges
- Internet connection

### Deployment Steps

1. Copy the project files to your server:
```bash
scp -r * username@your-server-ip:~/game-of-life/
```

2. SSH into your server:
```bash
ssh username@your-server-ip
```

3. Navigate to the project directory and make the deployment script executable:
```bash
cd game-of-life
chmod +x deploy.sh
```

4. Run the deployment script:
```bash
# Deploy without domain
sudo ./deploy.sh

# Or deploy with a domain
sudo ./deploy.sh yourdomain.com
```

The script will set up everything needed and display the URL where you can access the game when finished.

### Post-Deployment

If you're using a domain name, make sure to:
1. Point your domain's DNS records to your server's IP address
2. Configure SSL/TLS certificates if needed (recommended)

## License

This project is open source and available under the MIT License.
