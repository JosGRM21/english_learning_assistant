import { PolysemicPairItem, PolysemicPairKey, PolysemicExercise } from '../../../types/semantics';

export const POLYSEMIC_PAIRS_CATALOG: PolysemicPairItem[] = [
  {
    id: 'poly_make_do',
    pairKey: 'MAKE_DO',
    title: 'Make vs Do (Hacer)',
    coreDistinctionEs: 'MAKE codifica creación, construcción, origen o cambio de estado. DO codifica ejecución de actividades, procesos, tareas o esfuerzo sin producto físico nuevo.',
    verbGuidelines: [
      {
        verb: 'make',
        syntacticStructure: 'make + [creación / decisión / error / alimento / emoción]',
        semanticFocus: 'Producir algo que no existía antes o causar un estado.',
        examples: ['make a decision', 'make a mistake', 'make coffee', 'make someone smile'],
      },
      {
        verb: 'do',
        syntacticStructure: 'do + [tarea / trabajo / proceso / esfuerzo]',
        semanticFocus: 'Desarrollar una actividad, trámite o mantenimiento.',
        examples: ['do homework', 'do research', 'do business', 'do your best'],
      },
    ],
    exercises: [
      {
        id: 'ex_md_01',
        sentenceWithBlank: 'We must ___ an important decision before Friday.',
        targetVerb: 'make',
        options: ['make', 'do', 'take', 'have'],
        explanationEs: '"Make a decision" es la colocación fija estándar (crear una determinación).',
        contextTag: 'Resolución y Acuerdos',
      },
      {
        id: 'ex_md_02',
        sentenceWithBlank: 'The scientists are going to ___ extensive research on this virus.',
        targetVerb: 'do',
        options: ['do', 'make', 'perform', 'produce'],
        explanationEs: '"Do research" expresa un proceso investigativo sistemático sin producto físico inmediato.',
        contextTag: 'Proceso Científico',
      },
      {
        id: 'ex_md_03',
        sentenceWithBlank: 'Don’t worry about perfection; just ___ your best.',
        targetVerb: 'do',
        options: ['do', 'make', 'give', 'try'],
        explanationEs: '"Do one\'s best" denota despliegue de esfuerzo.',
        contextTag: 'Esfuerzo personal',
      },
    ],
  },
  {
    id: 'poly_say_tell',
    pairKey: 'SAY_TELL_SPEAK_TALK',
    title: 'Say vs Tell vs Speak vs Talk (Decir / Hablar)',
    coreDistinctionEs: 'SAY se enfoca en las palabras dichas (sin receptor directo). TELL exige el receptor explícito (tell someone). SPEAK es formal/idiomas. TALK es conversación interactiva.',
    verbGuidelines: [
      {
        verb: 'say',
        syntacticStructure: 'say + [lo dicho] (+ to someone)',
        semanticFocus: 'Contenido textual de las palabras. Nunca lleva objeto indirecto directo (*said me es un error grave).',
        examples: ['She said that she agreed.', 'Say hello to your brother.'],
      },
      {
        verb: 'tell',
        syntacticStructure: 'tell + [persona] + [información / instrucción]',
        semanticFocus: 'Transmisión de información a un receptor obligatorio.',
        examples: ['She told me the truth.', 'Tell him to wait.'],
      },
      {
        verb: 'speak',
        syntacticStructure: 'speak + (with/to) (+ idioma)',
        semanticFocus: 'Acto formal, unilateral o dominio de un idioma.',
        examples: ['I speak three languages.', 'The CEO spoke to the shareholders.'],
      },
      {
        verb: 'talk',
        syntacticStructure: 'talk + (with/to) (+ about topic)',
        semanticFocus: 'Diálogo interactivo, recíproco e informal.',
        examples: ['We talked about our weekend for hours.'],
      },
    ],
    exercises: [
      {
        id: 'ex_st_01',
        sentenceWithBlank: 'Could you please ___ me where the conference room is?',
        targetVerb: 'tell',
        options: ['tell', 'say', 'speak', 'talk'],
        explanationEs: 'Lleva receptor directo ("me"), lo que exige obligatoriamente "tell me". "Say me" es agramatical.',
        contextTag: 'Receptor Explícito',
      },
      {
        id: 'ex_st_02',
        sentenceWithBlank: 'He ___ that he was satisfied with the new architecture.',
        targetVerb: 'said',
        options: ['said', 'told', 'spoke', 'talked'],
        explanationEs: 'Va seguido directamente de una cláusula subordinada "that", sin objeto de persona. Se usa "said".',
        contextTag: 'Cláusula Declarativa',
      },
    ],
  },
  {
    id: 'poly_hear_listen',
    pairKey: 'HEAR_LISTEN',
    title: 'Hear vs Listen to (Oír vs Escuchar)',
    coreDistinctionEs: 'HEAR es la percepción sensorial involuntaria del oído. LISTEN (TO) es la atención activa y deliberada.',
    verbGuidelines: [
      {
        verb: 'hear',
        syntacticStructure: 'hear + [sonido / rumor]',
        semanticFocus: 'Recepción biológica pasiva sin esfuerzo deliberado.',
        examples: ['Did you hear that strange noise?', 'I heard she got promoted.'],
      },
      {
        verb: 'listen',
        syntacticStructure: 'listen + to + [objeto]',
        semanticFocus: 'Acción voluntaria y focalizada de atención auditiva.',
        examples: ['Please listen to the teacher.', 'I love listening to jazz.'],
      },
    ],
    exercises: [
      {
        id: 'ex_hl_01',
        sentenceWithBlank: 'Did you ___ that thunder last night? It woke me up.',
        targetVerb: 'hear',
        options: ['hear', 'listen to', 'listen', 'hear to'],
        explanationEs: 'Fue un estímulo auditivo repentino e involuntario: "hear that thunder".',
        contextTag: 'Percepción Pasiva',
      },
      {
        id: 'ex_hl_02',
        sentenceWithBlank: 'You should always ___ your legal advisor before signing.',
        targetVerb: 'listen to',
        options: ['listen to', 'hear', 'hear to', 'listen of'],
        explanationEs: 'Prestar atención y seguir consejo voluntariamente: "listen to".',
        contextTag: 'Atención Deliberada',
      },
    ],
  },
  {
    id: 'poly_see_look_watch',
    pairKey: 'SEE_LOOK_WATCH',
    title: 'See vs Look (at) vs Watch (Ver / Mirar)',
    coreDistinctionEs: 'SEE es percepción visual natural. LOOK AT es enfocar la vista en un punto fijo. WATCH es seguir algo en movimiento o evolución temporal.',
    verbGuidelines: [
      {
        verb: 'see',
        syntacticStructure: 'see + [objeto visual]',
        semanticFocus: 'Entrada visual pasiva que llega a los ojos.',
        examples: ['I can see the mountains from here.', 'I saw John yesterday.'],
      },
      {
        verb: 'look at',
        syntacticStructure: 'look at + [foco estático]',
        semanticFocus: 'Dirigir la mirada conscientemente hacia un punto.',
        examples: ['Look at this photograph.', 'Look at the whiteboard.'],
      },
      {
        verb: 'watch',
        syntacticStructure: 'watch + [evento dinámico / pantalla]',
        semanticFocus: 'Monitorear un proceso en movimiento a lo largo del tiempo.',
        examples: ['Watch a movie', 'Watch a football game', 'Watch your step'],
      },
    ],
    exercises: [
      {
        id: 'ex_slw_01',
        sentenceWithBlank: 'Let’s stay home tonight and ___ a documentary on Netflix.',
        targetVerb: 'watch',
        options: ['watch', 'see', 'look at', 'look'],
        explanationEs: 'Seguimiento de un contenido audiovisual en movimiento: "watch a documentary".',
        contextTag: 'Pantalla Dinámica',
      },
    ],
  },
  {
    id: 'poly_borrow_lend',
    pairKey: 'BORROW_LEND',
    title: 'Borrow vs Lend (Pedir prestado vs Prestar)',
    coreDistinctionEs: 'BORROW (from) es recibir algo prestado (movimiento hacia ti). LEND (to) es dar algo prestado a otro (movimiento hacia afuera).',
    verbGuidelines: [
      {
        verb: 'borrow',
        syntacticStructure: 'borrow + [cosa] + (from someone)',
        semanticFocus: 'Tomar temporalmente con permiso.',
        examples: ['Can I borrow your laptop for an hour?', 'He borrowed money from the bank.'],
      },
      {
        verb: 'lend',
        syntacticStructure: 'lend + [persona] + [cosa] / lend [cosa] to [persona]',
        semanticFocus: 'Otorgar en préstamo.',
        examples: ['I can lend you my car.', 'The bank lent them fifty thousand dollars.'],
      },
    ],
    exercises: [
      {
        id: 'ex_bl_01',
        sentenceWithBlank: 'Could I ___ your phone charger for a few minutes?',
        targetVerb: 'borrow',
        options: ['borrow', 'lend', 'loan to', 'borrow to'],
        explanationEs: 'Estás pidiendo recibir el cargador: "borrow your charger".',
        contextTag: 'Movimiento Entrante',
      },
    ],
  },
  {
    id: 'poly_win_earn_gain',
    pairKey: 'WIN_EARN_GAIN',
    title: 'Win vs Earn vs Gain (Ganar)',
    coreDistinctionEs: 'WIN es ganar una competencia o juego de azar. EARN es percibir fruto del trabajo o mérito. GAIN es incremento cuantitativo de una cualidad o medida.',
    verbGuidelines: [
      {
        verb: 'win',
        syntacticStructure: 'win + [premio / competencia / lotería]',
        semanticFocus: 'Triunfar frente a oponentes o por azar.',
        examples: ['win the championship', 'win the lottery', 'win a prize'],
      },
      {
        verb: 'earn',
        syntacticStructure: 'earn + [salario / respeto / reputación]',
        semanticFocus: 'Recibir retribución directa por esfuerzo o servicio.',
        examples: ['earn a good salary', 'earn trust', 'earn a living'],
      },
      {
        verb: 'gain',
        syntacticStructure: 'gain + [peso / experiencia / velocidad / conocimiento]',
        semanticFocus: 'Aumento gradual o acumulativo.',
        examples: ['gain valuable experience', 'gain weight', 'gain momentum'],
      },
    ],
    exercises: [
      {
        id: 'ex_weg_01',
        sentenceWithBlank: 'Working on open-source projects helped him ___ valuable experience.',
        targetVerb: 'gain',
        options: ['gain', 'win', 'earn', 'obtain to'],
        explanationEs: 'Para experiencia, peso, velocidad o conocimiento acumulativo se usa "gain".',
        contextTag: 'Acumulación Gradual',
      },
    ],
  },
  {
    id: 'poly_miss_lose',
    pairKey: 'MISS_LOSE',
    title: 'Miss vs Lose (Perder)',
    coreDistinctionEs: 'MISS es no alcanzar un transporte, plazo u oportunidad, o extrañar a alguien. LOSE es dejar de poseer un objeto físico o perder una partida.',
    verbGuidelines: [
      {
        verb: 'miss',
        syntacticStructure: 'miss + [transporte / oportunidad / evento / persona]',
        semanticFocus: 'Llegar tarde o sentir la ausencia afectiva.',
        examples: ['miss the train', 'miss the deadline', 'miss a chance', 'I miss my family'],
      },
      {
        verb: 'lose',
        syntacticStructure: 'lose + [objeto físico / dinero / partido / paciencia]',
        semanticFocus: 'Extraviar posesión o ser derrotado.',
        examples: ['lose my keys', 'lose money', 'lose the match', 'lose patience'],
      },
    ],
    exercises: [
      {
        id: 'ex_ml_01',
        sentenceWithBlank: 'If we don’t leave now, we are going to ___ our flight.',
        targetVerb: 'miss',
        options: ['miss', 'lose', 'drop', 'waste'],
        explanationEs: 'Para vuelos, trenes o autobuses no alcanzados a tiempo se usa "miss", nunca "lose".',
        contextTag: 'Transporte No Alcanzado',
      },
    ],
  },
];

export class PolysemyDisambiguator {
  private readonly catalog: PolysemicPairItem[];

  constructor(customCatalog?: PolysemicPairItem[]) {
    this.catalog = customCatalog ?? POLYSEMIC_PAIRS_CATALOG;
  }

  public getCatalog(): PolysemicPairItem[] {
    return [...this.catalog];
  }

  public getPairByKey(key: PolysemicPairKey): PolysemicPairItem | undefined {
    return this.catalog.find((p) => p.pairKey === key);
  }

  /**
   * Evaluates an exercise for a polysemic pair.
   */
  public evaluateExercise(
    exercise: PolysemicExercise,
    selectedOption: string,
  ): { isCorrect: boolean; explanationEs: string } {
    const isCorrect = selectedOption.trim().toLowerCase() === exercise.targetVerb.trim().toLowerCase();
    const explanationEs = isCorrect
      ? `¡Correcto! ${exercise.explanationEs}`
      : `Opción incorrecta. La respuesta adecuada es "${exercise.targetVerb}". ${exercise.explanationEs}`;

    return {
      isCorrect,
      explanationEs,
    };
  }
}

export const polysemyDisambiguator = new PolysemyDisambiguator();
