# Requisitos Funcionales: Repaso Ágil de Tarjetas de Vocabulario y Expresiones

## 1. Propósito del Módulo
Ofrecer al usuario un entorno de práctica ágil y optimizado para la memorización y recuerdo activo de vocabulario, unidades fraseológicas (*lexical chunks*) y colocaciones naturales, consumiendo el motor central de repetición espaciada bajo un perfil de estudio optimizado para la memoria léxica declarativa y procedimental temprana.

> [!NOTE] Demarcación Pedagógica
> Este módulo está diseñado exclusivamente para el **recuerdo activo ágil** (3 a 5 segundos por tarjeta). La práctica de discriminación auditiva, fenómenos de habla conectada (*linking*, *glides*, elisión, asimilación), *shadowing* y ritmo prosódico se gestionan y entrenan de manera independiente en el **Laboratorio de Fonética y Habla Conectada** ([`08_phonetics_connected_speech_lab.md`](./08_phonetics_connected_speech_lab.md)) para no sobrecargar cognitivamente la sesión ni distorsionar las métricas matemáticas del algoritmo FSRS.

---

## 2. Integración con el Motor Central SRS

* **RF-SRS-01: Consumo del Motor Central (FSRS 5.0 / DSR)**:
  * El módulo no debe implementar lógica matemática de intervalos por separado. Debe delegar la programación, cálculo de estabilidad ($S$), dificultad ($D$) y proyección de intervalos ($I$) al **Motor Central SRS** ([`06_srs_core_engine.md`](./06_srs_core_engine.md)).
  * Debe aplicar el **Perfil Vocabulario y Expresiones**:
    * Retención objetivo estándar ($r_{\text{target}} = 0.90$).
    * Interfaz ergonómica y optimizada para respuestas rápidas (3 a 5 segundos por tarjeta).

* **RF-SRS-02: Calificación de Recuerdo por el Usuario**:
  * Al revisar una tarjeta, la interfaz debe ofrecer las 4 opciones estándar del motor central con atajos de teclado ergonómicos (`1`, `2`, `3`, `4`):
    * *Repetir (Again - 1)*: No se recordó el significado, colocación o uso del término.
    * *Difícil (Hard - 2)*: Recuerdo trabajoso con titubeo o demora notable (> 5 segundos).
    * *Bien (Good - 3)*: Recuerdo correcto dentro del tiempo esperado de respuesta.
    * *Fácil (Easy - 4)*: Recuerdo instantáneo, fluido y sin esfuerzo mental.

---

## 3. Requisitos Pedagógicos de Sesión de Vocabulario

* **RF-SRS-03: Mezcla Semántica Equilibrada (Interleaving)**:
  * El sistema no debe presentar consecutivamente palabras de la misma categoría o campo semántico para evitar que el usuario adivine por asociación superficial.
  * Debe alternar términos de diferentes contextos para forzar una recuperación mental activa.

* **RF-SRS-04: Rotación Dinámica de Contextos y Sentidos**:
  * Durante las sesiones de repaso, el sistema debe alternar dinámicamente las oraciones de ejemplo asociadas a cada palabra (utilizando los ejemplos graduados de la ficha léxica generados por IA).
  * Para palabras polisémicas, la tarjeta debe incorporar siempre la colocación o clave contextual asociada al sentido específico registrado, garantizando claridad inequívoca en la recuperación.

* **RF-SRS-05: Mazo Dedicado Exclusivo de Vocabulario y Expresiones**:
  * Este módulo debe operar como un muelle de repaso rápido y ligero.
  * Queda estrictamente separado de la cola de ejercicios reflexivos de redacción y del mazo de drills de discriminación auditiva y fonética para no romper el ritmo de estudio léxico.

---

## 4. Soporte Auditivo y Ergonomía de Sesión

* **RF-SRS-06: Soporte Auditivo de Referencia y Bucles Fonológicos**:
  * La tarjeta SRS debe incorporar reproducción de audio nativo local e inmediato mediante Kokoro TTS:
    * **Audio de la Palabra**: Disparado a demanda o automáticamente al voltear la tarjeta, con atajos rápidos de teclado (`R` para velocidad normal 1.0x, `S` para velocidad lenta 0.75x).
    * **Audio de la Oración de Contexto**: Reproducción a velocidad natural (1.0x) o reducida (0.75x) para consolidar el modelo acústico nativo en la memoria de trabajo.
    * **Selector de Acento**: Alternancia inmediata entre General American (US) y Received Pronunciation (UK).

* **RF-SRS-07: Resumen y Conclusión de Sesión**:
  * Al finalizar el lote diario de tarjetas, el sistema debe mostrar una pantalla de balance con:
    * Número total de tarjetas revisadas.
    * Distribución de calificaciones (*Again*, *Hard*, *Good*, *Easy*).
    * Tasa de retención de la sesión frente al objetivo ($r_{\text{target}} = 90\%$).
    * Tiempo total invertido y tiempo promedio de respuesta por tarjeta.
    * Estado de la racha diaria de estudio (*Streak*).

* **RF-SRS-08: Gestión Visual de Tarjetas Sangijuela (Leeches)**:
  * Cuando una tarjeta es catalogada como *Leech* por el motor central, la tarjeta de repaso debe desplegar un banner pedagógico amigable y sutil en lugar de una advertencia punitiva, ofreciendo acceso inmediato a una oración contextual alternativa o una pista de colocación.
