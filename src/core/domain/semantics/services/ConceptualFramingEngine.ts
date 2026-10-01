import { SatelliteMotionVerbItem } from '../../../types/semantics';

export const SATELLITE_MOTION_CATALOG: SatelliteMotionVerbItem[] = [
  {
    id: 'sm_01',
    latinateStaticSentence: 'He entered the room very quickly because he was late.',
    satelliteFramedSentence: 'He rushed into the room because he was late.',
    mannerVerb: 'rush',
    satellitePreposition: 'into',
    mannerMeaningEs: 'moverse con velocidad, prisa y urgencia',
    pathMeaningEs: 'hacia el interior del espacio delimitado',
    cefrLevel: 'B1',
    options: [
      'He rushed into the room',
      'He entered quickly to the room',
      'He walked inside with speed',
      'He made entry into the room',
    ],
    correctOptionIndex: 0,
  },
  {
    id: 'sm_02',
    latinateStaticSentence: 'She exited the quiet library stealthily without making noise.',
    satelliteFramedSentence: 'She tiptoed out of the quiet library without making noise.',
    mannerVerb: 'tiptoe',
    satellitePreposition: 'out of',
    mannerMeaningEs: 'caminar sobre las puntas de los pies con sigilo absoluto',
    pathMeaningEs: 'saliendo del interior hacia el exterior',
    cefrLevel: 'B2',
    options: [
      'She tiptoed out of the library',
      'She exited quietly from the library',
      'She went out walking silent',
      'She made out of the library',
    ],
    correctOptionIndex: 0,
  },
  {
    id: 'sm_03',
    latinateStaticSentence: 'The soldiers crossed the muddy field in disciplined formation.',
    satelliteFramedSentence: 'The soldiers marched across the muddy field in formation.',
    mannerVerb: 'march',
    satellitePreposition: 'across',
    mannerMeaningEs: 'caminar a paso firme y marcial',
    pathMeaningEs: 'de un extremo a otro de una superficie plana',
    cefrLevel: 'B1',
    options: [
      'The soldiers marched across the field',
      'The soldiers crossed walking to the field',
      'The soldiers passed over the field',
      'The soldiers stepped through the field',
    ],
    correctOptionIndex: 0,
  },
  {
    id: 'sm_04',
    latinateStaticSentence: 'He ascended the steep stairs with heavy, exhausted steps.',
    satelliteFramedSentence: 'He trudged up the steep stairs with exhaustion.',
    mannerVerb: 'trudge',
    satellitePreposition: 'up',
    mannerMeaningEs: 'caminar pesadamente y con notable fatiga',
    pathMeaningEs: 'en sentido ascendente',
    cefrLevel: 'B2',
    options: [
      'He trudged up the stairs',
      'He ascended with heavy foot the stairs',
      'He climbed tiredly to the stairs',
      'He walked up-high the stairs',
    ],
    correctOptionIndex: 0,
  },
  {
    id: 'sm_05',
    latinateStaticSentence: 'The wounded athlete reached the finish line almost falling down.',
    satelliteFramedSentence: 'The wounded athlete stumbled across the finish line.',
    mannerVerb: 'stumble',
    satellitePreposition: 'across',
    mannerMeaningEs: 'tropezar, trastabillar con dificultad motora',
    pathMeaningEs: 'cruzando el límite marcado',
    cefrLevel: 'B2',
    options: [
      'The athlete stumbled across the line',
      'The athlete arrived falling to the line',
      'The athlete crossed tripping the line',
      'The athlete passed over the line',
    ],
    correctOptionIndex: 0,
  },
  {
    id: 'sm_06',
    latinateStaticSentence: 'The kids entered the cool water by jumping vigorously.',
    satelliteFramedSentence: 'The kids plunged into the cool water.',
    mannerVerb: 'plunge',
    satellitePreposition: 'into',
    mannerMeaningEs: 'lanzarse o zambullirse con ímpetu repentino',
    pathMeaningEs: 'inmersión en el interior del líquido',
    cefrLevel: 'C1',
    options: [
      'The kids plunged into the water',
      'The kids jumped inside to the water',
      'The kids entered diving the water',
      'The kids went into falling the water',
    ],
    correctOptionIndex: 0,
  },
];

export class ConceptualFramingEngine {
  private readonly catalog: SatelliteMotionVerbItem[];

  constructor(customCatalog?: SatelliteMotionVerbItem[]) {
    this.catalog = customCatalog ?? SATELLITE_MOTION_CATALOG;
  }

  public getCatalog(): SatelliteMotionVerbItem[] {
    return [...this.catalog];
  }

  /**
   * Evaluates user replacement of Latinate static phrasing with native satellite-framing.
   */
  public evaluateSelection(
    itemId: string,
    selectedOptionIndex: number,
  ): {
    isCorrect: boolean;
    item?: SatelliteMotionVerbItem;
    explanationEs: string;
  } {
    const item = this.catalog.find((i) => i.id === itemId);
    if (!item) {
      return {
        isCorrect: false,
        explanationEs: 'Ítem no encontrado.',
      };
    }

    const isCorrect = selectedOptionIndex === item.correctOptionIndex;

    const explanationEs = isCorrect
      ? `¡Excelente reestructuración cognitiva! En inglés nativo (Satellite-Framed), la emoción y manera se codifican en la raíz verbal ("${item.mannerVerb}": ${item.mannerMeaningEs}) y la dirección en la partícula satelital ("${item.satellitePreposition}": ${item.pathMeaningEs}).`
      : `El español recurre a verbos genéricos latinos ("enter, exit, cross") con gerundios, mientras que el inglés nativo prefiere "${item.mannerVerb} ${item.satellitePreposition}" (${item.satelliteFramedSentence}).`;

    return {
      isCorrect,
      item,
      explanationEs,
    };
  }
}

export const conceptualFramingEngine = new ConceptualFramingEngine();
