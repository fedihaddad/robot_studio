#!/bin/bash
# MJPEG-Streamer Configuration & Launch Scripts
# Save as: start-mjpeg-streamer.sh

# Configuration Variables
RESOLUTION="640x480"
FPS="30"
PORT="8080"

echo "=========================================="
echo "MJPEG-Streamer Launcher"
echo "=========================================="
echo "Resolution: $RESOLUTION"
echo "FPS: $FPS"
echo "Port: $PORT"
echo ""

# Method 1: USB Webcam (Linux/Raspberry Pi)
start_usb_camera() {
    echo "Starting USB Camera Stream..."
    mjpg_streamer -i "input_uvc.so -d /dev/video0 -r $RESOLUTION -f $FPS" \
                  -o "output_http.so -p $PORT -w /usr/share/mjpg-streamer/www"
    echo "Stream available at: http://localhost:$PORT/?action=stream"
}

# Method 2: Raspberry Pi Camera Module
start_pi_camera() {
    echo "Starting Raspberry Pi Camera Stream..."
    mjpg_streamer -i "input_raspicam.so -x ${RESOLUTION%x*} -y ${RESOLUTION#*x} -fps $FPS" \
                  -o "output_http.so -p $PORT -w /usr/share/mjpg-streamer/www"
    echo "Stream available at: http://localhost:$PORT/?action=stream"
}

# Method 3: Raspberry Pi Camera Module v2 (libcamera)
start_pi_camera_libcamera() {
    echo "Starting Raspberry Pi Camera (libcamera) Stream..."
    libcamera-jpeg -t 0 --autofocus-mode continuous --preview none \
        --framerate $FPS --width ${RESOLUTION%x*} --height ${RESOLUTION#*x} \
        --output - | ffmpeg -i - -f mpjpeg http://0.0.0.0:$PORT/stream
    echo "Stream available at: http://localhost:$PORT/stream"
}

# Method 4: FFmpeg with HTTP
start_ffmpeg() {
    local INPUT=${1:-"/dev/video0"}
    echo "Starting FFmpeg Stream from $INPUT..."
    ffmpeg -f v4l2 -input_format yuyv422 -video_size $RESOLUTION -framerate $FPS \
           -i $INPUT -q:v 8 -f mpjpeg http://0.0.0.0:$PORT/stream &
    echo "Stream available at: http://localhost:$PORT/stream"
}

# Menu
if [ "$1" == "usb" ]; then
    start_usb_camera
elif [ "$1" == "pi" ]; then
    start_pi_camera
elif [ "$1" == "pi-libcamera" ]; then
    start_pi_camera_libcamera
elif [ "$1" == "ffmpeg" ]; then
    start_ffmpeg "$2"
else
    echo "Usage: $0 {usb|pi|pi-libcamera|ffmpeg [device]}"
    echo ""
    echo "Examples:"
    echo "  $0 usb                    # USB webcam"
    echo "  $0 pi                     # Raspberry Pi camera module"
    echo "  $0 pi-libcamera           # Raspberry Pi camera (libcamera)"
    echo "  $0 ffmpeg /dev/video0    # FFmpeg with specific device"
fi
