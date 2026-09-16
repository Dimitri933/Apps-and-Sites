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
const modalBox = document.getElementById("modalBox");
const modalVideo = document.getElementById("modalVideo");
const modalModule = document.getElementById("modalModule");
const modalTitle = document.getElementById("lessonModalTitle");
const modalDesc = document.getElementById("modalDesc");
const modalDuration = document.getElementById("modalDuration");
const modalWatched = document.getElementById("modalWatched");
const modalPrev = document.getElementById("modalPrev");
const modalNext = document.getElementById("modalNext");
const modalClose = document.getElementById("modalClose");
const modalSize = document.getElementById("modalSize");
const modalFullscreen = document.getElementById("modalFullscreen");
const modalTextOnly = document.getElementById("modalTextOnly");
const playBtn = document.getElementById("playBtn");
const modalCaptions = document.getElementById("modalCaptions");
const noAudioWarning = document.getElementById("noAudioWarning");
const voiceSelect = document.getElementById("voiceSelect");

const speechSupported = "speechSynthesis" in window;
if (!speechSupported) noAudioWarning.hidden = false;

let currentIndex = 0;
let currentUtterance = null;
let selectedVoiceURI = null;

const SIZES = ["", "size-large", "size-xl"];
let sizeIndex = 0;

modalSize.addEventListener("click", () => {
  modalBox.classList.remove(...SIZES.filter(Boolean));
  sizeIndex = (sizeIndex + 1) % SIZES.length;
  if (SIZES[sizeIndex]) modalBox.classList.add(SIZES[sizeIndex]);
});

modalFullscreen.addEventListener("click", () => {
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else if (modalBox.requestFullscreen) {
    modalBox.requestFullscreen();
  }
});

document.addEventListener("fullscreenchange", () => {
  modalBox.classList.toggle("fullscreen-active", document.fullscreenElement === modalBox);
});

modalTextOnly.addEventListener("click", () => {
  const isTextOnly = modalBox.classList.toggle("text-only");
  modalTextOnly.classList.toggle("active", isTextOnly);
  if (isTextOnly) stopNarration();
});

let sortedVoices = [];
const brokenVoiceURIs = new Set();

function populateVoices() {
  if (!speechSupported) return;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return;

  // Local (on-device) voices work reliably offline; remote/network voices
  // often silently fail depending on the browser and embedding context, so
  // they're ranked after local ones even if their names sound "nicer".
  const rank = (v) => {
    if (!v.localService) return 2;
    return /natural|neural|enhanced|premium/i.test(v.name) ? 0 : v.lang.startsWith("en") ? 1 : 1.5;
  };
  sortedVoices = [...voices].sort((a, b) => rank(a) - rank(b));

  voiceSelect.innerHTML = "";
  sortedVoices.forEach((v) => {
    const opt = document.createElement("option");
    opt.value = v.voiceURI;
    const tag = v.localService ? "" : " ⚠ needs network";
    opt.textContent = `${v.name} (${v.lang})${tag}`;
    voiceSelect.appendChild(opt);
  });

  if (!selectedVoiceURI || !sortedVoices.some((v) => v.voiceURI === selectedVoiceURI)) {
    selectedVoiceURI = sortedVoices[0].voiceURI;
  }
  voiceSelect.value = selectedVoiceURI;
}

voiceSelect.addEventListener("change", () => {
  selectedVoiceURI = voiceSelect.value;
  brokenVoiceURIs.delete(selectedVoiceURI);
});

if (speechSupported) {
  populateVoices();
  window.speechSynthesis.onvoiceschanged = populateVoices;
}

function stopNarration() {
  clearTimeout(startTimer);
  clearInterval(watchdogInterval);
  if (speechSupported) window.speechSynthesis.cancel();
  modalVideo.classList.remove("playing");
  playBtn.textContent = "▶";
  modalCaptions.textContent = "";
}

function candidateVoices() {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return [null];
  const preferred = voices.find((v) => v.voiceURI === selectedVoiceURI);
  const fallbacks = sortedVoices.length ? sortedVoices : voices;
  const ordered = [preferred, ...fallbacks].filter(
    (v, i, arr) => v && !brokenVoiceURIs.has(v.voiceURI) && arr.findIndex((x) => x && x.voiceURI === v.voiceURI) === i
  );
  ordered.push(null); // last resort: browser default voice
  return ordered;
}

let startTimer = null;
let watchdogInterval = null;
let sentenceQueue = [];
let sentenceIndex = 0;

function splitSentences(text) {
  return (text.match(/[^.!?]+[.!?]*/g) || [text]).map((s) => s.trim()).filter(Boolean);
}

// Many speech engines (notably Chrome) silently stop mid-narration on long
// utterances. Nudging pause/resume periodically, plus speaking one sentence
// at a time, keeps the engine's internal queue from stalling.
function startWatchdog() {
  clearInterval(watchdogInterval);
  watchdogInterval = setInterval(() => {
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      window.speechSynthesis.resume();
    }
  }, 10000);
}

function stopWatchdog() {
  clearInterval(watchdogInterval);
  watchdogInterval = null;
}

function finishNarration() {
  clearTimeout(startTimer);
  stopWatchdog();
  modalVideo.classList.remove("playing");
  playBtn.textContent = "▶";
  modalCaptions.textContent = "";
}

function speakAttempt(voiceQueue, queueIndex) {
  const sentence = sentenceQueue[sentenceIndex];

  if (queueIndex >= voiceQueue.length) {
    modalCaptions.textContent = "Audio isn't available on this device/browser — try Text Only above.";
    finishNarration();
    return;
  }

  const voice = voiceQueue[queueIndex];
  const utterance = new SpeechSynthesisUtterance(sentence);
  utterance.rate = 0.98;
  utterance.pitch = 1;
  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang;
  }

  let started = false;

  utterance.onstart = () => {
    started = true;
    clearTimeout(startTimer);
    modalVideo.classList.add("playing");
    playBtn.textContent = "⏸";
    modalCaptions.textContent = sentence;
  };

  utterance.onend = () => {
    clearTimeout(startTimer);
    sentenceIndex += 1;
    if (sentenceIndex >= sentenceQueue.length) {
      finishNarration();
    } else {
      speakAttempt(voiceQueue, 0);
    }
  };

  utterance.onerror = () => {
    clearTimeout(startTimer);
    if (voice) brokenVoiceURIs.add(voice.voiceURI);
    speakAttempt(voiceQueue, queueIndex + 1);
  };

  currentUtterance = utterance;
  window.speechSynthesis.speak(utterance);

  clearTimeout(startTimer);
  startTimer = setTimeout(() => {
    if (!started) {
      window.speechSynthesis.cancel();
      if (voice) brokenVoiceURIs.add(voice.voiceURI);
      speakAttempt(voiceQueue, queueIndex + 1);
    }
  }, 1500);
}

function playNarration(lesson) {
  if (!speechSupported) return;
  window.speechSynthesis.cancel();

  const text = `${lesson.title}. ${lesson.desc}`;
  sentenceQueue = splitSentences(text);
  sentenceIndex = 0;
  startWatchdog();
  speakAttempt(candidateVoices(), 0);
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
  if (document.fullscreenElement === modalBox) document.exitFullscreen();
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
