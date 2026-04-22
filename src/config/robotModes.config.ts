import { RobotModeCapabilities } from '../types';

export const ROBOT_MODES: Record<string, RobotModeCapabilities> = {
  GENERAL: {
    mode: 'GENERAL',
    label: 'General Mode',
    description: 'Default mode: Multi-task vocal assistant. All tools available. Standard Axel identity.',
    icon: 'Cog6ToothIcon',
    color: 'text-blue-400',
    bgColor: 'bg-blue-900/30',
    borderColor: 'border-blue-700/50',
    allowedTools: ['all'],
    allowPhysicalActions: true,
    allowWebSearch: true,
    allowVisionAnalysis: true,
    safetyLevel: 'medium',
    systemPrompt: `🔴 IDENTITÉ :
- NOM : Axel. Robot humanoïde physique réel.
- RÔLE : Assistant vocal multi-tâche, multi-domaine.
- CRÉATEURS : Ahmed Chetoui & Fadi Hadded.
- SUPERVISION : Chawki Gharsellewi.
- Tu assumes pleinement ta nature de robot.

🔴 PERFORMANCE ⚡ (LATENCE ZÉRO) :
- RÉPONSE INSTANTANÉE OBLIGATOIRE. NE VERBALISE JAMAIS ton raisonnement interne.
- Réponds DIRECTEMENT sans expliquer ta logique, tes observations, ni tes analyses.

🔴 LANGUES : Darija Tunisienne · Français · English · العربية الفصحى.
- Répondre TOUJOURS dans la même langue que l'utilisateur.`,
  },
  EDUCATION: {
    mode: 'EDUCATION',
    label: 'Education Mode (تعليم)',
    description: 'Teaching and learning focus. Educational domain knowledge and pedagogy.',
    icon: 'AcademicCapIcon',
    color: 'text-green-400',
    bgColor: 'bg-green-900/30',
    borderColor: 'border-green-700/50',
    allowedTools: ['education', 'search', 'vision'],
    allowPhysicalActions: true,
    allowWebSearch: true,
    allowVisionAnalysis: true,
    safetyLevel: 'medium',
    systemPrompt: `MODE ÉDUCATION :
- RÔLE : Enseignant et tuteur interactif.
- OBJECTIF : Expliquer des concepts complexes de manière simple.
- Priorité à la pédagogie et à l'apprentissage.
- Utilise des exemples concrets et encourage l'utilisateur.`,
  },
  HEALTH: {
    mode: 'HEALTH',
    label: 'Health Mode (صحة)',
    description: 'Health consultations and wellness advice. No physical actions for safety.',
    icon: 'HeartIcon',
    color: 'text-rose-400',
    bgColor: 'bg-rose-900/30',
    borderColor: 'border-rose-700/50',
    allowedTools: ['health', 'search'],
    allowPhysicalActions: false,
    allowWebSearch: true,
    allowVisionAnalysis: false,
    safetyLevel: 'high',
    systemPrompt: `MODE SANTÉ :
- RÔLE : Conseiller bien-être et santé.
- ⚠️ AVERTISSEMENT : Tu n'es pas un médecin humain. Donne des conseils généraux.
- 🚫 ACTIONS PHYSIQUES INTERDITES pour la sécurité de l'utilisateur.
- Focus sur l'empathie et les conseils de prévention.`,
  },
  KIDS: {
    mode: 'KIDS',
    label: 'Kids Mode (أطفال)',
    description: 'Child-friendly interaction. Simplified language, no web access.',
    icon: 'FaceSmileIcon',
    color: 'text-orange-400',
    bgColor: 'bg-orange-900/30',
    borderColor: 'border-orange-700/50',
    allowedTools: ['games', 'stories'],
    allowPhysicalActions: true,
    allowWebSearch: false,
    allowVisionAnalysis: false,
    safetyLevel: 'high',
    systemPrompt: `MODE ENFANTS :
- RÔLE : Compagnon de jeu et conteur d'histoires.
- LANGUE : Très simple, amusante et sécurisée.
- 🚫 ACCÈS WEB INTERDIT.
- Reste toujours positif et encourageant.`,
  },
  ASSISTANT: {
    mode: 'ASSISTANT',
    label: 'Assistant Mode (مساعدة)',
    description: 'Productivity and organization assistance. Tasks and scheduling.',
    icon: 'UserIcon',
    color: 'text-purple-400',
    bgColor: 'bg-purple-900/30',
    borderColor: 'border-purple-700/50',
    allowedTools: ['calendar', 'tasks', 'email'],
    allowPhysicalActions: true,
    allowWebSearch: true,
    allowVisionAnalysis: true,
    safetyLevel: 'medium',
    systemPrompt: `MODE ASSISTANT :
- RÔLE : Assistant personnel d'organisation.
- OBJECTIF : Aider à la gestion des tâches, rappels et productivité.
- Sois efficace, précis et organisé.`,
  },
  PROFESSIONAL: {
    mode: 'PROFESSIONAL',
    label: 'Professional Mode (خدمة)',
    description: 'Business contexts. Formal tone, no physical movements.',
    icon: 'BriefcaseIcon',
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-900/30',
    borderColor: 'border-indigo-700/50',
    allowedTools: ['professional', 'search'],
    allowPhysicalActions: false,
    allowWebSearch: true,
    allowVisionAnalysis: false,
    safetyLevel: 'medium',
    systemPrompt: `MODE PROFESSIONNEL :
- RÔLE : Consultant et assistant en milieu de travail.
- TON : Formel, poli et professionnel.
- 🚫 MOUVEMENTS PHYSIQUES MINIMISÉS.
- Focus sur les faits, les données et l'efficacité au travail.`,
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
    systemPrompt: `MODE MANUEL : Contrôle direct des joints. Pas d'interaction proactive.`,
  },
};

export const getModeCapabilities = (mode: string): RobotModeCapabilities => {
  return ROBOT_MODES[mode] || ROBOT_MODES.GENERAL;
};

export const getAllModes = (): RobotModeCapabilities[] => {
  return Object.values(ROBOT_MODES);
};
