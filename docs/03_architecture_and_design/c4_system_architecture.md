# Arquitectura del Sistema (Modelo C4)
## English Learning Assistant (ELA)

Este documento especifica la arquitectura del sistema utilizando el **Modelo C4** (Contexto, Contenedores, Componentes y Patrones de Código), diseñado para comunicar la estructura del software con claridad técnica estricta y alineación con los principios pedagógicos de [`docs/02_pedagogical_framework/`](../02_pedagogical_framework/).

---

## 1. Nivel 1: Diagrama de Contexto del Sistema (System Context)

El diagrama de contexto ilustra cómo el usuario interactúa con ELA y los límites del sistema con subsistemas y servicios externos.

```mermaid
C4Context
    title Diagrama de Contexto - English Learning Assistant (ELA)

    Person(user, "Estudiante Hispanohablante", "Usuario adulto que busca dominar el vocabulario, habla conectada y fluidez escrita en inglés en tiempo récord.")
    
    System(ela, "English Learning Assistant (ELA)", "Aplicación de escritorio local-first para práctica deliberada, FSRS, análisis fonético, mitigación L1 y tutoría socrática con IA.")

    System_Ext(gemini, "Google Gemini API", "Servicio de IA Generativa en la nube (familia Gemini 3.x Flash) para andamiaje socrático, simplificación CEFR y enriquecimiento léxico.")
    System_Ext(audio_subsys, "Motor TTS & Audio", "Sintetizador Web Speech / Neural Voices para reproducción de modelos nativos y pares mínimos.")
    SystemDb_Ext(os_storage, "Almacenamiento Local del SO", "Sistema de archivos local y base de datos SQLite (WAL mode) para persistencia 100% privada y cifrado de claves.")

    Rel(user, ela, "Practica repetición activa, drills de velocidad, gimnasio fonético y lecturas i+1")
    Rel(ela, gemini, "Envía borradores de redacción, oraciones y textos con schemas JSON tipados", "HTTPS / REST")
    Rel(ela, audio_subsys, "Solicita síntesis de voz multi-hablante (1.0x / 0.75x)", "Web Audio API / SpeechSynthesis")
    Rel(ela, os_storage, "Lee y escribe estado de usuario, tarjetas FSRS, métricas de proceduralización y fallas", "SQLite3 / File I/O")
```

---

## 2. Nivel 2: Diagrama de Contenedores (Container Diagram)

El sistema se compone de contenedores de ejecución ligera que garantizan una experiencia local-first de latencia ultrabaja:

```mermaid
C4Container
    title Diagrama de Contenedores - ELA

    Person(user, "Estudiante", "Interactúa mediante teclado y ratón")

    Container(frontend, "Capa de Presentación (UI/UX)", "React / Next.js, Tailwind CSS, Lucide Icons", "Interfaz gráfica 'Warm Minimalist': Dashboard SRL, Reproductor FSRS, Gimnasio HVPT, Socratic Writing Studio y Smart Reader.")
    
    Container(backend, "Capa de Lógica de Negocio (Core Application Engine)", "TypeScript / Tauri Rust Core", "Orquesta los algoritmos FSRS 4.5, proceduralización RT, análisis fonético, detección L1 y gateway de IA.")

    ContainerDb(database, "Base de Datos Local", "SQLite3 con WAL mode y claves foráneas", "Almacena catálogo léxico, reglas fonéticas, tarjetas FSRS, métricas de error y cuotas 2D.")

    Container(audio_engine, "Subsistema de Audio", "Web Audio API / Native Speech", "Procesa reproducción de estímulos auditivos y caché de fonemas.")

    Container_Ext(gemini_api, "Google Gemini API Gateway", "Familia gemini-3.x-flash (3.5, 3.6, 3.7, 3.8)", "Inferencia con respuesta JSON estructurada para feedback socrático en 4 niveles, simplificación y léxico.")

    Rel(user, frontend, "Usa la aplicación con atajos de teclado y ratón", "GUI")
    Rel(frontend, backend, "Invoca comandos de dominio, eventos y consultas", "IPC / Typed Channels")
    Rel(backend, database, "Persistencia transaccional de datos", "SQL / Better-SQLite3 / SQL.js")
    Rel(frontend, audio_engine, "Reproduce audio y pares auditivos", "Web Audio API")
    Rel(backend, gemini_api, "Solicitudes HTTPS tipadas con fallback 2D", "HTTPS / JSON Payload")
```

---

## 3. Nivel 3: Diagrama de Componentes (Component Diagram)

Detalla la arquitectura modular desacoplada dentro del contenedor de lógica de negocio (**Core Application Engine**):

```mermaid
graph TB
    subgraph CoreEngine["Contenedor: Core Application Engine"]
        subgraph ModSRS["1. Dominio FSRS & Proceduralización"]
            FSRSScheduler["FsrsScheduler<br/>(Cálculo DSR: D, S, R)"]
            CardManager["CardManager<br/>(Lotes & Filtro Interleaving)"]
            ContextRotator["ContextRotator<br/>(Rotación de oraciones cloze)"]
            ProceduralEngine["ProceduralizationEngine<br/>(Métrica RT < 1.5s x3 & Ley Potencia)"]
            SpeedDrillArena["SpeedDrillArenaService<br/>(Temporizador 3-5s & Bucle N+3/N+7)"]
        end

        subgraph ModPhoPro["2. Dominio Fonética & Habla Conectada"]
            PhoneticParser["PhoneticParser<br/>(Tokenizador léxico e IPA)"]
            ConnectedSpeechMatcher["ConnectedSpeechMatcher<br/>(Elisión, Asimilación, Enlace, Schwa)"]
            HvptUnit["HvptAudioBankService<br/>(4-6 voces nativas & Forced Choice)"]
        end

        subgraph ModTransfer["3. Dominio Interferencia L1 & Semántica"]
            L1Engine["L1TransferEngine<br/>(Pro-Drop, TAM, Preposiciones, #sC, Mudas)"]
            ThirdPersonExtinguisher["ThirdPersonExtinguisher<br/>(Drills de sustitución rápida 2.0s)"]
            ConceptualFraming["ConceptualFramingEngine<br/>(Thinking for Speaking: Marco Satelital)"]
            PrepositionTopo["PrepositionTopoEngine<br/>(Esquemas IN/ON/AT de Lakoff)"]
            PolysemyDisambiguator["PolysemyDisambiguator<br/>(Make/Do, Say/Tell, Hear/Listen)"]
        end

        subgraph ModSocWrt["4. Dominio Escritura & Tutoría Socrática IA"]
            SocraticOrchestrator["SocraticFeedbackOrchestrator<br/>(Andamiaje 4 Niveles ZPD)"]
            MicroWritingStudio["MicroWritingService<br/>(Consignas ultracortas 15-35 palabras)"]
            GeminiGateway["GeminiAiGateway<br/>(Pool Multi-Key & Cascada 2D)"]
        end

        subgraph ModReader["5. Dominio Input Comprensible"]
            ReaderEngine["GradedReaderEngine<br/>(Gestor de artículos y biblioteca CEFR)"]
            CoverageProfiler["LexicalCoverageProfiler<br/>(Análisis de umbrales 95/98% NGSL)"]
            BottomUpEngine["BottomUpListeningEngine<br/>(Protocolo 3 pasos: Ciego/Tónico/Conectado)"]
            TextSimplifier["TextSimplifierService<br/>(Reescritura al 95% con Gemini)"]
        end

        subgraph ModDiagnostics["6. Dominio Diagnóstico & Métricas"]
            ErrorRecorder["ErrorTelemetryRecorder<br/>(Taxonomía Corder + Códigos L1)"]
            HeatmapEngine["WeaknessHeatmapEngine<br/>(Decaimiento temporal exponencial)"]
            WorkoutFactory["WorkoutFactory<br/>(Generador Micro-Workouts 5 min)"]
        end

        subgraph ModHabits["7. Dominio Autorregulación & Hábitos"]
            SrlOrchestrator["SrlCycleOrchestrator<br/>(Zimmerman: Previsión/Desempeño/Reflexión)"]
            StreakManager["StreakStateManager<br/>(Never Miss Twice & Streak Freezes)"]
            BacklogThrottler["BacklogThrottlerService<br/>(Prevención de Review Hell)"]
        end

        subgraph ModConfig["8. Dominio Configuración & Resiliencia"]
            ApiKeyPoolManager["ApiKeyPoolManager<br/>(Cifrado AES-256 & Failover)"]
            QuotaMatrix["QuotaMatrixOrchestrator<br/>(80 RPD/key & Reset PT)"]
        end
    end

    %% Relaciones entre componentes
    CardManager --> FSRSScheduler
    CardManager --> ContextRotator
    CardManager --> ErrorRecorder
    ProceduralEngine --> SpeedDrillArena
    SpeedDrillArena --> ErrorRecorder
    
    PhoneticParser --> ConnectedSpeechMatcher
    HvptUnit --> ErrorRecorder

    L1Engine --> ThirdPersonExtinguisher
    L1Engine --> ErrorRecorder
    ConceptualFraming --> PrepositionTopo
    ConceptualFraming --> PolysemyDisambiguator

    SocraticOrchestrator --> GeminiGateway
    MicroWritingStudio --> GeminiGateway
    GeminiGateway --> ApiKeyPoolManager
    ApiKeyPoolManager --> QuotaMatrix

    ReaderEngine --> CoverageProfiler
    CoverageProfiler --> TextSimplifier
    TextSimplifier --> GeminiGateway
    ReaderEngine --> BottomUpEngine

    ErrorRecorder --> HeatmapEngine
    HeatmapEngine --> WorkoutFactory

    CardManager --> SrlOrchestrator
    SpeedDrillArena --> SrlOrchestrator
    SrlOrchestrator --> StreakManager
    CardManager --> BacklogThrottler
```

---

## 4. Nivel 4: Patrones de Diseño y Principios Arquitectónicos

1. **Repository Pattern (Patrón Repositorio):**
   - Aísla la persistencia de datos tras interfaces agnósticas (`ICardRepository`, `IVocabRepository`, `IErrorRepository`).
2. **Strategy Pattern (Patrón Estrategia) para Evaluación y Scaffolding:**
   - La interfaz `IEvaluationStrategy` desacopla los distintos tipos de inferencia pedagógica (`SocraticScaffoldingStrategy`, `TextSimplificationStrategy`, `VocabularyEnrichmentStrategy`).
3. **State Machine Pattern (Máquina de Estados Finita) Determinista:**
   - Vida de tarjetas FSRS: `NEW` $\rightarrow$ `LEARNING` $\rightarrow$ `REVIEW` $\rightarrow$ `RELEARNING`.
   - Proceduralización: `DECLARATIVE` $\rightarrow$ `COMPILING` $\rightarrow$ `PROCEDURALIZED` (certificación a $RT < 1.5$ s en 3 sesiones).
   - Racha diaria: `PENDING` $\rightarrow$ `COMPLETED` $\rightarrow$ `FROZEN` $\rightarrow$ `GRACE_PERIOD` $\rightarrow$ `RESET`.
   - Decodificación auditiva: `STEP1_BLIND` $\rightarrow$ `STEP2_TONIC` $\rightarrow$ `STEP3_FULL_CONNECTED`.
4. **Observer Pattern / Event Bus Desacoplado:**
   - Eventos de dominio centrales (`CardReviewedEvent`, `ErrorCommittedEvent`, `DrillCompletedEvent`) notifican a los suscriptores (`WeaknessHeatmapEngine`, `DailyQuestEvaluator`, `StreakStateManager`) de forma asíncrona sin acoplamiento temporal ni espacial.
5. **Circuit Breaker & Fallback 2D para IA:**
   - Protección contra HTTP 429 (`RESOURCE_EXHAUSTED`): conmutación horizontal de clave y degradación vertical de modelo (3.8 $\rightarrow$ 3.7 $\rightarrow$ 3.6 $\rightarrow$ 3.5 Flash).

