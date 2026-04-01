# Raspberry Pi Setup Guide for AXEL Servo Control & Monitoring

## 📋 Overview

This guide covers setting up the Raspberry Pi to work with the Axel Dashboard. The Pi acts as the **robot brain** and communicates with the Windows dashboard via WebSocket (rosbridge) and HTTP (camera streaming).

---

## 🎯 Required Components

### Hardware
- [ ] Raspberry Pi 4B (8GB RAM recommended)
- [ ] Micro SD Card (64GB+ recommended)
- [ ] Power supply (5V, 3A minimum)
- [ ] USB Camera or Raspberry Pi Camera Module
- [ ] Servo motor controller/driver
- [ ] 25x Servo motors (15 head + 10 arm)
- [ ] Network cable or WiFi connection

### Software
- [ ] Ubuntu 24.04 LTS (Raspberry Pi OS doesn't have ROS2 Jazzy)
- [ ] ROS2 Jazzy or Humble
- [ ] rosbridge_suite (WebSocket bridge)
- [ ] MJPEG-Streamer (camera streaming)
- [ ] Python 3.10+

---

## 🔧 Step 1: Basic System Setup

### 1.1 Flash Operating System
```bash
# Download Raspberry Pi Imager
# https://www.raspberrypi.com/software/

# Write Ubuntu Server 24.04 LTS for Raspberry Pi (not lite)
# Configure:
# - Username: axel
# - Password: [secure password]
# - WiFi SSID and password
# - SSH enabled

# After imaging, insert SD card and boot
```

### 1.2 Initial System Configuration
```bash
# SSH into Raspberry Pi
ssh axel@192.168.1.100

# Update system
sudo apt update
sudo apt upgrade -y
sudo apt install -y \
    curl wget git \
    build-essential python3-dev \
    libssl-dev libffi-dev \
    net-tools vim
```

### 1.3 Enable Hardware Interfaces
```bash
# For GPIO access (servos)
# Enable via raspi-config (if available)
sudo raspi-config
# Navigate to Interface Options → GPIO → Enable

# Or manually in /boot/firmware/config.txt
sudo nano /boot/firmware/config.txt
# Add:
# enable_uart=1
# dtoverlay=uart0
```

---

## 🤖 Step 2: ROS2 Installation

### 2.1 Install ROS2 Jazzy
```bash
# Set locale
locale  # verify UTF-8

# Setup keys
sudo apt install software-properties-common
sudo add-apt-repository universe
sudo apt update && sudo apt install curl -y
sudo curl -sSL https://raw.githubusercontent.com/ros/ros.org/master/ros.key | sudo apt-key add -

# Add ROS2 repository
sudo sh -c 'echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/ros-archive-keyring.gpg] http://packages.ros.org/ros2/ubuntu $(. /etc/os-release && echo $UBUNTU_CODENAME) main" > /etc/apt/sources.list.d/ros2.list'

# Install ROS2
sudo apt update
sudo apt install -y ros-jazzy-desktop
```

### 2.2 Setup ROS2 Environment
```bash
# Add to ~/.bashrc
echo "source /opt/ros/jazzy/setup.bash" >> ~/.bashrc
echo "export ROS_DOMAIN_ID=0" >> ~/.bashrc
echo "export ROS_LOCALHOST_ONLY=0" >> ~/.bashrc
source ~/.bashrc

# Verify installation
ros2 --version
```

### 2.3 Install rosbridge_suite
```bash
# Install WebSocket bridge for dashboard communication
sudo apt install -y ros-jazzy-rosbridge-suite

# Or from source
git clone https://github.com/RobotWebTools/rosbridge_suite.git
cd rosbridge_suite
git checkout jazzy-devel
cd ~/
```

---

## 📷 Step 3: Camera Streaming Setup

### 3.1 Install MJPEG-Streamer
```bash
# Install dependencies
sudo apt install -y \
    libjpeg62-turbo-dev \
    imagemagick \
    libavformat-dev \
    libswscale-dev \
    libv4l-dev \
    cmake

# Clone and compile
git clone https://github.com/jacksonliam/mjpg-streamer.git
cd mjpg-streamer/mjpg-streamer-experimental
make
sudo make install
cd ~/
```

### 3.2 Create MJPEG Systemd Service

Create `/etc/systemd/system/mjpeg-streamer.service`:
```ini
[Unit]
Description=MJPEG Streamer
After=network.target

[Service]
Type=simple
User=axel
WorkingDirectory=/home/axel
# For USB camera:
ExecStart=/usr/local/bin/mjpg_streamer -i "input_uvc.so -d /dev/video0 -r 640x480 -f 30" -o "output_http.so -p 8080"
# For Raspberry Pi Camera:
# ExecStart=/usr/local/bin/mjpg_streamer -i "input_raspicam.so -x 640 -y 480 -fps 30" -o "output_http.so -p 8080"
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### 3.3 Enable and Start Service
```bash
sudo systemctl daemon-reload
sudo systemctl enable mjpeg-streamer
sudo systemctl start mjpeg-streamer

# Verify
sudo systemctl status mjpeg-streamer

# Access stream: http://192.168.1.100:8080/?action=stream
```

---

## 🦾 Step 4: Servo Control Setup

### 4.1 Install Python Libraries
```bash
pip install --upgrade pip
pip install \
    adafruit-circuitpython-servokit \
    adafruit-circuitpython-pca9685 \
    rclpy \
    geometry-msgs \
    std-msgs
```

### 4.2 Configure I2C (for PCA9685 servo controller)
```bash
# Enable I2C
sudo raspi-config
# Interface Options → I2C → Enable

# Or manually in /boot/firmware/config.txt:
sudo nano /boot/firmware/config.txt
# Add: dtparam=i2c_arm=on

# Reboot
sudo reboot

# Verify I2C
sudo apt install -y i2c-tools
sudo i2cdetect -y 1
# Should see 0x40 (PCA9685) address
```

### 4.3 Create Servo Control Node

Create `~/ros2_ws/src/axel_servo/servo_controller.py`:

```python
#!/usr/bin/env python3

import rclpy
from rclpy.node import Node
from std_msgs.msg import Float64MultiArray
from sensor_msgs.msg import JointState
from geometry_msgs.msg import Quaternion
import board
import busio
from adafruit_pca9685 import PCA9685
from adafruit_circuitpython_servo import ContinuousServo, Servo
import time

class ServoController(Node):
    def __init__(self):
        super().__init__('servo_controller')
        
        # Initialize I2C
        i2c = busio.I2C(board.SCL, board.SDA)
        self.pca = PCA9685(i2c)
        self.pca.frequency = 50  # Standard servo frequency
        
        # Initialize servos (25 total: 15 head + 10 arm)
        self.servos = {}
        for i in range(25):
            channel = i % 16  # PCA9685 has 16 channels
            self.servos[i + 1] = Servo(
                self.pca.channels[channel],
                min_pulse=1000,  # 1ms
                max_pulse=2000   # 2ms
            )
        
        # ROS Subscribers
        self.servo_cmd_sub = self.create_subscription(
            Float64MultiArray,
            '/servo/cmd',
            self.servo_callback,
            10
        )
        
        # ROS Publishers
        self.servo_state_pub = self.create_publisher(
            JointState,
            '/servo/state',
            10
        )
        
        # Timer for publishing servo state
        self.create_timer(0.1, self.publish_servo_state)
        
        self.current_servo_states = {}
        self.get_logger().info('Servo Controller initialized')
    
    def servo_callback(self, msg):
        """Receive servo commands"""
        if len(msg.data) >= 2:
            servo_id = int(msg.data[0])
            angle = msg.data[1]
            
            if servo_id in self.servos:
                # Convert angle (0-180) to servo angle (-90 to 90)
                servo_angle = (angle / 180.0) * 180.0 - 90.0
                self.servos[servo_id].angle = servo_angle
                self.current_servo_states[servo_id] = angle
                self.get_logger().info(f'Servo {servo_id} set to {angle}°')
    
    def publish_servo_state(self):
        """Publish current servo state"""
        msg = JointState()
        msg.header.stamp = rclpy.time.Time().to_msg()
        
        # Add all servo states
        for servo_id in range(1, 26):
            msg.name.append(f'servo_{servo_id}')
            msg.position.append(self.current_servo_states.get(servo_id, 90) * 3.14159 / 180.0)
        
        self.servo_state_pub.publish(msg)

def main(args=None):
    rclpy.init(args=args)
    servo_controller = ServoController()
    rclpy.spin(servo_controller)
    rclpy.shutdown()

if __name__ == '__main__':
    main()
```

---

## 🌡️ Step 5: Temperature Monitoring

### 5.1 Create Temperature Publisher Node

Create `~/ros2_ws/src/axel_sensors/temperature_monitor.py`:

```python
#!/usr/bin/env python3

import rclpy
from rclpy.node import Node
from std_msgs.msg import Float32
import psutil
import subprocess

class TemperatureMonitor(Node):
    def __init__(self):
        super().__init__('temperature_monitor')
        
        # Publishers
        self.cpu_temp_pub = self.create_publisher(
            Float32,
            '/sensors/cpu_temp',
            10
        )
        
        self.gpu_temp_pub = self.create_publisher(
            Float32,
            '/sensors/gpu_temp',
            10
        )
        
        # Timer: publish every 1 second
        self.create_timer(1.0, self.publish_temperatures)
        self.get_logger().info('Temperature Monitor initialized')
    
    def get_cpu_temp(self):
        """Get CPU temperature"""
        try:
            temps = psutil.sensors_temperatures()
            if 'coretemp' in temps:
                return temps['coretemp'][0].current
            return 0.0
        except:
            return 0.0
    
    def get_gpu_temp(self):
        """Get GPU temperature (Raspberry Pi)"""
        try:
            result = subprocess.run(
                ['/opt/vc/bin/vcgencmd', 'measure_temp'],
                capture_output=True,
                text=True
            )
            temp_str = result.stdout.split('=')[1].split("'")[0]
            return float(temp_str)
        except:
            # Fallback: use CPU temp
            return self.get_cpu_temp()
    
    def publish_temperatures(self):
        """Publish temperature readings"""
        cpu_temp = self.get_cpu_temp()
        gpu_temp = self.get_gpu_temp()
        
        # Publish
        cpu_msg = Float32(data=cpu_temp)
        gpu_msg = Float32(data=gpu_temp)
        
        self.cpu_temp_pub.publish(cpu_msg)
        self.gpu_temp_pub.publish(gpu_msg)
        
        self.get_logger().debug(f'CPU: {cpu_temp}°C, GPU: {gpu_temp}°C')

def main(args=None):
    rclpy.init(args=args)
    monitor = TemperatureMonitor()
    rclpy.spin(monitor)
    rclpy.shutdown()

if __name__ == '__main__':
    main()
```

---

## 🚀 Step 6: Launch Configuration

### 6.1 Create Launch File

Create `~/ros2_ws/src/axel_launch/axel_robot.launch.py`:

```python
from launch import LaunchDescription
from launch_ros.actions import Node
from launch.actions import DeclareLaunchArgument
from launch.substitutions import LaunchConfiguration

def generate_launch_description():
    return LaunchDescription([
        # Servo Controller
        Node(
            package='axel_servo',
            executable='servo_controller',
            name='servo_controller',
            output='screen',
        ),
        
        # Temperature Monitor
        Node(
            package='axel_sensors',
            executable='temperature_monitor',
            name='temperature_monitor',
            output='screen',
        ),
        
        # rosbridge_server
        Node(
            package='rosbridge_server',
            executable='rosbridge_websocket',
            name='rosbridge_websocket',
            parameters=[{'port': 9090}],
            output='screen',
        ),
    ])
```

### 6.2 Build and Install

```bash
cd ~/ros2_ws
colcon build
source install/setup.bash
```

### 6.3 Launch All

```bash
# Terminal 1: Launch robot
ros2 launch axel_launch axel_robot.launch.py

# Verify topics
ros2 topic list
# Should see:
# /servo/cmd
# /servo/state
# /sensors/cpu_temp
# /sensors/gpu_temp
```

---

## 🔗 Step 7: Network Configuration

### 7.1 Static IP Address

```bash
sudo nano /etc/netplan/99_config.yaml
```

Add:
```yaml
network:
  version: 2
  ethernets:
    eth0:
      dhcp4: no
      addresses: [192.168.1.100/24]
      gateway4: 192.168.1.1
      nameservers:
        addresses: [8.8.8.8, 8.8.4.4]
```

```bash
sudo netplan apply
```

### 7.2 Firewall

```bash
# Allow WebSocket (9090) and HTTP (8080)
sudo ufw allow 9090
sudo ufw allow 8080
sudo ufw allow 22
sudo ufw enable
```

---

## ✅ Verification Checklist

- [ ] SSH connection works
- [ ] ROS2 installation verified (`ros2 --version`)
- [ ] I2C devices detected (servo controller at 0x40)
- [ ] Camera stream accessible: `http://192.168.1.100:8080/?action=stream`
- [ ] rosbridge WebSocket running on port 9090
- [ ] ROS topics visible with `ros2 topic list`
- [ ] Servo commands received and executed
- [ ] Temperature data published correctly
- [ ] Static IP assigned and working

---

## 🔧 Troubleshooting

### Camera not streaming
```bash
# Check mjpeg-streamer
sudo systemctl status mjpeg-streamer
sudo journalctl -u mjpeg-streamer -n 50

# Test manually
/usr/local/bin/mjpg_streamer -i "input_uvc.so -d /dev/video0" -o "output_http.so -p 8080"
```

### ROS2 topics not appearing
```bash
# Check rosbridge
ros2 node list
ros2 topic list

# Check for errors
ros2 run rosbridge_server rosbridge_websocket --log-level debug
```

### Servo not moving
```bash
# Check I2C connection
sudo i2cdetect -y 1

# Test servo manually with Python
import board
from adafruit_pca9685 import PCA9685
from adafruit_circuitpython_servo import Servo

i2c = board.I2C()
pca = PCA9685(i2c)
servo = Servo(pca.channels[0])
servo.angle = 90
```

---

## 📝 Next Steps

1. ✅ Hardware Assembly
2. ✅ OS Installation
3. ✅ ROS2 Setup
4. ✅ Servo & Sensor Nodes
5. 🔄 Dashboard Integration (Windows)
6. 🔄 Testing & Calibration

---

## 📚 References

- [ROS2 Jazzy Installation](https://docs.ros.org/en/jazzy/Installation.html)
- [rosbridge_suite Documentation](http://wiki.ros.org/rosbridge_suite)
- [Adafruit PCA9685 Servo Controller](https://learn.adafruit.com/16-channel-pwm-servo-driver?view=all)
- [MJPEG-Streamer GitHub](https://github.com/jacksonliam/mjpg-streamer)

---

**Status**: ⚠️ To be executed on Raspberry Pi (Future Setup)
