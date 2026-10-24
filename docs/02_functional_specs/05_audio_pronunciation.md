# Requisitos Funcionales: Motor de Audio y Síntesis de Voz (Kokoro TTS)

## 1. Propósito del Módulo
Proporcionar un servicio transversal de síntesis de voz neuronal de alta fidelidad y efectos auditivos en el dispositivo local, garantizando una referencia de pronunciación nativa, prosodia natural y retroalimentación auditiva para todos los módulos de aprendizaje sin requerir conexión continua a servicios en la nube.

---

## 2. Requisitos de Síntesis de Voz y Pronunciación

* **RF-AUD-01: Generación de Voz Neuronal Local**:
  * El sistema debe contar con un motor de síntesis de voz (TTS - Kokoro) que ejecute la generación de voz natural de forma local y privada en el equipo del usuario.
  * La reproducción debe iniciarse de manera fluida y sin congelar la interfaz de usuario durante la generación del audio.

* **RF-AUD-02: Soporte de Acentos Nativos**:
  * El motor de voz debe ofrecer opciones de pronunciación diferenciadas:
    * Inglés Americano (*General American*).
    * Inglés Británico (*Received Pronunciation*).
  * El usuario debe poder seleccionar su acento o voz preferida en la configuración general del sistema.

* **RF-AUD-03: Control de Velocidad de Reproducción**:
  * El sistema debe permitir ajustar la velocidad del habla (desde velocidad lenta de estudio como 0.75x–0.8x hasta velocidad nativa 1.0x).
  * La reducción de velocidad no debe distorsionar el tono ni degradar la calidad fonética del sonido.

* **RF-AUD-04: Modos de Pronunciación Segmentada y Continua**:
  * El servicio de audio debe admitir diferentes niveles de granularidad:
    * *Palabras y unidades aisladas*: Pronunciación nítida de lemas y formas verbales.
    * *Oraciones de ejemplo y habla conectada*: Lectura fluida con enlace natural entre palabras (*linking*), elisiones y reducción vocálica (*schwa*).
    * *Párrafos y textos extensos*: Lectura continua de artículos o consignas del taller de redacción.

---

## 3. Requisitos de Retroalimentación y Control

* **RF-AUD-05: Retroalimentación Sonora de Interacción**:
  * El sistema debe emitir señales auditivas breves y no intrusivas para confirmar aciertos o fallos durante las sesiones de práctica interactiva.

* **RF-AUD-06: Control de Reproducción y Cancelación Inmediata**:
  * La interfaz debe permitir pausar, reiniciar o detener inmediatamente el audio en curso si el usuario avanza de pantalla o solicita la reproducción de otro elemento.

* **RF-AUD-07: Mecanismo de Respaldo (Fallback)**:
  * En caso de que el motor neuronal de alta fidelidad se encuentre inicializando o no esté disponible temporalmente, el sistema debe recurrir automáticamente a la síntesis de voz estándar del sistema operativo para no interrumpir el estudio.

* **RF-AUD-08: Soporte para Bucles de Shadowing y Velocidad Gradual**:
  * Para nutrir al **Laboratorio de Fonética y Habla Conectada** ([`08_phonetics_connected_speech_lab.md`](./08_phonetics_connected_speech_lab.md)), el servicio de audio debe permitir la reproducción cíclica (*looping*) de fragmentos oracionales cortos y transiciones suaves de velocidad (ej. 0.75x $\rightarrow$ 0.9x $\rightarrow$ 1.0x $\rightarrow$ 1.1x) sin interrupciones de búfer ni latencia perceptible.

