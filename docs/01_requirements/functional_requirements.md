---
title: Especificación de Requisitos Funcionales (SRS)
---

# Especificación de Requisitos Funcionales (SRS)

## English Learning Assistant (ELA)

Este documento define de manera formal y numerada los **Requisitos Funcionales (RF)** del sistema, alineados con el estándar IEEE 830 / ISO/IEC/IEEE 29148. Cada requisito cuenta con su identificador único, descripción detallada, entradas, salidas y justificación pedagógica.

---

## 1. Módulo de Gestión de Vocabulario y Léxico (RF-VOC)

### RF-VOC-01: Categorización Gramatical Estricta

- **Descripción:** El sistema debe categorizar cada elemento léxico registrado en una de las tres macro-dimensiones y sus subcategorías:
  1. **Palabras de Contenido:**
     - Sustantivos (concretos, abstractos, contables, incontables).
     - Verbos (transitivos, intransitivos, estativos, dinámicos, regulares, irregulares).
     - Adjetivos (gradables, no gradables, comparativos, superlativos).
     - Adverbios (modo, tiempo, lugar, frecuencia, grado).
  2. **Palabras Funcionales:**
     - Preposiciones y Postposiciones (espaciales, temporales, de causa/modo).
     - Conjunciones (coordinantes, subordinantes, correlativas).
     - Artículos y Determinantes (definidos, indefinidos, demostrativos, posesivos, cuantificadores).
     - Pronombres (personales, acusativos, reflexivos, relativos).
  3. **Unidades Fraseológicas (Lexical Chunks):**
     - Colocaciones léxicas (*collocations*: verbo+sustantivo, adjetivo+sustantivo, adverbio+adjetivo).
     - Expresiones idiomáticas (*idioms* y refranes).
     - Verbos compuestos (*phrasal verbs* clasificados en separables, inseparables y transitivos/intransitivos).
     - Fórmulas de conversación / gambits (*sentence frames* como *"On the other hand"*, *"As far as I'm concerned"*).
- **Justificación Pedagógica:** La memoria lingüística procesa el léxico mediante agrupaciones semánticas y sintácticas; aprender palabras aisladas sin su función gramatical ni sus colocaciones naturales produce un uso torpe y no nativo (*The Lexical Approach* - Michael Lewis).

### RF-VOC-02: Enriquecimiento Semántico y Morfológico

- **Descripción:** Para cada entrada de vocabulario, el sistema debe almacenar y visualizar:
  - Definición primaria y secundaria en inglés sencillo (*Learner-friendly definition*).
  - Equivalencia o traducción explicativa al español (L1).
  - Al menos dos oraciones de ejemplo contextualizadas en situaciones reales.
  - Familia morfológica de la palabra (p. ej. *create $\rightarrow$ creation $\rightarrow$ creative $\rightarrow$ creatively*).
  - Nivel de referencia del Marco Común Europeo (CEFR): A1, A2, B1, B2, C1, C2.
  - Indicador de "Falso Amigo" (False Cognate) si existe riesgo de transferencia errónea con el español (p. ej. *actually $\ne$ actualmente*).

### RF-VOC-03: Ingesta Rápida y Enriquecimiento Automático de Vocabulario y Chunks con IA
- **Descripción:** El sistema debe contar con un mecanismo de alta velocidad donde el usuario ingresa únicamente una palabra o unidad fraseológica aislada (con o sin contexto inicial), y el sistema utiliza un modelo de la familia Gemini 3.x Flash para autogenerar y persistir toda la metadata requerida:
  1. Identificación automática de la dimensión (Contenido, Función o Unidad Fraseológica) y parte de la oración.
  2. Si es Phrasal Verb: clasificación sintáctica (inseparable, separable, transitivo, 3 partes).
  3. Si es Colocación: estructura sintáctica (verbo+sustantivo, adjetivo+sustantivo, etc.).
  4. Definición en inglés simplificado apta para estudiantes.
  5. Traducción precisa al español contextualizada.
  6. Transcripción fonética dual IPA (General American y Received Pronunciation) con marcas silábicas y acento tónico.
  7. Detección y advertencia de Falso Amigo (*False Cognate*) si existe interferencia con el español.
  8. Dos oraciones de ejemplo auténticas con traducción al español.
  9. Nivel de referencia CEFR estimado (A1 a C2).
  10. Familia morfológica de palabras derivadas.
- **Acción del Sistema:** Al confirmar (o en modo automático de 1 clic), los datos se insertan en `vocab_items` o `phraseological_units`, y se crea de inmediato la tarjeta `srs_cards` inicializada para el motor FSRS en estado `NEW`.

### RF-VOC-04: Banco de Contextos Dinámicos y Rotación de Ejemplos
- **Descripción:** Para cada elemento registrado (`vocab_items` o `phraseological_units`), el sistema debe admitir un banco de al menos 3 a 5 oraciones contextuales auténticas almacenadas en `vocab_context_examples`, con indicación del hueco objetivo (*cloze target*).
- **Comportamiento en Repaso:** En cada presentación de la tarjeta durante sesiones FSRS, el sistema selecciona aleatoriamente un contexto diferente del banco para ese término.
- **Justificación Pedagógica:** La psicología de la memoria demuestra que presentar siempre la misma oración induce un falso recuerdo basado en pistas visuales superficiales; la variabilidad contextual obliga a recuperar la representación semántica abstracta, fortaleciendo la *Fuerza de Almacenamiento (Storage Strength)*.

---

## 2. Módulo de Fonética y Habla Conectada (RF-PHO)

### RF-PHO-01: Transcripción Fonética Dual (IPA)

- **Descripción:** El sistema debe mostrar para cada palabra o frase:
  1. Su transcripción fonética estándar en el Alfabeto Fonético Internacional (IPA) en forma de cita aislada (*citation form*).
  2. La división silábica con marcas de acento primario (`ˈ`) y secundario (`ˌ`).
  3. Soporte para visualización en **Inglés Americano (General American - GA)** y **Británico (Received Pronunciation - RP)**.

### RF-PHO-02: Reproducción Auditiva Multimodal

- **Descripción:** El sistema debe proporcionar la reproducción auditiva de cualquier elemento léxico u oración:
  - Audio con sintetizador de voz neural de alta calidad (Web Speech API o servicio TTS de latencia ultrabaja).
  - Opción de reproducción a velocidad normal (1.0x) y velocidad lenta pedagógica (0.75x) sin alteración de tono (*pitch-preserving*).

### RF-PHO-03: Motor de Reglas de Habla Conectada (Connected Speech)

- **Descripción:** El sistema debe contar con un módulo interactivo para desglosar y entrenar los fenómenos fonéticos que ocurren cuando las palabras se unen en un flujo continuo de habla:
  1. **Elisión (Elision):**
     - Desaparición de las oclusivas alveolares /t/ y /d/ entre consonantes (p. ej. *"last night"* $\rightarrow$ \[lɑːs naɪt\], *"next day"* $\rightarrow$ \[neks deɪ\]).
     - Síncopa de vocales débiles átonas (p. ej. *"camera"* $\rightarrow$ \[ˈkæmrə\], *"family"* $\rightarrow$ \[ˈfæmli\]).
     - Caída de la aspiración /h/ en pronombres y auxiliares débiles (p. ej. *"ask him"* $\rightarrow$ \[ɑːsk ɪm\]).
  2. **Asimilación (Assimilation):**
     - Asimilación regresiva de punto de articulación (p. ej. /n/ antes de bilabiales se convierte en /m/: *"ten boys"* $\rightarrow$ \[tem bɔɪz\]; /t/ antes de velares: *"white coffee"* $\rightarrow$ \[waɪk ˈkɒfi\]).
     - Asimilación coalescente (*Yod-coalescence*):
       - /t/ + /j/ $\rightarrow$ /tʃ/ (*"don't you"* $\rightarrow$ \[ˈdəʊntʃuː\], *"meet you"*).
       - /d/ + /j/ $\rightarrow$ /dʒ/ (*"would you"* $\rightarrow$ \[ˈwʊdʒuː\], *"did you"*).
       - /s/ + /j/ $\rightarrow$ /ʃ/ (*"bless you"* $\rightarrow$ \[ˈbleʃuː\]).
       - /z/ + /j/ $\rightarrow$ /ʒ/ (*"as you wish"* $\rightarrow$ \[əʒ uː wɪʃ\]).
  3. **Enlace (Linking & Liaison):**
     - Enlace Consonante-Vocal (Catenación): la consonante final pasa a formar el ataque de la siguiente sílaba (p. ej. *"hold on"* $\rightarrow$ \[həʊl-dɒn\], *"take off"* $\rightarrow$ \[teɪ-kɒf\]).
     - Enlace Vocal-Vocal con sonidos intrusivos (*Intrusive glides*):
       - Intrusión de /j/ tras vocales anteriores agudas (/iː/, /ɪ/, /eɪ/, /aɪ/, /ɔɪ/) (p. ej. *"I agree"* $\rightarrow$ \[aɪ-j-əˈɡriː\], *"see it"* $\rightarrow$ \[siː-j-ɪt\]).
       - Intrusión de /w/ tras vocales posteriores o redondeadas (/uː/, /ʊ/, /əʊ/, /aʊ/) (p. ej. *"go out"* $\rightarrow$ \[ɡəʊ-w-aʊt\], *"you are"* $\rightarrow$ \[juː-w-ɑː\]).
       - Linking 'r' e Intrusive 'r' para acentos no róticos (p. ej. *"four apples"* $\rightarrow$ \[fɔːr ˈæplz\], *"law and order"* $\rightarrow$ \[lɔːr ənd ˈɔːdə\]).
     - Geminación consonántica: prolongación del sonido cuando dos consonantes iguales se tocan (p. ej. *"black cat"* $\rightarrow$ \[blækːæt\], *"bad dog"* $\rightarrow$ \[bædːɒɡ\]).
  4. **Formas Débiles (Weak Forms) y Ritmo Acentual (*Stress-Timed*):**
     - Reducción fonológica a la vocal Schwa /ə/ en más de 40 palabras funcionales átonas (*to* /tə/, *for* /fə/, *and* /ənd/, *of* /əv/, *can* /kən/, *was* /wəz/).
- **Salida requerida:** Visualizador gráfico que muestre la oración escrita, la representación IPA unida y arcos/conectores interactivos que señalen qué regla fonética se está aplicando en cada frontera de palabra.

### RF-PHO-04: Gimnasio de Pares Mínimos y Discriminación Acústica Forzada
- **Descripción:** Módulo de entrenamiento auditivo enfocado en los contrastes fonológicos críticos identificados en la matriz L1:
  - Discriminación rápida a ciegas entre pares mínimos (/iː/ vs /ɪ/ en *sheep/ship*, /b/ vs /v/ en *berry/very*, /ʃ/ vs /tʃ/ en *share/chair*).
  - Discriminación de fronteras de habla conectada (p. ej. distinguir entre *"ice cream"* y *"I scream"*, o percibir geminación en *"black cat"* vs. *"black at"*).
  - La interfaz reproduce un estímulo auditivo aleatorio y el usuario dispone de un temporizador de 2.0 segundos para seleccionar cuál de los dos elementos fue emitido, registrando errores en `user_errors`.
- **Justificación Pedagógica:** La percepción precede a la producción. La categorización fonémica forzada (Patricia Kuhl) recalibra el mapa auditivo del estudiante hispanohablante, superando el filtro fonológico de la lengua materna.

---

## 3. Módulo de Repetición Espaciada Inteligente (RF-SRS)

### RF-SRS-01: Implementación del Algoritmo FSRS (Free Spaced Repetition Scheduler)

- **Descripción:** El sistema debe programar el calendario de repasos empleando el modelo DSR (Dificultad, Estabilidad, Retención):
  - Cada tarjeta posee una Dificultad intrínseca $D \in [1, 10]$ y una Estabilidad $S$ (en días).
  - El sistema calcula la Retención actual $R(t) = (1 + \text{factor} \cdot \frac{t}{S})^{-\text{power}}$.
  - Las 4 opciones de calificación de cada tarjeta deben ser:
    1. **Again (1):** Olvido total; reinicia la estabilidad y programa reestudio intra-sesión.
    2. **Hard (2):** Recordado con duda significativa o tiempo excesivo; incremento mínimo de intervalo.
    3. **Good (3):** Recuperación exitosa con esfuerzo deseable esperado; cálculo estándar de nuevo intervalo.
    4. **Easy (4):** Recuperación inmediata y sin titubeos; incremento acelerado de estabilidad.
- **Justificación Pedagógica:** FSRS minimiza el número total de repasos diarios necesarios garantizando un 90% de probabilidad de retención, eliminando el problema de saturación (*ease hell*) del antiguo algoritmo SM-2.

### RF-SRS-02: Modalidades Variadas de Recuperación Activa (*Active Recall*)

- **Descripción:** Durante la sesión de repaso, el sistema debe alternar entre diferentes formas de cued-recall para evitar el sesgo de reconocimiento pasivo:
  - Tarjeta inversa: Se muestra la definición o significado en español y el usuario debe escribir o evocar la palabra en inglés.
  - Oración con huecos (*Cloze deletion*): Se muestra una oración real con el término o chunk oculto en contexto.
  - Discriminación auditiva: Se reproduce únicamente el audio y el estudiante debe transcribir o seleccionar la transcripción IPA correcta.

### RF-SRS-03: Drills de Velocidad y Proceduralización (Speed-Retrieval Drills)
- **Descripción:** Modalidad de práctica intensiva cronometrada (60 a 90 segundos por sesión):
  - El sistema presenta una ráfaga continua de 10 a 15 micro-preguntas sobre colocaciones o regímenes preposicionales.
  - Cuenta con una barra de tiempo regresiva fija de **3.0 a 5.0 segundos por ítem**.
  - El usuario debe seleccionar la respuesta correcta o pulsar la tecla rápida antes de que expire el tiempo.
  - El sistema registra la latencia de respuesta en milisegundos (`avg_response_time_ms`) y almacena la sesión en `speed_drill_sessions`.
- **Justificación Pedagógica:** Modelo Declarativo / Procedural de Michael Ullman. Para alcanzar fluidez en tiempo real a 150 palabras por minuto, la gramática y el léxico deben procesarse de forma automática en los circuitos de los ganglios basales sin mediación consciente del traductor interno.

### RF-SRS-04: Filtro de Desagrupación Semántica y Anti-Interferencia (Interleaving)
- **Descripción:** Al generar la cola de repaso diaria en `CardManager`:
  - El algoritmo analiza las etiquetas semánticas y los códigos de taxonomía de las tarjetas programadas para el día.
  - Si dos o más tarjetas comparten alto riesgo de interferencia cruzada (p. ej. *sensitive* vs. *sensible*, o pares de falsos amigos directos), el programador inserta una separación mínima de al menos 5 tarjetas intermedias no relacionadas entre ellas.
- **Justificación Pedagógica:** La interferencia proactiva y retroactiva (Bjork & Bjork) demuestra que estudiar conceptos análogos o confusos en sucesión inmediata degrada drásticamente la discriminación en la memoria a largo plazo.

---

## 4. Taller de Redacción y Evaluación con Google Gemini (RF-WRT)

### RF-WRT-01: Generador de Prompts y Escritura Libre

- **Descripción:** El sistema debe ofrecer dos modos de práctica escrita:
  1. **Modo Libre:** El estudiante redacta sobre cualquier tema de su interés (diario personal, correo laboral, opinión).
  2. **Modo Guiado:** El sistema ofrece detonantes temáticos graduados por nivel CEFR (p. ej. A2: Describir tu rutina matutina; B1: Explicar una decisión difícil del pasado usando *Conditionals* y *Phrasal Verbs*; B2: Argumentar pros y contras del trabajo remoto).

### RF-WRT-02: Integración con la API de Google Gemini

- **Descripción:** El sistema enviará el texto del usuario a la API de Google Gemini (permitiendo seleccionar entre los modelos de la familia 3.x Flash: `gemini-3.5-flash`, `gemini-3.6-flash`, `gemini-3.7-flash` y `gemini-3.8-flash`, según la velocidad y profundidad requerida) mediante un contrato JSON estricto (`response_schema`).

### RF-WRT-03: Retroalimentación Pedagógica en 4 Pasos (Noticing de Schmidt)

- **Descripción:** La respuesta de la IA no debe limitarse a mostrar una versión corregida, sino estructurarse pedagógicamente:
  1. **Detección y Resaltado de Brechas (*Gap Identification*):** Marcado en rojo/amarillo de los fragmentos exactos que presentan incorrección gramatical, léxica o de tono.
  2. **Explicación Pedagógica en Español:** Explicación clara de la regla gramatical o pragmática violada, destacando explícitamente si se trata de una transferencia errónea del español (*L1 Transfer*).
  3. **Versión Pulida Nativa (*Target Reformulation*):** Muestra de la oración reescrita con fluidez y naturalidad por un angloparlante nativo.
  4. **Micro-Reto de Validación (*Immediate Retrieval Challenge*):** Una pregunta rápida generada por la IA para que el usuario demuestre que comprendió la corrección antes de guardar la sesión.

### RF-WRT-04: Ciclo de Escritura Socrática en Dos Fases (Guided Self-Correction)
- **Descripción:** El taller de redacción debe admitir el modo de corrección socrática activa:
  - **Fase 1 (Pistas de Andamiaje / Scaffolded Hints):** La IA analiza el texto pero NO entrega la solución directa de inmediato. En su lugar, resalta las áreas con incorrecciones y plantea preguntas reflexivas (*"Revisa la preposición en el segundo renglón: ¿recuerdas qué partícula rige obligatoriamente el verbo 'depend'?"*).
  - **Fase 2 (Auto-Corrección y Resolución):** El usuario edita su texto en un segundo borrador (`writing_draft_revisions`). Si resuelve la brecha con éxito, el sistema premia el esfuerzo y consolida el Noticing; si solicita ayuda completa o reincide en el fallo, Gemini entrega la explicación exhaustiva y la reformulación nativa.
- **Justificación Pedagógica:** La investigación en SLA demuestra que la corrección pasiva donde el estudiante simplemente lee la versión corregida genera una baja tasa de asimilación; forzar un segundo intento guiado activa la reestructuración del interlenguaje.

### RF-WRT-05: Modalidad Micro-Writing (Escritura Ágil de Alta Frecuencia)
- **Descripción:** El taller de redacción debe ofrecer una modalidad "Micro-Writing" (15 a 35 palabras):
  - El sistema propone una consigna ultracorta vinculada a un chunk o regla fonética estudiada en la jornada (p. ej. *"Redacta 1 sola oración usando la colocación 'take into account' en un contexto laboral"*).
  - La evaluación con Gemini se ejecuta en menos de 1 segundo mediante `gemini-3.5-flash` o `gemini-3.7-flash`.
- **Justificación Pedagógica:** Disminuye drásticamente la fricción mental en días de fatiga o escasez de tiempo, garantizando el cumplimiento de la racha diaria sin comprometer la calidad del hábito de producción activa.

---

## 5. Motor de Diagnóstico Inteligente y Detección de Fallas Crónicas (RF-DIA)

### RF-DIA-01: Registro y Taxonomía de Errores

- **Descripción:** Cada vez que el usuario comete un error (sea en una tarjeta SRS, en un ejercicio fonético o en una corrección de Gemini), el sistema debe clasificar y registrar el evento en una tabla de `UserErrors` con metadatos:
  - Tipo de error: Gramatical (tiempo verbal, concordancia, preposición, orden), Léxico (falso amigo, colocación errónea), Fonético (omisión de tercera persona singular, sonido vocálico incorrecto).
  - Sub-etiqueta específica (p. ej. `GRAM_PREP_DEPENDS_ON`, `LEX_FALSE_FRIEND_ACTUALLY`, `PHO_ELISION_LAST_NIGHT`).
  - Marca de tiempo y contexto textual.

### RF-DIA-02: Heatmap de Debilidades y Frecuencia de Fallas

- **Descripción:** El sistema debe calcular el índice de recurrencia de errores con decaimiento temporal. Los errores cometidos recientemente y de forma reiterada tendrán mayor ponderación.
- **Salida:** Visualización de un "Mapa de Calor de Debilidades" en el panel del usuario, categorizado por áreas débiles críticas.

### RF-DIA-03: Generación Automática de "Micro-Workouts"

- **Descripción:** Cuando el índice de error en una regla o concepto supera un umbral configurable (p. ej. $\ge 3$ fallos en los últimos 7 días), el sistema generará automáticamente una sesión de práctica correctiva de 5 minutos (*Micro-Workout*) compuesta de ejercicios focalizados exclusivamente en extinguir esa debilidad.

---

## 6. Módulo de Tareas Diarias, Rachas y Hábitos (RF-HAB)

### RF-HAB-01: Panel de Tareas Diarias (Daily Quests)

- **Descripción:** Cada día al iniciar sesión, el usuario verá una lista de verificación con 3 a 5 objetivos claros y alcanzables (carga de 15 a 25 minutos en total):
  1. *Repaso de Vocabulario:* Completar las tarjetas SRS programadas para el día.
  2. *Píldora Gramatical / Fonética:* Leer y escuchar 1 regla de Habla Conectada o Gramática.
  3. *Producción Activa:* Escribir al menos 1 micro-texto (50 a 150 palabras) y enviarlo a evaluación con Gemini.
  4. *(Opcional condicional):* Resolver el *Micro-Workout* si se detectaron errores crónicos.

### RF-HAB-02: Marcar Tarea Manual y Automáticamente

- **Descripción:** Las tareas se marcarán como completadas de forma automática al detectar la acción en el sistema (p. ej. terminar el lote de tarjetas SRS), permitiendo además confirmación visual manual con casillas de verificación animadas (*checkboxes* táctiles).

### RF-HAB-03: Contador de Racha y Mecánica Antifrustración (*Streak Freeze*)

- **Descripción:**
  - Las fichas de congelación se ganan automáticamente al mantener rachas de 7 días consecutivos (máximo 2 fichas acumulables).

---

## 7. Módulo de Configuración de IA y Gestión de Claves (RF-AIC)

### RF-AIC-01: Panel de Configuración de IA y Selección de Modelo por Defecto
- **Descripción:** El sistema debe proveer una vista dedicada ("Panel de Configuración de IA") donde el estudiante puede:
  - Seleccionar el modelo de IA por defecto de la familia 3.x Flash (`gemini-3.5-flash`, `gemini-3.6-flash`, `gemini-3.7-flash` o `gemini-3.8-flash`).
  - Asignar opcionalmente modelos específicos por tipo de tarea (p. ej. `gemini-3.5-flash` para micro-retos y `gemini-3.8-flash` para el taller de redacción).
  - Ajustar parámetros avanzados de inferencia (temperatura base entre 0.0 y 0.5, y top_p).

### RF-AIC-02: Gestión de Pool de Claves de API Múltiples (Multi-API Key Pool)
- **Descripción:** El usuario debe poder registrar, etiquetar y administrar múltiples claves de API (`GEMINI_API_KEY`) dentro de la aplicación:
  - Cada clave poseerá un alias descriptivo (p. ej. "Cuenta Personal", "Cuenta Secundaria / Backup", "Cuenta Trabajo").
  - Las claves se visualizan siempre enmascaradas en la interfaz (p. ej. `AIzaSy...4xK9`) para proteger la privacidad en grabaciones o pantallas compartidas.
  - El usuario puede añadir, activar, desactivar o eliminar cualquier clave del pool en cualquier momento.

### RF-AIC-03: Selección de Clave Primaria y Failover Automático por Cuota (HTTP 429)
- **Descripción:** El usuario puede seleccionar manualmente qué clave de API actúa como "Primaria / Activa".
- **Estrategia de Rotación / Failover:** Si la clave primaria agota su cuota de peticiones por minuto o por día (HTTP 429 *Quota Exceeded / Rate Limit*), el gateway de IA conmuta automáticamente y sin interrumpir la experiencia del usuario a la siguiente clave de API activa disponible en el pool, actualizando el estado de la clave saturada y notificando discretamente al usuario.

### RF-AIC-04: Verificación y Diagnóstico del Estado de las Claves
- **Descripción:** Cada entrada de clave en el pool debe disponer de una acción "Probar Conexión" (*Test Key*):
  - El sistema realiza un ping sintáctico mínimo (conteo de tokens o consulta ligera de 1 token) a la API de Gemini.
  - El resultado actualiza el badge de estado visual de la clave: 🟢 `Válida` (operativa con cuota disponible), 🟡 `Cuota Excedida` (temporalmente en enfriamiento) o 🔴 `Inválida` (clave revocada o mal escrita).

### RF-AIC-05: Matriz de Resiliencia 2D (Modelo x Clave), Límites RPD/RPM y Ciclo de Reset a Medianoche PT
- **Descripción:** El sistema debe modelar la lógica formal de cuotas de la API de Google Gemini (Google AI Studio Error Specs):
  - **Límites de la Capa Estándar/Gratuita:** 5 solicitudes por minuto (RPM) y 20 solicitudes por día (RPD) **por modelo individual para cada proyecto/clave**.
  - **Multiplicador de Capacidad:** Puesto que el límite RPD es independiente por modelo, cada clave de API con los 4 modelos de la familia 3.x Flash (`gemini-3.5-flash`, `gemini-3.6-flash`, `gemini-3.7-flash` y `gemini-3.8-flash`) provee un máximo combinado de **80 RPD por clave** ($4 \times 20$). Para $N$ claves en el pool, la capacidad total disponible asciende a $80N$ RPD diarios.
  - **Diferenciación de Errores HTTP 429 (`RESOURCE_EXHAUSTED`):**
    - *HTTP 429 por RPM (Límite por minuto):* Detectado mediante métricas de cuota por minuto (`...RequestsPerMinute...`) o cabecera `Retry-After` de corta duración ($\le 60$ s). Acción: aplicar retroceso exponencial breve o conmutar de inmediato a otra clave activa para el mismo modelo.
    - *HTTP 429 por RPD (Límite diario por modelo):* Detectado mediante cuota diaria (`...RequestsPerDayPerProjectPerModel`). Acción: marcar el par `(clave, modelo)` en estado `RPD_EXHAUSTED` hasta la medianoche del Pacífico (**00:00 Pacific Time**).
  - **Estrategia en Cascada 2D:**
    1. *Cascada Horizontal (Cross-Key):* Reintentar el mismo modelo $M$ en la siguiente clave disponible ($K_1 \rightarrow K_2 \rightarrow \dots \rightarrow K_N$).
    2. *Cascada Vertical (Cross-Model Fallback):* Si todas las claves han agotado el modelo $M$ (p. ej. `gemini-3.8-flash`), degradar automáticamente al siguiente modelo de la familia 3.x Flash (`gemini-3.7-flash` $\rightarrow$ `gemini-3.6-flash` $\rightarrow$ `gemini-3.5-flash`), garantizando continuidad hasta el límite total de 80 RPD por clave.
  - **Reloj de Sincronización PT:** El sistema monitorea el huso horario oficial de Google AI Studio (Pacific Time: UTC-8 estándar / UTC-7 horario de verano) y reinicia automáticamente los contadores locales de RPD a cero a las 00:00 PT diarias.

---

## 8. Módulo de Input Comprensible y Lectura Graduada (RF-INP)

### RF-INP-01: Lector Inteligente de Input Comprensible (Smart Graded Reader $i+1$)
- **Descripción:** El sistema debe incorporar una vista de lectura inmersiva donde el estudiante puede:
  1. Cargar textos externos (noticias, artículos técnicos, extractos de libros o contenido web pegado por el usuario) o seleccionar lecturas graduadas por nivel CEFR provistas por el sistema (`reader_articles`).
  2. Visualizar el texto con anotación interactiva: las palabras o unidades fraseológicas que el usuario tiene registradas en `srs_cards` en estados `LEARNING` o `RELEARNING` se resaltan con un sutil subrayado pedagógico para activar el efecto de *Noticing* en contexto real.
  3. Registrar métricas de avance de lectura (porcentaje leído, palabras totales y velocidad aproximada).

### RF-INP-02: Captura Léxica y Enriquecimiento Instantáneo en Un Clic
- **Descripción:** Al hacer clic sobre cualquier palabra o seleccionar una frase en el lector interactivo:
  - Se despliega un panel emergente sin salir de la lectura con:
    - Definición en inglés simplificado y traducción contextual al español.
    - Transcripción fonética dual IPA con audio nativo.
    - Indicador de nivel CEFR y advertencia de falso amigo si aplica.
  - El panel incluye el botón *"Añadir a mi Repaso FSRS"*, el cual invoca en segundo plano el enriquecimiento automático (`AiVocabularyEnrichmentResponse`) y crea la tarjeta en SQLite en estado `NEW`.
- **Justificación Pedagógica:** Krashen & Schmidt. La adquisición incidental de vocabulario a través de la lectura masiva de textos comprensibles ($i+1$) es el canal natural más potente para expandir el repertorio léxico cuando se complementa con la extracción deliberada de términos desconocidos.