# Arquitectura del Sistema (Modelo C4)
## English Learning Assistant (ELA)

Este documento especifica la arquitectura del sistema utilizando el **Modelo C4** (Contexto, Contenedores, Componentes y Patrones de Código), diseñado para comunicar la estructura del software con claridad técnica estricta.

---

## 1. Nivel 1: Diagrama de Contexto del Sistema (System Context)

El diagrama de contexto ilustra cómo el usuario interactúa con ELA y los límites del sistema con servicios externos.

```mermaid
C4Context
    title Diagrama de Contexto - English Learning Assistant (ELA)

    Person(user, "Estudiante Hispanohablante", "Usuario que busca dominar el vocabulario, habla conectada y escritura en inglés.")
    
    System(ela, "English Learning Assistant (ELA)", "Aplicación de software para práctica deliberada, repetición espaciada FSRS, análisis fonético y evaluación asistida por IA.")

    System_Ext(gemini, "Google Gemini API", "Servicio de IA Generativa en la nube para evaluación cualitativa de redacción y retroalimentación pedagógica.")
    System_Ext(audio_subsys, "Motor TTS / Audio OS", "Sintetizador Web Speech / Neural Voices para reproducción de fonemas y oraciones.")
    SystemDb_Ext(os_storage, "Almacenamiento Local del SO", "Sistema de archivos local y base de datos SQLite para persistencia 100% privada.")

    Rel(user, ela, "Estudia tarjetas SRS, analiza habla conectada, escribe textos y revisa tareas diarias")
    Rel(ela, gemini, "Envía textos redactados con rúbrica pedagógica y recibe corrección estructurada JSON", "HTTPS / REST")
    Rel(ela, audio_subsys, "Solicita síntesis de voz a velocidad normal y reducida (0.75x)", "Web Audio API / IPC")
    Rel(ela, os_storage, "Lee y escribe estado de usuario, tarjetas, fallas y progreso", "SQLite / File I/O")
```

---

## 2. Nivel 2: Diagrama de Contenedores (Container Diagram)

El sistema se compone de contenedores de ejecución ligera que garantizan una experiencia local-first ultrarrápida:

```mermaid
C4Container
    title Diagrama de Contenedores - ELA

    Person(user, "Estudiante", "Interactúa mediante teclado y ratón")

    Container(frontend, "Capa de Presentación (UI/UX)", "Next.js / React, Tailwind CSS, Lucide Icons", "Interfaz gráfica intuitiva: Dashboard de hábitos, reproductor SRS, analizador fonético y taller de redacción.")
    
    Container(backend, "Capa de Lógica de Negocio (Core API / IPC)", "Node.js (TypeScript) o Python (FastAPI / Tauri Core)", "Orquesta los algoritmos FSRS, matching de reglas fonéticas, analítica de errores y validación de rachas.")

    ContainerDb(database, "Base de Datos Local", "SQLite3 con WAL mode activado", "Almacena tarjetas SRS, catálogo léxico, reglas fonéticas, historial de errores, textos y métricas de racha.")

    Container(audio_engine, "Subsistema de Audio", "Web Speech API / Native TTS", "Procesa reproducción de audio con control de velocidad (1.0x / 0.75x) y caché de fonemas.")

    Container_Ext(gemini_api, "Google Gemini API", "Familia gemini-3.x-flash (3.5, 3.6, 3.7, 3.8)", "Inferencia de lenguaje natural para corrección gramatical y pragmática.")

    Rel(user, frontend, "Usa la aplicación", "GUI")
    Rel(frontend, backend, "Invoca operaciones de dominio y eventos", "REST / tRPC / IPC")
    Rel(backend, database, "Persistencia transaccional de datos", "SQL / Prisma / SQLAlchemy")
    Rel(frontend, audio_engine, "Reproduce audio fonético", "Web Audio API")
    Rel(backend, gemini_api, "Solicitudes de evaluación estructurada", "HTTPS / JSON Payload")
```

---

## 3. Nivel 3: Diagrama de Componentes (Component Diagram)

Detalla los componentes internos dentro del contenedor de lógica de negocio (**Core Application Engine**):

```mermaid
graph TB
    subgraph CoreEngine["Contenedor: Core Application Engine"]
        subgraph ModSRS["Módulo FSRS, Contextos & Drills"]
            FSRSScheduler["FsrsScheduler<br/>(Cálculo DSR: Dificultad, Estabilidad, Retención)"]
            CardManager["CardManager<br/>(Gestor de lotes y filtro de interleaving)"]
            ContextRotator["ContextRotator<br/>(Rotador de oraciones cloze variadas)"]
            SpeedDrillEngine["SpeedDrillEngine<br/>(Temporizador regresivo de 3-5s y métricas)"]
        end

        subgraph ModPho["Módulo de Habla Conectada & Pares Mínimos"]
            PhoneticParser["PhoneticParser<br/>(Tokenizador léxico e IPA fonémico)"]
            RuleMatcher["ConnectedSpeechMatcher<br/>(Detector de elisión, asimilación y enlace)"]
            MinimalPairsUnit["MinimalPairsTrainer<br/>(Discriminación acústica forzada y pares mínimos)"]
        end

        subgraph ModWrt["Módulo de Escritura & IA"]
            WritingGateway["WritingGateway<br/>(Gestión de submissions y micro-writing)"]
            GeminiClient["GeminiAdapter<br/>(Llamadas tipadas con structured JSON schemas)"]
            SocraticOrchestrator["SocraticFeedbackOrchestrator<br/>(Gestor de pistas Fase 1 y auto-corrección)"]
            FeedbackFormatter["PedagogicalFeedbackFormatter<br/>(Generador de diffs y explicaciones)"]
        end

        subgraph ModInp["Módulo de Input Comprensible (i+1)"]
            ReaderEngine["GradedReaderEngine<br/>(Gestor de artículos e historias CEFR)"]
            NoticingAnnotator["NoticingAnnotator<br/>(Subrayado reactivo de tarjetas en estudio)"]
        end

        subgraph ModDia["Módulo de Diagnóstico de Fallas"]
            ErrorRecorder["ErrorTelemetryRecorder<br/>(Catalogador de errores de interlenguaje)"]
            HeatmapCalculator["WeaknessHeatmapEngine<br/>(Ponderación temporal de fallas)"]
            WorkoutFactory["WorkoutFactory<br/>(Generador de Micro-Workouts dirigidos)"]
        end

        subgraph ModCfg["Módulo de Configuración de IA & Pool de Claves"]
            ApiKeyPoolManager["ApiKeyPoolManager<br/>(Gestor multi-llaves, cifrado AES y failover por cuota)"]
            ModelSelector["ModelSelectorService<br/>(Selector y asignador de modelos 3.x Flash)"]
            QuotaMatrix["QuotaMatrixOrchestrator<br/>(Matriz 2D de cuotas 80 RPD y reset PT)"]
        end

        subgraph ModHab["Módulo de Hábitos & Rachas"]
            QuestEvaluator["DailyQuestEvaluator<br/>(Comprobador de metas del día)"]
            StreakManager["StreakStateManager<br/>(Gestor de racha y consumo de Streak Freeze)"]
        end
    end

    WritingGateway --> SocraticOrchestrator
    SocraticOrchestrator --> GeminiClient
    GeminiClient --> ApiKeyPoolManager
    ApiKeyPoolManager --> QuotaMatrix
    GeminiClient --> ModelSelector
    GeminiClient --> FeedbackFormatter
    FeedbackFormatter --> ErrorRecorder
    CardManager --> FSRSScheduler
    CardManager --> ContextRotator
    CardManager --> ErrorRecorder
    SpeedDrillEngine --> ErrorRecorder
    PhoneticParser --> RuleMatcher
    RuleMatcher --> MinimalPairsUnit
    ReaderEngine --> NoticingAnnotator
    NoticingAnnotator --> CardManager
    ErrorRecorder --> HeatmapCalculator
    HeatmapCalculator --> WorkoutFactory
    CardManager --> QuestEvaluator
    WritingGateway --> QuestEvaluator
    MinimalPairsUnit --> QuestEvaluator
    ReaderEngine --> QuestEvaluator
    QuestEvaluator --> StreakManager
```

---

## 4. Nivel 4: Patrones de Diseño y Principios de Código

Para garantizar la mantenibilidad y desacoplamiento del sistema, se adoptan los siguientes patrones:

1. **Repository Pattern (Patrón Repositorio):**
   - Aísla la capa de acceso a datos (`ICardRepository`, `IVocabRepository`, `IErrorRepository`). Si en el futuro se migra de SQLite a PostgreSQL en la nube, el dominio permanece intacto.
2. **Strategy Pattern (Patrón Estrategia) para Prompts de IA:**
   - La interfaz `IEvaluationStrategy` permite alternar entre estrategias de inferencia según el modelo seleccionado de la familia 3.x Flash (`gemini-3.5-flash`, `gemini-3.6-flash`, `gemini-3.7-flash` y `gemini-3.8-flash`) para calibrar latencia y profundidad de análisis pedagógico.
3. **State Machine Pattern (Máquina de Estados) para Rachas y FSRS:**
   - La vida de una tarjeta pasa por estados formales: `New` $\rightarrow$ `Learning` $\rightarrow$ `Review` $\rightarrow$ `Relearning`.
   - La racha diaria opera bajo una máquina de estados determinista (`Pending` $\rightarrow$ `Completed` $\rightarrow$ `Frozen` $\rightarrow$ `Broken`).
4. **Observer Pattern / Event Bus (Bus de Eventos Interno):**
   - Cuando ocurre el evento `CardReviewedEvent` o `WritingEvaluatedEvent`, los suscriptores (`ErrorRecorder`, `DailyQuestEvaluator`) reaccionan asíncronamente sin acoplamiento directo.
