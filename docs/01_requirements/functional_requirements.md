---
title: Especificación de Requisitos Funcionales (SRS) - English Learning Assistant (ELA)
document_version: 2.0.0
standard: IEEE 830 / ISO/IEC/IEEE 29148
status: APPROVED
author: ELA Scientific Architecture & Engineering Team
---

# Especificación Formal de Requisitos Funcionales (SRS)
## English Learning Assistant (ELA)

Este documento define de manera exhaustiva y formal los **Requisitos Funcionales (RF)** del sistema **English Learning Assistant (ELA)**, alineados estrictamente con el estándar **IEEE 830 / ISO/IEC/IEEE 29148** y cimentados sobre el marco científico documentado en [`docs/02_pedagogical_framework/`](../02_pedagogical_framework/).

Cada requisito cuenta con identificador canónico, justificación científica, entradas, procesamiento algorítmico, salidas y criterios de aceptación verificables.

---

## Índice de Módulos Funcionales

1. [Módulo 1: Gestión Léxica y Enfoque por Chunks (RF-VOC)](#1-módulo-de-gestión-léxica-y-enfoque-por-chunks-rf-voc)
2. [Módulo 2: Semántica Cognitiva y "Thinking for Speaking" (RF-SEM)](#2-módulo-de-semántica-cognitiva-y-thinking-for-speaking-rf-sem)
3. [Módulo 3: Fonética Acústica, Articulatoria y Habla Conectada (RF-PHO)](#3-módulo-de-fonética-acústica-articulatoria-y-habla-conectada-rf-pho)
4. [Módulo 4: Fonología Suprasegmental, Prosodia y Entonación (RF-PRO)](#4-módulo-de-fonología-suprasegmental-prosodia-y-entonación-rf-pro)
5. [Módulo 5: Percepción Auditiva de Alta Variabilidad (HVPT) (RF-HVPT)](#5-módulo-de-percepción-auditiva-de-alta-variabilidad-hvpt-rf-hvpt)
6. [Módulo 6: Matriz de Neutralización de Interferencia L1 Español (RF-TRN)](#6-módulo-de-matriz-de-neutralización-de-interferencia-l1-español-rf-trn)
7. [Módulo 7: Repetición Espaciada Inteligente FSRS (RF-SRS)](#7-módulo-de-repetición-espaciada-inteligente-fsrs-rf-srs)
8. [Módulo 8: Motor de Proceduralización y Drills de Velocidad (RF-PROC)](#8-módulo-de-motor-de-proceduralización-y-drills-de-velocidad-rf-proc)
9. [Módulo 9: Taller de Tareas Comunicativas Genuinas (TBLT) (RF-TBLT)](#9-módulo-de-taller-de-tareas-comunicativas-genuinas-tblt-rf-tblt)
10. [Módulo 10: Tutoría Socrática y Micro-Writing con Google Gemini (RF-SOC)](#10-módulo-de-tutoría-socrática-y-micro-writing-con-google-gemini-rf-soc)
11. [Módulo 11: Input Comprensible y Decodificación Auditiva Bottom-Up (RF-INP)](#11-módulo-de-input-comprensible-y-decodificación-auditiva-bottom-up-rf-inp)
12. [Módulo 12: Motor de Diagnóstico Inteligente y Micro-Workouts (RF-DIA)](#12-módulo-de-motor-de-diagnóstico-inteligente-y-micro-workouts-rf-dia)
13. [Módulo 13: Autorregulación (SRL), Hábitos Antifrágiles y Filtro Afectivo (RF-SRL)](#13-módulo-de-autorregulación-srl-hábitos-antifrágiles-y-filtro-afectivo-rf-srl)
14. [Módulo 14: Gestión de IA, Pool Multi-API Key y Resiliencia 2D (RF-AIC)](#14-módulo-de-gestión-de-ia-pool-multi-api-key-y-resiliencia-2d-rf-aic)

---

## 1. Módulo de Gestión Léxica y Enfoque por Chunks (RF-VOC)

### RF-VOC-01: Categorización Gramatical Estricta y Taxonomía de Chunks
- **Descripción:** El sistema debe categorizar cada elemento léxico registrado en una de tres dimensiones:
  1. *Palabras de Contenido:* Sustantivos (contables/incontables), Verbos (transitivos/intransitivos, estativos/dinámicos, regulares/irregulares), Adjetivos (gradables/no gradables), Adverbios.
  2. *Palabras Funcionales:* Preposiciones, Conjunciones, Artículos/Determinantes, Pronombres.
  3. *Unidades Fraseológicas (Lexical Chunks):*
     - Colocaciones léxicas ($V+N, Adj+N, Adv+Adj, N+V, V+Prep$).
     - Modismos (*idioms*) y binomios (*black and white*).
     - Verbos compuestos (*Phrasal Verbs* clasificados en Tipos 1 a 4).
     - Marcos oracionales y gambits conversacionales (*Sentence Frames & Gambits*).
- **Fundamento Científico:** *The Lexical Approach* (Michael Lewis, 1993) y el Principio del Idioma (Sinclair, 1991). La memoria lingüística recupera el lenguaje en bloques prefabricados; estudiar palabras aisladas satura la memoria de trabajo ($4 \pm 1$ chunks, Cowan).
- **Entrada:** Palabra, colocación o phrasal verb ingresado por el usuario o extraído de texto.
- **Salida:** Registro persistido en `vocab_items` o `phraseological_units` con metadatos morfosintácticos completos.
- **Criterio de Aceptación:** Ningún elemento léxico puede crearse sin asignación a una dimensión y subtipo funcional formal.

### RF-VOC-02: Enriquecimiento Semántico Multidimensional de Paul Nation
- **Descripción:** Para cada elemento registrado, el sistema debe almacenar y visualizar la matriz de 9 componentes de Nation:
  - *Forma:* Transcripción fonética dual IPA (GA y RP), marcas de división silábica y acento primario, familia morfológica flexiva y derivativa (`morphological_family_json`).
  - *Significado:* Definición en inglés simplificado para aprendices (*learner-friendly*), traducción contextual explicativa al español (L1), nivel de referencia CEFR (A1 a C2).
  - *Uso:* Régimen preposicional obligatorio, colocaciones frecuentes verificadas en corpus, y restricciones de registro (formal, informal, técnico).
- **Fundamento Científico:** Modelo de Conocimiento Léxico Integral (Paul Nation, 2001, 2013). Saber una palabra trasciende su traducción bilingüe.

### RF-VOC-03: Ingesta Rápida y Enriquecimiento Automático en 1 Clic con Gemini 3.x Flash
- **Descripción:** El usuario puede ingresar un término o unidad fraseológica aislada (o capturarla desde el lector). El sistema invoca la API de Google Gemini (modelo familia 3.x Flash) con schema JSON estricto (`AiVocabularyEnrichmentResponse`) y genera de forma instantánea (< 1.2 s) la metadata completa de RF-VOC-01 y RF-VOC-02, persistiendo la entrada e inicializando de inmediato una tarjeta `srs_cards` en estado `NEW`.
- **Criterio de Aceptación:** Si la API devuelve un error de red o cuota, el sistema activa la cascada 2D de resiliencia (RF-AIC-03) de forma transparente.

### RF-VOC-04: Banco de Contextos Dinámicos y Rotación de Oraciones Cloze
- **Descripción:** Cada entrada de vocabulario debe admitir un banco de al menos 3 a 5 oraciones contextuales reales en `vocab_context_examples`, con indicación del hueco objetivo (`cloze_target`). Durante las sesiones de repaso FSRS, el sistema selecciona aleatoriamente un contexto diferente en cada presentación.
- **Fundamento Científico:** Dinámica de Memoria y Dificultades Deseables (Bjork & Bjork, 2011). La variabilidad contextual previene el falso reconocimiento sustentado en pistas visuales superficiales y fortalece la Fuerza de Almacenamiento ($SS$).

---

## 2. Módulo de Semántica Cognitiva y "Thinking for Speaking" (RF-SEM)

### RF-SEM-01: Entrenador de Eventos de Movimiento en Marco Satelital (Satellite-Framed Motion)
- **Descripción:** El sistema debe proveer ejercicios específicos para erradicar el uso exclusivo de verbos latinos estáticos (*enter, exit, ascend, descend, cross*) en hablantes de español (lengua de marco verbal). El módulo entrena el patrón inglés nativo: **Verbo de Manera + Satélite Preposicional** (*rush into, sneak out, march forward, crawl through, stumble across*).
- **Fundamento Científico:** Hipótesis *Thinking for Speaking* (Dan Slobin, 1996, 2004) y Tipología de Eventos de Movimiento (Leonard Talmy, 1985, 2000).

### RF-SEM-02: Laboratorio Topológico de Preposiciones Corporizadas (Lakoff & Johnson)
- **Descripción:** Módulo visual e interactivo que desmitifica las preposiciones *IN*, *ON* y *AT* sustituyendo las listas de traducción por esquemas espaciales corporizados (*Image Schemas*):
  - *IN:* Esquema de Contención 3D (espacio delimitado interior, recipientes, vehículos cerrados, meses, años).
  - *ON:* Esquema de Contacto y Soporte de Superficie 2D (mesas, paredes, transporte público en plataforma, días específicos).
  - *AT:* Esquema de Punto Específico y Coordenada Adimensional 0D (ubicación funcional, coordenadas exactas, horas precisas).
- **Interfaz:** Gráficos SVG interactivos donde el usuario arrastra sustantivos hacia el contenedor, la superficie o el punto de contacto, recibiendo feedback háptico y acústico.

### RF-SEM-03: Desmitificador de Pares Polisémicos de Alta Confusión
- **Descripción:** Entrenadores dirigidos a pares semánticos que el español colapsa en una sola palabra polivalente:
  - *Make vs. Do* (Creación/cambio de estado vs. Actividad/proceso).
  - *Say vs. Tell vs. Speak vs. Talk* (Contenido vs. Destinatario personal vs. Unilateral/idioma vs. Conversación interactiva).
  - *Hear vs. Listen (to)* (Involuntario vs. Atención deliberada).
  - *See vs. Look (at) vs. Watch* (Espontáneo vs. Dirección de mirada vs. Movimiento continuado).
  - *Borrow (from) vs. Lend (to)* (Entrada de préstamo vs. Salida de préstamo).
  - *Win vs. Earn vs. Gain* (Azar/competencia vs. Retribución laboral/mérito vs. Incremento gradual).
  - *Miss vs. Lose* (Extrañar/oportunidad de transporte vs. Extravío de posesión).

### RF-SEM-04: Restricción de Verbos Deslexicalizados
- **Descripción:** Los verbos de ultra-alta frecuencia cuyo significado reside en el sustantivo (*have, take, make, give, do, get, set*) no pueden ser estudiados en aislamiento. El sistema rechaza o alerta cuando el usuario intenta crear una tarjeta con solo *get* o *take*, forzando la creación de una colocación binaria inseparable (*take a shower*, *get used to*, *have a word*).

---

## 3. Módulo de Fonética Acústica, Articulatoria y Habla Conectada (RF-PHO)

### RF-PHO-01: Transcripción Fonética Dual IPA y Acento Léxico
- **Descripción:** El sistema debe renderizar para cada palabra y frase:
  1. Transcripción IPA estricta en General American (GA) y Received Pronunciation (RP).
  2. División silábica explícita con marcas de acento primario (`ˈ`) y secundario (`ˌ`).
  3. Visualización con código tipográfico legible optimizado para fonética (fuente fonética normalizada).

### RF-PHO-02: Reproducción Auditiva Multimodal
- **Descripción:** El sistema debe reproducir el audio con síntesis neural nativa de latencia ultrabaja (< 200 ms):
  - Velocidad normal (1.0x).
  - Velocidad lenta pedagógica (0.75x) con preservación exacta del tono acústico (*pitch-preserving algorithm*).

### RF-PHO-03: Laboratorio Articulatorio Visual y Cuadrilátero Vocálico Dual-Coding
- **Descripción:** El sistema debe presentar el mapa del cuadrilátero vocálico acústico interactivo graficado según $F_1$ (altura lingual / apertura mandibular) y $F_2$ (posición lingual anteroposterior), contrastando el sistema de 5 vocales del español contra las 12 vocales del inglés.
- **Pares Críticos Tensos vs. Laxos:**
  - `/iː/` (tensa, sonrisa) vs. `/ɪ/` (laxa, mandíbula caída, lengua centralizada).
  - `/uː/` (tensa, abocinada) vs. `/ʊ/` (laxa, redondeo suave).
  - Tríada anterior abierta `/e/` vs. `/æ/` vs. `/ʌ/`.

### RF-PHO-04: Detector y Entrenador de Voice Onset Time (VOT)
- **Descripción:** El sistema debe explicar y entrenar el Voice Onset Time (VOT):
  - Las oclusivas sordas iniciales del inglés (/p, t, k/) exigen un VOT positivo largo (+40 a +100 ms) con explosión de aire audible (aspiración `[pʰ, tʰ, kʰ]`).
  - El sistema entrena al hispanohablante a aspirar para que palabras como *pin* no sean percibidas por el oído nativo como *bin* (las cuales en inglés tienen un VOT corto cercano a cero).

### RF-PHO-05: Motor de Reglas de Habla Conectada (Connected Speech)
- **Descripción:** El motor `PhoneticEngine` debe analizar oraciones completas y descomponer los 4 fenómenos de habla rápida:
  1. *Elisión:* Desaparición de /t, d/ entre consonantes (*last night* $\rightarrow$ `[lɑːs naɪt]`), síncopa de vocales átonas (*camera* $\rightarrow$ `[ˈkæmrə]`), y caída de /h/ en auxiliares (*tell him* $\rightarrow$ `[tel ɪm]`).
  2. *Asimilación:* Regresiva de punto de articulación (*ten boys* $\rightarrow$ `[tem bɔɪz]`, *white coffee* $\rightarrow$ `[waɪk ˈkɒfi]`), coalescente (*t+j $\rightarrow$ tʃ* en *don't you*, *d+j $\rightarrow$ dʒ* en *did you*, *s+j $\rightarrow$ ʃ*, *z+j $\rightarrow$ ʒ*) y de sonoridad (*have to* $\rightarrow$ `[ˈhæftuː]`).
  3. *Enlace (Linking):* Catenación consonante-vocal (*hold on* $\rightarrow$ `[həʊl-dɒn]`), flap alveolar `[ɾ]` en inglés americano (*check it out* $\rightarrow$ `[tʃe-kɪ-ɾaʊt]`), glides intrusivos palatales `/j/` (*I agree* $\rightarrow$ `[aɪ-j-əˈɡriː]`) y labiovelares `/w/` (*go out* $\rightarrow$ `[ɡəʊ-w-aʊt]`), linking 'r' e intrusive 'r', y geminación (*black cat* $\rightarrow$ `[blækːæt]`).
  4. *Formas Débiles y Schwa (/ə/):* Reducción fonológica en más de 40 palabras funcionales átonas (*to, of, for, and, can, was, at, from, some, them*).

### RF-PHO-06: Visualizador Gráfico con Código de Color Semántico
- **Descripción:** En la vista de estudio fonético, la oración se muestra con código de color estandarizado:
  - 🔵 **Azul (`#2563EB`):** Enlace consonante-vocal y glides intrusivos.
  - 🔴 **Rojo tachado (`#DC2626`):** Elisiones y sonidos suprimidos.
  - 🟡 **Amarillo / Ámbar (`#D97706`):** Asimilaciones regresivas y coalescentes.
  - 🟢 **Verde Esmeralda (`#059669`):** Formas débiles y reducciones al Schwa `/ə/`.

---

## 4. Módulo de Fonología Suprasegmental, Prosodia y Entonación (RF-PRO)

### RF-PRO-01: Entrenador de Acento Nuclear Contrastivo (Tonic / Nuclear Pitch Accent)
- **Descripción:** El sistema debe incluir un módulo específico para entrenar el acento oracional primario (*Nuclear Stress*). Demuestra cómo el foco tonal altera radicalmente el significado pragmático (p. ej. las 7 intenciones contrastivas de *"I didn't say she stole my money"*).
- **Comportamiento:** El usuario escucha la oración pronunciada con acentos nucleares variables y debe seleccionar qué implicatura o información nueva se está transmitiendo.

### RF-PRO-02: Segmentador de Grupos de Pensamiento (Thought Groups)
- **Descripción:** En los ejercicios de lectura fluida y habla, el sistema inserta marcadores visuales de respiración semántica (`//`) que delimitan los *Thought Groups*, evitando que el hispanohablante hable en ráfagas desarticuladas o pause en lugares sintácticamente aberrantes.

### RF-PRO-03: Reconocedor de Contornos Melódicos de Entonación
- **Descripción:** El sistema debe desglosar y entrenar los cuatro contornos tonales de la frecuencia fundamental ($F_0$):
  1. *Entonación Descendente ($\searrow$):* Finalidad, certeza, aseveraciones y preguntas con *Wh-*.
  2. *Entonación Ascendente ($\nearrow$):* Preguntas polares (Sí/No), peticiones de aclaración, listas abiertas.
  3. *Entonación Descendente-Ascendente ($\searrow\nearrow$ - Fall-Rise):* Reserva mental, desacuerdo diplomático, *hedging* y cortesía corporativa.
  4. *Entonación Ascendente-Descendente ($\nearrow\searrow$ - Rise-Fall):* Sorpresa intensa, ironía o entusiasmo marcado.
  5. *Entonación en Question Tags:* Distinción entre tono descendente (búsqueda de consenso) y tono ascendente (pregunta genuina).

### RF-PRO-04: Estudio de Prosodic Shadowing con Rastreador de Tono ($F_0$ Pitch Tracker)
- **Descripción:** El usuario escucha una frase nativa y graba su propia voz por micrófono. El sistema calcula en milisegundos la curva de tono fundamental ($F_0$) del usuario mediante transformada de Fourier / autocorrelación y la superpone visualmente sobre la curva melódica del hablante nativo, indicando el grado de coincidencia prosódica en porcentaje.

---

## 5. Módulo de Percepción Auditiva de Alta Variabilidad (HVPT) (RF-HVPT)

### RF-HVPT-01: Protocolo HVPT Multi-Hablante
- **Descripción:** Para recalibrar el mapa perceptual auditivo del hispanohablante y superar el imán de la L1 (Patricia Kuhl), el Gimnasio de Pares Mínimos debe contar con un banco acústico de **al menos 4 a 6 voces nativas distintas** por cada contraste fonológico (voces masculinas graves, femeninas agudas, acentos General American y Received Pronunciation).
- **Fundamento Científico:** High-Variability Phonetic Training (Logan, Lively & Pisoni, 1991; Bradlow et al., 1997). El entrenamiento con una sola voz genera aprendizaje no generalizable; la alta varianza acústica fuerza a la corteza auditiva a construir representaciones fonológicas abstractas invariables.

### RF-HVPT-02: Elección Forzada a Ciegas (Blind Forced-Choice)
- **Descripción:** Durante el drill auditivo, el estímulo acústico se reproduce antes de que se muestre el texto en pantalla. La interfaz bloquea la visualización ortográfica previa para forzar al cerebro a decodificar la señal auditiva pura sin el sesgo contaminante de las letras escritas.

### RF-HVPT-03: Restricción Temporal Estricta de 2.0 Segundos
- **Descripción:** Una vez reproducido el audio, el usuario dispone de una ventana de cuenta regresiva de **2.0 segundos exactos** para seleccionar entre los dos botones del par mínimo (p. ej. `[ SHIP ]` vs. `[ SHEEP ]`). Si el temporizador llega a cero, se computa como fallo por titubeo perceptivo.

### RF-HVPT-04: Feedback Acústico Espectrográfico Inmediato
- **Descripción:** Al errar, el sistema no emite alarmas punitivas: muestra un gráfico espectrográfico comparativo simplificado y reproduce inmediatamente ambos estímulos en secuencia directa para activar el "error de predicción" y calibrar el límite de frontera categorial.

---

## 6. Módulo de Matriz de Neutralización de Interferencia L1 Español (RF-TRN)

### RF-TRN-01: Entrenador de Parámetro de Sujeto Nulo y Pronombres Ficticios (Dummy It / There)
- **Descripción:** Módulo de práctica intensiva para erradicar la omisión de sujetos preverbales por transferencia del español (lengua *pro-drop*).
- **Estructuras Entrenadas:**
  - Verbos meteorológicos (*It is raining*, no *Is raining*).
  - Cláusulas impersonales/adjetivales (*It is important to practice*, no *Is important*).
  - Existenciales (*There is / There are*, no *Have / Is*).
  - Cláusulas subordinadas (*It seems that it will rain*).

### RF-TRN-02: Entrenador de Conflictos de Tiempo-Aspecto-Modo (TAM)
- **Descripción:** Módulo focalizado en las divergencias temporales críticas:
  - *Present Perfect vs. Past Simple:* Frontera binaria entre períodos cerrados (*yesterday, last year, in 2020 $\rightarrow$ Past Simple*) y abiertos vinculados al presente (*today, this week, so far, since 3 years $\rightarrow$ Present Perfect*).
  - *Verbos Estativos:* Prohibición de aspectos continuos en verbos de estado (*I know, I don't believe, this belongs to me*, nunca *I am knowing*).
  - *Estructuras Condicionales:* Erradicación del modal *would* en la cláusula condicional (*If I had time, I would go*, nunca *If I would have time*).

### RF-TRN-03: Matriz de Regímenes Preposicionales Divergentes
- **Descripción:** Entrenamiento reactivo sobre los dos tipos de desajustes preposicionales:
  1. *Verbos con Preposición Obligatoria Divergente:* *depend on* (no *of*), *consist of* (no *in*), *married to* (no *with*), *good at* (no *in*), *interested in* (no *for*), *dream about/of* (no *with*), *arrive at/in* (no *to*), *congratulate on* (no *for*), *think of/about* (no *in*), *pay for* (no *pay the dinner*).
  2. *Verbos Transitivos Directos en Inglés (Que en español llevan preposición):* *discuss the problem* (no *discuss about*), *enter the building* (no *enter to*), *call my brother* (no *call to*), *approach the door* (no *approach to*), *reach an agreement* (no *reach to*), *contact support* (no *contact with*).

### RF-TRN-04: Entrenador de Inversión en Preguntas Indirectas (Embedded Questions)
- **Descripción:** Práctica guiada para asegurar que las preguntas incrustadas adopten el orden declarativo (Sujeto + Verbo):
  - Correcto: *"Could you tell me where the station is?"* (No: *where is the station*).
  - Correcto: *"I don't know what he did."* (No: *what did he do*).

### RF-TRN-05: Extintor de Fosilización de la 3ra Persona Singular (-s / -es)
- **Descripción:** El error más resistente del aprendiz adulto no se corrige con teoría, sino con **Drills de Sustitución Rápida con temporizador de 2.0 s**:
  - Estímulo base: *"They live in Berlin."* $\rightarrow$ Operador: `[SHE]` $\rightarrow$ Respuesta en < 2.0 s: *"She lives in Berlin."*
  - El sistema detecta y computa específicamente la latencia en la terminación *-s*.

### RF-TRN-06: Extintor de Prótesis Vocálica ante /s/ Líquida Inicial (#sC Clusters)
- **Descripción:** Ejercicios auditivos y de lectura fonética para eliminar la inserción de [e] antes de palabras como *school, student, special, start, Spain*:
  - Fase 1: Siseo sostenido previo (`ssss-school`).
  - Fase 2: Enlace C-V con palabra previa (*go to school* $\rightarrow$ `[ɡəʊ tə ˈskuːl]`).

### RF-TRN-07: Preservador de Grupos Consonánticos Finales (Codas en /-pt, -kt, -st, -ld/)
- **Descripción:** Módulo de discriminación y producción enfocado en no suprimir las consonantes oclusivas finales que marcan el pasado regular *-ed* (*walked* `/wɔːkt/` vs. *walk*, *passed* `/pɑːst/` vs. *pass*, *kept* vs. *kep*).

### RF-TRN-08: Silenciador Visual de Letras Mudas (Silent Letters Muter)
- **Descripción:** Visualizador ortográfico interactivo que atenúa visualmente (color gris claro o tachado sutil) las letras mudas en palabras de alta frecuencia:
  - *K muda:* *know, knife, knee, knight, knock*.
  - *W muda:* *write, wrong, answer, sword, wrist*.
  - *B muda:* *debt, doubt, subtle, comb, thumb, climb*.
  - *L muda:* *walk, talk, half, calm, salmon, could, would*.
  - *T muda:* *listen, castle, fasten, whistle, Christmas*.
  - *G/GH muda:* *sign, foreign, night, high, bought, thought*.
  - *P muda:* *psychology, pneumonia, receipt, cupboard*.
  - *H muda:* *hour, honest, honor, ghost, rhythm*.

### RF-TRN-09: Diccionario de Falsos Amigos Graduado por Nivel CEFR (A1 a C1)
- **Descripción:** Base de datos exhaustiva de falsos amigos graduados con tarjetas de *Deep Contrast*:
  - *Nivel A1-A2:* *actually* ($\ne$ actualmente), *realize* ($\ne$ realizar), *sensible* ($\ne$ sensible), *sensitive* ($\ne$ sensitivo), *embarrassed* ($\ne$ embarazada), *library* ($\ne$ librería), *assist* ($\ne$ asistir a evento), *attend* ($\ne$ atender llamada), *large* ($\ne$ largo), *exit* ($\ne$ éxito).
  - *Nivel B1-B2:* *eventually* ($\ne$ eventualmente), *fabric* ($\ne$ fábrica), *pretend* ($\ne$ pretender), *intend* ($\ne$ entender), *argument* ($\ne$ argumento de película), *compromise* ($\ne$ compromiso), *resume* ($\ne$ resumir), *commodity* ($\ne$ comodidad), *sympathetic* ($\ne$ simpático), *preservative* ($\ne$ preservativo), *deception* ($\ne$ decepción).
  - *Nivel C1-C2:* *fastidious* ($\ne$ fastidioso), *notorious* ($\ne$ notorio/positivo), *mundane* ($\ne$ mundano), *complacent* ($\ne$ complaciente), *ingenuous* ($\ne$ ingenioso).

### RF-TRN-10: Matriz de Choque de Colocaciones del Español
- **Descripción:** Módulo de sustitución para neutralizar traducciones mecánicas de verbos soporte:
  - *Be X years old* (no *have X years*).
  - *Make a decision* (no *take a decision*).
  - *Ask a question* (no *make a question*).
  - *Take / sit an exam* (no *make an exam*).
  - *Miss the bus/train* (no *lose the bus*).
  - *Pay attention* (no *lend attention*).
  - *Make a mistake* (no *commit an error* / *do a mistake*).

---

## 7. Módulo de Repetición Espaciada Inteligente FSRS (RF-SRS)

### RF-SRS-01: Implementación del Algoritmo FSRS 4.5 bajo el Modelo DSR
- **Descripción:** El planificador de repasos debe implementar el modelo DSR (Dificultad $D \in [1, 10]$, Estabilidad $S$ en días, Retención $R(t) \in [0, 1]$):
  $$R(t) = \left(1 + \text{factor} \cdot \frac{t}{S}\right)^{-\text{power}}$$
  El intervalo para el siguiente repaso se calcula fijando la retención deseada ($R_{\text{target}} = 0.90$ configurable):
  $$I = S \cdot \frac{R_{\text{target}}^{-1/w} - 1}{F}$$
- **Opciones de Calificación:** 1: Again (olvido), 2: Hard (duda notable), 3: Good (recuperación con esfuerzo óptimo), 4: Easy (inmediata).
- **Fundamento Científico:** Superación del sesgo de facilidad (*ease hell*) de SM-2; ahorro del 30-40% de repasos manteniendo el 90% de retención real.

### RF-SRS-02: Modalidades Variadas de Recuperación Activa (Active Recall)
- **Descripción:** El sistema prohíbe el reconocimiento pasivo con tarjetas de opción múltiple fija. Las tarjetas se presentan en 3 formatos de evocación activa:
  1. *Tarjeta Inversa:* Significado/concepto en español $\rightarrow$ producción activa escrita/hablada en inglés.
  2. *Oración con Hueco (Cloze Deletion):* Oración contextual auténtica con el término o chunk suprimido.
  3. *Evocación Auditiva:* Reproducción de audio nativo $\rightarrow$ transcripción ortográfica o fonética.

### RF-SRS-03: Filtro de Desagrupación Semántica e Intercalado (Interleaving)
- **Descripción:** El programador de la cola diaria baraja las tarjetas para evitar la práctica en bloque (*blocking*). Si dos tarjetas comparten etiqueta gramatical idéntica o riesgo de confusión directa (*sensitive* vs. *sensible*), se impone una distancia mínima de 5 tarjetas no relacionadas entre ellas.
- **Fundamento Científico:** Práctica Intercalada (Rohrer & Taylor, 2007; Bjork & Bjork, 2011).

---

## 8. Módulo de Motor de Proceduralización y Drills de Velocidad (RF-PROC)

### RF-PROC-01: Métrica Formal de Proceduralización en Ganglios Basales
- **Descripción:** El sistema no considera un ítem como "Dominado" únicamente por su intervalo FSRS. Un ítem alcanza el estado formal **`PROCEDURALIZED`** exclusivamente cuando el estudiante responde con éxito en **3 sesiones distintas consecutivas con un Tiempo de Reacción ($RT$) inferior a 1.500 ms ($RT < 1.5$ s)**.
- **Fundamento Científico:** Teoría de Adquisición de Habilidades (Robert DeKeyser, 2007) y Ley de Potencia del Aprendizaje (Newell & Rosenbloom, 1981). A 150 palabras por minuto, la gramática debe procesarse en la memoria procedural de los ganglios basales sin mediación consciente de la corteza prefrontal.

### RF-PROC-02: Cuatro Modalidades de Drills de Velocidad (Speed Drills)
- **Descripción:** Sesiones deportivas intensivas de 60 a 90 segundos con temporizador regresivo de 3.0 a 5.0 s por ítem:
  1. *Modalidad 1: Rapid Clause Shift:* Transformación rápida de cláusulas (Afirmativa $\rightarrow$ Negativa $\rightarrow$ Interrogativa).
  2. *Modalidad 2: Subject Substitution:* Automatización de la 3ra persona singular y auxiliares (*He/She/It*).
  3. *Modalidad 3: Preposition Reflex:* Elección refleja de preposiciones dependientes con límite de 2.0 s.
  4. *Modalidad 4: Auditory Snap:* Discriminación auditiva forzada de pares mínimos a ciegas en 2.0 s.

### RF-PROC-03: Bucle de Micro-Recuperación de Errores (Error Recovery Loop)
- **Descripción:** Ante cualquier fallo o expiración de tiempo en un drill:
  1. Pantalla muestra la respuesta nativa correcta en verde durante 1.0 s (sin romper el flujo motor con textos explicativos largos).
  2. El ítem se reinyecta automáticamente en caliente **3 turnos después ($N+3$)**.
  3. Si acierta en $N+3$, se vuelve a presentar en **$N+7$** con variación de sujeto o contexto.
  4. El error se persiste en `weakness_metrics` para alimentar la cola de práctica focalizada del día siguiente.

---

## 9. Módulo de Taller de Tareas Comunicativas Genuinas (TBLT) (RF-TBLT)

### RF-TBLT-01: Motor de Tareas Genuinas vs. Ejercicios Artificiales
- **Descripción:** El módulo de redacción y producción debe operar bajo el marco de **Task-Based Language Teaching (TBLT)**, garantizando los 4 criterios de Rod Ellis:
  1. *Primacía del Significado:* El objetivo primario es resolver una situación real, no rellenar huecos gramaticales.
  2. *Existencia de Brecha (Gap):* Brecha de información, opinión o razonamiento.
  3. *Autonomía Lingüística:* El usuario debe recurrir a sus propios recursos sin opciones prediseñadas.
  4. *Resultado No Lingüístico:* Conclusión con un entregable tangible (un correo de negociación, una propuesta de solución, un reclamo).

### RF-TBLT-02: Ciclo Instruccional de Tres Fases (Ellis & Skehan)
- **Descripción:** Cada reto de redacción e interacción se organiza en 3 fases:
  1. *Fase 1: Pre-Task:* Activación de esquemas situacionales, clarificación del objetivo pragmático y presentación de 3 o 4 chunks de andamiaje (*lexical priming*) opcionales.
  2. *Fase 2: During-Task:* Redacción autónoma bajo presión comunicativa real simulada (tiempo sugerido para replicar el ritmo profesional).
  3. *Fase 3: Post-Task:* Enfoque en la Forma (*Focus on Form - FonF*), análisis socrático con Gemini, extracción de nuevos giros a FSRS y repetición opcional de la tarea con mayor velocidad.

### RF-TBLT-03: Evaluación Multidimensional de las 4 Competencias Comunicativas
- **Descripción:** La evaluación asistida por IA califica el desempeño en las cuatro dimensiones de Canale, Swain y Bachman (escala 0.0 - 10.0):
  1. *Competencia Lingüística/Gramatical:* Precisión sintáctica, variedad léxica y ortografía.
  2. *Competencia Sociolingüística y Pragmática:* Adecuación al registro formal/informal, distancia social, y uso de *hedging* o fórmulas indirectas de cortesía (*"Could you possibly look into this?"* en vez de órdenes tajantes).
  3. *Competencia Discursiva:* Cohesión textual, uso de conectores lógicos y mantenimiento anafórico mediante pronombres.
  4. *Competencia Estratégica:* Habilidad para recurrir a paráfrasis, circunlocuciones y autorreparaciones cuando falta un término específico.

---

## 10. Módulo de Tutoría Socrática y Micro-Writing con Google Gemini (RF-SOC)

### RF-SOC-01: Protocolo Socrático de Andamiaje en 4 Niveles (ZPD de Vygotsky)
- **Descripción:** En el taller de redacción, la IA no debe entregar una versión corregida pasiva de inmediato. Opera modulando la ayuda de menor a mayor intervención (Lyster & Ranta, 1997):
  - *Nivel 1: Elicitación Socrática Focalizada:* Resalta la ubicación de la discrepancia y formula una pregunta orientadora sin dar la solución.
  - *Nivel 2: Pista Metalingüística y Contraste L1:* Explica la regla general o señala la interferencia típica del español.
  - *Nivel 3: Plantilla con Hueco (Cloze Prompt):* Entrega el esqueleto oracional dejando únicamente el espacio del error.
  - *Nivel 4: Modelado Explícito y Reformulación Nativa:* Si el usuario no logra resolver la brecha en los niveles previos, provee la versión pulida nativa y guarda la regla en FSRS.
- **Fundamento Científico:** Zona de Desarrollo Próximo (Vygotsky). Las pistas elicitadoras activan la reestructuración del interlenguaje; la corrección pasiva crea una simple ilusión de comprensión.

### RF-SOC-02: Modalidad Micro-Writing de Alta Frecuencia (15 a 35 palabras)
- **Descripción:** Consignas de escritura ultracorta enfocadas en producir una o dos oraciones auténticas utilizando un chunk o regla fonética estudiada en el día (evaluable en < 1 segundo por Gemini 3.5 Flash). Permite mantener el hábito de producción activa sin fatiga en días de alta demanda laboral.

### RF-SOC-03: Resaltado Visual de Brechas (Schmidt's Noticing the Gap)
- **Descripción:** La interfaz de corrección visualiza en dos columnas comparativas el texto original y la versión nativa pulida, aplicando un diff semántico con código de color: amarillo para ajustes léxicos/estilísticos y rojo para errores morfosintácticos.

### RF-SOC-04: Protección del Filtro Afectivo (Krashen & Horwitz)
- **Descripción:**
  - Tono constructivo y empático en los prompts del sistema (cero términos punitivos o descalificadores).
  - Validación pragmática previa: felicitación si el mensaje comunicativo fue comprendido antes de proceder al pulido formal.
  - Límite estricto de corrección: la IA prioriza un **máximo de 2 o 3 errores críticos por borrador** para no provocar parálisis por sobrecarga cognitiva.

---

## 11. Módulo de Input Comprensible y Decodificación Auditiva Bottom-Up (RF-INP)

### RF-INP-01: Perfilador Léxico Algorítmico y Umbrales 95/98% (Nation & Laufer)
- **Descripción:** Al cargar cualquier texto externo o historia de la biblioteca, el motor `ReaderEngine` analiza cada token contra el corpus NGSL/AWL y el vocabulario dominado en el perfil del usuario, clasificando el texto en tiempo real:
  - *Verde ($\ge 98\%$):* Cobertura óptima para Lectura Extensiva incidental fluida ($i+1$).
  - *Amarillo ($95 - 97\%$):* Lectura Asistida recomendada (1 palabra desconocida cada 20).
  - *Rojo ($< 95\%$):* Sobrecarga léxica ineficiente.

### RF-INP-02: Simplificación Contextual Inteligente con Gemini
- **Descripción:** Si la cobertura del texto es inferior al 95%, el sistema ofrece un botón de "Simplificar Texto", invocando a Gemini para reescribir el contenido manteniendo la trama y estilo original pero ajustando el vocabulario al umbral de comprensión del 95% del estudiante.

### RF-INP-03: Captura Léxica y Enriquecimiento Instantáneo en 1 Clic
- **Descripción:** Al tocar cualquier palabra o seleccionar una colocación dentro del texto, se despliega una tarjeta emergente con pronunciación IPA, audio nativo y definición sencilla, con un botón *"Añadir a Repaso FSRS"* que inserta el ítem en segundo plano en estado `NEW`.

### RF-INP-04: Protocolo de Decodificación Auditiva Ascendente (Bottom-Up) en Tres Pasos
- **Descripción:** Para reentrenar la percepción auditiva que colapsa ante la velocidad del habla natural (John Field, 2008), el reproductor de historias opera en 3 pasos secuenciales:
  - *Paso 1: Audio Ciego a 1.0x:* Se reproduce el audio nativo con el texto 100% oculto, forzando a la corteza auditiva a segmentar los sonidos sin apoyo visual.
  - *Paso 2: Texto Parcial Tónico:* Se muestra únicamente el esqueleto de las palabras de contenido acentuadas, evidenciando las lagunas acústicas de las formas débiles átonas.
  - *Paso 3: Texto Completo con Conectores Fonéticos:* Se revela el texto íntegro con resaltado sincronizado del audio y anotaciones de enlace, elisión y asimilación.

### RF-INP-05: Acelerador de Ruta Léxica Directa (Coltheart Dual-Route)
- **Descripción:** La lectura sincronizada con audio nativo y resaltado visual palabra por palabra desacostumbra al hispanohablante de la ruta fonológica subléxica lenta (leer letra a letra pronunciando letras mudas) y consolida la ruta ortográfica directa.

---

## 12. Módulo de Diagnóstico Inteligente y Micro-Workouts (RF-DIA)

### RF-DIA-01: Taxonomía Unificada de Errores con Códigos L1
- **Descripción:** Todo error cometido por el usuario en sesiones SRS, drills de velocidad, gimnasio fonético o taller de redacción se cataloga en `user_errors` con taxonomía formal:
  - Dominio: `GRAMMAR`, `LEXICON`, `PHONETICS`, `PRAGMATICS`.
  - Subetiqueta canónica (p. ej. `L1_PRO_DROP`, `L1_TAM_PRES_PERF`, `L1_PREP_DEPEND_ON`, `PHO_VOWEL_COLLAPSE_I_I_COLON`, `PHO_PROTHESIS_SC`, `LEX_FALSE_FRIEND_ACTUALLY`).
  - Severidad: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`.

### RF-DIA-02: Heatmap de Debilidades con Ponderación de Decaimiento Temporal
- **Descripción:** El sistema calcula el score de debilidad de cada concepto aplicando decaimiento exponencial: las fallas reiteradas en los últimos 7 días tienen una ponderación significativamente mayor que las antiguas ya corregidas.
- **Salida:** Panel visual tipo Heatmap con cuadrículas coloreadas en verde (dominado), amarillo (en ajuste) y rojo (falla crónica).

### RF-DIA-03: Generación Automática de "Micro-Workouts" Dirigidos
- **Descripción:** Cuando el score de debilidad de una regla o contraste supera el umbral crítico ($\ge 3$ fallos en 7 días), el sistema genera automáticamente una sesión de práctica correctiva de 5 minutos (*Micro-Workout*) compuesta exclusivamente por 5 ejercicios focalizados en extinguir ese patrón de interlenguaje.

---

## 13. Módulo de Autorregulación (SRL), Hábitos Antifrágiles y Filtro Afectivo (RF-SRL)

### RF-SRL-01: Ciclo de Aprendizaje Autorregulado en Tres Fases (Barry Zimmerman)
- **Descripción:**
  1. *Fase de Previsión (Morning Briefing):* Al iniciar la aplicación, el usuario visualiza sus 3 *Daily Quests* con una estimación matemática precisa del tiempo requerido (p. ej. *"18 minutos para cumplir tus metas de hoy"*).
  2. *Fase de Desempeño (Focus Mode):* Las vistas de estudio y práctica eliminan barras de menú, notificaciones y elementos secundarios, garantizando inmersión cognitiva absoluta.
  3. *Fase de Autorreflexión:* Al finalizar la jornada, se muestra el impacto real de la sesión: reducción de tiempos de reacción ($RT$) y extinción de fallas en el mapa de calor.

### RF-SRL-02: Contador de Racha Antifrágil y Protección "Never Miss Twice"
- **Descripción:**
  - Fallar un día no reinicia la racha si el usuario posee un **Congelador de Racha (*Streak Freeze*)**.
  - Las fichas de congelación se ganan automáticamente al completar 7 días consecutivos de estudio (máximo 2 acumulables).
  - Si no dispone de congeladores, el sistema activa un período de gracia de 24 horas con una misión de recuperación rápida para evitar el efecto de abandono *"What-the-hell"* (Cochran & Tesser).

### RF-SRL-03: Estrangulamiento de Cola Atrasada (Backlog Throttling)
- **Descripción:** Si el usuario pasa varios días inactivo, el motor FSRS no le acumula cientos de tarjetas atrasadas de golpe (el problema de saturación que causa el abandono en Anki). Limita los repasos diarios a un tope manejable (máximo 25-30 tarjetas prioritarias) y redistribuye suavemente el atraso a lo largo de 7 días.

### RF-SRL-04: Orientación hacia el "Yo Ideal en L2" y Gamificación Sobria
- **Descripción:** El sistema destierra las mecánicas de gamificación infantil (gemas, ligas tóxicas, avatares caricaturescos). Adopta una estética "Editorial Tech & Warm Minimalist" donde la motivación emana de la autoeficacia real, la competencia comunicativa profesional y la identidad del estudiante como futuro hablante fluido.

---

## 14. Módulo de Gestión de IA, Pool Multi-API Key y Resiliencia 2D (RF-AIC)

### RF-AIC-01: Panel de Configuración de IA y Modelos Familia Gemini 3.x Flash
- **Descripción:** El usuario puede seleccionar el modelo activo entre la familia 3.x Flash:
  - `gemini-3.5-flash`: Latencia ultrabaja, óptimo para micro-writing y análisis rápidos.
  - `gemini-3.6-flash`: Balance intermedio de velocidad y cobertura semántica.
  - `gemini-3.7-flash`: Profundidad analítica y precisión fonética.
  - `gemini-3.8-flash`: Razonamiento socrático avanzado y evaluación TBLT de 4 competencias.

### RF-AIC-02: Gestión de Pool de Múltiples Claves de API (Multi-Key Pool)
- **Descripción:** El sistema admite el registro ilimitado de claves de API (`GEMINI_API_KEY`) almacenadas de forma cifrada en la base de datos local y visualizadas con enmascaramiento seguro (`AIzaSy...4xK9`).

### RF-AIC-03: Matriz de Resiliencia 2D (Modelo x Clave) y Cascada Automática
- **Descripción:** Basado en las cuotas de Google AI Studio (5 RPM y 20 RPD por modelo/clave, sumando **80 RPD por clave** al combinar los 4 modelos 3.x Flash):
  1. *Cascada Horizontal:* Si una clave agota su cuota por minuto o por día en el modelo $M$, el gateway conmuta automáticamente a la siguiente clave disponible en el pool para el mismo modelo.
  2. *Cascada Vertical:* Si todas las claves agotan el modelo preferido (p. ej. `gemini-3.8-flash`), degrada automáticamente a `gemini-3.7-flash` $\rightarrow$ `gemini-3.6-flash` $\rightarrow$ `gemini-3.5-flash` sin interrumpir la sesión del usuario.

### RF-AIC-04: Reloj de Sincronización Oficial con el Huso Horario del Pacífico (PT)
- **Descripción:** El sistema calcula la medianoche del Pacífico (00:00 PT: UTC-8 / UTC-7 en horario de verano) y reinicia automáticamente a cero los contadores de RPD de todas las claves registradas al comenzar el nuevo día oficial de Google AI Studio.