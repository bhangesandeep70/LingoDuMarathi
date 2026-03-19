export interface UserProgress {
  xp: number;
  streak: number;
  completedLessons: string[];
  lastActive: string;
}

export const INITIAL_PROGRESS: UserProgress = {
  xp: 0,
  streak: 0,
  completedLessons: [],
  lastActive: new Date().toISOString(),
};

export const CURRICULUM = [
  {
    id: 'basics-1',
    title: 'ओळख (Basics 1)',
    description: 'साधे शब्द आणि वाक्ये (Simple words and sentences)',
    topic: 'Basic greetings and pronouns',
    level: 'A1 Beginner',
    icon: '👋',
  },
  {
    id: 'basics-2',
    title: 'कुटुंब (Family)',
    description: 'कुटुंबातील सदस्य (Family members)',
    topic: 'Family vocabulary',
    level: 'A1 Beginner',
    icon: '👨‍👩‍👧‍👦',
  },
  {
    id: 'tenses-present',
    title: 'वर्तमानकाळ (Present Tense)',
    description: 'क्रियापदांचे वर्तमानकाळ (German Present Tense)',
    topic: 'German Present Tense (Präsens) conjugation',
    level: 'A1 Elementary',
    icon: '⏳',
  },
  {
    id: 'food',
    title: 'अन्न (Food)',
    description: 'खाद्यपदार्थ आणि पेये (Food and drinks)',
    topic: 'Common food items',
    level: 'A1 Beginner',
    icon: '🍎',
  },
  {
    id: 'grammar-articles',
    title: 'व्याकरण (Articles)',
    description: 'Der, Die, Das आणि Ein, Eine',
    topic: 'German Definite and Indefinite Articles',
    level: 'A1 Elementary',
    icon: '📚',
  },
  {
    id: 'tenses-past',
    title: 'भूतकाळ (Past Tense)',
    description: 'Präteritum आणि Perfekt',
    topic: 'German Past Tenses (Präteritum and Perfekt)',
    level: 'A2 Intermediate',
    icon: '📜',
  },
  {
    id: 'grammar-cases',
    title: 'विभक्ती (Cases)',
    description: 'Nominativ, Akkusativ, Dativ',
    topic: 'German Cases (Nominative, Accusative, Dative)',
    level: 'A2 Intermediate',
    icon: '⚖️',
  },
  {
    id: 'actions-a2',
    title: 'दैनंदिन जीवन (Daily Life)',
    description: 'प्रगत दैनंदिन क्रिया (Advanced daily activities)',
    topic: 'Reflexive verbs and daily routines',
    level: 'A2 Intermediate',
    icon: '🏃',
  },
];
