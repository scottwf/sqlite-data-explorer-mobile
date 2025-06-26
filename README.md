
# SQLite Data Explorer Mobile

A modern, browser-based SQLite database explorer and editor. Effortlessly upload, browse, query, and edit SQLite databases with a beautiful, responsive UI. Features include schema browsing, table editing, AI-assisted query generation, and advanced cell viewing—all running locally in your browser.

---
## Features

- Upload and explore SQLite databases directly in the browser (no server required)
- View and browse database schema (tables, columns, types, PK, etc.)
- View, search, sort, and paginate table data
- Add, edit, and delete rows with a user-friendly UI
- Full cell content overlay for truncated/large cell values
- Automatic pretty-printing for JSON cell content in overlays
- Scrollable overlay for large cell content (horizontal and vertical)
- AI Query Generator: generate SQL queries from natural language using Ollama (configurable URL, persistent in localStorage)
- Execute custom SQL queries and view results
- Toast notifications for actions and errors
- Responsive design for desktop and mobile
- Modern UI with shadcn-ui and Tailwind CSS

## Screenshots

### Fullscreen Table View Mode
![Fullscreen Table View](./public/screenshots/fullscreen_view_mode.png)
*View your data in a distraction-free, full-window mode for easier analysis and navigation.*

### Ollama-Assisted Query Editor
![Ollama-Assisted Query Editor](./public/screenshots/ollama_assisted_query_editor.png)
*Generate SQL queries from natural language using the integrated AI Query Editor powered by Ollama.*

### Upload to View
![Upload to View](./public/screenshots/upload_to_view.png)
*Quickly upload your SQLite database file to start exploring its schema and data instantly.*

### View Formatted Cell Content
![View Formatted Cell Content](./public/screenshots/view_formatted_cella.png)
*Easily inspect large or JSON-formatted cell values in a scrollable, pretty-printed overlay.*

---

See [ROADMAP.md](./ROADMAP.md) for planned and potential future features.

## Installation & Setup

### Prerequisites

Before setting up the SQLite Data Explorer, ensure you have the following installed on your system:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/) or install via [nvm](https://github.com/nvm-sh/nvm)
- **npm** (comes with Node.js) or **yarn** package manager
- **Git** for cloning the repository

### Quick Start (Development)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/sqlite-data-explorer-mobile.git
   cd sqlite-data-explorer-mobile
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Access the application:**
   Open your browser and navigate to `http://localhost:8080`

### Production Build

To create a production-ready build:

```bash
# Build the application
npm run build

# Preview the production build locally
npm run preview
```

The built files will be in the `dist/` directory, ready for static hosting.

## Linux Server Deployment

### Option 1: Development Server (Quick Setup)

For development or testing purposes, you can run the Vite dev server directly:

#### Manual Setup

1. **Update system and install Node.js:**
   ```bash
   # Update package list
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js via NodeSource (recommended)
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Verify installation
   node --version
   npm --version
   ```

2. **Clone and setup the application:**
   ```bash
   # Clone to your preferred directory
   cd /opt
   sudo git clone https://github.com/your-username/sqlite-data-explorer-mobile.git
   sudo chown -R $USER:$USER sqlite-data-explorer-mobile
   cd sqlite-data-explorer-mobile
   
   # Install dependencies
   npm install
   
   # Test the application
   npm run dev
   ```

#### Running as a systemd Service

3. **Create a systemd service file:**
   ```bash
   sudo nano /etc/systemd/system/sqlite-data-explorer.service
   ```

4. **Add the following configuration** (adjust paths and user as needed):
   ```ini
   [Unit]
   Description=SQLite Data Explorer Vite Dev Server
   After=network.target
   Wants=network.target

   [Service]
   Type=simple
   User=www-data
   Group=www-data
   WorkingDirectory=/opt/sqlite-data-explorer-mobile
   ExecStart=/usr/bin/npm run dev
   Restart=always
   RestartSec=10
   Environment=PATH=/usr/bin:/usr/local/bin:/usr/local/sbin
   Environment=NODE_ENV=development
   Environment=HOST=0.0.0.0
   Environment=PORT=8080

   # Security settings
   NoNewPrivileges=true
   ProtectSystem=strict
   ProtectHome=true
   ReadWritePaths=/opt/sqlite-data-explorer-mobile

   [Install]
   WantedBy=multi-user.target
   ```

5. **Enable and start the service:**
   ```bash
   # Reload systemd configuration
   sudo systemctl daemon-reload
   
   # Enable service to start on boot
   sudo systemctl enable sqlite-data-explorer
   
   # Start the service
   sudo systemctl start sqlite-data-explorer
   
   # Check service status
   sudo systemctl status sqlite-data-explorer
   ```

6. **Monitor logs:**
   ```bash
   # View real-time logs
   sudo journalctl -u sqlite-data-explorer -f
   
   # View recent logs
   sudo journalctl -u sqlite-data-explorer -n 50
   ```

### Option 2: Production Deployment with Nginx (Recommended)

For production environments, serve the built static files with Nginx:

#### Setup Steps

1. **Build the application:**
   ```bash
   cd /opt/sqlite-data-explorer-mobile
   npm run build
   ```

2. **Install and configure Nginx:**
   ```bash
   # Install Nginx
   sudo apt install nginx -y
   
   # Create site configuration
   sudo nano /etc/nginx/sites-available/sqlite-data-explorer
   ```

3. **Add Nginx configuration:**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;  # Replace with your domain or IP
       
       root /opt/sqlite-data-explorer-mobile/dist;
       index index.html;
       
       # Enable gzip compression
       gzip on;
       gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
       
       location / {
           try_files $uri $uri/ /index.html;
       }
       
       # Cache static assets
       location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
           expires 1y;
           add_header Cache-Control "public, immutable";
       }
   }
   ```

4. **Enable the site:**
   ```bash
   # Enable the site
   sudo ln -s /etc/nginx/sites-available/sqlite-data-explorer /etc/nginx/sites-enabled/
   
   # Test configuration
   sudo nginx -t
   
   # Restart Nginx
   sudo systemctl restart nginx
   sudo systemctl enable nginx
   ```

### Firewall Configuration

If using UFW firewall:

```bash
# Allow HTTP traffic
sudo ufw allow 80/tcp

# For development server (port 8080)
sudo ufw allow 8080/tcp

# Enable firewall if not already enabled
sudo ufw enable
```

### SSL/HTTPS Setup (Optional but Recommended)

For production deployments, set up SSL with Let's Encrypt:

```bash
# Install Certbot
sudo apt install snapd
sudo snap install --classic certbot

# Create symbolic link
sudo ln -s /snap/bin/certbot /usr/bin/certbot

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is set up automatically
```

### Troubleshooting

#### Common Issues

1. **Port already in use:**
   ```bash
   # Check what's using port 8080
   sudo lsof -i :8080
   
   # Kill process if needed
   sudo kill -9 <PID>
   ```

2. **Permission issues:**
   ```bash
   # Fix ownership of application directory
   sudo chown -R www-data:www-data /opt/sqlite-data-explorer-mobile
   
   # Fix permissions
   sudo chmod -R 755 /opt/sqlite-data-explorer-mobile
   ```

3. **Service won't start:**
   ```bash
   # Check detailed service status
   sudo systemctl status sqlite-data-explorer -l
   
   # Check system logs
   sudo journalctl -xe
   ```

4. **Node.js/npm issues:**
   ```bash
   # Clear npm cache
   npm cache clean --force
   
   # Reinstall dependencies
   rm -rf node_modules package-lock.json
   npm install
   ```

### Updating the Application

To update the application:

```bash
# Stop the service (if using systemd)
sudo systemctl stop sqlite-data-explorer

# Pull latest changes
cd /opt/sqlite-data-explorer-mobile
git pull origin main

# Install new dependencies
npm install

# For production: rebuild
npm run build

# Restart service
sudo systemctl start sqlite-data-explorer
```

### Security Recommendations

- Run the application as a non-privileged user (www-data)
- Use a reverse proxy (Nginx) for production
- Enable firewall and limit open ports
- Keep Node.js and system packages updated
- Use HTTPS in production
- Consider using a process manager like PM2 for additional features

## Project info

**URL**: https://lovable.dev/projects/1f3e33d4-d082-4ae3-9334-309042291bf6

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/1f3e33d4-d082-4ae3-9334-309042291bf6) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/1f3e33d4-d082-4ae3-9334-309042291bf6) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
