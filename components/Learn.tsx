"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { habits, learningPaths, sources } from "./learn-content";

type LearningView = {
  categoryId: string | null;
  lessonId: string | null;
};

type FocusTarget =
  | { kind: "heading" }
  | { kind: "category"; id: string | null }
  | { kind: "topic"; id: string | null };

type LessonSectionKey = "what" | "how" | "why" | "example";

const control = "rounded-xl border border-emerald-800/60 bg-black/40 px-4 py-3 text-left text-sm font-semibold text-emerald-300 transition-colors hover:border-emerald-400 hover:bg-emerald-950/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:cursor-not-allowed disabled:opacity-40";
const sectionLabels: [LessonSectionKey, string][] = [
  ["what", "What is it?"],
  ["how", "How does it work?"],
  ["why", "Why is it important?"],
  ["example", "Real-world example"],
];

export default function Learn() {
  const [view, setView] = useState<LearningView>({
    categoryId: null,
    lessonId: null,
  });

  const reduceMotion = useReducedMotion();

  const categoryRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const topicRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const panelHeading = useRef<HTMLHeadingElement | null>(null);
  const pendingFocus = useRef<FocusTarget | null>(null);
  const category = learningPaths.find((path) => path.id === view.categoryId);
  const lessonIndex = category?.lessons.findIndex((item) => item.id === view.lessonId) ?? -1;
  const lesson = category?.lessons[lessonIndex];

  useEffect(() => {
    const target = pendingFocus.current;

    if (!target) return;

    let element: HTMLElement | null = null;

    if (target.kind === "category" && target.id) {
      element = categoryRefs.current[target.id] ?? null;
    } else if (target.kind === "topic" && target.id) {
      element = topicRefs.current[target.id] ?? null;
    } else {
      element = panelHeading.current;
    }

    if (element) {
      element.focus({ preventScroll: true });
      element.scrollIntoView({
        block: "nearest",
        behavior: "auto",
      });
    }

    pendingFocus.current = null;
  }, [view]);

  function openCategory(id: string) {
    pendingFocus.current = { kind: "heading" };
    setView({ categoryId: id, lessonId: null });
  }

  function openLesson(id: string) {
    pendingFocus.current = { kind: "heading" };
    setView((current) => ({ ...current, lessonId: id }));
  }

  function backToTopics() {
    pendingFocus.current = { kind: "topic", id: view.lessonId };
    setView((current) => ({ ...current, lessonId: null }));
  }

  function backToCategories() {
    pendingFocus.current = { kind: "category", id: view.categoryId };
    setView({ categoryId: null, lessonId: null });
  }

  return (
    <section
      id="learn"
      className="relative overflow-hidden border-y border-emerald-900/40 px-6 py-24"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(34,211,238,0.08),transparent_28%),radial-gradient(circle_at_80%_70%,rgba(16,185,129,0.10),transparent_30%)]" />

      <div className="relative mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.35em] text-cyan-300">
            NovaGaia Learning
          </p>

          <h2 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
            Learn before you leap.
          </h2>

          <p className="mt-6 text-lg leading-8 text-gray-300">
            Crypto education should help people make better decisions, not
            simply make them more confident. NovaGaia turns research,
            intelligence, and community knowledge into practical learning.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {learningPaths.map((path, index) => (
            <motion.button
              type="button"
              key={path.id}
              ref={(element) => { categoryRefs.current[path.id] = element; }}
              onClick={() => openCategory(path.id)}
              aria-expanded={category?.id === path.id}
              aria-controls="novagaia-learning-panel"
              initial={reduceMotion ? false : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={reduceMotion ? { duration: 0 } : { duration: 0.5, delay: index * 0.06 }}
              whileHover={reduceMotion ? undefined : { y: -6 }}
              className={`w-full rounded-2xl border border-emerald-800/60 bg-black/40 p-7 text-left backdrop-blur-sm transition-colors hover:border-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${category?.id === path.id ? "ring-1 ring-emerald-400" : ""}`}
            >
              <span aria-hidden="true" className="block text-4xl">{path.icon}</span>

              <span className="mt-5 block text-2xl font-bold text-emerald-400">
                {path.title}
              </span>

              <span className="mt-4 block leading-7 text-gray-300">
                {path.description}
              </span>
              <span className="mt-5 block text-sm font-semibold text-cyan-300">
                Explore {path.lessons.length} lessons <span aria-hidden="true">→</span>
              </span>
            </motion.button>
          ))}
        </div>

        <div
          id="novagaia-learning-panel"
          hidden={!category}
          className="mt-10 scroll-mt-6 rounded-2xl border border-emerald-800/60 bg-black/40 p-5 sm:p-8"
        >
          {category && (
            <>
              <nav aria-label="Learning navigation" className="flex flex-wrap gap-3">
                <button type="button" className={control} onClick={backToCategories}>
                  ← All categories
                </button>
                {lesson && (
                  <button type="button" className={control} onClick={backToTopics}>
                    ← Back to {category.title} topics
                  </button>
                )}
              </nav>

              <h3 ref={panelHeading} tabIndex={-1} className="mt-7 break-words text-2xl font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 sm:text-3xl">
                {lesson ? lesson.title : category.title}
              </h3>

              {!lesson ? (
                <>
                  <p className="mt-3 leading-7 text-gray-300">
                    Choose a lesson. All {category.lessons.length} lessons are free to read, with no registration.
                  </p>
                  <ol className="mt-6 grid gap-3 md:grid-cols-2">
                    {category.lessons.map((item, index) => (
                      <li key={item.id} className="min-w-0">
                        <button
                          type="button"
                          ref={(element) => { topicRefs.current[item.id] = element; }}
                          className={`${control} flex h-full w-full items-start gap-3`}
                          onClick={() => openLesson(item.id)}
                        >
                          <span aria-hidden="true" className="text-cyan-300">{index + 1}.</span>
                          <span className="break-words">{item.title}</span>
                        </button>
                      </li>
                    ))}
                  </ol>
                </>
              ) : (
                <article aria-label={lesson.title}>
                  <p className="mt-3 text-sm text-cyan-300">
                    {category.title} · Lesson {lessonIndex + 1} of {category.lessons.length}
                  </p>
                  <div className="mt-8 max-w-3xl space-y-7">
                    {sectionLabels.map(([key, label]) => (
                      <section key={key}>
                        <h4 className="text-lg font-bold text-emerald-400">{label}</h4>
                        <p className="mt-2 break-words leading-8 text-gray-300">{lesson[key]}</p>
                      </section>
                    ))}
                    <section>
                      <h4 className="text-lg font-bold text-emerald-400">What should you do?</h4>
                      <ol className="mt-3 list-decimal space-y-3 pl-6 leading-7 text-gray-300">
                        {lesson.steps.map((step) => <li key={step}>{step}</li>)}
                      </ol>
                    </section>
                    <section className="rounded-xl border border-cyan-500/20 bg-cyan-500/[0.03] p-5">
                      <h4 className="text-lg font-bold text-cyan-300">Key takeaway</h4>
                      <p className="mt-2 leading-7 text-gray-200">{lesson.takeaway}</p>
                    </section>
                    <section>
                      <h4 className="text-lg font-bold text-emerald-400">References & further reading</h4>
                      <p className="mt-2 text-sm leading-6 text-gray-400">
                        These sources support further study. Examples are illustrative. Network-specific details may differ.
                      </p>
                      <ul className="mt-3 space-y-3">
                        {lesson.references.map((key) => (
                          <li key={key}>
                            <a href={sources[key].url} target="_blank" rel="noopener noreferrer" className="break-words text-cyan-300 underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">
                              {sources[key].title}<span className="sr-only"> (opens in a new tab)</span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    </section>
                  </div>
                  <nav aria-label="Lesson navigation" className="mt-10 flex flex-wrap gap-3 border-t border-emerald-900/40 pt-6">
                    <button type="button" className={control} onClick={backToTopics}>← Back to topics</button>
                    <button type="button" className={control} disabled={lessonIndex === 0} onClick={() => {
                      if (lessonIndex > 0) openLesson(category.lessons[lessonIndex - 1].id);
                    }}>← Previous Lesson</button>
                    <button type="button" className={control} disabled={lessonIndex === category.lessons.length - 1} onClick={() => {
                      if (lessonIndex < category.lessons.length - 1) openLesson(category.lessons[lessonIndex + 1].id);
                    }}>Next Lesson →</button>
                  </nav>
                  {lessonIndex === category.lessons.length - 1 && (
                    <p className="mt-4 text-sm leading-6 text-gray-300">End of this category. Return to its topics or choose another category above.</p>
                  )}
                </article>
              )}
            </>
          )}
        </div>

        <aside aria-label="Educational disclaimer" className="mt-8 rounded-xl border border-white/10 bg-black/40 p-5 text-sm leading-7 text-gray-400">
          <p><strong className="text-gray-200">Educational use only.</strong> These lessons provide general information, not personalized financial, investment, legal, or security advice. No lesson, tool, audit, or research process guarantees safety or returns. Crypto assets can lose all value, and transfers may be irreversible. Verify current facts and network-specific rules independently; seek qualified advice for your circumstances. Examples are hypothetical and do not endorse any project or service.</p>
        </aside>

        <div className="mt-14 rounded-3xl border border-cyan-500/20 bg-cyan-500/[0.03] p-8 lg:p-10">
          <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.3em] text-cyan-300">
                The NovaGaia habit
              </p>

              <h3 className="mt-3 text-3xl font-black text-white sm:text-4xl">
                Build knowledge that protects you.
              </h3>

              <p className="mt-5 max-w-2xl leading-7 text-gray-400">
                The goal isn't to predict every move in crypto. It's to
                develop the knowledge and habits needed to recognize risk,
                evaluate information, and make decisions with greater
                awareness.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {habits.map((habit, index) => (
                <div
                  key={habit}
                  className="rounded-xl border border-white/10 bg-black/40 p-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-400 text-sm font-black text-black">
                      {index + 1}
                    </span>

                    <span className="text-sm font-semibold leading-6 text-gray-200">
                      {habit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-gray-500">
            Protect. Research. Learn.
          </p>
        </div>
      </div>
    </section>
  );
}