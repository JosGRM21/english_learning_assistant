---
title: 'Requisitos Funcionales: Taller de Redacción Socrática'
---

# Requisitos Funcionales: Taller de Redacción Socrática

## 1. Propósito del Módulo

Guiar al usuario en el desarrollo de sus habilidades de escritura y producción en inglés mediante un flujo procesual de tres etapas que fomenta la corrección reflexiva, el uso deliberado de vocabulario meta y la adopción de patrones idiomáticos naturales, sin generar sobrecarga cognitiva ni sustituir el pensamiento del estudiante con correcciones automáticas pasivas.

---

## 2. Requisitos de Modos de Redacción

- **RF-WRT-01: Modalidades de Producción Escrita**:

  - El sistema debe permitir al usuario seleccionar entre dos modalidades:
    - *Escritura Libre*: Redacción abierta sin consigna previa.
    - *Lectura para Escribir*: Redacción basada en la lectura previa de un texto de referencia que sirve como modelo léxico, temático y estilístico.

- **RF-WRT-02: Panel de Referencia Textual**:

  - En la modalidad de lectura para escribir, el sistema debe permitir consultar el texto modelo en paralelo al borrador sin obstruir el espacio de redacción.

---

## 3. Requisitos del Flujo Procesual en 3 Fases

### Fase 1: Activación Léxica y Redacción Enfocada

- **RF-WRT-03: Activación Léxica Previa (Pre-Writing Target Chunks)**:

  - El sistema debe identificar palabras que el usuario tiene frágiles en su historial de estudio.
  - Antes de comenzar a redactar, debe presentar un conjunto acotado de metas léxicas (máximo 2 a 3 términos clave) con sus contextos de uso recomendados.
  - Durante la escritura del borrador, el editor debe operar en modo libre de distracciones (*distraction-free*), evitando alertas sonoras o interrupciones visuales que sobrecarguen la memoria de trabajo. La verificación de incorporación de términos se computará al finalizar el borrador.

### Fase 2: Andamiaje Híbrido Dinámico y Autocorrección Guiada

- **RF-WRT-05: Andamiaje Híbrido según Tipología de Error (Slips vs. Gaps)**:

  - Para prevenir la fatiga cognitiva y la frustración por ambigüedad deductiva, el sistema no debe aplicar un árbol rígido de 4 niveles idéntico para todos los desajustes. La asistencia debe bifurcarse según la naturaleza del error:
    - **Deslices de Rendimiento (*Slips / Errores de Monitoreo*)**:
      - Aplica a: concordancia sujeto-verbo, omisión de *-s* de tercera persona, errores evidentes de tiempo verbal previamente conocidos o erratas sintácticas menores.
      - *Estrategia Socrática Ágil (1 pista orientadora directa)*: Señalar el fragmento y hacer una pregunta focalizada (ej. *"Revisa la concordancia entre este sujeto y su verbo"* o *"¿El tiempo de esta cláusula coincide con el resto del párrafo?"*).
      - Si el usuario no logra resolverlo tras un intento de reescritura, se muestra la alternativa estructurada con espacio en blanco (*cloze*) antes del modelo explícito.
    - **Brechas de Competencia (*Competence Gaps / Convenciones Idiomáticas*)**:
      - Aplica a: preposiciones regidas arbitrarias, colocaciones no deducibles (*make/take/do*), falsos amigos o modismos.
      - *Estrategia de Reformulación Directa (Recast con Explicación de Uso)*: Dado que las colocaciones y convenciones del idioma no pueden deducirse mediante razonamiento socrático puro, el sistema debe proporcionar directamente la colocación nativa correcta, acompañada del principio de uso y ejemplos breves para evitar bloqueos innecesarios.

- **RF-WRT-06: Principio de Enfoque Selectivo en la Forma (*Focus on Form*) y Reparación**:

  - **Límite de Carga Cognitiva**: El sistema no debe saturar al usuario señalando todos los fallos simultáneamente. Debe jerarquizar y seleccionar un máximo de **3 focos de intervención prioritarios por borrador** (priorizando aquellos que afecten la inteligibilidad o patrones fosilizados reincidentes).
  - **Ciclos de Reparación Autónoma**: El usuario debe tener la oportunidad de editar y volver a enviar su texto atendiendo a las pistas. El sistema debe contabilizar y reforzar positivamente las *reparaciones autónomas exitosas*.
  - Los errores secundarios no abordados en el andamiaje activo se reservarán para consulta opcional en la Fase 3.

---

### Fase 3: Evaluación Multidimensional, "Noticing the Gap" y Consolidación

- **RF-WRT-07: Doble Reformulación para "Noticing the Gap" (Comparativa Estructural e Idiomática)**:

  - En lugar de un simple visualizador de diferencias ortográficas mecánicas (*diff*), el sistema debe presentar dos niveles complementarios de reformulación frente al texto original del usuario:
    1. *Nivel 1: Corrección Estructural Mínima (Clean/Grammar-Correct Version)*:
       - Mantiene estrictamente el vocabulario y la sintaxis elegidos por el usuario, reparando únicamente desajustes morfosintácticos, concordancias y puntuación obligatoria.
    2. *Nivel 2: Reformulación Idiomática Nativa (Native Recast / Polished Version)*:
       - Reescribe las ideas del usuario utilizando colocaciones genuinas, transiciones fluidas y estructuras sintácticas naturales de un hablante anglófono fluido.
    3. *Panel de Contraste Pedagógico ("Noticing the Gap")*:
       - Destaca lado a lado los fragmentos donde la versión del usuario suena artificial o traducida del español frente a la versión idiomática nativa.
       - Proporciona micro-notas que explicitan por qué la opción nativa aporta mayor naturalidad, precisión o concisión comunicativa.

- **RF-WRT-08: Rúbrica de Evaluación Comunicativa Multidimensional**:

  - El sistema no debe limitar su análisis a la corrección gramatical aislada. Debe evaluar la producción escrita bajo cuatro dimensiones equilibradas:
    1. *Corrección Lingüística (Accuracy)*: Morfología, tiempos verbales y normas gramaticales.
    2. *Riqueza y Precisión Léxica (Range & Precision)*: Variedad de vocabulario, uso adecuado de *chunks* y colocaciones meta.
    3. *Coherencia, Cohesión y Flujo Textual (Cohesion & Flow)*: Calidad de los conectores lógicos, elipsis, progresión temática y transiciones entre ideas (evitando oraciones telegráficas o yuxtaposición inconexa).
    4. *Adecuación Pragmática y Variedad Sintáctica (Pragmatics & Complexity)*: Grado de ajuste al registro pretendido (formal, académico, coloquial) y balance entre estructuras oracionales simples, coordinadas y subordinadas.
  - Estimación formativa del nivel global alcanzado (A1 a C2) y recomendaciones cualitativas de mejora.

- **RF-WRT-09: Taxonomía Integral de Errores y Calidad Comunicativa**:

  - Para asegurar coherencia pedagógica y métricas longitudinales, el sistema debe categorizar cada elemento analizado dentro de una taxonomía estandarizada que cubra tanto la corrección formal como la eficacia del discurso:
    - *Preposiciones (`PREPOSITION`)*: Uso incorrecto de preposiciones dependientes o regidas.
    - *Tiempo y Aspecto Verbal (`TENSE_ASPECT`)*: Confusión de tiempos verbales, correlación temporal o aspecto continuo/perfecto.
    - *Falsos Amigos (`FALSE_FRIEND`)*: Términos empleados con sentido del español por semejanza formal.
    - *Concordancia (`AGREEMENT`)*: Desajustes entre sujeto-verbo o número/género en determinantes.
    - *Elección Léxica y Colocaciones (`LEXICAL_COLLOCATION`)*: Combinaciones poco naturales (*do a mistake*) o vocabulario impreciso.
    - *Orden Sintáctico (`WORD_ORDER`)*: Alteración del orden canónico de la frase en inglés.
    - *Cohesión y Conectores Discursivos (`COHESION_LINKERS`)*: Uso incorrecto, ausente o repetitivo de nexos lógicos y transiciones oracionales.
    - *Complejidad y Monotonía Sintáctica (`SYNTACTIC_VARIETY`)*: Abuso de oraciones simples cortas (*choppy sentences*) que requieren subordinación o coordinación natural.
    - *Registro y Tono (`REGISTER`)*: Mezcla inadecuada de registros formal, profesional o informal.
    - *Ortografía (`SPELLING`)*: Errores tipográficos y de ortografía de palabras. (Exclusión: Se omiten expresamente correcciones por comas o puntos faltantes; no se evalúa puntuación).
    - *Transferencia del Español (Interferencia L1)*: Marcado transversal cuando el error se origina por traducción sintáctica o conceptual directa del español.

- **RF-WRT-10: Generación y Exportación de Ejercicios de Error**:

  - Los errores persistentes identificados durante la redacción deben catalogarse automáticamente según su código de taxonomía y enviarse con su contexto original al módulo especializado de repaso espaciado de errores de redacción.

- **RF-WRT-11: Soporte Auditivo en el Taller de Redacción**:

  - El sistema debe permitir escuchar mediante el motor de síntesis de voz (Kokoro TTS) el texto de lectura modelo en la modalidad "Lectura para Escribir", así como la versión reformulada nativa (Nivel 2) en la fase de evaluación, facilitando la asimilación prosódica y rítmica del discurso fluido.