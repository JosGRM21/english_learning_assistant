# Máquina de Estados de Hábitos, Tareas Diarias y Rachas
## English Learning Assistant (ELA)

Este documento especifica el funcionamiento determinista de la **Máquina de Estados de Rachas (Streak State Machine)**, la gestión de la zona horaria del usuario y la mecánica de protección contra el abandono (**Streak Freeze**).

---

## 1. Diagrama de Transición de Estados de Racha Diaria

Cada día calendario a las 00:00 (hora local del usuario), el estado de la racha para la nueva jornada se evalúa y transiciona según el siguiente autómata finito:

```mermaid
stateDiagram-v2
    [*] --> InProgress: 00:00 Inicia nuevo día local

    state InProgress {
        [*] --> PendingQuests
        PendingQuests --> QuestsProgress: Usuario realiza repasos / audios / textos
        QuestsProgress --> QuestsMet: Cumple criterio mínimo del día
    }

    InProgress --> Completed: Usuario completa Daily Quests antes de las 23:59
    Completed --> IncrementStreak: Streak = Streak + 1

    InProgress --> EvaluateMidnight: Llegan las 23:59 sin completar quests
    
    state EvaluateMidnight <<choice>>
    EvaluateMidnight --> Frozen: ¿Tiene Streak Freeze > 0?
    EvaluateMidnight --> Broken: ¿Streak Freeze == 0?

    Frozen --> DeductFreeze: Streak Freeze = Streak Freeze - 1<br/>(Racha se mantiene intacta)
    Broken --> ResetStreak: Streak = 0<br/>(Racha reiniciada)

    IncrementStreak --> InProgress: Siguiente día 00:00
    DeductFreeze --> InProgress: Siguiente día 00:00
    ResetStreak --> InProgress: Siguiente día 00:00
```

---

## 2. Definición Formal de Estados y Transiciones

### 2.1. Estados del Sistema
1. **`IN_PROGRESS` (En Curso):**
   - Estado por defecto durante el transcurso del día.
   - La lista de verificación de *Daily Quests* muestra las metas pendientes.
2. **`COMPLETED` (Jornada Superada):**
   - El estudiante completó el umbral mínimo de tareas antes de las 23:59:59.
   - El contador de racha actual (`current_streak`) se incrementa en +1.
   - Si la nueva racha alcanza un múltiplo de 7 (7, 14, 21, 28...), se dispara la regla de bonificación de *Streak Freeze*.
3. **`FROZEN` (Jornada Salvada / Congelada):**
   - El estudiante no estudió durante el día (por viaje, enfermedad, descanso o imprevisto), pero poseía al menos 1 ficha de congelación (`available_freezes > 0`).
   - Se consume 1 ficha de congelación (`available_freezes = available_freezes - 1`).
   - El contador de racha **no se reinicia** ni se incrementa; se preserva intacto.
   - Se registra el evento en `streak_freeze_logs` con fecha y motivo automático.
4. **`BROKEN` (Racha Rota):**
   - El estudiante no completó las tareas y no disponía de fichas de protección.
   - El contador de racha vuelve a cero (`current_streak = 0`).
   - El récord histórico (`longest_streak`) permanece intacto.

---

## 3. Criterio de Cumplimiento de las Daily Quests

Para evitar que una sesión extensa de escritura opaque el repaso o que el usuario se sienta bloqueado en días de alta carga laboral, el sistema define dos niveles de cumplimiento:

```mermaid
graph LR
    subgraph Quests["Conjunto de Tareas Diarias (Daily 3)"]
        Q1["1. Repaso Vocabulario FSRS<br/>(Revisar tarjetas pendientes o mín. 15)"]
        Q2["2. Laboratorio Fonético<br/>(Escuchar y analizar 1 regla de Habla Conectada)"]
        Q3["3. Taller de Redacción<br/>(Redactar 1 micro-texto y recibir feedback Gemini)"]
    end

    Q1 --> Evaluator["Validador de Cumplimiento"]
    Q2 --> Evaluator
    Q3 --> Evaluator

    Evaluator --> Rule1["Cumplimiento Total (3 de 3):<br/>+100 XP + Bonificación de Racha"]
    Evaluator --> Rule2["Cumplimiento Mínimo Vital (Al menos 1 tarea clave):<br/>Preserva la Racha del Día"]
```

---

## 4. Política de Adquisición y Límites de Streak Freezes

Para evitar el abuso del sistema y mantener un equilibrio pedagógico entre compasión y disciplina:
- **Ficha Inicial de Bienvenida:** Todo nuevo usuario comienza con **1 ficha de Streak Freeze** gratuita al registrarse.
- **Premio por Constancia:** Por cada **7 días consecutivos de racha completada**, el usuario gana automáticamente **+1 ficha de Streak Freeze**.
- **Tope Máximo de Acumulación (Cap):** Un usuario puede acumular como máximo **2 fichas simultáneas**. Esto previene que un aprendiz acumule 20 fichas y deje de estudiar durante tres semanas consecutivas sin consecuencias.
