# InMoov Robot - Complete Kinematics Analysis

**Source Files:** 
- Main URDF: `robot/inmoov_ros-master/inmoov_description/robots/inmoov.urdf.xacro`
- Assembly files in: `robot/inmoov_ros-master/inmoov_description/urdf/`

**Analysis Date:** April 10, 2026

---

## SUMMARY STATISTICS

- **Total Links:** 90
- **Total Joints:** 62
  - **Revolute Joints:** 26
  - **Fixed Joints:** 36
- **DOF (Degrees of Freedom):** 26 (only counting active revolute joints)

---

## KINEMATIC CHAIN HIERARCHY

### 1. BASE & TORSO STRUCTURE

#### Links (10):
1. `world` - World reference frame
2. `base_link` - Robot base (cylinder: ∅0.26m, h=0.11m)
3. `pedestal_link` - Pedestal support (cylinder: ∅0.0254m, h=0.94m)
4. `mid_stomach_link` - Mid-torso section
5. `disk_link` - Rotational disk component
6. `top_stomach_link` - Upper torso section
7. `torso_link` - Main torso frame
8. `kinect2_link` - Kinect depth camera
9. `kinect2_ir_optical_frame` - IR optical reference
10. `kinect2_rgb_optical_frame` - RGB optical reference
11. `chestplate_link` - Chest cover plate

#### Joints (11):

| # | Joint Name | Type | Parent Link | Child Link | Axis | Effort | Velocity |
|----|-----------|------|-------------|-----------|------|--------|----------|
| 1 | `fixed` | FIXED | world | base_link | N/A | N/A | N/A |
| 2 | `base_to_pedestal_link` | FIXED | base_link | pedestal_link | N/A | 1000.0 N·m | N/A |
| 3 | `pedestal_to_mid_stomach_joint` | FIXED | pedestal_link | mid_stomach_link | N/A | N/A | N/A |
| 4 | `waist_pan_joint` | REVOLUTE | mid_stomach_link | top_stomach_link | Z (0,0,1) | 1000.0 N·m | var(radians/s) |
| 5 | `disk_joint` | FIXED | top_stomach_link | disk_link | N/A | N/A | N/A |
| 6 | `waist_roll_joint` | REVOLUTE | top_stomach_link | torso_link | X (1,0,0) | 1000.0 N·m | var(radians/s) |
| 7 | `chestplate_joint` | FIXED | torso_link | chestplate_link | N/A | N/A | N/A |
| 8 | `kinect2_joint` | FIXED | torso_link | kinect2_link | N/A | N/A | N/A |
| 9 | `kinect2_ir_optical_frame_joint` | FIXED | torso_link | kinect2_ir_optical_frame | N/A | N/A | N/A |
| 10 | `kinect2_rgb_optical_joint` | FIXED | torso_link | kinect2_rgb_optical_frame | N/A | N/A | N/A |

---

### 2. HEAD STRUCTURE

#### Links (11):
1. `head_tilt_link` - Head tilt frame (virtual link)
2. `head_base_link` - Head base structural frame
3. `head_link` - Main head structure
4. `jaw_link` - Jaw actuator
5. `skull_link` - Skull cover
6. `left_ear_link` - Left ear cover
7. `right_ear_link` - Right ear cover
8. `face_link` - Face plate
9. `eyesupport_link` - Eye support frame
10. `eyes_center_link` - Central eye pivot (implicit in structure)

#### Joints (9):

| # | Joint Name | Type | Parent Link | Child Link | Axis | Effort | Notes |
|----|-----------|------|-------------|-----------|------|--------|-------|
| 11 | `head_roll_joint` | REVOLUTE | torso_link | head_tilt_link | X (1,0,0) | 1000.0 N·m | Roll around X |
| 12 | `head_tilt_joint` | REVOLUTE | head_tilt_link | head_base_link | Y (0,1,0) | 1000.0 N·m | Tilt around Y |
| 13 | `head_pan_joint` | REVOLUTE | head_base_link | head_link | Z (0,0,1) | 1000.0 N·m | Pan rotation Z |
| 14 | `jaw_joint` | REVOLUTE | head_link | jaw_link | Y (0,1,0) | 1000.0 N·m | Jaw opening |
| 15 | `skull_joint` | FIXED | head_link | skull_link | N/A | N/A | Static cover |
| 16 | `left_ear_joint` | FIXED | head_link | left_ear_link | N/A | N/A | Static cover |
| 17 | `right_ear_joint` | FIXED | head_link | right_ear_link | N/A | N/A | Static cover |
| 18 | `face_joint` | FIXED | skull_link | face_link | N/A | N/A | Face plate |
| 19 | `eyes_tilt_joint` | REVOLUTE | face_link | eyesupport_link | Y (0,1,0) | 1000.0 N·m | Eyes tilt up/down |

---

### 3. EYE STRUCTURE (Left & Right)

#### Links per Eye (8 pairs = 16 total):
**Right Eye:**
- `r_eyesupport_link`
- `r_camera_link`
- `r_eye_link`
- `r_iris_link`

**Left Eye:**
- `l_eyesupport_link`
- `l_camera_link`
- `l_eye_link`
- `l_iris_link`

#### Joints per Eye (6 pairs = 12 total):

| # | Joint Name | Type | Parent Link | Child Link | Axis | Notes |
|----|-----------|------|-------------|-----------|------|-------|
| 20 | `eyes_pan_joint` | REVOLUTE | eyesupport_link | r_eyesupport_link | Z (0,0,1) | Right eye pan |
| 21 | `r_camera_joint` | FIXED | r_eyesupport_link | r_camera_link | N/A | Camera mount |
| 22 | `r_eye_joint` | FIXED | r_eyesupport_link | r_eye_link | N/A | Eyeball static |
| 23 | `r_iris_joint` | FIXED | r_eyesupport_link | r_iris_link | N/A | Iris static |
| 24 | `l_eye_pan_joint` | REVOLUTE | eyesupport_link | l_eyesupport_link | Z (0,0,1) | Left eye pan (mimic r) |
| 25 | `l_camera_joint` | FIXED | l_eyesupport_link | l_camera_link | N/A | Camera mount |
| 26 | `l_eye_joint` | FIXED | l_eyesupport_link | l_eye_link | N/A | Eyeball static |
| 27 | `l_iris_joint` | FIXED | l_eyesupport_link | l_iris_link | N/A | Iris static |

---

### 4. RIGHT ARM STRUCTURE

#### Links (20):
- Shoulder: `r_shoulder_base_link`, `r_shoulder_link`
- Arm: `r_bicep_link`, `r_bicepcover_link`, `r_forearm_link`
- Hand: `r_hand_link`
- Hand Digits:
  - Thumb: `r_thumb1_link`, `r_thumb2_link`, `r_thumb3_link`
  - Index: `r_index1_link`, `r_index2_link`, `r_index3_link`
  - Middle: `r_middle1_link`, `r_middle2_link`, `r_middle3_link`
  - Ring: `r_ring1_link`, `r_ring2_link`, `r_ring3_link`, `r_ring4_link`
  - Pinky: `r_pinky1_link`, `r_pinky2_link`, `r_pinky3_link`, `r_pinky4_link`
- Covers: `r_handcover_link`, `r_cover_handpinky_link`, `r_cover_handring_link`, `r_cover_middle_link`, `r_cover_thumb_link`, `r_cover_index_link`, `r_cover_ring_link`, `r_cover_pinky_link`

#### Joints (26):

| # | Joint Name | Type | Parent Link | Child Link | Axis | DOF | Notes |
|----|-----------|------|-------------|-----------|------|-----|-------|
| 28 | `r_shoulder_out_joint` | REVOLUTE | torso_link | r_shoulder_base_link | X (1,0,0) | YES | Shoulder lateral lift |
| 29 | `r_shoulder_lift_joint` | REVOLUTE | r_shoulder_base_link | r_shoulder_link | Y (0,1,0) | YES | Shoulder forward lift |
| 30 | `r_upper_arm_roll_joint` | REVOLUTE | r_shoulder_link | r_bicep_link | Z (0,0,1) | YES | Upper arm roll |
| 31 | `r_elbow_flex_joint` | REVOLUTE | r_bicep_link | r_forearm_link | Y (0,1,0) | YES | Elbow flexion |
| 32 | `r_bicepcover_joint` | FIXED | r_bicep_link | r_bicepcover_link | N/A | NO | Cover attachment |
| 33 | `r_wrist_roll_joint` | REVOLUTE | r_forearm_link | r_hand_link | Z (0,0,1) | YES | Wrist roll |
| 34 | `r_thumb1_joint` | REVOLUTE | r_hand_link | r_thumb1_link | Z (0,0,1) | YES | Thumb abduction |
| 35 | `r_thumb_joint` | REVOLUTE | r_thumb1_link | r_thumb2_link | Y (0,1,0) | YES | Thumb 1st flex |
| 36 | `r_thumb3_joint` | REVOLUTE | r_thumb2_link | r_thumb3_link | Y (0,1,0) | YES | Thumb 2nd flex (mimic) |
| 37 | `r_index1_joint` | REVOLUTE | r_hand_link | r_index1_link | Y (0,1,0) | YES | Index proximal (mimic) |
| 38 | `r_index_joint` | REVOLUTE | r_index1_link | r_index2_link | Y (0,1,0) | YES | Index PIP |
| 39 | `r_index3_joint` | REVOLUTE | r_index2_link | r_index3_link | Y (0,1,0) | YES | Index DIP (mimic) |
| 40 | `r_middle1_joint` | REVOLUTE | r_hand_link | r_middle1_link | Y (0,1,0) | YES | Middle proximal (mimic) |
| 41 | `r_middle_joint` | REVOLUTE | r_middle1_link | r_middle2_link | Y (0,1,0) | YES | Middle PIP |
| 42 | `r_middle3_joint` | REVOLUTE | r_middle2_link | r_middle3_link | Y (0,1,0) | YES | Middle DIP (mimic) |
| 43 | `r_ring1_joint` | REVOLUTE | r_hand_link | r_ring1_link | Z (0,0,1) | YES | Ring abduction |
| 44 | `r_ring_joint` | REVOLUTE | r_ring1_link | r_ring2_link | Y (0,1,0) | YES | Ring PIP |
| 45 | `r_ring3_joint` | REVOLUTE | r_ring2_link | r_ring3_link | Y (0,1,0) | YES | Ring DIP (mimic) |
| 46 | `r_ring4_joint` | REVOLUTE | r_ring3_link | r_ring4_link | Y (0,1,0) | YES | Ring final (mimic) |
| 47 | `r_pinky1_joint` | REVOLUTE | r_hand_link | r_pinky1_link | Z (0,0,1) | YES | Pinky abduction |
| 48 | `r_pinky_joint` | REVOLUTE | r_pinky1_link | r_pinky2_link | Y (0,1,0) | YES | Pinky PIP |
| 49 | `r_pinky3_joint` | REVOLUTE | r_pinky2_link | r_pinky3_link | Y (0,1,0) | YES | Pinky DIP (mimic) |
| 50 | `r_pinky4_joint` | REVOLUTE | r_pinky3_link | r_pinky4_link | Y (0,1,0) | YES | Pinky final (mimic) |
| 51 | `r_handcover_joint` | FIXED | r_hand_link | r_handcover_link | N/A | NO | Hand cover |
| 52 | `r_cover_handpinky_joint` | FIXED | r_pinky1_link | r_cover_handpinky_link | N/A | NO | Pinky cover |
| 53 | `r_cover_handring_joint` | FIXED | r_ring1_link | r_cover_handring_link | N/A | NO | Ring cover |
| 54 | `r_cover_middle_joint` | FIXED | r_middle1_link | r_cover_middle_link | N/A | NO | Middle cover |
| 55 | `r_cover_thumb_joint` | FIXED | r_thumb1_link | r_cover_thumb_link | N/A | NO | Thumb cover |
| 56 | `r_cover_index_joint` | FIXED | r_index1_link | r_cover_index_link | N/A | NO | Index cover |
| 57 | `r_cover_ring_joint` | FIXED | r_ring2_link | r_cover_ring_link | N/A | NO | Ring cover |
| 58 | `r_cover_pinky_joint` | FIXED | r_pinky2_link | r_cover_pinky_link | N/A | NO | Pinky cover |

---

### 5. LEFT ARM STRUCTURE

#### Links (20):
Identical structure to right arm with `l_` prefix:
- Shoulder: `l_shoulder_base_link`, `l_shoulder_link`
- Arm: `l_bicep_link`, `l_bicepcover_link`, `l_forearm_link`
- Hand: `l_hand_link`
- All digit links with `l_` prefix
- All cover links with `l_cover_` prefix

#### Joints (26):

| # | Joint Name | Type | Parent Link | Child Link | Axis | DOF | Notes |
|----|-----------|------|-------------|-----------|------|-----|-------|
| 59 | `l_shoulder_out_joint` | REVOLUTE | torso_link | l_shoulder_base_link | X (1,0,0) | YES | Shoulder lateral lift |
| 60 | `l_shoulder_lift_joint` | REVOLUTE | l_shoulder_base_link | l_shoulder_link | Y (0,1,0) | YES | Shoulder forward lift |
| 61 | `l_upper_arm_roll_joint` | REVOLUTE | l_shoulder_link | l_bicep_link | Z (0,0,1) | YES | Upper arm roll |
| 62 | `l_elbow_flex_joint` | REVOLUTE | l_bicep_link | l_forearm_link | Y (0,1,0) | YES | Elbow flexion |
| 63 | `l_bicepcover_joint` | FIXED | l_bicep_link | l_bicepcover_link | N/A | NO | Cover attachment |
| 64 | `l_wrist_roll_joint` | REVOLUTE | l_forearm_link | l_hand_link | Z (0,0,1) | YES | Wrist roll |
| 65 | `l_thumb1_joint` | REVOLUTE | l_hand_link | l_thumb1_link | Z (0,0,1) | YES | Thumb abduction |
| 66 | `l_thumb_joint` | REVOLUTE | l_thumb1_link | l_thumb2_link | Y (0,1,0) | YES | Thumb 1st flex |
| 67 | `l_thumb3_joint` | REVOLUTE | l_thumb2_link | l_thumb3_link | Y (0,1,0) | YES | Thumb 2nd flex (mimic) |
| 68 | `l_index1_joint` | REVOLUTE | l_hand_link | l_index1_link | Y (0,1,0) | YES | Index proximal (mimic) |
| 69 | `l_index_joint` | REVOLUTE | l_index1_link | l_index2_link | Y (0,1,0) | YES | Index PIP |
| 70 | `l_index3_joint` | REVOLUTE | l_index2_link | l_index3_link | Y (0,1,0) | YES | Index DIP (mimic) |
| 71 | `l_middle1_joint` | REVOLUTE | l_hand_link | l_middle1_link | Y (0,1,0) | YES | Middle proximal (mimic) |
| 72 | `l_middle_joint` | REVOLUTE | l_middle1_link | l_middle2_link | Y (0,1,0) | YES | Middle PIP |
| 73 | `l_middle3_joint` | REVOLUTE | l_middle2_link | l_middle3_link | Y (0,1,0) | YES | Middle DIP (mimic) |
| 74 | `l_ring1_joint` | REVOLUTE | l_hand_link | l_ring1_link | Z (0,0,1) | YES | Ring abduction |
| 75 | `l_ring_joint` | REVOLUTE | l_ring1_link | l_ring2_link | Y (0,1,0) | YES | Ring PIP |
| 76 | `l_ring3_joint` | REVOLUTE | l_ring2_link | l_ring3_link | Y (0,1,0) | YES | Ring DIP (mimic) |
| 77 | `l_ring4_joint` | REVOLUTE | l_ring3_link | l_ring4_link | Y (0,1,0) | YES | Ring final (mimic) |
| 78 | `l_pinky1_joint` | REVOLUTE | l_hand_link | l_pinky1_link | Z (0,0,1) | YES | Pinky abduction |
| 79 | `l_pinky_joint` | REVOLUTE | l_pinky1_link | l_pinky2_link | Y (0,1,0) | YES | Pinky PIP |
| 80 | `l_pinky3_joint` | REVOLUTE | l_pinky2_link | l_pinky3_link | Y (0,1,0) | YES | Pinky DIP (mimic) |
| 81 | `l_pinky4_joint` | REVOLUTE | l_pinky3_link | l_pinky4_link | Y (0,1,0) | YES | Pinky final (mimic) |
| 82 | `l_handcover_joint` | FIXED | l_hand_link | l_handcover_link | N/A | NO | Hand cover |
| 83 | `l_cover_handpinky_joint` | FIXED | l_pinky1_link | l_cover_handpinky_link | N/A | NO | Pinky cover |
| 84 | `l_cover_handring_joint` | FIXED | l_ring1_link | l_cover_handring_link | N/A | NO | Ring cover |
| 85 | `l_cover_middle_joint` | FIXED | l_middle1_link | l_cover_middle_link | N/A | NO | Middle cover |
| 86 | `l_cover_thumb_joint` | FIXED | l_thumb1_link | l_cover_thumb_link | N/A | NO | Thumb cover |
| 87 | `l_cover_index_joint` | FIXED | l_index1_link | l_cover_index_link | N/A | NO | Index cover |
| 88 | `l_cover_ring_joint` | FIXED | l_ring2_link | l_cover_ring_link | N/A | NO | Ring cover |
| 89 | `l_cover_pinky_joint` | FIXED | l_pinky2_link | l_cover_pinky_link | N/A | NO | Pinky cover |

---

## COMPLETE JOINT LIST (SEQUENTIAL)

### All 62 Joints by Declaration Order:

1. **fixed** (FIXED) - world → base_link
2. **base_to_pedestal_link** (FIXED) - base_link → pedestal_link
3. **pedestal_to_mid_stomach_joint** (FIXED) - pedestal_link → mid_stomach_link
4. **waist_pan_joint** (REVOLUTE) - mid_stomach_link → top_stomach_link | Z-axis
5. **disk_joint** (FIXED) - top_stomach_link → disk_link
6. **waist_roll_joint** (REVOLUTE) - top_stomach_link → torso_link | X-axis
7. **chestplate_joint** (FIXED) - torso_link → chestplate_link
8. **kinect2_joint** (FIXED) - torso_link → kinect2_link
9. **kinect2_ir_optical_frame_joint** (FIXED) - torso_link → kinect2_ir_optical_frame
10. **kinect2_rgb_optical_joint** (FIXED) - torso_link → kinect2_rgb_optical_frame
11. **head_roll_joint** (REVOLUTE) - torso_link → head_tilt_link | X-axis
12. **head_tilt_joint** (REVOLUTE) - head_tilt_link → head_base_link | Y-axis
13. **head_pan_joint** (REVOLUTE) - head_base_link → head_link | Z-axis
14. **jaw_joint** (REVOLUTE) - head_link → jaw_link | Y-axis
15. **skull_joint** (FIXED) - head_link → skull_link
16. **left_ear_joint** (FIXED) - head_link → left_ear_link
17. **right_ear_joint** (FIXED) - head_link → right_ear_link
18. **face_joint** (FIXED) - skull_link → face_link
19. **eyes_tilt_joint** (REVOLUTE) - face_link → eyesupport_link | Y-axis
20. **eyes_pan_joint** (REVOLUTE) - eyesupport_link → r_eyesupport_link | Z-axis
21. **r_camera_joint** (FIXED) - r_eyesupport_link → r_camera_link
22. **r_eye_joint** (FIXED) - r_eyesupport_link → r_eye_link
23. **r_iris_joint** (FIXED) - r_eyesupport_link → r_iris_link
24. **l_eye_pan_joint** (REVOLUTE) - eyesupport_link → l_eyesupport_link | Z-axis | MIMIC: eyes_pan_joint
25. **l_camera_joint** (FIXED) - l_eyesupport_link → l_camera_link
26. **l_eye_joint** (FIXED) - l_eyesupport_link → l_eye_link
27. **l_iris_joint** (FIXED) - l_eyesupport_link → l_iris_link
28. **r_shoulder_out_joint** (REVOLUTE) - torso_link → r_shoulder_base_link | X-axis
29. **r_shoulder_lift_joint** (REVOLUTE) - r_shoulder_base_link → r_shoulder_link | Y-axis
30. **r_upper_arm_roll_joint** (REVOLUTE) - r_shoulder_link → r_bicep_link | Z-axis
31. **r_elbow_flex_joint** (REVOLUTE) - r_bicep_link → r_forearm_link | Y-axis
32. **r_bicepcover_joint** (FIXED) - r_bicep_link → r_bicepcover_link
33. **r_wrist_roll_joint** (REVOLUTE) - r_forearm_link → r_hand_link | Z-axis
34. **r_thumb1_joint** (REVOLUTE) - r_hand_link → r_thumb1_link | Z-axis | MIMIC: r_thumb_joint
35. **r_thumb_joint** (REVOLUTE) - r_thumb1_link → r_thumb2_link | Y-axis
36. **r_thumb3_joint** (REVOLUTE) - r_thumb2_link → r_thumb3_link | Y-axis | MIMIC: r_thumb_joint
37. **r_index1_joint** (REVOLUTE) - r_hand_link → r_index1_link | Y-axis | MIMIC: r_index_joint
38. **r_index_joint** (REVOLUTE) - r_index1_link → r_index2_link | Y-axis
39. **r_index3_joint** (REVOLUTE) - r_index2_link → r_index3_link | Y-axis | MIMIC: r_index_joint
40. **r_middle1_joint** (REVOLUTE) - r_hand_link → r_middle1_link | Y-axis | MIMIC: r_middle_joint
41. **r_middle_joint** (REVOLUTE) - r_middle1_link → r_middle2_link | Y-axis
42. **r_middle3_joint** (REVOLUTE) - r_middle2_link → r_middle3_link | Y-axis | MIMIC: r_middle_joint
43. **r_ring1_joint** (REVOLUTE) - r_hand_link → r_ring1_link | Z-axis | MIMIC: r_ring_joint
44. **r_ring_joint** (REVOLUTE) - r_ring1_link → r_ring2_link | Y-axis
45. **r_ring3_joint** (REVOLUTE) - r_ring2_link → r_ring3_link | Y-axis | MIMIC: r_ring_joint
46. **r_ring4_joint** (REVOLUTE) - r_ring3_link → r_ring4_link | Y-axis | MIMIC: r_ring_joint
47. **r_pinky1_joint** (REVOLUTE) - r_hand_link → r_pinky1_link | Z-axis | MIMIC: r_pinky_joint
48. **r_pinky_joint** (REVOLUTE) - r_pinky1_link → r_pinky2_link | Y-axis
49. **r_pinky3_joint** (REVOLUTE) - r_pinky2_link → r_pinky3_link | Y-axis | MIMIC: r_pinky_joint
50. **r_pinky4_joint** (REVOLUTE) - r_pinky3_link → r_pinky4_link | Y-axis | MIMIC: r_pinky_joint
51. **r_handcover_joint** (FIXED) - r_hand_link → r_handcover_link
52. **r_cover_handpinky_joint** (FIXED) - r_pinky1_link → r_cover_handpinky_link
53. **r_cover_handring_joint** (FIXED) - r_ring1_link → r_cover_handring_link
54. **r_cover_middle_joint** (FIXED) - r_middle1_link → r_cover_middle_link
55. **r_cover_thumb_joint** (FIXED) - r_thumb1_link → r_cover_thumb_link
56. **r_cover_index_joint** (FIXED) - r_index1_link → r_cover_index_link
57. **r_cover_ring_joint** (FIXED) - r_ring2_link → r_cover_ring_link
58. **r_cover_pinky_joint** (FIXED) - r_pinky2_link → r_cover_pinky_link
59. **l_shoulder_out_joint** (REVOLUTE) - torso_link → l_shoulder_base_link | X-axis
60. **l_shoulder_lift_joint** (REVOLUTE) - l_shoulder_base_link → l_shoulder_link | Y-axis
61. **l_upper_arm_roll_joint** (REVOLUTE) - l_shoulder_link → l_bicep_link | Z-axis
62. **l_elbow_flex_joint** (REVOLUTE) - l_bicep_link → l_forearm_link | Y-axis
63. **l_bicepcover_joint** (FIXED) - l_bicep_link → l_bicepcover_link
64. **l_wrist_roll_joint** (REVOLUTE) - l_forearm_link → l_hand_link | Z-axis
65. **l_thumb1_joint** (REVOLUTE) - l_hand_link → l_thumb1_link | Z-axis | MIMIC: l_thumb_joint
66. **l_thumb_joint** (REVOLUTE) - l_thumb1_link → l_thumb2_link | Y-axis
67. **l_thumb3_joint** (REVOLUTE) - l_thumb2_link → l_thumb3_link | Y-axis | MIMIC: l_thumb_joint
68. **l_index1_joint** (REVOLUTE) - l_hand_link → l_index1_link | Y-axis | MIMIC: l_index_joint
69. **l_index_joint** (REVOLUTE) - l_index1_link → l_index2_link | Y-axis
70. **l_index3_joint** (REVOLUTE) - l_index2_link → l_index3_link | Y-axis | MIMIC: l_index_joint
71. **l_middle1_joint** (REVOLUTE) - l_hand_link → l_middle1_link | Y-axis | MIMIC: l_middle_joint
72. **l_middle_joint** (REVOLUTE) - l_middle1_link → l_middle2_link | Y-axis
73. **l_middle3_joint** (REVOLUTE) - l_middle2_link → l_middle3_link | Y-axis | MIMIC: l_middle_joint
74. **l_ring1_joint** (REVOLUTE) - l_hand_link → l_ring1_link | Z-axis | MIMIC: l_ring_joint
75. **l_ring_joint** (REVOLUTE) - l_ring1_link → l_ring2_link | Y-axis
76. **l_ring3_joint** (REVOLUTE) - l_ring2_link → l_ring3_link | Y-axis | MIMIC: l_ring_joint
77. **l_ring4_joint** (REVOLUTE) - l_ring3_link → l_ring4_link | Y-axis | MIMIC: l_ring_joint
78. **l_pinky1_joint** (REVOLUTE) - l_hand_link → l_pinky1_link | Z-axis | MIMIC: l_pinky_joint
79. **l_pinky_joint** (REVOLUTE) - l_pinky1_link → l_pinky2_link | Y-axis
80. **l_pinky3_joint** (REVOLUTE) - l_pinky2_link → l_pinky3_link | Y-axis | MIMIC: l_pinky_joint
81. **l_pinky4_joint** (REVOLUTE) - l_pinky3_link → l_pinky4_link | Y-axis | MIMIC: l_pinky_joint
82. **l_handcover_joint** (FIXED) - l_hand_link → l_handcover_link
83. **l_cover_handpinky_joint** (FIXED) - l_pinky1_link → l_cover_handpinky_link
84. **l_cover_handring_joint** (FIXED) - l_ring1_link → l_cover_handring_link
85. **l_cover_middle_joint** (FIXED) - l_middle1_link → l_cover_middle_link
86. **l_cover_thumb_joint** (FIXED) - l_thumb1_link → l_cover_thumb_link
87. **l_cover_index_joint** (FIXED) - l_index1_link → l_cover_index_link
88. **l_cover_ring_joint** (FIXED) - l_ring2_link → l_cover_ring_link
89. **l_cover_pinky_joint** (FIXED) - l_pinky2_link → l_cover_pinky_link

---

## COMPLETE LINK LIST (SEQUENTIAL)

### All 90 Links by Declaration Order:

**Static/Base (2):**
1. `world`
2. `base_link`

**Pedestal/Torso (10):**
3. `pedestal_link`
4. `mid_stomach_link`
5. `disk_link`
6. `top_stomach_link`
7. `torso_link`
8. `kinect2_link`
9. `kinect2_ir_optical_frame`
10. `kinect2_rgb_optical_frame`
11. `chestplate_link`

**Head/Face (17):**
12. `head_tilt_link`
13. `head_base_link`
14. `head_link`
15. `jaw_link`
16. `skull_link`
17. `left_ear_link`
18. `right_ear_link`
19. `face_link`
20. `eyesupport_link`
21. `r_eyesupport_link`
22. `r_camera_link`
23. `r_eye_link`
24. `r_iris_link`
25. `l_eyesupport_link`
26. `l_camera_link`
27. `l_eye_link`
28. `l_iris_link`

**Right Arm/Hand (29):**
29. `r_shoulder_base_link`
30. `r_shoulder_link`
31. `r_bicep_link`
32. `r_bicepcover_link`
33. `r_forearm_link`
34. `r_hand_link`
35. `r_thumb1_link`
36. `r_thumb2_link`
37. `r_thumb3_link`
38. `r_index1_link`
39. `r_index2_link`
40. `r_index3_link`
41. `r_middle1_link`
42. `r_middle2_link`
43. `r_middle3_link`
44. `r_ring1_link`
45. `r_ring2_link`
46. `r_ring3_link`
47. `r_ring4_link`
48. `r_pinky1_link`
49. `r_pinky2_link`
50. `r_pinky3_link`
51. `r_pinky4_link`
52. `r_handcover_link`
53. `r_cover_handpinky_link`
54. `r_cover_handring_link`
55. `r_cover_middle_link`
56. `r_cover_thumb_link`
57. `r_cover_index_link`

**Right Arm Covers (Continued):**
58. `r_cover_ring_link`
59. `r_cover_pinky_link`

**Left Arm/Hand (29):**
60. `l_shoulder_base_link`
61. `l_shoulder_link`
62. `l_bicep_link`
63. `l_bicepcover_link`
64. `l_forearm_link`
65. `l_hand_link`
66. `l_thumb1_link`
67. `l_thumb2_link`
68. `l_thumb3_link`
69. `l_index1_link`
70. `l_index2_link`
71. `l_index3_link`
72. `l_middle1_link`
73. `l_middle2_link`
74. `l_middle3_link`
75. `l_ring1_link`
76. `l_ring2_link`
77. `l_ring3_link`
78. `l_ring4_link`
79. `l_pinky1_link`
80. `l_pinky2_link`
81. `l_pinky3_link`
82. `l_pinky4_link`
83. `l_handcover_link`
84. `l_cover_handpinky_link`
85. `l_cover_handring_link`
86. `l_cover_middle_link`
87. `l_cover_thumb_link`
88. `l_cover_index_link`
89. `l_cover_ring_link`
90. `l_cover_pinky_link`

---

## REVOLUTE JOINTS (ACTIVE DOF) - 26 Total

### Active Control Joints by Category:

**Torso (2):**
- `waist_pan_joint` (Z-axis rotation)
- `waist_roll_joint` (X-axis rotation)

**Head (3):**
- `head_roll_joint` (X-axis rotation)
- `head_tilt_joint` (Y-axis rotation)
- `head_pan_joint` (Z-axis rotation)

**Jaw (1):**
- `jaw_joint` (Y-axis rotation)

**Eyes (2):**
- `eyes_tilt_joint` (Y-axis rotation)
- `eyes_pan_joint` (Z-axis rotation)

**Right Arm (5):**
- `r_shoulder_out_joint` (X-axis)
- `r_shoulder_lift_joint` (Y-axis)
- `r_upper_arm_roll_joint` (Z-axis)
- `r_elbow_flex_joint` (Y-axis)
- `r_wrist_roll_joint` (Z-axis)

**Right Hand Fingers (10):**
- `r_thumb1_joint`, `r_thumb_joint`, `r_thumb3_joint`
- `r_index1_joint`, `r_index_joint`, `r_index3_joint`
- `r_middle1_joint`, `r_middle_joint`, `r_middle3_joint`
- `r_ring1_joint`, `r_ring_joint`, `r_ring3_joint`, `r_ring4_joint`
- `r_pinky1_joint`, `r_pinky_joint`, `r_pinky3_joint`, `r_pinky4_joint`

**Left Arm (5):**
- `l_shoulder_out_joint` (X-axis)
- `l_shoulder_lift_joint` (Y-axis)
- `l_upper_arm_roll_joint` (Z-axis)
- `l_elbow_flex_joint` (Y-axis)
- `l_wrist_roll_joint` (Z-axis)

**Left Hand Fingers (10):**
- `l_thumb1_joint`, `l_thumb_joint`, `l_thumb3_joint`
- `l_index1_joint`, `l_index_joint`, `l_index3_joint`
- `l_middle1_joint`, `l_middle_joint`, `l_middle3_joint`
- `l_ring1_joint`, `l_ring_joint`, `l_ring3_joint`, `l_ring4_joint`
- `l_pinky1_joint`, `l_pinky_joint`, `l_pinky3_joint`, `l_pinky4_joint`

---

## MIMIC JOINTS (Dependent Control)

Mimic joints use multipliers to drive coupled motion:

| Joint | Mimics | Multiplier | Purpose |
|-------|--------|-----------|---------|
| `l_eye_pan_joint` | `eyes_pan_joint` | 1.0 | Left eye follows right |
| `r_thumb3_joint` | `r_thumb_joint` | 1.0 | Thumb DIP follows PIP |
| `r_index1_joint` | `r_index_joint` | 1.0 | Index proximal follows PIP coordinate |
| `r_index3_joint` | `r_index_joint` | 1.0 | Index DIP follows PIP |
| `r_middle1_joint` | `r_middle_joint` | 1.0 | Middle proximal follows PIP |
| `r_middle3_joint` | `r_middle_joint` | 1.0 | Middle DIP follows PIP |
| `r_ring1_joint` | `r_ring_joint` | -0.1 | Ring abduction inverse relationship |
| `r_ring3_joint` | `r_ring_joint` | 1.0 | Ring DIP follows PIP |
| `r_ring4_joint` | `r_ring_joint` | 1.0 | Ring final follows PIP |
| `r_pinky1_joint` | `r_pinky_joint` | -0.1 | Pinky abduction inverse |
| `r_pinky3_joint` | `r_pinky_joint` | 1.0 | Pinky DIP follows PIP |
| `r_pinky4_joint` | `r_pinky_joint` | 1.0 | Pinky final follows PIP |
| *(Same pattern for left hand with `l_` prefix)* |

---

## KEY SPECIFICATIONS

### Joint Effort/Torque
- **All Active Revolute Joints:** 1000.0 N·m

### Fixed Sensor/Actuator Mounts
- Kinect 2 depth camera system (3 links: main + IR + RGB optical frames)
- Cameras in eye structures (left & right)
- Structure covers throughout body

### Hand Sophistication
- **5 Fingers × 2 Hands = 10 digit units**
- **Ring and Pinky share base joint** (with coupled control)
- **Thumb has 3 DOF** (abduction + 2 flex)
- **Index, Middle have 3 DOF each** (1 proximal + 1 PIP + 1 DIP via mimic)
- **Ring, Pinky have 4 DOF each** (1 abduction + 1 PIP + 2 additional via mimic)
- Total finger actuators per hand: ~12 controlled joints

---

## KINEMATIC CHAIN SUMMARY

### Open-Chain Depths:
- **Longest chain:** Base → Pedestal → Torso → Arm → Hand chain = 11-14 links deep
- **Head chain:** Base → Torso → Head (3 rotations) → Face → Eyes = 10 links deep
- **Arm chains:** Each arm has ~14-17 links including fingers

### End Effectors (4):
1. Right hand
2. Left hand
3. Head camera/gaze
4. Neck (head base)

---

Generated: April 10, 2026
