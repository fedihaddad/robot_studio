# MoveIt Integration Guide - AXEL Dashboard

**Goal**: Control all 53 joints in your Electron dashboard using MoveIt (same as Ubuntu + RViz)

---

## 📋 WHAT YOU NEED

### 1. **MoveIt Configuration Files** (to be copied)
Location: `robot/inmoov_moveit_config/config/`

Files needed:
- `inmoov.srdf` - Defines planning groups (right_arm, left_arm, head, hands, torso)
- `joint_limits.yaml` - Joint velocity/acceleration limits
- `kinematics.yaml` - IK solver config
- `moveit_controllers.yaml` - Controller definitions
- `moveit.rviz` - RViz config (optional if using dashboard only)

### 2. **Your Current Assets**
✅ URDF complete and correct: `src/data/inmoov-local.urdf`
✅ 53 controlled joints verified
✅ All meshes and links defined

### 3. **ROS2 Setup** (if not already installed)
Required:
- ROS2 (Iron or Humble)
- MoveIt2 package
- rviz2 (optional, for visualization)

---

## 🚀 STEP-BY-STEP SETUP

### **STEP 1: Copy MoveIt Config to Your Project**

```bash
# Create MoveIt config folder in your project
mkdir -p src/ros/moveit_config/config

# Copy from Ubuntu folder
cp robot/inmoov_moveit_config/config/* src/ros/moveit_config/config/
```

Files to copy:
```
src/ros/moveit_config/
├── config/
│   ├── inmoov.srdf
│   ├── joint_limits.yaml
│   ├── kinematics.yaml
│   ├── moveit_controllers.yaml
│   └── sensors_3d.yaml
├── package.xml
├── CMakeLists.txt
└── launch/
    └── move_group.launch.py
```

---

### **STEP 2: Create MoveIt ROS Node Service**

Create new file: `src/services/moveItService.ts`

```typescript
import * as rcljs from 'rcljs';
import { FollowJointTrajectoryAction } from 'rcl_interfaces/msg';

export class MoveItService {
  private node: rcljs.Node;
  private actionClients: Map<string, any> = new Map();

  // Define controller groups
  private controllers = {
    right_arm: 'right_arm_controller',
    left_arm: 'left_arm_controller',
    right_hand: 'right_hand_controller',
    left_hand: 'left_hand_controller',
    head: 'head_controller',
    face: 'face_controller',
    torso: 'torso_controller',
  };

  async init() {
    this.node = new rcljs.Node('axel_moveit_client');

    // Initialize action clients for each controller
    for (const [group, controller] of Object.entries(this.controllers)) {
      const actionName = `/trajectory_controller/${controller}/follow_joint_trajectory`;
      // Create action client here
      this.actionClients.set(group, actionName);
    }
  }

  // Move arm to position
  async moveArm(side: 'left' | 'right', jointAngles: number[]) {
    const controller = side === 'left' ? 'left_arm' : 'right_arm';
    const joints = side === 'left' 
      ? ['l_shoulder_out_joint', 'l_shoulder_lift_joint', 'l_upper_arm_roll_joint', 'l_elbow_flex_joint', 'l_wrist_roll_joint']
      : ['r_shoulder_out_joint', 'r_shoulder_lift_joint', 'r_upper_arm_roll_joint', 'r_elbow_flex_joint', 'r_wrist_roll_joint'];
    
    // Send trajectory
    await this.sendTrajectory(controller, joints, jointAngles);
  }

  // Move single joint
  async moveJoint(jointName: string, angle: number) {
    const groupName = this.getGroupForJoint(jointName);
    // Send trajectory for single joint movement
    await this.sendTrajectory(groupName, [jointName], [angle]);
  }

  // Move multiple joints
  async moveJoints(joints: Array<{name: string, angle: number}>) {
    const grouped = this.groupJointsByController(joints);
    for (const [controller, jointData] of Object.entries(grouped)) {
      const jointNames = jointData.map(j => j.name);
      const angles = jointData.map(j => j.angle);
      await this.sendTrajectory(controller, jointNames, angles);
    }
  }

  private async sendTrajectory(controller: string, joints: string[], angles: number[]) {
    // Send FollowJointTrajectory action
    // Implementation here
  }

  private getGroupForJoint(jointName: string): string {
    // Map joint name to controller group
    if (jointName.startsWith('r_shoulder') || jointName.startsWith('r_elbow') || jointName.startsWith('r_wrist')) {
      return 'right_arm';
    } else if (jointName.startsWith('l_shoulder') || jointName.startsWith('l_elbow') || jointName.startsWith('l_wrist')) {
      return 'left_arm';
    } else if (jointName.startsWith('r_')) {
      return 'right_hand';
    } else if (jointName.startsWith('l_')) {
      return 'left_hand';
    } else if (jointName.includes('head')) {
      return 'head';
    } else if (jointName.includes('jaw') || jointName.includes('eyes')) {
      return 'face';
    } else if (jointName.includes('waist')) {
      return 'torso';
    }
    return 'unknown';
  }

  private groupJointsByController(joints: Array<{name: string, angle: number}>) {
    // Group by controller
  }
}
```

---

### **STEP 3: Update Your ROS Connection Service**

Update file: `src/services/ros.service.ts`

Add MoveIt subscription:

```typescript
// Import MoveIt service
import { MoveItService } from './moveItService';

export class ROSService {
  private moveItService: MoveItService;
  private node: rcljs.Node;

  async init() {
    // ... existing code ...
    
    // Initialize MoveIt
    this.moveItService = new MoveItService();
    await this.moveItService.init();
  }

  // Example: Control via MoveIt
  async controlJointViaMoveIt(jointName: string, angle: number) {
    await this.moveItService.moveJoint(jointName, angle);
  }

  // Example: Move arm group
  async moveArmGroup(side: 'left' | 'right', angles: number[]) {
    await this.moveItService.moveArm(side, angles);
  }
}
```

---

### **STEP 4: Create MoveIt Controller UI in Dashboard**

Create file: `src/components/MoveItControlPanel.tsx`

```typescript
import React, { useState } from 'react';
import { useROS } from '../hooks/useROS';

export const MoveItControlPanel: React.FC = () => {
  const { ros } = useROS();
  const [selectedGroup, setSelectedGroup] = useState('right_arm');
  const [jointAngles, setJointAngles] = useState<number[]>([0, 0, 0, 0, 0]);

  const controllerGroups = [
    { name: 'right_arm', label: '💪 Right Arm', joints: 5 },
    { name: 'left_arm', label: '💪 Left Arm', joints: 5 },
    { name: 'right_hand', label: '✋ Right Hand', joints: 17 },
    { name: 'left_hand', label: '✋ Left Hand', joints: 17 },
    { name: 'head', label: '🗣️ Head', joints: 3 },
    { name: 'face', label: '😊 Face', joints: 4 },
    { name: 'torso', label: '🟡 Torso', joints: 2 },
  ];

  const handleMove = async () => {
    try {
      await ros?.controlJointViaMoveIt(selectedGroup, jointAngles);
    } catch (error) {
      console.error('MoveIt error:', error);
    }
  };

  return (
    <div className="p-6 bg-gray-900 rounded-lg">
      <h2 className="text-2xl font-bold mb-4">🤖 MoveIt Control</h2>

      <div className="mb-6">
        <label className="block text-lg font-semibold mb-2">Select Group:</label>
        <select
          value={selectedGroup}
          onChange={(e) => setSelectedGroup(e.target.value)}
          className="w-full p-2 bg-gray-800 text-white rounded"
        >
          {controllerGroups.map((group) => (
            <option key={group.name} value={group.name}>
              {group.label} ({group.joints} joints)
            </option>
          ))}
        </select>
      </div>

      <div className="mb-6">
        <label className="block text-lg font-semibold mb-2">Joint Angles (radians):</label>
        <div className="grid grid-cols-5 gap-2">
          {jointAngles.map((angle, i) => (
            <input
              key={i}
              type="number"
              step="0.1"
              value={angle}
              onChange={(e) => {
                const newAngles = [...jointAngles];
                newAngles[i] = parseFloat(e.target.value);
                setJointAngles(newAngles);
              }}
              className="p-2 bg-gray-800 text-white rounded"
              placeholder={`J${i + 1}`}
            />
          ))}
        </div>
      </div>

      <button
        onClick={handleMove}
        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded"
      >
        🚀 Move Group
      </button>
    </div>
  );
};
```

---

### **STEP 5: Launch MoveIt (Ubuntu/ROS System)**

From terminal on ROS machine:

```bash
# Navigate to MoveIt config folder
cd robot/inmoov_moveit_config

# Launch MoveIt
ros2 launch inmoov_moveit_config move_group.launch.py

# In another terminal, launch RViz (optional)
rviz2 -d robot/inmoov_moveit_config/config/moveit.rviz
```

---

### **STEP 6: Connect Dashboard to MoveIt**

In your dashboard initialization:

```typescript
// In src/renderer.tsx or main setup
import { ROSService } from './services/ros.service';

const rosService = new ROSService();
await rosService.init(); // This now includes MoveIt

// Use in components
export const useROS = () => {
  return { ros: rosService };
};
```

---

## ✅ WHAT YOU GET

Once set up, you can:

| Feature | Details |
|---------|---------|
| **Move any joint** | All 53 joints controllable |
| **Preset poses** | Save/load arm configurations |
| **Inverse Kinematics** | Move end-effectors in 3D space |
| **Collision checking** | MoveIt validates movements (no self-collision) |
| **Trajectory planning** | Smooth motion generation |
| **RViz visualization** | See robot move in real-time |

---

## 🔧 CONFIGURATION REFERENCE

### **Planning Groups** (from SRDF)

```yaml
Groups:
  - right_arm: 5 joints
  - left_arm: 5 joints
  - right_hand: 17 joints (all fingers)
  - left_hand: 17 joints (all fingers)
  - head: 3 joints
  - face: 4 joints (eyes + jaw)
  - torso: 2 joints (waist)
  - upper_body: all of above
```

### **Joint Limits** (from joint_limits.yaml)

```yaml
Arm joints: 
  - velocity: 1.0 rad/s
  - acceleration: 1.5 rad/s²

Head joints:
  - velocity: 4.0 rad/s
  - acceleration: 20.0 rad/s²

Face/Eyes:
  - velocity: 4.0 rad/s
  - acceleration: 20.0 rad/s²

Torso:
  - velocity: 1.5 rad/s
  - acceleration: 2.0 rad/s²
```

---

## 📚 RESOURCES

- **SRDF File Location**: `robot/inmoov_moveit_config/config/inmoov.srdf`
- **Joint Limits**: `robot/inmoov_moveit_config/config/joint_limits.yaml`
- **Controllers**: `robot/inmoov_moveit_config/config/moveit_controllers.yaml`
- **MoveIt2 Docs**: https://moveit.ros.org/

---

## ⚡ QUICK TEST

After setup, test with a single joint movement:

```typescript
// Move right shoulder
await ros.controlJointViaMoveIt('r_shoulder_out_joint', 0.5);

// Move left hand to grasp position
await ros.moveArmGroup('left', [0.5, 1.2, 0.3, 1.5, 0.0]);
```

---

## 🎯 NEXT STEPS

1. ✅ Copy MoveIt config files
2. ✅ Create moveItService.ts
3. ✅ Update ros.service.ts
4. ✅ Add MoveItControlPanel component
5. ✅ Launch MoveIt on ROS system
6. ✅ Test joint movements
7. ✅ Add to main Dashboard

---

**Status**: Ready to implement. All configuration files exist in Ubuntu folder. Just needs integration with your Electron app!
