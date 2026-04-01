# Axel Dashboard - Complete Setup Guide

## Project Overview
Axel Dashboard is an Electron-based desktop application for controlling a ROS2-enabled robot (Axel). It features:
- **React UI** with modern TailwindCSS styling
- **MJPEG camera streaming** for live video feed
- **ROS2 integration** via roslib and rosbridge_suite
- **Real-time dashboard** for monitoring and control

## Architecture

### System Overview

```
YOUR LAPTOP (Windows/Mac/Linux)          YOUR ROBOT (Raspberry Pi/Linux)
┌─────────────────────────────┐         ┌──────────────────────────────┐
│   Axel Dashboard (React)    │         │   ROS2 System                │
│   - Camera Feed Display     │◄────────┤   - rosbridge_suite (ws://  │
│   - Control Panel           │ HTTP    │   - ROS2 Topics/Services     │
│   - Settings                │◄────────┤   - MJPEG-Streamer (http://)│
│                             │         │   - Sensors & Actuators      │
└─────────────────────────────┘         └──────────────────────────────┘
        Electron App                         raspberry Pi / Linux
```

### Components Location

| Component | Runs On | Purpose |
|-----------|---------|---------|
| **Axel Dashboard** | Your laptop (Electron) | User interface for controlling robot |
| **ROS2** | Robot (Linux) | Robot operating system & middleware |
| **rosbridge_suite** | Robot (Linux) | WebSocket bridge to ROS2 topics |
| **MJPEG-Streamer** | Robot (Linux) | Camera streaming server |
| **roslibjs** | Dashboard (Browser) | JavaScript client for ROS2 topics |

### Tech Stack

```
DASHBOARD (Your Laptop):
├── Electron.js (cross-platform desktop app)
├── React (UI framework)
├── TypeScript (type safety)
├── TailwindCSS (modern styling)
└── Vite (fast build tool)

COMMUNICATION (Over Network):
├── WebSocket (port 9090) ← ROS2 topics
└── HTTP (port 8080) ← MJPEG camera

ROBOT (Raspberry Pi/Linux):
├── ROS2 (robot OS)
├── rosbridge_suite (WebSocket server)
└── MJPEG-Streamer (HTTP server)
```

## Installation & Setup

### 1. Install Dependencies (On Your Laptop)
```bash
npm install
```

This installs:
- All Electron and Forge dependencies
- React and React-DOM
- TypeScript and build tools
- TailwindCSS for styling

### 2. Configure Camera Streaming (On Your Robot)

#### Option A: Using MJPEG-Streamer on Linux/Raspberry Pi

**Installation:**
```bash
sudo apt-get update
sudo apt-get install -y mjpeg-streamer libjpeg62-turbo-dev imagemagick

# Or compile from source:
git clone https://github.com/jacksonliam/mjpg-streamer.git
cd mjpg-streamer/mjpg-streamer-experimental
make
sudo make install
```

**Running the server:**
```bash
# Using USB camera
mjpg_streamer -i "input_uvc.so -d /dev/video0 -r 640x480 -f 30" -o "output_http.so -p 8080 -w /usr/share/mjpg-streamer/www"

# Using Raspberry Pi Camera
mjpg_streamer -i "input_raspicam.so -x 640 -y 480 -fps 30" -o "output_http.so -p 8080 -w /usr/share/mjpg-streamer/www"
```

The stream will be available at: `http://your-robot-ip:8080/?action=stream`

#### Option B: Using Alternative Streaming Tools

- **gstreamer**: `gst-launch-1.0` with HTTP server
- **OpenCV**: Python script with Flask
- **FFmpeg**: With HTTP protocol

**Example FFmpeg setup:**
```bash
ffmpeg -i /dev/video0 -f mpjpeg http://0.0.0.0:8080/stream
```

### 3. Configure ROS2 Bridge (On Your Robot)

**Installation on Robot/ROS Machine (SSH in via Linux terminal):**
```bash
# For ROS 2 Jazzy
sudo apt install ros-jazzy-rosbridge-suite

# Or from source:
mkdir -p ~/ros_ws/src
cd ~/ros_ws/src
git clone https://github.com/RobotWebTools/rosbridge_suite.git
cd ..
rosdep install --from-paths src --ignore-src -r -y
colcon build
source install/setup.bash
```

**Running the WebSocket bridge:**
```bash
# Method 1: Using ros2 launch
ros2 launch rosbridge_server rosbridge_websocket_launch.xml bson_only_mode:=False

# Method 2: Direct launch
ros2 run rosbridge_server rosbridge_websocket
```

Default connection: `ws://localhost:9090`

If running on a remote machine, use: `ws://robot-ip:9090`

### 4. Running the Dashboard (On Your Laptop)

**Development mode (Windows PowerShell, Mac Terminal, or Linux terminal):**
```bash
npm start
```

**Building for production:**
```bash
npm run make
```

**Packaging:**
```bash
npm run package
```

## Setup Checklist

Before connecting to your robot, make sure you have:

### ✅ On Your Laptop
- [ ] Cloned/extracted the Axel Dashboard project
- [ ] Run `npm install` in the dashboard folder
- [ ] Dashboard starts with `npm start`
- [ ] Dashboard runs on http://localhost:5173

### ✅ On Your Robot (Raspberry Pi/Linux)
- [ ] ROS2 installed (Jazzy recommended)
- [ ] `ros-jazzy-rosbridge-suite` installed
- [ ] MJPEG-Streamer installed (or compatible camera streaming tool)
- [ ] Camera device working (`/dev/video0` or similar)
- [ ] Network connectivity (ping from laptop: `ping robot-ip`)

### ✅ Networking Check
```bash
# From your laptop, test connection to robot:
ping your-robot-ip          # Should respond
curl http://your-robot-ip:8080     # Camera should respond
curl http://your-robot-ip:9090     # ROS bridge should respond (WebSocket)
```

### ✅ In Dashboard Settings
- [ ] ROS Bridge URL set to: `ws://your-robot-ip:9090`
- [ ] MJPEG Stream URL set to: `http://your-robot-ip:8080/?action=stream`
- [ ] Settings saved

## Configuration

### Update URLs in Settings

1. Click **Settings** in the top-right corner
2. Update **ROS Bridge URL**: `ws://your-robot-ip:9090`
3. Update **MJPEG Stream URL**: `http://your-robot-ip:8080/?action=stream` (or your camera server URL)
4. Save changes

### Firewall/Network Setup

Ensure these ports are accessible:
- **9090** (ROS WebSocket bridge)
- **8080** (MJPEG streamer) - or your configured port

If on a different network:
```bash
# Forward ports via SSH
ssh -L 9090:localhost:9090 -L 8080:localhost:8080 user@robot-ip
```

## Usage

### Main Interface

```
┌──────────────────────────────────┐
│  Axel Dashboard        [Settings] │
├──────────────┬───────────────────┤
│              │  ROS Bridge URL   │
│   Camera     │  Camera Stream URL│
│    Feed      │                   │
│              │  Quick Actions    │
│              │                   │
├──────────────┴───────────────────┤
│ ROS: Connected | Camera: Online  │
└──────────────────────────────────┘
```

### Camera Feed
- MJPEG stream displays live video
- "LIVE" indicator shows real-time status
- Automatically handles stream URL changes

### Quick Controls
- **Connect**: Reconnect to ROS bridge
- **Update Stream**: Refresh camera URL
- **Refresh Feed**: Restart video stream
- **Reset Streams**: Clear all cached data

### Status Bar
- ROS connection status (green = connected, red = disconnected)
- Camera stream status
- Error messages
- Current ROS Bridge URL

## ROS Integration

### Subscribing to Topics

The dashboard can subscribe to ROS2 topics for data visualization:

```typescript
// Example in ControlPanel.tsx
import ROSService from '../services/ros.service';

const ros = new ROSService('ws://localhost:9090');
await ros.connect();

// Subscribe to a topic
ros.subscribe(
  '/sensors/camera/info',
  'sensor_msgs/CameraInfo',
  (message) => console.log('Camera info:', message)
);
```

### Publishing Commands

Send commands to your robot via ROS:

```typescript
// Publish velocity command
ros.publish(
  '/cmd_vel',
  'geometry_msgs/Twist',
  {
    linear: { x: 1.0, y: 0, z: 0 },
    angular: { x: 0, y: 0, z: 0 }
  }
);
```

### Available Services

Access ROS services through the ROSService class:

```typescript
const topics = await ros.getTopics();      // List all topics
const services = await ros.getServices();  // List all services
```

## File Structure

```
axel-dashboard/
├── src/
│   ├── components/
│   │   ├── App.tsx              # Main app component
│   │   ├── Dashboard.tsx         # Dashboard layout
│   │   ├── CameraFeed.tsx        # MJPEG stream display
│   │   ├── ControlPanel.tsx      # Quick controls
│   │   └── StatusBar.tsx         # Status indicator
│   ├── hooks/
│   │   └── useROS.ts             # ROS connection hook
│   ├── services/
│   │   └── ros.service.ts        # ROS utilities
│   ├── types/
│   │   └── index.ts              # TypeScript types
│   ├── index.css                 # TailwindCSS styles
│   ├── renderer.tsx              # React entry point
│   ├── main.ts                   # Electron main process
│   └── preload.ts                # Electron preload
├── index.html                    # HTML template
├── tailwind.config.js            # TailwindCSS config
├── postcss.config.js             # PostCSS config
├── tsconfig.json                 # TypeScript config
├── package.json                  # Dependencies
└── vite.renderer.config.ts       # Vite config with React

```

## Troubleshooting

### Camera feed not showing
1. Verify MJPEG server is running: `http://camera-ip:8080/?action=stream`
2. Check firewall allows port 8080
3. Verify URL in Settings matches exactly
4. Click "Refresh Feed" or "Update Stream"

### ROS connection fails
1. Check rosbridge is running: `ros2 launch rosbridge_server rosbridge_websocket_launch.xml`
2. Verify WebSocket port 9090 is accessible
3. Check firewall rules
4. Try connecting from command line: `ws://robot-ip:9090`
5. Check ROS diagnostics: `ros2 service list`

### MJPEG-Streamer compilation issues
- Install: `libv4l-dev`, `libjpeg62-turbo-dev`
- Check camera device: `ls -la /dev/video*`
- Test with: `ffplay /dev/video0`

### Electron won't start
1. Clear cache: `rm -rf .vite`
2. Reinstall deps: `rm -rf node_modules && npm install`
3. Check Node version: `node --version` (requires v16+)

## Development

### Adding New Components

```typescript
// src/components/MyComponent.tsx
import React from 'react';

interface MyComponentProps {
  // Props here
}

const MyComponent: React.FC<MyComponentProps> = (props) => {
  return <div>My Component</div>;
};

export default MyComponent;
```

### Styling with TailwindCSS

```typescript
<button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white transition-colors">
  Click me
</button>
```

### ROS Topic Subscription

```typescript
// In a component
import { useROS } from '../hooks/useROS';

const MyComponent = () => {
  const { ros, state } = useROS('ws://localhost:9090');
  
  if (state.isConnected) {
    // Subscribe and use ros
  }
};
```

## Next Steps

1. **Set up your robot's camera** and MJPEG-Streamer
2. **Launch ROS bridge** on your robot
3. **Update Dashboard URLs** to point to your robot
4. **Extend components** for robot-specific controls
5. **Add topic subscriptions** for sensor data display

## Resources

- [ROS Documentation](https://docs.ros.org/)
- [roslib.js Docs](http://wiki.ros.org/roslibjs)
- [MJPEG-Streamer GitHub](https://github.com/jacksonliam/mjpg-streamer)
- [Electron Documentation](https://www.electronjs.org/docs)
- [React Documentation](https://react.dev/)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)

## License

MIT - See package.json for details
