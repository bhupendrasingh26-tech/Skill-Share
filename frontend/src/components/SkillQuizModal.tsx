
import React, { useState, useEffect } from 'react';
import { generateSkillQuiz } from '../services/geminiService';
import type { QuizQuestion } from '../types';
import { CloseIcon, SparklesIcon, CheckBadgeIcon, XCircleIcon } from './IconComponents';

interface SkillQuizModalProps {
  skill: string;
  onClose: () => void;
  onComplete: (skill: string, passed: boolean) => void;
}

const PASS_THRESHOLD = 0.66; // 2 out of 3 correct

export const SkillQuizModal: React.FC<SkillQuizModalProps> = ({ skill, onClose, onComplete }) => {
  const [quiz, setQuiz] = useState<QuizQuestion[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        setError(null);
        const generatedQuiz = await generateSkillQuiz(skill);
        if (generatedQuiz && generatedQuiz.length > 0) {
          setQuiz(generatedQuiz);
          setAnswers(new Array(generatedQuiz.length).fill(null));
        } else {
          setError(`Could not generate a quiz for "${skill}". Please try another skill.`);
        }
      } catch (e) {
        setError((e as Error).message || 'An unknown error occurred.');
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [skill]);

  const handleAnswerSelect = (optionIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = optionIndex;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (quiz && currentQuestionIndex < quiz.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };
  
  const handleSubmit = () => {
    if (!quiz) return;
    let correctAnswers = 0;
    for (let i = 0; i < quiz.length; i++) {
      if (answers[i] === quiz[i].correctAnswerIndex) {
        correctAnswers++;
      }
    }
    const finalScore = correctAnswers / quiz.length;
    setScore(finalScore);
    setShowResults(true);
  };
  
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center p-12 text-center">
            <SparklesIcon className="w-12 h-12 mb-4 animate-pulse text-indigo-500" />
            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200">Generating Your Quiz...</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-1">AI is preparing questions to test your skills in <span className="font-bold">{skill}</span>.</p>
        </div>
      );
    }
    if (error) {
       return (
        <div className="flex flex-col items-center justify-center p-12 text-center">
            <XCircleIcon className="w-12 h-12 mb-4 text-red-500" />
            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200">Quiz Generation Failed</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-1">{error}</p>
        </div>
      );
    }

    if (showResults) {
        const passed = score >= PASS_THRESHOLD;
        return (
            <div className="text-center p-8">
                {passed ? (
                    <CheckBadgeIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
                ) : (
                    <XCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
                )}
                <h3 className="text-2xl font-bold mb-2 dark:text-slate-100">{passed ? 'Congratulations!' : 'Almost There!'}</h3>
                <p className="text-slate-600 dark:text-slate-300 mb-4">You answered {Math.round(score * 100)}% of the questions correctly.</p>
                {passed ? (
                    <p className="text-green-700 dark:text-green-300 font-semibold bg-green-100 dark:bg-green-900/50 p-3 rounded-lg">Your <span className="font-bold">{skill}</span> skill is now validated!</p>
                ) : (
                    <p className="text-red-700 dark:text-red-300 font-semibold bg-red-100 dark:bg-red-900/50 p-3 rounded-lg">You need {Math.round(PASS_THRESHOLD * 100)}% to pass. Feel free to try again later.</p>
                )}
                <button 
                    onClick={() => onComplete(skill, passed)}
                    className="mt-6 w-full px-4 py-3 text-base font-medium text-white bg-indigo-600 border border-transparent rounded-lg shadow-sm hover:bg-indigo-700"
                >
                    Close
                </button>
            </div>
        )
    }

    if (quiz) {
        const currentQuestion = quiz[currentQuestionIndex];
        const isLastQuestion = currentQuestionIndex === quiz.length - 1;
        return (
            <div className="p-6">
                <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">Question {currentQuestionIndex + 1} of {quiz.length}</p>
                <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mt-2 mb-6">{currentQuestion.question}</h4>
                <div className="space-y-3">
                    {currentQuestion.options.map((option, index) => (
                        <button 
                            key={index}
                            onClick={() => handleAnswerSelect(index)}
                            className={`w-full text-left p-4 rounded-lg border-2 transition-all dark:text-slate-200 ${answers[currentQuestionIndex] === index ? 'bg-indigo-100 border-indigo-500 ring-2 ring-indigo-300 dark:bg-indigo-900/50 dark:border-indigo-500' : 'bg-white border-slate-300 hover:bg-slate-50 dark:bg-slate-700 dark:border-slate-600 dark:hover:bg-slate-600'}`}
                        >
                            {option}
                        </button>
                    ))}
                </div>
                <div className="mt-8 flex justify-end">
                    {isLastQuestion ? (
                        <button 
                            onClick={handleSubmit} 
                            disabled={answers[currentQuestionIndex] === null}
                            className="px-6 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg shadow-sm hover:bg-green-700 disabled:bg-slate-300 dark:disabled:bg-slate-600"
                        >
                            Finish & See Results
                        </button>
                    ) : (
                         <button 
                            onClick={handleNext} 
                            disabled={answers[currentQuestionIndex] === null}
                            className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg shadow-sm hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-600"
                        >
                            Next Question
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return null;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 dark:bg-opacity-80 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-t-2xl">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Validate Your <span className="text-indigo-600 dark:text-indigo-400">{skill}</span> Skill</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100">
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="flex-grow overflow-y-auto">
            {renderContent()}
        </div>
      </div>
    </div>
  );
};