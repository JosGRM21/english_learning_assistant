# Requisitos Funcionales: Repaso Espaciado de Errores de Redacción y Desfosilización

## 1. Propósito del Módulo
Ofrecer al usuario un módulo de práctica focalizado y autónomo que transforme los errores sintácticos, léxicos y discursivos identificados en el taller de redacción en ejercicios interactivos programados mediante repetición espaciada (SRS). Su meta es desfosilizar estructuras incorrectas y verificar su erradicación tanto en la memoria de trabajo como en la producción escrita futura.

---

## 2. Requisitos de Captura y Modelado de Errores

* **RF-ERR-01: Extracción Automática con Contexto Oracional Ampliado**:
  * El sistema debe capturar los fallos lingüísticos identificados durante el taller de redacción.
  * Para cada error, el sistema debe registrar:
    * La oración original que contiene el desajuste.
    * El *contexto ampliado*: la oración anterior y posterior dentro del texto original del estudiante, preservando la intención comunicativa y el hilo narrativo.
    * La taxonomía formal del fallo (`PREPOSITION`, `LEXICAL_COLLOCATION`, `AGREEMENT`, `COHESION_LINKERS`, etc.) y si existió interferencia directa del español (L1).
    * La explicación pedagógica de la norma o patrón idiomático.
    * La solución correcta y la versión reformulada nativa.

* **RF-ERR-02: Formatos de Ejercicio Exclusivos de Producción Positiva (Evitar Priming Negativo)**:
  * Para impedir que la visualización repetida de formas incorrectas refuerce involuntariamente la huella de memoria del error en el cerebro (*priming negativo*), el sistema debe prohibir ejercicios de selección múltiple con distractores basados en el propio error del usuario o tareas de corrección pasiva.
  * La práctica debe basarse estrictamente en formatos de **procesamiento de input estructurado y producción activa correcta**:
    * *Completar Espacio en Blanco Contextualizado (Contextual Cloze)*: Presentar la oración en su contexto con el elemento problemático omitido para que el usuario teclee la preposición, forma verbal o colocación precisa.
    * *C-Test / Pistas Morfofonéticas*: Proporcionar la primera letra o prefijo del término meta dentro de la frase para activar el recuerdo productivo sin revelar la palabra completa.
    * *Transformación Guiada de Oración (Sentence Rewriting)*: Modificar una oración base o combinar dos cláusulas aplicando la estructura gramatical o conector discursivo meta a partir de una palabra clave proporcionada.
    * *Reconstrucción de Chunks (Chunk Scramble/Builder)*: Ordenar bloques predefinidos de colocaciones idiomáticas correctas dentro de la estructura oracional.

---

## 3. Requisitos de Sesión de Práctica Diferenciada

* **RF-ERR-03: Módulo y Entorno de Práctica Separado del Vocabulario Léxico**:
  * Este módulo debe disponer de un flujo y pantalla de sesión diferenciados respecto a las tarjetas rápidas de vocabulario general.
  * La interfaz debe priorizar la lectura pausada y reflexiva (dedicando entre 15 y 45 segundos por ejercicio), orientada al razonamiento sintáctico y a la integración textual de las oraciones.

* **RF-ERR-04: Retroalimentación Pedagógica Inmediata y Contraste Positivo**:
  * Tras enviar su respuesta, el sistema debe proporcionar de forma instantánea:
    * Validación de acierto o fallo.
    * Explicación concisa y accesible del principio sintáctico o colocación idiomática aplicada.
    * Micro-recordatorio del contexto donde ocurrió el error en la redacción original para afianzar la conexión entre práctica aislada y producción real.

---

## 4. Requisitos de Repetición Espaciada, Desfosilización y Monitoreo Longitudinal

* **RF-ERR-05: Programación con el Motor Central SRS (Perfil Errores de Redacción)**:
  * Cada ejercicio de error debe ser gestionado a través del **Motor Central SRS** ([`06_rf_srs_core_engine.md`](file:///c:/Users/Josnaiker%20Rivas/Desktop/english_learning_assistant/docs/06_rf_srs_core_engine.md)), aplicando el **Perfil Errores de Redacción y Sintaxis**.
  * Aplica una retención objetivo más estricta ($r_{\text{target}} = 0.92$) y una mayor penalización de estabilidad ante fallos para erradicar patrones arraigados de la L1.
  * Aquellos fallos cometidos recientemente o errados en la sesión de práctica deben volver a programarse en intervalos cortos de re-aprendizaje.
  * Conforme el usuario resuelva el ejercicio correctamente en sesiones sucesivas, el intervalo de reaparición debe espaciarse para certificar que la estructura ha sido automatizada a largo plazo.

* **RF-ERR-06: Graduación Preliminar en el SRS**:
  * Cuando un ítem de error alcanza una racha exitosa sostenida a través de intervalos prolongados (semanas/meses), el sistema debe asignarle el estado provisional de *Patrón Internalizado en SRS*.
  * El sistema debe ofrecer al usuario métricas claras de su evolución por categorías de error superadas.

* **RF-ERR-07: Monitoreo Longitudinal de Reincidencia (Bucle Taller $\leftrightarrow$ SRS)**:
  * El aprendizaje no se considera consolidado solo por acertar tarjetas descontextualizadas en el SRS; debe manifestarse en la escritura libre y espontánea.
  * **Vigilancia Activa de Regresión**: Cuando el usuario redacte un nuevo texto en el taller de redacción, el sistema debe cruzar las categorías de errores cometidas con el historial de errores "internalizados" del SRS.
  * **Detección de Recidivismo**: Si el estudiante vuelve a cometer un fallo del mismo patrón específico (ej. misma preposición dependiente o mismo error de colocación) en un texto nuevo:
    * El sistema alertará discretamente del reingreso del patrón.
    * El estado del error en el SRS se reactivará automáticamente (*Re-aprendizaje / Alerta de Fosilización*), programando nuevas sesiones de refuerzo inmediato.

* **RF-ERR-08: Soporte Auditivo y Prosodia con Kokoro TTS**:
  * Para aprovechar el canal auditivo en la fijación sintáctica natural, cada ejercicio resuelto correctamente debe permitir la escucha de la oración completa sintetizada por Kokoro TTS.
  * El usuario podrá asimilar auditivamente el ritmo, enlaces léxicos y acentuación oracional propia de la estructura correcta.
