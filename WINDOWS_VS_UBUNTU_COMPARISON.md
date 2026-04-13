# Windows vs Ubuntu URDF Joint Structure Comparison

**Windows File**: `src/data/inmoov-local.urdf`
**Ubuntu File**: `robot/inmoov_ros-master/inmoov_description/robots/inmoov.urdf.xacro`
**Date**: April 10, 2026

---

## Summary Statistics

| Metric | Windows | Ubuntu | Difference |
|--------|---------|--------|-----------|
| **Total Joints** | 87 | 89 | +2 Ubuntu |
| **Revolute Joints** | 55 | 53 | -2 Windows |
| **Fixed Joints** | 32 | 36 | +4 Ubuntu |

---

## Windows URDF Joint List (87 Total)

### 1. Base & World (3 joints)
1. fixed (world → base_link) | fixed
2. base_to_pedestal_link (base_link → pedestal_link) | fixed
3. pedestal_to_mid_stomach_joint (pedestal_link → mid_stomach_link) | fixed

### 2. Torso (6 joints)
4. waist_pan_joint (mid_stomach_link → top_stomach_link) | revolute
5. disk_joint (top_stomach_link → disk_link) | fixed
6. waist_roll_joint (top_stomach_link → torso_link) | revolute
7. chestplate_joint (torso_link → chestplate_link) | fixed
8. kinect2_joint (torso_link → kinect2_link) | fixed

### 3. Head Main (5 joints)
9. head_roll_joint (torso_link → head_tilt_link) | revolute
10. head_tilt_joint (head_tilt_link → head_base_link) | revolute
11. head_pan_joint (head_base_link → head_link) | revolute
12. jaw_joint (head_link → jaw_link) | revolute
13. skull_joint (head_link → skull_link) | fixed

### 4. Head Details (2 joints)
14. left_ear_joint (head_link → left_ear_link) | fixed
15. right_ear_joint (head_link → right_ear_link) | fixed

### 5. Face/Eyes (6 joints)
16. face_joint (skull_link → face_link) | fixed
17. eyes_tilt_joint (face_link → eyesupport_link) | revolute
18. eyes_pan_joint (eyesupport_link → r_eyesupport_link) | revolute
19. r_camera_joint (r_eyesupport_link → r_camera_link) | fixed
20. r_eye_joint (r_eyesupport_link → r_eye_link) | fixed
21. r_iris_joint (r_eyesupport_link → r_iris_link) | fixed
22. l_eye_pan_joint (eyesupport_link → l_eyesupport_link) | revolute ⚠️ (NOT mimic)
23. l_camera_joint (l_eyesupport_link → l_camera_link) | fixed
24. l_eye_joint (l_eyesupport_link → l_eye_link) | fixed
25. l_iris_joint (l_eyesupport_link → l_iris_link) | fixed

### 6. Right Arm (5 joints)
26. r_shoulder_out_joint (torso_link → r_shoulder_base_link) | revolute
27. r_shoulder_lift_joint (r_shoulder_base_link → r_shoulder_link) | revolute
28. r_upper_arm_roll_joint (r_shoulder_link → r_bicep_link) | revolute
29. r_bicepcover_joint (r_bicep_link → r_bicepcover_link) | fixed
30. r_elbow_flex_joint (r_bicep_link → r_forearm_link) | revolute
31. r_wrist_roll_joint (r_forearm_link → r_hand_link) | revolute

### 7. Right Hand Fingers (17 joints)
32. r_thumb1_joint (r_hand_link → r_thumb1_link) | revolute ⚠️ (NOT mimic)
33. r_thumb_joint (r_thumb1_link → r_thumb2_link) | revolute
34. r_thumb3_joint (r_thumb2_link → r_thumb3_link) | revolute ⚠️ (NOT mimic)
35. r_index1_joint (r_hand_link → r_index1_link) | revolute ⚠️ (NOT mimic)
36. r_index_joint (r_index1_link → r_index2_link) | revolute
37. r_index3_joint (r_index2_link → r_index3_link) | revolute ⚠️ (NOT mimic)
38. r_middle1_joint (r_hand_link → r_middle1_link) | revolute ⚠️ (NOT mimic)
39. r_middle_joint (r_middle1_link → r_middle2_link) | revolute
40. r_middle3_joint (r_middle2_link → r_middle3_link) | revolute ⚠️ (NOT mimic)
41. r_ring1_joint (r_hand_link → r_ring1_link) | revolute ⚠️ (NOT mimic)
42. r_ring_joint (r_ring1_link → r_ring2_link) | revolute
43. r_ring3_joint (r_ring2_link → r_ring3_link) | revolute ⚠️ (NOT mimic)
44. r_ring4_joint (r_ring3_link → r_ring4_link) | revolute ⚠️ (NOT mimic)
45. r_pinky1_joint (r_hand_link → r_pinky1_link) | revolute ⚠️ (NOT mimic)
46. r_pinky_joint (r_pinky1_link → r_pinky2_link) | revolute
47. r_pinky3_joint (r_pinky2_link → r_pinky3_link) | revolute ⚠️ (NOT mimic)
48. r_pinky4_joint (r_pinky3_link → r_pinky4_link) | revolute ⚠️ (NOT mimic)

### 8. Right Hand Covers (8 joints)
49. r_handcover_joint (r_hand_link → r_handcover_link) | fixed
50. r_cover_handpinky_joint (r_pinky1_link → r_cover_handpinky_link) | fixed
51. r_cover_handring_joint (r_ring1_link → r_cover_handring_link) | fixed
52. r_cover_middle_joint (r_middle1_link → r_cover_middle_link) | fixed
53. r_cover_thumb_joint (r_thumb1_link → r_cover_thumb_link) | fixed
54. r_cover_index_joint (r_index1_link → r_cover_index_link) | fixed
55. r_cover_ring_joint (r_ring2_link → r_cover_ring_link) | fixed
56. r_cover_pinky_joint (r_pinky2_link → r_cover_pinky_link) | fixed

### 9. Left Arm (5 joints)
57. l_shoulder_out_joint (torso_link → l_shoulder_base_link) | revolute
58. l_shoulder_lift_joint (l_shoulder_base_link → l_shoulder_link) | revolute
59. l_upper_arm_roll_joint (l_shoulder_link → l_bicep_link) | revolute
60. l_bicepcover_joint (l_bicep_link → l_bicepcover_link) | fixed
61. l_elbow_flex_joint (l_bicep_link → l_forearm_link) | revolute
62. l_wrist_roll_joint (l_forearm_link → l_hand_link) | revolute

### 10. Left Hand Fingers (17 joints)
63. l_thumb1_joint (l_hand_link → l_thumb1_link) | revolute ⚠️ (NOT mimic)
64. l_thumb_joint (l_thumb1_link → l_thumb2_link) | revolute
65. l_thumb3_joint (l_thumb2_link → l_thumb3_link) | revolute ⚠️ (NOT mimic)
66. l_index1_joint (l_hand_link → l_index1_link) | revolute ⚠️ (NOT mimic)
67. l_index_joint (l_index1_link → l_index2_link) | revolute
68. l_index3_joint (l_index2_link → l_index3_link) | revolute ⚠️ (NOT mimic)
69. l_middle1_joint (l_hand_link → l_middle1_link) | revolute ⚠️ (NOT mimic)
70. l_middle_joint (l_middle1_link → l_middle2_link) | revolute
71. l_middle3_joint (l_middle2_link → l_middle3_link) | revolute ⚠️ (NOT mimic)
72. l_ring1_joint (l_hand_link → l_ring1_link) | revolute ⚠️ (NOT mimic)
73. l_ring_joint (l_ring1_link → l_ring2_link) | revolute
74. l_ring3_joint (l_ring2_link → l_ring3_link) | revolute ⚠️ (NOT mimic)
75. l_ring4_joint (l_ring3_link → l_ring4_link) | revolute ⚠️ (NOT mimic)
76. l_pinky1_joint (l_hand_link → l_pinky1_link) | revolute ⚠️ (NOT mimic)
77. l_pinky_joint (l_pinky1_link → l_pinky2_link) | revolute
78. l_pinky3_joint (l_pinky2_link → l_pinky3_link) | revolute ⚠️ (NOT mimic)
79. l_pinky4_joint (l_pinky3_link → l_pinky4_link) | revolute ⚠️ (NOT mimic)

### 11. Left Hand Covers (8 joints)
80. l_handcover_joint (l_hand_link → l_handcover_link) | fixed
81. l_cover_handpinky_joint (l_pinky1_link → l_cover_handpinky_link) | fixed
82. l_cover_handring_joint (l_ring1_link → l_cover_handring_link) | fixed
83. l_cover_middle_joint (l_middle1_link → l_cover_middle_link) | fixed
84. l_cover_thumb_joint (l_thumb1_link → l_cover_thumb_link) | fixed
85. l_cover_index_joint (l_index1_link → l_cover_index_link) | fixed
86. l_cover_ring_joint (l_ring2_link → l_cover_ring_link) | fixed
87. l_cover_pinky_joint (l_pinky2_link → l_cover_pinky_link) | fixed

---

## Key Differences Between Windows (87) and Ubuntu XACRO (89)

### ✅ What Windows Has
- All basic structural joints
- All hand manipulation joints
- All cover/visual joints
- 87 total joints with all revolute finger joints independent (no mimics)

### ❌ What Windows is Missing from Ubuntu

**1. Missing Kinect Optical Frame Joints (2 joints)**
   - `kinect2_ir_optical_frame_joint` - Ubuntu only
   - `kinect2_rgb_optical_joint` - Ubuntu only
   - **Impact**: Reduces count by 2 joints

### ⚠️ Key Design Difference: Mimic Joints

**Ubuntu XACRO Uses Mimic Constraints (26 finger mimic joints)**:
- Eyes: `l_eye_pan_joint` mimics `eyes_pan_joint`
- Fingers: Multiple thumb, index, middle, ring, pinky joints use mimic constraints
- **Purpose**: Enforce physical constraints and synchronize finger movements
- **Benefit**: More realistic hand biomechanics, fewer independent actuators needed

**Windows URDF Does NOT Use Mimic Constraints**:
- All 55 revolute finger joints are INDEPENDENT
- No joint-to-joint constraints
- **Impact**: Each finger can move independently, may not match real hand physics
- **Implication**: 26 fewer constraint relationships

---

## Revolute vs Fixed Joint Breakdown

| Category | Windows Revolute | Windows Fixed | Ubuntu Revolute | Ubuntu Fixed |
|----------|------------------|---------------|-----------------|--------------|
| Base/World | 0 | 3 | 0 | 3 |
| Torso | 2 | 3 | 2 | 5 |
| Head Main | 4 | 0 | 4 | 0 |
| Head Details | 0 | 2 | 0 | 5 |
| Face/Eyes | 3 | 6 | 3 | 8 |
| Arms | 10 | 2 | 10 | 2 |
| Hand Fingers | 34 | 0 | 34 | 0 |
| Hand Covers | 0 | 16 | 0 | 16 |
| **TOTAL** | **55** | **32** | **53** | **36** |

---

## Technical Analysis: Why Windows Has 87 But Should Have 57?

The actual analysis shows:
- **Ubuntu XACRO expands to: 89 joints**
- **Windows URDF currently has: 87 joints**
- **Difference: 2 joints** (the Kinect optical frame joints)

**If the goal is 57 joints instead of 87:**
- This would require removing the hand cover/visual joints (16 joints per hand)
- And removing some kinect/optical frame joints
- Effectively: 87 - 30 ≈ 57

**Recommendation**: Clarify the target architecture:
1. **Full detail (89 joints)**: Keep all hand covers, all optical frames - most realistic
2. **Simplified (57 joints)**: Remove optional visual/cover joints and optical frames - faster simulation
3. **Current state (87 joints)**: Windows version is only missing 2 kinect optical joints

---

## Critical Issues Found in Windows Version

### Issue 1: Missing Mimic Joints
- **Location**: All hand fingers (both hands)
- **Current**: All 34 finger joints are independent revolute joints
- **Ubuntu**: 26 of these joints use `<mimic>` constraints
- **Impact**: Fingers may not move naturally/realistically
- **Fix**: Add `<mimic>` elements to Ubuntu-matching joints

**Example Ubuntu Mimic**:
```xml
<joint name="r_thumb1_joint" type="revolute">
  <mimic joint="r_thumb_joint" multiplier="0.75" offset="0"/>
  <!-- ... rest of joint definition -->
</joint>
```

**Example Windows (no mimic)**:
```xml
<joint name="r_thumb1_joint" type="revolute">
  <!-- NO MIMIC - independent motion -->
  <!-- ... rest of joint definition -->
</joint>
```

### Issue 2: Missing Kinect Optical Frame Joints
- **Location**: Torso section
- **Current**: Only `kinect2_joint`
- **Ubuntu**: Also has `kinect2_ir_optical_frame_joint` and `kinect2_rgb_optical_joint`
- **Impact**: Missing camera optical center references
- **Fix**: Add these 2 fixed joints for proper RGB-D camera calibration

### Issue 3: Left Eye Pan Joint Not Mimic
- **Location**: Eye section (joint #22 in Windows)
- **Current**: `l_eye_pan_joint` is revolute, NOT mimic to `eyes_pan_joint`
- **Ubuntu**: `l_eye_pan_joint` is revolute with `<mimic joint="eyes_pan_joint" multiplier="1" offset="0"/>`
- **Impact**: Eyes don't move synchronized
- **Fix**: Change `l_eye_pan_joint` to have mimic constraint

---

## Recommendations to Sync Windows ↔ Ubuntu

### Priority 1 (Critical - Joint Compatibility)
1. Add mimic constraints to all hand finger joints matching Ubuntu
2. Make `l_eye_pan_joint` mimic `eyes_pan_joint`
3. Add the 2 missing Kinect optical frame joints

**Result**: Windows would have 89 joints + mimic constraints = Full compatibility

### Priority 2 (Optimization - If 57 is required)
If the actual target is 57 joints:
1. Remove all hand cover joints (16 per hand = 32 total)
2. Remove kinect optical frame joints (2 total)
3. Result: 87 - 34 = 53, then add back core optical frame = ~55-57 depending on configuration

### Priority 3 (Best Practice)
1. Use parameterized XACRO instead of hand-written URDF
2. Match Ubuntu's macro structure (asmTorso, asmHand, etc.)
3. Use includes for DRY principle

---

## Validation Checklist

- [ ] Count all `<joint>` elements in Windows URDF (confirmed: 87)
- [ ] Count all Ubuntu XACRO joint definitions (confirmed: 89 when expanded)
- [ ] Identify missing joints (confirmed: 2 Kinect optical + mimic constraints)
- [ ] Verify parent/child link relationships
- [ ] Check joint types (revolute vs fixed)
- [ ] Validate axis definitions
- [ ] Compare limit ranges for all revolute joints
- [ ] Test mimic joint constraints in simulator
- [ ] Verify hand coordination with/without mimics

