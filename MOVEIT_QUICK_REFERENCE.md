# 🎮 MoveIt Integration - Quick Reference

**Status**: ✅ Ready to implement
**Total Controlled Joints**: 53
**Planning Groups**: 7

---

## 📦 Files Created for You

| File | Purpose |
|------|---------|
| `src/services/moveItService.ts` | Main MoveIt service (complete & ready) |
| `src/components/MoveItControlPanel.tsx` | Beautiful UI component with sliders |
| `MOVEIT_SETUP_GUIDE.md` | Full implementation guide |
| `setup-moveit.ps1` | PowerShell setup script |

---

## 🚀 HOW TO USE

### 1️⃣ **Initialize MoveIt in your app**

```typescript
import { moveItService } from './services/moveItService';

// In your main app setup
await moveItService.init();
```

### 2️⃣ **Move a single joint**

```typescript
// Move right shoulder to 0.5 radians (28.65°) over 2 seconds
await moveItService.moveJoint('r_shoulder_out_joint', 0.5);

// With custom duration (5 seconds)
await moveItService.moveJoint('r_shoulder_out_joint', 0.5, 5.0);
```

### 3️⃣ **Move an entire planning group**

```typescript
// Move right arm to position
const rightArmAngles = [0.5, 1.2, 0.3, -1.5, 0.0]; // 5 joints
await moveItService.moveGroup('right_arm', rightArmAngles, 3.0);

// Move head
const headAngles = [0, -0.3, 0]; // 3 joints
await moveItService.moveGroup('head', headAngles, 2.0);
```

### 4️⃣ **Move multiple joints at once**

```typescript
await moveItService.moveMultiple([
  { joint: 'r_shoulder_out_joint', angle: 0.5 },
  { joint: 'r_elbow_flex_joint', angle: -1.5 },
  { joint: 'l_eye_pan_joint', angle: 0.3 },
], 2.0);
```

### 5️⃣ **Use preset poses**

```typescript
// Move to home position (default pose)
await moveItService.moveToPreset('home');

// Move to rest position (arms relaxed)
await moveItService.moveToPreset('rest');

// Move to grasp position (ready to grab)
await moveItService.moveToPreset('grasp');
```

### 6️⃣ **Add UI Component to dashboard**

```typescript
import { MoveItControlPanel } from './components/MoveItControlPanel';

export const Dashboard = () => (
  <div>
    <h1>AXEL Dashboard</h1>
    <MoveItControlPanel enabled={true} />
  </div>
);
```

---

## 📊 Planning Groups & Joints

### **Right Arm** (5 joints)
```
r_shoulder_out_joint     - Shoulder abduction/adduction
r_shoulder_lift_joint    - Shoulder lift/lower
r_upper_arm_roll_joint   - Upper arm rotation
r_elbow_flex_joint       - Elbow bend/extend
r_wrist_roll_joint       - Wrist rotation
```

### **Left Arm** (5 joints)
```
l_shoulder_out_joint
l_shoulder_lift_joint
l_upper_arm_roll_joint
l_elbow_flex_joint
l_wrist_roll_joint
```

### **Head** (3 joints)
```
head_roll_joint          - Head tilt side-to-side
head_tilt_joint          - Head nod forward/back
head_pan_joint           - Head turn left/right
```

### **Face** (4 joints)
```
jaw_joint                - Jaw open/close
eyes_tilt_joint          - Eyes look up/down
eyes_pan_joint           - Right eye pan
l_eye_pan_joint          - Left eye pan (synchronized)
```

### **Torso** (2 joints)
```
waist_pan_joint          - Torso rotate left/right
waist_roll_joint         - Torso lean left/right
```

### **Right Hand** (17 joints - all fingers + phalanges)
```
r_thumb1_joint, r_thumb_joint, r_thumb3_joint
r_index1_joint, r_index_joint, r_index3_joint
r_middle1_joint, r_middle_joint, r_middle3_joint
r_ring1_joint, r_ring_joint, r_ring3_joint, r_ring4_joint
r_pinky1_joint, r_pinky_joint, r_pinky3_joint, r_pinky4_joint
```

### **Left Hand** (17 joints - all fingers + phalanges)
```
l_thumb1_joint, l_thumb_joint, l_thumb3_joint
l_index1_joint, l_index_joint, l_index3_joint
l_middle1_joint, l_middle_joint, l_middle3_joint
l_ring1_joint, l_ring_joint, l_ring3_joint, l_ring4_joint
l_pinky1_joint, l_pinky_joint, l_pinky3_joint, l_pinky4_joint
```

---

## 🔢 Angle Ranges (Radians)

| Joint Type | Min | Max | Range |
|-----------|-----|-----|-------|
| **Arm** | -3.14 | 3.14 | ±180° |
| **Head** | -0.6 | 0.6 | ±34° |
| **Face** | -1.2 | 1.2 | ±69° |
| **Torso** | -0.6 | 0.6 | ±34° |
| **Hand** | -1.2 | 1.2 | ±69° |

**Conversion**: Degrees = (Radians × 180) / π

---

## ⚡ Movement Speed Limits

| Group | Velocity | Acceleration |
|-------|----------|--------------|
| **Arm** | 1.0 rad/s | 1.5 rad/s² |
| **Head** | 4.0 rad/s | 20.0 rad/s² |
| **Face** | 4.0 rad/s | 20.0 rad/s² |
| **Torso** | 1.5 rad/s | 2.0 rad/s² |
| **Hand** | 1.0 rad/s | 1.5 rad/s² |

---

## 💾 Service Methods Reference

### **Query Methods**
```typescript
// Get all joints
moveItService.getAllJoints() 
// Returns: string[] of all 53 joint names

// List planning groups
moveItService.listPlanningGroups()
// Returns: ['right_arm', 'left_arm', 'head', 'face', 'torso', 'right_hand', 'left_hand']

// Get joint limits
moveItService.getJointLimits('right_arm')
// Returns: { velocity: 1.0, acceleration: 1.5 }

// Get service status
moveItService.getStatus()
// Returns: { initialized: true, planningGroups: 7, totalJoints: 53 }
```

### **Movement Methods**
```typescript
// Move single joint
moveItService.moveJoint(jointName, angle, duration)

// Move entire group
moveItService.moveGroup(groupName, angles, duration)

// Move multiple joints
moveItService.moveMultiple(movements, duration)

// Use preset poses
moveItService.moveToPreset('home' | 'rest' | 'grasp')
```

### **Lifecycle Methods**
```typescript
// Initialize
await moveItService.init()

// Cleanup
await moveItService.shutdown()
```

---

## 🎯 Example Use Cases

### **Example 1: Pick and Place**
```typescript
// Move arm to grasp position
await moveItService.moveToPreset('grasp');

// Close hand fingers
await moveItService.moveJoint('r_pinky_joint', 1.2, 1.0);
await moveItService.moveJoint('r_ring_joint', 1.2, 1.0);
await moveItService.moveJoint('r_middle_joint', 1.2, 1.0);
await moveItService.moveJoint('r_index_joint', 1.2, 1.0);
await moveItService.moveJoint('r_thumb_joint', 1.0, 1.0);

// Move to drop location
await moveItService.moveGroup('right_arm', [1.0, 0.5, 0, 0, 0], 3.0);

// Open hand
await moveItService.moveMultiple([
  { joint: 'r_pinky_joint', angle: -1.2 },
  { joint: 'r_ring_joint', angle: -1.2 },
  { joint: 'r_middle_joint', angle: -1.2 },
  { joint: 'r_index_joint', angle: -1.2 },
  { joint: 'r_thumb_joint', angle: 0 },
], 1.0);
```

### **Example 2: Wave Gesture**
```typescript
for (let i = 0; i < 3; i++) {
  await moveItService.moveGroup('right_arm', [0.5, 0.5, 0, -1.0, 0.5], 0.5);
  await moveItService.moveGroup('right_arm', [0.5, 0.5, 0, -1.0, -0.5], 0.5);
}
```

### **Example 3: Look & Track**
```typescript
// Look at target position
await moveItService.moveGroup('head', [0, -0.3, 0.5], 1.0); // Look right and down
await moveItService.moveMultiple([
  { joint: 'eyes_pan_joint', angle: 0.5 },
  { joint: 'l_eye_pan_joint', angle: 0.5 },
], 0.5);
```

---

## ✅ IMPLEMENTATION CHECKLIST

- [ ] Copy `src/services/moveItService.ts` to your project
- [ ] Copy `src/components/MoveItControlPanel.tsx` to your project
- [ ] Copy MoveIt config files from Ubuntu folder (`robot/inmoov_moveit_config/config/`)
- [ ] Update `src/services/ros.service.ts` to initialize MoveIt
- [ ] Add `<MoveItControlPanel />` to your main Dashboard component
- [ ] Test single joint movement in browser console
- [ ] Launch MoveIt on Ubuntu/ROS machine: `ros2 launch inmoov_moveit_config move_group.launch.py`
- [ ] Test dashboard connection to MoveIt
- [ ] Test all 7 planning groups
- [ ] Verify 3D visualization updates with joint movements

---

## 🐛 TROUBLESHOOTING

| Issue | Solution |
|-------|----------|
| Service not initialized | Call `await moveItService.init()` before using any methods |
| Can't find joint | Use `moveItService.getAllJoints()` to verify joint name spelling |
| Movement too slow | Increase duration parameter (default: 2.0s) |
| ROS not connecting | Verify ROS2 is running and MoveIt daemon is active |
| Angle out of range | Check `moveItService.getJointLimits()` for allowed ranges |

---

## 📞 SUPPORT

**File**: `MOVEIT_SETUP_GUIDE.md` - Full detailed guide  
**Service**: `src/services/moveItService.ts` - Complete implementation  
**UI**: `src/components/MoveItControlPanel.tsx` - Ready-to-use dashboard  

---

**Status**: 🟢 **READY FOR IMPLEMENTATION**  
**Complexity**: 🟡 **MEDIUM** (straightforward ROS integration)  
**Time to implement**: ⏱️ **2-3 hours** (including ROS setup)
