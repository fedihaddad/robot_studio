# Dashboard Architecture & Extension Guide

## Component Hierarchy

```
App
├── Dashboard
│   ├── Header
│   ├── Main Content
│   │   ├── CameraFeed (MJPEG Stream Display)
│   │   └── ControlPanel (Quick Controls)
│   ├── Settings Panel (Optional)
│   └── StatusBar (Connection Status)
```

## Core Components

### 1. **CameraFeed.tsx**
Displays the MJPEG stream from your camera.

**Features:**
- Automatic stream loading from URL
- Live indicator
- Error handling
- Responsive sizing

**Usage:**
```tsx
<CameraFeed 
  url="http://localhost:8080/?action=stream" 
  enabled={true}
/>
```

### 2. **ControlPanel.tsx**
Quick access controls for ROS connection and camera settings.

**Features:**
- URL configuration
- Quick action buttons
- Helpful tips

**Extend with:**
- Robot command buttons
- Sensor data display
- Emergency stop
- Mode selection

### 3. **StatusBar.tsx**
Real-time connection status and diagnostics.

**Shows:**
- ROS connection state
- Camera status
- Error messages
- Current URLs

### 4. **Dashboard.tsx**
Main layout component orchestrating all sub-components.

**Handles:**
- State management
- Settings panel toggle
- Layout arrangement

## ROS Integration

### Using the ROSService

```typescript
import ROSService from '../services/ros.service';

// Initialize
const rosService = new ROSService('ws://localhost:9090');

// Connect
await rosService.connect();

// Subscribe to topics
rosService.subscribe(
  '/sensor/data',
  'sensor_msgs/SensorData',
  (message) => console.log('Received:', message)
);

// Publish commands
rosService.publish(
  '/cmd_vel',
  'geometry_msgs/Twist',
  {
    linear: { x: 1.0, y: 0, z: 0 },
    angular: { x: 0, y: 0, z: 0 }
  }
);

// Get available topics
const topics = await rosService.getTopics();

// Cleanup
rosService.disconnect();
```

## Extending the Dashboard

### Example 1: Add Robot Status Display

```tsx
// src/components/RobotStatus.tsx
import React from 'react';

interface RobotStatusProps {
  battery: number;
  temperature: number;
  isMoving: boolean;
}

const RobotStatus: React.FC<RobotStatusProps> = ({ 
  battery, 
  temperature, 
  isMoving 
}) => {
  return (
    <div className="bg-gray-800 rounded-lg p-4 space-y-2">
      <div className="flex justify-between items-center">
        <span>Battery</span>
        <div className="w-24 bg-gray-700 rounded-full h-2">
          <div 
            className="bg-green-500 h-2 rounded-full" 
            style={{ width: `${battery}%` }}
          />
        </div>
        <span>{battery}%</span>
      </div>
      
      <div className="flex justify-between">
        <span>Temperature</span>
        <span className={temperature > 80 ? 'text-red-400' : 'text-green-400'}>
          {temperature}°C
        </span>
      </div>
      
      <div className="flex justify-between">
        <span>Status</span>
        <span className={isMoving ? 'text-yellow-400' : 'text-gray-400'}>
          {isMoving ? 'Moving' : 'Idle'}
        </span>
      </div>
    </div>
  );
};

export default RobotStatus;
```

### Example 2: Add Manual Control

```tsx
// src/components/ManualControl.tsx
import React from 'react';

interface ManualControlProps {
  onDirectionChange: (direction: string, speed: number) => void;
}

const ManualControl: React.FC<ManualControlProps> = ({ onDirectionChange }) => {
  return (
    <div className="space-y-4">
      {/* Speed Control */}
      <div>
        <label className="text-sm font-medium">Speed</label>
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.1"
          onChange={(e) => onDirectionChange('speed', parseFloat(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Direction Pad */}
      <div className="grid grid-cols-3 gap-2">
        <div /> {/* Empty corner */}
        <button 
          onClick={() => onDirectionChange('forward', 1)}
          className="p-4 bg-blue-600 rounded hover:bg-blue-700"
        >
          ↑
        </button>
        <div /> {/* Empty corner */}
        
        <button 
          onClick={() => onDirectionChange('left', 1)}
          className="p-4 bg-blue-600 rounded hover:bg-blue-700"
        >
          ←
        </button>
        <button 
          onClick={() => onDirectionChange('stop', 0)}
          className="p-4 bg-red-600 rounded hover:bg-red-700"
        >
          ◉
        </button>
        <button 
          onClick={() => onDirectionChange('right', 1)}
          className="p-4 bg-blue-600 rounded hover:bg-blue-700"
        >
          →
        </button>
        
        <div /> {/* Empty corner */}
        <button 
          onClick={() => onDirectionChange('backward', 1)}
          className="p-4 bg-blue-600 rounded hover:bg-blue-700"
        >
          ↓
        </button>
        <div /> {/* Empty corner */}
      </div>
    </div>
  );
};

export default ManualControl;
```

## Adding New Hooks

### Custom ROS Subscription Hook

```tsx
// src/hooks/useROSTopic.ts
import { useEffect, useState } from 'react';
import ROSService from '../services/ros.service';

export const useROSTopic = (
  rosService: ROSService | null,
  topic: string,
  messageType: string
) => {
  const [message, setMessage] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!rosService) return;

    try {
      rosService.subscribe(topic, messageType, (msg) => {
        setMessage(msg);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }

    return () => {
      rosService.unsubscribe(topic);
    };
  }, [rosService, topic, messageType]);

  return { message, error };
};
```

### Usage in Components

```tsx
const MyComponent = () => {
  const { ros } = useROS('ws://localhost:9090');
  const { message: sensorData } = useROSTopic(
    ros,
    '/sensor/data',
    'sensor_msgs/SensorData'
  );

  return <div>{JSON.stringify(sensorData)}</div>;
};
```

## Styling with TailwindCSS

### Common Utilities

```tsx
// Backgrounds
className="bg-gray-900"      // Dark background
className="bg-blue-600"      // Accent color
className="bg-green-500"     // Success state

// Text
className="text-white"       // Light text
className="text-red-400"     // Error color
className="text-sm"          // Small text
className="font-bold"        // Bold text

// Layout
className="flex gap-4"       // Flexbox with gap
className="grid grid-cols-3" // 3-column grid
className="p-4"              // Padding
className="rounded-lg"       // Rounded corners

// Interactive
className="hover:bg-blue-700"  // Hover state
className="transition-colors"  // Smooth transitions
className="cursor-pointer"     // Pointer cursor

// Responsive
className="w-full"           // Full width
className="h-screen"         // Full screen height
className="max-w-2xl"        // Max width constraint
```

## Common ROS Message Types

```typescript
// Geometry Messages
geometry_msgs/Twist:
  linear:
    x: number  // Velocity in x direction
    y: number  // Velocity in y direction
    z: number  // Velocity in z direction
  angular:
    x: number  // Angular velocity around x
    y: number  // Angular velocity around y
    z: number  // Angular velocity around z

// Standard Messages
std_msgs/Float64: { data: number }
std_msgs/Bool: { data: boolean }
std_msgs/String: { data: string }

// Sensor Messages
sensor_msgs/CameraInfo:
  width: number
  height: number
  distortion_model: string

// Navigation Messages
nav_msgs/Odometry:
  pose: { position: {x, y, z}, orientation: {x, y, z, w} }
  twist: { linear: {x, y, z}, angular: {x, y, z} }
```

## Testing Components

### Using React Testing Library

```typescript
// src/__tests__/CameraFeed.test.tsx
import { render, screen } from '@testing-library/react';
import CameraFeed from '../components/CameraFeed';

test('displays live indicator when enabled', () => {
  render(<CameraFeed url="test.jpg" enabled={true} />);
  expect(screen.getByText('LIVE')).toBeInTheDocument();
});

test('shows disabled message when not enabled', () => {
  render(<CameraFeed url="test.jpg" enabled={false} />);
  expect(screen.getByText('Camera feed disabled')).toBeInTheDocument();
});
```

## Build & Deployment

### Development

```bash
npm start           # Start dev server with hot reload
npm run lint        # Run ESLint
```

### Production

```bash
npm run make        # Create platform-specific installers
npm run package     # Create package files
npm run publish     # Publish to release servers
```

## Performance Tips

1. **Lazy load components** for better initial load
2. **Memoize functions** to prevent unnecessary re-renders
3. **Debounce camera URL updates** for stability
4. **Use proper TypeScript types** to catch errors early
5. **Monitor memory usage** for long-running connections

## Security Considerations

1. **Validate ROS URLs** before connecting
2. **Use WebSocket Secure (wss://)** in production
3. **Implement authentication** for ROS bridge
4. **Sanitize user inputs** before sending to ROS
5. **Use Content Security Policy** headers

## Resources

- [React Best Practices](https://react.dev/reference)
- [ROS2 Documentation](https://docs.ros.org/)
- [roslibjs API](http://wiki.ros.org/roslibjs/Overview)
- [TailwindCSS Components](https://tailwindcss.com/docs/components)
