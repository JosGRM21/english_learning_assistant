# Diagramas de Secuencia de Flujos Clave
## English Learning Assistant (ELA)

Este documento detalla los flujos de interacción temporal entre los componentes del sistema mediante **Diagramas de Secuencia UML (Mermaid)** para los cuatro procesos más críticos de la aplicación.

---

## 1. Flujo 1: Sesión de Repaso FSRS y Actualización de Hábitos

Describe cómo se cargan las tarjetas pendientes, cómo se calcula el algoritmo FSRS y cómo impacta en las metas diarias:

```mermaid
sequenceDiagram
    autonumber
    actor User as Estudiante
    participant UI as FlashcardView (Frontend)
    participant SrsCtrl as SrsController
    participant FsrsEngine as FsrsScheduler
    participant CardRepo as CardRepository
    participant HabitMgr as HabitManager
    participant DB as SQLite Database

    User->>UI: Abre pantalla de Repaso Diario
    UI->>SrsCtrl: getDueCards(userId, currentDate)
    SrsCtrl->>CardRepo: findCardsWithDueTimestamp(<= now)
    CardRepo->>DB: SELECT * FROM srs_cards WHERE scheduled_for <= ?
    DB-->>CardRepo: Lista de tarjetas pendientes
    CardRepo-->>SrsCtrl: Cards[]
    SrsCtrl-->>UI: Renderiza primera tarjeta (Anverso: Prompt / Cloze)

    User->>UI: Presiona [Espacio] para ver respuesta
    UI->>UI: Muestra Reverso (Significado, IPA, Audio)
    User->>UI: Selecciona calificación "Good" (Tecla 3)

    UI->>SrsCtrl: recordReview(cardId, grade: 3, elapsedMs)
    SrsCtrl->>FsrsEngine: calculateNextState(currentS, currentD, grade: 3)
    FsrsEngine-->>SrsCtrl: { newS: 8.4, newD: 4.8, nextDueDate: '2026-10-06' }
    
    SrsCtrl->>CardRepo: updateCardState(cardId, newS, newD, nextDueDate)
    CardRepo->>DB: UPDATE srs_cards SET stability=?, difficulty=?, scheduled_for=?
    CardRepo->>DB: INSERT INTO review_logs (cardId, grade, reviewed_at)
    
    SrsCtrl->>HabitMgr: notifyActionCompleted('SRS_REVIEW_BATCH', remainingDueCount)
    opt Si no quedan tarjetas pendientes
        HabitMgr->>DB: UPDATE daily_quests SET completed=TRUE WHERE type='VOCAB_REVIEW'
        HabitMgr-->>UI: Evento: "Daily Quest Completada: Repaso de Vocabulario"
    end
    SrsCtrl-->>UI: Carga siguiente tarjeta en cola
```

---

## 2. Flujo 2: Taller de Redacción y Evaluación Pedagógica con Google Gemini

Describe el ciclo desde que el usuario redacta su texto hasta que la IA devuelve el feedback estructurado con explicaciones en español y micro-retos:

```mermaid
sequenceDiagram
    autonumber
    actor User as Estudiante
    participant UI as WritingStudioView
    participant WrtCtrl as WritingController
    participant AiGateway as GeminiAiGateway
    participant Gemini as Google Gemini API
    participant ErrorMgr as ErrorTelemetryService
    participant DB as SQLite Database

    User->>UI: Redacta texto: "It depends of the weather..." y presiona "Evaluar"
    UI->>UI: Muestra indicador de carga "Analizando con Gemini..."
    UI->>WrtCtrl: submitTextForEvaluation(promptId, text)
    WrtCtrl->>DB: INSERT INTO writing_submissions (text, status='EVALUATING')
    
    WrtCtrl->>AiGateway: evaluateLearnerText(text, level: 'B1')
    AiGateway->>Gemini: POST /v1beta/models/gemini-3.8-flash:generateContent (Prompt + Schema JSON)
    Note over AiGateway,Gemini: Inferencia con Temperature: 0.2, Familia 3.x Flash y Structured JSON Output
    Gemini-->>AiGateway: 200 OK { corrections: [...], overallCefrScore, microChallenge }

    AiGateway-->>WrtCtrl: StructuredEvaluationResult
    WrtCtrl->>DB: INSERT INTO writing_evaluations (submissionId, correctionsJson, score)
    
    loop Por cada error identificado (p. ej. "depends of")
        WrtCtrl->>ErrorMgr: recordLearnerError(type='GRAM_PREP', subtag='DEPEND_ON', context=text)
        ErrorMgr->>DB: INSERT INTO user_errors (errorType, contextSnippet, createdAt)
    end

    WrtCtrl-->>UI: Renderiza vista de corrección pedagógica
    UI->>UI: Resalta en amarillo "depends of"
    UI->>User: Muestra explicación en español + Versión Nativa ("depends on")
    UI->>User: Muestra Micro-Reto interactivo: "¿It depends ___ your decision? [on / of]"
```

---

## 3. Flujo 3: Desglose Interactivo de Habla Conectada (Connected Speech)

Describe cómo el sistema tokeniza y visualiza las reglas fonéticas al reproducir audio:

```mermaid
sequenceDiagram
    autonumber
    actor User as Estudiante
    participant UI as ConnectedSpeechView
    participant PhoEngine as ConnectedSpeechEngine
    participant AudioSys as AudioSubsystem (TTS)

    User->>UI: Selecciona frase: "Hold on for a second"
    UI->>PhoEngine: analyzeConnectedSpeech("Hold on for a second")
    PhoEngine->>PhoEngine: Aplica reglas fonológicas:
    Note over PhoEngine: 1. Catenación C-V: [həʊl-dɒn]<br/>2. Weak forms Schwa: 'for a' -> [fər ə]
    PhoEngine-->>UI: { segments: [{text: "Hold on", rule: "LINKING_CV"}, {text: "for a", rule: "WEAK_FORM"}] }

    UI->>UI: Dibuja arco azul de enlace entre "Hold" y "on"
    UI->>UI: Resalta "for a" en verde con símbolo Schwa /ə/

    User->>UI: Presiona botón de audio lento (0.75x)
    UI->>AudioSys: playPhoneticSentence(text, playbackRate: 0.75)
    AudioSys-->>User: Emite audio articulado con preservación de tono
```

---

## 4. Flujo 4: Detección de Falla Crónica y Generación de Micro-Workout

Describe cómo un error reiterado dispara automáticamente un entrenamiento express:

```mermaid
sequenceDiagram
    autonumber
    participant ErrorMgr as ErrorTelemetryService
    participant HeatmapEngine as WeaknessHeatmapEngine
    participant WorkoutGen as MicroWorkoutGenerator
    participant HabitMgr as HabitManager
    participant UI as Dashboard

    ErrorMgr->>HeatmapEngine: checkWeaknessThreshold('GRAM_PREP_DEPEND_ON')
    HeatmapEngine->>HeatmapEngine: Calcula frecuencia en los últimos 7 días
    Note over HeatmapEngine: Frecuencia detectada = 4 fallos (Umbral crítico >= 3)
    
    HeatmapEngine->>WorkoutGen: triggerMicroWorkout('GRAM_PREP_DEPEND_ON')
    WorkoutGen->>WorkoutGen: Ensambla 5 ejercicios específicos (Cloze + Corrección)
    WorkoutGen->>HabitMgr: registerBonusQuest('Micro-Workout: Preposiciones con Verbos')
    
    HabitMgr-->>UI: Notificación en Dashboard: "Se ha detectado una debilidad frecuente. ¡Resuelve tu Micro-Workout de 5 min!"
```

---

## 5. Flujo 5: Ingesta Rápida y Auto-Enriquecimiento de Vocabulario con Gemini

Describe el proceso donde el usuario ingresa solo una palabra y la IA deduce toda la información lingüística, insertándola en la base de datos y programando su tarjeta FSRS:

```mermaid
sequenceDiagram
    autonumber
    actor User as Estudiante
    participant UI as QuickAddVocabModal (Frontend)
    participant VocabCtrl as VocabController
    participant AiGateway as GeminiAiGateway
    participant QuotaMgr as QuotaMatrixOrchestrator
    participant Gemini as Google Gemini API (3.x Flash)
    participant VocabRepo as VocabRepository
    participant CardRepo as CardRepository
    participant DB as SQLite Database

    User->>UI: Ingresa término: "reluctant" y presiona "Enriquecer con IA"
    UI->>UI: Muestra spinner: "Analizando fonética, colocaciones y CEFR con Gemini..."
    UI->>VocabCtrl: autoEnrichTerm("reluctant", optionalContext: null)
    
    VocabCtrl->>AiGateway: enrichVocabularyTerm("reluctant")
    AiGateway->>QuotaMgr: resolveExecutionTarget(preferred: 'gemini-3.6-flash')
    QuotaMgr-->>AiGateway: { apiKey: 'AIzaSy...74vQ', model: 'gemini-3.6-flash' }
    
    AiGateway->>Gemini: POST /v1beta/models/gemini-3.6-flash:generateContent (Prompt Enriquecedor + Schema)
    Gemini-->>AiGateway: 200 OK { entry_type: "VOCAB_ITEM", ipa, definition, translation, examples, cefr, false_friend }
    
    AiGateway-->>VocabCtrl: StructuredEnrichmentResult
    VocabCtrl-->>UI: Muestra Tarjeta de Vista Previa con datos autocompletados
    
    User->>UI: Revisa y presiona "Guardar en mi Biblioteca"
    UI->>VocabCtrl: persistEnrichedEntry(data)
    
    alt Si es palabra simple
        VocabCtrl->>VocabRepo: insertVocabItem(data)
        VocabRepo->>DB: INSERT INTO vocab_items (...)
    else Si es unidad fraseológica (chunk)
        VocabCtrl->>VocabRepo: insertPhraseUnit(data)
        VocabRepo->>DB: INSERT INTO phraseological_units (...)
    end
    
    VocabCtrl->>CardRepo: createSrsCard(targetType, targetId, state='NEW', initialD=5.0)
    CardRepo->>DB: INSERT INTO srs_cards (target_type, target_id, state='NEW', scheduled_for=now)
    
    VocabCtrl-->>UI: Confirmación: "¡'reluctant' guardada exitosamente y lista para tu sesión SRS!"
    UI-->>User: Cierra modal y actualiza el contador de tarjetas nuevas
```

---

## 6. Flujo 6: Discriminación Auditiva Forzada de Pares Mínimos y Habla Conectada

Describe cómo el estudiante escucha un estímulo fonético a ciegas, toma una decisión rápida bajo presión de tiempo (límite de 2.0s) y analiza el contraste fonético resultante:

```mermaid
sequenceDiagram
    autonumber
    actor User as Estudiante
    participant UI as PhoneticsLabView (Frontend)
    participant AudioSys as AudioSubsystem (Web Audio API / Howler)
    participant ErrorMgr as ErrorTelemetryService
    participant HabitMgr as HabitManager
    participant DB as SQLite Database

    User->>UI: Selecciona drill de pares mínimos: contraste /iː/ vs /ɪ/
    UI->>AudioSys: playRandomStimulus("audio/stimulus_ship.mp3")
    AudioSys-->>User: Emite estímulo sonoro a ciegas
    UI->>UI: Inicia temporizador regresivo de 2.0 segundos

    User->>UI: Selecciona opción "ship" /ʃɪp/ (en 1.1s)
    UI->>UI: Detiene temporizador y evalúa acierto perceptual
    UI->>AudioSys: playFeedbackSound("correct_chime.mp3")
    UI->>UI: Muestra panel contrastivo (/ʃiːp/ vs. /ʃɪp/) con transcripción IPA
    User->>UI: Pulsa botón "Comparar Sonidos"
    UI->>AudioSys: playContrastivePair("sheep_vs_ship.mp3")
    AudioSys-->>User: Emite ambos fonemas de forma secuencial

    UI->>DB: Registra métrica de agudeza fonética en `weakness_metrics`
    UI->>HabitMgr: notifyActionCompleted('PHONETICS_PRACTICE')
    HabitMgr-->>UI: Actualiza Daily Quest: "Laboratorio Fonético Completado ✅"
```

---

## 7. Flujo 7: Taller de Redacción Socrática en Dos Fases

Describe el ciclo donde Gemini entrega primero pistas de andamiaje y el usuario auto-corrige su propio texto antes de revelar la versión nativa final:

```mermaid
sequenceDiagram
    autonumber
    actor User as Estudiante
    participant UI as WritingStudioView
    participant SocraticMgr as SocraticFeedbackOrchestrator
    participant Gemini as Google Gemini (3.7 / 3.8 Flash)
    participant ErrorMgr as ErrorTelemetryService
    participant DB as SQLite Database

    User->>UI: Redacta: "I have 22 years and it depends of my family."
    User->>UI: Presiona "Revisión Socrática (Fase 1)"
    UI->>SocraticMgr: requestSocraticClues(text)
    SocraticMgr->>Gemini: POST generateContent (Prompt Socrático + SocraticFeedbackSchema)
    Gemini-->>SocraticMgr: 200 OK { clues: ["¿Cómo se expresa la edad?", "¿Qué partícula rige depend?"] }
    
    SocraticMgr->>DB: INSERT INTO writing_draft_revisions (draft_text, hints, revision=1)
    SocraticMgr-->>UI: Renderiza editor con subrayados y preguntas guía sin dar la solución
    
    User->>UI: Edita texto: "I am 22 years old and it depends on my family."
    User->>UI: Presiona "Validar Correcciones (Fase 2)"
    UI->>SocraticMgr: submitRevisedDraft(revisedText)
    SocraticMgr->>Gemini: POST generateContent (Prompt Evaluador Final + Schema CEFR)
    Gemini-->>SocraticMgr: 200 OK { score: 8.5, allErrorsResolved: true, nativeReformulation }
    
    SocraticMgr->>DB: UPDATE writing_draft_revisions SET resolved_errors_count=2
    SocraticMgr->>DB: INSERT INTO writing_evaluations (score=8.5, status='EVALUATED')
    SocraticMgr-->>UI: Felicitación: "¡Resolviste ambos errores de transferencia L1 por ti mismo!"
    UI->>User: Muestra micro-reto de afianzamiento y registra progreso
```

---

## 8. Flujo 8: Lectura de Input Comprensible ($i+1$) y Captura en 1 Clic

Describe cómo el usuario lee un artículo, visualiza palabras en estudio resaltadas y extrae nuevos términos hacia FSRS:

```mermaid
sequenceDiagram
    autonumber
    actor User as Estudiante
    participant UI as SmartReaderView
    participant ReaderEngine as GradedReaderEngine
    participant AiGateway as GeminiAiGateway
    participant Gemini as Google Gemini (3.x Flash)
    participant CardRepo as CardRepository
    participant DB as SQLite Database

    User->>UI: Abre artículo: "The Future of Cloud Computing"
    UI->>ReaderEngine: loadArticleWithNoticing(articleId, userId)
    ReaderEngine->>DB: SELECT word, id, state FROM srs_cards WHERE user_id=? AND state IN ('LEARNING', 'RELEARNING')
    DB-->>ReaderEngine: ActiveCards[]
    ReaderEngine->>ReaderEngine: Anota el texto subrayando los términos coincidentes
    ReaderEngine-->>UI: Renderiza texto con Noticing reactivo activo

    User->>UI: Lee y hace clic sobre palabra desconocida: "unravel"
    UI->>ReaderEngine: quickLookup("unravel", contextSentence)
    ReaderEngine-->>UI: Despliega popup emergente con definición IPA y traducción
    
    User->>UI: Presiona "Añadir a mi Repaso FSRS"
    UI->>AiGateway: enrichVocabularyTerm("unravel", contextSentence)
    AiGateway->>Gemini: POST generateContent (Prompt Enriquecedor)
    Gemini-->>AiGateway: 200 OK { fullMetadata }
    AiGateway->>DB: INSERT INTO vocab_items (...)
    AiGateway->>CardRepo: createSrsCard(target='VOCAB', state='NEW')
    CardRepo->>DB: INSERT INTO srs_cards (...)
    AiGateway-->>UI: "¡'unravel' agregada a tu cola FSRS!"
    UI->>UI: Actualiza el texto subrayando "unravel" en color azul de aprendizaje
```

