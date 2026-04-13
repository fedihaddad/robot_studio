# Ubuntu XACRO Joint Structure - Complete Inventory

**Source Location**: `robot/inmoov_ros-master/inmoov_description/robots/inmoov.urdf.xacro`

**Date**: April 10, 2026

---

## Summary Statistics

- **Total Joints**: 89 (including all fixed and revolute)
- **Revolute Joints**: 53
- **Fixed Joints**: 36
- **Main Components**: Base, Torso, Head, Eyes, Face, Arms (L/R), Hands (L/R)

---

## Complete Joint List (In Order of Appearance)

### 1. Base & World Connections (3 joints)
| # | Joint Name | Type | Parent Link | Child Link |
|---|---|---|---|---|
| 1 | fixed | fixed | world | base_link |
| 2 | base_to_pedestal_link | fixed | base_link | pedestal_link |
| 3 | pedestal_to_mid_stomach_joint | fixed | pedestal_link | mid_stomach_link |

### 2. Head Main Joints (5 joints)
| # | Joint Name | Type | Parent Link | Child Link |
|---|---|---|---|---|
| 4 | head_roll_joint | revolute | torso_link | head_tilt_link |
| 5 | head_tilt_joint | revolute | head_tilt_link | head_base_link |
| 6 | face_joint | fixed | skull_link | face_link |

### 3. Torso Joints from asmTorso macro (7 joints)
| # | Joint Name | Type | Parent Link | Child Link |
|---|---|---|---|---|
| 7 | waist_pan_joint | revolute | mid_stomach_link | top_stomach_link |
| 8 | disk_joint | fixed | top_stomach_link | disk_link |
| 9 | waist_roll_joint | revolute | top_stomach_link | torso_link |
| 10 | chestplate_joint | fixed | torso_link | chestplate_link |
| 11 | kinect2_joint | fixed | torso_link | kinect2_link |
| 12 | kinect2_ir_optical_frame_joint | fixed | torso_link | kinect2_ir_optical_frame |
| 13 | kinect2_rgb_optical_joint | fixed | torso_link | kinect2_rgb_optical_frame |

### 4. Head Detail Joints from asmHead macro (5 joints)
| # | Joint Name | Type | Parent Link | Child Link |
|---|---|---|---|---|
| 14 | head_pan_joint | revolute | head_base_link | head_link |
| 15 | jaw_joint | revolute | head_link | jaw_link |
| 16 | skull_joint | fixed | head_link | skull_link |
| 17 | left_ear_joint | fixed | head_link | left_ear_link |
| 18 | right_ear_joint | fixed | head_link | right_ear_link |

### 5. Face/Eyes Joints from asmFace macro (3 joints)
| # | Joint Name | Type | Parent Link | Child Link |
|---|---|---|---|---|
| 19 | eyes_tilt_joint | revolute | face_link | eyesupport_link |
| 20 | eyes_pan_joint | revolute | eyesupport_link | r_eyesupport_link |
| 21 | l_eye_pan_joint | revolute (mimic) | eyesupport_link | l_eyesupport_link |

### 6. Right Eye Joints from asmEye macro (side="r") (3 joints)
| # | Joint Name | Type | Parent Link | Child Link |
|---|---|---|---|---|
| 22 | r_camera_joint | fixed | r_eyesupport_link | r_camera_link |
| 23 | r_eye_joint | fixed | r_eyesupport_link | r_eye_link |
| 24 | r_iris_joint | fixed | r_eyesupport_link | r_iris_link |

### 7. Left Eye Joints from asmEye macro (side="l") (3 joints)
| # | Joint Name | Type | Parent Link | Child Link |
|---|---|---|---|---|
| 25 | l_camera_joint | fixed | l_eyesupport_link | l_camera_link |
| 26 | l_eye_joint | fixed | l_eyesupport_link | l_eye_link |
| 27 | l_iris_joint | fixed | l_eyesupport_link | l_iris_link |

### 8. Right Shoulder Out Connection (1 joint)
| # | Joint Name | Type | Parent Link | Child Link |
|---|---|---|---|---|
| 28 | r_shoulder_out_joint | revolute | torso_link | r_shoulder_base_link |

### 9. Right Arm Joints from asmArm macro (side="r", flip="1") (4 joints)
| # | Joint Name | Type | Parent Link | Child Link |
|---|---|---|---|---|
| 29 | r_shoulder_lift_joint | revolute | r_shoulder_base_link | r_shoulder_link |
| 30 | r_upper_arm_roll_joint | revolute | r_shoulder_link | r_bicep_link |
| 31 | r_elbow_flex_joint | revolute | r_bicep_link | r_forearm_link |
| 32 | r_bicepcover_joint | fixed | r_bicep_link | r_bicepcover_link |

### 10. Right Wrist Connection (1 joint)
| # | Joint Name | Type | Parent Link | Child Link |
|---|---|---|---|---|
| 33 | r_wrist_roll_joint | revolute | r_forearm_link | r_hand_link |

### 11. Right Hand Finger Joints from asmHand macro (side="r", flip="1") (24 joints)

#### Thumb (3 joints)
| # | Joint Name | Type | Parent Link | Child Link |
|---|---|---|---|---|
| 34 | r_thumb1_joint | revolute (mimic) | r_hand_link | r_thumb1_link |
| 35 | r_thumb_joint | revolute | r_thumb1_link | r_thumb2_link |
| 36 | r_thumb3_joint | revolute (mimic) | r_thumb2_link | r_thumb3_link |

#### Index (3 joints)
| # | Joint Name | Type | Parent Link | Child Link |
|---|---|---|---|---|
| 37 | r_index1_joint | revolute (mimic) | r_hand_link | r_index1_link |
| 38 | r_index_joint | revolute | r_index1_link | r_index2_link |
| 39 | r_index3_joint | revolute (mimic) | r_index2_link | r_index3_link |

#### Middle (3 joints)
| # | Joint Name | Type | Parent Link | Child Link |
|---|---|---|---|---|
| 40 | r_middle1_joint | revolute (mimic) | r_hand_link | r_middle1_link |
| 41 | r_middle_joint | revolute | r_middle1_link | r_middle2_link |
| 42 | r_middle3_joint | revolute (mimic) | r_middle2_link | r_middle3_link |

#### Ring (4 joints)
| # | Joint Name | Type | Parent Link | Child Link |
|---|---|---|---|---|
| 43 | r_ring1_joint | revolute (mimic) | r_hand_link | r_ring1_link |
| 44 | r_ring_joint | revolute | r_ring1_link | r_ring2_link |
| 45 | r_ring3_joint | revolute (mimic) | r_ring2_link | r_ring3_link |
| 46 | r_ring4_joint | revolute (mimic) | r_ring3_link | r_ring4_link |

#### Pinky (4 joints)
| # | Joint Name | Type | Parent Link | Child Link |
|---|---|---|---|---|
| 47 | r_pinky1_joint | revolute (mimic) | r_hand_link | r_pinky1_link |
| 48 | r_pinky_joint | revolute | r_pinky1_link | r_pinky2_link |
| 49 | r_pinky3_joint | revolute (mimic) | r_pinky2_link | r_pinky3_link |
| 50 | r_pinky4_joint | revolute (mimic) | r_pinky3_link | r_pinky4_link |

#### Right Hand Covers (8 joints)
| # | Joint Name | Type | Parent Link | Child Link |
|---|---|---|---|---|
| 51 | r_handcover_joint | fixed | r_hand_link | r_handcover_link |
| 52 | r_cover_handpinky_joint | fixed | r_pinky1_link | r_cover_handpinky_link |
| 53 | r_cover_handring_joint | fixed | r_ring1_link | r_cover_handring_link |
| 54 | r_cover_middle_joint | fixed | r_middle1_link | r_cover_middle_link |
| 55 | r_cover_thumb_joint | fixed | r_thumb1_link | r_cover_thumb_link |
| 56 | r_cover_index_joint | fixed | r_index1_link | r_cover_index_link |
| 57 | r_cover_ring_joint | fixed | r_ring2_link | r_cover_ring_link |
| 58 | r_cover_pinky_joint | fixed | r_pinky2_link | r_cover_pinky_link |

### 12. Left Shoulder Out Connection (1 joint)
| # | Joint Name | Type | Parent Link | Child Link |
|---|---|---|---|---|
| 59 | l_shoulder_out_joint | revolute | torso_link | l_shoulder_base_link |

### 13. Left Arm Joints from asmArm macro (side="l", flip="-1") (4 joints)
| # | Joint Name | Type | Parent Link | Child Link |
|---|---|---|---|---|
| 60 | l_shoulder_lift_joint | revolute | l_shoulder_base_link | l_shoulder_link |
| 61 | l_upper_arm_roll_joint | revolute | l_shoulder_link | l_bicep_link |
| 62 | l_elbow_flex_joint | revolute | l_bicep_link | l_forearm_link |
| 63 | l_bicepcover_joint | fixed | l_bicep_link | l_bicepcover_link |

### 14. Left Wrist Connection (1 joint)
| # | Joint Name | Type | Parent Link | Child Link |
|---|---|---|---|---|
| 64 | l_wrist_roll_joint | revolute | l_forearm_link | l_hand_link |

### 15. Left Hand Finger Joints from asmHand macro (side="l", flip="-1") (24 joints)

#### Thumb (3 joints)
| # | Joint Name | Type | Parent Link | Child Link |
|---|---|---|---|---|
| 65 | l_thumb1_joint | revolute (mimic) | l_hand_link | l_thumb1_link |
| 66 | l_thumb_joint | revolute | l_thumb1_link | l_thumb2_link |
| 67 | l_thumb3_joint | revolute (mimic) | l_thumb2_link | l_thumb3_link |

#### Index (3 joints)
| # | Joint Name | Type | Parent Link | Child Link |
|---|---|---|---|---|
| 68 | l_index1_joint | revolute (mimic) | l_hand_link | l_index1_link |
| 69 | l_index_joint | revolute | l_index1_link | l_index2_link |
| 70 | l_index3_joint | revolute (mimic) | l_index2_link | l_index3_link |

#### Middle (3 joints)
| # | Joint Name | Type | Parent Link | Child Link |
|---|---|---|---|---|
| 71 | l_middle1_joint | revolute (mimic) | l_hand_link | l_middle1_link |
| 72 | l_middle_joint | revolute | l_middle1_link | l_middle2_link |
| 73 | l_middle3_joint | revolute (mimic) | l_middle2_link | l_middle3_link |

#### Ring (4 joints)
| # | Joint Name | Type | Parent Link | Child Link |
|---|---|---|---|---|
| 74 | l_ring1_joint | revolute (mimic) | l_hand_link | l_ring1_link |
| 75 | l_ring_joint | revolute | l_ring1_link | l_ring2_link |
| 76 | l_ring3_joint | revolute (mimic) | l_ring2_link | l_ring3_link |
| 77 | l_ring4_joint | revolute (mimic) | l_ring3_link | l_ring4_link |

#### Pinky (4 joints)
| # | Joint Name | Type | Parent Link | Child Link |
|---|---|---|---|---|
| 78 | l_pinky1_joint | revolute (mimic) | l_hand_link | l_pinky1_link |
| 79 | l_pinky_joint | revolute | l_pinky1_link | l_pinky2_link |
| 80 | l_pinky3_joint | revolute (mimic) | l_pinky2_link | l_pinky3_link |
| 81 | l_pinky4_joint | revolute (mimic) | l_pinky3_link | l_pinky4_link |

#### Left Hand Covers (8 joints)
| # | Joint Name | Type | Parent Link | Child Link |
|---|---|---|---|---|
| 82 | l_handcover_joint | fixed | l_hand_link | l_handcover_link |
| 83 | l_cover_handpinky_joint | fixed | l_pinky1_link | l_cover_handpinky_link |
| 84 | l_cover_handring_joint | fixed | l_ring1_link | l_cover_handring_link |
| 85 | l_cover_middle_joint | fixed | l_middle1_link | l_cover_middle_link |
| 86 | l_cover_thumb_joint | fixed | l_thumb1_link | l_cover_thumb_link |
| 87 | l_cover_index_joint | fixed | l_index1_link | l_cover_index_link |
| 88 | l_cover_ring_joint | fixed | l_ring2_link | l_cover_ring_link |
| 89 | l_cover_pinky_joint | fixed | l_pinky2_link | l_cover_pinky_link |

---

## Joint Type Breakdown

### By Type:
- **Revolute Joints**: 53
  - Main body: 19 (head roll/tilt, torso pan/roll, head pan, jaw, eyes tilt/pan)
  - Right arm: 8 (shoulder out/lift, upper arm roll, elbow flex, wrist roll)
  - Left arm: 8 (shoulder out/lift, upper arm roll, elbow flex, wrist roll)
  - Right hand: 13 (thumb, index, middle, ring, pinky - with mimics)
  - Left hand: 13 (thumb, index, middle, ring, pinky - with mimics)
  - Eyes camera/iris: 6 (3 for each eye)

- **Fixed Joints**: 36
  - Base connections: 2
  - Torso: 5
  - Head structures: 5
  - Right hand covers: 8
  - Left hand covers: 8
  - Other optical/structural: 8

### Mimic Joints (Joint Coupling):
These joints follow other joints' motion automatically:
- `l_eye_pan_joint` mimics `eyes_pan_joint` (1:1 ratio)
- `r_thumb1_joint` mimics `r_thumb_joint` (0.75x multiplier)
- `r_thumb3_joint` mimics `r_thumb_joint` (1:1 ratio)
- `r_index1_joint` mimics `r_index_joint` (1:1 ratio)
- `r_index3_joint` mimics `r_index_joint` (1:1 ratio)
- `r_middle1_joint` mimics `r_middle_joint` (1:1 ratio)
- `r_middle3_joint` mimics `r_middle_joint` (1:1 ratio)
- `r_ring1_joint` mimics `r_ring_joint` (-0.1x multiplier)
- `r_ring3_joint` mimics `r_ring_joint` (1:1 ratio)
- `r_ring4_joint` mimics `r_ring_joint` (1:1 ratio)
- `r_pinky1_joint` mimics `r_pinky_joint` (-0.1x multiplier)
- `r_pinky3_joint` mimics `r_pinky_joint` (1:1 ratio)
- `r_pinky4_joint` mimics `r_pinky_joint` (1:1 ratio)
- `l_thumb1_joint` mimics `l_thumb_joint` (0.75x multiplier)
- `l_thumb3_joint` mimics `l_thumb_joint` (1:1 ratio)
- `l_index1_joint` mimics `l_index_joint` (1:1 ratio)
- `l_index3_joint` mimics `l_index_joint` (1:1 ratio)
- `l_middle1_joint` mimics `l_middle_joint` (1:1 ratio)
- `l_middle3_joint` mimics `l_middle_joint` (1:1 ratio)
- `l_ring1_joint` mimics `l_ring_joint` (-0.1x multiplier)
- `l_ring3_joint` mimics `l_ring_joint` (1:1 ratio)
- `l_ring4_joint` mimics `l_ring_joint` (1:1 ratio)
- `l_pinky1_joint` mimics `l_pinky_joint` (-0.1x multiplier)
- `l_pinky3_joint` mimics `l_pinky_joint` (1:1 ratio)
- `l_pinky4_joint` mimics `l_pinky_joint` (1:1 ratio)

---

## Key Observations

1. **Hand Complexity**: Each hand has 24 joints (17 revolute + 8 fixed for covers)
   - 3 thumb joints
   - 3 index joints
   - 3 middle joints
   - 4 ring joints
   - 4 pinky joints
   - 8 cover/visual joints

2. **Arm Structure**: Each arm has 5 revolute joints + 1 fixed
   - Shoulder out
   - Shoulder lift
   - Upper arm roll
   - Elbow flex
   - Wrist roll
   - Bicep cover (fixed)

3. **Head**: 5 revolute joints (roll, tilt, pan, jaw, eyes tilt/pan), 6 fixed (ears, skull, eye cameras/iris)

4. **Torso**: 2 revolute (pan, roll), 5 fixed (disk, chest, kinect optical frames)

5. **Mimic Joints**: 26 joints use mimic constraints (mostly fingers for natural grasping)

---

## Comparison Note

**Ubuntu Total: 89 joints**
**Windows Version: 87 joints**
**Difference: 2 joints**

The 87-joint Windows version likely excludes some cover/visual joints or may use a simplified finger structure.

