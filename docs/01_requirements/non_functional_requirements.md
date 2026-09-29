# Especificación de Requisitos No Funcionales (RNF)
## English Learning Assistant (ELA)

Este documento especifica los atributos de calidad, restricciones técnicas y requerimientos no funcionales del sistema bajo los estándares ISO/IEC 25010.

---

## 1. Rendimiento y Eficiencia de Recursos (RNF-PERF)

### RNF-PERF-01: Latencia de Interfaz de Usuario
- Las transiciones de pantalla, volteo de tarjetas de repaso (*flashcard flip*) y navegación por el catálogo de vocabulario deben responder en **menos de 50 ms** sin bloqueos del hilo principal (*60+ FPS constante*).

### RNF-PERF-02: Tiempo de Ejecución de Algoritmos Locales
- El cálculo de intervalos y actualización de estados del algoritmo **FSRS** para cualquier tarjeta debe completarse en **menos de 5 ms**.
- El procesamiento del algoritmo de detección de fallas crónicas y actualización del *Heatmap* debe tardar **menos de 100 ms** para un historial de hasta 100.000 eventos de error.

### RNF-PERF-03: Latencia en Evaluación con Google Gemini
- La petición de evaluación de textos hacia la API de Google Gemini debe mostrar un indicador de carga contextual en menos de 200 ms y devolver la respuesta completa o comenzar el *streaming* de corrección pedagógica en **menos de 2.0 segundos** en conexiones de banda ancha estándar (utilizando los modelos de la familia 3.x Flash: `gemini-3.5-flash`, `gemini-3.6-flash`, `gemini-3.7-flash` o `gemini-3.8-flash`).

### RNF-PERF-04: Consumo de Memoria y Almacenamiento
- La aplicación no debe exceder los **200 MB de memoria RAM** en ejecución estándar de escritorio.
- La base de datos local SQLite debe ocupar menos de 50 MB para un repositorio de 5.000 palabras con sus respectivos metadatos fonéticos y registros de repaso.

### RNF-PERF-05: Latencia y Precisión en Drills de Velocidad y Reproducción de Audio
- La reproducción de audio nativo y estímulos auditivos en el módulo fonético debe iniciarse en **menos de 100 ms** tras la interacción del usuario, sin retardos de búfer.
- El cronómetro de los *Speed-Retrieval Drills* debe operar con una precisión de reloj inferior a **10 ms** para medir la latencia de respuesta con fiabilidad psicométrica.

### RNF-PERF-06: Rendimiento y Tokenización del Lector Interactivo (Smart Reader)
- La carga, tokenización sintáctica y cruce con la base de datos de tarjetas en estado `LEARNING` para un artículo de hasta 5.000 palabras debe ejecutarse en **menos de 120 ms**.

---

## 2. Privacidad y Seguridad (RNF-SEC)

### RNF-SEC-01: Almacenamiento Cifrado y Seguro del Pool de Claves de API
- Las claves de API de Google Gemini (`GEMINI_API_KEY`) nunca deben compilarse en duro en el código fuente ni almacenarse en texto plano sin cifrado.
- En la base de datos local SQLite o almacén seguro, los valores reales de las claves se cifran mediante **AES-256-GCM** o el gestor nativo de credenciales del sistema operativo (**Windows Credential Manager / DPAPI**).
- La interfaz de usuario únicamente maneja y expone versiones enmascaradas (`masked_key`, p. ej. `AIzaSy...4xK9`). Solo el servicio de transporte seguro en memoria descifra temporalmente la clave al momento exacto de ejecutar la petición HTTPS hacia los servidores de Google AI.

### RNF-SEC-02: Soberanía y Privacidad de los Datos del Estudiante
- Todos los textos redactados por el usuario (diarios, opiniones, borradores), su historial de fallas y sus estadísticas de racha pertenecen 100% al usuario y se almacenan en su base de datos local `sqlite3`.
- No se enviarán datos de telemetría a servidores de terceros, a excepción del texto estrictamente necesario para la evaluación mediante la API oficial de Google Gemini.

---

## 3. Disponibilidad y Operación Offline / Local-First (RNF-AVAIL)

### RNF-AVAIL-01: Resiliencia Fuera de Línea (Local-First Architecture)
- El sistema debe ser completamente operativo **sin conexión a Internet** para las siguientes funciones críticas:
  - Repaso de tarjetas de memoria mediante repetición espaciada FSRS.
  - Consulta de definiciones, reglas gramaticales y catálogo de Habla Conectada.
  - Reproducción de audio mediante voces sintetizadas del sistema operativo (Web Speech API).
  - Verificación y cumplimiento de tareas diarias (*Daily Quests*) y mantenimiento de rachas.
  - Registro de errores en el Heatmap local.
- Únicamente las funciones que dependen directamente de la IA de Google Gemini (evaluación cualitativa de redacción libre y generación de nuevos ejercicios dinámicos) requerirán conexión activa a Internet. Si no hay conexión, los textos se guardarán en una cola de borradores locales pendientes de evaluación.

---

## 4. Usabilidad, Ergonomía y Accesibilidad (RNF-USA)

### RNF-USA-01: Reducción de la Fricción Cognitiva y Filosofía "Warm Minimalist"
- El acceso a la primera tarea del día no debe requerir más de **2 clics** desde el inicio de la aplicación.
- El diseño visual debe erradicar la gamificación estridente ("efecto casino/Duolingo" con sonidos invasivos y colores fluorescentes), priorizando la práctica deliberada y el trabajo profundo (*Deep Work*).
- El lienzo de la aplicación adopta la paleta *Warm Minimalist*: blanco hueso cálido (`#FBFBF9`) en modo claro para reducir el deslumbramiento en lecturas de más de 30 minutos, y carbón profundo con matices índigo (`#0B0D13` fondo, `#131722` tarjetas) en modo oscuro para evitar fatiga visual y efecto fantasma en pantallas OLED/IPS.

### RNF-USA-02: Control Integral por Teclado y Micro-Interacciones Hápticas
- El módulo de repaso SRS y los Drills de velocidad deben ser 100% operables mediante el teclado sin necesidad de cursor:
  - `Espacio` o `Enter`: Voltear tarjeta para revelar respuesta (animación 3D en 260 ms).
  - Tecla `1`: Calificar como **Again** (Repetir).
  - Tecla `2`: Calificar como **Hard** (Difícil).
  - Tecla `3`: Calificar como **Good** (Bien).
  - Tecla `4`: Calificar como **Easy** (Fácil).
  - Tecla `R`: Reproducir audio de pronunciación (1.0x o 0.75x).
  - `Ctrl + Enter`: Enviar texto a evaluación por Gemini en el taller de redacción.
- Todos los atajos deben renderizarse mediante componentes visuales de tecla física (`Kbd Pills`) con relieve táctil y biselado.

### RNF-USA-03: Fidelidad Tipográfica Prístina para Fonética IPA y Lector Editorial
- La interfaz implementa una tríada tipográfica especializada:
  - **Interfaz de usuario:** `Plus Jakarta Sans` / `Inter` con espaciado óptico calibrado.
  - **Lector $i+1$ (Smart Reader):** `Newsreader` / `Lora` (serifa editorial clásica que optimiza la inmersión y velocidad lectora).
  - **Fonética lingüística (IPA):** `Charis SIL` / `Noto Sans Phonetic` como fuente mandatoria para glifos fonéticos del Alfabeto Fonético Internacional (/æ/, /θ/, /ð/, /ʃ/, /ʒ/, /ŋ/, /ə/, /ɪ/, /ʊ/, /ʌ/), garantizando **cero glifos tofu o sustituciones defectuosas** y alineación vertical estricta de diacríticos.
  - **Métricas y atajos:** `JetBrains Mono` para cronómetros y badges de latencia.

### RNF-USA-04: Accesibilidad Visual WCAG 2.1 AA/AAA y Rendimiento de Tema
- **Ratios de Contraste Matemático:**
  - Todo texto de cuerpo principal y títulos debe superar un ratio de contraste de **7.0:1** (Nivel **AAA** de WCAG 2.1) frente al fondo correspondiente (en claro `#111827` sobre `#FBFBF9` = 17.12:1; en oscuro `#F9FAFB` sobre `#131722` = 17.13:1).
  - Textos secundarios, metadatos y botones deben superar **4.5:1** (Nivel **AA** de WCAG 2.1).
- **Conmutación de Tema:** La transición entre modo claro y modo oscuro debe ejecutarse en menos de **16 ms** (1 frame a 60 FPS) sin parpadeos de contenido no estilizado (FOUC).
- **Accesibilidad Motriz y Sensorial:**
  - Soporte para la directiva `prefers-reduced-motion`: desactiva volteos 3D y reemplaza animaciones por transiciones de opacidad instantáneas.
  - Todos los elementos interactivos deben exhibir anillos de foco visibles (`focus-visible:ring-2 focus-visible:ring-indigo-500`).

---

## 5. Mantenibilidad, Modularidad y Extensibilidad (RNF-MAINT)

### RNF-MAINT-01: Arquitectura Desacoplada
- La lógica de negocio pura (algoritmo FSRS, analizador de reglas fonéticas y detector de errores) debe estar totalmente desacoplada de la interfaz gráfica y de las bibliotecas de proveedores de IA, permitiendo pruebas unitarias automatizadas con una cobertura superior al **90%** en componentes de dominio.

### RNF-MAINT-02: Portabilidad de Datos (Data Export / Import)
- El sistema debe permitir la exportación de todos los datos del usuario (tarjetas, notas, historial de fallas y rachas) en formato estándar abierto `JSON` o `CSV` con un solo clic, permitiendo copias de seguridad y migraciones futuras.
