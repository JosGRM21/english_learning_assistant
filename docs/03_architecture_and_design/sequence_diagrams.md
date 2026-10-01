# Diagramas de Secuencia de Flujos Clave
## English Learning Assistant (ELA)

Este documento detalla los flujos de interacción temporal entre los componentes del sistema mediante **Diagramas de Secuencia UML (Mermaid)** para los procesos fundamentales del software, reflejando fielmente el marco pedagógico de [`docs/02_pedagogical_framework/`](../02_pedagogical_framework/).

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

## 4. Flujo 4: Ingesta Rápida y Auto-Enriquecimiento de Vocabulario con Gemini

Describe el proceso donde el usuario ingresa solo una palabra y la IA deduce toda la información lingüística, insertándola en SQLite y programando su tarjeta FSRS:

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
    VocabCtrl->>VocabRepo: insertVocabItem(data)
    VocabRepo->>DB: INSERT INTO vocab_items (...)
    
    VocabCtrl->>CardRepo: createSrsCard('VOCAB', vocabId, state='NEW', initialD=5.0)
    CardRepo->>DB: INSERT INTO srs_cards (...)
    
    VocabCtrl-->>UI: Confirmación: "¡'reluctant' guardada exitosamente y lista para tu sesión SRS!"
```

---

## 5. Flujo 5: Gimnasio HVPT Multi-Voz con Elección Forzada a Ciegas (2.0s)

Describe cómo el estudiante es expuesto a estímulos auditivos a ciegas entre 4 a 6 voces nativas con restricción estricta de tiempo:

```mermaid
sequenceDiagram
    autonumber
    actor User as Estudiante
    participant UI as HvptGymView (Frontend)
    participant AudioBank as HvptAudioBankService
    participant Timer as ForcedChoiceTimer (2.0s)
    participant ErrorMgr as ErrorTelemetryService
    participant DB as SQLite Database

    User->>UI: Inicia drill de pares mínimos: /iː/ vs /ɪ/
    UI->>AudioBank: getRandomStimulus(contrast: "i_vs_I_colon")
    AudioBank-->>UI: { audioBlob: "voice_03_female_rp_ship.mp3", correctWord: "ship", foil: "sheep" }
    
    UI->>UI: Pantalla a ciegas (Oculta texto de opciones)
    UI->>User: Reproduce estímulo auditivo [ʃɪp] con Voz 3 (RP)
    UI->>UI: Revela botones [ SHIP ] vs [ SHEEP ]
    UI->>Timer: Inicia cuenta regresiva visual (2.0 s)

    alt Usuario responde "SHIP" en 1.15 segundos
        User->>UI: Clic en [ SHIP ]
        Timer->>UI: Cancela temporizador
        UI->>UI: Feedback verde + sonido de convalidación
        UI->>DB: Registra acierto con RT = 1.150 ms en weakness_metrics
    else Temporizador llega a 0.0 s (Timeout) o Selección Errónea
        Timer->>UI: Expiración de tiempo
        UI->>UI: Alerta ámbar de Predicción Errónea
        UI->>ErrorMgr: recordError(type='PHONETICS', subtag='PHO_VOWEL_COLLAPSE_I')
        UI->>AudioBank: playContrastSequence("ship_rp", "sheep_rp")
        AudioBank-->>User: Emite ambos sonidos en contraste inmediato
    end
```

---

## 6. Flujo 6: Decodificación Auditiva Bottom-Up en Tres Pasos con Simplificación al 95%

Describe cómo el alumno entrena su audición segmentando el habla continua de forma ascendente:

```mermaid
sequenceDiagram
    autonumber
    actor User as Estudiante
    participant UI as GradedReaderView
    participant ReaderEngine as GradedReaderEngine
    participant Profiler as LexicalCoverageProfiler
    participant Simplifier as TextSimplifierService
    participant GeminiGateway as GeminiAiGateway
    participant AudioPlayer as AudioSubsystem

    User->>UI: Carga artículo técnico nuevo
    UI->>Profiler: calculateCoverage(articleText, userVocabProfile)
    Profiler-->>UI: Cobertura calculada = 91% (< 95% Sobrecarga Cognitiva)
    
    UI->>User: Alerta roja: "Texto con alta sobrecarga léxica. ¿Deseas simplificarlo al 95%?"
    User->>UI: Presiona "Simplificar con Gemini"
    UI->>Simplifier: simplifyText(articleText, targetCefr='B1', targetCoverage=0.95)
    Simplifier->>GeminiGateway: requestSimplification(articleText)
    GeminiGateway-->>Simplifier: SimplifiedArticle (96% cobertura)
    Simplifier-->>UI: Carga texto reescrito en el lector

    %% Protocolo 3 Pasos
    User->>UI: Inicia entrenamiento de Escucha Bottom-Up
    Note over UI,AudioPlayer: Paso 1: Audio Ciego a 1.0x (Texto 100% Oculto)
    UI->>AudioPlayer: playAudio(1.0)
    User->>UI: Intenta segmentar las palabras mentalmente
    
    Note over UI: Paso 2: Revela Texto Parcial (Solo palabras tónicas acentuadas)
    UI->>UI: Renderiza esqueleto léxico destacando las lagunas átonas
    
    Note over UI,AudioPlayer: Paso 3: Revela Texto Completo con Conectores
    UI->>UI: Dibuja enlaces, elisiones y reducciones Schwa
    UI->>AudioPlayer: playSynchronizedAudio(1.0)
    AudioPlayer-->>UI: Eventos de sincronización de palabra activa
```

---

## 7. Flujo 7: Speed Drills, Bucle de Micro-Recuperación (N+3/N+7) y Certificación de Proceduralización

Describe el proceso de compilación motora en ganglios basales:

```mermaid
sequenceDiagram
    autonumber
    actor User as Estudiante
    participant UI as SpeedDrillArenaView
    participant DrillEngine as SpeedDrillArenaService
    participant ProceduralEngine as ProceduralizationEngine
    participant Timer as DrillTimer (3.0s)
    participant DB as SQLite Database

    User->>UI: Inicia ráfaga "Clause Shift: Transformación Rápida"
    UI->>DrillEngine: startSession(type='CLAUSE_SHIFT')
    DrillEngine-->>UI: Ítem 1: "They went to Paris" + Operador: "[NEGATIVE]"
    UI->>Timer: Inicia cuenta regresiva (3.0 s)

    alt Caso Éxito en Ventana Procedural (RT < 1.5s)
        User->>UI: Escribe "They didn't go to Paris" en 1.120 ms
        Timer->>UI: Cancela temporizador
        UI->>ProceduralEngine: recordPass(cardId, latencyMs: 1120)
        ProceduralEngine->>ProceduralEngine: Incrementa consecutiveFastRetrievals a 3
        ProceduralEngine->>DB: UPDATE srs_cards SET is_proceduralized=1
        ProceduralEngine-->>UI: "¡Ítem Proceduralizado Certificado en Memoria Motora!"
    else Caso Fallo o Timeout
        Timer->>UI: Expiración de tiempo (3.0 s)
        UI->>UI: Flash verde de 1.0 s con respuesta correcta
        UI->>DrillEngine: recordFailure(item1)
        DrillEngine->>DrillEngine: Programa reinyección en caliente en turno N+3
        DrillEngine->>DrillEngine: Programa reinyección variada en turno N+7
        DrillEngine->>DB: INSERT INTO user_errors (...)
        UI->>DrillEngine: Carga Ítem 2 inmediatamente
    end
```
