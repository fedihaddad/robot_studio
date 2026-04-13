# Offline Robot Control Guide

## **What is Offline Mode?**

Offline Mode allows you to **move the robot and see it in 3D without needing ROS2 connection**. Perfect for:
- Testing on Windows without Ubuntu
- Learning robot movements
- Previewing poses before sending to hardware
- Developing without hardware

---

## **How to Move the Robot Offline**

### **Step 1: Open the Dashboard**
Your app is already running with **two ways to control**:

### **Option A: Quick Move Buttons (From Dashboard)**
1. Go to the **Main Dashboard** (Page 1)
2. Right side panel shows **Quick Move Buttons** with options:
   - 💪 **Arm Movements** - Right shoulder, right arm, left arm, wave
   - 🧘 **Preset Poses** - Home, grasp, rest positions
   - 🗣️ **Head Movements** - Look up, look down, jaw open, smile

3. **Simply click any button** - Robot moves in offline mode immediately without ROS2!

4. Status shows: `✅ Action (offline)`

---

### **Option B: Full 3D Visualization with Joint Control**
1. Go to **Visualization 3D Page** (Page 6 in sidebar)
2. You'll see:
   - **Large 3D robot viewer** on the left
   - **Live Control panel** on the right
   - Connection status shows: `📺 Offline Mode`

3. Robot responds to your movements in real-time!

---

## **Key Features in Offline Mode**

✅ **Real-time 3D visualization** - See changes instantly  
✅ **All 53 joints supported** - Full body movement  
✅ **Preset poses** - Home, grasp, rest with one click  
✅ **No ROS2 needed** - Works without Ubuntu connection  
✅ **Smooth animations** - See how joints move together  

---

## **Moving Between Modes**

### **Offline → ROS Connected**
1. Start ROS2 on Ubuntu: `ros2 launch inmoov_moveit_config move_group.launch.py`
2. Connection automatically switches to `🟢 Connected`
3. Commands now control the real robot
4. ROS takes priority over offline movements

### **ROS Connected → Offline**
1. Stop ROS on Ubuntu
2. Automatically reverts to `📺 Offline Mode`
3. Can continue testing with simulated movements

---

## **Quick Move Buttons Reference**

### **Arm Movements**
| Button | Effect |
|--------|--------|
| 📍 Right Shoulder | Rotates right shoulder out |
| 💪 Right Arm | Full right arm movement |
| 💪 Left Arm | Full left arm movement |
| 👋 Wave | Wave right arm 3 times |

### **Preset Poses**
| Button | Position |
|--------|----------|
| 🏠 Home | Neutral rest position |
| ✊ Grasp | Hand closes to grasp object |
| 😴 Rest | Arms relaxed at sides |

### **Head Movements**
| Button | Effect |
|--------|--------|
| 🗣️ Up | Head tilts up (looking up) |
| 🗣️ Down | Head tilts down (looking down) |
| 😲 Jaw Open | Jaw opens/closes |
| 😊 Smile | Eyes pan position (smile expression) |

---

## **Controlling Individual Joints**

In **Visualization 3D Page**, advanced users can:
1. Scroll down in the Live Control panel
2. Find servo sliders for each joint
3. Drag sliders to move individual joints
4. See 3D update in real-time

---

## **Viewing the Robot from Different Angles**

In the 3D viewer:
- **Right-click + drag** = Rotate view around robot
- **Scroll wheel** = Zoom in/out
- **Left-click + drag** = Pan view
- **Double-click** = Reset view to default

---

## **Troubleshooting**

### Issue: Robot doesn't move
**Solution:** Check that you're in the right page:
- Dashboard (Page 1) = Quick buttons only
- Visualization 3D (Page 6) = Full 3D with view control

### Issue: Only some joints move
**Solution:** This is normal - preset poses only move certain joints:
- "Grasp" moves fingers only
- "Arm" moves arm joints only
- "Wave" moves shoulder/wrist joints

### Issue: View is too zoomed in
**Solution:** 
- Scroll wheel to zoom out
- Right-click drag to rotate and find the robot
- Double-click to reset view

### Issue: Need to test with real robot
**Solution:**
1. Start ROS2 on Ubuntu
2. Status changes to `🟢 Connected`
3. Click buttons again - they now command the real robot
4. ROS2 will execute movements on hardware

---

## **Next Steps**

1. **Test offline movement** - Click Quick Move Buttons to see robot move
2. **View in 3D** - Go to Visualization 3D page for detailed view
3. **When ready** - Start ROS2 on Ubuntu to control real robot
4. **Combine both** - Use offline for testing, ROS for hardware

---

## **System Architecture**

```
Quick Move Button (Clicked)
    ↓
Check ROS Status
    ↓
    ├─ If Connected → Send to ROS2 → Real Robot Moves
    └─ If Offline → Update Local Joint State → 3D Model Updates
    ↓
RobotViewer Receives Joint Updates
    ↓
3D visualization re-renders (You see the movement)
```

---

**Enjoy testing your robot! 🤖**
