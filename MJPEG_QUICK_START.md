# Quick Start Configuration

## For Raspberry Pi with Camera Module

### 1. Install MJPEG-Streamer
```bash
sudo apt-get update
sudo apt-get install -y mjpeg-streamer libjpeg62-turbo-dev imagemagick

# OR compile from source
git clone https://github.com/jacksonliam/mjpg-streamer.git
cd mjpg-streamer/mjpg-streamer-experimental
make
sudo make install
```

### 2. Start Camera Stream
```bash
# For old Pi Camera Module
mjpg_streamer -i "input_raspicam.so -x 640 -y 480 -fps 30" \
              -o "output_http.so -p 8080 -w /usr/share/mjpg-streamer/www"

# For new Pi Camera (libcamera)
libcamera-jpeg -t 0 --preview none --framerate 30 --width 640 --height 480 --output - | \
  ffmpeg -i - -f mpjpeg http://0.0.0.0:8080/stream
```

### 3. Verify Stream
```bash
# From another terminal
curl http://localhost:8080/?action=stream | ffplay
```

### 4. Update Dashboard Settings
- **ROS Bridge URL**: `ws://raspberry-pi-ip:9090`
- **MJPEG Stream URL**: `http://raspberry-pi-ip:8080/?action=stream`

---

## For Linux Desktop with USB Webcam

```bash
mjpg_streamer -i "input_uvc.so -d /dev/video0 -r 640x480 -f 30" \
              -o "output_http.so -p 8080 -w /usr/share/mjpg-streamer/www"
```

---

## For Windows

### Option 1: Using FFmpeg
```cmd
ffmpeg -f dshow -i video="USB Video Device" -q:v 8 -f mpjpeg http://0.0.0.0:8080/stream
```

### Option 2: Using GStreamer
```cmd
gst-launch-1.0 dshowvideosrc ! jpegenc ! multipartmux ! tcpserversink host=0.0.0.0 port=8080
```

---

## ROS Bridge Setup (All Platforms)

### Install
```bash
sudo apt install ros-jazzy-rosbridge-suite
```

### Start
```bash
ros2 launch rosbridge_server rosbridge_websocket_launch.xml
```

### Verify
```bash
# Check if running
curl http://localhost:9090

# Should see WebSocket connection available
```

---

## Troubleshooting

### Camera not found
- List devices: `ls /dev/video*`
- Test: `ffplay /dev/video0`

### MJPEG-Streamer compilation fails
- Install build tools: `sudo apt install build-essential cmake git`
- Install dependencies: `sudo apt install libv4l-dev libjpeg62-turbo-dev`

### Port already in use
- Check: `lsof -i :8080`
- Kill: `pkill -f mjpg_streamer`

### ROS Bridge connection refused
- Check running: `ps aux | grep ros`
- Start service: `ros2 launch rosbridge_server rosbridge_websocket_launch.xml`
