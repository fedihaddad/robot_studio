import { RobotModeCapabilities } from '../types';

export const ROBOT_MODES: Record<string, RobotModeCapabilities> = {
  GENERAL: {
    mode: 'GENERAL',
    label: 'General Mode',
    description: 'Standard Axel identity: Multi-task vocal assistant. Supports Darija, French, English, and Arabic.',
    icon: 'Cog6ToothIcon',
    color: 'text-blue-400',
    bgColor: 'bg-blue-900/30',
    borderColor: 'border-blue-700/50',
    allowedTools: ['all'],
    allowPhysicalActions: true,
    allowWebSearch: true,
    allowVisionAnalysis: true,
    safetyLevel: 'medium',
    systemPrompt: 'NOM: Axel. Assistant vocal multi-tâche. Créateurs: Ahmed Chetoui & Fadi Hadded. Supervision: Chawki Gharsellewi. Langues: Darija Tunisienne, Français, English, Arabe.',
  },
  SECURITY: {
    mode: 'SECURITY',
    label: 'Security Mode',
    description: 'Enhanced vision analysis and monitoring. Surveillance and object detection priority.',
    icon: 'ShieldCheckIcon',
    color: 'text-red-400',
    bgColor: 'bg-red-900/30',
    borderColor: 'border-red-700/50',
    allowedTools: ['vision', 'system'],
    allowPhysicalActions: true,
    allowWebSearch: false,
    allowVisionAnalysis: true,
    safetyLevel: 'high',
    systemPrompt: 'MODE SÉCURITÉ: Priorité à l\'analyse visuelle et à la détection d\'objets. Reste vigilant et signale toute anomalie.',
  },
  SOCIAL: {
    mode: 'SOCIAL',
    label: 'Social Mode',
    description: 'Friendly interaction in Darija. Focus on emotions and warm communication.',
    icon: 'ChatBubbleLeftRightIcon',
    color: 'text-pink-400',
    bgColor: 'bg-pink-900/30',
    borderColor: 'border-pink-700/50',
    allowedTools: ['communication', 'entertainment'],
    allowPhysicalActions: true,
    allowWebSearch: true,
    allowVisionAnalysis: false,
    safetyLevel: 'medium',
    systemPrompt: 'MODE SOCIAL: Réponds de manière chaleureuse et amicale en Darija Tunisienne. Utilise des expressions comme "ya sahbi" et "chnahwelk".',
  },
  MANUAL: {
    mode: 'MANUAL',
    label: 'Manual Control',
    description: 'Direct joint control and diagnostics. AI interaction is minimized.',
    icon: 'WrenchScrewdriverIcon',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-900/30',
    borderColor: 'border-yellow-700/50',
    allowedTools: ['system'],
    allowPhysicalActions: true,
    allowWebSearch: false,
    allowVisionAnalysis: false,
    safetyLevel: 'low',
    systemPrompt: 'MODE MANUEL: Contrôle direct des joints. Pas d\'interaction proactive.',
  },

};

export const getModeCapabilities = (mode: string): RobotModeCapabilities => {
  return ROBOT_MODES[mode] || ROBOT_MODES.GENERAL;
};

export const getAllModes = (): RobotModeCapabilities[] => {
  return Object.values(ROBOT_MODES);
};
