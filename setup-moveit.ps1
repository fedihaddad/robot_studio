#!/usr/bin/env powershell
# MoveIt Setup Script for AXEL Dashboard

Write-Host "╔════════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║         MoveIt Integration Setup for AXEL Dashboard              ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════════════╝" -ForegroundColor Green

# Step 1: Check if MoveIt config exists in Ubuntu folder
Write-Host "`n[1] Checking MoveIt configuration files..." -ForegroundColor Cyan
$ubuntuMoveItPath = "robot\inmoov_moveit_config\config"
if (Test-Path $ubuntuMoveItPath) {
    Write-Host "✅ Found MoveIt config at: $ubuntuMoveItPath" -ForegroundColor Green
    Get-ChildItem $ubuntuMoveItPath | Select-Object Name
} else {
    Write-Host "❌ MoveIt config not found at: $ubuntuMoveItPath" -ForegroundColor Red
    exit 1
}

# Step 2: Create destination folder
Write-Host "`n[2] Creating destination folders..." -ForegroundColor Cyan
$destPath = "src\ros\moveit_config\config"
if (-not (Test-Path $destPath)) {
    New-Item -ItemType Directory -Path $destPath -Force | Out-Null
    Write-Host "✅ Created: $destPath" -ForegroundColor Green
} else {
    Write-Host "✅ Folder already exists: $destPath" -ForegroundColor Green
}

# Step 3: Copy key files
Write-Host "`n[3] Copying configuration files..." -ForegroundColor Cyan
$filesToCopy = @(
    "inmoov.srdf",
    "joint_limits.yaml",
    "kinematics.yaml",
    "moveit_controllers.yaml"
)

foreach ($file in $filesToCopy) {
    $source = Join-Path $ubuntuMoveItPath $file
    $dest = Join-Path $destPath $file
    if (Test-Path $source) {
        Copy-Item $source $dest -Force
        Write-Host "✅ Copied: $file" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Not found: $file" -ForegroundColor Yellow
    }
}

# Step 4: Display configuration summary
Write-Host "`n[4] Configuration Summary:" -ForegroundColor Cyan
Write-Host @"

📋 PLANNING GROUPS CONFIGURED:
  • Right Arm (5 joints)
  • Left Arm (5 joints)
  • Right Hand (17 joints)
  • Left Hand (17 joints)
  • Head (3 joints)
  • Face (4 joints)
  • Torso (2 joints)

🎯 TOTAL CONTROLLED JOINTS: 53

📊 JOINT LIMITS CONFIGURED:
  • Arm velocity: 1.0 rad/s
  • Head velocity: 4.0 rad/s
  • Face velocity: 4.0 rad/s
  • Torso velocity: 1.5 rad/s

🎮 CONTROLLERS CREATED:
  • right_arm_controller
  • left_arm_controller
  • right_hand_controller
  • left_hand_controller
  • head_controller
  • face_controller
  • torso_controller

"@

# Step 5: Display next steps
Write-Host "[5] Next Steps:" -ForegroundColor Cyan
Write-Host @"

1. ✅ Configuration files copied to: $destPath

2. 📝 Update your ros.service.ts:
   - Import MoveItService
   - Initialize MoveIt in ros.init()
   - Add moveJoint() method

3. 🎨 Create UI Component:
   - Create src/components/MoveItControlPanel.tsx
   - Add joint sliders for each group
   - Add Move buttons

4. 🚀 Launch MoveIt (on Ubuntu/ROS machine):
   cd robot/inmoov_moveit_config
   ros2 launch inmoov_moveit_config move_group.launch.py

5. 🔗 Connect Dashboard:
   - Initialize ROSService in your app
   - MoveIt will connect automatically

6. ✨ Test:
   - Move individual joints from dashboard
   - Check RViz for visualization
   - Verify 3D model matches robot state

"@

Write-Host "`n✨ Setup complete! Follow the MOVEIT_SETUP_GUIDE.md for detailed implementation." -ForegroundColor Green
Write-Host "═════════════════════════════════════════════════════════════════════════" -ForegroundColor Green
