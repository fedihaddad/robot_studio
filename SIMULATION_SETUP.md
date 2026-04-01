# Servo Simulation & Temperature Monitoring Setup Guide

## 📋 Overview

This guide covers the setup for servo control simulation and real-time temperature monitoring from the Raspberry Pi. The Windows dashboard runs in **simulation mode** by default, allowing you to test servo controls before connecting to real hardware.

### Architecture

```
WINDOWS (Your Laptop)                          RASPBERRY PI (Robot)
┌─────────────────────────────────────┐       ┌──────────────────────────┐
│  Axel Dashboard (Electron + React)  │       │  ROS2 + Sensors          │
│  ├─ Servo Simulator (Sim Mode)      │       │  ├─ Temperature Sensors  │
│  ├─ Real Servo Control (ROS Mode)   │◄──────┤─ CPU/GPU Temp via Topic  │
│  ├─ Temp Display Component          │ WS:// │─ rosbridge_suite         │
│  └─ SimulationPage                  │ 9090  │  (WebSocket Bridge)      │
└─────────────────────────────────────┘       └──────────────────────────┘
```

---

## 🎮 Part 1: Windows Setup (Simulation Mode)

### 1.1 Configuration Files

The `.env` file controls all settings:

```bash
# File: .env
VITE_SIMULATION_MODE=true                    # Enable simulation (no ROS needed)
VITE_ROS_BRIDGE_URL=ws://localhost:9090      # ROS2 WebSocket server

VITE_SERVO_COMMAND_TOPIC=/servo/cmd
VITE_SERVO_STATE_TOPIC=/servo/state
VITE_TEMPERATURE_TOPIC=/sensors/temperature

VITE_RASPBERRY_PI_HOST=192.168.1.100
VITE_RASPBERRY_PI_PORT=8080

VITE_HEAD_SERVO_COUNT=15
VITE_ARM_SERVO_COUNT=10
```

### 1.2 Key Features in Simulation Mode

#### **ServoSimulator Service**
- Simulates servo movement without hardware
- Respects speed and acceleration constraints
- Tracks servo state (angle, target, moving status)

```typescript
// Usage in code
import { servoSimulator } from '@/services/servo.simulator';

// Set target angle for servo
servoSimulator.setTargetAngle(1, 90, 45); // servo_id, angle, speed

// Get servo state
const state = servoSimulator.getServoState(1);

// Start simulation (auto-updates)
servoSimulator.start();
```

#### **TemperatureMonitor Service**
- Generates simulated temperature data
- Real-time updates every 1 second
- Color-coded status (green, yellow, red)

```typescript
// Usage in code
import { temperatureMonitor } from '@/services/temperature.monitor';

// Start monitoring
temperatureMonitor.start(1000); // update interval in ms

// Subscribe to updates
const unsubscribe = temperatureMonitor.subscribe((tempData) => {
  console.log(`CPU: ${tempData.cpuTemp}°C, GPU: ${tempData.gpuTemp}°C`);
});

// Get current
const current = temperatureMonitor.getCurrentTemp();
```

#### **Configuration Service**
- Centralized configuration management
- Load from environment variables
- Query at runtime

```typescript
// Usage in code
import { config } from '@/services/config.service';

// Get any config
const rosUrl = config.getRosUrl();
const tempThresholds = config.getTemperatureThresholds();
const isSimulation = config.isSimulationEnabled();
```

### 1.3 Pages & Components

#### **SimulationPage** (New!)
- Combined servo control + temperature monitoring
- Two tabs: Head Servos | Arm Servos
- Real-time servo visualization with angle indicator

**Access**: Click "🎮📊 Simulation & Temp" in the sidebar

**Features**:
- Live servo state display (moving/ready/target)
- Temperature graph with status indicators
- Reset all servos button
- Save preset functionality
- Configuration summary

#### **New Components**

1. **ServoSimulationPanel**
   - Circular visualization of each servo
   - Shows current angle with needle indicator
   - Color-coded movement status
   - Displays counts of moving/ready servos

2. **TemperatureDisplay**
   - CPU & GPU temperature display
   - Color-coded status (green/yellow/red)
   - Progress bars for each sensor
   - Threshold information

### 1.4 Running in Simulation Mode

```bash
# 1. Start the development server
npm start

# 2. Navigate to "Simulation & Temp" page

# 3. Move servo sliders to control simulated servos

# 4. Watch real-time:
#    - Servo angle updates with smooth animation
#    - Temperature oscillating around 60°C
#    - Moving/Ready status indicators
```

**Tips**:
- Servos animate smoothly (45°/sec default speed)
- Temperature data is simulated locally (no Raspberry Pi needed)
- All state is stored in memory (no persistence by default)

---

## 🔌 Part 2: ROS Mode (Real Hardware)

To switch from **simulation** to **real hardware**, you'll need:

### 2.1 Prerequisites on Raspberry Pi

- ROS2 (Jazzy or Humble)
- rosbridge_suite (WebSocket server)
- Temperature monitoring setup
- Servo control driver

### 2.2 Configuration for Real Mode

```bash
# Update .env to disable simulation
VITE_SIMULATION_MODE=false
VITE_ROS_BRIDGE_URL=ws://192.168.1.100:9090
```

### 2.3 Topics Expected from ROS2

The dashboard will subscribe to these topics:

**Servo Control** (Dashboard → Robot):
- `/servo/cmd` - std_msgs/Float64MultiArray [servo_id, angle]

**Servo State** (Robot → Dashboard):
- `/servo/state` - sensor_msgs/JointState

**Temperature** (Robot → Dashboard):
- `/sensors/cpu_temp` - std_msgs/Float32 (CPU temperature)
- `/sensors/gpu_temp` - std_msgs/Float32 (GPU temperature)

**Emergency Stop**:
- `/emergency/stop` - std_msgs/Bool

---

## 📊 Part 3: Servo Control Hook

The `useServoControl` hook provides the interface for servo management:

```typescript
import { useServoControl } from '@/hooks/useServoControl';

// In your component
const {
  servoStates,          // Current servo angles
  sendCommand,          // Send servo command
  sendBatchCommand,    // Send multiple commands
  resetAllServos,      // Reset to default (90°)
  getServoState,       // Get single servo state
  getAllServoStates,   // Get all servo states
  toggleServoSelection,
  getHeadServoIds,     // [1-15]
  getArmServoIds,      // [16-25]
} = useServoControl();

// Send command
sendCommand({ id: 1, angle: 90 });

// Batch command
sendBatchCommand([
  { id: 1, angle: 45 },
  { id: 2, angle: 135 },
]);
```

---

## 🚀 Part 4: Integration with Raspberry Pi (Future)

When ready to connect to real hardware:

### Step 1: On Raspberry Pi
```bash
# Install ROS2 and rosbridge
sudo apt install ros-jazzy-rosbridge-suite

# Create servo control node
# Create temperature monitoring node

# Launch rosbridge
ros2 launch rosbridge_server rosbridge_websocket_launch.xml
```

### Step 2: Update Windows Config
```bash
VITE_SIMULATION_MODE=false
VITE_ROS_BRIDGE_URL=ws://192.168.1.100:9090
```

### Step 3: Hardware Publishers Needed

**Servo State Publisher** (Raspberry Pi):
```python
# Publish current servo angles to /servo/state
import rclpy
from sensor_msgs.msg import JointState

# Every 100ms, publish servo angles
```

**Temperature Publisher** (Raspberry Pi):
```python
# Read CPU/GPU temp and publish
import psutil
import rclpy
from std_msgs.msg import Float32

cpu_temp = psutil.sensors_temperatures()['coretemp'][0].current
gpu_temp = measure_gpu_temp()  # Platform specific
```

---

## 🧪 Testing Checklist

- [ ] Start app in simulation mode
- [ ] Navigate to SimulationPage
- [ ] Verify servo sliders update servo visualization
- [ ] Check temperature display shows oscillating values
- [ ] Verify servo counts update correctly
- [ ] Test "Reset All Servos" button
- [ ] Check toggle between Head/Arm tabs
- [ ] Verify status colors change with temperature

---

## 📝 File Structure

New files created:
```
src/
├── services/
│   ├── servo.simulator.ts          # Servo simulation
│   ├── temperature.monitor.ts      # Temperature monitoring
│   ├── config.service.ts           # Configuration management
│   └── ros.service.ts              # (Updated with temp methods)
├── hooks/
│   └── useServoControl.ts          # Servo control hook
├── components/shared/
│   ├── TemperatureDisplay.tsx      # Temperature component
│   └── ServoSimulationPanel.tsx    # Servo visualization
└── pages/
    └── SimulationPage.tsx          # Main simulation page

Configuration:
├── .env                            # Local configuration
└── .env.example                    # Template
```

---

## 🔗 Reference

### Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `VITE_SIMULATION_MODE` | `true` | Enable simulator |
| `VITE_ROS_BRIDGE_URL` | `ws://localhost:9090` | ROS2 connection |
| `VITE_SERVO_COMMAND_TOPIC` | `/servo/cmd` | Servo command topic |
| `VITE_TEMPERATURE_TOPIC` | `/sensors/temperature` | Temperature topic |
| `VITE_HEAD_SERVO_COUNT` | `15` | Number of head servos |
| `VITE_ARM_SERVO_COUNT` | `10` | Number of arm servos |

### Temperature Thresholds

| Status | Range | Indicator |
|--------|-------|-----------|
| Safe | < 70°C | 🟢 Green |
| Warning | 70-80°C | 🟡 Yellow |
| Critical | > 80°C | 🔴 Red |

---

## ❓ Troubleshooting

**Servos not moving?**
- Check if simulation mode is enabled in `.env`
- Verify `useServoControl` hook is properly initialized

**Temperature not updating?**
- Check if simulation mode is enabled
- Verify `temperatureMonitor.start()` is called

**ROS connection fails?**
- Ensure `VITE_SIMULATION_MODE=false`
- Check ROS URL matches your Raspberry Pi
- Verify rosbridge_suite is running on the Pi

---

## 📚 Next Steps

1. ✅ Windows Simulation Setup (Complete)
2. 🔄 Raspberry Pi ROS2 Setup (Next)
3. 🔄 Hardware Integration Testing
4. 🔄 Production Deployment
