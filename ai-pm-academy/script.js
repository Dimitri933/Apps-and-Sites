document.getElementById("year").textContent = new Date().getFullYear();

const navToggle = document.getElementById("navToggle");
const navLinks = document.getElementById("navLinks");

navToggle.addEventListener("click", () => {
  navLinks.classList.toggle("open");
});

navLinks.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("open");
  });
});

const MODULES = [
  {
    id: 1,
    name: "LLM Foundations",
    lessons: [
      { title: "How LLMs actually generate text", duration: "6 min", desc: "A plain-language walkthrough of next-token prediction, and why that framing explains most LLM product behavior — including hallucination." },
      { title: "Context windows & why they break products", duration: "5 min", desc: "What a context window really limits, why long conversations degrade, and how to spot context-window bugs in a product review." },
      { title: "Fine-tuning vs. prompting vs. RAG", duration: "7 min", desc: "The three levers for changing model behavior, what each one actually costs, and how to pick the right one in a spec review." },
    ],
  },
  {
    id: 2,
    name: "Retrieval-Augmented Generation (RAG)",
    lessons: [
      { title: "RAG architecture end to end", duration: "8 min", desc: "The full pipeline — ingestion, chunking, embedding, retrieval, generation — and where each stage can silently fail." },
      { title: "Chunking & embedding strategy", duration: "6 min", desc: "Why chunk size and overlap decisions quietly determine answer quality, and the trade-offs engineers weigh when choosing them." },
      { title: "Why retrieval quality caps output quality", duration: "5 min", desc: "A mental model for why a great generation model can't fix bad retrieval — and what questions to ask when answers are wrong." },
    ],
  },
  {
    id: 3,
    name: "Evaluating LLM Systems",
    lessons: [
      { title: "Building a golden test set", duration: "7 min", desc: "How to assemble a representative, labeled test set that your evals actually mean something against." },
      { title: "Offline vs. online evals", duration: "5 min", desc: "When to trust pre-launch benchmarks versus live production signals, and how the two catch different failure modes." },
      { title: "Reading an eval report like an engineer", duration: "6 min", desc: "How to interrogate a dashboard of eval metrics instead of taking the top-line score at face value." },
    ],
  },
  {
    id: 4,
    name: "RAGAS & RAG-specific Metrics",
    lessons: [
      { title: "Faithfulness & hallucination detection", duration: "6 min", desc: "What the RAGAS faithfulness metric measures, how it's computed, and where it can be gamed or misread." },
      { title: "Context precision vs. context recall", duration: "6 min", desc: "The difference between retrieving the right chunks and retrieving all the right chunks — and why both matter." },
      { title: "When a high RAGAS score still means a bad product", duration: "7 min", desc: "Real cases where automated metrics looked great while users were unhappy, and how to investigate the gap." },
    ],
  },
  {
    id: 5,
    name: "Prompting & System Design for PMs",
    lessons: [
      { title: "Writing a spec engineers won't rewrite", duration: "6 min", desc: "The technical details a spec needs — model choice, latency budget, fallback behavior — to survive an engineering review." },
      { title: "Guardrails & structured output", duration: "5 min", desc: "How teams constrain LLM output to be safe and parseable, and the trade-offs each guardrail approach makes." },
      { title: "Trade-offs: latency, cost, quality", duration: "6 min", desc: "A framework for making the calls PMs are actually asked to make: faster vs. cheaper vs. better, and when each wins." },
    ],
  },
  {
    id: 6,
    name: "Mock Technical Interviews",
    lessons: [
      { title: "\"Design a RAG system for support tickets\"", duration: "Mock, 20 min", desc: "A timed system-design mock interview. You'll outline an architecture, then compare it against a model answer and scoring rubric." },
      { title: "\"How would you evaluate this chatbot?\"", duration: "Mock, 15 min", desc: "A mock interview on designing an evaluation plan from scratch, scored against what strong interviewers look for." },
      { title: "\"Our RAGAS scores look great but users are unhappy — why?\"", duration: "Mock, 15 min", desc: "A diagnostic-reasoning mock interview testing whether you can bridge a metrics/reality gap under time pressure." },
    ],
  },
];

const allLessons = [];
MODULES.forEach((mod) => {
  mod.lessons.forEach((lesson, i) => {
    allLessons.push({ ...lesson, moduleName: mod.name, moduleId: mod.id, index: i });
  });
});

MODULES.forEach((mod) => {
  const list = document.getElementById(`module-${mod.id}`);
  if (!list) return;
  mod.lessons.forEach((lesson) => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "lesson-btn";
    btn.innerHTML = `<span class="dot"></span> ${lesson.title} <em>${lesson.duration}</em>`;
    btn.addEventListener("click", () => {
      const globalIndex = allLessons.findIndex(
        (l) => l.moduleId === mod.id && l.title === lesson.title
      );
      openLesson(globalIndex);
    });
    li.appendChild(btn);
    list.appendChild(li);
  });
});

const modal = document.getElementById("lessonModal");
const modalVideo = document.getElementById("modalVideo");
const modalModule = document.getElementById("modalModule");
const modalTitle = document.getElementById("lessonModalTitle");
const modalDesc = document.getElementById("modalDesc");
const modalDuration = document.getElementById("modalDuration");
const modalWatched = document.getElementById("modalWatched");
const modalPrev = document.getElementById("modalPrev");
const modalNext = document.getElementById("modalNext");
const modalClose = document.getElementById("modalClose");
const playBtn = document.getElementById("playBtn");
const modalCaptions = document.getElementById("modalCaptions");
const noAudioWarning = document.getElementById("noAudioWarning");

const speechSupported = "speechSynthesis" in window;
if (!speechSupported) noAudioWarning.hidden = false;

let currentIndex = 0;
let currentUtterance = null;
let narrationWords = [];

function stopNarration() {
  if (speechSupported) window.speechSynthesis.cancel();
  modalVideo.classList.remove("playing");
  playBtn.textContent = "▶";
  modalCaptions.textContent = "";
}

function pickVoice() {
  const voices = window.speechSynthesis.getVoices();
  return voices.find((v) => v.lang && v.lang.startsWith("en")) || voices[0] || null;
}

function playNarration(lesson) {
  if (!speechSupported) return;
  window.speechSynthesis.cancel();

  const text = `${lesson.title}. ${lesson.desc}`;
  narrationWords = text.split(/\s+/);
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.98;
  utterance.pitch = 1;
  const voice = pickVoice();
  if (voice) utterance.voice = voice;

  utterance.onstart = () => {
    modalVideo.classList.add("playing");
    playBtn.textContent = "⏸";
  };

  utterance.onboundary = (event) => {
    if (event.name !== "word" && event.charIndex === undefined) return;
    const spokenSoFar = text.slice(0, event.charIndex);
    const wordIndex = spokenSoFar.split(/\s+/).length - 1;
    const start = Math.max(0, wordIndex - 4);
    modalCaptions.textContent = narrationWords.slice(start, wordIndex + 3).join(" ");
  };

  utterance.onend = () => {
    modalVideo.classList.remove("playing");
    playBtn.textContent = "▶";
    modalCaptions.textContent = "";
  };

  utterance.onerror = () => {
    modalVideo.classList.remove("playing");
    playBtn.textContent = "▶";
  };

  currentUtterance = utterance;
  window.speechSynthesis.speak(utterance);
}

function openLesson(index) {
  stopNarration();
  currentIndex = (index + allLessons.length) % allLessons.length;
  const lesson = allLessons[currentIndex];
  modalModule.textContent = `${lesson.moduleName} · Lesson ${lesson.index + 1}`;
  modalTitle.textContent = lesson.title;
  modalDesc.textContent = lesson.desc;
  modalDuration.textContent = lesson.duration;
  modalWatched.checked = false;
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeLesson() {
  stopNarration();
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

modalClose.addEventListener("click", closeLesson);
modal.addEventListener("click", (e) => {
  if (e.target === modal) closeLesson();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modal.classList.contains("open")) closeLesson();
});

modalPrev.addEventListener("click", () => openLesson(currentIndex - 1));
modalNext.addEventListener("click", () => openLesson(currentIndex + 1));

playBtn.addEventListener("click", () => {
  if (!speechSupported) return;
  if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
    window.speechSynthesis.pause();
    modalVideo.classList.remove("playing");
    playBtn.textContent = "▶";
  } else if (window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
    modalVideo.classList.add("playing");
    playBtn.textContent = "⏸";
  } else {
    playNarration(allLessons[currentIndex]);
  }
});

if (speechSupported && typeof window.speechSynthesis.onvoiceschanged !== "undefined") {
  window.speechSynthesis.onvoiceschanged = () => {};
}
