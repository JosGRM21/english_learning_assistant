# Requisitos Funcionales: Repaso de Tarjetas de Vocabulario y Fonética

## 1. Propósito del Módulo
Ofrecer al usuario un entorno de práctica ágil y optimizado para la memorización y recuerdo activo de vocabulario, colocaciones y pronunciación natural, consumiendo el motor central de repetición espaciada bajo un perfil de estudio optimizado para la memoria léxica y la fluidez auditiva.

---

## 2. Integración con el Motor Central SRS

* **RF-SRS-01: Consumo del Motor Central (FSRS/DSR)**:
  * El módulo no debe implementar lógica matemática de intervalos por separado. Debe delegar la programación, cálculo de estabilidad ($S$), dificultad ($D$) y proyección de intervalos ($I$) al **Motor Central SRS** ([`06_rf_srs_core_engine.md`](file:///c:/Users/Josnaiker%20Rivas/Desktop/english_learning_assistant/docs/06_rf_srs_core_engine.md)).
  * Debe aplicar el **Perfil Vocabulario y Expresiones**:
    * Retención objetivo estándar ($r_{\text{target}} = 0.90$).
    * Interfaz optimizada para respuestas rápidas (3 a 5 segundos por tarjeta).

* **RF-SRS-02: Calificación de Recuerdo por el Usuario**:
  * Al revisar una tarjeta, la interfaz debe ofrecer las 4 opciones estándar del motor central:
    * *Repetir (Again)*: No se recordó el significado, pronunciación o uso.
    * *Difícil (Hard)*: Recuerdo trabajoso con demora notable.
    * *Bien (Good)*: Recuerdo correcto dentro del tiempo esperado.
    * *Fácil (Easy)*: Recuerdo instantáneo y fluido.

---

## 3. Requisitos Pedagógicos de Sesión de Vocabulario

* **RF-SRS-03: Mezcla Semántica Equilibrada (Interleaving)**:
  * El sistema no debe presentar consecutivamente palabras de la misma categoría o campo semántico para evitar que el usuario adivine por asociación superficial.
  * Debe alternar términos de diferentes contextos para forzar una recuperación mental activa.

* **RF-SRS-04: Rotación Dinámica de Contextos y Sentidos**:
  * Durante las sesiones de repaso, el sistema debe variar las oraciones de ejemplo asociadas a cada palabra (usando los ejemplos graduados de la ficha léxica).
  * Para palabras polisémicas, la tarjeta debe incorporar siempre la colocación o clave contextual asociada al sentido específico registrado, garantizando claridad en la recuperación.

* **RF-SRS-05: Mazo Dedicado Exclusivo de Vocabulario y Fonética**:
  * Este módulo debe operar como un muelle de repaso rápido y ligero.
  * Queda estrictamente separado de la cola de ejercicios de redacción y análisis sintáctico complejo para no romper el ritmo de estudio léxico.

---

## 4. Requisitos de Práctica Fonética y Habla Conectada

* **RF-SRS-06: Práctica de Enlaces de Palabras (Linking)**:
  * El sistema debe identificar y resaltar visualmente los puntos donde el final consonántico de una palabra se une fluidamente a la vocal inicial de la siguiente en la oración de ejemplo.

* **RF-SRS-07: Identificación de Sonidos de Transición (Glides)**:
  * Debe indicar la inserción de semivocales suaves (/j/ o /w/) que ocurren naturalmente en inglés entre vocales consecutivas.

* **RF-SRS-08: Práctica de Formas Débiles y Reducción Vocálica**:
  * El sistema debe destacar las palabras funcionales átonas (preposiciones, conjunciones, auxiliares) que se reducen al sonido vocal neutro (*Schwa*) en el habla natural, ayudando al usuario a comprender el ritmo real del idioma.

* **RF-SRS-09: Resumen y Conclusión de Sesión**:
  * Al finalizar el lote diario de tarjetas, el sistema debe mostrar un resumen con el número de tarjetas repasadas, tasa de aciertos y tiempo invertido.

* **RF-SRS-10: Soporte Auditivo en Sesión de Repaso**:
  * El sistema debe permitir la reproducción automática o a demanda de la pronunciación de cada tarjeta y de sus oraciones de contexto mediante el motor de síntesis de voz (Kokoro TTS), facilitando la discriminación auditiva de fenómenos de habla conectada (*linking*, formas débiles).
