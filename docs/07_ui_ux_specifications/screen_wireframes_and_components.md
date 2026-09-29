# Wireframes y Especificaciones de Componentes de Interfaz
## English Learning Assistant (ELA) — "Warm Minimalist & Editorial Tech"

Este documento detalla los **Wireframes Esquemáticos** y la especificación técnica de componentes visuales, tokens de diseño y clases utilitarias de Tailwind CSS para cada una de las 10 pantallas del sistema.

> [!TIP]
> - Para consultar la filosofía visual, composición espacial, ritmo de espaciado y micro-animaciones detalladas de cada vista, consulta [`view_design_specifications.md`](./view_design_specifications.md).
> - Para consultar la tabla completa de tokens de color, contrastes WCAG 2.1 AAA y escalas tipográficas, consulta [`design_system_and_style_guide.md`](./design_system_and_style_guide.md).

---

## 1. Pantalla 1: Dashboard Principal (Panel de Hábitos y Tareas)

```
+-----------------------------------------------------------------------------+
| ELA Assistant      🔥 Racha: 14 días  |  🛡️ 1 Freeze  |  [🌙 Modo Oscuro] [⚙️]|
+-----------------------------------------------------------------------------+
|                                                                             |
|  👋 ¡Hola, Carlos! Tu meta diaria está al 66% completada.                   |
|                                                                             |
|  +-----------------------------------------------------------------------+  |
|  | 📋 TAREAS DEL DÍA (DAILY QUESTS) - Lunes, 28 Sep                      |  |
|  |-----------------------------------------------------------------------|  |
|  | [X] 🗂️ Repasar 15 tarjetas SRS de vocabulario           (15/15)  ✅ Hecho|  |
|  | [X] 🎧 Escuchar 1 regla de Habla Conectada (Elisión /t/) (1/1)   ✅ Hecho|  |
|  | [ ] ✍️ Redactar un micro-texto y evaluarlo con Gemini    (0/1)   ⏳ Pend.|  |
|  |                                                                       |  |
|  | [ > CONTINUAR CON: REDACCIÓN GUIADA (10 min) ]                        |  |
|  +-----------------------------------------------------------------------+  |
|                                                                             |
|  +-----------------------------------+ +---------------------------------+  |
|  | ⚠️ ALERTA DE DEBILIDAD FRECUENTE  | | 📈 ESTADO DE TU MEMORIA (FSRS)  |  |
|  |-----------------------------------| |---------------------------------|  |
|  | Detectamos 3 fallos recientes en: | | • Tarjetas dominadas: 420       |  |
|  | 🔴 Preposición: "depend on"       | | • Retención global: 91.4%       |  |
|  |                                   | | • Repasos para mañana: 18       |  |
|  | [ RESOLVER MICRO-WORKOUT (5 min) ]| | [ Ver analítica completa ]      |  |
|  +-----------------------------------+ +---------------------------------+  |
|                                                                             |
+-----------------------------------------------------------------------------+
```

### Especificación de Tokens y Clases Tailwind:
- **Lienzo Principal:** `bg-[#FBFBF9] dark:bg-[#0B0D13] min-h-screen text-gray-900 dark:text-gray-50 font-sans`
- **Header Global:** `sticky top-0 z-30 bg-white/80 dark:bg-[#131722]/80 backdrop-blur-md border-b border-gray-200 dark:border-[#1F2637] px-6 py-3.5 flex justify-between items-center`
  - **Píldora de Racha:** `inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-300 text-xs font-semibold`
  - **Píldora de Streak Freeze:** `inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/50 text-indigo-700 dark:text-indigo-300 text-xs font-medium`
  - **Conmutador de Tema:** `p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-[#1B2030] dark:text-slate-400 transition-colors`
- **Tarjeta Daily Quests:** `bg-white dark:bg-[#131722] border border-gray-200 dark:border-[#1F2637] rounded-xl p-6 shadow-subtle-light dark:shadow-dark-border`
  - **Filas de Tarea:** `flex items-center justify-between py-3 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-[#1B2030]/60 transition-colors`
  - **Badge Hecho:** `bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 px-2 py-0.5 rounded-md text-xs font-medium`
  - **Badge Pendiente:** `bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40 px-2 py-0.5 rounded-md text-xs font-medium`
  - **Botón de Acción Inmediata (CTA):** `w-full mt-4 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-medium text-sm transition-colors flex items-center justify-center gap-2 shadow-xs focus-visible:ring-2 focus-visible:ring-indigo-500`
- **Rejilla Inferior (`grid grid-cols-1 md:grid-cols-2 gap-6`):**
  - **Alerta de Debilidad Crítica:** `border-l-4 border-l-red-500 bg-white dark:bg-[#131722] rounded-xl p-5 border border-gray-200 dark:border-[#1F2637]`
    - **Botón Micro-Workout:** `px-3.5 py-2 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 text-xs font-semibold transition-colors`
  - **Panel FSRS:** `bg-white dark:bg-[#131722] rounded-xl p-5 border border-gray-200 dark:border-[#1F2637] text-sm text-gray-600 dark:text-slate-400`

---

## 2. Pantalla 2: Reproductor de Repaso Espaciado (SRS Flashcard Player)

### Anverso (Prompt de Recuperación Activa):
```
+-----------------------------------------------------------------------------+
| Mazo: Colocaciones & Phrasal Verbs                        Tarjeta 4 de 15   |
+-----------------------------------------------------------------------------+
|                                                                             |
|                                                                             |
|          "Completa la oración con la colocación natural correcta:"           |
|                                                                             |
|          You must ______ into account all the possible risks                |
|          before signing the contract.                                       |
|                                                                             |
|          (Pista: Significa considerar o tener en cuenta algo)               |
|                                                                             |
|                                                                             |
|                     [ PRESIONA ESPACIO PARA REVELAR ]                       |
|                                                                             |
+-----------------------------------------------------------------------------+
```

### Reverso (Respuesta, Fonética y Calificación FSRS):
```
+-----------------------------------------------------------------------------+
| Mazo: Colocaciones & Phrasal Verbs                        Tarjeta 4 de 15   |
+-----------------------------------------------------------------------------+
|                                                                             |
|          Respuesta: TAKE INTO ACCOUNT                                       |
|                                                                             |
|          IPA: /teɪk ˈɪntuː əˈkaʊnt/                                         |
|          [ 🔊 Reproducir Audio (Tecla R) ]  [ 🐢 Lento 0.75x ]              |
|                                                                             |
|          Categoría: Unidad Fraseológica (Colocación Verbo + Prep)           |
|          Traducción: "Tomar en cuenta / considerar"                         |
|                                                                             |
|          Ejemplo adicional:                                                 |
|          "We need to take into account the budget limits."                  |
|                                                                             |
|-----------------------------------------------------------------------------|
|  ¿Qué tan fácil fue recordarlo? (Usa las teclas 1, 2, 3 o 4)                |
|                                                                             |
|  [ 1: Again ]       [ 2: Hard ]         [ 3: Good ]        [ 4: Easy ]      |
|  (Olvido / 10m)     (Difícil / 2d)      (Normal / 6d)      (Fácil / 14d)    |
+-----------------------------------------------------------------------------+
```

### Especificación de Tokens y Clases Tailwind:
- **Contenedor de Repaso:** `max-w-2xl mx-auto my-8 px-4`
- **Tarjeta 3D Flip (Contenedor Espacial):** `w-full min-h-[420px] bg-white dark:bg-[#131722] border border-gray-200 dark:border-[#1F2637] rounded-2xl p-8 shadow-card-light dark:shadow-dark-border flex flex-col justify-between transition-transform duration-260 ease-tactile`
- **Oración Prompt (Anverso):** `text-lg font-medium text-gray-900 dark:text-white leading-relaxed text-center my-auto`
  - **Hueco Cloze:** `inline-block px-3 py-0.5 border-b-2 border-indigo-500 font-mono text-indigo-600 dark:text-indigo-400 min-w-[120px] text-center font-semibold`
  - **Píldora Revelar:** `mt-6 mx-auto px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-[#1B2030] dark:hover:bg-[#23293D] text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2 cursor-pointer transition-colors`
- **Reverso Fonético y Semántico:**
  - **Término Revelado:** `text-2xl font-bold tracking-tight text-gray-900 dark:text-white`
  - **Transcripción IPA:** `font-ipa text-xl text-indigo-700 dark:text-indigo-300 font-medium tracking-wide mt-2`
  - **Botones de Audio:** `flex gap-2 mt-3 items-center` con badges `kbd`
- **Barra de Calificación FSRS:** `grid grid-cols-4 gap-3 mt-6 border-t border-gray-100 dark:border-[#1F2637] pt-5`
  - **1: Again:** `bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 p-3 rounded-xl text-center transition-colors`
  - **2: Hard:** `bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-300 p-3 rounded-xl text-center transition-colors`
  - **3: Good:** `bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300 p-3 rounded-xl text-center transition-colors`
  - **4: Easy:** `bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/40 dark:hover:bg-sky-900/60 border border-sky-200 dark:border-sky-900/50 text-sky-700 dark:text-sky-300 p-3 rounded-xl text-center transition-colors`

---

## 3. Pantalla 3: Laboratorio de Habla Conectada (Connected Speech Lab)

```
+-----------------------------------------------------------------------------+
| Laboratorio de Habla Conectada                  [ Selector de Frase: ▼ ]    |
+-----------------------------------------------------------------------------+
|                                                                             |
|  Frase de Práctica: "Hold on for a second and meet you there"               |
|                                                                             |
|  DESGLOSE FONÉTICO EN TIEMPO REAL:                                          |
|                                                                             |
|      Hold     on        for   a      second     and     meet    you         |
|        \_____/            \___/         \         /        \___/            |
|       🔵 Linking        🟢 Weak          🔴 Elisión    🟡 Asimilación       |
|      (Catenación)       (Schwa)          (Omisión /d/)   (Coalescente)      |
|                                                                             |
|  IPA Conectado:  [ həʊl-dɒn   fər-ə   ˈsekən-ən   ˈmiːtʃuː  ðeə ]           |
|                                                                             |
|  [ ▶️ Escuchar Normal (1.0x) ]   [ 🐢 Escuchar Lento (0.75x) ]               |
|                                                                             |
|  +-----------------------------------------------------------------------+  |
|  | ℹ️ EXPLICACIÓN DE REGLAS ACTIVAS EN ESTA FRASE:                        |  |
|  | • 🔵 Linking C-V: La 'd' de 'Hold' salta a la 'o' de 'on' [həʊl-dɒn].  |  |
|  | • 🟢 Weak Form: 'for a' se reduce al sonido neutro Schwa [fər-ə].      |  |
|  | • 🔴 Elisión: La 'd' de 'and' desaparece ante consonante [ən].        |  |
|  | • 🟡 Yod-Coalescence: /t/ + /j/ en 'meet you' se fusionan en [tʃ].    |  |
|  +-----------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------+
```

### Especificación de Tokens y Clases Tailwind:
- **Contenedor Principal:** `max-w-4xl mx-auto my-8 bg-white dark:bg-[#131722] border border-gray-200 dark:border-[#1F2637] rounded-2xl p-6 shadow-card-light dark:shadow-dark-border`
- **Lienzo Fonético Interactivo:** `bg-[#F8F9FA] dark:bg-[#0E1119] rounded-xl p-6 my-4 border border-gray-100 dark:border-[#1B2030]`
- **Arcos Conectores SVG:** `stroke-indigo-500 dark:stroke-indigo-400 stroke-2 fill-none stroke-linecap-round`
- **Badges de Fenómenos:**
  - **Linking C-V:** `bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 text-xs px-2.5 py-1 rounded-md font-medium`
  - **Weak Form (Schwa):** `bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-xs px-2.5 py-1 rounded-md font-medium`
  - **Elisión:** `bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 text-xs px-2.5 py-1 rounded-md font-medium line-through`
  - **Asimilación:** `bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800 text-xs px-2.5 py-1 rounded-md font-medium`
- **Transcripción IPA Conectada:** `font-ipa text-xl text-center font-medium text-gray-800 dark:text-gray-200 py-3 tracking-wider`
- **Caja de Reglas Gramaticales:** `bg-gray-50 dark:bg-[#1B2030] rounded-xl p-4 border border-gray-200 dark:border-[#2E3851] text-xs text-gray-700 dark:text-slate-300 leading-relaxed space-y-1.5`

---

## 4. Pantalla 4: Taller de Redacción con Evaluación Gemini

```
+-----------------------------------------------------------------------------+
| Taller de Redacción                                 Nivel Objetivo: B1-B2   |
+-----------------------------------------------------------------------------+
| Prompt: Describe an important decision you made recently.                   |
|                                                                             |
| +-------------------------------------------------------------------------+ |
| | It depends of the situation, but I made the decision to change my job.  | |
| | Actually I am working in a software company and I am agree with the team| |
| +-------------------------------------------------------------------------+ |
| Palabras: 34 / Mínimo: 30                                                   |
|                                                                             |
| [ ✨ EVALUAR CON GOOGLE GEMINI ]                                            |
|                                                                             |
|=============================================================================|
| 📊 RESULTADOS DE LA EVALUACIÓN PEDAGÓGICA (GEMINI 3.8 FLASH) [Modelo: ▼ 3.8 Flash]|
| Nivel Estimado: A2+ | Gramática: 6.5/10 | Léxico: 6.0/10 | Coherencia: 7.0/10|
|-----------------------------------------------------------------------------|
| Texto con Retroalimentación Visual:                                         |
| "It [🟡 depends of -> on] the situation, but I made the decision to change  |
| my job. [🔴 Actually -> Currently] I am working in a software company and   |
| [🟡 I am agree -> I agree] with the team."                                  |
|                                                                             |
| [ 🎯 RESOLVER MICRO-RETO ] : ¿Cuál es la preposición correcta para depend?  |
| ( ) depends of    (*) depends on    ( ) depends in                          |
+-----------------------------------------------------------------------------+
```

### Especificación de Tokens y Clases Tailwind:
- **Editor Textarea:** `w-full h-44 p-4 rounded-xl border border-gray-300 dark:border-[#2E3851] bg-[#FBFBF9] dark:bg-[#0E1119] text-gray-900 dark:text-white font-sans text-base leading-relaxed focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none transition-all`
- **Contador de Palabras:** `text-xs font-mono text-gray-500 dark:text-[#7C8B9E] mt-2 flex justify-between`
- **Botón Evaluar:** `px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 text-white font-medium text-sm flex items-center gap-2 shadow-xs transition-colors`
- **Rúbrica CEFR Grid:** `grid grid-cols-4 gap-3 bg-gray-50 dark:bg-[#1B2030] p-4 rounded-xl text-center mb-4 border border-gray-200 dark:border-[#2E3851]`
- **Subrayados Semánticos de Corrección:**
  - **Transferencia L1:** `underline decoration-wavy decoration-red-500 dark:decoration-red-400 decoration-2 font-medium cursor-pointer`
  - **Colocación / Preposición:** `underline decoration-wavy decoration-amber-500 dark:decoration-amber-400 decoration-2 font-medium cursor-pointer`
- **Micro-Reto Dialog:** `mt-4 p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/40 text-xs`

---

## 5. Pantalla 5: Panel de Configuración de IA y Pool de Claves (AI Settings)

```
+-----------------------------------------------------------------------------+
| ELA Assistant > Configuración de Inteligencia Artificial (Google Gemini)    |
+-----------------------------------------------------------------------------+
|                                                                             |
|  🧠 SELECCIÓN DE MODELO POR DEFECTO                                         |
|  Modelo activo: [ gemini-3.8-flash (Recomendado - Máxima precisión)      ▼ ]|
|  • gemini-3.8-flash : Modelo insignia 3.x, ideal para redacción avanzada    |
|  • gemini-3.7-flash : Alta capacidad analítica para detección de Noticing   |
|  • gemini-3.6-flash : Balance óptimo para Micro-Workouts adaptativos        |
|  • gemini-3.5-flash : Máxima velocidad (< 800 ms) para micro-retos rápidos  |
|                                                                             |
|-----------------------------------------------------------------------------|
|  🔄 POLÍTICA DE ROTACIÓN DE CLAVES                                         |
|  (•) Conmutación por Cuota (Failover): Rota a otra clave si se recibe HTTP 429|
|  ( ) Clave Primaria Única: No rotar automáticamente                         |
|  ( ) Round Robin: Distribuir peticiones equitativamente entre claves        |
|                                                                             |
|-----------------------------------------------------------------------------|
|  🔑 POOL DE CLAVES API (GEMINI API KEYS)                     [+ Añadir Clave]|
|                                                                             |
|  +-----------------------------------------------------------------------+  |
|  | (*) PRIMARIA | Alias: "Cuenta Personal AI Studio"                     |  |
|  | Clave: AIzaSyD8...74vQ [Copiar]        Estado: 🟢 Válida (Cuota OK)  |  |
|  | Modelo por defecto asignado: gemini-3.8-flash                         |  |
|  | [ 🔄 Probar Conexión ]                       [ ✏️ Editar ] [ 🗑️ Borrar ]|  |
|  +-----------------------------------------------------------------------+  |
|  | ( ) RESPALDO | Alias: "Cuenta Secundaria Backup"                      |  |
|  | Clave: AIzaSyBc...19zL [Copiar]        Estado: 🟢 Válida (Lista)     |  |
|  | [ 🔄 Probar Conexión ]  [ Hacer Primaria ]   [ ✏️ Editar ] [ 🗑️ Borrar ]|  |
|  +-----------------------------------------------------------------------+  |
|  | ( ) TRABAJO  | Alias: "Cuenta Equipo Trabajo"                         |  |
|  | Clave: AIzaSyK9...22xP [Copiar]        Estado: 🟡 Cuota Excedida (429)|  |
|  | [ 🔄 Probar Conexión ]  [ Hacer Primaria ]   [ ✏️ Editar ] [ 🗑️ Borrar ]|  |
|  +-----------------------------------------------------------------------+  |
|                                                                             |
|  +-----------------------------------------------------------------------+  |
|  | ➕ AÑADIR NUEVA CLAVE AL POOL                                          |  |
|  | Etiqueta: [ Mi nueva cuenta Gemini                  ]                 |  |
|  | Clave API: [ AIzaSy.................................. ] [👁️ Revelar]    |  |
|  | [ ✅ Guardar y Validar Clave ]                                         |  |
|  +-----------------------------------------------------------------------+  |
|                                                                             |
|-----------------------------------------------------------------------------|
|  📊 MATRIZ 2D DE CONSUMO DE CUOTA (5 RPM / 20 RPD POR MODELO)               |
|  (Reinicio diario programado a medianoche PT / 00:00 Pacific Time: en 7h 25m)|
|                                                                             |
|  Clave API                   3.5 Flash   3.6 Flash   3.7 Flash   3.8 Flash  |
|  -------------------------------------------------------------------------  |
|  Cuenta Personal AI Studio     2/20        5/20       12/20       19/20 🟡  |
|  Cuenta Secundaria Backup      0/20        0/20        1/20        4/20     |
|  Cuenta Equipo Trabajo         0/20        0/20        0/20       20/20 🔴  |
|  -------------------------------------------------------------------------  |
|  Capacidad Total en Uso: 63 / 240 RPD Disponibles (3 claves × 80 RPD)       |
+-----------------------------------------------------------------------------+
```

### Especificación de Tokens y Clases Tailwind:
- **Selector de Modelo:** `w-full p-2.5 rounded-xl border border-gray-300 dark:border-[#2E3851] bg-white dark:bg-[#1B2030] text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500`
- **Tarjetas de Claves API:** `border border-gray-200 dark:border-[#1F2637] rounded-xl p-4 bg-gray-50/60 dark:bg-[#161B28] mb-3`
  - **Clave Enmascarada:** `font-mono text-xs text-gray-600 dark:text-slate-300 bg-gray-200/70 dark:bg-[#1B2030] px-2 py-1 rounded-md`
  - **Estado Válida:** `bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-emerald-200 dark:border-emerald-800/40`
  - **Estado Cuota Excedida (429):** `bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-red-200 dark:border-red-800/40`
- **Matriz 2D de Cuotas:** `font-mono text-xs w-full border-collapse` con badges semánticos en celdas críticas.

---

## 6. Pantalla 6: Modal de Ingesta Rápida y Auto-Enriquecimiento (Quick Add Vocab)

```
+-----------------------------------------------------------------------------+
| ➕ Añadir Nuevo Vocabulario / Frase con IA                                [X]|
+-----------------------------------------------------------------------------+
|                                                                             |
|  Ingresa solo la palabra o expresión que deseas aprender:                   |
|  Término: [ take into account                                            ]  |
|  Contexto de ejemplo (Opcional):                                            |
|  [ We must take into account all risks before signing.                   ]  |
|                                                                             |
|  [ 🪄 AUTO-COMPLETAR Y ENRIQUECER CON GEMINI 3.X FLASH (1.1s) ]              |
|                                                                             |
|=============================================================================|
|  📋 VISTA PREVIA GENERADA POR LA IA (REVISAR ANTES DE GUARDAR)              |
|-----------------------------------------------------------------------------|
|  Término: "take into account"                                               |
|  Categoría: [ Unidades Fraseológicas > Colocación ]    Nivel: [ B1 Interm. ]|
|  Falso Amigo: [ No ]   Patrón: Verbo + Preposición + Sustantivo             |
|                                                                             |
|  Transcripción IPA: /teɪk ˈɪntuː əˈkaʊnt/  [ 🔊 Escuchar GA ] [ 🇬🇧 RP ]    |
|  Habla Conectada: Enlace C-V [teɪ-kɪntuː] y reducción Schwa [əˈkaʊnt].      |
|                                                                             |
|  Definición (EN): To consider or remember something when planning/deciding. |
|  Traducción (ES): Tomar en cuenta / tener en consideración.                 |
|                                                                             |
|  Ejemplos Generados:                                                        |
|  1. "You must take into account that she has little sales experience."      |
|     (Debes tener en cuenta que ella tiene poca experiencia en ventas.)      |
|  2. "The architect took the environmental impact into account."             |
|     (El arquitecto tomó en cuenta el impacto ambiental.)                    |
|                                                                             |
|  Familia de palabras: [account] [accountable] [accountability]              |
|                                                                             |
|-----------------------------------------------------------------------------|
|  [ ✏️ Editar campos manualmente ]  [ ✅ GUARDAR Y CREAR TARJETA FSRS (SRS) ] |
+-----------------------------------------------------------------------------+
```

### Especificación de Tokens y Clases Tailwind:
- **Modal Overlay:** `fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50`
- **Modal Container:** `w-full max-w-xl bg-white dark:bg-[#131722] border border-gray-200 dark:border-[#1F2637] rounded-2xl p-6 shadow-modal-light dark:shadow-dark-border max-h-[90vh] overflow-y-auto`
- **AI Preview Box:** `bg-gray-50 dark:bg-[#1B2030] rounded-xl p-5 border border-gray-200 dark:border-[#2E3851] mt-4 space-y-3`
  - **Término e IPA:** `font-ipa text-base text-indigo-700 dark:text-indigo-400 font-semibold`
  - **Badges de Metadatos:** `inline-flex text-xs px-2 py-0.5 rounded-md font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/40`
  - **Ejemplos Bilingües:** `text-xs text-gray-700 dark:text-slate-300 italic border-l-2 border-indigo-400 pl-3`

---

## 7. Pantalla 7: Gimnasio de Pares Mínimos y Discriminación Acústica

```
+-----------------------------------------------------------------------------+
| ELA Assistant > Gimnasio de Pares Mínimos                   [ 🇬🇧 RP | 🇺🇸 GA ]|
+-----------------------------------------------------------------------------+
|                                                                             |
|  Contraste Fonológico: Vocal Larga Tensa vs. Vocal Corta Laxa (/iː/ vs /ɪ/) |
|  Ronda 3 de 10                                     Temporizador: [ 1.4s ⏳ ]|
|                                                                             |
|  +-----------------------------------------------------------------------+  |
|  |                 [ 🔊 REPRODUCIR ESTÍMULO A CIEGAS ]                   |  |
|  |                   (Atajo: Barra Espaciadora o 'R')                    |  |
|  +-----------------------------------------------------------------------+  |
|                                                                             |
|  ¿Qué palabra escuchaste? (Decide antes de que expire el tiempo):           |
|                                                                             |
|  +-----------------------------------+ +---------------------------------+  |
|  |          [ 1 ] sheep              | |          [ 2 ] ship             |  |
|  |            /ʃiːp/                 | |            /ʃɪp/                |  |
|  +-----------------------------------+ +---------------------------------+  |
|                                                                             |
|  FEEDBACK PERCEPTUAL INMEDIATO:                                             |
|  ✅ ¡Exacto! Percibiste correctamente /ʃɪp/ (vocal laxa, tiempo: 0.92s).     |
|                                                                             |
|  • Comparativa Contrastiva:                                                 |
|    - sheep  /ʃiːp/  (labios en sonrisa, lengua alta anterior)  [ ▶️ Audio ] |
|    - ship   /ʃɪp/   (músculos relajados, lengua neutra)       [ ▶️ Audio ] |
|                                                                             |
|  [ ➡️ SIGUIENTE ESTÍMULO (Enter) ]                                          |
+-----------------------------------------------------------------------------+
```

### Especificación de Tokens y Clases Tailwind:
- **Contenedor Principal:** `max-w-3xl mx-auto my-8 bg-white dark:bg-[#131722] border border-gray-200 dark:border-[#1F2637] rounded-2xl p-8 shadow-card-light dark:shadow-dark-border`
- **Área de Estímulo Central:** `w-full py-8 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border-2 border-dashed border-indigo-200 dark:border-indigo-800/60 flex flex-col items-center justify-center gap-2 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100/50 transition-colors cursor-pointer`
- **Botones de Selección Dual (`grid grid-cols-2 gap-4 my-6`):**
  - **Tarjeta de Opción:** `p-6 rounded-xl border-2 border-gray-200 dark:border-[#2E3851] hover:border-indigo-500 dark:hover:border-indigo-400 bg-white dark:bg-[#1B2030] text-center transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500`
  - **Glifo IPA de Opción:** `font-ipa text-xl text-indigo-600 dark:text-indigo-400 font-semibold mt-1`
- **Barra de Presión Temporal:** `h-2 w-full rounded-full bg-emerald-500 transition-all duration-100 ease-linear`
- **Panel de Feedback Contrastivo:** `bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-xl p-5 text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed`

---

## 8. Pantalla 8: Gimnasio de Drills de Velocidad (Speed-Run 60s)

```
+-----------------------------------------------------------------------------+
| ELA Assistant > Speed-Run: Preposiciones Fijas & Chunks     🔥 Racha Activa |
+-----------------------------------------------------------------------------+
|                                                                             |
|  Ítem 4 de 12                                        ⏱️ TIEMPO: [====    ] 2.1s|
|-----------------------------------------------------------------------------|
|                                                                             |
|                                                                             |
|          "She is extremely good ______ solving complex algorithms."         |
|                                                                             |
|                                                                             |
|        [ 1 ] IN            [ 2 ] AT            [ 3 ] ON            [ 4 ] FOR|
|                                                                             |
|                                                                             |
|-----------------------------------------------------------------------------|
|  Presiona la tecla numérica [1, 2, 3 o 4] inmediatamente                    |
|  Aciertos: 3/3 | Latencia media: 1.4s | ⚡ Modo Reflejo Activado            |
+-----------------------------------------------------------------------------+
```

### Especificación de Tokens y Clases Tailwind:
- **Contenedor Minimalista:** `max-w-2xl mx-auto my-12 bg-white dark:bg-[#131722] border border-gray-200 dark:border-[#1F2637] rounded-2xl p-8 text-center shadow-card-light dark:shadow-dark-border`
- **Barra de Progreso Temporal Reactiva:** `w-full h-2.5 bg-gray-200 dark:bg-[#1B2030] rounded-full overflow-hidden mb-6`
  - **Relleno Dinámico:** `h-full rounded-full transition-all duration-100 ease-linear` (Verde `#10B981` $\rightarrow$ Ámbar `#F59E0B` $\rightarrow$ Rojo `#EF4444`)
- **Oración Estímulo:** `text-2xl font-semibold text-gray-900 dark:text-white my-8 tracking-tight`
- **Rejilla de Opciones:** `grid grid-cols-2 gap-4 my-6`
  - **Opción Botón:** `py-4 px-6 rounded-xl border-2 border-gray-200 dark:border-[#2E3851] hover:border-indigo-500 dark:hover:border-indigo-400 bg-gray-50 dark:bg-[#1B2030] font-mono text-lg font-bold text-gray-800 dark:text-white cursor-pointer active:scale-98 transition-all flex items-center justify-between`
- **Métricas de Latencia en Pie:** `font-mono text-xs text-gray-500 dark:text-[#7C8B9E] mt-4`

---

## 9. Pantalla 9: Lector Inteligente de Input Comprensible (Smart Graded Reader)

```
+-----------------------------------------------------------------------------+
| ELA Assistant > Smart Reader (Input Comprensible i+1)       Nivel: B2       |
+-----------------------------------------------------------------------------+
| Artículo: "The Rise of Distributed Software Architecture"       Palabras: 480|
+-----------------------------------------------------------------------------+
|                                                                             |
|  Modern distributed systems rely on asynchronous messaging to decouple     |
|  services. However, engineers must [take into account]* the trade-offs of   |
|  network latency. When a microservice fails, the system must recover        |
|  quickly without causing a cascade breakdown.                               |
|                                                                             |
|  Recent studies show that developers often [unravel] complex bugs by        |
|  analyzing telemetry traces rather than reading static logs...              |
|                                                                             |
|  -------------------------------------------------------------------------  |
|  [ * Subrayado azul: 'take into account' está en tu cola de repaso FSRS ]   |
|                                                                             |
|  +-----------------------------------------------------------------------+  |
|  | 🔍 DETALLE DE PALABRA SELECCIONADA: "unravel"                         |  |
|  | IPA: /ʌnˈræv.əl/  [ 🔊 Escuchar ]          Nivel: B2 Intermedio Alto  |  |
|  | Significado: Desentrañar / aclarar una situación compleja o misterio.    |  |
|  | Contexto: "...developers often unravel complex bugs by analyzing..."    |  |
|  |                                                                       |  |
|  | [ ➕ AÑADIR A MI REPASO FSRS CON ENRIQUECIMIENTO GEMINI (1 Clic) ]      |  |
|  +-----------------------------------------------------------------------+  |
|                                                                             |
|  Progreso de Lectura: [=====================>              ] 62%            |
+-----------------------------------------------------------------------------+
```

### Especificación de Tokens y Clases Tailwind:
- **Cuerpo Editorial de Lectura:** `font-serif text-lg leading-relaxed text-gray-800 dark:text-gray-200 tracking-normal selection:bg-indigo-100 dark:selection:bg-indigo-900/60`
- **Término Activo FSRS en Repaso:** `underline decoration-indigo-500 decoration-2 font-medium text-indigo-900 dark:text-indigo-200 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded px-0.5`
- **Término Desconocido $i+1$:** `bg-amber-100/60 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 px-1 rounded cursor-pointer hover:bg-amber-200/70 transition-colors`
- **Panel Pop-over de Captura Rápida:** `bg-white dark:bg-[#1B2030] border border-gray-200 dark:border-[#2E3851] rounded-xl p-5 shadow-modal-light dark:shadow-dark-border mt-4`
  - **Término e IPA:** `font-ipa text-base text-gray-900 dark:text-white font-semibold`
  - **Botón Captura en 1 Clic:** `px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 text-white font-medium text-xs flex items-center gap-2 shadow-xs transition-colors`

---

## 10. Pantalla 10: Taller Socrático de Redacción (Pistas y Segundo Borrador)

```
+-----------------------------------------------------------------------------+
| Taller Socrático de Redacción                    Borrador 2 de 2 (Modo ZPD) |
+-----------------------------------------------------------------------------+
| Tu texto:                                                                   |
| +-------------------------------------------------------------------------+ |
| | I have 24 years and I am agree that this decision depends of my boss.   | |
| +-------------------------------------------------------------------------+ |
|                                                                             |
| 💡 PISTAS SOCRÁTICAS DE GEMINI (¡INTENTA CORREGIRLO TÚ MISMO!):             |
|                                                                             |
| 1. 🟡 En "[I have 24 years]":                                               |
|    ¿Recuerdas cómo conceptualiza el inglés la edad? ¿Se "tiene" la edad o   |
|    se "es" de esa edad con el verbo to be?                                  |
|                                                                             |
| 2. 🟡 En "[I am agree]":                                                    |
|    "Agree" ya es un verbo pleno en inglés. ¿Necesitas realmente poner "am"? |
|                                                                             |
| 3. 🟡 En "[depends of]":                                                    |
|    En español decimos "depende de", pero en inglés 'depend' siempre se      |
|    apoya figuradamente sobre una superficie. ¿Cuál es esa preposición?      |
|                                                                             |
|-----------------------------------------------------------------------------|
| [ ✏️ EDITAR EN SEGUNDO BORRADOR ]   [ ❓ REVELAR SOLUCIÓN Y EVALUACIÓN FINAL ]|
+-----------------------------------------------------------------------------+
```

### Especificación de Tokens y Clases Tailwind:
- **Contenedor Principal:** `max-w-4xl mx-auto my-8 bg-white dark:bg-[#131722] border border-gray-200 dark:border-[#1F2637] rounded-2xl p-6 shadow-card-light dark:shadow-dark-border`
- **Comparativa de Borradores (`grid grid-cols-1 md:grid-cols-2 gap-4 mb-6`):**
  - **Borrador 1 (Lectura de Referencia):** `p-4 rounded-xl bg-gray-50 dark:bg-[#0E1119] border border-gray-200 dark:border-[#1F2637] text-gray-600 dark:text-slate-400 text-sm leading-relaxed font-sans`
  - **Borrador 2 (Editor Activo):** `p-4 rounded-xl bg-white dark:bg-[#131722] border-2 border-indigo-500/60 text-gray-900 dark:text-white text-sm leading-relaxed font-sans focus:outline-none focus:ring-2 focus:ring-indigo-500`
- **Tarjetas de Pistas Socráticas (`space-y-3`):**
  - **Tarjeta Individual:** `p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 text-xs text-amber-900 dark:text-amber-200 leading-relaxed space-y-1`
- **Acciones Inferiores:**
  - **Editar Segundo Borrador:** `px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 text-white font-medium text-xs shadow-xs transition-colors`
  - **Revelar Solución:** `px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-[#1B2030] dark:hover:bg-[#23293D] text-gray-700 dark:text-slate-300 font-medium text-xs transition-colors`
