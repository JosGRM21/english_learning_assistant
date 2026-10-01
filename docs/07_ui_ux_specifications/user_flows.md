# Diagramas de Flujos de Usuario (User Flows)
## English Learning Assistant (ELA)

Este documento describe los cuatro flujos de interacción paso a paso más relevantes de la experiencia del estudiante.

---

## 1. Flujo de la Rutina Diaria (Daily Routine Flow)

```mermaid
flowchart TD
    Start([Usuario abre la aplicación]) --> CheckFreeze{¿Se consumió un<br/>Streak Freeze ayer?}
    CheckFreeze -- Sí --> ShowFreezeModal["Mostrar Alerta Amable:<br/>'¡Tu racha fue salvada ayer!'"]
    ShowFreezeModal --> Dashboard
    CheckFreeze -- No --> Dashboard[Renderizar Dashboard Principal]

    Dashboard --> ViewQuests["Revisar Daily Quests del día:<br/>1. SRS Flashcards<br/>2. Audio Fonético<br/>3. Redacción IA"]
    
    ViewQuests --> SelectAction{"¿Qué desea realizar primero?"}
    
    SelectAction -->|Repaso| SRSFlow[Completar sesión SRS]
    SelectAction -->|Fonética| PhoFlow[Escuchar y analizar regla de audio]
    SelectAction -->|Escritura| WrtFlow[Escribir micro-texto y evaluar con IA]

    SRSFlow --> CheckAllDone{¿Completó las metas mínimas?}
    PhoFlow --> CheckAllDone
    WrtFlow --> CheckAllDone

    CheckAllDone -- No --> Dashboard
    CheckAllDone -- Sí --> Congrats["¡Día Superado!<br/>Incrementar Racha (+1 día)<br/>Animación de confeti y feedback positivo"]
    Congrats --> End([Fin de la sesión diaria])
```

---

## 2. Flujo de Sesión de Repaso con FSRS (Spaced Repetition Flow)

```mermaid
flowchart TD
    StartSRS([Iniciar sesión de repaso]) --> LoadQueue[Cargar tarjetas pendientes]
    LoadQueue --> CardCheck{¿Quedan tarjetas en cola?}
    
    CardCheck -- No --> Summary["Resumen de Sesión:<br/>• Total repasadas<br/>• Retención estimada<br/>• Próximas tarjetas para mañana"]
    Summary --> EndSRS([Volver al Dashboard])

    CardCheck -- Sí --> ShowFront["Mostrar ANVERSO de la tarjeta:<br/>(Oración con hueco o definición)"]
    ShowFront --> UserRecall[Usuario intenta evocar activamente mentalmente o por escrito]
    UserRecall --> PressFlip["Presiona [Espacio] o hace clic en 'Revelar'"]
    
    PressFlip --> ShowBack["Mostrar REVERSO:<br/>• Término en inglés<br/>• Transcripción IPA<br/>• Audio automático<br/>• Notas de falso amigo"]
    
    ShowBack --> UserRate{"Usuario califica su esfuerzo mental:"}
    UserRate -->|Tecla 1| Again["1. Again (Olvido)<br/>• S reinicia<br/>• Se reinserta en la cola actual"]
    UserRate -->|Tecla 2| Hard["2. Hard (Dificultoso)<br/>• S crece poco"]
    UserRate -->|Tecla 3| Good["3. Good (Óptimo)<br/>• S crece normalmente"]
    UserRate -->|Tecla 4| Easy["4. Easy (Inmediato)<br/>• S crece aceleradamente"]

    Again --> SaveProgress[Actualizar tarjeta en SQLite]
    Hard --> SaveProgress
    Good --> SaveProgress
    Easy --> SaveProgress

    SaveProgress --> CardCheck
```

---

## 3. Flujo del Taller de Redacción y Evaluación con Gemini

```mermaid
flowchart TD
    StartWrt([Abrir Writing Studio]) --> SelectMode{"Elegir Modalidad"}
    SelectMode -->|Modo Libre| FreeText[Editor en blanco]
    SelectMode -->|Modo Guiado| PickPrompt[Seleccionar prompt temático según nivel CEFR]
    
    PickPrompt --> Editor[Redactar texto en el editor]
    FreeText --> Editor
    
    Editor --> ValidateWords{¿Tiene al menos<br/>30 palabras?}
    ValidateWords -- No --> WarnWords["Alerta: Escribe al menos 30 palabras para una evaluación rica"]
    WarnWords --> Editor

    ValidateWords -- Sí --> Submit[Presionar 'Evaluar con IA']
    Submit --> LoadingState["Spinner activo: 'Analizando sintaxis y pragmática con Gemini...'"]
    
    LoadingState --> ResultState["Mostrar Panel de Evaluación Pedagógica:<br/>• Nivel CEFR estimado<br/>• Resumen motivador en español<br/>• Fragmentos con errores resaltados con colores"]

    ResultState --> ClickError[Usuario hace clic en un error resaltado]
    ClickError --> ErrorDetail["Desglose:<br/>• Explicación en español<br/>• Nota de interferencia L1 si aplica<br/>• Reformulación nativa"]

    ErrorDetail --> Challenge["Presentar Micro-Reto interactivo de validación"]
    Challenge --> AnswerChallenge[Usuario responde la pregunta]
    AnswerChallenge --> FeedbackChallenge["Retroalimentación inmediata del reto"]
    FeedbackChallenge --> SaveSubmission["Guardar texto en el historial del estudiante"]
    SaveSubmission --> UpdateErrors["Enviar fallos al motor de Heatmap"]
    UpdateErrors --> EndWrt([Fin de la sesión de escritura])
```

---

## 4. Flujo de Entrenamiento de Habla Conectada y Pares Mínimos

```mermaid
flowchart TD
    StartPhon([Acceder a Módulo Fonético]) --> SelectMode{Seleccionar Modo}
    SelectMode -- Habla Conectada --> SelectSentence[Seleccionar frase con fenómenos de enlace]
    SelectSentence --> InspectRules[Analizar desglose IPA y arcos de unión fonética]
    InspectRules --> PlayNative[Escuchar modelo nativo a 1.0x o 0.75x]
    PlayNative --> MarkDoneCS[Completar revisión de regla]

    SelectMode -- Pares Mínimos --> SelectContrast[Seleccionar contraste crítico p. ej. /iː/ vs /ɪ/]
    SelectContrast --> PlayBlindAudio[Reproducir estímulo auditivo a ciegas]
    PlayBlindAudio --> Countdown[Temporizador regresivo de 2.0s activo]
    Countdown --> ChooseOption[Usuario selecciona la palabra escuchada]
    ChooseOption --> EvalPerception{¿Acierto?}
    EvalPerception -- Sí --> SuccessFeedback[Mostrar feedback verde y audio contrastivo]
    EvalPerception -- No --> ErrorFeedback[Registrar error en Heatmap y mostrar tip articulatorio]
    SuccessFeedback --> NextDrill{¿Continuar sesión?}
    ErrorFeedback --> NextDrill
    NextDrill -- Sí --> PlayBlindAudio
    NextDrill -- No --> MarkDonePM[Marcar Quest del día completada]
    MarkDoneCS --> EndPhon([Volver al Dashboard])
    MarkDonePM --> EndPhon
```

---

## 5. Flujo del Lector Inteligente ($i+1$ Smart Reader)

```mermaid
flowchart TD
    StartRead([Abrir Smart Reader]) --> PickArticle[Seleccionar artículo graduado o pegar texto]
    PickArticle --> TokenizeArticle[Motor analiza y resalta términos activos en FSRS]
    TokenizeArticle --> ReadingView[Estudiante lee el texto en modo inmersivo]
    
    ReadingView --> ClickWord[Clic sobre palabra desconocida o chunk]
    ClickWord --> ShowQuickPopup[Desplegar popup instantáneo: IPA + Significado + CEFR]
    
    ShowQuickPopup --> AddCardChoice{¿Desea guardarla?}
    AddCardChoice -- No --> ClosePopup[Cerrar popup y continuar lectura] --> ReadingView
    AddCardChoice -- Sí --> ClickAdd[Pulsar 'Añadir a mi Repaso FSRS']
    ClickAdd --> AutoEnrich[Gemini auto-enriquece la entrada en segundo plano]
    AutoEnrich --> UnderlineWord[Palabra se subraya en azul como término en aprendizaje]
    UnderlineWord --> UpdateProgress[Actualizar porcentaje de lectura del artículo]
    UpdateProgress --> EndRead([Finalizar lectura del día])
```

---

## 6. Flujo del Gimnasio de Drills de Velocidad (Speed-Run)

```mermaid
flowchart TD
    StartDrill([Iniciar Speed-Run 60s]) --> LoadDrillBatch[Cargar ráfaga de 12 colocaciones o preposiciones]
    LoadDrillBatch --> PresentItem[Mostrar ítem con temporizador de 4.0 segundos]
    PresentItem --> UserPress[Usuario pulsa tecla numérica 1, 2, 3 o 4]
    
    UserPress --> CheckTime{¿Respondió antes de 4s?}
    CheckTime -- No --> TimeOut[Tiempo agotado: Registrar fallo y mostrar respuesta]
    CheckTime -- Sí --> CheckAns{¿Opción correcta?}
    CheckAns -- Sí --> Hit[Sonido positivo + Registrar latencia ms]
    CheckAns -- No --> Miss[Sonido de corrección + Registrar error en taxonomía]
    
    Hit --> CheckRemaining{¿Quedan ítems en la ráfaga?}
    Miss --> CheckRemaining
    TimeOut --> CheckRemaining
    
    CheckRemaining -- Sí --> PresentItem
    CheckRemaining -- No --> DrillSummary[Mostrar Resumen: Precisión % y Latencia media]
    DrillSummary --> SaveSession[Persistir en speed_drill_sessions y marcar Quest]
    SaveSession --> EndDrill([Fin del Drill])
```

---

## 7. Flujo del Laboratorio Cognitivo y Topológico (Topo-Lab Flow)

```mermaid
flowchart TD
    StartTopo([Abrir Topo-Lab]) --> ChooseDomain{Seleccionar Dominio}
    ChooseDomain -- Preposiciones --> SelectSpatial[Elegir esquema: IN, ON, AT, INTO, ONTO, THROUGH]
    ChooseDomain -- Verbos de Movimiento --> SelectMotion[Elegir par: Satellite vs. Verb-Framed]
    ChooseDomain -- Polisemia Radial --> SelectRadial[Elegir verbo polisémico: RUN, TAKE, GET]

    SelectSpatial --> Render3DBox[Renderizar caja topológica isométrica en SVG/Canvas]
    Render3DBox --> DragTarget[Usuario arrastra el objeto a través de fronteras y superficies]
    DragTarget --> UpdateCognitiveLabel[Actualizar dinámicamente vector y preposición en tiempo real]
    UpdateCognitiveLabel --> ContrastSpanish[Mostrar contraste cognitivo con el 'en' neutro del español]
    ContrastSpanish --> LaunchMicroDrill[Desafío relámpago de 30s de selección topológica rápida]
    LaunchMicroDrill --> SaveTopo[Persistir maestría del esquema]

    SelectMotion --> MotionSim[Visualizar descompositor: Manner en verbo + Path en partícula]
    MotionSim --> SaveTopo

    SelectRadial --> RadialGraph[Explorar grafo de extensiones metafóricas desde el núcleo físico]
    RadialGraph --> SaveTopo

    SaveTopo --> EndTopo([Completar módulo cognitivo])
```

---

## 8. Flujo de Escucha Ascendente en 3 Pasos (Bottom-Up Listening Flow)

```mermaid
flowchart TD
    StartBU([Iniciar Sesión de Escucha]) --> Step1["Paso 1: Audio Ciego (Blind Audio)<br/>• Escuchar pasaje completo a velocidad nativa (1.0x)<br/>• Sin subtítulos ni texto<br/>• Formular hipótesis global del significado"]
    Step1 --> Step2["Paso 2: Noticing Acústico y Transcripción<br/>• Reproducir micro-segmentos con pausas automáticas<br/>• Usuario transcribe chunks fonéticos percibidos<br/>• Revelar fenómenos: linking, flapping, elisiones"]
    Step2 --> CheckAccuracy{¿Identificó los chunks clave?}
    CheckAccuracy -- Sí --> Step3["Paso 3: Integración y Lexical Profiler<br/>• Desplegar texto completo con marcado Nation (K1-K2 vs K3+)<br/>• Re-escuchar audio leyendo simultáneamente<br/>• Calcular % de cobertura léxica"]
    CheckAccuracy -- No --> LoopSegment["Re-escuchar micro-segmento a 0.75x con pitch preservado"]
    LoopSegment --> Step2
    Step3 --> HarvestVocab{¿Desea guardar palabras K3+?}
    HarvestVocab -- Sí --> AddToFSRS["Añadir a FSRS con 1 Clic"]
    HarvestVocab -- No --> CompleteBU[Marcar sesión de escucha completada]
    AddToFSRS --> CompleteBU
    CompleteBU --> EndBU([Fin de la sesión de escucha])
```


