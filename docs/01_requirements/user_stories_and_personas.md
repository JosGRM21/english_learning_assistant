# Historias de Usuario y Perfiles de Aprendiz (Personas)
## English Learning Assistant (ELA)

Este documento define los perfiles de usuario arquetípicos (*User Personas*) y las **Historias de Usuario** redactadas bajo el formato ágil estándar con criterios de aceptación en formato BDD (**Behavior-Driven Development / Gherkin: Given-When-Then**).

---

## 1. Arquetipos de Usuario (User Personas)

### Persona 1: Carlos (El Profesional Técnico con Bloqueo de Interlenguaje)
- **Perfil:** Desarrollador de software hispanohablante de 28 años.
- **Nivel actual de inglés:** B1 pasivo (comprende documentación técnica escrita y videos con subtítulos, pero le cuesta redactar correos fluidos y entender a hablantes nativos en reuniones rápidas).
- **Puntos de dolor:**
  - Tiende a traducir mentalmente del español al inglés (*"I depend of..."*, *"I have 28 years"*).
  - No comprende el habla natural de los nativos porque nunca le enseñaron *Connected Speech*; busca escuchar palabra por palabra aislada y se pierde en las elisiones y enlaces.
  - Comienza cursos con entusiasmo, pero los abandona a las dos semanas cuando la rutina diaria lo abruma.
- **Objetivo con ELA:** Formar un hábito de 15 minutos diarios, eliminar sus vicios gramaticales crónicos y entender por fin por qué los nativos unen las palabras.

### Persona 2: Elena (La Estudiante Intermedia en Busca de Fluidez Fraseológica)
- **Perfil:** Estudiante universitaria de 22 años.
- **Nivel actual de inglés:** A2 consolidado, buscando subir a B2.
- **Puntos de dolor:**
  - Sabe muchas palabras sueltas pero no sabe cómo combinarlas (*collocations* como *make a mistake* vs *do a mistake*).
  - Miedo a escribir textos en inglés por temor a equivocarse sin saber en qué falló.
  - Si pierde una racha de Duolingo de 20 días por no tener internet un domingo, se desmotiva por completo.
- **Objetivo con ELA:** Aprender vocabulario en bloques (*chunks* y *phrasal verbs*), recibir explicaciones pedagógicas amables en español cuando escribe, y tener una racha protegida con *Streak Freezes*.

---

## 2. Historias de Usuario con Criterios de Aceptación (BDD)

### US-01: Cumplimiento de la Rutina Diaria y Racha Protegida
- **Como** Carlos (aprendiz constante pero con poco tiempo disponible),
- **Quiero** ver una lista clara de 3 tareas prioritarias al abrir el asistente y poder marcarlas con un clic,
- **Para** mantener mi constancia diaria sin sentirme abrumado por una cantidad infinita de contenidos.

#### Criterios de Aceptación (Gherkin):
```gherkin
Scenario: Usuario completa todas sus tareas diarias a tiempo
  Given el usuario tiene una racha activa de 5 días
  And tiene 3 tareas pendientes en su lista de Daily Quests
  When el usuario completa la última tarea pendiente antes de las 23:59
  Then la aplicación marca el día como completado con una animación visual
  And el contador de racha se incrementa a 6 días
  And se emite una notificación de felicitación motivacional

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

### US-02: Repaso de Léxico con Repetición Espaciada Inteligente (FSRS)
- **Como** Elena (estudiante que olvida las palabras a los pocos días de aprenderlas),
- **Quiero** repasar mi vocabulario mediante tarjetas con evocación activa que se programen solas según mi memoria,
- **Para** consolidar el léxico en mi memoria a largo plazo dedicando el menor tiempo posible al día.

#### Criterios de Aceptación (Gherkin):
```gherkin
Scenario: Calificación exitosa de una tarjeta de memoria
  Given una tarjeta de vocabulario "take into account" con Estabilidad S = 4 días y Dificultad D = 5
  When el usuario ve el anverso con una oración con hueco: "You should ___ into account his advice"
  And el usuario presiona Espacio para ver el reverso y califica con "Good" (Tecla 3)
  Then el algoritmo FSRS recalcula la nueva Estabilidad S' > 4 días
  And el sistema programa el próximo repaso en la fecha óptima futura
  And la tarjeta se retira del lote de estudio del día actual

Scenario: Fallo de tarjeta (Again)
  Given una tarjeta de vocabulario "actually" (con advertencia de Falso Amigo)
  When el usuario presiona la tecla 1 ("Again") porque olvidó que significa "en realidad" y no "actualmente"
  Then el sistema reinicia la estabilidad temporal de la tarjeta
  And vuelve a insertar la tarjeta en la cola de repaso de la sesión actual para reintentarla
  And envía un evento de error léxico al motor de diagnóstico
```

---

### US-03: Entrenamiento Visual y Auditivo de Habla Conectada (Connected Speech)
- **Como** Carlos (aprendiz que se desorienta cuando los nativos unen las palabras),
- **Quiero** ver oraciones desglosadas con las reglas de elisión, asimilación y enlace explicadas gráficamente,
- **Para** entrenar mi oído a decodificar el habla fluida y saber pronunciar frases con naturalidad.

#### Criterios de Aceptación (Gherkin):
```gherkin
Scenario: Desglose de regla de Enlace (Linking C-V) y Formas Débiles
  Given la frase "Hold on for a second"
  When el usuario selecciona la vista de "Connected Speech Breakdown"
  Then el sistema muestra la transcripción IPA conectada: [həʊl-dɒn fər ə ˈsekənd]
  And resalta gráficamente la unión de la "d" con la "o" como Catenación Consonante-Vocal
  And resalta que "for a" se reduce a sonidos Schwa [/fər ə/]
  And permite escuchar el audio a velocidad 1.0x y a velocidad lenta pedagógica 0.75x
```

---

### US-04: Taller de Escritura y Retroalimentación con Google Gemini
- **Como** Elena (aprendiz que necesita escribir con corrección gramatical y pragmática),
- **Quiero** redactar un texto y que Gemini me explique mis errores en español con pedagogía constructiva,
- **Para** notar conscientemente mis fallas sin sentir vergüenza y aprender a sonar natural.

#### Criterios de Aceptación (Gherkin):
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

### US-05: Detección Automática de Debilidades Crónicas y Micro-Workout
- **Como** Carlos (quien comete repetidamente el mismo error gramatical sin darse cuenta),
- **Quiero** que el sistema detecte mis errores frecuentes y me arme una sesión exprés de práctica,
- **Para** erradicar el hábito incorrecto antes de que se fosilice en mi cerebro.

#### Criterios de Aceptación (Gherkin):
```gherkin
Scenario: Activación de Micro-Workout por umbral de errores
  Given el usuario ha acumulado 3 errores en el uso de la preposición "depends on" en los últimos 5 días
  When el usuario accede al Dashboard de la aplicación
  Then el Heatmap muestra la categoría "Preposiciones dependientes de verbos" en color rojo crítico
  And se genera automáticamente una tarea especial: "Micro-Workout: Preposiciones con Verbos (5 min)"
  And al completarla con éxito, el índice de criticidad de esa regla disminuye en el Heatmap
```

---

### US-06: Discriminación Auditiva y Gimnasio de Pares Mínimos
- **Como** Carlos (quien confunde sonidos similares en inglés como /iː/ y /ɪ/),
- **Quiero** entrenar mi percepción acústica con ejercicios rápidos a ciegas de pares mínimos,
- **Para** recalibrar mi oído a contrastes fonéticos que no existen en español y decodificar el habla natural con precisión.

#### Criterios de Aceptación (Gherkin):
```gherkin
Scenario: Discriminación acústica forzada con límite de tiempo
  Given el usuario inicia un ejercicio de pares mínimos (/iː/ vs /ɪ/)
  When el sistema reproduce un estímulo sonoro aleatorio ("ship") a ciegas
  And el usuario selecciona la opción correspondiente antes de 2.0 segundos
  Then el sistema marca la respuesta como correcta y reproduce la pronunciación contrastiva ("sheep" vs "ship")
  And actualiza el registro de agudeza perceptual fonética
```

---

### US-07: Drills de Reacción Rápida y Proceduralización
- **Como** Elena (quien tarda demasiado tiempo pensando las reglas antes de contestar),
- **Quiero** realizar sesiones de 60 segundos con límite de 3 segundos por pregunta,
- **Para** automatizar las combinaciones preposicionales y colocaciones en mi memoria refleja.

#### Criterios de Aceptación (Gherkin):
```gherkin
Scenario: Ejecución de un Speed Drill con temporizador
  Given el usuario inicia una sesión de "Speed-Run: Preposiciones Fijas"
  When se presenta el ítem: "She is good ___ playing chess"
  And la barra regresiva de 4.0 segundos está activa
  And el usuario selecciona "at" antes de 1.8 segundos
  Then el sistema marca acierto inmediato con sonido positivo
  And computa el tiempo de respuesta promedio de la ráfaga en milisegundos
```

---

### US-08: Escritura Socrática y Auto-Corrección Guiada
- **Como** Elena (quien desea aprender a detectar sus propios errores en vez de depender de correcciones pasivas),
- **Quiero** que Gemini me dé pistas de andamiaje primero y me permita editar mi borrador,
- **Para** fijar el aprendizaje en mi cerebro a través de la resolución activa de problemas.

#### Criterios de Aceptación (Gherkin):
```gherkin
Scenario: Recepción de pistas socráticas en primer borrador
  Given el usuario envía: "I have 22 years and I am agree with you."
  When solicita la evaluación socrática en Fase 1
  Then Gemini devuelve pistas: "¿Cómo se expresa la edad en inglés? y ¿requiere 'agree' el verbo to be?"
  And la interfaz permite editar el texto directamente en un segundo borrador
  When el usuario corrige a: "I am 22 years old and I agree with you."
  Then el sistema confirma la resolución de los dos errores y otorga bonificación de dominio
```

---

### US-09: Lector de Input Comprensible y Captura de Vocabulario en 1 Clic
- **Como** Carlos (quien lee artículos técnicos en inglés y quiere guardar palabras nuevas sin fricción),
- **Quiero** leer textos donde mis tarjetas en estudio se resalten y pueda agregar cualquier término desconocido con un clic,
- **Para** alimentar mi biblioteca FSRS directamente a partir de lecturas auténticas sin salir de la aplicación.

#### Criterios de Aceptación (Gherkin):
```gherkin
Scenario: Guardar una palabra nueva desde el Smart Reader
  Given el usuario lee un artículo sobre computación en la nube
  When hace clic sobre el término desconocido "unravel"
  Then se abre un popup con definición, pronunciación IPA dual y traducción
  When presiona "Añadir a mi Repaso FSRS"
  Then Gemini genera en segundo plano los metadatos completos y crea la tarjeta en estado NEW
  And la palabra "unravel" queda subrayada en el texto como término en aprendizaje
```
