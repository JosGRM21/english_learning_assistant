export type WritingTopicCategory =
  | 'WORK_BUSINESS'
  | 'TECHNOLOGY'
  | 'DAILY_LIFE'
  | 'OPINION_ARGUMENT'
  | 'L1_INTERFERENCE_CHALLENGES';

export interface WritingPromptItem {
  id: string;
  title: string;
  category: WritingTopicCategory;
  categoryLabelEs: string;
  cefrLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
  promptText: string;
  suggestedWordRange: { min: number; max: number };
  sampleOpening?: string;
  suggestedVocabulary: string[];
  pedagogicalFocusEs: string;
}

export const WRITING_PROMPTS_CATALOG: WritingPromptItem[] = [
  // --- L1 INTERFERENCE CHALLENGES ---
  {
    id: 'l1_prep_depend',
    title: 'Desafío L1: Dependencias y Acuerdos',
    category: 'L1_INTERFERENCE_CHALLENGES',
    categoryLabelEs: 'Trampas L1 del Español',
    cefrLevel: 'B1',
    promptText:
      'Explica una situación de tu trabajo o estudio donde estés completamente de acuerdo con tu equipo, pero los resultados finales dependan del presupuesto del cliente.',
    suggestedWordRange: { min: 35, max: 80 },
    sampleOpening: 'I completely agree with my team regarding...',
    suggestedVocabulary: ['agree with', 'depend on', 'budget', 'timeline', 'decision'],
    pedagogicalFocusEs:
      'Evitar "I am agree" y "depend of". Usar "agree with" y "depend on" naturalmente.',
  },
  {
    id: 'l1_false_friends',
    title: 'Desafío L1: Falsos Amigos en el Trabajo',
    category: 'L1_INTERFERENCE_CHALLENGES',
    categoryLabelEs: 'Trampas L1 del Español',
    cefrLevel: 'B2',
    promptText:
      'Describe en qué estás trabajando actualmente y aclara un malentendido reciente con un colega que en realidad fue muy fácil de resolver.',
    suggestedWordRange: { min: 45, max: 90 },
    sampleOpening: 'Currently, I am working on improving...',
    suggestedVocabulary: ['currently', 'actually', 'realize', 'resolve', 'misunderstanding'],
    pedagogicalFocusEs:
      'Diferenciar "currently" (actualmente) de "actually" (en realidad/de hecho).',
  },
  {
    id: 'l1_preposition_reflex',
    title: 'Desafío L1: Preposiciones Dependientes',
    category: 'L1_INTERFERENCE_CHALLENGES',
    categoryLabelEs: 'Trampas L1 del Español',
    cefrLevel: 'B1',
    promptText:
      'Describe una habilidad en la que eres muy bueno, a qué tipo de música te gusta prestar atención mientras trabajas, y con qué proyecto sueñas en el futuro.',
    suggestedWordRange: { min: 40, max: 85 },
    sampleOpening: 'I am particularly good at...',
    suggestedVocabulary: ['good at', 'listen to', 'dream about', 'focus on', 'skill'],
    pedagogicalFocusEs:
      'Practicar colocaciones preposicionales fijas: "good at" (no good in), "listen to" (no listen), "dream of/about" (no dream with).',
  },

  // --- WORK & BUSINESS ---
  {
    id: 'work_standup_update',
    title: 'Slack Daily Standup Update',
    category: 'WORK_BUSINESS',
    categoryLabelEs: 'Trabajo y Negocios',
    cefrLevel: 'B1',
    promptText:
      'Escribe tu actualización para la reunión diaria de standup: qué completaste ayer, en qué estás trabajando hoy y si tienes algún bloqueo.',
    suggestedWordRange: { min: 30, max: 70 },
    sampleOpening: 'Yesterday I finished implementing...',
    suggestedVocabulary: ['finished', 'currently working on', 'blocker', 'deploy', 'pull request'],
    pedagogicalFocusEs:
      'Alternar adecuadamente entre Past Simple (Yesterday I finished) y Present Continuous (Today I am working on).',
  },
  {
    id: 'work_pr_review_feedback',
    title: 'Code Review & Pull Request Feedback',
    category: 'WORK_BUSINESS',
    categoryLabelEs: 'Trabajo y Negocios',
    cefrLevel: 'B2',
    promptText:
      'Escribe una revisión cordial pero técnica para el Pull Request de un colega. Felicítalo por su refactorización pero advierte un posible cuello de botella en una consulta a base de datos.',
    suggestedWordRange: { min: 45, max: 100 },
    sampleOpening: 'Great job on this refactoring! However, I noticed that...',
    suggestedVocabulary: ['refactor', 'bottleneck', 'latency', 'query optimization', 'consider'],
    pedagogicalFocusEs:
      'Uso de condicionales suaves y modal verbs para sugerencias diplomáticas (might, could, should consider).',
  },
  {
    id: 'work_client_delay_notice',
    title: 'Notificación de Retraso a Cliente',
    category: 'WORK_BUSINESS',
    categoryLabelEs: 'Trabajo y Negocios',
    cefrLevel: 'C1',
    promptText:
      'Comunica a un cliente o stakeholder que una entrega se retrasará 48 horas debido a pruebas exhaustivas de seguridad. Mantén un tono formal, tranquilizador y profesional.',
    suggestedWordRange: { min: 60, max: 120 },
    sampleOpening: 'I am writing to provide an update regarding the delivery schedule...',
    suggestedVocabulary: ['unforeseen', 'due to', 'comprehensive testing', 'assure you', 'mitigate'],
    pedagogicalFocusEs:
      'Registro formal, conectores avanzados de causa-efecto y cortesía empresarial.',
  },

  // --- TECHNOLOGY ---
  {
    id: 'tech_bug_report',
    title: 'Reporte Técnico de Bug en Producción',
    category: 'TECHNOLOGY',
    categoryLabelEs: 'Tecnología e Ingeniería',
    cefrLevel: 'B1',
    promptText:
      'Describe un incidente reciente: qué error observaron los usuarios al autenticarse, cuál fue la causa raíz identificada y cómo se mitigó.',
    suggestedWordRange: { min: 40, max: 90 },
    sampleOpening: 'We encountered an authentication error when users tried to...',
    suggestedVocabulary: ['encounter', 'root cause', 'failure', 'patch', 'mitigate'],
    pedagogicalFocusEs:
      'Secuenciación temporal precisa con voz activa y pasiva en contextos de ingeniería de software.',
  },
  {
    id: 'tech_arch_decision',
    title: 'Decisión de Arquitectura: Monolito vs Microservicios',
    category: 'TECHNOLOGY',
    categoryLabelEs: 'Tecnología e Ingeniería',
    cefrLevel: 'B2',
    promptText:
      'Justifica brevemente por qué tu equipo decidió mantener una arquitectura monolítica modular en lugar de dividirla inmediatamente en microservicios.',
    suggestedWordRange: { min: 50, max: 110 },
    sampleOpening: 'Our team chose to retain a modular monolith because...',
    suggestedVocabulary: ['modular monolith', 'overhead', 'complexity', 'scalability', 'trade-off'],
    pedagogicalFocusEs:
      'Expresión de argumentos contrastivos y vocabulario técnico conceptual.',
  },

  // --- DAILY LIFE & REFLECTIONS ---
  {
    id: 'life_weekend_recharge',
    title: 'Planes de Desconexión de Fin de Semana',
    category: 'DAILY_LIFE',
    categoryLabelEs: 'Vida Cotidiana',
    cefrLevel: 'A2',
    promptText:
      'Cuéntale a un amigo qué actividades relajantes tienes planeadas para este fin de semana después de una intensa semana de trabajo.',
    suggestedWordRange: { min: 30, max: 65 },
    sampleOpening: 'This weekend, I am planning to...',
    suggestedVocabulary: ['relax', 'unwind', 'spend time with', 'outdoors', 'recharge'],
    pedagogicalFocusEs:
      'Uso de "going to" / "planning to" para intenciones futuras y vocabulario de ocio.',
  },
  {
    id: 'life_learning_habit',
    title: 'Reflexión: Hábitos de Aprendizaje',
    category: 'DAILY_LIFE',
    categoryLabelEs: 'Vida Cotidiana',
    cefrLevel: 'B1',
    promptText:
      'Explica qué rutina diaria sigues para practicar tu inglés y qué técnica te ha resultado más efectiva hasta ahora.',
    suggestedWordRange: { min: 40, max: 85 },
    sampleOpening: 'In order to improve my English, I try to dedicate...',
    suggestedVocabulary: ['consistent', 'deliberate practice', 'routine', 'progress', 'effective'],
    pedagogicalFocusEs:
      'Uso de adverbios de frecuencia, conectores de propósito (in order to, so that) y presente simple habitual.',
  },

  // --- OPINION & ARGUMENT ---
  {
    id: 'opinion_remote_work',
    title: 'Debate: Trabajo Remoto vs Oficina',
    category: 'OPINION_ARGUMENT',
    categoryLabelEs: 'Opinión y Debate',
    cefrLevel: 'B2',
    promptText:
      '¿Crees que el trabajo 100% remoto es superior al modelo híbrido? Expresa tu punto de vista con al menos dos argumentos sólidos.',
    suggestedWordRange: { min: 50, max: 110 },
    sampleOpening: 'From my perspective, remote work offers significant advantages, yet...',
    suggestedVocabulary: ['from my perspective', 'furthermore', 'on the other hand', 'productivity', 'isolation'],
    pedagogicalFocusEs:
      'Estructuración de párrafos argumentativos con transiciones formales y balance de ideas.',
  },
  {
    id: 'opinion_ai_tools',
    title: 'Impacto de la IA en la Creatividad Humana',
    category: 'OPINION_ARGUMENT',
    categoryLabelEs: 'Opinión y Debate',
    cefrLevel: 'C1',
    promptText:
      'Analiza cómo las herramientas de IA generativa están transformando el proceso creativo. ¿Potencian o atrofian el pensamiento crítico?',
    suggestedWordRange: { min: 65, max: 130 },
    sampleOpening: 'The rapid proliferation of generative AI tools has ignited a pivotal debate...',
    suggestedVocabulary: ['proliferation', 'augment', 'critical inquiry', 'complacency', 'indispensable'],
    pedagogicalFocusEs:
      'Léxico avanzado de nivel C1, matices semánticos y subordinación sintáctica compleja.',
  },
];
