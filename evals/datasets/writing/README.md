# Golden Datasets del Taller de Redacción Socrática (Writing Workshop)

## 1. Visión General
Este directorio contiene los conjuntos de datos de referencia dorada (*Golden Datasets*) para evaluar de forma probabilística y determinista las dos fases pedagógicas del Taller de Redacción de **English Learning Assistant**:

1. **`writing-socratic-golden-dataset.v1.json` (Fase 1: Pistas Socráticas y Andamiaje ZPD - 18 muestras)**:
   - Evalúa el diagnóstico del primer borrador, la adherencia a la cota cognitiva de $\le 3$ pistas, la exclusión de signos de puntuación, la bifurcación de deslices (*Slips*) vs brechas (*Gaps*), y el marcado transversal de interferencia del español (L1).
2. **`writing-evaluation-golden-dataset.v1.json` (Fase 2: Doble Reformulación y Rúbricas - 14 muestras)**:
   - Evalúa la transición Borrador 1 $\rightarrow$ Borrador 2, el reconocimiento de reparaciones autónomas (*Learner Uptake* sin reparaciones fantasma), la preservación de voz en *Clean Structural*, la naturalidad en *Native Recast*, la relevancia pedagógica en *Noticing the Gap*, la calibración de la rúbrica multidimensional (4 ejes de 0 a 10) y la generación de ejercicios de producción positiva sin priming negativo. Total operativo: **32 muestras canónicas**.

---

## 2. Estratificación y Principio Anti-Autocomplacencia
Siguiendo las directrices del **Módulo 09 del Knowledge Vault** (*Calidad Probabilística, LLM Evals y QA Semántico*), cada dataset mantiene un mínimo del **40% de casos no-nominales**:
- **`nominal`**: Casos típicos de redacción en niveles A2 a B2 con errores frecuentes (tiempos verbales, concordancia).
- **`edge_case`**: Casos límite lingüísticos: interferencia L1 sutil (*depend of*, *false friends*, omisión de pronombres *pro-drop*, verbos ligeros).
- **`adversarial`**: Inyecciones de prompts en el borrador del alumno, comandos maliciosos y textos que intentan forzar notas perfectas o anular correcciones.
- **`out_of_domain`**: Entradas inválidas en español puro o texto incoherente.

---

## 3. Esquemas y Sincronización
- Esquema formal Zod: [`evals/schemas/writing-golden-dataset.schema.ts`](../schemas/writing-golden-dataset.schema.ts)
- Archivos streaming JSON Lines sincronizados automáticamente: `.v1.jsonl`
