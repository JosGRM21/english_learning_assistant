# Contratos de Datos y Esquemas JSON (JSON Schemas)
## English Learning Assistant (ELA)

Este documento define formalmente los contratos de datos y esquemas **JSON Schema (Draft 2020-12)** utilizados para la comunicación entre el frontend, el backend y la API de **Google Gemini**.

---

## 1. Esquema de Evaluación Estructurada de Google Gemini

Este es el esquema exacto que se inyecta en el parámetro `response_schema` del SDK de Gemini para forzar al modelo a devolver una estructura válida sin texto conversacional no deseado.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "GeminiWritingEvaluationResponse",
  "type": "object",
  "required": [
    "overall_feedback_es",
    "estimated_cefr",
    "scores",
    "corrections",
    "micro_challenge"
  ],
  "properties": {
    "overall_feedback_es": {
      "type": "string",
      "description": "Resumen pedagógico y motivador en español destacando fortalezas y áreas prioritarias de mejora."
    },
    "estimated_cefr": {
      "type": "string",
      "enum": ["A1", "A2", "B1", "B2", "C1", "C2"],
      "description": "Nivel de competencia estimado para esta producción escrita."
    },
    "scores": {
      "type": "object",
      "required": ["grammar", "vocabulary", "coherence"],
      "properties": {
        "grammar": {
          "type": "number",
          "minimum": 0.0,
          "maximum": 10.0,
          "description": "Precisión morfosintáctica y corrección mecánica."
        },
        "vocabulary": {
          "type": "number",
          "minimum": 0.0,
          "maximum": 10.0,
          "description": "Variedad léxica, adecuación de colocaciones y naturalidad."
        },
        "coherence": {
          "type": "number",
          "minimum": 0.0,
          "maximum": 10.0,
          "description": "Fluidez discursiva, uso de conectores y organización lógica."
        }
      }
    },
    "corrections": {
      "type": "array",
      "items": {
        "type": "object",
        "required": [
          "error_span",
          "error_type",
          "taxonomy_code",
          "is_l1_spanish_transfer",
          "explanation_es",
          "native_reformulation"
        ],
        "properties": {
          "error_span": {
            "type": "string",
            "description": "El fragmento textual exacto del usuario que contiene la incorrección."
          },
          "error_type": {
            "type": "string",
            "enum": ["GRAMMAR", "LEXICON", "PREPOSITION", "WORD_ORDER", "FALSE_FRIEND", "PUNCTUATION", "REGISTER"]
          },
          "taxonomy_code": {
            "type": "string",
            "description": "Código formal de taxonomía, p. ej. 'L1_PREP_DEPEND_ON' o 'GRAM_STATIVE_VERB_ING'."
          },
          "is_l1_spanish_transfer": {
            "type": "boolean",
            "description": "True si el error proviene de una traducción o interferencia directa del español."
          },
          "explanation_es": {
            "type": "string",
            "description": "Explicación pedagógica clara en español de la regla lingüística violada."
          },
          "native_reformulation": {
            "type": "string",
            "description": "Cómo escribiría esa misma idea un hablante nativo con naturalidad idiomática."
          }
        }
      }
    },
    "micro_challenge": {
      "type": "object",
      "required": [
        "question_es",
        "sentence_with_blank",
        "options",
        "correct_option_index",
        "explanation_es"
      ],
      "properties": {
        "question_es": {
          "type": "string",
          "description": "Consigna breve para validar la comprensión del error detectado."
        },
        "sentence_with_blank": {
          "type": "string",
          "description": "Oración con '___' donde debe insertarse la respuesta correcta."
        },
        "options": {
          "type": "array",
          "items": { "type": "string" },
          "minItems": 2,
          "maxItems": 4
        },
        "correct_option_index": {
          "type": "integer",
          "minimum": 0,
          "maximum": 3
        },
        "explanation_es": {
          "type": "string",
          "description": "Justificación de por qué esa opción es la correcta al contestar el reto."
        }
      }
    }
  }
}
```

---

## 2. Esquema de Análisis de Habla Conectada (Connected Speech Payload)

Estructura devuelta por el motor de análisis fonético para renderizar las conexiones visuales:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "ConnectedSpeechAnalysis",
  "type": "object",
  "required": ["original_sentence", "ipa_connected", "phonetic_boundaries"],
  "properties": {
    "original_sentence": { "type": "string", "example": "Hold on for a second" },
    "ipa_citation_form": { "type": "string", "example": "/həʊld ɒn fɔːr eɪ ˈsekənd/" },
    "ipa_connected": { "type": "string", "example": "[həʊl-dɒn fər ə ˈsekənd]" },
    "phonetic_boundaries": {
      "type": "array",
      "items": {
        "type": "object",
        "required": [
          "word_1",
          "word_2",
          "boundary_type",
          "rule_name",
          "description_es",
          "highlight_span"
        ],
        "properties": {
          "word_1": { "type": "string", "example": "Hold" },
          "word_2": { "type": "string", "example": "on" },
          "boundary_type": {
            "type": "string",
            "enum": [
              "LINKING_CV",
              "LINKING_VV_J",
              "LINKING_VV_W",
              "LINKING_R",
              "ELISION_T_D",
              "ELISION_H",
              "ASSIMILATION_COALESCENT",
              "ASSIMILATION_PLACE",
              "WEAK_FORM",
              "GEMINATION"
            ]
          },
          "rule_name": { "type": "string", "example": "Catenación Consonante-Vocal" },
          "description_es": {
            "type": "string",
            "example": "La 'd' final de 'Hold' se traslada como inicio sonoro de 'on': [həʊl-dɒn]."
          },
          "highlight_span": {
            "type": "object",
            "properties": {
              "char_start": { "type": "integer", "example": 0 },
              "char_end": { "type": "integer", "example": 7 }
            }
          }
        }
      }
    }
  }
}
```

---

## 3. Esquema de Tarjeta FSRS (SRS Card Entity Payload)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "SrsCardPayload",
  "type": "object",
  "required": [
    "id",
    "target_type",
    "target_id",
    "state",
    "stability",
    "difficulty",
    "scheduled_for"
  ],
  "properties": {
    "id": { "type": "string", "format": "uuid" },
    "target_type": {
      "type": "string",
      "enum": ["VOCAB", "PHRASE", "GRAMMAR", "PHONETICS"]
    },
    "target_id": { "type": "string" },
    "state": {
      "type": "string",
      "enum": ["NEW", "LEARNING", "REVIEW", "RELEARNING"]
    },
    "stability": { "type": "number", "minimum": 0.0, "example": 14.5 },
    "difficulty": { "type": "number", "minimum": 1.0, "maximum": 10.0, "example": 4.2 },
    "reps": { "type": "integer", "minimum": 0 },
    "lapses": { "type": "integer", "minimum": 0 },
    "scheduled_for": { "type": "string", "format": "date-time" }
  }
}
```

---

## 4. Esquema de Tareas Diarias y Estado de Racha (Daily Quest & Streak Payload)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "DailyStatusPayload",
  "type": "object",
  "required": ["date", "streak_info", "quests"],
  "properties": {
    "date": { "type": "string", "format": "date", "example": "2026-09-28" },
    "streak_info": {
      "type": "object",
      "required": ["current_streak", "longest_streak", "available_freezes", "is_today_completed"],
      "properties": {
        "current_streak": { "type": "integer", "example": 12 },
        "longest_streak": { "type": "integer", "example": 28 },
        "available_freezes": { "type": "integer", "example": 1 },
        "is_today_completed": { "type": "boolean", "example": false }
      }
    },
    "quests": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["quest_type", "description", "target_count", "current_count", "is_completed"],
        "properties": {
          "quest_type": {
            "type": "string",
            "enum": ["VOCAB_SRS", "PHONETICS_LISTEN", "WRITING_SUBMISSION", "MICRO_WORKOUT"]
          },
          "description": { "type": "string", "example": "Repasar 15 tarjetas SRS pendientes" },
          "target_count": { "type": "integer", "example": 15 },
          "current_count": { "type": "integer", "example": 8 },
          "is_completed": { "type": "boolean", "example": false }
        }
      }
    }
  }
}
```

---

## 5. Esquema del Panel de Configuración de IA y Pool de Claves (AiConfigurationPayload)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "AiConfigurationPayload",
  "type": "object",
  "required": [
    "default_model",
    "available_models",
    "rotation_mode",
    "api_keys",
    "active_primary_key_id"
  ],
  "properties": {
    "default_model": {
      "type": "string",
      "enum": ["gemini-3.5-flash", "gemini-3.6-flash", "gemini-3.7-flash", "gemini-3.8-flash"],
      "example": "gemini-3.8-flash"
    },
    "available_models": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "name", "recommended_for", "speed_rating"],
        "properties": {
          "id": { "type": "string" },
          "name": { "type": "string" },
          "recommended_for": { "type": "string" },
          "speed_rating": { "type": "string" }
        }
      }
    },
    "rotation_mode": {
      "type": "string",
      "enum": ["FAILOVER_ON_QUOTA", "MANUAL_PRIMARY", "ROUND_ROBIN"],
      "example": "FAILOVER_ON_QUOTA"
    },
    "active_primary_key_id": {
      "type": "string",
      "format": "uuid"
    },
    "api_keys": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "label", "masked_key", "is_active", "is_primary", "status"],
        "properties": {
          "id": { "type": "string", "format": "uuid" },
          "label": { "type": "string", "example": "Cuenta Personal AI Studio" },
          "masked_key": { "type": "string", "example": "AIzaSyD8...74vQ" },
          "is_active": { "type": "boolean", "example": true },
          "is_primary": { "type": "boolean", "example": true },
          "status": {
            "type": "string",
            "enum": ["VALID", "INVALID", "QUOTA_EXCEEDED", "UNTESTED"],
            "example": "VALID"
          },
          "last_tested_at": { "type": "string", "format": "date-time", "nullable": true }
        }
      }
    }
  }
}
```

---

## 6. Esquema de Auto-Enriquecimiento de Vocabulario y Chunks (AiVocabularyEnrichmentResponse)

Este esquema se inyecta en el parámetro `response_schema` al solicitar el enriquecimiento automático de un término o bloque fraseológico:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "AiVocabularyEnrichmentResponse",
  "type": "object",
  "required": [
    "entry_type",
    "term",
    "grammatical_dimension",
    "part_of_speech",
    "definition_en",
    "translation_es",
    "ipa_general_american",
    "ipa_received_pronunciation",
    "cefr_level",
    "is_false_friend",
    "examples"
  ],
  "properties": {
    "entry_type": {
      "type": "string",
      "enum": ["VOCAB_ITEM", "PHRASEOLOGICAL_UNIT"]
    },
    "term": { "type": "string" },
    "grammatical_dimension": {
      "type": "string",
      "enum": ["CONTENT", "FUNCTION", "CHUNK"]
    },
    "part_of_speech": {
      "type": "string",
      "enum": ["NOUN", "VERB", "ADJECTIVE", "ADVERB", "PREPOSITION", "CONJUNCTION", "ARTICLE_DETERMINER", "PRONOUN", "INTERJECTION"]
    },
    "subcategory": { "type": "string", "nullable": true },
    "chunk_type": {
      "type": "string",
      "enum": ["COLLOCATION", "PHRASAL_VERB", "IDIOM", "BINOMIAL", "SENTENCE_FRAME"],
      "nullable": true
    },
    "phrasal_verb_type": {
      "type": "string",
      "enum": ["TYPE_1_INTRANSITIVE", "TYPE_2_SEPARABLE", "TYPE_3_INSEPARABLE", "TYPE_4_THREE_PART"],
      "nullable": true
    },
    "collocation_pattern": { "type": "string", "nullable": true },
    "definition_en": { "type": "string" },
    "translation_es": { "type": "string" },
    "ipa_general_american": { "type": "string" },
    "ipa_received_pronunciation": { "type": "string" },
    "connected_speech_notes": { "type": "string", "nullable": true },
    "cefr_level": {
      "type": "string",
      "enum": ["A1", "A2", "B1", "B2", "C1", "C2"]
    },
    "is_false_friend": { "type": "boolean" },
    "false_friend_note": { "type": "string", "nullable": true },
    "morphological_family": {
      "type": "array",
      "items": { "type": "string" }
    },
    "examples": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["sentence_en", "sentence_es"],
        "properties": {
          "sentence_en": { "type": "string" },
          "sentence_es": { "type": "string" }
        }
      },
      "minItems": 2
    }
  }
}
```

---

## 7. Esquema de Retroalimentación Socrática (Fase 1: Pistas de Andamiaje)

Este esquema se inyecta en Gemini cuando el estudiante solicita evaluación socrática en su primer borrador:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "SocraticFeedbackResponse",
  "type": "object",
  "required": [
    "overall_impression_es",
    "error_count",
    "scaffolded_clues",
    "allow_self_correction"
  ],
  "properties": {
    "overall_impression_es": {
      "type": "string",
      "description": "Comentario inicial sobre la intención comunicativa general."
    },
    "error_count": { "type": "integer", "minimum": 0 },
    "allow_self_correction": { "type": "boolean" },
    "scaffolded_clues": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["paragraph_index", "clue_type", "hint_question_es", "highlighted_area"],
        "properties": {
          "paragraph_index": { "type": "integer" },
          "clue_type": {
            "type": "string",
            "enum": ["PREPOSITION", "TENSE_ASPECT", "FALSE_FRIEND", "AGREEMENT", "WORD_CHOICE"]
          },
          "hint_question_es": {
            "type": "string",
            "description": "Pregunta socrática reflexiva sin revelar la respuesta directa."
          },
          "highlighted_area": {
            "type": "string",
            "description": "Fragmento donde se ubica la oportunidad de mejora."
          }
        }
      }
    }
  }
}
```

---

## 8. Esquema de Sesión de Discriminación Fonética y Pares Mínimos (PhoneticPracticePayload)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "PhoneticPracticePayload",
  "type": "object",
  "required": [
    "session_id",
    "user_id",
    "contrast_pair_id",
    "target_stimulus",
    "selected_option",
    "is_correct",
    "reaction_time_ms",
    "practiced_at"
  ],
  "properties": {
    "session_id": { "type": "string", "format": "uuid" },
    "user_id": { "type": "string" },
    "contrast_pair_id": { "type": "string" },
    "target_stimulus": { "type": "string" },
    "selected_option": { "type": "string" },
    "is_correct": { "type": "boolean" },
    "reaction_time_ms": { "type": "integer" },
    "practiced_at": { "type": "string", "format": "date-time" }
  }
}
```

---

## 9. Esquema de Drills de Velocidad y Proceduralización (SpeedDrillPayload)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "SpeedDrillPayload",
  "type": "object",
  "required": [
    "session_id",
    "drill_type",
    "time_limit_per_item_seconds",
    "items_count",
    "correct_answers",
    "avg_latency_ms"
  ],
  "properties": {
    "session_id": { "type": "string", "format": "uuid" },
    "drill_type": {
      "type": "string",
      "enum": ["COLLOCATION_BLITZ", "PREPOSITION_RAPID_FIRE", "CONNECTED_SPEECH_EAR"]
    },
    "time_limit_per_item_seconds": { "type": "number", "example": 4.0 },
    "items_count": { "type": "integer", "example": 12 },
    "correct_answers": { "type": "integer", "example": 11 },
    "avg_latency_ms": { "type": "number", "example": 1650.5 }
  }
}
```

---

## 10. Esquema del Lector Inteligente de Input Comprensible (GradedReaderArticlePayload)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "GradedReaderArticlePayload",
  "type": "object",
  "required": [
    "id",
    "title",
    "content_text",
    "cefr_level",
    "total_words",
    "active_learning_words_detected"
  ],
  "properties": {
    "id": { "type": "string", "format": "uuid" },
    "title": { "type": "string" },
    "content_text": { "type": "string" },
    "source_url": { "type": "string", "nullable": true },
    "cefr_level": {
      "type": "string",
      "enum": ["A1", "A2", "B1", "B2", "C1", "C2"]
    },
    "total_words": { "type": "integer" },
    "read_percentage": { "type": "number", "minimum": 0.0, "maximum": 100.0 },
    "active_learning_words_detected": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["word", "card_id", "char_start", "char_end", "fsrs_state"],
        "properties": {
          "word": { "type": "string" },
          "card_id": { "type": "string", "format": "uuid" },
          "char_start": { "type": "integer" },
          "char_end": { "type": "integer" },
          "fsrs_state": { "type": "string", "enum": ["NEW", "LEARNING", "REVIEW", "RELEARNING"] }
        }
      }
    }
  }
}
```

