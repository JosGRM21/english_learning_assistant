# Banco de Textos de Prueba para la Evaluación del Taller de Redacción

Este documento reúne el conjunto de casos de prueba diseñados para evaluar la precisión, robustez pedagógica y utilidad diagnóstica del **Módulo de Redacción Socrática** ([`03_writing_workshop.md`](file:///c:/dev/personal/english_learning_assistant/docs/02_functional_specs/03_writing_workshop.md)) y su integración con el módulo de **Repaso Espaciado de Errores** ([`04_writing_errors_srs.md`](file:///c:/dev/personal/english_learning_assistant/docs/02_functional_specs/04_writing_errors_srs.md)).

---

## 1. Justificación del Diseño y Cobertura (¿Cuántos textos y por qué?)

Para evaluar el sistema de forma óptima sin redundancias, se han determinado **10 textos de prueba estratégicos**. 

Esta cantidad responde a la necesidad de verificar de manera exhaustiva:
1. **La Taxonomía Completa de Errores (`RF-WRT-09`)**:
   - `PREPOSITION`, `TENSE_ASPECT`, `FALSE_FRIEND`, `AGREEMENT`, `LEXICAL_COLLOCATION`, `WORD_ORDER`, `COHESION_LINKERS`, `SYNTACTIC_VARIETY`, `REGISTER`, `SPELLING`, más el flag transversal de **Interferencia L1 (Transferencia del Español)**.
   - Omitir expresamente falsos positivos de puntuación (comas o puntos no evaluados según RF-WRT-09).
2. **La Bifurcación del Andamiaje Híbrido (`RF-WRT-05`)**:
   - Casos con *Slips* (deslices de monitoreo: concordancia, -s de 3ª persona, tiempos verbales simples) $\rightarrow$ Estrategia socrática reflexiva guiada.
   - Casos con *Gaps* (brechas de competencia: colocaciones arbitrarias, preposiciones dependientes, modismos) $\rightarrow$ Estrategia directa (*Recast* con explicación de uso).
3. **El Principio de Enfoque Selectivo (*Focus on Form* - `RF-WRT-06`)**:
   - Textos con alta densidad de errores para validar que el evaluador priorice un **máximo de 3 focos de intervención prioritarios por borrador**, evitando saturación cognitiva.
4. **La Doble Reformulación y "Noticing the Gap" (`RF-WRT-07`)**:
   - Capacidad del motor para entregar:
     - **Nivel 1 (Clean/Grammar-Correct)**: Corrige únicamente morfosintaxis sin alterar el vocabulario del usuario.
     - **Nivel 2 (Native Recast/Polished)**: Reescritura idiomática nativa fluida.
5. **Rango de Niveles del MCER (A1 a C1/C2) y Rúbrica Multidimensional (`RF-WRT-08`)**:
   - Textos impecables vs. textos intermedios vs. textos avanzados con sutiles problemas de registro o monotonía sintáctica (*choppy sentences*).

---

## 2. Matriz de Cobertura de Pruebas

| ID | Nivel Pretendido | Propósito Principal del Test | Foco Taxonómico Principal (`RF-WRT-09`) | Comportamiento Esperado del Sistema |
| :--- | :--- | :--- | :--- | :--- |
| **TX-01** | B1 | Slips de Monitoreo & Concordancia | `AGREEMENT`, `TENSE_ASPECT`, `SPELLING` | Activación de pistas socráticas ágiles (no recast directo). |
| **TX-02** | B1 | Brechas de Competencia & Preposiciones | `PREPOSITION`, `LEXICAL_COLLOCATION` | Activación de Recast directo con modelo explicativo. |
| **TX-03** | B1-B2 | Falsos Amigos & Calcos del Español (L1) | `FALSE_FRIEND`, Interferencia L1 | Detección de falso cognado e identificación de L1 transfer. |
| **TX-04** | A2-B1 | Orden Sintáctico & Colocaciones Fuertes | `WORD_ORDER`, `LEXICAL_COLLOCATION` | Corrección de orden canónico (S-V-O) y colocación natural. |
| **TX-05** | B1 | Monotonía Sintáctica (Choppy Sentences) | `SYNTACTIC_VARIETY`, `COHESION_LINKERS` | Sugerencias de subordinación y combinación oracional. |
| **TX-06** | B2 | Desajuste Pragmático y Registro Mixto | `REGISTER`, `COHESION_LINKERS` | Detección de coloquialismos en contexto formal/académico. |
| **TX-07** | A2 | Saturación de Errores (Focus on Form) | 6+ errores diversos | **Límite estricto de 3 focos prioritarios** en Fase 2. |
| **TX-08** | C1 | Texto Nativo y Cohesivo (Caso de Control) | Ninguno (Texto limpio y avanzado) | Diagnóstico positivo, sin falsas alarmas ni sobrecorrección. |
| **TX-09** | B2 | Modalidad "Lectura para Escribir" | `LEXICAL_COLLOCATION`, Meta Léxica | Verificación del uso del vocabulario meta sugerido. |
| **TX-10** | B1-B2 | Prueba de Resistencia a Puntuación | Puntuación informal / comas libres | No marcar errores tipográficos de comas (`RF-WRT-09`). |

---

## 3. Banco Detallado de Textos de Prueba

---

### Caso TX-01: Deslices de Monitoreo (Slips / Concordancia y Deslices Temporales)
* **Objetivo de Prueba**: Verificar que el sistema identifique errores de tipo *Slip* y active la estrategia socrática reflexiva (pregunta orientadora directa, no recast directo inmediato).
* **Nivel Estimado**: B1
* **Texto de Prueba**:
> "Last weekend my brother visit me in the city. He always arrive late because the traffic are terrible. We walked around downtown and buyed some souvenirs for our parents before returning home."

* **Errores Inyectados**:
  1. `TENSE_ASPECT` (*visit* en lugar de *visited*).
  2. `AGREEMENT` / `TENSE_ASPECT` (*arrive* en lugar de *arrived* o *arrives*).
  3. `AGREEMENT` (*traffic are* en lugar de *traffic is/was*).
  4. `SPELLING` / `TENSE_ASPECT` (*buyed* forma irregular incorrecta en lugar de *bought*).
* **Criterio de Aceptación y Evaluación Esperada**:
  - **Fase 2 (Andamiaje)**: Pregunta socrática sobre consistencia temporal y concordancia con sustantivos incontables (*traffic*).
  - **Fase 3 (Nivel 1 Clean)**: *"Last weekend my brother visited me in the city. He always arrived late because the traffic was terrible. We walked around downtown and bought some souvenirs for our parents before returning home."*
  - **Fase 3 (Nivel 2 Native)**: *"Last weekend, my brother came to visit me in the city. He ended up arriving late due to terrible traffic. We strolled through downtown and picked up a few souvenirs for our parents before heading home."*

---

### Caso TX-02: Brechas Idiomáticas (Competence Gaps / Preposiciones y Colocaciones)
* **Objetivo de Prueba**: Verificar que ante colocaciones no deducibles o preposiciones regidas, el sistema active la estrategia de **Recast Directo con Explicación**, evitando frustrar al estudiante con preguntas adivinadoras.
* **Nivel Estimado**: B1
* **Texto de Prueba**:
> "I am thinking to change my career path because I want to make business in Europe. It strictly depends of the funding I receive. Yesterday I made a big mistake during the interview, but I am confident to get the position."

* **Errores Inyectados**:
  1. `PREPOSITION` (*thinking to change* $\rightarrow$ *thinking of / about changing*).
  2. `LEXICAL_COLLOCATION` (*make business* $\rightarrow$ *do business*).
  3. `PREPOSITION` (*depends of* $\rightarrow$ *depends on* - Clásica interferencia de *depende de*).
  4. `PREPOSITION` / Complementación (*confident to get* $\rightarrow$ *confident about getting / that I will get*).
  5. *Nota positiva*: `LEXICAL_COLLOCATION` correcta (*made a mistake* usado bien como control).
* **Criterio de Aceptación y Evaluación Esperada**:
  - **Fase 2 (Andamiaje)**: Proporcionar directamente *depend on* y *do business*, explicando la regla de preposición dependiente y colocación fija del verbo *do*.
  - **Etiquetado Taxonómico**: `PREPOSITION`, `LEXICAL_COLLOCATION`, `L1_TRANSFER: true`.

---

### Caso TX-03: Falsos Amigos e Interferencia Pragmática L1 (Spanish Transfer)
* **Objetivo de Prueba**: Comprobar la detección precisa de falsos amigos recurrentes del español y la activación del tag transversal de transferencia de L1.
* **Nivel Estimado**: B1 - B2
* **Texto de Prueba**:
> "Currently, I can assist to the meeting because my agenda is clear. We discussed a very actual topic that concerns the whole department. Finally, our manager promised to compromise with the project deadline."

* **Errores Inyectados**:
  1. `FALSE_FRIEND` + `PREPOSITION` (*assist to the meeting* usado como "asistir" $\rightarrow$ *attend the meeting*).
  2. `FALSE_FRIEND` (*actual topic* usado como "tema de actualidad" $\rightarrow$ *current / up-to-date topic*).
  3. `FALSE_FRIEND` (*compromise with* usado como "comprometerse" $\rightarrow$ *commit to*).
* **Criterio de Aceptación y Evaluación Esperada**:
  - **Diagnóstico**: Reconocer los tres términos como falsos cognados del español (*asistir $\neq$ assist*, *actual $\neq$ actual*, *comprometerse $\neq$ compromise*).
  - **Exportación SRS (`RF-ERR-01`)**: Generar ejercicios contextualizados de producción positiva (e.g., *Contextual Cloze*: *"We discussed a very c____ topic... [current]"*).

---

### Caso TX-04: Orden Sintáctico Canónico y Colocaciones Fuertes
* **Objetivo de Prueba**: Evaluar la corrección de hipérbaton y orden no canónico producido por traducción directa del español (colocación del adverbio y adjetivo).
* **Nivel Estimado**: A2 - B1
* **Texto de Prueba**:
> "I like very much this application. Every morning drinks my father strong coffee while reading the news paper. He says always that quiet mornings give him energy."

* **Errores Inyectados**:
  1. `WORD_ORDER` (*I like very much this application* $\rightarrow$ *I really like this application* o *I like this application very much*).
  2. `WORD_ORDER` / Inversión errónea de sujeto-verbo (*drinks my father* $\rightarrow$ *my father drinks*).
  3. `WORD_ORDER` (*He says always that* $\rightarrow$ *He always says that*).
  4. `SPELLING` (*news paper* $\rightarrow$ *newspaper*).
* **Criterio de Aceptación y Evaluación Esperada**:
  - **Identificación**: Señalar la posición del adverbio de frecuencia (*always*) antes del verbo principal y el orden Sujeto-Verbo-Objeto directo.

---

### Caso TX-05: Variedad Sintáctica y Monotonía (Choppy Sentences & Cohesión)
* **Objetivo de Prueba**: Evaluar la dimensión *Cohesion & Flow* y *Syntactic Variety* en un texto que no tiene errores gramaticales graves, pero adolece de pobreza discursiva y oraciones telegráficas.
* **Nivel Estimado**: B1
* **Texto de Prueba**:
> "The weather was bad. We stayed at home. We watched a movie. The movie was very boring. Then we felt hungry. We ordered a pizza. The pizza arrived cold. We did not enjoy our evening."

* **Errores Inyectados**:
  1. `SYNTACTIC_VARIETY` (Abuso de oraciones coordinadas simples cortas).
  2. `COHESION_LINKERS` (Falta de conectores lógicos subordinantes como *Although*, *Because*, *Since*, *However*).
* **Criterio de Aceptación y Evaluación Esperada**:
  - **Rúbrica Multidimensional**: *Accuracy* alta (85-95%), pero *Cohesion & Flow* y *Syntactic Variety* bajas.
  - **Nivel 2 (Native Recast)**: Demostrar fusión natural: *"Because the weather was terrible, we decided to stay in and watch a movie. Unfortunately, it turned out to be boring, and to make matters worse, the pizza we ordered arrived cold, ruining our evening."*

---

### Caso TX-06: Coherencia de Registro y Tono (Formal vs. Informal)
* **Objetivo de Prueba**: Evaluar la dimensión *Pragmatics & Complexity* y taxonomía `REGISTER` en una carta o correo formal de negocios.
* **Nivel Estimado**: B2
* **Texto de Prueba**:
> "Dear Mr. Davis, I am writing to formally request a salary review. I have busted my back for this company all year long. Besides, you gotta admit that my sales numbers are pretty awesome. Drop me a line whenever you are free to chat about this. Sincerely, Laura Martinez."

* **Errores Inyectados**:
  1. `REGISTER` (Modismos excesivamente informales: *busted my back* en contexto formal).
  2. `REGISTER` (Contracciones no estándar: *gotta admit*).
  3. `REGISTER` (Adjetivos y expresiones coloquiales: *pretty awesome*, *Drop me a line*).
* **Criterio de Aceptación y Evaluación Esperada**:
  - **Foco de Corrección**: Mantener la intención del mensaje pero alineando el registro al tono profesional corporativo (*worked diligently / substantially contributed*, *impressive results*, *Please let me know when you are available*).

---

### Caso TX-07: Sobrecarga Cognitiva y Enfoque Selectivo (Focus on Form Stress Test)
* **Objetivo de Prueba**: Evaluar que ante un texto con múltiples fallos simultáneos (7+ errores), el sistema aplique rigurosamente el **límite de 3 focos prioritarios en Fase 2**, seleccionando los que comprometen la inteligibilidad.
* **Nivel Estimado**: A2
* **Texto de Prueba**:
> "My sister have two childs. Last month she lose her job so she need buy many things for the school of the kids. She is very worry for the money, but she do her best effort every days."

* **Errores Inyectados (Total 8 errores)**:
  1. `AGREEMENT`: *sister have*
  2. `SPELLING` / Plural irregular: *childs*
  3. `TENSE_ASPECT`: *she lose*
  4. `SYNTAX` / Omisión infinitivo: *need buy*
  5. `WORD_ORDER` / Calco: *the school of the kids*
  6. `SPELLING` / Adjetivo participial: *is very worry*
  7. `PREPOSITION`: *worry for*
  8. `LEXICAL_COLLOCATION` + Plural: *do her best effort every days*
* **Criterio de Aceptación y Evaluación Esperada**:
  - **Comprobación Crítica**: En Fase 2, el sistema **SOLO debe activar 3 intervenciones pedagógicas** (e.g., *sister have*, *lose/need en pasado*, *worry about / childs*). El resto queda diferido para la Fase 3.

---

### Caso TX-08: Caso de Control Impecable (Benchmark C1 / Sin Falsos Positivos)
* **Objetivo de Prueba**: Verificar que el sistema no invente errores inexistentes (*hallucinated errors*), reconozca estructuras avanzadas y valore adecuadamente la precisión léxica y sintáctica.
* **Nivel Estimado**: C1
* **Texto de Prueba**:
> "Had the board anticipated the regulatory hurdles earlier, they might have adopted a more cautious investment strategy. Nevertheless, the recent restructuring has already yielded tangible improvements in operational efficiency, paving the way for sustainable growth in the coming fiscal year."

* **Elementos Avanzados Incluidos**:
  - Inversión condicional (*Had the board anticipated...*).
  - Colocaciones precisas (*regulatory hurdles*, *cautious investment strategy*, *yielded tangible improvements*, *paving the way*).
  - Conectores discursivos naturales (*Nevertheless*).
* **Criterio de Aceptación y Evaluación Esperada**:
  - Cero errores marcados.
  - Evaluación global: C1 / C2.
  - Puntuaciones altas en las 4 dimensiones de la rúbrica.

---

### Caso TX-09: Modalidad "Lectura para Escribir" (Integración de Meta Léxica)
* **Objetivo de Prueba**: Validar el cumplimiento de `RF-WRT-03` donde el sistema verifica la incorporación efectiva de los *Target Chunks* fijados en la etapa previa.
* **Contexto Previo**:
  - *Chunks Meta Asignados*: `grapple with`, `striking contrast`, `pave the way`.
* **Texto de Prueba**:
> "Many modern cities grapple with severe traffic congestion and housing shortages. In striking contrast, smaller rural towns often struggle with declining populations and lack of infrastructure. Implementing better public transport could pave the way for balanced regional development."

* **Criterio de Aceptación y Evaluación Esperada**:
  - Detección exitosa del uso correcto de las 3 metas léxicas en contexto semántico adecuado.
  - Reconocimiento explícito en la pantalla de resumen y refuerzo positivo.

---

### Caso TX-10: Robustez y Exclusión de Reglas de Puntuación (`RF-WRT-09`)
* **Objetivo de Prueba**: Confirmar que el evaluador no penalice al usuario ni genere tarjetas de corrección por comas omitidas, respetando la regla expresa de exclusión de puntuación accesoria de la especificación.
* **Nivel Estimado**: B1 - B2
* **Texto de Prueba**:
> "Although it was raining heavily we decided to go for a run in the park. After finishing our training we stopped by a bakery to buy fresh bread because we were starving."

* **Condición de Prueba**:
  - El texto omite la coma tras la cláusula adverbial (*raining heavily, we*) y tras el sintagma preposicional (*our training, we*). La gramática léxica y verbal es 100% correcta.
* **Criterio de Aceptación y Evaluación Esperada**:
  - El evaluador **no debe** reportar fallos de puntuación ni rebajar la calificación de *Accuracy* por falta de comas.
  - El texto debe clasificarse como correcto a nivel léxico y morfosintáctico.

---

## 4. Guía de Ejecución de Pruebas

Para utilizar este banco en pruebas de regresión y calibración de prompts de LLM:
1. **Inyección en Prompt**: Enviar cada texto al prompt del evaluador configurado con el schema JSON del taller de redacción.
2. **Chequeo de Schemas**: Verificar que la salida estructurada contenga los campos requeridos (`taxonomic_category`, `is_l1_transfer`, `scaffolding_type: SLIP | GAP`, `clean_version`, `polished_version`, `rubric_scores`).
3. **Métrica de Fidelidad**:
   - $\ge 95\%$ en detección de `SLIP` vs `GAP`.
   - $100\%$ de cumplimiento en el límite de 3 focos de andamiaje activo para **TX-07**.
   - $0$ falsos positivos de puntuación en **TX-10**.
