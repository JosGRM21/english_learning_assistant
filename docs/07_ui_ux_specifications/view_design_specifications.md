# Especificación Detallada de Vistas, Composición Visual y Ergonomía de Pantallas
## English Learning Assistant (ELA) — "Warm Minimalist & Editorial Tech"

Este documento establece las especificaciones exhaustivas de diseño, maquetación, jerarquía visual y micro-interacciones para cada pantalla del sistema, garantizando una estética **minimalista, elegante, sobria y de nivel profesional**.

---

## 1. Principios de Composición Visual y Elegancia Minimalista

Para lograr una interfaz de alta gama (inspirada en la precisión de *Linear*, la serenidad editorial de *iA Writer* y la fluidez de *Apple macOS/iOS*), el diseño de vistas se rige por cinco reglas arquitectónicas de composición:

### 1.1 Reducción de Ruido y Ley de Hicks
- Cada pantalla persigue **un único propósito cognitivo principal**. Toda acción secundaria o terciaria se subordina visualmente mediante menor contraste, menor escala tipográfica o se repliega en menús contextuales sutiles.
- Se eliminan por completo bordes gruesos, sombras negras saturadas, gradientes multicolores estridentes y badges de notificación invasivos.

### 1.2 Espaciado y "Breathing Room" (Ritmo Macro y Micro)
- **Macro-espaciado:** Los contenedores principales utilizan márgenes y paddings generosos (`p-8` a `p-12` en escritorio, `gap-6` a `gap-8` entre módulos), permitiendo que la vista "respire" y evitando la sensación de abarrotamiento de los dashboards tradicionales.
- **Ancho Óptimo de Lectura (Measure):** Ningún bloque de texto de lectura continua o redacción supera los **680px de ancho** (`max-w-2xl` a `max-w-3xl`, equivalente a 65–75 caracteres por línea), respetando las leyes de ergonomía tipográfica para mitigar el agotamiento sacádico del ojo.

### 1.3 Sistema de Capas y Elevación Tonal (Layering)

```
MODO CLARO:
[ Canvas: #FBFBF9 ]
    └── [ Tarjeta Base: #FFFFFF + Sombra Difusa Cálida + Borde Hairline #E5E7EB ]
            └── [ Input / Módulo Interior: #F8F9FA + Borde #D1D5DB ]
                    └── [ Popover / Modal: #FFFFFF + Sombra Elevada ]

MODO OSCURO:
[ Canvas: #0B0D13 ]
    └── [ Tarjeta Base: #131722 + Borde Interior Blanco al 6% (rgba(255,255,255,0.06)) ]
            └── [ Input / Módulo Interior: #1B2030 + Borde Sutil #22283A ]
                    └── [ Popover / Modal: #1E2436 + Borde Superior Resaltado ]
```

### 1.4 Tratamiento de Superficies "Editorial Tech"
- **Líneas Hairline:** Separadores de exactamente `1px` con opacidad calibrada (`border-gray-200/70` en claro, `border-white/5` en oscuro).
- **Vidrio Esmerilado (Glassmorphism Sutil):** Los encabezados flotantes y la barra de navegación utilizan `backdrop-blur-md` combinado con fondos traslúcidos (`bg-white/80` y `dark:bg-[#131722]/80`) para crear una sensación de profundidad arquitectónica continua.
- **Satinado Táctil en Botones:** Botones con micro-relieve inferior de 1px o anillo de brillo interior (`inset 0 1px 0 rgba(255, 255, 255, 0.15)` en botones oscuros/índigo).

---

## 2. El Marco Global de la Aplicación (Application Shell)

El shell envuelve todas las vistas manteniendo un entorno de inmersión y concentración:

```
+----------------------------------------------------------------------------------------------------+
| [Sidebar] | [HEADER FLOTANTE: Módulo Activo  |  🔥 14 Días  |  🛡️ 1 Freeze  |  🌙 Tema  |  ⚙️ Ajustes] |
|           |----------------------------------------------------------------------------------------|
| • Dash    |                                                                                        |
| • SRS     |                                                                                        |
| • Speed   |                                  LIENZO DE CONTENIDO                                   |
| • Fonética|                                                                                        |
| • Reader  |                              (max-w-6xl o max-w-2xl centrado)                          |
| • Write   |                                                                                        |
| • Heatmap |                                                                                        |
| • AI Cfg  |                                                                                        |
|-----------|----------------------------------------------------------------------------------------|
| [Status]  | [BARRA DE ESTADO: 🟢 SQLite Local Activo  |  🤖 Gemini 3.8 Flash (19/20 RPD)  |  Ping: 42ms]  |
+----------------------------------------------------------------------------------------------------+
```

### Especificación de Elementos del Shell:
1. **Sidebar de Navegación Lateral:**
   - **Ancho:** `w-64` (expandido) o `w-18` (colapsado en modo Zen/Estudio).
   - **Fondo:** `bg-[#F4F4F1] dark:bg-[#0E1119] border-r border-gray-200/80 dark:border-white/5`.
   - **Ítems de Menú:**
     - En reposo: `px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-slate-400 hover:bg-gray-200/60 dark:hover:bg-[#1B2030] hover:text-gray-900 dark:hover:text-white transition-colors duration-150 flex items-center gap-3`.
     - Activo: `bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 font-semibold border border-indigo-200/60 dark:border-indigo-800/50 shadow-xs`.
2. **Header Flotante Superior:**
   - Altura: `h-16 px-8 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md bg-[#FBFBF9]/85 dark:bg-[#0B0D13]/85 border-b border-gray-200/60 dark:border-white/5`.
   - **Indicador de Racha (Streak Flame):** Micro-píldora con degradado cálido `from-amber-500/10 to-orange-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 font-mono text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5`.
   - **Streak Freeze Shield:** `bg-indigo-500/10 border border-indigo-500/30 text-indigo-700 dark:text-indigo-300 text-xs font-mono font-medium px-2.5 py-1 rounded-full`.
3. **Barra de Estado Inferior (Status Bar):**
   - Altura: `h-8 px-6 text-xs font-mono text-gray-500 dark:text-[#7C8B9E] bg-[#F4F4F1] dark:bg-[#0E1119] border-t border-gray-200/60 dark:border-white/5 flex items-center justify-between`.
   - Indicador de base de datos con punto verde jade pulsante a 3s (`animate-pulse`).

---

## 3. Especificación Exhaustiva Vista por Vista

---

### Vista 1: Dashboard Principal (El Santuario de Hábitos y Enfoque)

#### Propósito Cognitivo:
Transmitir serenidad, orden mental y claridad absoluta de cuál es el siguiente paso formativo del día sin saturación de métricas accesorias.

#### Composición de Layout:
- **Contenedor:** `max-w-5xl mx-auto py-10 px-6 space-y-8`.
- **Bloque de Bienvenida:**
  - Saludo: `text-2xl font-bold tracking-tight text-gray-900 dark:text-white font-sans`.
  - Subtítulo motivacional: `text-sm text-gray-600 dark:text-slate-400 mt-1`.
  - Barra de Progreso Diario: Píldora horizontal de `h-2 rounded-full bg-gray-200 dark:bg-[#1B2030] overflow-hidden mt-3`. Relleno en degradado Índigo (`bg-indigo-600 dark:bg-indigo-500 transition-all duration-700 ease-out`).
- **Tarjeta de Tareas Diarias (Daily Quests Master Card):**
  - Contenedor: `bg-white dark:bg-[#131722] border border-gray-200/80 dark:border-white/5 rounded-2xl p-6 shadow-subtle-light dark:shadow-dark-border`.
  - Encabezado: `text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-[#7C8B9E] flex items-center justify-between pb-3 border-b border-gray-100 dark:border-white/5`.
  - Filas de Tarea: Altura de `54px`, `px-4 flex items-center justify-between rounded-xl hover:bg-gray-50 dark:hover:bg-[#1B2030]/60 transition-colors cursor-pointer`.
  - Checkmark Táctil: Caja de selección personalizada de `w-5 h-5 rounded-md border-2 border-gray-300 dark:border-slate-600 flex items-center justify-center transition-all`. Al completarse, adquiere relleno `bg-emerald-600 text-white border-emerald-600` con micro-animación de escala (`scale-110 -> scale-100` en 150 ms).
  - Botón de Acción Principal (*One-Click Continue*):
    - `w-full mt-5 py-3.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-medium text-sm transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2 active:scale-[0.99]`.
- **Rejilla Inferior Asimétrica (`grid grid-cols-1 md:grid-cols-2 gap-6`):**
  - **Tarjeta de Alerta de Falla Crónica:**
    - `bg-white dark:bg-[#131722] border border-gray-200/80 dark:border-white/5 border-l-4 border-l-red-500 rounded-2xl p-6`.
    - Etiqueta de advertencia: `text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide flex items-center gap-1.5`.
    - Explicación del fallo: `text-sm font-medium text-gray-800 dark:text-gray-200 mt-2`.
    - Botón de Micro-Workout: `mt-4 inline-flex items-center px-4 py-2 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/40 text-xs font-semibold hover:bg-red-100 transition-colors`.
  - **Tarjeta de Salud de Memoria FSRS:**
    - `bg-white dark:bg-[#131722] border border-gray-200/80 dark:border-white/5 rounded-2xl p-6 flex flex-col justify-between`.
    - Métricas limpias en 3 columnas con tipografía monoespaciada tabular (`text-2xl font-bold font-mono text-gray-900 dark:text-white`).

---

### Vista 2: Reproductor de Repaso Espaciado SRS (Modo Zen de Recuperación Activa)

#### Propósito Cognitivo:
Eliminar el 100% de los elementos distractores. El estudiante está a solas con el estímulo verbal para maximizar el esfuerzo deseable de recuperación activa (*Active Recall*).

#### Composición de Layout:
- **Modo Zen:** Al ingresar al repaso, el sidebar lateral se contrae automáticamente a ancho de 64px o se atenúa al 20% de opacidad.
- **Contenedor Central:** `max-w-2xl mx-auto my-12 px-4`.
- **Meta-Información Superior:**
  - Mazo activo: `text-xs uppercase tracking-wider font-semibold text-gray-400 dark:text-[#7C8B9E]`.
  - Contador de sesión: `font-mono text-xs px-2.5 py-1 rounded-md bg-gray-100 dark:bg-[#1B2030] text-gray-700 dark:text-gray-300`.
- **La Tarjeta FSRS 3D (Spatial Flip Card):**
  - Dimensiones: `min-h-[440px] w-full`.
  - Aspecto: `bg-white dark:bg-[#131722] border border-gray-200/80 dark:border-white/7 rounded-3xl p-10 shadow-lg dark:shadow-2xl flex flex-col justify-between relative overflow-hidden`.
  - **Anverso (Pregunta / Hueco Cloze):**
    - Indicador de tarea: `text-xs uppercase tracking-widest text-indigo-600 dark:text-indigo-400 font-bold mb-4`.
    - Oración de contexto: `text-xl font-medium text-gray-900 dark:text-white leading-relaxed text-center my-auto`.
    - Espacio Cloze: `inline-block min-w-[140px] px-3 py-0.5 border-b-2 border-indigo-500 font-mono text-indigo-600 dark:text-indigo-400 font-bold text-center bg-indigo-50/50 dark:bg-indigo-950/30 rounded-t-sm`.
    - Pista socrática: `text-xs text-gray-500 dark:text-[#7C8B9E] italic text-center mt-3`.
    - Botón de Volteo: `mx-auto mt-6 px-5 py-2.5 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-[#1B2030] dark:hover:bg-[#23293D] text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2 cursor-pointer transition-all`.
  - **Reverso (Respuesta, Fonética y Calificación):**
    - Término revelado: `text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight text-center`.
    - Transcripción IPA: `font-ipa text-xl text-indigo-700 dark:text-indigo-300 font-normal tracking-wider text-center mt-2`.
    - Controles de Audio: Botón circular de reproducción nativa (`w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform`) y botón de velocidad reducida (`0.75x`).
    - Colocación y notas: `text-sm text-gray-600 dark:text-slate-300 border-t border-gray-100 dark:border-white/5 pt-4 mt-6 text-center leading-relaxed`.
- **Barra de Calificación FSRS con Atajos Físicos:**
  - Distribución: `grid grid-cols-4 gap-3 mt-6`.
  - Cada botón incluye:
    - Tecla `kbd`: `<kbd class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 font-bold">1</kbd>`
    - Nombre del Grado: `Again`, `Hard`, `Good`, `Easy`.
    - Próximo Intervalo: `+10m`, `+2d`, `+6d`, `+14d` (en tipografía monoespaciada pequeña).
  - Micro-Interacción: Al pulsar del 1 al 4, el botón genera un pulso de escala y la tarjeta se desliza lateralmente en 200 ms hacia la izquierda para dar paso a la siguiente.

---

### Vista 3: Laboratorio de Habla Conectada (Connected Speech Lab)

#### Propósito Cognitivo:
Transformar la fonología acústica invisible en una representación gráfica arquitectónica, donde los enlaces y elisiones sean intuitivos y desmitificados.

#### Composición de Layout:
- **Contenedor:** `max-w-4xl mx-auto my-10 px-6 space-y-6`.
- **Selector de Frase:** Dropdown estilizado con selector de dificultad (A2 a C1) y filtro por fenómeno.
- **Lienzo de Análisis Fonético (The Phonetic Canvas):**
  - Contenedor: `bg-[#F8F9FA] dark:bg-[#0E1119] rounded-2xl p-8 border border-gray-200/80 dark:border-white/5 shadow-inner relative`.
  - Frase Desglosada: `text-2xl font-bold tracking-tight text-gray-900 dark:text-white text-center mb-4`.
  - Arcos de Unión SVG: Curvas Bezier fluidas con animación de trazo progresivo (`stroke-dasharray` / `stroke-dashoffset`).
  - Chips de Fenómenos Interactivos:
    - Al hacer hover sobre el chip de *Linking* (Azul), las dos palabras enlazadas se iluminan con un halo azul suave (`ring-2 ring-blue-500/30`).
    - Al pulsar sobre el chip de *Schwa* (Verde), se reproduce exclusivamente el fragmento de audio correspondiente a la vocal reducida en aislamiento.
- **Transcripción IPA Conectada:**
  - `font-ipa text-2xl text-center font-normal text-indigo-900 dark:text-indigo-200 tracking-widest py-4 bg-indigo-50/40 dark:bg-indigo-950/20 rounded-xl border border-indigo-100 dark:border-indigo-900/30 my-4`.
- **Controles de Audio Duales:**
  - Reproductor a velocidad normal `1.0x` y reproductor ultra-lento `0.75x` con algoritmo de estiramiento temporal (*pitch-preserved time-stretching*) que mantiene el tono natural de la voz.
- **Tarjeta de Reglas Pedagógicas:**
  - Acordeón colapsable con explicaciones breves, concisas y sin tecnicismos lingüísticos intimidantes.

---

### Vista 4: Taller de Redacción Guiada con Gemini (Editor Editorial y Rúbricas CEFR)

#### Propósito Cognitivo:
Proporcionar un espacio de escritura inmersivo como el de un procesador de textos de alta gama (*Notion / iA Writer*), combinado con corrección formativa no invasiva.

#### Composición de Layout:
- **Contenedor:** `max-w-4xl mx-auto my-10 px-6`.
- **Caja de Estímulo / Prompt:**
  - `p-5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/40 mb-6`.
  - Título: `text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300`.
  - Instrucción de redacción: `text-base font-medium text-gray-800 dark:text-gray-200 mt-1`.
- **Área de Escritura (Distraction-Free Textarea):**
  - Contenedor con borde activo: `bg-[#FBFBF9] dark:bg-[#0E1119] border-2 border-gray-200 dark:border-white/10 focus-within:border-indigo-500 rounded-2xl p-6 transition-all shadow-sm`.
  - Textarea: `w-full min-h-[220px] bg-transparent text-gray-900 dark:text-white font-sans text-base leading-relaxed focus:outline-none resize-none`.
  - Barra de Herramientas Inferior: Contador de palabras en tiempo real (`font-mono text-xs text-gray-500 dark:text-[#7C8B9E]`), selector de modelo Gemini (`gemini-3.8-flash`) y botón primario con atajo `Ctrl+Enter`.
- **Panel de Resultados y Rúbricas CEFR:**
  - Al pulsar evaluar, se despliega con animación fluida de altura (`transition-all duration-300`).
  - Tarjeta de Puntuaciones: Cuatro métricas circulares o de barra (*Grammar*, *Vocabulary*, *Coherence*, *Estimated CEFR Level*).
  - Texto con Anotaciones Semánticas Interactivas:
    - Las palabras con error se subrayan suavemente en ondas rojas o ámbar.
    - Al hacer clic sobre cualquier corrección, un popover limpio muestra la explicación, el por qué de la regla y la opción de *"Añadir a mi cola de repaso FSRS"*.

---

### Vista 5: Panel de Configuración de IA y Orquestador de Claves (Mission Control)

#### Propósito Cognitivo:
Transmitir confianza técnica absoluta, transparencia de costos y cuotas, y control total sobre los modelos y claves de API.

#### Composición de Layout:
- **Contenedor:** `max-w-3xl mx-auto my-10 px-6 space-y-8`.
- **Selector de Familia de Modelos (Gemini 3.x Flash Cards):**
  - Rejilla de 4 tarjetas seleccionables (`grid grid-cols-2 gap-4`).
  - Cada tarjeta: `p-4 rounded-xl border-2 cursor-pointer transition-all`.
    - Activa: `border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/40 shadow-sm`.
    - Inactiva: `border-gray-200 dark:border-white/5 bg-white dark:bg-[#131722] hover:border-gray-300`.
  - Insignia de latencia: `font-mono text-[11px] px-2 py-0.5 rounded bg-gray-100 dark:bg-[#1B2030] text-gray-600 dark:text-slate-300`.
- **Gestor del Pool de Claves API:**
  - Lista de tarjetas de clave con alias identificador, clave enmascarada (`AIzaSyD8...74vQ`), botón de verificación de conexión en vivo y botón para establecer como primaria.
  - Indicador de estado: Píldora verde esmeralda `🟢 Válida (Cuota OK)` o roja `🔴 429 Cuota Excedida`.
- **Matriz 2D de Consumo de Cuotas en Vivo:**
  - Tabla de diseño limpio con cabeceras monoespaciadas, mostrando el consumo diario (`X / 20 RPD`) para cada clave y modelo, con barra de progreso interior sutil y contador hacia el reseteo de medianoche del Pacífico (PT).

---

### Vista 6: Modal de Ingesta Rápida y Auto-Enriquecimiento (Quick Capture)

#### Propósito Cognitivo:
Permitir capturar cualquier término o colocación desconocida en menos de 3 segundos, dejando que Gemini rellene automáticamente la fonética, ejemplos y familia léxica.

#### Composición de Layout:
- **Capa Superpuesta (Backdrop):** `fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4`.
- **Cuerpo del Modal:** `w-full max-w-xl bg-white dark:bg-[#131722] border border-gray-200/80 dark:border-white/10 rounded-3xl p-8 shadow-2xl overflow-hidden`.
- **Campo de Entrada Principal:**
  - Input: `text-xl font-semibold tracking-tight text-gray-900 dark:text-white bg-transparent border-b-2 border-indigo-500 focus:outline-none w-full py-2 placeholder-gray-400`.
- **Área de Previsualización Inteligente (AI Preview Box):**
  - Fondo: `bg-[#F8F9FA] dark:bg-[#0E1119] rounded-2xl p-5 border border-gray-200/60 dark:border-white/5 mt-5 space-y-3`.
  - Muestra en tiempo real la transcripción IPA generada, categoría gramatical, traducción contextual y dos oraciones de ejemplo de alta frecuencia.
- **Acciones Inferiores:**
  - Botón Cancelar (Escape) y Botón Primario *"Guardar y Crear Tarjeta FSRS"* con icono de check táctil.

---

### Vista 7: Gimnasio de Pares Mínimos y Discriminación Acústica (El Calibrador Perceptual)

#### Propósito Cognitivo:
Desacoplar el sistema auditivo del estudiante del filtro fonológico de la lengua materna, forzando la creación de nuevas categorías perceptivas mediante decisiones binarias rápidas bajo presión temporal.

#### Composición de Layout:
- **Contenedor:** `max-w-3xl mx-auto my-10 px-6 space-y-6`.
- **Panel de Estímulo Auditivo:**
  - Gran contenedor táctil central (`bg-indigo-50/60 dark:bg-indigo-950/30 rounded-2xl p-8 border-2 border-dashed border-indigo-200 dark:border-indigo-800/60 text-center relative`):
    - Icono de altavoz de alta fidelidad con micro-animación pulsante al emitir audio.
    - Indicador visual de onda sonora sintetizada o clip nativo.
    - Atajos de teclado en pantalla: `<kbd>Espacio</kbd>` o `<kbd>R</kbd>` para reproducir.
- **Selector de Contraste Fonológico:**
  - Rejilla dual de opciones (`grid grid-cols-2 gap-5 mt-6`):
    - Opción 1 y Opción 2 con fuentes IPA destacadas (`Charis SIL`, 24px) y botones táctiles con atajos `<kbd>1</kbd>` y `<kbd>2</kbd>`.
    - Feedback visual inmediato: borde y fondo esmeralda al acertar, rojo al fallar.
- **Barra de Tiempo de Discriminación:**
  - Barra superior de 2.0s con degradado verde-ámbar-rojo que genera urgencia cognitiva antes de desactivar la selección.
- **Consola de Feedback Contrastivo:**
  - Muestra la explicación articulatoria (p. ej. vocal tensa vs. laxa, posición lingual) y botones de reproducción comparativa secuencial.

---

### Vista 8: Gimnasio de Drills de Velocidad (La Arena de Reflejos Cognitivos)

#### Propósito Cognitivo:
Desarrollar automaticidad lingüística en la memoria procedimental bajo presión temporal benigna.

#### Composición de Layout:
- **Contenedor Centrado de Máximo Enfoque:** `max-w-2xl mx-auto my-16 px-6 text-center`.
- **Barra de Tiempo Reactiva Superior:**
  - Píldora de `h-3 rounded-full bg-gray-200 dark:bg-[#1B2030] overflow-hidden mb-8 shadow-inner`.
  - La barra se vacía de derecha a izquierda en 3.0 segundos exactos.
  - **Color Dinámico:**
    - De 3.0s a 1.5s: Esmeralda (`bg-emerald-500`).
    - De 1.5s a 0.8s: Ámbar (`bg-amber-500`).
    - De 0.8s a 0.0s: Rojo coral (`bg-red-500 animate-pulse`).
- **Oración Estímulo:**
  - `text-2xl font-bold text-gray-900 dark:text-white leading-relaxed my-10 font-sans`.
- **Matriz de Opciones 2x2:**
  - `grid grid-cols-2 gap-4 my-8`.
  - Tarjetas de opción grandes con reborde grueso: `p-5 rounded-2xl border-2 border-gray-200 dark:border-white/10 hover:border-indigo-500 bg-white dark:bg-[#131722] text-xl font-bold font-mono cursor-pointer active:scale-95 transition-all flex items-center justify-between`.
  - Tecla numérica en relieve táctil en la esquina de cada tarjeta (`[ 1 ]`, `[ 2 ]`, `[ 3 ]`, `[ 4 ]`).
- **Feedback Instantáneo:** Al pulsar la tecla, el borde de la opción elegida parpadea instantáneamente en verde o rojo durante 180 ms antes de avanzar sin pausa al siguiente ítem.

---

### Vista 9: Lector Inteligente de Input Comprensible $i+1$ (Inmersión Editorial)

#### Propósito Cognitivo:
Emular la experiencia placentera de lectura de un libro de pasta dura o un ensayo de *The New Yorker*, integrando asistencia de vocabulario contextual sin fricción.

#### Composición de Layout:
- **Contenedor Editorial Centrado:** `max-w-3xl mx-auto my-12 px-8`.
- **Cabecera del Artículo:**
  - Nivel CEFR: `badge font-mono text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/40`.
  - Título del Artículo: `font-serif text-3xl font-bold tracking-tight text-gray-900 dark:text-white mt-3`.
  - Metadatos: `text-xs font-sans text-gray-500 dark:text-[#7C8B9E] mt-2 mb-8 pb-4 border-b border-gray-200/60 dark:border-white/5`.
- **Cuerpo Tipográfico (Editorial Serif):**
  - `font-serif text-[18px] leading-[1.8] text-gray-800 dark:text-gray-200 tracking-normal selection:bg-indigo-100 dark:selection:bg-indigo-900/60`.
  - **Términos en Repaso SRS:** Subrayado sutil índigo (`decoration-indigo-500/70 underline decoration-1 underline-offset-4 font-medium`).
  - **Términos Nuevos $i+1$:** Fondo cálido translúcido (`bg-amber-100/50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 px-1 py-0.5 rounded cursor-pointer hover:bg-amber-200/60 transition-colors`).
- **Tarjeta Pop-over de Consulta en 1 Clic:**
  - Al hacer clic o selección de texto, emerge un popover flotante con definición concisa en inglés, traducción en español, botón de audio fonético y botón *"Añadir a FSRS con enriquecimiento IA"*.

---

### Vista 10: Taller Socrático de Redacción y Segundo Borrador (Zona de Desarrollo Próximo)

#### Propósito Cognitivo:
Guiar al estudiante mediante preguntas mayéuticas para que descubra y corrija sus propios errores por inducción cognitiva, antes de darle la solución pasiva.

#### Composición de Layout:
- **Contenedor:** `max-w-4xl mx-auto my-10 px-6 space-y-6`.
- **Comparador de Borradores en Doble Columna (`grid grid-cols-1 md:grid-cols-2 gap-6`):**
  - **Columna 1: Tu Primer Borrador (Solo Lectura):**
    - `p-5 rounded-2xl bg-[#F8F9FA] dark:bg-[#0E1119] border border-gray-200/70 dark:border-white/5 text-gray-600 dark:text-slate-400 text-sm leading-relaxed`.
    - Fragmentos erróneos resaltados con fondo suave ámbar.
  - **Columna 2: Tu Segundo Borrador (Editor Activo):**
    - `p-5 rounded-2xl bg-white dark:bg-[#131722] border-2 border-indigo-500/70 text-gray-900 dark:text-white text-sm leading-relaxed shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/30`.
- **Panel de Pistas Socráticas (Socratic Clues Cards):**
  - Lista de preguntas reflexivas formuladas por Gemini:
    - `p-4 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 text-xs text-amber-900 dark:text-amber-200 leading-relaxed space-y-1.5`.
    - No entrega la corrección; desafía la hipótesis lingüística del estudiante.
- **Acciones Inferiores:**
  - Botón primario: *"Re-evaluar Segundo Borrador"* y botón secundario discreto: *"Rendirme y ver solución final"*.

---

## 4. Estados Vacíos (Empty States), Cargas y Notificaciones Transitorias

### 4.1 Estados Vacíos Minimalistas
Cuando una lista, mazo o historial no contiene elementos:
- **No se usan ilustraciones infantiles coloridas.**
- Se emplea un icono de trazo lineal minimalista (`stroke-width: 1.5`, color neutro apagado `#9CA3AF`).
- Título conciso en `text-base font-semibold text-gray-800 dark:text-gray-200`.
- Subtítulo explicativo en `text-xs text-gray-500 dark:text-[#7C8B9E] max-w-sm mx-auto`.
- Un único botón de acción principal limpio.

### 4.2 Estados de Carga (Skeletons Shimmer)
- Durante las llamadas a la API de Gemini o la carga de textos en el Lector, se proyectan bloques de estructura ósea (*Skeleton screens*) con animación de gradiente suave:
  `bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-[#1B2030] dark:via-[#23293D] dark:to-[#1B2030] bg-[length:200%_100%] animate-shimmer rounded-xl`.
- Cero saltos de diseño acumulativos (**CLS < 0.01**).

### 4.3 Notificaciones Táctiles (Toasts)
- Los avisos de confirmación (ej. *"Tarjeta añadida a FSRS"*, *"Streak Freeze activado"*) aparecen en la esquina inferior derecha con:
  - `bg-gray-900/95 dark:bg-[#1B2030]/95 text-white backdrop-blur-md px-4 py-3 rounded-xl shadow-xl border border-white/10 text-xs font-medium flex items-center gap-3 transition-all duration-300`.
  - Desaparición automática tras 3.5 segundos con desvanecimiento suave de opacidad.
