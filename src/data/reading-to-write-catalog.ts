export type ReadingTopicCategory =
  | 'SHORT_STORIES'
  | 'TECH_INNOVATION'
  | 'WORKPLACE_DILEMMAS'
  | 'HABITS_PSYCHOLOGY'
  | 'CULTURE_TRAVEL';

export type WritingMissionType = 'SUMMARY' | 'OPINION' | 'QUESTIONS' | 'CONTINUATION';

export interface WritingMission {
  type: WritingMissionType;
  titleEs: string;
  instructionsEs: string;
  suggestedOpening?: string;
  suggestedWordRange: { min: number; max: number };
}

export interface ReadingItem {
  id: string;
  title: string;
  cefrLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
  category: ReadingTopicCategory;
  categoryLabelEs: string;
  readingTimeMin: number;
  wordCount: number;
  readingTextEn: string;
  readingSummaryEs: string;
  keyVocabulary: Array<{ word: string; translationEs: string; partOfSpeech?: string }>;
  comprehensionQuestions: Array<{ questionEn: string; questionEs: string }>;
  writingMissions: WritingMission[];
}

export const READING_TO_WRITE_CATALOG: ReadingItem[] = [
  // 1. A1: The Rainy Sunday Cafe (Short Story / Daily Routine)
  {
    id: 'reading_a1_sunday_cafe',
    title: 'The Rainy Sunday Cafe',
    cefrLevel: 'A1',
    category: 'SHORT_STORIES',
    categoryLabelEs: 'Relatos Cotidianos',
    readingTimeMin: 2,
    wordCount: 88,
    readingTextEn: `Every Sunday morning, Lucas visits a small bakery downtown. It is raining today, and the streets are very quiet. He orders a warm black coffee and a fresh blueberry muffin. 

He sits by the big window with a book. A stray cat sleeps peacefully near the door. The bakery smells like cinnamon and chocolate. Lucas smiles because he loves quiet mornings. After one hour, the rain stops, and the sun appears behind the clouds.`,
    readingSummaryEs:
      'Lucas visita una pequeña panadería un domingo lluvioso, pide un café y disfruta de una mañana tranquila leyendo cerca de la ventana.',
    keyVocabulary: [
      { word: 'bakery', translationEs: 'panadería', partOfSpeech: 'NOUN' },
      { word: 'quiet', translationEs: 'tranquilo / silencioso', partOfSpeech: 'ADJECTIVE' },
      { word: 'fresh', translationEs: 'fresco / recién hecho', partOfSpeech: 'ADJECTIVE' },
      { word: 'peacefully', translationEs: 'pacíficamente', partOfSpeech: 'ADVERB' },
    ],
    comprehensionQuestions: [
      {
        questionEn: 'What does Lucas order at the bakery?',
        questionEs: '¿Qué pide Lucas en la panadería?',
      },
      {
        questionEn: 'How does the weather change at the end?',
        questionEs: '¿Cómo cambia el clima al final?',
      },
    ],
    writingMissions: [
      {
        type: 'SUMMARY',
        titleEs: 'Misión 1: Resumen Simple',
        instructionsEs:
          'Resume lo que hace Lucas y cómo es la cafetería en 3 oraciones sencillas usando tus propias palabras.',
        suggestedOpening: 'Lucas visits a small bakery on Sunday...',
        suggestedWordRange: { min: 25, max: 55 },
      },
      {
        type: 'OPINION',
        titleEs: 'Misión 2: Tu Domingo Ideal',
        instructionsEs:
          '¿Prefieres salir un domingo lluvioso o quedarte en casa? Explica por qué te gusta.',
        suggestedOpening: 'On rainy days, I usually prefer...',
        suggestedWordRange: { min: 30, max: 60 },
      },
    ],
  },

  // 2. A2: The Lost Passport in Lisbon (Travel Anecdote)
  {
    id: 'reading_a2_lisbon_passport',
    title: 'The Lost Passport in Lisbon',
    cefrLevel: 'A2',
    category: 'CULTURE_TRAVEL',
    categoryLabelEs: 'Viajes y Aventuras',
    readingTimeMin: 3,
    wordCount: 135,
    readingTextEn: `Last summer, Elena traveled to Lisbon for a photography project. On her second day, she took the famous yellow tram number 28 up the steep hill. When she arrived at the scenic lookout, she wanted to buy a bottle of water. She opened her backpack, but her passport was missing. 

Panic started to set in. She remembered sitting next to an elderly man with a basket of fresh oranges. Fortunately, when she hurried back to the tram stop, the friendly conductor was waiting for her. He was holding her small blue document with a kind smile. Elena thanked him warmly and bought him an espresso.`,
    readingSummaryEs:
      'Elena pierde su pasaporte en el tranvía de Lisboa, pero el conductor lo encuentra y se lo devuelve cuando ella regresa a buscarlo.',
    keyVocabulary: [
      { word: 'steep', translationEs: 'empinado / empinada', partOfSpeech: 'ADJECTIVE' },
      { word: 'missing', translationEs: 'desaparecido / extraviado', partOfSpeech: 'ADJECTIVE' },
      { word: 'fortunately', translationEs: 'afortunadamente', partOfSpeech: 'ADVERB' },
      { word: 'hurried', translationEs: 'se apresuró', partOfSpeech: 'VERB' },
    ],
    comprehensionQuestions: [
      {
        questionEn: 'Where did Elena realize her passport was missing?',
        questionEs: '¿Dónde se dio cuenta Elena de que le faltaba su pasaporte?',
      },
      {
        questionEn: 'How did the tram conductor react when Elena returned?',
        questionEs: '¿Cómo reaccionó el conductor del tranvía cuando Elena regresó?',
      },
    ],
    writingMissions: [
      {
        type: 'SUMMARY',
        titleEs: 'Misión 1: Resumen de la Historia',
        instructionsEs:
          'Explica qué problema tuvo Elena y cómo se resolvió en 3-4 oraciones en pasado simple.',
        suggestedOpening: 'Elena lost her passport while she was traveling in Lisbon...',
        suggestedWordRange: { min: 35, max: 70 },
      },
      {
        type: 'OPINION',
        titleEs: 'Misión 2: Tu Experiencia de Viaje',
        instructionsEs:
          '¿Alguna vez perdiste algo importante durante un viaje o una salida? Cuenta la anécdota o qué harías en esa situación.',
        suggestedOpening: 'If I lost my passport in another country, I would...',
        suggestedWordRange: { min: 40, max: 80 },
      },
    ],
  },

  // 3. B1: The Silent Deployment Bug (Tech & Workplace)
  {
    id: 'reading_b1_deployment_bug',
    title: 'The Silent Deployment Bug',
    cefrLevel: 'B1',
    category: 'TECH_INNOVATION',
    categoryLabelEs: 'Tecnología & Ingeniería',
    readingTimeMin: 3,
    wordCount: 172,
    readingTextEn: `It was Friday afternoon at 4:30 PM. The engineering team decided to deploy a seemingly minor patch to the user authentication service before leaving for the weekend. The unit tests passed successfully, and everyone logged off with confidence. 

Two hours later, customer support started receiving urgent messages: users in Europe could not sign in to their mobile applications. It turned out that a new database index had caused high database latency under sudden traffic spikes. 

David, the senior developer on call, opened his laptop from a family dinner. Instead of panicking or blaming his junior colleague who authored the pull request, David quickly rolled back the change. On Monday, the team conducted a blameless post-mortem meeting to implement automated load testing for all future database migrations.`,
    readingSummaryEs:
      'Un equipo despliega un cambio un viernes por la tarde que provoca fallos de autenticación. El desarrollador de guardia revierte el cambio y el equipo realiza una autopsia sin culpables para mejorar las pruebas.',
    keyVocabulary: [
      { word: 'patch', translationEs: 'parche / corrección menor', partOfSpeech: 'NOUN' },
      { word: 'roll back', translationEs: 'revertir un despliegue', partOfSpeech: 'VERB' },
      { word: 'blameless', translationEs: 'sin buscar culpables / constructivo', partOfSpeech: 'ADJECTIVE' },
      { word: 'latency', translationEs: 'latencia / retraso', partOfSpeech: 'NOUN' },
    ],
    comprehensionQuestions: [
      {
        questionEn: 'Why was deploying at 4:30 PM on a Friday a risky decision?',
        questionEs: '¿Por qué desplegar a las 4:30 PM un viernes fue una decisión arriesgada?',
      },
      {
        questionEn: 'How did David handle the incident with his teammates?',
        questionEs: '¿Cómo manejó David el incidente con sus compañeros?',
      },
    ],
    writingMissions: [
      {
        type: 'SUMMARY',
        titleEs: 'Misión 1: Resumen y Causa Raíz',
        instructionsEs:
          'Explica qué causó el problema técnico y cómo reaccionó el equipo para solucionarlo y aprender.',
        suggestedOpening: 'The team encountered an outage because a database index caused...',
        suggestedWordRange: { min: 45, max: 85 },
      },
      {
        type: 'OPINION',
        titleEs: 'Misión 2: Opinión Profesional',
        instructionsEs:
          '¿Estás de acuerdo con la regla de "nunca desplegar los viernes"? Argumenta tu opinión sobre las políticas de despliegue en ingeniería.',
        suggestedOpening: 'In my opinion, deploying on Friday afternoon is always risky because...',
        suggestedWordRange: { min: 50, max: 95 },
      },
    ],
  },

  // 4. B1: The 20-Minute Focus Ritual (Habits & Productivity)
  {
    id: 'reading_b1_focus_ritual',
    title: 'The 20-Minute Focus Ritual',
    cefrLevel: 'B1',
    category: 'HABITS_PSYCHOLOGY',
    categoryLabelEs: 'Hábitos & Psicología',
    readingTimeMin: 3,
    wordCount: 165,
    readingTextEn: `Many knowledge workers struggle with digital distractions. Between notifications, instant messages, and open browser tabs, the average worker switches tasks every three minutes. This fragmentation prevents deep cognitive focus.

Cognitive scientist Dr. Aris Thorne proposes a simple habit called "The 20-Minute Anchor". Every morning, before opening email or social networks, you choose exactly one challenging task. You put your phone in another room, set a physical timer for twenty minutes, and work exclusively on that problem.

Most people notice that starting is the hardest part. Once twenty minutes pass, dopamine kicks in, and the brain enters a state of natural momentum. Even if you stop after the timer rings, you have completed the most meaningful step of your workday without mental fatigue.`,
    readingSummaryEs:
      'La fragmentación digital interrumpe el trabajo profundo. La técnica del ancla de 20 minutos propone trabajar sin distracciones antes de abrir el correo para activar el impulso cognitivo.',
    keyVocabulary: [
      { word: 'distraction', translationEs: 'distracción', partOfSpeech: 'NOUN' },
      { word: 'fragmentation', translationEs: 'fragmentación', partOfSpeech: 'NOUN' },
      { word: 'momentum', translationEs: 'impulso / inercia positiva', partOfSpeech: 'NOUN' },
      { word: 'fatigue', translationEs: 'fatiga / cansancio mental', partOfSpeech: 'NOUN' },
    ],
    comprehensionQuestions: [
      {
        questionEn: 'According to the text, why do workers switch tasks frequently?',
        questionEs: 'Según el texto, ¿por qué los trabajadores cambian de tarea con frecuencia?',
      },
      {
        questionEn: 'What is the psychological effect of completing the first twenty minutes?',
        questionEs: '¿Cuál es el efecto psicológico de completar los primeros veinte minutos?',
      },
    ],
    writingMissions: [
      {
        type: 'SUMMARY',
        titleEs: 'Misión 1: Síntesis del Método',
        instructionsEs:
          'Resume cómo funciona la regla de los 20 minutos y por qué resulta efectiva contra las distracciones.',
        suggestedOpening: 'The 20-minute anchor technique helps people avoid distractions by...',
        suggestedWordRange: { min: 40, max: 80 },
      },
      {
        type: 'OPINION',
        titleEs: 'Misión 2: Tu Propia Rutina de Concentración',
        instructionsEs:
          'Describe qué técnica utilizas para concentrarte al estudiar o trabajar y si este método te serviría.',
        suggestedOpening: 'When I need to focus deeply on my studies, I usually...',
        suggestedWordRange: { min: 50, max: 90 },
      },
    ],
  },

  // 5. B2: The Remote Collaboration Dilemma (Workplace Dilemmas)
  {
    id: 'reading_b2_remote_dilemma',
    title: 'The Remote Collaboration Dilemma',
    cefrLevel: 'B2',
    category: 'WORKPLACE_DILEMMAS',
    categoryLabelEs: 'Debates Laborales',
    readingTimeMin: 4,
    wordCount: 215,
    readingTextEn: `When tech startup NovaSoft transitioned to a permanent remote-first model, productivity initially soared. Developers reported fewer interruptions, and commuting stress was completely eliminated. However, twelve months later, leadership noticed subtle cracks in team cohesion.

Junior engineers were hesitating to ask spontaneous questions because sending a Slack direct message felt too formal compared to tapping a colleague on the shoulder. Meanwhile, cross-functional innovation—which often occurred during serendipitous hallway conversations—declined markedly.

To address this friction, the company implemented "virtual watercoolers" and structured apprenticeship pairings. Still, employees were divided. Introverted team members praised the asynchronous freedom, whereas collaborative designers argued that virtual whiteboards could never replicate the tactile synergy of being in the same room. The fundamental challenge was finding equilibrium between individual autonomy and collective belonging.`,
    readingSummaryEs:
      'El trabajo remoto aumentó la productividad inicial, pero redujo las interacciones espontáneas y la tutoría a juniors. La empresa debate cómo equilibrar autonomía y sinergia colaborativa.',
    keyVocabulary: [
      { word: 'soared', translationEs: 'se disparó / subió rápidamente', partOfSpeech: 'VERB' },
      { word: 'serendipitous', translationEs: 'casual / fortuito y afortunado', partOfSpeech: 'ADJECTIVE' },
      { word: 'equilibrium', translationEs: 'equilibrio / balance', partOfSpeech: 'NOUN' },
      { word: 'replicate', translationEs: 'replicar / reproducir', partOfSpeech: 'VERB' },
    ],
    comprehensionQuestions: [
      {
        questionEn: 'What specific drawbacks emerged after twelve months of remote work?',
        questionEs: '¿Qué inconvenientes concretos surgieron tras doce meses de trabajo remoto?',
      },
      {
        questionEn: 'Why did junior developers struggle more than senior colleagues?',
        questionEs: '¿Por qué los desarrolladores junior tuvieron más dificultades que los seniors?',
      },
    ],
    writingMissions: [
      {
        type: 'OPINION',
        titleEs: 'Misión 1: Argumentación y Postura',
        instructionsEs:
          '¿Crees que el modelo híbrido o el 100% remoto es superior para el crecimiento profesional de los recién graduados? Justifica tu respuesta.',
        suggestedOpening: 'While remote work provides unmatched flexibility, I believe that...',
        suggestedWordRange: { min: 55, max: 110 },
      },
      {
        type: 'SUMMARY',
        titleEs: 'Misión 2: Síntesis Ejecutiva',
        instructionsEs:
          'Resume las tensiones descritas en el artículo y las medidas que tomó la empresa en un párrafo cohesivo.',
        suggestedOpening: 'Although remote work enhanced initial productivity, NovaSoft faced...',
        suggestedWordRange: { min: 50, max: 95 },
      },
    ],
  },

  // 6. C1: The Illusion of Algorithmic Objectivity (Tech & Society)
  {
    id: 'reading_c1_algorithmic_bias',
    title: 'The Illusion of Algorithmic Objectivity',
    cefrLevel: 'C1',
    category: 'TECH_INNOVATION',
    categoryLabelEs: 'Tecnología Avanzada & Crítica',
    readingTimeMin: 4,
    wordCount: 238,
    readingTextEn: `In modern decision-making systems, algorithms are frequently endowed with an aura of mathematical impartiality. Automated credit scoring, hiring screeners, and predictive policing models are marketed as antidotes to capricious human prejudice. Yet this perceived neutrality is fundamentally deceptive.

Machine learning models do not operate in a moral vacuum; rather, they are historical mirrors. When training data reflects decades of systemic societal disparities, an optimization algorithm will rigorously institutionalize those historical imbalances under the guise of statistical probability. Far from eliminating bias, automated systems often obscure it beneath layers of impenetrable algebraic complexity.

Addressing this cognitive trap necessitates moving beyond naive mathematical validation towards interdisciplinary algorithmic auditing. Technologists must collaborate with ethicists, sociologists, and domain specialists to scrutinize proxy variables and interrogate whether an efficiency metric inadvertently reinforces historical inequities. True technological sophistication requires recognizing that no code is truly neutral.`,
    readingSummaryEs:
      'Los algoritmos se perciben erróneamente como imparciales. Al alimentarse de datos históricos sesgados, perpetúan desigualdades bajo apariencia estadística, exigiendo auditorías éticas interdisciplinarias.',
    keyVocabulary: [
      { word: 'impartiality', translationEs: 'imparcialidad / neutralidad', partOfSpeech: 'NOUN' },
      { word: 'capricious', translationEs: 'caprichoso / impredecible', partOfSpeech: 'ADJECTIVE' },
      { word: 'institutionalize', translationEs: 'institucionalizar', partOfSpeech: 'VERB' },
      { word: 'scrutinize', translationEs: 'examinar minuciosamente', partOfSpeech: 'VERB' },
    ],
    comprehensionQuestions: [
      {
        questionEn: 'How does historical training data distort supposedly objective machine learning models?',
        questionEs: '¿Cómo distorsionan los datos históricos de entrenamiento a modelos supuestamente objetivos?',
      },
      {
        questionEn: 'What interdisciplinary approach does the author recommend to audit algorithms?',
        questionEs: '¿Qué enfoque interdisciplinario recomienda el autor para auditar algoritmos?',
      },
    ],
    writingMissions: [
      {
        type: 'OPINION',
        titleEs: 'Misión 1: Ensayo Crítico Argumentativo',
        instructionsEs:
          'Analiza si es posible crear sistemas de IA completamente éticos o si todo software inevitablemente hereda los valores de sus creadores.',
        suggestedOpening: 'The presumption that algorithms represent objective arbiters of reality is flawed because...',
        suggestedWordRange: { min: 70, max: 140 },
      },
      {
        type: 'SUMMARY',
        titleEs: 'Misión 2: Síntesis Analítica',
        instructionsEs:
          'Resume la tesis central del autor y su advertencia sobre la complejidad algebraica que oculta sesgos históricos.',
        suggestedOpening: 'The text highlights the deceptive nature of algorithmic neutrality, asserting that...',
        suggestedWordRange: { min: 60, max: 120 },
      },
    ],
  },
];
