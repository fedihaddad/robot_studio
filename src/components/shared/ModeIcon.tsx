import React from 'react';
import {
  Cog6ToothIcon,
  AcademicCapIcon,
  HeartIcon,
  UserGroupIcon,
  WrenchScrewdriverIcon,
  BriefcaseIcon,
  FaceSmileIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

interface ModeIconProps {
  iconName: string;
  className?: string;
}

// Map icon names to Heroicon components
const ICON_MAP: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  'Cog6ToothIcon': Cog6ToothIcon,
  'AcademicCapIcon': AcademicCapIcon,
  'HeartIcon': HeartIcon,
  'UserGroupIcon': UserGroupIcon,
  'WrenchScrewdriverIcon': WrenchScrewdriverIcon,
  'BriefcaseIcon': BriefcaseIcon,
  'FaceSmileIcon': FaceSmileIcon,
  'UserIcon': UserIcon,
};

const ModeIcon: React.FC<ModeIconProps> = ({ iconName, className = 'w-6 h-6' }) => {
  const IconComponent = ICON_MAP[iconName];
  
  if (!IconComponent) {
    console.warn(`Icon not found: ${iconName}`);
    return null;
  }

  return <IconComponent className={className} />;
};

export default ModeIcon;
