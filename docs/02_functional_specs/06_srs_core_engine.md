# Requisitos Funcionales: Motor Central de Repetición Espaciada (SRS Core Engine)

## 1. Propósito del Módulo
Proporcionar un servicio transversal, matemáticamente formalizado y autónomo que gestione la planificación temporal de repasos para cualquier tipo de ítem de aprendizaje del sistema (vocabulario, fonética, errores gramaticales y estructuras sintácticas). El motor se basa en el modelo moderno de tres componentes de la memoria (**DSR: Difficulty, Stability, Retrievability** / FSRS), superando las limitaciones y trampas de estancamiento (*ease hell*) de algoritmos antiguos como SM-2.

---

## 2. Modelo Matemático de Memoria (Variables Fundamentales)

Para cada ítem registrado, el motor debe calcular y persistir de manera continua las siguientes variables:

* **RF-SRS-CORE-01: Variables de Estado de Memoria**:
  * **Estabilidad ($S$, en días)**:
    * Representa la solidez del trazo mnémico. Se define cuantitativamente como el tiempo que tarda la probabilidad de recuerdo ($R$) en descender desde el 100% hasta la retención objetivo predeterminada ($r_{\text{target}} = 0.90$).
  * **Dificultad ($D$, escala continua de 1.0 a 10.0)**:
    * Representa la resistencia intrínseca del ítem a ser retenido en la memoria a largo plazo. Se inicializa en la primera revisión según la calificación recibida y se actualiza suavemente en repasos posteriores con amortiguación hacia la media para evitar distorsiones por fallos aislados.
  * **Recuperabilidad ($R$, probabilidad de 0.0 a 1.0)**:
    * Probabilidad estimada de que el estudiante recuerde exitosamente el ítem en el día actual $t$ transcurrido desde el último repaso:
      $$R(t, S) = \left(1 + \text{factor} \cdot \frac{t}{S}\right)^{-\text{power}}$$

---

## 3. Calificaciones y Fórmulas de Transición

* **RF-SRS-CORE-02: Escala de Calificación de 4 Niveles**:
  * El motor debe procesar cuatro valores de respuesta del usuario:
    * $G = 1$ (**Again / Olvido**): Fallo total en la recuperación o error fundamental.
    * $G = 2$ (**Hard / Difícil**): Recuerdo exitoso pero con esfuerzo consciente prolongado o titubeo.
    * $G = 3$ (**Good / Normal**): Recuerdo adecuado en el tiempo previsto de respuesta.
    * $G = 4$ (**Easy / Fácil**): Recuerdo inmediato, automático y sin esfuerzo.

* **RF-SRS-CORE-03: Actualización Dinámica de Dificultad ($D$)**:
  * Tras cada revisión, la dificultad se actualiza según:
    $$D' = D + \Delta D(G)$$
  * Se aplica una regresión a la media poblacional ($D_0$) para mitigar sesgos de calificación temporal:
    $$D_{\text{final}} = w_D \cdot D' + (1 - w_D) \cdot D_0$$
    donde $D_{\text{final}}$ queda acotada en el rango $[1.0, 10.0]$.

* **RF-SRS-CORE-04: Cálculo de Nueva Estabilidad ($S$)**:
  * **En caso de Acierto ($G \in \{2, 3, 4\}$)**:
    * La estabilidad se incrementa multiplicativamente en función de la estabilidad actual, la dificultad, la recuperabilidad al momento del repaso (premiando el recuerdo cuando el ítem estaba cerca de olvidarse) y la calificación otorgada:
      $$S' = S \cdot \left(1 + C(D) \cdot f(R) \cdot m(G)\right)$$
  * **En caso de Fallo ($G = 1$)**:
    * La estabilidad se reduce a una fracción controlada adaptada a la dificultad del ítem, garantizando que el elemento vuelva a repasarse en un intervalo breve sin perder por completo todo el progreso histórico acumulado:
      $$S' = S_{\text{lapsed}}(S, D)$$

* **RF-SRS-CORE-05: Proyección del Próximo Intervalo ($I$)**:
  * A partir de la nueva estabilidad calculada ($S'$) y de la tasa de retención deseada ($r_{\text{target}}$ configurada por el sistema, por defecto 90%), el intervalo en días hasta la siguiente revisión se deriva directamente:
    $$I = \text{round}\left( \frac{S'}{\text{factor}} \cdot \left( (r_{\text{target}})^{-1/\text{power}} - 1 \right) \right)$$
  * El intervalo mínimo es de 1 día tras la graduación del ciclo de aprendizaje inicial. Se debe incorporar una pequeña dispersión aleatoria (*fuzz factor* de $\pm 5\%$) para evitar la acumulación artificial de grandes lotes de tarjetas en un mismo día futuro.

---

## 4. Ciclo de Vida de los Ítems y Gestión de Colas

* **RF-SRS-CORE-06: Estados Formales del Ítem**:
  * Todo ítem en el motor debe pertenecer a uno de los siguientes estados:
    1. `Inactivo`: Registrado en el sistema pero aún no activado para el estudio activo.
    2. `Nuevo`: Activado, pendiente de su primer encuentro con el estudiante.
    3. `Aprendizaje (Learning)`: Pasos iniciales en el mismo día o días inmediatos hasta alcanzar el primer intervalo formal.
    4. `Repaso (Review)`: Ítem consolidado cuyos repasos se planifican en días, semanas o meses.
    5. `Reaprendizaje (Relearning)`: Ítem de repaso fallado ($G = 1$), que requiere un ciclo corto de re-consolidación antes de reintegrarse al flujo principal de repaso.

* **RF-SRS-CORE-07: Composición y Priorización de la Cola Diaria**:
  * En cada jornada de estudio, el motor debe ensamblar la cola de ítems a repasar respetando el siguiente orden estricto de precedencia:
    1. **Ítems en Reaprendizaje / Pasos Inmediatos**: Prioridad máxima para evitar consolidar fallos.
    2. **Ítems Vencidos de Repaso (`Review`)**: Ordenados prioritariamente por su índice de retención descendente (aquellos con menor $R$ primero).
    3. **Ítems Nuevos (`New`)**: Limitados por el cupo diario configurado por el usuario para prevenir sobrecargas acumulativas en días posteriores.

---

## 5. Perfiles Paramétricos Diferenciados

* **RF-SRS-CORE-08: Perfiles de Parámetros según Naturaleza Cognitiva**:
  * El motor debe admitir perfiles de configuración especializados para atender las diferentes demandas de la tarea de aprendizaje:
    * **Perfil Vocabulario y Expresiones (Flujo Ágil)**:
      * Optimizado para memoria declarativa y reconocimiento rápido (3–5 segundos por tarjeta).
      * Retención objetivo estándar: $r_{\text{target}} = 0.90$.
      * Pasos de aprendizaje inicial: 1 día.
    * **Perfil Errores de Redacción y Sintaxis (Flujo Reflexivo)**:
      * Optimizado para procesamiento procedimental de oraciones complejas (15–45 segundos por ejercicio).
      * Retención objetivo más estricta: $r_{\text{target}} = 0.92$ (para forzar mayor solidez antes de separar los intervalos).
      * Mayor penalización de estabilidad ante fallos repetidos para desfosilizar malos hábitos de la lengua materna.

---

## 6. Detección y Gestión de Tarjetas Sangijuela (Leech Management)

* **RF-SRS-CORE-09: Identificación Automática de "Leeches"**:
  * Si un ítem acumula un umbral de 4 fallos consecutivos ($G = 1$) o un total de 6 fallos durante su ciclo de repaso, el motor debe etiquetarlo automáticamente como `Sangijuela (Leech)`.
  * **Acción Pedagógica Automática**:
    * El ítem se aísla temporalmente de la cola regular para no frustrar al estudiante.
    * El sistema notifica al usuario e instruye a los módulos de aplicación para que reformulen el estímulo (ej. ofreciendo una nueva oración de contexto, un mnemonico fonético o una reformulación guiada en vez de insistir mecánicamente con la misma tarjeta que no está funcionando).
