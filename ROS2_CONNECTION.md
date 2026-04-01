# Axel Dashboard - ROS2 Connection Guide

## ✅ What You Have

- ✓ Raspberry Pi with ROS2 running
- ✓ Robot hardware with servo controllers
- ✓ MoveIt configured and working
- ✓ All servo actuators operational

## 🎯 What This Dashboard Does

Connects to your **existing ROS2 system** to:
1. **Display real-time servo angles** from `/joint_states` topic
2. **Control servos** by sending commands to `/cmd_servo` topic
3. **Monitor robot status** in real-time
4. **Stream camera feed** from Raspberry Pi

---

## 🚀 Quick Start (Windows)

### Step 1: Update Dashboard Configuration

Edit `.env` file with your Raspberry Pi's IP address:

```bash
# File: .env
VITE_ROS_BRIDGE_URL=ws://192.168.1.100:9090
VITE_RASPBERRY_PI_HOST=192.168.1.100
VITE_CAMERA_STREAM_URL=http://192.168.1.100:8080/?action=stream
```

Where `192.168.1.100` is your Raspberry Pi's IP address.

### Step 2: Start Dashboard

```bash
npm start
```

### Step 3: Configure Raspberry Pi (First Time Only)

On your Raspberry Pi, ensure these ROS2 services are running:

```bash
# Terminal 1: Start rosbridge
ros2 launch rosbridge_server rosbridge_websocket_launch.xml

# Terminal 2: Make sure your servo publisher is running
ros2 run your_servo_package servo_controller
```

### Step 4: Use Dashboard

- Open "ROS2 Control" page in sidebar
- Wait for **green 🟢 Connected** status
- Move sliders to control servos in real-time
- Servo angles update automatically from ROS2

---

## 📡 ROS2 Topics Used

### **Subscribe (Dashboard Reads)**

| Topic | Message Type | Purpose |
|-------|--------------|---------|
| `/joint_states` | `sensor_msgs/JointState` | Real-time servo angles |
| `/robot_state` | `std_msgs/String` | Robot status |

### **Publish (Dashboard Sends)**

| Topic | Message Type | Purpose |
|-------|--------------|---------|
| `/cmd_servo` | `std_msgs/Float64MultiArray` | Servo angle commands |
| `/emergency_stop` | `std_msgs/Bool` | Emergency stop signal |

---

## 🔌 Raspberry Pi Setup Requirements

### 1. **rosbridge_suite** (WebSocket Server)

Already installed on standard ROS2 installation:
```bash
# Check if installed
dpkg -l | grep rosbridge

# If missing, install:
sudo apt install ros-jazzy-rosbridge-suite
```

### 2. **Servo State Publisher**

Your servo driver/controller must publish to `/joint_states`:

```python
# Example publisher
import rclpy
from sensor_msgs.msg import JointState

class ServoPublisher(Node):
    def __init__(self):
        super().__init__('servo_publisher')
        self.pub = self.create_publisher(JointState, '/joint_states', 10)
        self.create_timer(0.05, self.publish_states)
    
    def publish_states(self):
        msg = JointState()
        msg.header.stamp = self.get_clock().now().to_msg()
        msg.name = ['servo_1', 'servo_2', ...]
        msg.position = [angle1_in_radians, angle2_in_radians, ...]
        self.pub.publish(msg)
```

### 3. **Servo Command Subscriber**

Your servo driver must listen to `/cmd_servo`:

```python
# Example subscriber
self.sub = self.create_subscription(Float64MultiArray, '/cmd_servo', self.cmd_callback, 10)

def cmd_callback(self, msg):
    # msg.data = [servo_id, angle_value]
    servo_id = int(msg.data[0])
    angle = msg.data[1]
    # Send to servo controller
```

### 4. **Camera Streaming** (Optional)

For camera feed in dashboard:
```bash
# Using MJPEG-Streamer
mjpg_streamer -i "input_uvc.so -d /dev/video0 -r 640x480 -f 30" \
              -o "output_http.so -p 8080"
```

---

## ☑️ Connection Checklist

Before using the dashboard, verify:

- [ ] Raspberry Pi is powered on and connected to network
- [ ] ROS2 is running: `ros2 node list`
- [ ] rosbridge is running: `ros2 service list | grep bridge`
- [ ] Servo publisher is running: `ros2 topic list | grep joint`
- [ ] Can connect to Pi from Windows: `ping 192.168.1.100`
- [ ] WebSocket port is open: `telnet 192.168.1.100 9090`
- [ ] Camera stream accessible: `http://192.168.1.100:8080/?action=stream`

---

## 🔧 Troubleshooting

### Dashboard shows "🔴 Disconnected"

**Problem**: Cannot connect to ROS2 bridge

**Solution**:
```bash
# 1. Check ROS bridge is running on Pi
ssh axel@192.168.1.100
ros2 topic list

# 2. Check firewall/network
ping 192.168.1.100
telnet 192.168.1.100 9090

# 3. Check IP in .env matches your Pi
cat .env | grep ROS_BRIDGE_URL

# 4. Restart rosbridge on Pi
pkill -f rosbridge
ros2 launch rosbridge_server rosbridge_websocket_launch.xml
```

### Servo angles not updating

**Problem**: Sliders move but no feedback from Pi

**Solution**:
```bash
# 1. Check topic exists
ros2 topic list | grep joint_states

# 2. Check if messages are published
ros2 topic echo /joint_states

# 3. If not publishing, start your servo node
ros2 run your_package your_servo_node
```

### Sliders don't move servos

**Problem**: Commands sent but servos don't move

**Solution**:
```bash
# 1. Check if commands are received on Pi
ros2 topic echo /cmd_servo

# 2. Verify servo command subscriber receives data
# Check your servo node logs

# 3. Test servo manually
ros2 topic pub /cmd_servo std_msgs/Float64MultiArray "{data: [1, 90]}"
```

### Camera stream blank

**Problem**: Camera feed shows nothing

**Solution**:
```bash
# 1. Check MJPEG-Streamer is running
sudo systemctl status mjpeg-streamer

# 2. Verify camera is connected
ls /dev/video*

# 3. Test stream directly
curl http://192.168.1.100:8080/?action=stream -o test.mjpeg

# 4. Restart streamer if needed
sudo systemctl restart mjpeg-streamer
```

---

## 📝 Dashboard Pages

### **Dashboard (1)**
- Overview of robot status
- Connection indicators
- Emergency stop button

### **Camera & Vision (2)**
- Live MJPEG stream from Raspberry Pi
- URL configuration

### **Servo Control (3)**
- Individual servo angle presets
- Inverse kinematics (if configured)
- Manual servo control

### **ROS2 Control (6)** ← **USE THIS FOR YOUR ROBOT**
- Real-time servo feedback from ROS2
- Live angle updates
- Control all 25 servos
- Connected/Disconnected status

### **ROS2 Monitor (4)**
- List all available ROS2 topics
- View topic details
- Publish/subscribe for testing

### **Settings (5)**
- Robot name
- Configuration management

---

## 🎚️ Servo Layout

**Head Servos (1-15)**:
- 1-5: Pan/Tilt, eye blinks
- 6-8: Mouth
- 9-13: Eyebrows, expressions
- 14-15: Adjustments

**Arm Servos (16-25)**:
- 16-20: Left arm (5 servos)
- 21-25: Right arm (5 servos)

---

## 📞 Support

Check the ROS2 Monitor page to:
- Verify all topics are available
- Test sending commands manually
- Debug connection issues

Run this to see active topics:
```bash
ros2 topic list -t
```

---

**Status**: ✅ Ready to use with existing ROS2 system
