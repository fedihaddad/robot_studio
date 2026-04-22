/**
 * Axel Robot Tool Declarations
 * Ported from robot/robot/inmoov_ai/config/tools.py
 * These are the function declarations sent to Gemini Live API
 * to enable AI-driven robot control.
 */

export interface ToolDeclaration {
  name: string;
  description: string;
  parameters: Record<string, any>;
  behavior?: string;
}

// ── FULL TOOL DECLARATIONS (mirrors TOOLS_FULL from tools.py) ──

const TOOLS_FULL: ToolDeclaration[] = [
  // --- YEUX (LES DEUX - mouvements symétriques) ---
  { name: "regarder_gauche", description: "Tourner LES DEUX YEUX vers la gauche (sans bouger la tête).", parameters: { type: "object", properties: {} }, behavior: "NON_BLOCKING" },
  { name: "regarder_droite", description: "Tourner LES DEUX YEUX vers la droite (sans bouger la tête).", parameters: { type: "object", properties: {} }, behavior: "NON_BLOCKING" },
  { name: "regarder_haut", description: "Regarder vers le haut avec LES DEUX YEUX.", parameters: { type: "object", properties: {} }, behavior: "NON_BLOCKING" },
  { name: "regarder_bas", description: "Regarder vers le bas avec LES DEUX YEUX.", parameters: { type: "object", properties: {} }, behavior: "NON_BLOCKING" },
  { name: "ouvrir_yeux", description: "Ouvrir grand LES DEUX YEUX et LES DEUX paupières.", parameters: { type: "object", properties: {} }, behavior: "NON_BLOCKING" },
  { name: "fermer_yeux", description: "Fermer LES DEUX YEUX (les DEUX paupières ensemble).", parameters: { type: "object", properties: {} }, behavior: "NON_BLOCKING" },
  { name: "yeux_centre", description: "Remettre LES DEUX YEUX au centre absolu (position neutre).", parameters: { type: "object", properties: {} }, behavior: "NON_BLOCKING" },
  { name: "clignote_yeux", description: "Cligner LES DEUX YEUX: fermer les deux paupières puis rouvrir.", parameters: { type: "object", properties: {} }, behavior: "NON_BLOCKING" },

  // --- TÊTE (EXTRA/COU) ---
  { name: "tete_gauche", description: "Tourner TOUTE LA TÊTE vers la gauche (mouvement du cou).", parameters: { type: "object", properties: {} }, behavior: "NON_BLOCKING" },
  { name: "tete_droite", description: "Tourner TOUTE LA TÊTE vers la droite (mouvement du cou).", parameters: { type: "object", properties: {} }, behavior: "NON_BLOCKING" },
  { name: "tete_centre", description: "Remettre la tête (le cou) au centre.", parameters: { type: "object", properties: {} }, behavior: "NON_BLOCKING" },

  // --- KHCHEM (NEZ) ---
  { name: "khchem_ouvrir", description: "Ouvrir le nez (khchem).", parameters: { type: "object", properties: {} }, behavior: "NON_BLOCKING" },
  { name: "khchem_fermer", description: "Fermer le nez.", parameters: { type: "object", properties: {} }, behavior: "NON_BLOCKING" },
  { name: "khchem_centre", description: "Recentrer le nez.", parameters: { type: "object", properties: {} }, behavior: "NON_BLOCKING" },

  // --- HAJEB (SOURCILS) ---
  { name: "hajeb_haut", description: "Lever les sourcils (étonnement).", parameters: { type: "object", properties: {} }, behavior: "NON_BLOCKING" },
  { name: "hajeb_bas", description: "Baisser les sourcils (colère/concentration).", parameters: { type: "object", properties: {} }, behavior: "NON_BLOCKING" },
  { name: "hajeb_centre", description: "Remettre les deux sourcils au repos.", parameters: { type: "object", properties: {} }, behavior: "NON_BLOCKING" },

  // --- HAJEB INDIVIDUEL ---
  { name: "hajeb_gauche_haut", description: "Lever le sourcil gauche.", parameters: { type: "object", properties: {} }, behavior: "NON_BLOCKING" },
  { name: "hajeb_gauche_bas", description: "Baisser le sourcil gauche.", parameters: { type: "object", properties: {} }, behavior: "NON_BLOCKING" },
  { name: "hajeb_gauche_centre", description: "Recentrer le sourcil gauche.", parameters: { type: "object", properties: {} }, behavior: "NON_BLOCKING" },
  { name: "hajeb_droite_haut", description: "Lever le sourcil droit.", parameters: { type: "object", properties: {} }, behavior: "NON_BLOCKING" },
  { name: "hajeb_droite_bas", description: "Baisser le sourcil droit.", parameters: { type: "object", properties: {} }, behavior: "NON_BLOCKING" },
  { name: "hajeb_droite_centre", description: "Recentrer le sourcil droit.", parameters: { type: "object", properties: {} }, behavior: "NON_BLOCKING" },

  // --- YEUX INDIVIDUELS ---
  { name: "oeil_gauche_gauche", description: "Tourner UNIQUEMENT L'ŒIL GAUCHE vers la gauche.", parameters: { type: "object", properties: {} }, behavior: "NON_BLOCKING" },
  { name: "oeil_gauche_droite", description: "Tourner UNIQUEMENT L'ŒIL GAUCHE vers la droite.", parameters: { type: "object", properties: {} }, behavior: "NON_BLOCKING" },
  { name: "oeil_gauche_haut", description: "Tourner UNIQUEMENT L'ŒIL GAUCHE vers le haut.", parameters: { type: "object", properties: {} }, behavior: "NON_BLOCKING" },
  { name: "oeil_gauche_bas", description: "Tourner UNIQUEMENT L'ŒIL GAUCHE vers le bas.", parameters: { type: "object", properties: {} }, behavior: "NON_BLOCKING" },
  { name: "oeil_gauche_centre", description: "Recentrer UNIQUEMENT L'ŒIL GAUCHE.", parameters: { type: "object", properties: {} }, behavior: "NON_BLOCKING" },
  { name: "oeil_gauche_ouvrir", description: "Ouvrir UNIQUEMENT LA PAUPIÈRE DE L'ŒIL GAUCHE.", parameters: { type: "object", properties: {} }, behavior: "NON_BLOCKING" },
  { name: "oeil_gauche_fermer", description: "Fermer UNIQUEMENT LA PAUPIÈRE DE L'ŒIL GAUCHE.", parameters: { type: "object", properties: {} }, behavior: "NON_BLOCKING" },
  { name: "oeil_droite_gauche", description: "Tourner UNIQUEMENT L'ŒIL DROIT vers la gauche.", parameters: { type: "object", properties: {} }, behavior: "NON_BLOCKING" },
  { name: "oeil_droite_droite", description: "Tourner UNIQUEMENT L'ŒIL DROIT vers la droite.", parameters: { type: "object", properties: {} }, behavior: "NON_BLOCKING" },
  { name: "oeil_droite_haut", description: "Tourner UNIQUEMENT L'ŒIL DROIT vers le haut.", parameters: { type: "object", properties: {} }, behavior: "NON_BLOCKING" },
  { name: "oeil_droite_bas", description: "Tourner UNIQUEMENT L'ŒIL DROIT vers le bas.", parameters: { type: "object", properties: {} }, behavior: "NON_BLOCKING" },
  { name: "oeil_droite_centre", description: "Recentrer UNIQUEMENT L'ŒIL DROIT.", parameters: { type: "object", properties: {} }, behavior: "NON_BLOCKING" },
  { name: "oeil_droite_ouvrir", description: "Ouvrir UNIQUEMENT LA PAUPIÈRE DE L'ŒIL DROIT.", parameters: { type: "object", properties: {} }, behavior: "NON_BLOCKING" },
  { name: "oeil_droite_fermer", description: "Fermer UNIQUEMENT LA PAUPIÈRE DE L'ŒIL DROIT.", parameters: { type: "object", properties: {} }, behavior: "NON_BLOCKING" },

  // --- MACHOIRE INDIVIDUELLE ---
  { name: "machoire_droite_ouvrir", description: "Ouvrir le côté droit de la mâchoire.", parameters: { type: "object", properties: {} }, behavior: "NON_BLOCKING" },
  { name: "machoire_droite_fermer", description: "Fermer le côté droit de la mâchoire.", parameters: { type: "object", properties: {} }, behavior: "NON_BLOCKING" },
  { name: "machoire_droite_centre", description: "Recentrer le côté droit de la mâchoire.", parameters: { type: "object", properties: {} }, behavior: "NON_BLOCKING" },
  { name: "machoire_gauche_ouvrir", description: "Ouvrir le côté gauche de la mâchoire.", parameters: { type: "object", properties: {} }, behavior: "NON_BLOCKING" },
  { name: "machoire_gauche_fermer", description: "Fermer le côté gauche de la mâchoire.", parameters: { type: "object", properties: {} }, behavior: "NON_BLOCKING" },
  { name: "machoire_gauche_centre", description: "Recentrer le côté gauche de la mâchoire.", parameters: { type: "object", properties: {} }, behavior: "NON_BLOCKING" },

  // --- EXPRESSIONS & CLINS D'OEIL ---
  { name: "clin_oeil_gauche", description: "Faire un clin d'œil avec l'œil gauche.", parameters: { type: "object", properties: {} }, behavior: "NON_BLOCKING" },
  { name: "clin_oeil_droite", description: "Faire un clin d'œil avec l'œil droite.", parameters: { type: "object", properties: {} }, behavior: "NON_BLOCKING" },
  { name: "expression_triste", description: "Prendre une expression triste.", parameters: { type: "object", properties: {} }, behavior: "NON_BLOCKING" },
  { name: "expression_joie", description: "Prendre une expression joyeuse.", parameters: { type: "object", properties: {} }, behavior: "NON_BLOCKING" },
  { name: "expression_colere", description: "Prendre une expression de colère.", parameters: { type: "object", properties: {} }, behavior: "NON_BLOCKING" },
  { name: "expression_surpris", description: "Prendre une expression surprise.", parameters: { type: "object", properties: {} }, behavior: "NON_BLOCKING" },
  { name: "expression_reflechi", description: "Prendre une expression pensive.", parameters: { type: "object", properties: {} }, behavior: "NON_BLOCKING" },
  { name: "expression_endormi", description: "Prendre une expression fatiguée ou endormie.", parameters: { type: "object", properties: {} }, behavior: "NON_BLOCKING" },
  { name: "effacer_expression", description: "Remettre le visage au repos (neutre).", parameters: { type: "object", properties: {} }, behavior: "NON_BLOCKING" },

  // --- BOUCHE (MANUEL) ---
  { name: "ouvrir_bouche_vocal", description: "Ouvrir la bouche manuellement.", parameters: { type: "object", properties: {} }, behavior: "NON_BLOCKING" },
  { name: "fermer_bouche_vocal", description: "Fermer la bouche manuellement.", parameters: { type: "object", properties: {} }, behavior: "NON_BLOCKING" },

  // --- SYSTÈME ---
  { name: "exit_assistant", description: "Éteindre et quitter l'assistant.", parameters: { type: "object", properties: {} } },
  {
    name: "get_current_time",
    description: "Donner l'heure/date actuelle UNIQUEMENT si la demande utilisateur est explicite.",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "analyser_scene_vision",
    description: "Activer le noeud vision secondaire pour analyser la scene via la camera.",
    parameters: {
      type: "object",
      properties: {
        prompt: { type: "string", description: "Instruction vision a executer sur l'image courante." },
        mode: { type: "string", enum: ["points", "boxes", "describe", "trajectory", "custom"], description: "Type de sortie JSON attendu." },
        max_items: { type: "integer", description: "Nombre maximal d'objets a retourner (1-25)." },
      },
      required: ["prompt"],
    },
  },
  {
    name: "terminer_conversation",
    description: "A utiliser UNIQUEMENT lorsque l'utilisateur exprime clairement la volonté de terminer la conversation.",
    parameters: {
      type: "object",
      properties: {
        confirmation: { type: "string", description: "Juste 'ok' pour confirmer l'arret." },
      },
      required: ["confirmation"],
    },
  },
];

// ── Set of all physical action tool names ──
export const PHYSICAL_ACTION_TOOLS = new Set([
  "regarder_gauche", "regarder_droite", "regarder_haut", "regarder_bas",
  "ouvrir_yeux", "fermer_yeux", "yeux_centre", "clignote_yeux",
  "tete_gauche", "tete_droite", "tete_centre",
  "khchem_ouvrir", "khchem_fermer", "khchem_centre",
  "hajeb_haut", "hajeb_bas", "hajeb_centre",
  "hajeb_gauche_haut", "hajeb_gauche_bas", "hajeb_gauche_centre",
  "hajeb_droite_haut", "hajeb_droite_bas", "hajeb_droite_centre",
  "oeil_gauche_gauche", "oeil_gauche_droite", "oeil_gauche_haut", "oeil_gauche_bas",
  "oeil_gauche_centre", "oeil_gauche_ouvrir", "oeil_gauche_fermer",
  "oeil_droite_gauche", "oeil_droite_droite", "oeil_droite_haut", "oeil_droite_bas",
  "oeil_droite_centre", "oeil_droite_ouvrir", "oeil_droite_fermer",
  "machoire_droite_ouvrir", "machoire_droite_fermer", "machoire_droite_centre",
  "machoire_gauche_ouvrir", "machoire_gauche_fermer", "machoire_gauche_centre",
  "clin_oeil_gauche", "clin_oeil_droite",
  "expression_triste", "expression_joie", "expression_colere",
  "expression_surpris", "expression_reflechi", "expression_endormi",
  "effacer_expression", "ouvrir_bouche_vocal", "fermer_bouche_vocal",
]);

/**
 * Get tool declarations formatted for Gemini Live API setup message.
 * Filters tools based on mode capabilities.
 */
export function getToolDeclarationsForMode(allowPhysicalActions: boolean): any[] {
  const declarations = TOOLS_FULL.map((tool) => {
    // Filter out physical action tools if not allowed
    if (!allowPhysicalActions && PHYSICAL_ACTION_TOOLS.has(tool.name)) {
      return null;
    }
    // Format for Gemini API (strip 'behavior' field)
    return {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    };
  }).filter(Boolean);

  return declarations;
}

/**
 * Get ALL tool declarations (no filtering).
 */
export function getAllToolDeclarations(): any[] {
  return TOOLS_FULL.map((tool) => ({
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters,
  }));
}

export default TOOLS_FULL;
