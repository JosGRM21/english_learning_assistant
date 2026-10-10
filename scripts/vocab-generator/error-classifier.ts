/**
 * Clasificación y manejo de errores de la API de Google Gemini según la documentación oficial:
 * https://aistudio.google.com/docs/api-errors
 */

export enum GeminiErrorKind {
  /** 429 por límite por minuto (RPM / TPM). Transitorio, recuperable con backoff */
  RATE_LIMIT_RPM = 'RATE_LIMIT_RPM',
  /** 429 por cuota diaria agotada (RPD). No recuperable hoy, desactiva la API key */
  DAILY_QUOTA_EXHAUSTED = 'DAILY_QUOTA_EXHAUSTED',
  /** 503 / 500 / Unavailable. Servidor sobrecargado, recuperable con espera corta */
  SERVER_OVERLOADED_503 = 'SERVER_OVERLOADED_503',
  /** 400 / 403 / 404. Error fatal de configuración o clave inválida */
  FATAL_CLIENT_ERROR = 'FATAL_CLIENT_ERROR',
  /** Timeout de red o respuesta incompleta */
  NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',
  /** Salida no pasó validación de esquema Zod */
  SCHEMA_VALIDATION_ERROR = 'SCHEMA_VALIDATION_ERROR',
  /** Error desconocido */
  UNKNOWN = 'UNKNOWN',
}

export interface ClassifiedGeminiError {
  kind: GeminiErrorKind;
  originalMessage: string;
  isRetryable: boolean;
  suggestedBackoffMs: number;
  shouldDeactivateKey: boolean;
}

export function classifyGeminiError(error: unknown, attemptCount = 0): ClassifiedGeminiError {
  const msg = error instanceof Error ? error.message : String(error);
  const lowerMsg = msg.toLowerCase();

  // 1. Detección de 429 RESOURCE_EXHAUSTED
  if (
    msg.includes('429') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    lowerMsg.includes('rate limit') ||
    lowerMsg.includes('quota')
  ) {
    // Distinguir entre agotamiento diario (RPD) vs límite por minuto (RPM/TPM)
    const isDailyExhausted =
      lowerMsg.includes('per day') ||
      lowerMsg.includes('daily limit') ||
      lowerMsg.includes('day') ||
      lowerMsg.includes('exceeded your current quota') ||
      lowerMsg.includes('quota exceeded for quota metric');

    if (isDailyExhausted && !lowerMsg.includes('per minute') && !lowerMsg.includes('rate')) {
      return {
        kind: GeminiErrorKind.DAILY_QUOTA_EXHAUSTED,
        originalMessage: msg,
        isRetryable: false,
        suggestedBackoffMs: 0,
        shouldDeactivateKey: true,
      };
    }

    // Si es RPM o indeterminada, asumimos transitorio con backoff exponencial + jitter
    // Fórmula: 2^attempt * 1500ms + random(500, 1500)ms
    const baseWait = Math.pow(2, Math.min(attemptCount, 5)) * 1500;
    const jitter = Math.floor(Math.random() * 1000) + 500;
    return {
      kind: GeminiErrorKind.RATE_LIMIT_RPM,
      originalMessage: msg,
      isRetryable: true,
      suggestedBackoffMs: baseWait + jitter,
      shouldDeactivateKey: false,
    };
  }

  // 2. Detección de 503 / 500 / UNAVAILABLE / Overloaded
  if (
    msg.includes('503') ||
    msg.includes('500') ||
    msg.includes('UNAVAILABLE') ||
    lowerMsg.includes('overloaded') ||
    lowerMsg.includes('temporarily unavailable')
  ) {
    // Backoff para sobrecarga de servidores Gemini: 3 a 5 segundos con jitter
    const wait = 3000 + Math.floor(Math.random() * 2000);
    return {
      kind: GeminiErrorKind.SERVER_OVERLOADED_503,
      originalMessage: msg,
      isRetryable: true,
      suggestedBackoffMs: wait,
      shouldDeactivateKey: false,
    };
  }

  // 3. Timeouts o errores de conexión de red
  if (
    lowerMsg.includes('timeout') ||
    lowerMsg.includes('econnreset') ||
    lowerMsg.includes('fetch failed') ||
    lowerMsg.includes('network')
  ) {
    return {
      kind: GeminiErrorKind.NETWORK_TIMEOUT,
      originalMessage: msg,
      isRetryable: true,
      suggestedBackoffMs: 2000,
      shouldDeactivateKey: false,
    };
  }

  // 4. Errores fatales (400 Bad Request, 403 Forbidden / Invalid API Key)
  if (
    msg.includes('400') ||
    msg.includes('403') ||
    lowerMsg.includes('api key not valid') ||
    lowerMsg.includes('permission denied')
  ) {
    return {
      kind: GeminiErrorKind.FATAL_CLIENT_ERROR,
      originalMessage: msg,
      isRetryable: false,
      suggestedBackoffMs: 0,
      shouldDeactivateKey: msg.includes('403') || lowerMsg.includes('api key not valid'),
    };
  }

  // 5. Errores de validación de esquema o JSON malformado (debe reintentarse la llamada a la IA)
  if (
    error instanceof Error &&
    (error.name === 'ZodError' ||
      lowerMsg.includes('zod') ||
      lowerMsg.includes('validation') ||
      lowerMsg.includes('json') ||
      lowerMsg.includes('syntaxerror') ||
      lowerMsg.includes('no contiene una lista') ||
      lowerMsg.includes('lista vacía'))
  ) {
    return {
      kind: GeminiErrorKind.SCHEMA_VALIDATION_ERROR,
      originalMessage: msg,
      isRetryable: true,
      suggestedBackoffMs: 1000 + Math.floor(Math.random() * 1000),
      shouldDeactivateKey: false,
    };
  }

  // 6. Otros errores
  return {
    kind: GeminiErrorKind.UNKNOWN,
    originalMessage: msg,
    isRetryable: attemptCount < 2,
    suggestedBackoffMs: 2000,
    shouldDeactivateKey: false,
  };
}
