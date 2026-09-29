# Matriz Exhaustiva de Trazabilidad de Requisitos
## English Learning Assistant (ELA)

Esta matriz vincula formalmente cada **Requisito Funcional (RF)** de [`functional_requirements.md`](./functional_requirements.md) con sus **Historias de Usuario (US)**, su **Fundamento Pedagógico Científico** en [`docs/02_pedagogical_framework/`](../02_pedagogical_framework/), las **Entidades del Modelo de Datos** ([`sqlite_schema.sql`](../04_data_models_and_schemas/sqlite_schema.sql)) y el **Componente Arquitectónico** responsable de su implementación ([`c4_system_architecture.md`](../03_architecture_and_design/c4_system_architecture.md)).

---

## 1. Tabla de Trazabilidad Integral

| ID Requisito | Título del Requisito Funcional | Historias de Usuario | Fundamento Pedagógico Científico (Autor / Disciplina) | Entidad de Datos SQLite | Componente / Servicio del Sistema |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RF-VOC-01** | Categorización Léxica (Contenido, Función, Chunks) | US-02, US-04 | *The Lexical Approach* (Michael Lewis, 1993) & *Idiom Principle* (Sinclair) | `vocab_items`, `phraseological_units` | `LexiconModule`, `CatalogService` |
| **RF-VOC-02** | Enriquecimiento Semántico Multidimensional | US-02, US-04 | Modelo de Conocimiento Léxico Integral (Paul Nation, 2001, 2013) | `vocab_items`, `vocab_context_examples` | `LexiconEnricher`, `DictionaryService` |
| **RF-VOC-03** | Ingesta Rápida y Auto-Enriquecimiento con IA | US-02, US-09 | Automatización de intake & *Comprehensible Input* contextual | `vocab_items`, `phraseological_units`, `srs_cards` | `AiVocabularyEnricherService` |
| **RF-VOC-04** | Banco de Contextos Dinámicos y Rotación Cloze | US-02 | Variabilidad Contextual & Dificultades Deseables (Bjork & Bjork, 2011) | `vocab_context_examples` | `ContextRotatorService` |
| **RF-SEM-01** | Entrenador de Movimiento en Marco Satelital | US-12 | *Thinking for Speaking* (Dan Slobin) & *Motion Events* (Leonard Talmy) | `conceptual_motion_verbs` | `ConceptualFramingEngine` |
| **RF-SEM-02** | Laboratorio Topológico de Preposiciones (IN/ON/AT) | US-12 | Semántica Cognitiva & *Image Schemas* (George Lakoff & Mark Johnson) | `topological_schemas` | `PrepositionTopoLabComponent` |
| **RF-SEM-03** | Desmitificador de Pares Polisémicos de Confusión | US-12 | Semántica de Rasgos Distintivos & Prevención de Fosilización | `polysemic_pairs` | `PolysemyDisambiguationService` |
| **RF-SEM-04** | Restricción de Verbos Deslexicalizados | US-02, US-12 | *De-lexicalised Verbs* (Lewis, Sinclair) & Agrupamiento Obligatorio | `phraseological_units` | `LexiconValidator` |
| **RF-PHO-01** | Transcripción Fonética Dual IPA (GA & RP) | US-03 | Conciencia Fonológica & Fonética Contrastiva Internacional | `vocab_items`, `phonetic_rules` | `PhoneticEngine`, `IpaViewerComponent` |
| **RF-PHO-02** | Reproducción Auditiva Multimodal Normal y Lenta | US-03 | *Comprehensible Input* & *Pitch-Preserving Audio Slicing* | `audio_cache`, `tts_profiles` | `AudioPlayerSubsystem` |
| **RF-PHO-03** | Laboratorio Articulatorio & Cuadrilátero Vocálico | US-06 | Fonética Acústica (Formantes F1/F2) & Teoría de Codificación Dual (Paivio) | `vowel_formants_catalog` | `VowelSpaceVisualizer` |
| **RF-PHO-04** | Detector de Voice Onset Time (VOT / Aspiración) | US-06 | Psicoacústica del VOT & Diferenciación de Oclusivas (Lisker & Abramson) | `acoustic_diagnostics` | `VotAspirationTrainer` |
| **RF-PHO-05** | Motor de Reglas de Habla Conectada | US-03 | Fonología Post-léxica & Isocronía Acentual (*Stress-Timed*) | `phonetic_rules` | `ConnectedSpeechEngine` |
| **RF-PHO-06** | Visualizador Semántico con Código de Color | US-03 | Principios Multimedia de Señalización y Redundancia (Richard Mayer) | `connected_speech_segments` | `PhoneticColorVisualizer` |
| **RF-PRO-01** | Entrenador de Acento Nuclear Contrastivo | US-10 | Fonología Suprasegmental e Inteligibilidad (Derwing & Munro, 2015) | `prosody_rules` | `TonicStressEngine` |
| **RF-PRO-02** | Segmentador de Grupos de Pensamiento (Thought Groups) | US-10 | *Thought Groups* & Chunking Prosódico del Discurso | `thought_group_segments` | `SpeechChunkerService` |
| **RF-PRO-03** | Reconocedor de Contornos Melódicos de Entonación | US-10 | Curvas F0 & Funciones Pragmáticas del Tono (Brazil, 1997) | `prosody_rules` | `IntonationContourService` |
| **RF-PRO-04** | Estudio de Prosodic Shadowing con Rastreador F0 | US-10 | *Speech Shadowing* & Biofeedback Acústico Frontotemporal | `prosody_shadowing_records` | `PitchTrackerComponent`, `AudioService` |
| **RF-HVPT-01** | Protocolo HVPT Multi-Hablante (4-6 Voces Nativas) | US-06 | *High-Variability Phonetic Training* (Logan, Lively & Pisoni, 1991) | `hvpt_stimuli_audio` | `HvptAudioBankService` |
| **RF-HVPT-02** | Elección Forzada a Ciegas (Blind Forced-Choice) | US-06 | *Native Language Magnet Theory* (Patricia Kuhl) & PAM-L2 (Best) | `minimal_pairs_exercises` | `MinimalPairsGymComponent` |
| **RF-HVPT-03** | Restricción Temporal Estricta de 2.0 Segundos | US-06 | Categorización Categorial Automática & Tiempo de Reacción Perceptual | `minimal_pairs_sessions` | `ForcedChoiceTimer` |
| **RF-HVPT-04** | Feedback Acústico Espectrográfico Inmediato | US-06 | *Prediction Error* Dopaminérgico & *Speech Learning Model* (Flege) | `weakness_metrics` | `SpectrogramViewer` |
| **RF-TRN-01** | Entrenador de Parámetro de Sujeto Nulo (Dummy It/There) | US-04, US-05 | *Pro-Drop Parameter* & Transferencia L1 Sintáctica (Chomsky, Odlin) | `l1_transfer_rules`, `user_errors` | `L1TransferEngine` |
| **RF-TRN-02** | Entrenador de Conflictos de Tiempo-Aspecto-Modo (TAM) | US-04, US-05 | Semántica Temporal Binaria & Restricciones de Verbos Estativos | `grammar_rules`, `user_errors` | `TamConflictResolver` |
| **RF-TRN-03** | Matriz de Regímenes Preposicionales Divergentes | US-04, US-05 | Rección Preposicional Arbitraria & Verbos Transitivos Directos L2 | `l1_transfer_rules`, `user_errors` | `PrepositionRegimeTrainer` |
| **RF-TRN-04** | Entrenador de Inversión en Preguntas Indirectas | US-04, US-05 | Parámetro de Inversión Auxiliar en Cláusulas Incrustadas | `grammar_rules` | `ClauseSyntaxTrainer` |
| **RF-TRN-05** | Extintor de Fosilización de 3ra Persona Singular (-s) | US-07, US-13 | Fosilización Procedural de Desinencias Regulares (Ullman, 2001) | `speed_drill_sessions`, `user_errors` | `ThirdPersonExtinguisher` |
| **RF-TRN-06** | Extintor de Prótesis Vocálica ante #sC Inicial | US-03, US-06 | Restricciones Fonotácticas L1 & Epéntesis Vocálica (Stockwell & Bowen) | `phonetic_rules` | `ProthesisExtinguisher` |
| **RF-TRN-07** | Preservador de Grupos Consonánticos Finales (Codas) | US-03, US-06 | Simplificación Fonotáctica de Codas & Morfología del Pasado (-ed) | `phonetic_rules` | `CodaClusterTrainer` |
| **RF-TRN-08** | Silenciador Visual de Letras Mudas | US-03 | Ortografía Histórica Opaca del Inglés & Filtro Subléxico | `silent_letters_catalog` | `SilentLettersVisualizer` |
| **RF-TRN-09** | Diccionario de Falsos Amigos Graduado A1-C1 | US-02, US-05 | *False Friends Analysis* & Efecto de Hipercorrección (Janet Metcalfe) | `vocab_items`, `user_errors` | `DeepContrastCognatesService` |
| **RF-TRN-10** | Matriz de Choque de Colocaciones del Español | US-02, US-04 | Desajuste de Verbos Soporte en L1 (*make a decision*, *be X years*) | `phraseological_units` | `CollocationClashEngine` |
| **RF-SRS-01** | Algoritmo FSRS 4.5 bajo Modelo DSR (90% Retención) | US-02 | Psicología de la Memoria (Bjork DSR) & Curva de Decaimiento Continuo | `srs_cards`, `review_logs` | `FsrsSchedulerService` |
| **RF-SRS-02** | Modalidades Variadas de Recuperación Activa | US-02 | *The Testing Effect* & Evocación Guiada (Roediger & Karpicke, 2006) | `srs_cards`, `vocab_context_examples` | `ActiveRecallEngine` |
| **RF-SRS-03** | Filtro de Desagrupación Semántica (Interleaving) | US-02 | Práctica Intercalada & Mitigación de Interferencia (Rohrer & Taylor) | `srs_cards` | `CardQueueManager` |
| **RF-PROC-01** | Métrica Formal de Proceduralización (RT < 1.5s x3) | US-07 | *Skill Acquisition Theory* (DeKeyser) & Ley de Potencia (Anderson ACT-R) | `srs_cards`, `speed_drill_sessions` | `ProceduralizationEngine` |
| **RF-PROC-02** | Cuatro Modalidades de Drills de Velocidad (3-5s) | US-07, US-13 | Automatización en Ganglios Basales & Bloqueo del Traductor Consciente | `speed_drill_sessions` | `SpeedDrillArenaComponent` |
| **RF-PROC-03** | Bucle de Micro-Recuperación de Errores (N+3 / N+7) | US-07 | *Error Recovery Looping* & Consolidación Sináptica Rápida | `speed_drill_sessions`, `weakness_metrics` | `DrillRecoveryLoop` |
| **RF-TBLT-01** | Motor de Tareas Genuinas vs. Ejercicios | US-11 | *Task-Based Language Teaching* (Rod Ellis, 2003, 2018) | `tblt_tasks` | `TbltMissionEngine` |
| **RF-TBLT-02** | Ciclo Instruccional de Tres Fases (Pre/During/Post) | US-11 | Ciclo Metodológico TBLT (Peter Skehan & Rod Ellis) | `tblt_tasks`, `tblt_task_submissions` | `TbltCycleOrchestrator` |
| **RF-TBLT-03** | Evaluación de las 4 Competencias Comunicativas | US-11 | Modelo de Competencia Comunicativa (Canale & Swain, 1980; Bachman) | `tblt_task_submissions` | `CommunicativeCompetenceScorer` |
| **RF-SOC-01** | Protocolo Socrático de Andamiaje en 4 Niveles | US-04, US-08 | Andamiaje en la ZPD (Vygotsky) & Feedback Correctivo (Lyster & Ranta) | `writing_draft_revisions` | `SocraticScaffoldingOrchestrator` |
| **RF-SOC-02** | Modalidad Micro-Writing de Alta Frecuencia (15-35 pal.) | US-04 | *Comprehensible Output* (Swain) & Reducción de Fricción Cognitiva | `writing_submissions` | `MicroWritingStudio` |
| **RF-SOC-03** | Resaltado Visual de Brechas (Noticing the Gap) | US-04 | *Noticing Hypothesis* (Richard Schmidt, 1990) | `writing_evaluations` | `GapHighlightDiffViewer` |
| **RF-SOC-04** | Protección del Filtro Afectivo & Máx 3 Errores | US-04 | *Affective Filter Hypothesis* (Krashen) & FLCAS (Elaine Horwitz) | `writing_evaluations` | `AffectiveFilterShield` |
| **RF-INP-01** | Perfilador Léxico Algorítmico y Umbrales 95/98% | US-09 | Umbrales de Cobertura Léxica para Lectura (Paul Nation & Batia Laufer) | `reader_articles` | `LexicalCoverageProfiler` |
| **RF-INP-02** | Simplificación Contextual Inteligente con Gemini | US-09 | *Comprehensible Input (i+1)* Ajustado Dinámicamente | `reader_articles` | `CefrTextSimplifierService` |
| **RF-INP-03** | Captura Léxica en 1 Clic desde el Lector | US-09 | Adquisición Incidental & Minería de Chunks en Contexto | `reader_articles`, `vocab_items`, `srs_cards` | `QuickLookupService` |
| **RF-INP-04** | Decodificación Auditiva Bottom-Up en 3 Pasos | US-09 | Procesamiento Auditivo Ascendente vs Descendente (John Field, 2008) | `reader_articles`, `audio_cache` | `BottomUpListeningEngine` |
| **RF-INP-05** | Acelerador de Ruta Léxica Directa | US-09 | Modelo de Doble Ruta de Lectura (Coltheart et al., 2001) | `reader_articles` | `SynchronizedReaderPlayer` |
| **RF-DIA-01** | Taxonomía Unificada de Errores con Códigos L1 | US-05 | Análisis de Errores de Interlenguaje (S. Pit Corder, 1967) | `error_taxonomy`, `user_errors` | `ErrorTelemetryRecorder` |
| **RF-DIA-02** | Heatmap de Debilidades con Decaimiento Temporal | US-05 | Monitoreo Metacognitivo & Priorización Adaptativa | `weakness_metrics` | `WeaknessHeatmapEngine` |
| **RF-DIA-03** | Generación Automática de Micro-Workouts Dirigidos | US-05 | *Deliberate Practice* en la Zona de Estiramiento (Anders Ericsson) | `micro_workouts` | `WorkoutFactory` |
| **RF-SRL-01** | Ciclo de Autorregulación en 3 Fases (Zimmerman) | US-01 | *Self-Regulated Learning* (Barry Zimmerman, 2000, 2008) | `daily_quests`, `users` | `SrlCycleOrchestrator` |
| **RF-SRL-02** | Racha Antifrágil y Protección Never Miss Twice | US-01 | Psicología de Hábitos (Clear, Fogg) & Antifragilidad Conductual | `user_streaks`, `streak_freeze_logs` | `StreakStateManager` |
| **RF-SRL-03** | Estrangulamiento de Cola Atrasada (Backlog Throttling) | US-01 | Prevención del Síndrome "What-the-Hell" & Sobrecarga de Repasos | `srs_cards`, `users` | `BacklogThrottlerService` |
| **RF-SRL-04** | Orientación hacia el Yo Ideal en L2 | US-01 | *L2 Motivational Self System* (Zoltán Dörnyei, 2005, 2009) | `users` | `EditorialTechThemeService` |
| **RF-AIC-01** | Panel de Configuración y Modelos Gemini 3.x Flash | US-04 | Optimización de Latencia y Eficacia de Inferencia | `users` | `AiConfigController` |
| **RF-AIC-02** | Pool de Múltiples Claves de API (Multi-Key Pool) | US-04 | Disponibilidad Continua y Privacidad con Cifrado Local | `ai_api_keys` | `ApiKeyPoolManager` |
| **RF-AIC-03** | Matriz de Resiliencia 2D (Modelo x Clave) & Cascada | US-04 | Resiliencia ante Cuotas Google AI Studio (5 RPM / 20 RPD / 80 RPD) | `api_key_model_quotas` | `QuotaMatrixOrchestrator` |
| **RF-AIC-04** | Sincronización Oficial con Huso Horario PT | US-04 | Sincronización Determinista del Reset de Cuotas Diarias | `api_key_model_quotas` | `PacificTimeClockService` |

---

## 2. Resumen de Cobertura Científica
- **100% de los documentos pedagógicos de `docs/02_pedagogical_framework/`** están mapeados a requisitos funcionales específicos, modelos de datos SQLite y componentes arquitectónicos activos.
- Cero requisitos huérfanos; coherencia estricta entre el diseño teórico y la especificación de software.
