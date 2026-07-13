import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Cpu, Sparkles, AlertCircle, CheckCircle, Award, RefreshCw, ChevronRight, Laptop, HeartPulse, ShoppingBag, Factory, Lightbulb } from 'lucide-react';

import { translations } from '../translations';

const industryIcons: Record<string, React.ElementType> = {
  tech: Laptop,
  health: HeartPulse,
  retail: ShoppingBag,
  manufacturing: Factory
};

interface CourseSimulatorProps {
  points: number;
  setPoints: React.Dispatch<React.SetStateAction<number>>;
  addSecurityLog: (action: string, status: 'success' | 'warning' | 'info', details: string) => void;
  language: string;
}

export default function CourseSimulator({ points, setPoints, addSecurityLog, language }: CourseSimulatorProps) {
  const [selectedIndustry, setSelectedIndustry] = useState('tech');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(false);

  const intervalRef = useRef<number | null>(null);
  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) clearInterval(intervalRef.current);
    };
  }, []);

  const t = translations[language].simulator;
  const secLogs = translations[language].security.logs;

  const currentIndustry = t.industries[selectedIndustry];
  const activeCourse = activeCourseId ? t.industries[activeCourseId] : null;

  const handleSimulateCourse = () => {
    setIsGenerating(true);
    setGenerationStep(0);
    setSelectedAnswer(null);
    setQuizSubmitted(false);
    setEarnedPoints(false);

    addSecurityLog(
      'COURSE_GEN_REQUEST',
      'info',
      secLogs.courseGenRequest.replace('{sector}', currentIndustry.name)
    );

    // Efeitos colaterais ficam fora do state updater para não serem
    // disparados em dobro pelo StrictMode (que reexecuta updaters em dev).
    let step = 0;
    const interval = window.setInterval(() => {
      step += 1;
      if (step < t.steps.length) {
        setGenerationStep(step);
      } else {
        clearInterval(interval);
        intervalRef.current = null;
        window.setTimeout(() => {
          setIsGenerating(false);
          setActiveCourseId(selectedIndustry);
          addSecurityLog(
            'COURSE_GEN_SUCCESS',
            'success',
            secLogs.courseGenSuccess.replace('{title}', currentIndustry.lesson.title)
          );
        }, 600);
      }
    }, 600);
    intervalRef.current = interval;
  };

  const handleSubmitQuiz = () => {
    if (selectedAnswer === null || !activeCourse) return;
    setQuizSubmitted(true);

    if (selectedAnswer === activeCourse.lesson.quiz.correctIndex) {
      setEarnedPoints(true);
      setPoints(prev => prev + activeCourse.lesson.points);
      addSecurityLog(
        'QUIZ_ANSWER_CORRECT',
        'success',
        secLogs.quizAnswerCorrect.replace('{title}', activeCourse.lesson.title)
      );
    } else {
      addSecurityLog(
        'QUIZ_ANSWER_INCORRECT',
        'warning',
        secLogs.quizAnswerIncorrect.replace('{title}', activeCourse.lesson.title)
      );
    }
  };

  return (
    <section id="course-simulator" className="py-24 bg-slate-50 border-t border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: AI Config & Simulator Controls */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200/60 text-slate-500 px-3 py-1 rounded-full text-xs font-medium">
              <Cpu className="w-3.5 h-3.5 text-purple-500" />
              <span>{t.badge}</span>
            </div>
            
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900 text-balance">
              {t.title}
            </h2>
            
            <p className="text-slate-500 leading-relaxed">
              {t.desc}
            </p>

            {/* Select Industry */}
            <div className="space-y-3">
              <label className="block text-xs font-medium text-slate-500">
                {t.labelSelectSector}
              </label>
              
              <div className="grid grid-cols-2 gap-3">
                {Object.values(t.industries).map((ind) => (
                  <button
                    key={ind.id}
                    onClick={() => {
                      if (!isGenerating) setSelectedIndustry(ind.id);
                    }}
                    className={`p-4 rounded-xl text-left border transition-colors cursor-pointer flex flex-col justify-between h-24 ${
                      selectedIndustry === ind.id
                        ? 'border-slate-900 bg-slate-50 text-slate-900'
                        : 'border-slate-200/60 hover:border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    {(() => {
                      const IndustryIcon = industryIcons[ind.id] || Laptop;
                      return <IndustryIcon className={`w-5 h-5 ${selectedIndustry === ind.id ? 'text-slate-900' : 'text-slate-400'}`} />;
                    })()}
                    <div>
                      <span className="block font-medium text-xs">{ind.name}</span>
                      <span className="text-xs text-slate-400 block line-clamp-1">{ind.tagline}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Action */}
            <button
              type="button"
              disabled={isGenerating}
              onClick={handleSimulateCourse}
              className="w-full font-sans text-sm font-medium text-white py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{t.btnSimulating}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{t.btnSimulate}</span>
                </>
              )}
            </button>
          </div>

          {/* Right Column: Visual Interactive Output Area */}
          <div className="lg:col-span-7">
            <div className="bg-slate-50 rounded-2xl p-6 md:p-8 border border-slate-200/60 min-h-[420px] flex flex-col justify-center relative overflow-hidden">
              
              {/* Default Welcome State */}
              {!isGenerating && !activeCourse && (
                <div className="text-center space-y-4 max-w-sm mx-auto">
                  <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200/60 flex items-center justify-center mx-auto">
                    <Lightbulb className="w-7 h-7 text-slate-400" />
                  </div>
                  <h3 className="font-display text-lg font-semibold tracking-tight text-slate-900">
                    {t.placeholderTitle}
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {t.placeholderDesc}
                  </p>
                  <div className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-white border border-slate-200/60 px-3 py-1.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>Multi-tenant Isolation Active</span>
                  </div>
                </div>
              )}

              {/* Generating Animation State */}
              {isGenerating && (
                <div className="space-y-6 max-w-md mx-auto w-full">
                  <div className="flex justify-between items-center text-xs font-medium text-slate-400">
                    <span>COGNITIVE ENGINE ACTIVE</span>
                    <span className="text-slate-900 font-semibold">{Math.round(((generationStep + 1) / t.steps.length) * 100)}%</span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-slate-900 transition-all duration-300 ease-out"
                      style={{ width: `${((generationStep + 1) / t.steps.length) * 100}%` }}
                    ></div>
                  </div>

                  {/* Steps list */}
                  <div className="space-y-2.5 font-mono text-xs">
                    {t.steps.map((step, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center space-x-2 transition-all duration-300 ${
                          idx <= generationStep ? 'text-slate-700 font-medium' : 'text-slate-300'
                        }`}
                      >
                        {idx < generationStep ? (
                          <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                        ) : idx === generationStep ? (
                          <RefreshCw className="w-4 h-4 text-slate-500 animate-spin shrink-0" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0"></div>
                        )}
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Active Quiz Course State */}
              {!isGenerating && activeCourse && (
                <div className="space-y-6 w-full">
                  
                  {/* Course Header */}
                  <div className="flex items-start justify-between border-b border-slate-200/60 pb-4">
                    <div>
                      <span className="inline-block text-xs font-medium text-slate-500 bg-white border border-slate-200/60 px-2.5 py-0.5 rounded-full mb-1.5">
                        {t.badgeGenerated}
                      </span>
                      <h3 className="font-display text-xl font-semibold tracking-tight text-slate-900 text-balance">
                        {activeCourse.lesson.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1 text-emerald-700 font-mono text-xs font-semibold bg-white border border-slate-200/60 px-3 py-1.5 rounded-full shrink-0">
                      <Award className="w-3.5 h-3.5 text-emerald-600" />
                      <span>+{activeCourse.lesson.points} Pts</span>
                    </div>
                  </div>

                  {/* Lesson Content Box */}
                  <div className="bg-white rounded-xl p-5 border border-slate-200/60 text-sm text-slate-600 leading-relaxed">
                    {activeCourse.lesson.content}
                  </div>

                  {/* Quiz Section */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-slate-400" />
                      <span>{t.titleQuiz}</span>
                    </h4>
                    <p className="text-sm text-slate-600 leading-relaxed font-medium">
                      {activeCourse.lesson.quiz.question}
                    </p>

                    {/* Options Grid */}
                    <div className="space-y-2.5" style={{ perspective: '1000px' }}>
                      {activeCourse.lesson.quiz.options.map((opt, idx) => {
                        const isCorrect = idx === activeCourse.lesson.quiz.correctIndex;
                        const isSelected = selectedAnswer === idx;

                        let frontStyle = 'border-slate-200/60 hover:border-slate-300 bg-white text-slate-700';
                        if (isSelected) {
                          frontStyle = 'border-slate-900 bg-slate-50 text-slate-900';
                        }

                        let backStyle = '';
                        if (isCorrect) {
                          backStyle = 'border-emerald-300 bg-emerald-50/80 text-emerald-950 font-medium';
                        } else if (isSelected) {
                          backStyle = 'border-red-300 bg-red-50/80 text-red-950';
                        } else {
                          backStyle = 'border-slate-100 bg-slate-50 text-slate-400 opacity-60';
                        }

                        return (
                          <div 
                            key={idx}
                            className="relative w-full min-h-[50px]"
                          >
                            <motion.div
                              initial={false}
                              animate={{ rotateY: quizSubmitted ? 180 : 0 }}
                              transition={{ 
                                type: 'spring', 
                                stiffness: 90, 
                                damping: 14, 
                                mass: 1,
                                delay: idx * 0.08 
                              }}
                              style={{ transformStyle: 'preserve-3d' }}
                              className="w-full relative"
                            >
                              {/* Front Side */}
                              <button
                                type="button"
                                disabled={quizSubmitted}
                                onClick={() => setSelectedAnswer(idx)}
                                style={{ backfaceVisibility: 'hidden' }}
                                className={`w-full text-left p-3.5 rounded-xl border text-xs transition-all cursor-pointer flex items-start space-x-2.5 ${frontStyle}`}
                              >
                                <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 shrink-0">
                                  {String.fromCharCode(65 + idx)}
                                </span>
                                <span className="flex-1">{opt}</span>
                              </button>

                              {/* Back Side */}
                              <div
                                style={{ 
                                  backfaceVisibility: 'hidden', 
                                  transform: 'rotateY(180deg)' 
                                }}
                                className={`absolute inset-0 w-full h-full text-left p-3.5 rounded-xl border text-xs flex items-start space-x-2.5 ${backStyle}`}
                              >
                                <span className="font-mono text-xs bg-white/80 border border-slate-200/60 px-1.5 py-0.5 rounded shrink-0 text-slate-500">
                                  {String.fromCharCode(65 + idx)}
                                </span>
                                <span className="flex-1 text-slate-700 pr-16 leading-relaxed">
                                  {opt}
                                </span>
                                
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center shrink-0">
                                  {isCorrect && (
                                    <span className="text-xs font-medium text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-md">
                                      {language === 'PT-BR' ? 'Correto' : language === 'EN-US' ? 'Correct' : 'Correcto'}
                                    </span>
                                  )}
                                  {!isCorrect && isSelected && (
                                    <span className="text-xs font-medium text-red-700 bg-red-100 px-2.5 py-1 rounded-md">
                                      {language === 'PT-BR' ? 'Incorreto' : language === 'EN-US' ? 'Incorrect' : 'Incorrecto'}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Submit / Response Bar */}
                  <div className="pt-3 flex justify-between items-center border-t border-slate-200/60">
                    {!quizSubmitted ? (
                      <>
                        <span className="text-xs text-slate-400">{t.infoSelectAnswer}</span>
                        <button
                          type="button"
                          disabled={selectedAnswer === null}
                          onClick={handleSubmitQuiz}
                          className={`px-5 py-2.5 rounded-xl text-xs font-medium font-sans flex items-center gap-1 cursor-pointer transition-colors ${
                            selectedAnswer === null
                              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                              : 'bg-slate-900 hover:bg-slate-800 text-white'
                          }`}
                        >
                          <span>{t.btnConfirm}</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <div className="w-full flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center space-x-2 text-xs font-semibold">
                          {earnedPoints ? (
                            <>
                              <span className="text-emerald-700 bg-emerald-100 px-2 py-1 rounded-md">{t.correctTitle}</span>
                              <span className="text-slate-500">{t.correctPoints}</span>
                            </>
                          ) : (
                            <>
                              <span className="text-red-700 bg-red-100 px-2 py-1 rounded-md">{t.incorrectTitle}</span>
                              <span className="text-slate-500">{t.incorrectText}</span>
                            </>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={handleSimulateCourse}
                          className="px-4 py-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-xl text-xs font-medium transition-colors cursor-pointer"
                        >
                          {t.btnGenerateOther}
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              )}

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
