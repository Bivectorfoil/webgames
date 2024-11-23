# Web Games Collection

A collection of classic web games implemented with modern web technologies.

## Games

- [2048](/2048) - The classic 2048 puzzle game
- [Snake](/snake) - The classic snake game
- [Conway's Game of Life](/life) - Cellular automaton simulation

## Deployment

This project includes a unified deployment system that can deploy all games to a Linux server with Nginx. The deployment system is designed to be:

- **Centralized**: Manage all games from a single configuration
- **Flexible**: Deploy all games or individual games
- **Extensible**: Easily add new games
- **Automated**: Handles all setup and configuration

### Prerequisites

- Ubuntu/Debian-based Linux server
- SSH access to the server
- Sudo privileges
- Internet connection

### Quick Start

1. Copy files to your server:
```bash
scp -r * username@your-server-ip:~/webgames/
```

2. SSH into your server:
```bash
ssh username@your-server-ip
```

3. Deploy all games:
```bash
cd webgames
sudo ./deploy.sh games.example.com
```

Or deploy a specific game:
```bash
sudo ./deploy.sh games.example.com 2048
```

### Configuration

Games are configured in `shared/games.conf` with the format:
```
game_name|build_command|subdomain
```

Example:
```
2048|npm run build|2048      # Available at 2048.games.example.com
snake||snake                 # Available at snake.games.example.com
life|npm run build|life      # Available at life.games.example.com
```

### Adding New Games

1. Create a new game directory with your game files
2. Add an entry to `shared/games.conf`:
```
new_game|build_command|subdomain
```
3. Deploy using the deployment script

### Help

For detailed usage information:
```bash
./deploy.sh --help
```

## Development

Each game is developed independently in its own directory. See individual game READMEs for development instructions.

## License

This project is open source and available under the MIT License.