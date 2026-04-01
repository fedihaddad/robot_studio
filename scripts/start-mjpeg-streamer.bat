@echo off
REM MJPEG-Streamer Configuration & Launch Scripts for Windows
REM Requires FFmpeg to be installed and in PATH

setlocal enabledelayedexpansion

set RESOLUTION=640x480
set FPS=30
set PORT=8080
set DEVICE=0

echo ==========================================
echo MJPEG-Streamer Launcher (Windows)
echo ==========================================
echo Resolution: %RESOLUTION%
echo FPS: %FPS%
echo Port: %PORT%
echo Device: /dev/video%DEVICE%
echo.

if "%1"=="ffmpeg" (
    echo Starting FFmpeg Stream...
    ffmpeg -f dshow -i video="USB Video Device" -q:v 8 -f mpjpeg http://0.0.0.0:%PORT%/stream
    echo Stream available at: http://localhost:%PORT%/stream
) else if "%1"=="gstreamer" (
    echo Starting GStreamer Stream...
    gst-launch-1.0 -v dshowvideosrc ! video/x-raw,width=%RESOLUTION:x= ,height=! ^
        jpegenc ! multipartmux ! tcpserversink host=0.0.0.0 port=%PORT%
    echo Stream available at: http://localhost:%PORT%/stream
) else (
    echo Usage: %0 {ffmpeg^|gstreamer}
    echo.
    echo Options:
    echo   %0 ffmpeg      - Use FFmpeg for streaming
    echo   %0 gstreamer   - Use GStreamer for streaming
    echo.
    echo Prerequisites:
    echo   - FFmpeg: https://ffmpeg.org/download.html
    echo   - GStreamer: https://gstreamer.freedesktop.org/
    echo.
    echo Stream URL for Axel Dashboard:
    echo   http://localhost:%PORT%/stream
)
