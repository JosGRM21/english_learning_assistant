export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';

export interface DiscourseConnector {
  phrase: string;
  labelEs: string;
  category: string;
  categoryType: 'contrast' | 'cause' | 'addition' | 'sequence' | 'opinion' | 'purpose' | 'synthesis';
  exampleEn?: string;
}

export const CEFR_DESCRIPTIONS: Record<CefrLevel, { name: string; summary: string; detail: string }> = {
  A1: {
    name: 'Principiante',
    summary: 'Oraciones simples y vocabulario de supervivencia cotidiana.',
    detail: 'Estructuras breves, presentes simples, conectores básicos de unión y causa directa.',
  },
  A2: {
    name: 'Elemental',
    summary: 'Descripción de rutinas, gustos y experiencias inmediatas.',
    detail: 'Narraciones sencillas de pasado y futuro, opiniones personales y enumeración básica.',
  },
  B1: {
    name: 'Intermedio',
    summary: 'Comunicación laboral, anécdotas y argumentación básica.',
    detail: 'Conexión coherente de ideas, contraste equilibrado, concesiones y justificación de puntos de vista.',
  },
  B2: {
    name: 'Intermedio Alto',
    summary: 'Fluidez natural, matices semánticos y estilo técnico.',
    detail: 'Discurso elaborado, conectores formales, variedad léxica y alternancia de perspectivas.',
  },
  C1: {
    name: 'Avanzado',
    summary: 'Precisión estilística, colocaciones idiomáticas y cohesión compleja.',
    detail: 'Matices finos de significado, retórica académica, transiciones elegantes y cohesión sin fisuras.',
  },
};

export const DISCOURSE_CONNECTORS: Record<CefrLevel, DiscourseConnector[]> = {
  A1: [
    { phrase: 'and', labelEs: 'y', category: 'Adición', categoryType: 'addition', exampleEn: 'I like coffee and tea.' },
    { phrase: 'but', labelEs: 'pero', category: 'Contraste', categoryType: 'contrast', exampleEn: 'I want to go, but it is raining.' },
    { phrase: 'because', labelEs: 'porque', category: 'Causa', categoryType: 'cause', exampleEn: 'I am happy because I passed.' },
    { phrase: 'so', labelEs: 'así que / por eso', category: 'Consecuencia', categoryType: 'cause', exampleEn: 'I was tired, so I slept early.' },
    { phrase: 'also', labelEs: 'también', category: 'Adición', categoryType: 'addition', exampleEn: 'I can also play the piano.' },
  ],
  A2: [
    { phrase: 'for example', labelEs: 'por ejemplo', category: 'Ejemplificación', categoryType: 'addition', exampleEn: 'I enjoy outdoor sports, for example hiking.' },
    { phrase: 'first of all', labelEs: 'primero que nada', category: 'Orden', categoryType: 'sequence', exampleEn: 'First of all, wash your hands.' },
    { phrase: 'then', labelEs: 'luego / después', category: 'Secuencia', categoryType: 'sequence', exampleEn: 'We ate dinner, then watched a movie.' },
    { phrase: 'finally', labelEs: 'finalmente', category: 'Cierre', categoryType: 'sequence', exampleEn: 'Finally, we arrived at our destination.' },
    { phrase: 'in my opinion', labelEs: 'en mi opinión', category: 'Postura', categoryType: 'opinion', exampleEn: 'In my opinion, this plan works best.' },
  ],
  B1: [
    { phrase: 'however', labelEs: 'sin embargo', category: 'Contraste', categoryType: 'contrast', exampleEn: 'The task was difficult; however, we completed it on time.' },
    { phrase: 'although', labelEs: 'aunque', category: 'Concesión', categoryType: 'contrast', exampleEn: 'Although it was cold, we went for a walk.' },
    { phrase: 'in order to', labelEs: 'para / con el fin de', category: 'Propósito', categoryType: 'purpose', exampleEn: 'I wake up early in order to study.' },
    { phrase: 'therefore', labelEs: 'por lo tanto', category: 'Causa/Efecto', categoryType: 'cause', exampleEn: 'Demand rose, therefore prices increased.' },
    { phrase: 'on the other hand', labelEs: 'por otra parte', category: 'Contraste', categoryType: 'contrast', exampleEn: 'It is cheap; on the other hand, quality is low.' },
    { phrase: 'as a result', labelEs: 'como resultado', category: 'Consecuencia', categoryType: 'cause', exampleEn: 'He trained hard; as a result, he won.' },
  ],
  B2: [
    { phrase: 'furthermore', labelEs: 'es más / además', category: 'Adición formal', categoryType: 'addition', exampleEn: 'The proposal is affordable; furthermore, it saves time.' },
    { phrase: 'nevertheless', labelEs: 'no obstante', category: 'Contraste fuerte', categoryType: 'contrast', exampleEn: 'The risks were high; nevertheless, they persisted.' },
    { phrase: 'whereas', labelEs: 'mientras que', category: 'Comparación', categoryType: 'contrast', exampleEn: 'Some prefer remote work, whereas others value the office.' },
    { phrase: 'despite this', labelEs: 'a pesar de esto', category: 'Concesión', categoryType: 'contrast', exampleEn: 'We faced setbacks; despite this, morale remained high.' },
    { phrase: 'consequently', labelEs: 'consecuentemente', category: 'Causa formal', categoryType: 'cause', exampleEn: 'Costs climbed; consequently, the budget was revised.' },
    { phrase: 'in terms of', labelEs: 'en cuanto a', category: 'Enfoque', categoryType: 'opinion', exampleEn: 'In terms of efficiency, this option is unmatched.' },
  ],
  C1: [
    { phrase: 'notwithstanding', labelEs: 'a pesar de / sin perjuicio de', category: 'Concesión elevada', categoryType: 'contrast', exampleEn: 'Notwithstanding the market volatility, the company expanded.' },
    { phrase: 'subsequently', labelEs: 'posteriormente', category: 'Secuencia', categoryType: 'sequence', exampleEn: 'He finished his degree and subsequently joined our team.' },
    { phrase: 'conversely', labelEs: 'a la inversa / por contra', category: 'Contraste diametral', categoryType: 'contrast', exampleEn: 'Northern regions get ample rain; conversely, the south is arid.' },
    { phrase: 'with regard to', labelEs: 'en lo que respecta a', category: 'Precisión', categoryType: 'opinion', exampleEn: 'With regard to the timeline, we remain ahead of schedule.' },
    { phrase: 'in essence', labelEs: 'en esencia', category: 'Síntesis', categoryType: 'synthesis', exampleEn: 'In essence, the strategy hinges on continuous iteration.' },
  ],
};
