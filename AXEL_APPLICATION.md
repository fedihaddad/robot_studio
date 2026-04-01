# AXEL Control Dashboard - Complete Application

## Overview

A professional desktop application built with **Electron + React + TypeScript + TailwindCSS** for controlling and monitoring AXEL, a humanoid robot with:
- **25 Servomotors** (15 head + 10 arm servos)
- **ROS2 Jazzy** with WebSocket bridge (rosbridge_suite)
- **MJPEG Camera** with Computer Vision overlay
- **ESP32 + PCA9685 PWM Drivers** for servo control
- **Voice Control** via Gemini API

## Features Overview

### 📊 Page 1: Dashboard
- Real-time robot connection status
- ROS2 bridge indicator
- System health monitoring (Battery, Temperature)
- Emergency stop button
- Quick statistics (servo counts, system status)

### 📷 Page 2: Camera & Vision
- Live MJPEG stream from robot camera
- Computer Vision object detection overlay
- Bounding boxes with confidence scores
- Vision analytics panel
- Screenshot capture

### 🎮 Page 3: Servo Control
- **Head Servos**: 15 individual servo sliders (MG90/MG90S)
- **Arm Servos**: 10 individual servo sliders (5 per arm - MG996R)
- **Preset Positions**:
  - Neutral (default resting)
  - Wave (friendly gesture)
  - Look Left / Look Right
- Real-time angle feedback (0° to 180°)
- Smooth servo control via ROS2 topics

### 🤖 Page 4: ROS2 Monitor
- List all active ROS2 topics
- Real-time data inspection
- Priority topics highlighted:
  - `/servo/cmd` - Servo commands
  - `/audio/input` - Voice input
  - `/ia/decision` - AI decisions
  - `/robot/state` - Robot status
  - `/cmd_vel` - Velocity commands
- Message type information
- Live timestamp updates

### ⚙️ Page 5: Settings
- Configure ROS Bridge WebSocket URL
- Set MJPEG Camera Stream URL
- Robot name and IP address
- Test connections
- Save/Load configurations
- Configuration persistence (localStorage)

## Project Structure

```
src/
├── components/
│   ├── App.tsx                      # Main app with page routing
│   ├── shared/
│   │   ├── Sidebar.tsx              # Navigation sidebar
│   │   ├── StatusIndicator.tsx      # Status badge component
│   │   ├── ServoSlider.tsx          # Servo control slider
│   │   └── EmergencyStopButton.tsx  # Emergency stop control
│   ├── CameraFeed.tsx               # MJPEG stream display
│   ├── ControlPanel.tsx             # Old quick controls
│   ├── Dashboard.tsx                # Old dashboard
│   └── StatusBar.tsx                # Old status bar
├── pages/
│   ├── DashboardPage.tsx            # Dashboard page (new)
│   ├── CameraPage.tsx               # Camera & Vision page
│   ├── ServoPage.tsx                # Servo control page
│   ├── RosMonitorPage.tsx           # ROS2 Monitor page
│   └── SettingsPage.tsx             # Settings page
├── hooks/
│   └── useROS.ts                    # Custom ROS hook
├── services/
│   └── ros.service.ts               # ROS communication layer
├── store/
│   └── appStore.tsx                 # Global state management
├── types/
│   └── index.ts                     # TypeScript types
├── renderer.tsx                     # React entry point
├── main.ts                          # Electron main process
├── preload.ts                       # IPC security layer
└── index.css                        # TailwindCSS styles

Configuration files:
├── package.json                     # Dependencies & scripts
├── tsconfig.json                    # TypeScript config
├── tailwind.config.js              # TailwindCSS config
├── vite.renderer.config.ts         # Vite React config
└── index.html                       # HTML template
```

## Installation & Setup

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Your robot running ROS2 Jazzy with rosbridge_suite

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm start
```
The app will launch with hot reload enabled and DevTools open.

### 3. Configure Robot Connection
1. Open **Settings** page (⚙️)
2. Enter your robot's IP address
3. Set ROS Bridge URL: `ws://robot-ip:9090`
4. Set MJPEG Stream URL: `http://robot-ip:8080/?action=stream`
5. Click **Save Configuration**
6. Test connections before starting

## Robot Setup (Required)

### On Your Robot (Raspberry Pi/Linux)

#### 1. ROS2 Jazzy
```bash
# Install ROS2 Jazzy
sudo apt install ros-jazzy-desktop
source /opt/ros/jazzy/setup.bash

# Install rosbridge_suite for WebSocket
sudo apt install ros-jazzy-rosbridge-suite

# Start ROS bridge
ros2 launch rosbridge_server rosbridge_websocket_launch.xml
```

#### 2. MJPEG-Streamer
```bash
# Install dependencies
sudo apt install mjpeg-streamer libjpeg62-turbo-dev imagemagick

# Start camera stream (Raspberry Pi Camera)
mjpg_streamer -i "input_raspicam.so -x 640 -y 480 -fps 30" \
              -o "output_http.so -p 8080"

# OR USB Webcam
mjpg_streamer -i "input_uvc.so -d /dev/video0 -r 640x480 -f 30" \
              -o "output_http.so -p 8080"
```

#### 3. Verify Services
```bash
# Check ROS topics
ros2 topic list

# Check services
ros2 service list

# Test MJPEG stream
curl http://localhost:8080/?action=stream
```

## Usage - Control Your Robot

### Basic Workflow

1. **Launch Dashboard** → See robot status on Dashboard page
2. **Configure Settings** → Point to your robot's IP/ports
3. **View Camera** → Monitor robot vision on Camera page
4. **Control Servos** → Move head/arms using Servo Control page
5. **Monitor ROS** → Watch sensor data on ROS2 Monitor page

### Servo Control
- **Head Servos (1-15)**: Eye movements, mouth, expressions
- **Arm Servos (16-25)**: Left arm (16-20), Right arm (21-25)
- **Presets**: One-click saved positions
- **Range**: 0° to 180° per servo

### Emergency Procedures
- Red **Emergency Stop** button on Dashboard
- Activates `/emergency/stop` topic
- Robot stops all motors immediately

## ROS2 Topics

### AXEL Robot Topics
```
/servo/cmd          # Send servo angle commands
                    # Type: std_msgs/Float64MultiArray
                    # Data: [servo_id, angle]

/audio/input        # Voice input from microphone
                    # Type: std_msgs/String

/ia/decision        # AI decision from Gemini Robotics API
                    # Type: std_msgs/String

/robot/state        # Current robot state
                    # Type: sensor_msgs/JointState

/cmd_vel            # Velocity commands
                    # Type: geometry_msgs/Twist

/camera/Image       # Camera feed
                    # Type: sensor_msgs/Image

/emergency/stop     # Emergency stop signal
                    # Type: std_msgs/Bool
```

## Development Guide

### Adding New Components

```tsx
// src/components/MyComponent.tsx
import React from 'react';

interface MyComponentProps {
  data: string;
}

const MyComponent: React.FC<MyComponentProps> = ({ data }) => {
  return (
    <div className="bg-gray-800 rounded-lg p-4">
      {data}
    </div>
  );
};

export default MyComponent;
```

### Publishing ROS Commands

```tsx
import { useRef } from 'react';
import ROSService from '../services/ros.service';

const MyComponent = () => {
  const rosRef = useRef<ROSService>(null);

  const sendCommand = () => {
    rosRef.current?.publishServoCommand({
      id: 1,
      angle: 90,
    });
  };

  return <button onClick={sendCommand}>Send</button>;
};
```

### Using Application Store

```tsx
import { useAppStore } from '../store/appStore';

const MyComponent = () => {
  const { config, updateConfig } = useAppStore();

  return <div>{config.robotName}</div>;
};
```

## Building for Production

### Create Installers
```bash
npm run make
```

Creates platform-specific installers:
- **Windows**: `.msi` installer
- **macOS**: `.dmg` installer  
- **Linux**: `.deb` package

### Package
```bash
npm run package
```

### Available Commands
```bash
npm start           # Development server
npm run lint        # ESLint check
npm run package     # Create packages
npm run make        # Create installers
npm run publish     # Publish releases
```

## Troubleshooting

### Dashboard won't connect to robot
1. Verify robot IP is reachable: `ping robot-ip`
2. Check ROS bridge running: `ros2 topic list`
3. Verify ports open: port 9090 (ROS), 8080 (camera)
4. Check firewall settings
5. Update URLs in Settings page

### Servos don't respond
1. Verify `/servo/cmd` topic exists: `ros2 topic list | grep servo`
2. Check ESP32 connection to Raspberry Pi
3. Verify PCA9685 I2C addresses
4. Check servo power supply
5. Monitor ROS topic: `ros2 topic echo /robot/state`

### Camera feed not showing
1. Test camera: `v4l2-ctl --list-devices`
2. Check MJPEG-Streamer running: `ps aux | grep mjpeg`
3. Test stream URL directly: `http://robot-ip:8080/?action=stream`
4. Verify HTTP port 8080 is open

### App won't start
```bash
# Clean rebuild
rm -rf .vite node_modules
npm install
npm start
```

## Performance Tips

- Use presets for frequently used positions
- Monitor system resources in ROS2 Monitor
- Close unused applications on the robot
- Use wired network for stable connection
- Set appropriate FPS for camera (30 FPS recommended)

## Security Notes

- Use WebSocket Secure (wss://) in production
- Implement authentication on ROS bridge
- Restrict network access to trusted devices
- Don't expose robot control over public internet
- Use VPN for remote access

## Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Desktop | Electron | 41.1.0 |
| Build | Vite | 5.4.21 |
| UI Framework | React | 18.2.0 |
| Styling | TailwindCSS | 3.3.2 |
| Language | TypeScript | 4.5.4 |
| ROS Client | roslibjs | 1.3.0 |
| Camera | MJPEG | HTTP |
| Robot OS | ROS2 | Jazzy |

## Resources

- [Electron Docs](https://electronjs.org/docs)
- [React Docs](https://react.dev)
- [ROS2 Docs](https://docs.ros.org/)
- [roslibjs Wiki](http://wiki.ros.org/roslibjs)
- [MJPEG-Streamer GitHub](https://github.com/jacksonliam/mjpg-streamer)
- [TailwindCSS Docs](https://tailwindcss.com)

## License

MIT - Free for personal and commercial use

---

**Built for AXEL - The Humanoid Robot** 🤖
