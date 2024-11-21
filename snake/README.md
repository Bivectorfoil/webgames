# Snake Game

A modern implementation of the classic Snake game using HTML5 Canvas and JavaScript. This web-based version features smooth controls, responsive design, and an intelligent auto-play mode.

## Features

- 🎮 Classic Snake gameplay with modern graphics
- 🎯 Smooth, responsive controls
- 🤖 AI-powered auto-play mode
- 📱 Mobile-friendly design
- 🏆 Score tracking
- 🎨 Clean, modern UI
- 🔄 Instant restart functionality

## How to Play

1. Click the "Start Game" button or press any arrow key to begin
2. Use arrow keys to control the snake's direction:
   - ⬆️ Up Arrow: Move up
   - ⬇️ Down Arrow: Move down
   - ⬅️ Left Arrow: Move left
   - ➡️ Right Arrow: Move right
3. Eat the red food blocks to grow and increase your score
4. Avoid hitting the walls or the snake's own body
5. Click "Magic" to watch the AI play the game perfectly!

## Project Structure

```
snake/
├── index.html      # Main game HTML structure
├── style.css       # Game styling and layout
├── game.js         # Game logic and AI implementation
├── nginx.conf      # Nginx server configuration
├── deploy.sh       # Deployment script
└── README.md       # Project documentation
```

## Technical Details

- Built with vanilla JavaScript for optimal performance
- Uses HTML5 Canvas for smooth rendering
- Implements A* pathfinding algorithm for AI mode
- Responsive design that works on all screen sizes
- No external dependencies required

## Deployment

### Local Development

To run the game locally, simply open `index.html` in a web browser:

```bash
# Using Python's built-in server
python -m http.server 8000

# Or using Node's http-server if installed
npx http-server
```

### Production Deployment

The game includes a deployment script for Linux servers with Nginx. To deploy:

1. Copy files to your server:
```bash
scp index.html style.css game.js nginx.conf deploy.sh username@your-server-ip:~/
```

2. SSH into your server and run the deployment script:
```bash
# Deploy without domain
sudo ./deploy.sh

# Or deploy with a domain
sudo ./deploy.sh yourdomain.com
```

The script will:
- Set up a dedicated system user
- Install and configure Nginx
- Set up the application directory
- Configure domain settings
- Enable GZIP compression
- Set up caching
- Secure the installation

## AI Implementation

The game features an intelligent auto-play mode that:
- Uses A* pathfinding to find optimal paths to food
- Implements smart collision avoidance
- Calculates safe spaces to prevent trapping
- Balances between path optimization and safety

To activate AI mode, click the "Magic" button during gameplay.

## Browser Support

- ✅ Chrome/Edge (Recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Opera
- ✅ Modern Mobile Browsers

## License

This project is open source and available under the MIT License.

## Contributing

Contributions are welcome! Feel free to:
1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## Acknowledgments

- Inspired by the classic Nokia Snake game
- Modern implementation with AI capabilities
- Built with web standards for maximum compatibility