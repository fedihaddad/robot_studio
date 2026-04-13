# 3D Viewer - Camera & Interaction Guide

## **Quick Start**

The 3D viewer now has **5 preset camera angles** to see the robot from different perspectives!

---

## **Camera Control Buttons** (Left side of viewer)

### 1️⃣ **📍 Fit View**
- **Best for:** Seeing the whole robot  
- **Action:** Auto-centers and zooms to fit entire robot in view
- **Use when:** Robot goes off-screen or you get lost

### 2️⃣ **👁️ 3/4 View** (Isometric)
- **Best for:** Seeing arms and hands clearly  
- **Angle:** 45° angle showing front and side  
- **Use when:** Testing arm poses, moving hands

### 3️⃣ **👤 Front View**
- **Best for:** Face control, head movements  
- **Angle:** Straight front  
- **Use when:** Controlling head tilt, jaw, eyes

### 4️⃣ **↔️ Side View**  
- **Best for:** Arm extension, elbow bending  
- **Angle:** Pure side profile  
- **Use when:** Testing shoulder and arm joints

### 5️⃣ **⬇️ Top View**
- **Best for:** Overall body position  
- **Angle:** Looking down from above  
- **Use when:** Seeing torso rotation

---

## **Mouse Controls**

| Action | Result |
|--------|--------|
| **Left-click + drag** | Rotate camera around robot |
| **Scroll wheel** | Zoom in/out (now faster!) |
| **Right-click + drag** | Pan the view |

---

## **Moving the Robot Hands**

### **Finding the Hand Handles**
1. Click **👁️ 3/4 View** button first
2. Look for **blue and green circles** on the hands
3. Left hand = **blue circle**
4. Right hand = **green circle**

### **Dragging Hands**
1. Position mouse over hand circle
2. **Click + drag** the circle
3. Arm will move with your drag motion
4. Release to stop

### **If You Can't Find Hands:**
1. Click **Fit View** to reset
2. Use **Zoom** to zoom in on hand area
3. Try **Front View** to see hands from front angle
4. Look closer to center - hands are usually in middle

---

## **Best Views for Different Tasks**

### **Testing Arm Movement** 
✅ Use: **3/4 View**  
- Shows both arms clearly
- Hands visible for dragging
- Good shoulder visibility

### **Testing Head/Face Control**
✅ Use: **Front View**  
- Head centered
- Can see jaw opening
- Eyes visible

### **Testing Shoulder Rotation**
✅ Use: **Side View**  
- Shoulder rises/lowers clearly
- Arm swing visible
- Good for checking reach

### **Full Body Check**
✅ Use: **Top View**  
- See entire robot
- Torso rotation clear
- Overall symmetry check

---

## **Troubleshooting**

### **"I can't see the hands!"**  
**Solution:**
1. Click **Fit View** to reset
2. Click **3/4 View** for best hand visibility
3. Scroll to zoom in gradually if needed
4. Look for blue/green circles

### **"Camera is zoomed too far in!"**  
**Solution:**
1. Scroll wheel out (or scroll up on trackpad)
2. Click **Fit View** to auto-reset
3. Try another view angle

### **"Robot moved off-screen!"**  
**Solution:**  
Click **Fit View** button - instantly re-centers

### **"I can only see part of the robot!"**  
**Solution:**
1. Click **Fit View**
2. Then click **Top View** to see everything
3. Scroll to adjust zoom

---

## **Movement Tips**

### **For Testing Offline Mode:**
1. Click Quick Move Button
2. Switch to **3/4 View** to see arm move
3. Watch the hand joints rotate in real-time
4. Try different views to see full range

### **For Testing with ROS2:**
1. Start ROS2 on Ubuntu
2. Status changes to 🟢 Connected
3. Same camera controls apply
4. Real movements appear in 3D viewer

---

## **Advanced Tips**

**Smooth Rotation:** Drag slowly for smooth camera rotation  
**Fine Zoom:** Scroll small amounts for precise zoom  
**Hidden Areas:** If hand is behind body, rotate camera slightly  
**Camera Lock:** None - you can always rotate freely  

---

## **Performance Tips**

- If viewer lags, reduce zoom level (zoom out)
- Bright colors mean good lighting - hands are visible
- Shadows show depth - helps see hand position

---

**Try it now:** Click **👁️ 3/4 View** to see the hands immediately! 🙌
