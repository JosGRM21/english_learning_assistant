export interface SatelliteMotionVerbItem {
  id: string;
  latinateStaticSentence: string; // e.g. "He entered the room quickly."
  satelliteFramedSentence: string; // e.g. "He rushed into the room."
  mannerVerb: string; // e.g. "rush"
  satellitePreposition: string; // e.g. "into"
  mannerMeaningEs: string; // e.g. "moverse con prisa y urgencia"
  pathMeaningEs: string; // e.g. "hacia el interior del espacio"
  cefrLevel: 'B1' | 'B2' | 'C1';
  options: string[]; // e.g. ["rushed into", "entered quickly to", "walked inside with speed"]
  correctOptionIndex: number;
}

export type PolysemicPairKey =
  | 'MAKE_DO'
  | 'SAY_TELL_SPEAK_TALK'
  | 'HEAR_LISTEN'
  | 'SEE_LOOK_WATCH'
  | 'BORROW_LEND'
  | 'WIN_EARN_GAIN'
  | 'MISS_LOSE';

export interface PolysemicExercise {
  id: string;
  sentenceWithBlank: string; // e.g. "I need to ___ an appointment with the doctor."
  targetVerb: string; // e.g. "make"
  options: string[]; // e.g. ["make", "do", "have", "take"]
  explanationEs: string;
  contextTag: string; // e.g. "Creación / Acuerdos formales"
}

export interface PolysemicPairItem {
  id: string;
  pairKey: PolysemicPairKey;
  title: string; // e.g. "Make vs Do (Hacer)"
  coreDistinctionEs: string; // e.g. "MAKE: creación/origen. DO: actividad/tarea sin producto nuevo."
  verbGuidelines: {
    verb: string;
    syntacticStructure: string;
    semanticFocus: string;
    examples: string[];
  }[];
  exercises: PolysemicExercise[];
}
