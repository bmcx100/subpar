// SuperSpeed Level 1 Protocol
// ⚠️ Swing count: requirements say 15 total but blocks sum to 14.
// This file defines 14 entries matching the documented blocks.
// Confirm with product owner if a 15th swing is needed (likely MAX_NORMAL Medium Dominant).

export type GolfSwingEntry = {
  block: "NORMAL" | "STEP" | "MAX_NORMAL" | "DRIVER";
  stick: "LIGHT" | "MEDIUM" | "HEAVY" | "DRIVER";
  side: "DOMINANT" | "NON_DOMINANT";
  label: string;
};

export const SUPERSPEED_LEVEL_1: GolfSwingEntry[] = [
  // Block 1 — NORMAL (6 swings)
  { block: "NORMAL", stick: "LIGHT", side: "DOMINANT", label: "Light — Dominant" },
  { block: "NORMAL", stick: "LIGHT", side: "NON_DOMINANT", label: "Light — Non-Dominant" },
  { block: "NORMAL", stick: "MEDIUM", side: "DOMINANT", label: "Medium — Dominant" },
  { block: "NORMAL", stick: "MEDIUM", side: "NON_DOMINANT", label: "Medium — Non-Dominant" },
  { block: "NORMAL", stick: "HEAVY", side: "DOMINANT", label: "Heavy — Dominant" },
  { block: "NORMAL", stick: "HEAVY", side: "NON_DOMINANT", label: "Heavy — Non-Dominant" },

  // Block 2 — STEP (6 swings)
  { block: "STEP", stick: "LIGHT", side: "DOMINANT", label: "Light — Dominant" },
  { block: "STEP", stick: "LIGHT", side: "NON_DOMINANT", label: "Light — Non-Dominant" },
  { block: "STEP", stick: "MEDIUM", side: "DOMINANT", label: "Medium — Dominant" },
  { block: "STEP", stick: "MEDIUM", side: "NON_DOMINANT", label: "Medium — Non-Dominant" },
  { block: "STEP", stick: "HEAVY", side: "DOMINANT", label: "Heavy — Dominant" },
  { block: "STEP", stick: "HEAVY", side: "NON_DOMINANT", label: "Heavy — Non-Dominant" },

  // Block 3 — MAX NORMAL (1 swing)
  { block: "MAX_NORMAL", stick: "LIGHT", side: "DOMINANT", label: "Light — Dominant" },

  // Block 4 — DRIVER (1 swing)
  { block: "DRIVER", stick: "DRIVER", side: "DOMINANT", label: "Driver — Dominant" },
];

export const TOTAL_SWINGS = SUPERSPEED_LEVEL_1.length;
