# Matriz de Trazabilidad de Requisitos
## English Learning Assistant (ELA)

Esta matriz vincula cada **Requisito Funcional (RF)** con su **Historia de Usuario (US)**, su **Fundamento Pedagógico en Ciencias de SLA**, las **Entidades del Modelo de Datos** y el **Componente Arquitectónico** responsable de su implementación.

---

## 1. Tabla de Trazabilidad Cruzada

| ID Requisito | Título del Requisito | Historias de Usuario | Fundamento Pedagógico (SLA / Cognición) | Entidad de Datos Relacionada | Componente / Servicio del Sistema |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RF-VOC-01** | Categorización Léxica (Contenido, Función, Chunks) | US-02, US-04 | *The Lexical Approach* (Michael Lewis) & Gramática Funcional | `vocab_items`, `phraseological_units`, `lexical_categories` | `LexiconModule`, `CatalogService` |
| **RF-VOC-02** | Enriquecimiento Semántico, CEFR y Falsos Amigos | US-02, US-05 | *Interlanguage Analysis* & Prevención de Fosilizaciones L1 | `vocab_metadata`, `false_cognates`, `word_families` | `LexiconEnricher`, `DictionaryService` |
| **RF-VOC-03** | Ingesta Rápida y Auto-Enriquecimiento con IA | US-02, US-04 | Automatización léxica & *Comprehensible Input* contextual | `vocab_items`, `phraseological_units`, `srs_cards` | `AiVocabularyEnricherService` |
| **RF-VOC-04** | Banco de Contextos Dinámicos y Rotación de Ejemplos | US-02 | *Variabilidad de Codificación* (Bjork & Bjork) | `vocab_context_examples` | `ContextRotatorService` |
| **RF-PHO-01** | Transcripción Fonética Dual (IPA) GA & RP | US-03 | Fonética contrastiva & Conciencia Fonológica | `phonetic_transcriptions`, `syllable_stress` | `PhoneticEngine`, `IpaViewerComponent` |
| **RF-PHO-02** | Audio Multimodal Normal & Lento (0.75x) | US-03 | *Comprehensible Input* & *Auditory Tuning* | `audio_cache`, `tts_profiles` | `AudioPlayerSubsystem`, `WebSpeechAdapter` |
| **RF-PHO-03** | Reglas de Habla Conectada (Elisión, Asimilación, Linking) | US-03 | Fonología Post-léxica & *Stress-Timed Rhythm* del Inglés | `connected_speech_rules`, `speech_examples` | `ConnectedSpeechEngine`, `PhoneticVisualizer` |
| **RF-PHO-04** | Pares Mínimos y Discriminación Acústica Forzada | US-03, US-06 | *Acoustic Phonetic Categorization* (Kuhl) | `user_errors`, `phonetic_rules` | `MinimalPairsTrainer` |
| **RF-SRS-01** | Algoritmo FSRS (DSR: Difficulty, Stability, Retrievability) | US-02 | Curva del Olvido de Ebbinghaus & *Desirable Difficulty* (Bjork) | `srs_cards`, `review_logs`, `fsrs_parameters` | `FsrsSchedulerService`, `FlashcardEngine` |
| **RF-SRS-02** | Modos de Recuperación Activa (Active Recall / Cloze) | US-02 | *The Testing Effect* (Roediger & Karpicke) | `card_templates`, `cloze_items` | `ActiveRecallController` |
| **RF-SRS-03** | Drills de Velocidad y Proceduralización | US-07 | *Declarative/Procedural Model* (Michael Ullman) | `speed_drill_sessions` | `SpeedDrillEngine` |
| **RF-SRS-04** | Filtro de Desagrupación Semántica (Interleaving) | US-02 | *Interleaving Effect* & Reducción de Interferencia | `srs_cards` | `CardQueueManager` |
| **RF-WRT-01** | Taller de Escritura Libre y Guiada (CEFR Prompts) | US-04 | *Output Hypothesis* (Merrill Swain) | `writing_prompts`, `writing_submissions` | `WritingStudioComponent` |
| **RF-WRT-02** | Conector de Inferencia con Google Gemini API | US-04 | Feedback Inteligente Automatizado de Baja Latencia | `ai_audit_logs`, `gemini_requests` | `GeminiApiClient`, `AiGatewayService` |
| **RF-WRT-03** | Feedback Pedagógico en 4 Pasos & Micro-Reto | US-04, US-05 | *Noticing Hypothesis* (Richard Schmidt) & *Transferencia L1* | `writing_evaluations`, `correction_items` | `PedagogicalFeedbackParser` |
| **RF-WRT-04** | Ciclo de Escritura Socrática en Dos Fases | US-08 | *Guided Self-Correction* & *ZPD* (Vygotsky) | `writing_draft_revisions` | `SocraticWritingOrchestrator` |
| **RF-WRT-05** | Modalidad Micro-Writing (Escritura Ágil) | US-04, US-08 | *Habit Stacking* & Reducción de Fricción Cognitiva | `writing_submissions` | `WritingStudioComponent` |
| **RF-DIA-01** | Registro y Taxonomía de Errores del Estudiante | US-05 | Taxonomía de Errores de Interlenguaje de Corder | `user_errors`, `error_taxonomy` | `ErrorTelemetryService` |
| **RF-DIA-02** | Heatmap de Debilidades y Frecuencia Ponderada | US-05 | Monitoreo Metacognitivo & Visualización de Brechas | `weakness_metrics`, `category_scores` | `DiagnosticAnalyticsEngine`, `HeatmapView` |
| **RF-DIA-03** | Generador de Micro-Workouts Personalizados | US-05 | *Deliberate Practice* (Anders Ericsson) | `micro_workouts`, `targeted_drills` | `WorkoutGeneratorService` |
| **RF-HAB-01** | Panel de Tareas Diarias (Daily Quests) | US-01 | *Atomic Habits* (James Clear): Reducción de Fricción | `daily_quests`, `user_quest_progress` | `DailyQuestController`, `DashboardView` |
| **RF-HAB-02** | Verificación Automática y Manual de Metas | US-01 | Refuerzo Positivo Inmediato & Sensación de Progreso | `daily_quests` | `HabitEngine` |
| **RF-HAB-03** | Racha Diaria con Fichas de Congelación (Streak Freeze) | US-01 | Psicología de la Retención & Prevención de Deserción | `user_streaks`, `streak_freeze_logs` | `StreakStateManager` |
| **RF-AIC-01** | Panel de Configuración de IA y Modelo por Defecto | US-04 | Personalización adaptativa y control de latencia/costo | `users` | `AiConfigController`, `AiSettingsView` |
| **RF-AIC-02** | Pool de Múltiples Claves de API (Multi-Key Pool) | US-04 | Disponibilidad continua y gestión multi-cuenta | `ai_api_keys` | `ApiKeyPoolManager` |
| **RF-AIC-03** | Selección de Clave Primaria y Failover Automático | US-04 | Resiliencia ante Rate Limit (HTTP 429) | `ai_api_keys` | `AiGatewayFailoverService` |
| **RF-AIC-04** | Diagnóstico y Verificación de Conexión de Claves | US-04 | Prevención de interrupciones de usuario | `ai_api_keys` | `KeyDiagnosticsService` |
| **RF-AIC-05** | Matriz de Resiliencia 2D (Modelo x Clave) & Reset PT | US-04 | Optimización de cuota (80 RPD/key) & Continuidad | `api_key_model_quotas` | `QuotaMatrixOrchestrator` |
| **RF-INP-01** | Lector Inteligente de Input Comprensible (i+1 Reader) | US-09 | *Input Hypothesis (i+1)* (Stephen Krashen) | `reader_articles` | `GradedReaderEngine`, `SmartReaderView` |
| **RF-INP-02** | Captura Léxica y Enriquecimiento Instantáneo | US-09 | *Incidental Vocabulary Acquisition* & Noticing | `reader_articles`, `vocab_items`, `srs_cards` | `QuickLookupService` |

---

## 2. Cobertura de Requisitos

- **Requisitos de Vocabulario y Gramática:** 100% trazables (incluyendo rotación de contextos).
- **Requisitos de Fonética, Habla Conectada y Pares Mínimos:** 100% trazables a visualizadores, audio y entrenador perceptual.
- **Requisitos de Repetición Espaciada y Proceduralización:** 100% trazables a FSRS y Speed Drills.
- **Requisitos de Práctica con IA (Gemini):** 100% trazables al gateway, taller socrático multi-borrador y rúbricas.
- **Requisitos de Input Comprensible (i+1 Reader):** 100% trazables al lector interactivo y captura rápida.
- **Requisitos de Constancia y Hábitos:** 100% trazables a la máquina de estados de rachas.
- **Requisitos de Configuración y Claves de IA:** 100% trazables al pool de claves y gestor de failover 2D.
