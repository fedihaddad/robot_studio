# 3D Visualization Architecture

## 📋 Overview

The 3D visualization system allows you to see your AXEL robot in real-time as it moves, synchronized with the actual robot running on your Raspberry Pi.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Dashboard App (Windows)                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │        Visualization3DPage (Main Controller)           │ │
│  ├──────────────────────┬──────────────────────────────────┤ │
│  │                      │                                 │ │
│  │  RobotViewer         │  ControlPanel                  │ │
│  │  (Three.js)          │  • Servo Sliders              │ │
│  │  • 3D Canvas         │  • Head/Arm Tabs              │ │
│  │  • URDF Rendering    │  • Joint Info Display         │ │
│  │  • Real-time Update  │  • Connection Status          │ │
│  │                      │                                │ │
│  └──────────────────────┴──────────────────────────────────┘ │
│           ▲                              ▲                    │
│           │                              │                    │
│     Updates from                    User sends                │
│     /joint_states                   servo commands            │
│           │                              │                    │
│     ┌─────▼──────────────────────────────▼──────┐            │
│     │   ROS2 Bridge (Electron)                  │            │
│     │   • Subscribe to /joint_states            │            │
│     │   • Publish to /cmd_servo                 │            │
│     └──────────────┬──────────────────────────────┘           │
│                    │                                           │
└────────────────────┼───────────────────────────────────────────┘
                     │  WebSocket
           ┌─────────▼──────────┐
           │  Raspberry Pi      │
           │  (Port 9090)       │
           ├────────────────────┤
           │  ROS2              │
           │  • /joint_states   │
           │  • /cmd_servo      │
           │  • MoveIt!         │
           │  • URDF Model      │
           │  • Real Robot      │
           └────────────────────┘
```

## 📁 New Files Created

### 1. **Components**
- `src/components/shared/RobotViewer.tsx`
  - Three.js 3D rendering engine
  - Real-time joint update handler
  - Camera controls (mouse drag, scroll zoom)
  - Placeholder robot (waiting for URDF)

### 2. **Pages**
- `src/pages/Visualization3DPage.tsx`
  - Main visualization page (page 6)
  - Split layout: 3D viewer (70%) + Control panel (30%)
  - Head/Arm servo tabs
  - Real-time servo slider control
  - ROS2 connection status

### 3. **Services**
- `src/services/urdf.loader.ts`
  - URDF XML parser
  - Joint limit extraction
  - Robot structure mapping
  - Ready for Three.js scene building

## 🔗 Integration Points

### App Routing (`src/components/App.tsx`)
```typescript
case 6:
  return <Visualization3DPage onServoCommand={handleServoCommand} rosService={rosServiceRef.current} />;
```

### Navigation (`src/components/shared/Sidebar.tsx`)
```typescript
{ id: 'visualization', label: '3D Visualization', icon: '🤖', page: 6 }
```

## 📊 Data Flow

### **Incoming Updates** (Every 50-100ms)
```
ROS2 /joint_states topic
     ↓
ROSService.subscribeToServoState()
     ↓
useServoControl hook (servoStates)
     ↓
RobotViewer.joints prop
     ↓
Update Three.js joint rotations
     ↓
Re-render 3D model
```

### **Outgoing Commands** (On-demand)
```
User moves slider
     ↓
handleServoChange(servoId, angle)
     ↓
sendCommand() from useServoControl
     ↓
ROSService.publishServoCommand()
     ↓
ROS2 /cmd_servo topic
     ↓
Robot executes movement
```

## 🚀 How It Works

### **User Interface Flow**
1. User opens **"3D Visualization"** page (sidebar)
2. See split layout:
   - **Left (70%)**: 3D robot model (placeholder until URDF loaded)
   - **Right (30%)**: Control panel with servo sliders
3. User moves slider (e.g., Servo 1: 90° → 45°)
4. Command sent to Raspberry Pi via ROS2
5. Real robot at Pi executes movement
6. Pi sends `/joint_states` update
7. 3D model animates in real-time
8. Slider shows feedback position

### **Placeholder Robot** (Current)
The app shows a **simple robot** right now:
- Head (blue cube)
- Torso (green cube)
- Arms (red boxes)
- Base (gray cylinder)

This is replaced when you load your URDF.

## 📦 Dependencies Added

```bash
npm install three
```

Types are automatically available (Three.js includes TS definitions).

## 🎯 What's Next - Your Action Items

### **1. Provide Your URDF File** 📄
Send your robot's URDF file (XML format):
```bash
/path/to/your/robot.urdf
```

Example URDF structure:
```xml
<?xml version="1.0" ?>
<robot name="axel">
  <link name="base_link">
    <geometry>
      <box size="0.3 0.3 0.1"/>
    </geometry>
  </link>
  
  <link name="head">
    <geometry>
      <box size="0.4 0.5 0.4"/>
    </geometry>
  </link>
  
  <joint name="head_pan" type="revolute">
    <parent link="base_link"/>
    <child link="head"/>
    <axis xyz="0 0 1"/>
    <limit lower="-1.57" upper="1.57" effort="10" velocity="1"/>
  </joint>
  ...
</robot>
```

### **2. Provide MoveIt Configuration** (Optional)
If you have a MoveIt package:
```bash
/opt/ros/humble/share/your_robot_moveit/config/
```

### **3. Mesh Files** (Optional)
If your URDF references mesh files:
```bash
meshes/
├── head.stl
├── arm.dae
└── ...
```

## ✅ Current Features

✅ 3D viewer page with real-time rendering
✅ Split layout (3D + Controls)
✅ Servo slider control
✅ ROS2 integration ready
✅ Real-time joint state subscription
✅ Head/Arm tabs
✅ Connection status indicator
✅ Mouse controls (drag, zoom)
✅ URDF parser ready

## 🔄 How to Implement URDF

Once you provide the URDF, I'll:

1. **Update RobotViewer.tsx** to:
   - Load your URDF
   - Create Three.js meshes for each link
   - Set up joint transformations
   - Map joint IDs to servo IDs

2. **Create Configuration** to:
   - Map URDF joint names to servo IDs (1-25)
   - Extract min/max angles from URDF limits
   - Build robot hierarchy

3. **Enable Real-time Sync** to:
   - Subscribe to each joint in `/joint_states`
   - Update mesh rotations in real-time
   - Smooth animations between positions

## 🎮 Control Features

- **Live Sliders**: Move any servo and see it in 3D
- **Head Tab**: Control facial servos (1-15)
- **Arm Tab**: Control arm servos (16-25)
- **Real-time Feedback**: Sliders show actual robot position
- **3D Camera**: Rotate (drag), zoom (scroll), pan (right-click)
- **Connection Indicator**: Shows ROS2 status

## 📝 Installation & Testing

1. **Start the app**:
   ```bash
   npm start
   ```

2. **Navigate to 3D Visualization** (page 6)

3. **See the placeholder robot**

4. **Once you provide URDF**, I'll replace placeholder with real model

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| **Placeholder shown** | URDF not loaded yet (waiting for your file) |
| **3D not updating** | Check ROS2 connection & `/joint_states` topic |
| **Black screen** | Check browser console (F12) for errors |
| **Cannot rotate 3D** | Click & drag in the canvas area |

## 📞 Ready for Next Step ✨

Send me your **URDF file** and I'll:
1. Parse it automatically
2. Build the 3D robot model
3. Map your servo IDs
4. Get real-time visualization working!

---

**Architecture created**: March 30, 2026
**Status**: Ready for URDF integration
