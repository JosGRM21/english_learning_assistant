# Historias de Usuario y Perfiles de Aprendiz (Personas)
## English Learning Assistant (ELA)

Este documento define los perfiles de usuario arquetípicos (*User Personas*) y las **Historias de Usuario** formalizadas bajo el formato ágil estándar con criterios de aceptación en formato BDD (**Behavior-Driven Development / Gherkin: Given-When-Then**), completamente alineadas con el marco pedagógico científico [`docs/02_pedagogical_framework/`](../02_pedagogical_framework/) y la especificación SRS [`functional_requirements.md`](./functional_requirements.md).

---

## 1. Arquetipos de Usuario (User Personas)

### Persona 1: Carlos (El Profesional Técnico con Bloqueo de Interlenguaje)
- **Perfil:** Desarrollador de software hispanohablante de 28 años.
- **Nivel actual de inglés:** B1 pasivo (comprende documentación técnica escrita y videos con subtítulos, pero le cuesta redactar correos fluidos y entender a hablantes nativos en reuniones rápidas).
- **Puntos de dolor:**
  - Tiende a traducir mentalmente del español al inglés (*"I depend of..."*, *"I have 28 years"*, *"Is raining"*).
  - No comprende el habla natural de los nativos porque nunca le enseñaron *Connected Speech*; busca escuchar palabra por palabra aislada y se pierde en las elisiones y enlaces.
  - Sabe la regla gramatical de la 3ra persona singular *-s*, pero cuando habla la olvida sistemáticamente por fosilización de la memoria declarativa.
- **Objetivo con ELA:** Formar un hábito de 15 minutos diarios, eliminar sus vicios gramaticales crónicos y entender por fin por qué los nativos unen las palabras y cómo modular la entonación.

### Persona 2: Elena (La Estudiante Intermedia en Busca de Fluidez Fraseológica)
- **Perfil:** Estudiante universitaria y profesional junior de 22 años.
- **Nivel actual de inglés:** A2 consolidado, buscando subir a B2.
- **Puntos de dolor:**
  - Sabe muchas palabras sueltas pero no sabe cómo combinarlas (*collocations* como *make a mistake* vs *do a mistake*, o verbos de movimiento en marco satelital como *rush in*).
  - Miedo y ansiedad lingüística (*Foreign Language Anxiety*) al expresarse en inglés por temor a sonar descortés o equivocarse.
  - Se confunde con las preposiciones *in, on, at* al intentar traducirlas literalmente del español *"en"*.
- **Objetivo con ELA:** Aprender vocabulario en bloques (*chunks* y *phrasal verbs*), dominar preposiciones mediante modelos visuales espaciales, recibir explicaciones pedagógicas amables en español, y tener una racha protegida con *Streak Freezes*.

---

## 2. Historias de Usuario con Criterios de Aceptación (BDD)

### US-01: Cumplimiento de la Rutina Diaria y Racha Protegida (RF-SRL-01, RF-SRL-02)
- **Como** Carlos (aprendiz constante pero con poco tiempo disponible),
- **Quiero** ver una lista clara de 3 tareas prioritarias al abrir el asistente con el tiempo estimado de estudio,
- **Para** mantener mi constancia diaria sin sentirme abrumado por una cantidad infinita de contenidos.

```gherkin
Scenario: Usuario completa todas sus tareas diarias a tiempo
  Given el usuario tiene una racha activa de 5 días
  And tiene 3 tareas pendientes en su lista de Daily Quests (estimación: 15 minutos)
  When el usuario completa la última tarea pendiente antes de las 23:59
  Then la aplicación marca el día como completado con una animación visual sobria
  And el contador de racha se incrementa a 6 días
  And se emite una notificación de autoeficacia constructiva

Scenario: Usuario no estudia un día pero posee un Streak Freeze
  Given el usuario tiene una racha activa de 14 días
  And posee 1 ficha de "Streak Freeze" en su cuenta
  When pasan las 23:59 sin que el usuario complete sus tareas diarias
  Then el sistema activa automáticamente el Streak Freeze
  And la racha de 14 días se mantiene intacta
  And el saldo de Streak Freezes se reduce a 0
  And al día siguiente se notifica al usuario: "Tu racha fue rescatada por tu protector de racha"
```

---

### US-02: Repaso de Léxico con Repetición Espaciada Inteligente FSRS (RF-SRS-01, RF-SRS-02)
- **Como** Elena (estudiante que olvida las palabras a los pocos días de aprenderlas),
- **Quiero** repasar mi vocabulario mediante tarjetas con evocación activa que se programen solas según el modelo DSR,
- **Para** consolidar el léxico en mi memoria a largo plazo dedicando el menor tiempo posible al día.

```gherkin
Scenario: Calificación exitosa de una tarjeta de memoria
  Given una tarjeta de vocabulario "take into account" con Estabilidad S = 4 días y Dificultad D = 5
  When el usuario ve el anverso con una oración con hueco: "You should ___ into account his advice"
  And el usuario presiona Espacio para ver el reverso y califica con "Good" (Tecla 3)
  Then el algoritmo FSRS recalcula la nueva Estabilidad S' > 4 días
  And el sistema programa el próximo repaso en la fecha óptima futura
  And la tarjeta se retira del lote de estudio del día actual

Scenario: Fallo de tarjeta (Again) por interferencia de Falso Amigo
  Given una tarjeta de vocabulario "actually" (con advertencia de Falso Amigo)
  When el usuario presiona la tecla 1 ("Again") porque olvidó que significa "en realidad" y no "actualmente"
  Then el sistema reinicia la estabilidad temporal de la tarjeta
  And vuelve a insertar la tarjeta en la cola de repaso de la sesión actual para reintentarla
  And envía un evento de error léxico al motor de diagnóstico con código LEX_FALSE_FRIEND_ACTUALLY
```

---

### US-03: Entrenamiento Visual y Auditivo de Habla Conectada (RF-PHO-05, RF-PHO-06)
- **Como** Carlos (aprendiz que se desorienta cuando los nativos unen las palabras),
- **Quiero** ver oraciones desglosadas con las reglas de elisión, asimilación y enlace explicadas gráficamente con código de color,
- **Para** entrenar mi oído a decodificar el habla fluida y saber pronunciar frases con naturalidad.

```gherkin
Scenario: Desglose de regla de Enlace (Linking C-V) y Formas Débiles
  Given la frase "Hold on for a second"
  When el usuario selecciona la vista de "Connected Speech Breakdown"
  Then el sistema muestra la transcripción IPA conectada: [həʊl-dɒn fər ə ˈsekənd]
  And resalta en azul (#2563EB) la unión de la "d" con la "o" como Catenación Consonante-Vocal
  And resalta en verde (#059669) que "for a" se reduce a sonidos Schwa [/fər ə/]
  And permite escuchar el audio a velocidad 1.0x y a velocidad lenta pedagógica 0.75x sin distorsión de tono
```

---

### US-04: Taller de Escritura y Retroalimentación con Google Gemini (RF-SOC-01, RF-SOC-03)
- **Como** Elena (aprendiz que necesita escribir con corrección gramatical y pragmática),
- **Quiero** redactar un texto y que Gemini me explique mis errores en español con pedagogía constructiva,
- **Para** notar conscientemente mis fallas (*Noticing the Gap*) sin sentir vergüenza y aprender a sonar natural.

```gherkin
Scenario: Envío de texto con error de transferencia del español a evaluación
  Given el usuario escribe: "It depends of the weather because I am agree with you."
  When el usuario presiona el botón "Evaluar con IA"
  Then el sistema envía la solicitud a la API de Google Gemini con la rúbrica pedagógica
  And Gemini devuelve un JSON estructurado identificando:
    | Error | Tipo | Explicación en Español | Versión Nativa |
    | "depends of" | Preposición / Transferencia L1 | En español decimos "depende de", pero en inglés la preposición correcta es "depends on". | "depends on" |
    | "I am agree" | Sintaxis / Transferencia L1 | "Agree" ya es un verbo en inglés; no requiere el verbo "to be". Se dice simplemente "I agree". | "I agree" |
  And la interfaz resalta los errores con colores diferenciados
  And presenta un micro-reto interactivo: "Completa: It depends ___ your decision (on / of)"
```

---

### US-05: Detección Automática de Debilidades Crónicas y Micro-Workout (RF-DIA-02, RF-DIA-03)
- **Como** Carlos (quien comete repetidamente el mismo error gramatical sin darse cuenta),
- **Quiero** que el sistema detecte mis errores frecuentes y me arme una sesión exprés de práctica de 5 minutos,
- **Para** erradicar el hábito incorrecto antes de que se fosilice en mi cerebro.

```gherkin
Scenario: Activación de Micro-Workout por umbral de errores
  Given el usuario ha acumulado 3 errores en el uso de la preposición "depends on" en los últimos 5 días
  When el usuario accede al Dashboard de la aplicación
  Then el Heatmap muestra la categoría "Preposiciones dependientes de verbos" en color rojo crítico
  And se genera automáticamente una tarea especial: "Micro-Workout: Preposiciones con Verbos (5 min)"
  And al completarla con éxito, el índice de criticidad de esa regla disminuye en el Heatmap
```

---

### US-06: Percepción Auditiva de Alta Variabilidad (HVPT) (RF-HVPT-01 a 04)
- **Como** Carlos (quien confunde sonidos similares en inglés como /iː/ y /ɪ/),
- **Quiero** entrenar mi percepción acústica con ejercicios rápidos a ciegas con múltiples voces nativas masculinas y femeninas,
- **Para** recalibrar mi oído a contrastes fonéticos que no existen en español y decodificar el habla natural con precisión.

```gherkin
Scenario: Discriminación acústica forzada a ciegas con límite de 2.0 segundos
  Given el usuario inicia un ejercicio en el Gimnasio de Pares Mínimos (/iː/ vs /ɪ/)
  When el sistema reproduce un estímulo sonoro aleatorio ("ship") con la voz 3 (mujer británica RP) con la pantalla a ciegas
  And se activan los botones [ SHIP ] vs [ SHEEP ] con una cuenta regresiva de 2.0 segundos
  And el usuario selecciona "SHIP" a los 1.2 segundos
  Then el sistema marca la respuesta como correcta y reproduce la pronunciación contrastiva ("sheep" vs "ship")
  And actualiza el registro de agudeza perceptual fonética en weakness_metrics
```

---

### US-07: Drills de Reacción Rápida y Proceduralización (RF-PROC-01 a 03)
- **Como** Elena (quien tarda demasiado tiempo pensando las reglas antes de contestar),
- **Quiero** realizar sesiones de 60 segundos con límite de 3 segundos por pregunta y certificar mi automaticidad en los ganglios basales,
- **Para** automatizar las combinaciones sintácticas y colocaciones a nivel motor sin traducir en mi cabeza.

```gherkin
Scenario: Certificación de ítem proceduralizado tras 3 sesiones rápidas
  Given una tarjeta de sustitución de 3ra persona singular con 2 aciertos previos a RT < 1.5s
  When se presenta el estímulo: "They like pizza" con operador "[SHE]"
  And el usuario escribe "She likes pizza" en 1.150 ms
  Then el sistema incrementa el contador a 3
  And marca formalmente el ítem como PROCEDURALIZED
  And registra la latencia de 1.150 ms en speed_drill_sessions
```

---

### US-08: Escritura Socrática y Auto-Corrección en 4 Niveles (RF-SOC-01)
- **Como** Elena (quien desea aprender a detectar sus propios errores en vez de depender de correcciones pasivas),
- **Quiero** que Gemini me dé pistas de andamiaje socrático primero y me permita editar mi borrador,
- **Para** fijar el aprendizaje en mi cerebro a través de la resolución activa de problemas en mi Zona de Desarrollo Próximo.

```gherkin
Scenario: Recepción de pista socrática Nivel 1 en primer borrador
  Given el usuario envía: "I have 22 years and I am agree with you."
  When solicita la evaluación socrática en Fase 1
  Then Gemini devuelve pista Nivel 1: "Revisa cómo expresas tu edad en la primera línea y la construcción de 'agree'"
  And la interfaz permite editar el texto directamente en un segundo borrador
  When el usuario corrige a: "I am 22 years old and I agree with you."
  Then el sistema confirma la resolución de los dos errores y otorga convalidación de Noticing
```

---

### US-09: Lector de Input Comprensible y Decodificación Auditiva Bottom-Up (RF-INP-01 a 04)
- **Como** Carlos (quien lee artículos técnicos en inglés y quiere guardar palabras nuevas sin fricción),
- **Quiero** analizar la cobertura léxica del texto y entrenar mi audición con el protocolo de 3 pasos (audio ciego $\rightarrow$ esqueleto tónico $\rightarrow$ texto completo),
- **Para** expandir mi vocabulario incidental ($i+1$) y entrenar mi cerebro a segmentar el habla rápida.

```gherkin
Scenario: Decodificación auditiva ascendente en tres pasos
  Given el usuario abre una historia con cobertura calculada del 96%
  When activa el reproductor en Paso 1 (Audio Ciego)
  Then el texto permanece 100% oculto y se emite el audio nativo completo
  When avanza al Paso 2 (Texto Parcial)
  Then la pantalla muestra únicamente las palabras de contenido acentuadas
  When avanza al Paso 3 (Texto Completo)
  Then se despliega el texto íntegro con conectores fonéticos de catenación y Schwa sincronizados
```

---

### US-10: Fonología Suprasegmental, Acento Nuclear y Prosodic Shadowing (RF-PRO-01 a 04)
- **Como** Carlos (cuyo inglés suena plano, monótono y con acento robótico),
- **Quiero** ver las curvas de entonación melódica y grabar mi voz para comparar mi tono fundamental con el nativo,
- **Para** aprender a transmitir emociones, cortesía y énfasis con naturalidad.

```gherkin
Scenario: Práctica de Prosodic Shadowing con rastreador F0
  Given la oración "Actually, it starts at six" con curva Fall-Rise (\/~)
  When el usuario escucha el modelo nativo y graba su voz repitiendo la frase
  Then el sistema calcula la curva de tono F0 del usuario mediante FFT
  And superpone visualmente la curva del usuario sobre la curva del hablante nativo
  And otorga un puntaje de coincidencia prosódica del 88%
```

---

### US-11: Taller Basado en Tareas Comunicativas Genuinas (TBLT) (RF-TBLT-01 a 04)
- **Como** Elena (quien necesita comunicarse en un entorno profesional en inglés),
- **Quiero** resolver misiones de la vida real con una fase de preparación léxica y evaluación de mis 4 competencias comunicativas,
- **Para** aprender a negociar, disculparme diplomáticamente y argumentar con precisión.

```gherkin
Scenario: Ejecución de una tarea TBLT Nivel B2 (Negociación Comercial)
  Given la misión "Responder a un reclamo de entrega demorada ofreciendo una compensación diplomática"
  When el usuario inicia la Fase Pre-Task
  Then el sistema provee 3 chunks de andamiaje: "take into account", "look into the matter", "I would appreciate it"
  When el usuario redacta y envía su propuesta en la Fase During-Task
  Then en la Fase Post-Task Gemini evalúa:
    | Competencia | Score | Feedback |
    | Lingüística | 8.5 | Buen uso de tiempos pasados y colocaciones |
    | Sociolingüística (Hedging) | 9.0 | Excelente uso de 'Could you possibly' |
    | Discursiva | 8.0 | Buena transición con 'Furthermore' |
    | Estratégica | 8.5 | Paráfrasis fluida para explicar el fallo logístico |
```

---

### US-12: Semántica Cognitiva y Laboratorio Topológico de Preposiciones (RF-SEM-01 a 03)
- **Como** Elena (quien siempre duda si decir *in*, *on* o *at*),
- **Quiero** aprender preposiciones utilizando diagramas espaciales de contenedor, superficie y punto,
- **Para** visualizar los conceptos en mi mente en lugar de memorizar tablas de traducción engañosas.

```gherkin
Scenario: Ejercicio topológico en el Topo-Lab de Preposiciones
  Given un ejercicio sobre ubicación espacial con los esquemas IN (3D), ON (2D) y AT (0D)
  When el sistema presenta el concepto "a bus"
  And el usuario lo asocia con ON porque es una plataforma de transporte público con superficie de apoyo
  Then el sistema convalida la respuesta con un diagrama del esquema de superficie de Lakoff & Johnson
  And refuerza el contraste frente a "in a car" (contenedor cerrado)
```

---

### US-13: Extintor Rápido de la Fosilización de 3ra Persona Singular (RF-TRN-05)
- **Como** Carlos (quien sabe la regla de agregar 's' pero en la práctica siempre se le olvida),
- **Quiero** ráfagas de 2 segundos donde deba cambiar rápidamente el sujeto de oraciones en tiempo real,
- **Para** forzar a mi cerebro a disparar la desinencia *-s* de forma automática e inconsciente.

```gherkin
Scenario: Drill de erradicación de 3ra persona en 2 segundos
  Given el estímulo en pantalla "They understand the problem"
  When aparece el nuevo sujeto "[HE]" con barra de 2.0 segundos
  And el usuario escribe "He understands the problem" en 1.4 segundos
  Then el sistema registra acierto y computa que la desinencia -s fue disparada en ventana procedural
  And incrementa la estabilidad de la regla en el motor de diagnóstico
```
