/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, 
  BookOpen, 
  Trophy, 
  User, 
  Settings, 
  Volume2, 
  CheckCircle2, 
  XCircle, 
  ChevronRight,
  Flame,
  Star,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { cn } from './lib/utils';
import { generateLesson, getSpeech, type Lesson, type Exercise } from './services/geminiService';
import { CURRICULUM, INITIAL_PROGRESS, type UserProgress } from './constants';

// --- Components ---

const ProgressBar = ({ progress }: { progress: number }) => (
  <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden">
    <motion.div 
      className="h-full bg-duo-green"
      initial={{ width: 0 }}
      animate={{ width: `${progress}%` }}
      transition={{ duration: 0.5 }}
    />
  </div>
);

const ExerciseCard = ({ 
  exercise, 
  onAnswer, 
  isCorrect, 
  isWrong,
  selectedOption 
}: { 
  exercise: Exercise; 
  onAnswer: (answer: string) => void;
  isCorrect: boolean | null;
  isWrong: boolean | null;
  selectedOption: string | null;
}) => {
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [availableWords, setAvailableWords] = useState<string[]>([]);
  
  // Matching state
  const [leftWords, setLeftWords] = useState<{word: string, id: string}[]>([]);
  const [rightWords, setRightWords] = useState<{word: string, id: string}[]>([]);
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<string[]>([]);

  useEffect(() => {
    if (exercise.type === 'word-order' && exercise.options) {
      setAvailableWords([...exercise.options]);
      setSelectedWords([]);
    }
    if (exercise.type === 'matching' && exercise.options) {
      const pairs = exercise.options.map(o => o.split(':'));
      const left = pairs.map(p => ({ word: p[0], id: p[0] })).sort(() => Math.random() - 0.5);
      const right = pairs.map(p => ({ word: p[1], id: p[0] })).sort(() => Math.random() - 0.5);
      setLeftWords(left);
      setRightWords(right);
      setMatchedPairs([]);
      setSelectedLeft(null);
      setSelectedRight(null);
    }
  }, [exercise]);

  const playAudio = async () => {
    if (exercise.audioText) {
      const result = await getSpeech(exercise.audioText);
      if (result) {
        const audio = new Audio(`data:${result.mimeType};base64,${result.data}`);
        audio.play().catch(err => console.error("Audio playback failed:", err));
      }
    }
  };

  const handleWordClick = (word: string, index: number) => {
    if (isCorrect !== null) return;
    const newAvailable = [...availableWords];
    newAvailable.splice(index, 1);
    setAvailableWords(newAvailable);
    setSelectedWords([...selectedWords, word]);
  };

  const removeWord = (index: number) => {
    if (isCorrect !== null) return;
    const word = selectedWords[index];
    const newSelected = [...selectedWords];
    newSelected.splice(index, 1);
    setSelectedWords(newSelected);
    setAvailableWords([...availableWords, word]);
  };

  const handleMatch = (id: string, side: 'left' | 'right') => {
    if (isCorrect !== null) return;
    if (matchedPairs.includes(id)) return;

    if (side === 'left') {
      if (selectedLeft === id) setSelectedLeft(null);
      else setSelectedLeft(id);
    } else {
      if (selectedRight === id) setSelectedRight(null);
      else setSelectedRight(id);
    }
  };

  useEffect(() => {
    if (selectedLeft && selectedRight) {
      if (selectedLeft === selectedRight) {
        const newMatched = [...matchedPairs, selectedLeft];
        setMatchedPairs(newMatched);
        setSelectedLeft(null);
        setSelectedRight(null);
        
        if (newMatched.length === leftWords.length) {
          onAnswer("MATCHED_ALL");
        }
      } else {
        // Wrong match
        const timer = setTimeout(() => {
          setSelectedLeft(null);
          setSelectedRight(null);
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [selectedLeft, selectedRight, matchedPairs, leftWords, onAnswer]);

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-slate-800">{exercise.question}</h2>
        {exercise.marathiContext && (
          <p className="text-slate-500 italic">({exercise.marathiContext})</p>
        )}
      </div>

      {exercise.audioText && (
        <button 
          onClick={playAudio}
          className="p-4 bg-duo-blue text-white rounded-2xl shadow-[0_4px_0_0_#1899d6] active:translate-y-1 active:shadow-none transition-all"
        >
          <Volume2 className="w-8 h-8" />
        </button>
      )}

      {exercise.type === 'word-order' ? (
        <div className="space-y-8">
          {/* Selected Words Area */}
          <div className="min-h-[80px] p-4 border-b-2 border-slate-200 flex flex-wrap gap-2 items-center">
            {selectedWords.map((word, idx) => (
              <button
                key={idx}
                onClick={() => removeWord(idx)}
                className="px-4 py-2 bg-white border-2 border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 transition-all font-medium"
              >
                {word}
              </button>
            ))}
          </div>

          {/* Available Words Area */}
          <div className="flex flex-wrap gap-3 justify-center">
            {availableWords.map((word, idx) => (
              <button
                key={idx}
                disabled={isCorrect !== null}
                onClick={() => handleWordClick(word, idx)}
                className="px-4 py-2 bg-white border-2 border-slate-200 rounded-xl shadow-[0_2px_0_0_#e2e8f0] active:translate-y-0.5 active:shadow-none hover:bg-slate-50 transition-all font-medium"
              >
                {word}
              </button>
            ))}
          </div>

          {/* Submit Button for Word Order */}
          <div className="flex justify-center pt-4">
            <button
              disabled={selectedWords.length === 0 || isCorrect !== null}
              onClick={() => onAnswer(selectedWords.join(' '))}
              className={cn(
                "px-8 py-3 rounded-xl font-bold text-white transition-all",
                selectedWords.length > 0 ? "bg-duo-blue shadow-[0_4px_0_0_#1899d6] active:translate-y-1 active:shadow-none" : "bg-slate-200 cursor-not-allowed"
              )}
            >
              तपासा (CHECK)
            </button>
          </div>
        </div>
      ) : exercise.type === 'matching' ? (
        exercise.options && exercise.options.length > 0 ? (
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-3">
              {leftWords.map((item) => (
                <button
                  key={item.id}
                  disabled={matchedPairs.includes(item.id) || isCorrect !== null}
                  onClick={() => handleMatch(item.id, 'left')}
                  className={cn(
                    "w-full p-4 text-center font-bold border-2 rounded-2xl transition-all",
                    matchedPairs.includes(item.id) ? "bg-slate-100 text-slate-300 border-slate-100" : 
                    selectedLeft === item.id ? "bg-blue-50 border-duo-blue text-duo-blue" : "bg-white border-slate-200 hover:bg-slate-50"
                  )}
                >
                  {item.word}
                </button>
              ))}
            </div>
            <div className="space-y-3">
              {rightWords.map((item, idx) => (
                <button
                  key={idx}
                  disabled={matchedPairs.includes(item.id) || isCorrect !== null}
                  onClick={() => handleMatch(item.id, 'right')}
                  className={cn(
                    "w-full p-4 text-center font-bold border-2 rounded-2xl transition-all",
                    matchedPairs.includes(item.id) ? "bg-slate-100 text-slate-300 border-slate-100" : 
                    selectedRight === item.id ? "bg-blue-50 border-duo-blue text-duo-blue" : "bg-white border-slate-200 hover:bg-slate-50"
                  )}
                >
                  {item.word}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
            पर्याय उपलब्ध नाहीत. कृपया पुन्हा प्रयत्न करा. (Options missing. Please try again.)
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {exercise.options && exercise.options.length > 0 ? (
            exercise.options.map((option, idx) => (
              <button
                key={idx}
                disabled={isCorrect !== null}
                onClick={() => onAnswer(option)}
                className={cn(
                  "p-4 text-left text-lg font-medium border-2 rounded-2xl transition-all",
                  "hover:bg-slate-50 border-slate-200 shadow-[0_4px_0_0_#e2e8f0]",
                  selectedOption === option && "border-duo-blue bg-blue-50 shadow-[0_4px_0_0_#1cb0f6]",
                  isCorrect && selectedOption === option && "border-duo-green bg-green-50 shadow-[0_4px_0_0_#58cc02]",
                  isWrong && selectedOption === option && "border-duo-red bg-red-50 shadow-[0_4px_0_0_#ff4b4b]"
                )}
              >
                <span className="mr-4 text-slate-400">{idx + 1}</span>
                {option}
              </button>
            ))
          ) : exercise.type !== 'translate' ? (
            <div className="p-8 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
              पर्याय उपलब्ध नाहीत. कृपया पुन्हा प्रयत्न करा. (Options missing. Please try again.)
            </div>
          ) : null}
        </div>
      )}

      {exercise.type === 'translate' && (
        <div className="space-y-4">
          <input 
            type="text"
            placeholder="येथे लिहा..."
            className="w-full p-4 text-lg border-2 border-slate-200 rounded-2xl focus:border-duo-blue outline-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter') onAnswer((e.target as HTMLInputElement).value);
            }}
          />
        </div>
      )}
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [view, setView] = useState<'dashboard' | 'lesson' | 'profile'>('dashboard');
  const [progress, setProgress] = useState<UserProgress>(() => {
    const saved = localStorage.getItem('lingo_marathi_progress');
    return saved ? JSON.parse(saved) : INITIAL_PROGRESS;
  });
  
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isWrong, setIsWrong] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem('lingo_marathi_progress', JSON.stringify(progress));
  }, [progress]);

  const startLesson = async (lessonId: string) => {
    const lessonMeta = CURRICULUM.find(l => l.id === lessonId);
    if (!lessonMeta) return;

    setLoading(true);
    try {
      const lesson = await generateLesson(lessonMeta.topic, lessonMeta.level);
      setCurrentLesson(lesson);
      setExerciseIndex(0);
      setView('lesson');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (answer: string) => {
    if (!currentLesson) return;
    const exercise = currentLesson.exercises[exerciseIndex];
    setSelectedOption(answer);

    const isAnswerCorrect = answer.toLowerCase().trim() === exercise.correctAnswer.toLowerCase().trim();
    
    if (isAnswerCorrect) {
      setIsCorrect(true);
      setIsWrong(false);
    } else {
      setIsCorrect(false);
      setIsWrong(true);
    }
  };

  const nextExercise = () => {
    if (!currentLesson) return;
    
    if (exerciseIndex < currentLesson.exercises.length - 1) {
      setExerciseIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsCorrect(null);
      setIsWrong(null);
    } else {
      // Lesson Complete
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });
      
      const newXp = progress.xp + 10;
      const completed = Array.from(new Set([...progress.completedLessons, currentLesson.id]));
      
      setProgress(prev => ({
        ...prev,
        xp: newXp,
        completedLessons: completed,
        lastActive: new Date().toISOString()
      }));
      
      setView('dashboard');
      setCurrentLesson(null);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center space-y-4 bg-white">
        <Loader2 className="w-12 h-12 text-duo-blue animate-spin" />
        <p className="text-xl font-bold text-slate-600 font-display">तुमचा धडा तयार होत आहे...</p>
        <p className="text-slate-400">Preparing your lesson...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Sidebar / Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 md:top-0 md:bottom-0 md:w-64 bg-white border-t md:border-t-0 md:border-r border-slate-200 z-50 p-4">
        <div className="hidden md:flex items-center space-x-2 mb-12 px-4">
          <div className="w-10 h-10 bg-duo-green rounded-xl flex items-center justify-center text-white font-bold text-2xl">L</div>
          <span className="text-2xl font-bold text-duo-green font-display">LingoMarathi</span>
        </div>

        <div className="flex md:flex-col justify-around md:justify-start md:space-y-2">
          {[
            { id: 'dashboard', icon: Home, label: 'शिकणे', en: 'Learn' },
            { id: 'profile', icon: User, label: 'प्रोफाइल', en: 'Profile' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id as any)}
              className={cn(
                "flex flex-col md:flex-row items-center md:space-x-4 p-3 rounded-xl transition-all",
                view === item.id ? "bg-blue-50 text-duo-blue border-2 border-duo-blue" : "text-slate-500 hover:bg-slate-50"
              )}
            >
              <item.icon className="w-6 h-6" />
              <div className="flex flex-col items-start">
                <span className="text-xs md:text-base font-bold">{item.label}</span>
                <span className="hidden md:block text-[10px] opacity-60 uppercase tracking-wider">{item.en}</span>
              </div>
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="pb-24 md:pb-0 md:pl-64">
        <AnimatePresence mode="wait">
          {view === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto p-6 space-y-12"
            >
              {/* Header Stats */}
              <div className="flex items-center justify-between bg-white sticky top-0 z-40 py-4 border-b border-slate-100">
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2 text-duo-orange font-bold">
                    <Flame className="w-6 h-6 fill-current" />
                    <span>{progress.streak}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-duo-blue font-bold">
                    <Star className="w-6 h-6 fill-current" />
                    <span>{progress.xp} XP</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <img src="https://flagcdn.com/de.svg" className="w-8 h-6 rounded shadow-sm" alt="German" />
                  <span className="font-bold text-slate-600">GERMAN</span>
                </div>
              </div>

              {/* Learning Path */}
              <div className="flex flex-col items-center space-y-12 py-12">
                {CURRICULUM.map((lesson, idx) => {
                  const isCompleted = progress.completedLessons.includes(lesson.id);
                  const isUnlocked = true; // All lessons are now unlocked by default
                  
                  return (
                    <div key={lesson.id} className="relative flex flex-col items-center group">
                      <button
                        onClick={() => startLesson(lesson.id)}
                        className={cn(
                          "w-20 h-20 rounded-full flex items-center justify-center text-3xl transition-all relative z-10",
                          isCompleted ? "path-node-completed" : "path-node-active"
                        )}
                      >
                        {lesson.icon}
                        {!isCompleted && (
                          <div className="absolute -top-12 bg-white border-2 border-slate-200 px-4 py-2 rounded-xl shadow-sm whitespace-nowrap animate-bounce">
                            <span className="font-bold text-duo-blue">सुरू करा!</span>
                          </div>
                        )}
                      </button>
                      
                      <div className="mt-4 text-center">
                        <h3 className="font-bold text-slate-800">{lesson.title}</h3>
                        <p className="text-xs text-slate-400">{lesson.description}</p>
                      </div>

                      {idx < CURRICULUM.length - 1 && (
                        <div className={cn(
                          "absolute top-20 w-1 h-12 -z-0",
                          isCompleted ? "bg-duo-green" : "bg-slate-200"
                        )} />
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {view === 'lesson' && currentLesson && (
            <motion.div 
              key="lesson"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 bg-white z-[100] flex flex-col"
            >
              <div className="p-6 flex items-center space-x-4 border-b border-slate-100">
                <button onClick={() => setView('dashboard')} className="text-slate-400 hover:text-slate-600">
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <ProgressBar progress={((exerciseIndex + 1) / currentLesson.exercises.length) * 100} />
              </div>

              <div className="flex-1 overflow-y-auto">
                <ExerciseCard 
                  exercise={currentLesson.exercises[exerciseIndex]}
                  onAnswer={handleAnswer}
                  isCorrect={isCorrect}
                  isWrong={isWrong}
                  selectedOption={selectedOption}
                />
              </div>

              {/* Feedback Footer */}
              <AnimatePresence>
                {(isCorrect !== null || isWrong !== null) && (
                  <motion.div 
                    initial={{ y: 100 }}
                    animate={{ y: 0 }}
                    exit={{ y: 100 }}
                    className={cn(
                      "p-8 border-t-2 flex items-center justify-between",
                      isCorrect ? "bg-green-50 border-duo-green" : "bg-red-50 border-duo-red"
                    )}
                  >
                    <div className="flex items-center space-x-4">
                      {isCorrect ? (
                        <CheckCircle2 className="w-12 h-12 text-duo-green" />
                      ) : (
                        <XCircle className="w-12 h-12 text-duo-red" />
                      )}
                      <div>
                        <h4 className={cn("text-xl font-bold", isCorrect ? "text-duo-green" : "text-duo-red")}>
                          {isCorrect ? "छान! (Excellent!)" : "चूक! (Incorrect!)"}
                        </h4>
                        {!isCorrect && (
                          <p className="text-duo-red opacity-80">
                            योग्य उत्तर: {currentLesson.exercises[exerciseIndex].correctAnswer}
                          </p>
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={nextExercise}
                      className={cn(
                        "px-12 py-4 rounded-2xl text-white font-bold text-lg shadow-md active:translate-y-1 transition-all",
                        isCorrect ? "bg-duo-green shadow-[0_4px_0_0_#46a302]" : "bg-duo-red shadow-[0_4px_0_0_#d13e3e]"
                      )}
                    >
                      पुढील (NEXT)
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {view === 'profile' && (
            <motion.div 
              key="profile"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="max-w-2xl mx-auto p-6 space-y-8"
            >
              <div className="flex items-center space-x-6 p-8 bg-slate-50 rounded-3xl border-2 border-slate-200">
                <div className="w-24 h-24 bg-duo-blue rounded-full flex items-center justify-center text-white text-4xl font-bold">
                  {progress.xp > 0 ? '🏆' : '👤'}
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-slate-800">विद्यार्थी (Student)</h2>
                  <p className="text-slate-500">Joined March 2026</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 border-2 border-slate-200 rounded-2xl flex items-center space-x-4">
                  <Flame className="w-8 h-8 text-duo-orange" />
                  <div>
                    <div className="text-2xl font-bold">{progress.streak}</div>
                    <div className="text-xs text-slate-400 uppercase font-bold">दिवस (Streak)</div>
                  </div>
                </div>
                <div className="p-6 border-2 border-slate-200 rounded-2xl flex items-center space-x-4">
                  <Star className="w-8 h-8 text-duo-blue" />
                  <div>
                    <div className="text-2xl font-bold">{progress.xp}</div>
                    <div className="text-xs text-slate-400 uppercase font-bold">एकूण XP (Total XP)</div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-bold text-slate-800">उपलब्धी (Achievements)</h3>
                <div className="grid grid-cols-3 gap-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className={cn(
                      "aspect-square rounded-2xl border-2 flex flex-col items-center justify-center p-4 text-center",
                      progress.completedLessons.length >= i ? "border-duo-yellow bg-yellow-50" : "border-slate-100 bg-slate-50 opacity-50"
                    )}>
                      <div className="text-3xl mb-2">🏅</div>
                      <div className="text-[10px] font-bold uppercase">Level {i}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
