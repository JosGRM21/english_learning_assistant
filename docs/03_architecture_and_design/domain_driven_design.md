# Diseño Guiado por el Dominio (Domain-Driven Design - DDD)
## English Learning Assistant (ELA)

Este documento modela la arquitectura lógica de ELA bajo los principios de **Domain-Driven Design (DDD)** de Eric Evans. Define los **Contextos Delimitados (Bounded Contexts)**, **Agregados**, **Entidades**, **Objetos de Valor (Value Objects)** y **Eventos de Dominio**, estructurados para materializar rigurosamente los fundamentos científicos de [`docs/02_pedagogical_framework/`](../02_pedagogical_framework/).

---

## 1. Mapa de Contextos Delimitados (Context Map)

```mermaid
graph TD
    subgraph CoreDomain["Dominio Central (Core Pedagogical Engines)"]
        BC_PROC["BC 1: Repetición Espaciada (FSRS) & Proceduralización"]
        BC_PHO["BC 2: Fonética Acústica, Habla Conectada & Prosodia"]
        BC_TBLT["BC 3: Taller Basado en Tareas (TBLT) & Tutoría Socrática"]
        BC_INP["BC 4: Input Comprensible & Escucha Bottom-Up"]
    end

    subgraph SupportingDomain["Dominio de Soporte Pedagógico"]
        BC_SEM["BC 5: Semántica Cognitiva & Thinking for Speaking"]
        BC_TRN["BC 6: Matriz de Neutralización de Interferencia L1"]
        BC_LEX["BC 7: Catálogo Léxico Maestro & Chunks"]
        BC_DIA["BC 8: Diagnóstico de Interlenguaje & Heatmap"]
    end

    subgraph GenericDomain["Dominio Genérico de Infraestructura"]
        BC_SRL["BC 9: Autorregulación (SRL), Hábitos & Rachas"]
        BC_AIC["BC 10: Gateway de IA & Resiliencia 2D de Cuotas"]
    end

    BC_LEX -->|Suministra entradas léxicas| BC_PROC
    BC_LEX -->|Suministra fonemas y reglas| BC_PHO
    BC_SEM -->|Suministra colocaciones y esquemas| BC_TBLT
    BC_TRN -->|Suministra reglas contrastivas| BC_DIA
    BC_TRN -->|Suministra drills de 3ra persona y pro-drop| BC_PROC
    BC_INP -->|Captura términos en 1 clic| BC_LEX
    BC_PROC -->|Provee términos activos para Noticing| BC_INP
    BC_TBLT -->|Envía textos para evaluación| BC_AIC
    BC_TBLT -->|Emite errores morfosintácticos| BC_DIA
    BC_PROC -->|Emite fallas de evocación y latencia| BC_DIA
    BC_PHO -->|Emite fallas de discriminación acústica| BC_DIA
    BC_PROC -->|Notifica repasos y drills| BC_SRL
    BC_TBLT -->|Notifica tareas completadas| BC_SRL
    BC_INP -->|Notifica lectura completada| BC_SRL
    BC_DIA -->|Genera Micro-Workouts| BC_SRL
```

---

## 2. Especificación Detallada de Contextos Delimitados

### 2.1. Contexto Delimitado: Repetición Espaciada & Proceduralización (`SrsProceduralContext`)
- **Propósito:** Gobernar la consolidación mnemotécnica (modelo DSR de FSRS) y la compilación motora en ganglios basales (Ley de Potencia de Newell & Rosenbloom).
- **Raíz del Agregado (Aggregate Root):** `SrsCard`
  - *Atributos:* `cardId`, `targetType` (VOCAB, PHRASE, GRAMMAR, PHONETICS), `targetId`, `state` (NEW, LEARNING, REVIEW, RELEARNING), `stability`, `difficulty`, `scheduledFor`, `isProceduralized` (boolean), `consecutiveFastRetrievals` (contador hacia 3).
  - *Método de Dominio:* `evaluateReview(grade, elapsedMs)`: recalcula estabilidad y dificultad bajo FSRS 4.5. Si `elapsedMs < 1500` y respuesta correcta, incrementa `consecutiveFastRetrievals`. Al llegar a 3, conmuta `isProceduralized = true`.
- **Entidades de Dominio:**
  - `SpeedDrillSession`: sesión de ráfaga continua con `drillType`, `promptsCount`, `avgReactionTimeMs`, `proceduralPassCount`.
  - `ErrorRecoveryLoop`: gestiona la reinyección de fallos en $N+3$ y $N+7$.
- **Value Objects:**
  - `FsrsGrade` (1: Again, 2: Hard, 3: Good, 4: Easy).
  - `MemoryStateDSR` (Dificultad $D$, Estabilidad $S$, Retención esperada $R$).
  - `ReactionLatency` (Milisegundos exactos con flag de ventana procedural $<1.5$ s).
- **Eventos de Dominio:**
  - `CardReviewedDomainEvent` (Emite: cardId, grade, newStability, wasFailure).
  - `ItemProceduralizedDomainEvent` (Emite: cardId, targetId, finalLatencyMs).
  - `DrillFailedDomainEvent` (Dispara reinyección en $N+3$).

---

### 2.2. Contexto Delimitado: Fonética Acústica, Habla Conectada & Prosodia (`PhonologyProsodyContext`)
- **Propósito:** Segmentar oraciones, identificar fenómenos de habla rápida, entrenar pares mínimos multi-hablante y evaluar contornos melódicos suprasegmentales.
- **Raíz del Agregado:** `ConnectedSentence`
  - *Atributos:* `sentenceId`, `orthographicText`, `ipaCitation`, `ipaConnected`, `boundaryEvents` (colección de enlaces, elisiones, asimilaciones y formas débiles).
  - *Entidad Interna:* `ProsodyProfile`: contiene el acento nuclear (`nuclearStressWordIndex`), grupos de pensamiento (`thoughtGroupDelimiters //`) y contorno tonal (`pitchContourType`: Falling, Rising, FallRise, RiseFall).
- **Entidades de Dominio:**
  - `HvptMinimalPairTrial`: reto a ciegas con estímulo acústico de voz nativa ($V_1$ a $V_6$), opciones visuales y temporizador de 2.0 s.
  - `ProsodicShadowingSession`: grabación de audio del usuario con cálculo de vector de frecuencia fundamental ($F_0$) y comparación de error cuadrático medio frente a la curva nativa.
- **Value Objects:**
  - `IpaPhoneme` (Glifos IPA normalizados, diacríticos y acentos).
  - `PitchCurveF0` (Serie temporal de frecuencias en Hertz de 50 a 400 Hz).
  - `AcousticVowelCoordinates` (Formante $F_1$ en Hz, Formante $F_2$ en Hz en el cuadrilátero).
- **Eventos de Dominio:**
  - `HvptTrialCompletedDomainEvent` (Emite: contrastPair, voiceId, reactionTimeMs, isCorrect).
  - `ProsodicShadowingScoredDomainEvent` (Emite: sentenceId, prosodyMatchPercentage).

---

### 2.3. Contexto Delimitado: Taller Basado en Tareas (TBLT) & Tutoría Socrática (`TbltWritingContext`)
- **Propósito:** Orquestar misiones comunicativas en 3 fases y evaluar las 4 competencias comunicativas mediante andamiaje socrático en la ZPD con Gemini.
- **Raíz del Agregado:** `TbltMissionSubmission`
  - *Atributos:* `submissionId`, `taskId`, `userId`, `currentPhase` (PRE_TASK, DURING_TASK, POST_TASK_FONF), `originalText`, `status`.
  - *Colección:* `DraftRevisions` (Borrador 1 $\rightarrow$ Pistas Nivel 1/2 $\rightarrow$ Borrador 2 $\rightarrow$ Resolución).
  - *Entidad Interna:* `CommunicativeCompetenceEvaluation`: scores analíticos en Lingüística, Sociolingüística (Hedging/Registro), Discursiva (Conectores) y Estratégica (Paráfrasis).
- **Value Objects:**
  - `LexicalPrimingChunk` (Unidad fraseológica sugerida en Pre-Task para cebar la memoria de trabajo).
  - `SocraticScaffoldLevel` (Level1_Elicitation, Level2_Metalinguistic, Level3_Cloze, Level4_ExplicitModel).
  - `NoticingGapDiff` (Segmento erróneo del interlenguaje vs. reformulación nativa).
- **Eventos de Dominio:**
  - `TbltPreTaskActivatedDomainEvent`.
  - `TbltDraftSubmittedDomainEvent`.
  - `SocraticScaffoldRequestedDomainEvent`.
  - `TbltMissionEvaluatedDomainEvent` (Emite: scores de las 4 competencias y lista de errores de interlenguaje).

---

### 2.4. Contexto Delimitado: Semántica Cognitiva & Thinking for Speaking (`CognitiveSemanticsContext`)
- **Propósito:** Desarticular las trampas de polisemia del español y guiar la transición del marco verbal al marco satelital.
- **Agregados:**
  - `SatelliteMotionVerb`: verbo de manera (*rush, sneak, crawl*) + satélites preposicionales (*in, out, across, through*).
  - `TopologicalPrepositionSchema`: modelo espacial corporizado para *IN* (contenedor 3D), *ON* (superficie 2D) y *AT* (punto 0D).
  - `PolysemicDisambiguationPair`: modelo de contraste para *Make/Do*, *Say/Tell/Speak/Talk*, *Borrow/Lend*, *Miss/Lose*.
- **Eventos de Dominio:**
  - `PolysemyMasteredDomainEvent`.

---

### 2.5. Contexto Delimitado: Matriz de Neutralización de Interferencia L1 (`L1InterferenceContext`)
- **Propósito:** Catalogar desvíos sistemáticos producidos por la lengua materna y proveer motores de erradicación inmediata.
- **Agregados:**
  - `L1ConflictPattern`: identificador canónico (`L1_PRO_DROP`, `L1_TAM_PRES_PERF`, `L1_PREP_DEPEND_ON`, `L1_3RD_PERSON_S`, `L1_PROTHESIS_SC`).
  - `ThirdPersonSubstitutionDrill`: ráfaga de pronombres en 2.0 s para desfosilizar *-s*.
  - `SilentLetterCatalog`: palabras con grafías mudas atenuadas visualmente.
- **Eventos de Dominio:**
  - `L1InterferenceTriggeredDomainEvent` (Registra un desvío L1 en el heatmap de diagnóstico).

---

### 2.6. Contexto Delimitado: Input Comprensible & Escucha Bottom-Up (`ComprehensibleInputContext`)
- **Propósito:** Evaluar la densidad léxica de textos y entrenar la decodificación auditiva ascendente.
- **Raíz del Agregado:** `GradedArticle`
  - *Atributos:* `articleId`, `contentRaw`, `lexicalCoveragePercentage`, `cefrClassification`, `readingMode` (EXTENSIVE $\ge 98\%$, INTENSIVE $92-95\%$, OVERLOAD $<95\%$).
- **Entidad:** `BottomUpListeningSession`
  - Estado secuencial: `STEP1_BLIND_AUDIO` $\rightarrow$ `STEP2_TONIC_SKELETON` $\rightarrow$ `STEP3_FULL_CONNECTED_TEXT`.
- **Eventos de Dominio:**
  - `LexicalCaptureRequestedDomainEvent` (Captura en 1 clic de una palabra desconocida hacia `SrsProceduralContext`).
  - `TextSimplificationRequestedDomainEvent` (Solicitud de reescritura al 95% con Gemini).

---

### 2.7. Contexto Delimitado: Diagnóstico & Heatmap (`DiagnosticsContext`)
- **Propósito:** Computarizar la telemetría de errores con decaimiento temporal y generar *Micro-Workouts* dirigidos.
- **Raíz del Agregado:** `LearnerWeaknessHeatmap`
  - Colección de `WeaknessMetric`: regla violada, ocurrencias en los últimos 7 días, score de criticidad decreciente.
  - Generador de `MicroWorkout`: sesión de 5 minutos cuando la criticidad supera el umbral.
- **Eventos de Dominio:**
  - `ChronicWeaknessDetectedDomainEvent`.
  - `MicroWorkoutCompletedDomainEvent`.

---

### 2.8. Contexto Delimitado: Autorregulación (SRL), Hábitos & Rachas (`SelfRegulationContext`)
- **Propósito:** Implementar el ciclo tripartito de Zimmerman, rachas antifrágiles y prevención de *Review Hell*.
- **Raíz del Agregado:** `UserStreak`
  - `streakCount`, `availableFreezes`, `lastActiveDate`, `isInGracePeriod`.
  - Lógica de dominio: *Never Miss Twice* (consumo automático de Streak Freeze o gracia de 24h).
- **Entidades:**
  - `DailyQuestPlan`: misiones del día calculadas dinámicamente con estimación de tiempo.
  - `BacklogThrottler`: limita la cola diaria de FSRS a 25-30 tarjetas si el alumno regresa tras una pausa.
- **Eventos de Dominio:**
  - `DailyQuestsCompletedDomainEvent`.
  - `StreakProtectedWithFreezeDomainEvent`.
