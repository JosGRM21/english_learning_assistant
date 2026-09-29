# Arquitectura de la Información y Mapa de Navegación (UI/UX)
## English Learning Assistant (ELA)

Este documento define la estructura de pantallas, la jerarquía de contenidos y el mapa de navegación del sistema para garantizar una experiencia sin fricción cognitiva.

---

## 1. Mapa del Sitio y Jerarquía de Navegación

```mermaid
graph TD
    App["ELA Application Root"] --> Sidebar["Barra de Navegación Lateral (Global Sidebar)"]
    
    Sidebar --> Nav1["1. Dashboard (Panel Principal)<br/>• Daily Quests Checklist<br/>• Contador de Racha & Streak Freezes<br/>• Resumen de Debilidades Críticas<br/>• Botón de Acción Inmediata"]
    
    Sidebar --> Nav2["2. Repaso SRS & Drills<br/>• Cola FSRS con Rotación de Contextos<br/>• Drills de Velocidad (Speed-Runs 60s)<br/>• Estadísticas de Memoria (S, D, R)"]
    
    Sidebar --> Nav3["3. Fonética & Habla Conectada<br/>• Desglosador de Habla Conectada<br/>• Gimnasio de Pares Mínimos<br/>• Reproducción Normal y Lenta (0.75x)"]
    
    Sidebar --> Nav4["4. Taller Socrático de Redacción<br/>• Modo Socrático (Pistas -> Auto-corrección)<br/>• Modalidad Micro-Writing (1 oración)<br/>• Feedback Pedagógico Gemini & Rúbricas CEFR"]
    
    Sidebar --> Nav5["5. Lector Inteligente (Smart Reader i+1)<br/>• Biblioteca de Textos Graduados<br/>• Noticing Reactivo de Términos Activos<br/>• Captura y Auto-Enriquecimiento en 1 Clic"]
    
    Sidebar --> Nav6["6. Analítica & Heatmap de Debilidades<br/>• Matriz Visual de Errores por Categoría<br/>• Historial de Frecuencia Temporal<br/>• Acceso a Micro-Workouts Personalizados"]
    
    Sidebar --> Nav7["7. Panel de Configuración de IA<br/>• Selector de Modelo (Familia 3.x Flash)<br/>• Pool Multi-Claves (Test & Failover 429)<br/>• Matriz 2D de Cuotas (80 RPD / Reset PT)"]
    
    Sidebar --> Nav8["8. Preferencias Generales & Datos<br/>• Acento de Referencia (Americano / Británico)<br/>• Copias de Seguridad (Exportar / Importar JSON)<br/>• Modo Oscuro / Claro & Densidad (Cómoda / Compacta)"]
```

---

## 2. Organización Espacial del Layout Principal

El diseño sigue una estructura de dos paneles (*Master-Detail / Sidebar-Content Layout*):

```
+-------------------+-------------------------------------------------------------+
|  ELA ASSISTANT    |  HEADER: [🔥 Racha: 14 días (🛡️ 1 Freeze)] [🌙 Tema] [⚙️]  |
+-------------------+-------------------------------------------------------------+
| [📊 Dashboard]    |  ÁREA DE CONTENIDO PRINCIPAL                                |
| [🗂️ Repaso SRS]   |                                                             |
| [⚡ Speed Drills] |  (Renderiza la vista activa según la selección del Sidebar) |
| [🔊 Fonética]     |                                                             |
| [📖 Lector i+1]   |                                                             |
| [✍️ Redacción]    |                                                             |
| [🔥 Heatmap]      |                                                             |
| [🤖 Config IA]    |                                                             |
| [⚙️ Preferencias] |                                                             |
+-------------------+-------------------------------------------------------------+
| ESTUDIANTE:       |  STATUS BAR: Base de datos SQLite activa | Latencia IA: 0.9s|
| Carlos (B1 Target)|  CLAVE ACTIVA: [Personal: AIza...4xK9] 🟢                   |
+-------------------+-------------------------------------------------------------+
```

---

## 3. Modales y Vistas Contextuales

1. **Modal de Pistas Socráticas (*Socratic Hints Panel*):**
   - Se activa tras la Fase 1 del taller de redacción, mostrando las preguntas orientadoras de Noticing sin revelar la solución corregida.
2. **Modal de Captura Rápida desde el Lector (*Quick Lookup & Add*):**
   - Al pulsar cualquier palabra en el Lector $i+1$, muestra definición, IPA y botón de 1 clic para añadirla a FSRS con auto-enriquecimiento de Gemini.
3. **Modal de Micro-Reto (*Micro-Challenge Dialog*):**
   - Se abre al culminar la evaluación de un texto por Gemini si se detectaron errores críticos, validando la regla antes de guardar.
4. **Modal de Notificación de Streak Freeze (*Freeze Saved Alert*):**
   - Alerta motivadora mostrada al iniciar sesión si el día previo fue rescatado por una ficha de congelación.

---

## 4. Guía de Estilos, Tokens y Especificación de Vistas

- Para la especificación exhaustiva de colores (paletas claras y oscuras), tipografía especializada (UI, lectura editorial con serifa, y glifos IPA), retícula de espaciado y directivas de accesibilidad WCAG 2.1 AA/AAA:
  👉 [`design_system_and_style_guide.md`](./design_system_and_style_guide.md)
- Para la especificación profunda de composición visual, ritmo de espaciado macro/micro, elevación tonal y diseño detallado de cada pantalla:
  👉 [`view_design_specifications.md`](./view_design_specifications.md)

