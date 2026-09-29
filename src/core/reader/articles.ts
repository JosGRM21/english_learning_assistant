import { ReaderArticle } from '../types/reader';

export const ARTICLES_CATALOG: ReaderArticle[] = [
  {
    id: 'art_a1_01',
    title: 'Daily Habits of Lifelong Learners',
    cefrLevel: 'A1',
    topic: 'HABITS & LEARNING',
    totalWords: 110,
    readPercentage: 0,
    createdAt: '2026-09-29T10:00:00Z',
    contentText: `Learning a new language is an exciting journey. Successful students always practice every single day. They read simple books and listen to natural conversations. When they make a mistake, they do not feel embarrassed. Instead, they realize that errors are a natural part of growth. Success does not depend on luck; it depends on daily dedication and curious habits.`,
  },
  {
    id: 'art_a2_01',
    title: 'The Art of Noticing: How Memory Works',
    cefrLevel: 'A2',
    topic: 'COGNITIVE SCIENCE',
    totalWords: 155,
    readPercentage: 0,
    createdAt: '2026-09-29T10:00:00Z',
    contentText: `When you read in English, your brain actively searches for familiar patterns. Psychologists call this "the noticing hypothesis." If you encounter a new word in context, your working memory attempts to connect it with existing concepts. For example, Spanish speakers often confuse the word "actually" with "currently." However, when you see "actually" used in an editorial article, you realize that it means "in reality." Paying close attention to collocations like "depend on" or "pay attention" helps transform passive vocabulary into active fluency. Consistent review prevents the natural decay of memory.`,
  },
  {
    id: 'art_b1_01',
    title: 'Cognitive Architecture of Bilingual Fluency',
    cefrLevel: 'B1',
    topic: 'NEUROLINGUISTICS',
    totalWords: 185,
    readPercentage: 0,
    createdAt: '2026-09-29T10:00:00Z',
    contentText: `Achieving spontaneous spoken fluency requires shifting language production from the declarative memory system to the procedural system. The declarative system, housed in the medial temporal lobe, stores conscious grammatical rules and explicit definitions. Conversely, the procedural memory system, rooted in the basal ganglia, governs rapid automaticity. When language learners pause excessively to translate from their native tongue, their cortical circuits become congested. By engaging in timed speed drills and phonological repetition, students bypass declarative hesitation. As connections strengthen, complex syntax and connected speech phenomena—such as coalescent assimilation and consonant-to-vowel catenation—occur without deliberate effort. Mastery is not merely knowing rules; it is the physical automation of communicative instinct.`,
  },
  {
    id: 'art_b2_01',
    title: 'Resilient Engineering: Local-First Principles in Modern Software',
    cefrLevel: 'B2',
    topic: 'SOFTWARE ENGINEERING',
    totalWords: 210,
    readPercentage: 0,
    createdAt: '2026-09-29T10:00:00Z',
    contentText: `Modern software development is undergoing a paradigm shift towards local-first architecture. For decades, cloud-centric systems dominated the industry, compelling applications to treat local devices as ephemeral terminals. However, contemporary privacy demands and latency constraints have revitalized embedded database engines like SQLite. In a local-first system, data sovereignty belongs unconditionally to the user. Transactions execute instantaneously on the client with zero network round-trip delay. When external cloud services or artificial intelligence APIs experience throttling or unexpected downtime, graceful degradation mechanisms preserve core user workflows. Rather than treating offline states as edge-case exceptions, resilient software treats connectivity as an intermittent enhancement. By combining cryptographic vaults with deterministic domain algorithms, engineers build applications that remain immortal and autonomous.`,
  },
];
