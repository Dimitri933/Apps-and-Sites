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
      {
        title: "How LLMs actually generate text",
        duration: "5 min",
        script: [
          "An LLM doesn't \"know\" an answer and recall it. At every step, it looks at the text so far and predicts a probability distribution over the next token — a word or word-fragment — then samples from that distribution and repeats. If the prompt is \"The capital of France is,\" the model assigns a very high probability to \"Paris\" and a low one to almost everything else, then picks from that distribution.",
          "Two settings control how that sampling behaves: temperature and top-p. A temperature near 0 makes the model almost always pick the single most likely token — deterministic, repetitive, safe. A higher temperature flattens the distribution, so lower-probability tokens get picked more often — more varied and creative, but also more prone to drifting into incorrect territory. Top-p (nucleus sampling) works alongside it by restricting sampling to the smallest set of tokens whose combined probability crosses a threshold, cutting off the very unlikely long tail.",
          "That single generation mechanism explains a lot of what you see in production. Hallucination isn't a glitch bolted onto a correct process; it's the same next-token prediction running with no grounding in fact, so a fluent, confident-sounding sentence and a fabricated one are produced by the identical mechanism, with nothing internal flagging the difference.",
          "It also explains why phrasing changes outputs, why the same prompt can give different answers across runs, and why a model can be extremely fluent and extremely wrong at the same time — fluency is a property of the language modeling objective, not a signal of factual grounding. When you're in a review and someone says \"the model should just know this,\" this is the concept to bring up: it doesn't know things, it predicts plausible continuations, and those are only the same thing when the training data and the prompt happen to constrain it well.",
        ],
        takeaways: [
          "Generation = repeatedly predicting the next token from a probability distribution, not lookup.",
          "Temperature and top-p control how much the model deviates from its single most likely guess.",
          "Hallucination and correct output come from the exact same mechanism — there's no separate \"fact-check\" step.",
        ],
      },
      {
        title: "Context windows & why they break products",
        duration: "5 min",
        script: [
          "A context window is the maximum amount of text — measured in tokens, not characters or words — that a model can consider at once, counting the system prompt, conversation history, any retrieved documents, and the model's own output. A token is roughly three-quarters of a word in English, so a 10,000-word support document is already around 13,000 tokens before you've added a single instruction or turn of conversation.",
          "Context window sizes vary widely across models and providers, and they change frequently as new versions ship — some sit in the tens of thousands of tokens, others reach into the hundreds of thousands or beyond. The number matters less than the discipline of tracking it: any spec should state which model's limit the product is designed against, because that ceiling is a hard constraint, not a soft guideline.",
          "When a conversation or document set exceeds that limit, something has to give: older messages get truncated, retrieved context gets cut short, or the request fails outright with an error. This is why long support chats \"forget\" earlier details, and why RAG answers degrade when too many documents are stuffed in at once — the system isn't being careless, it's running into a hard architectural ceiling.",
          "There's a second, subtler failure mode worth knowing by name: research on long-context models found they're measurably weaker at using information placed in the middle of a long context than information near the start or end — commonly called the \"lost in the middle\" effect. A fact buried in document six of ten retrieved chunks can be effectively invisible to the model even though it was technically present in the prompt.",
          "So a bigger context window doesn't just mean \"more capacity\" — it means engineering has to actively decide what to keep, drop, summarize, or reorder so the most important material lands where the model actually attends to it. That's a product decision as much as a technical one, and it's worth asking directly: what's our token budget per request, and what gets cut first when we're over it?",
        ],
        takeaways: [
          "Context limits are counted in tokens (~0.75 words each), and they cap system prompt + history + retrieved content + output combined.",
          "Exceeding the limit forces truncation, cutoffs, or errors — there's no graceful default behavior.",
          "Content placed in the middle of a long context is used less reliably than content at the start or end.",
        ],
      },
      {
        title: "Fine-tuning vs. prompting vs. RAG",
        duration: "5 min",
        script: [
          "These are the three main levers for changing what an LLM does, and they solve different problems — reaching for the wrong one is one of the most common technical mistakes a product team makes. Prompting changes instructions at inference time: system prompts, few-shot examples, output format instructions. It's cheap, fast to iterate on, and reversible in seconds, but it's limited by what fits in the context window and by what the base model already knows.",
          "Fine-tuning adjusts the model's own weights using your own labeled examples, often with efficient methods like LoRA that update a small fraction of parameters instead of the whole model. It's good for teaching a consistent tone, a rigid output format, or a narrow behavioral pattern the base model doesn't reliably follow from instructions alone.",
          "But fine-tuning has real costs: it requires curated training data, a retraining cycle every time you want to adjust behavior, and — this is the part teams underestimate — it can quietly degrade capabilities that weren't part of the fine-tuning set, a phenomenon sometimes called catastrophic forgetting. It also does not reliably teach a model new, changing facts; a model fine-tuned last quarter still doesn't know this quarter's pricing.",
          "RAG keeps the base model frozen and instead retrieves relevant, current information at request time and feeds it into the prompt. It's the right lever specifically when the problem is \"the model doesn't have access to this specific, changing information\" — a knowledge base, a policy document, today's inventory — not \"the model doesn't behave the way we want.\"",
          "A strong PM spec usually starts by naming which of these three problems is actually being solved, because teams frequently reach for fine-tuning — the most expensive, slowest lever — when the real gap is retrieval, or reach for a bigger prompt when the real gap is that the model needs behavior correction only fine-tuning reliably delivers. Naming the problem correctly up front saves weeks.",
        ],
        takeaways: [
          "Prompting: fast and cheap, limited by context window and base model knowledge.",
          "Fine-tuning: changes behavior/format reliably, but is slow to iterate and can't reliably add new facts.",
          "RAG: the right lever when the gap is access to current or proprietary information, not behavior.",
        ],
      },
    ],
  },
  {
    id: 2,
    name: "Retrieval-Augmented Generation (RAG)",
    lessons: [
      {
        title: "RAG architecture end to end",
        duration: "6 min",
        script: [
          "A RAG pipeline has, in practice, six stages, and each one is a place quality can quietly leak away. First, ingestion: documents come in from wherever they live — a wiki, a ticketing system, a set of PDFs, a database export — and get cleaned, parsed, and normalized. Tables, images, and inconsistent formatting are where ingestion most commonly breaks silently.",
          "Second, chunking splits that content into smaller pieces small enough to retrieve individually, typically somewhere in the 200–500 token range for dense reference material, though the right size depends entirely on the content's structure. Third, embedding turns each chunk into a numeric vector that captures its meaning using a model like OpenAI's text-embedding family, Cohere Embed, or an open-source model such as BGE or E5, and those vectors get stored in a vector database — common choices include Pinecone, Weaviate, Milvus, or pgvector inside Postgres.",
          "Fourth, at query time, the user's question is embedded the same way and used to retrieve the most similar chunks by vector distance, usually the top 3 to 10. Many production systems add a fifth step here — re-ranking — where a second, more precise (but slower) model re-scores the initial candidates before deciding what to actually send to generation, trading a little latency for meaningfully better precision.",
          "Sixth, generation: those retrieved chunks are inserted into the prompt alongside the user's question and system instructions, and the LLM writes an answer grounded in them. Frameworks like LangChain and LlamaIndex exist specifically to wire these stages together, but the framework doesn't remove the need to understand each stage individually.",
          "Because each stage feeds the next, a bad answer can originate from parsing that mangled a table, chunking that split a sentence in half, an embedding model that missed domain vocabulary, retrieval that missed the right document, or generation that ignored what it was given — and diagnosing which one requires tracing the pipeline stage by stage, not just re-reading the final output and guessing.",
        ],
        takeaways: [
          "Six stages: ingestion → chunking → embedding → retrieval → (optional) re-ranking → generation.",
          "Common tooling: LangChain/LlamaIndex for orchestration, Pinecone/Weaviate/pgvector for vector storage.",
          "A wrong answer requires checking each stage individually — the final output alone won't tell you which stage failed.",
        ],
      },
      {
        title: "Chunking & embedding strategy",
        duration: "6 min",
        script: [
          "Chunk size is a trade-off, not a default setting. Small chunks (roughly 100–200 tokens) retrieve precisely but lose surrounding context — a paragraph about pricing might get separated from the plan name it refers to, so the retrieved fact reads as ambiguous even when it's technically correct. Large chunks (800+ tokens) preserve context but dilute the embedding, since a vector representing a whole page averages together several ideas and becomes a blurrier signal than one representing a single focused point.",
          "Overlap between consecutive chunks — typically 10–20% of the chunk size — exists specifically to prevent a fact from being split exactly at a chunk boundary and becoming unretrievable no matter how good the embedding model is. Some teams go further with semantic chunking, which splits on natural topic or section boundaries detected in the text instead of a fixed token count, usually producing more coherent chunks at the cost of more preprocessing complexity.",
          "The embedding model itself matters as much as the chunking strategy. General-purpose embeddings can miss domain-specific vocabulary — legal, medical, or internal product terminology may cluster poorly in vector space compared to everyday language — and a model trained predominantly on English will underperform on other languages or on heavy jargon. Embedding dimensionality (768, 1024, 1536, 3072 are common) is itself a trade-off: higher dimensions capture more nuance but cost more to store and search.",
          "It's also worth knowing that embeddings capture semantic similarity, not factual correctness or recency — two chunks can embed as very similar while one is outdated and one is current, and the embedding alone gives no signal about which is which. That's a common source of RAG systems confidently retrieving stale information.",
          "When a RAG system gives a wrong answer, checking the actual chunk boundaries around the relevant fact — did the chunking process cut the sentence containing the answer in half, or separate it from its context — is often more revealing in ten minutes than hours spent inspecting the generation model's output.",
        ],
        takeaways: [
          "Chunk size trade-off: smaller = more precise but context-poor; larger = more context but a blurrier embedding.",
          "10–20% overlap prevents facts from being split unretrievably across a chunk boundary.",
          "Embeddings encode semantic similarity, not correctness or recency — stale and current chunks can look identical to the retriever.",
        ],
      },
      {
        title: "Why retrieval quality caps output quality",
        duration: "5 min",
        script: [
          "There's a simple ceiling effect in RAG: no matter how capable the generation model is, it can only work with what retrieval hands it. If the right document never makes it into the top results, the model is being asked to answer from the wrong material — and a good, fluent model will often still produce a confident-sounding answer built on it, with nothing about the output signaling that the underlying retrieval failed.",
          "This is why swapping in a more powerful or expensive LLM frequently fails to fix a RAG system that's underperforming, and teams sometimes burn a full quarter on a model upgrade that changes nothing. The bottleneck was never generation quality; it was recall — whether the relevant chunk was retrieved at all — or precision — whether the retrieved chunks were actually relevant, not just superficially similar in wording to the query.",
          "A concrete example: a user asks about a refund policy exception introduced last month. If that update lives in a chunk that never gets retrieved — because it wasn't indexed, because it's semantically distant from how the user phrased the question, or because a stronger but outdated chunk outranked it — the model answers from the old policy, fluently and wrongly, and no amount of generation-side prompting fixes that.",
          "So when a RAG answer is wrong, the productive question for a PM to ask isn't \"is the model good enough?\" It's \"was the right information even retrieved, and can we see exactly what was passed to the model for this request?\" Most RAG platforms can log the retrieved chunks per request — asking to see that log for a handful of failure cases redirects most debugging conversations toward the real cause in minutes instead of days.",
        ],
        takeaways: [
          "Generation quality can't exceed what retrieval actually surfaced — a great model on bad context still gives a bad answer.",
          "Upgrading the LLM is a common but frequently wrong fix for a retrieval-side problem.",
          "Always ask to see the retrieved chunks for a failing request before assuming the model itself is at fault.",
        ],
      },
    ],
  },
  {
    id: 3,
    name: "Evaluating LLM Systems",
    lessons: [
      {
        title: "Building a golden test set",
        duration: "5 min",
        script: [
          "A golden set is a curated collection of representative inputs paired with a known-correct or acceptable-range answer. It's the difference between an eval that means something and one that's just vibes — without it, \"the new prompt seems better\" is an opinion, not a measurement, and every prompt or model change becomes a debate instead of a decision.",
          "Good golden sets are built from real usage, not invented from imagination: pull actual queries from production logs, include known edge cases and past failure modes, and make sure hard, ambiguous, and easy examples are all represented deliberately rather than defaulting to whatever's easiest to write. As a rough starting size, most teams need at least 50–100 examples before results stop being dominated by noise, and mature products often run several hundred to a few thousand, organized into categories.",
          "Stratification matters as much as size: a golden set that's 90% easy questions will make a system look far better than it is in production, because production traffic isn't 90% easy. Deliberately tag examples by difficulty, topic, and query type so the eval can report performance per category, not just one blended number that hides where things are actually weak.",
          "Tooling helps here — platforms like LangSmith, Braintrust, and promptfoo are built specifically to version golden sets, track how scores move as prompts and models change over time, and diff outputs between versions. But the tooling is secondary to the discipline: the set needs an owner, a review cadence, and a process for adding new examples the moment a real failure is discovered in production.",
          "They also need active maintenance. As the product changes, the golden set goes stale — new features create new query types the set doesn't cover, and old edge cases may stop mattering. A healthy team treats the golden set as a living asset with a named owner, not a one-time deliverable produced for a launch six months ago and never touched again.",
        ],
        takeaways: [
          "A golden set turns \"seems better\" into a measurable, repeatable comparison.",
          "Build it from real production queries and failures, stratified by difficulty and category — not invented examples.",
          "It needs a named owner and a maintenance cadence, or it silently goes stale as the product evolves.",
        ],
      },
      {
        title: "Offline vs. online evals",
        duration: "5 min",
        script: [
          "Offline evals run against a fixed golden set before anything ships — fast, repeatable, and ideal for catching regressions the moment a prompt, model, or retrieval step changes. Because the inputs and expected outputs are fixed, the same test can run in CI on every code change, the same way a unit test suite does for traditional software.",
          "Their limitation is structural: they can only test what's in the set. Real users ask things nobody anticipated, phrase requests in unexpected ways, and combine edge cases the golden set's authors never imagined — offline evals are blind to all of that by construction.",
          "Online evals measure live production signals instead: explicit feedback like thumbs up/down, implicit signals like escalation to a human agent, repeated follow-up questions that suggest the first answer didn't land, session abandonment, or task completion rate. They catch exactly what offline evals structurally can't — but they're slower to accumulate, noisier because real user behavior has many confounding causes, and by definition they only surface a problem after it's already live and affecting users.",
          "In between these two sits a middle ground worth knowing: shadow deployments and canary releases, where a new version runs against real traffic but its outputs aren't shown to users (shadow), or are shown to a small percentage of them (canary), letting a team see real-world behavior before fully committing to a change.",
          "Mature teams run all of these in sequence: offline evals gate a change before release, canary or shadow traffic validates it against a slice of real usage, and online evals continue monitoring after full rollout. Relying on only one layer is a common and costly gap — a team that only does offline evals gets blindsided by production reality, and a team that only watches production dashboards ships regressions that no automated check caught until users started complaining.",
        ],
        takeaways: [
          "Offline evals: fast, repeatable, CI-friendly — but blind to inputs the golden set didn't anticipate.",
          "Online evals: capture real user behavior — but slower, noisier, and only visible after launch.",
          "Shadow/canary deployments bridge the gap by testing against real traffic before a full rollout.",
        ],
      },
      {
        title: "Reading an eval report like an engineer",
        duration: "5 min",
        script: [
          "A dashboard with an 85% pass rate tells you almost nothing on its own. The first question is what the metric is actually measuring — exact string match, semantic similarity via embeddings, or an LLM-as-judge score that asks another model to rate the answer — because each one fails differently, has different blind spots, and can be gamed in different ways by a system that's overfitting to the metric rather than genuinely improving.",
          "The second question is where the failures cluster. An aggregate score hides pattern: an 85% pass rate could mean uniformly mediocre performance everywhere, or it could mean 98% on easy queries and 40% on a specific category — say, multi-step questions, or a particular language. If failures concentrate in one query type, one language, or one document source, that's a specific, fixable, scoped bug, not a reason to make sweeping changes across the whole system.",
          "The third is whether the eval method itself is trustworthy. LLM-as-judge scoring — increasingly common because it scales better than human review — has documented biases: it tends to favor longer answers and more confident-sounding phrasing regardless of actual correctness, and it can be inconsistent between runs on the exact same input. A spot check where a human reviews a random sample of the judged examples, comparing their judgment to the automated score, is often worth more than the top-line leaderboard number by itself.",
          "It's also worth checking inter-rater reliability when humans are involved in scoring: if two human reviewers scoring the same examples disagree with each other more than occasionally, the eval methodology itself needs work before the resulting numbers can be trusted for a launch decision.",
          "Put together, reading an eval report well means resisting the pull of a single clean number and asking three things every time: what exactly is being measured, where do the failures live, and how much do I trust the measurement method itself. Those three questions are what separate a PM who can hold their own in an eval review from one who can only repeat the headline score.",
        ],
        takeaways: [
          "Always ask what the metric actually measures (exact match, embedding similarity, LLM-judge) before trusting it.",
          "A single aggregate score hides category-specific failures — segment results before drawing conclusions.",
          "LLM-as-judge has known biases (favoring length and confidence) — spot-check judged samples with a human.",
        ],
      },
    ],
  },
  {
    id: 4,
    name: "RAGAS & RAG-specific Metrics",
    lessons: [
      {
        title: "Faithfulness & hallucination detection",
        duration: "5 min",
        script: [
          "Faithfulness measures whether a generated answer is actually supported by the retrieved context, versus content the model added on its own that wasn't in what it was given. It's computed, roughly, by breaking the answer into individual factual claims, checking each one against the retrieved chunks, and scoring the fraction that's actually grounded: faithfulness = (number of claims supported by the context) ÷ (total number of claims in the answer).",
          "A concrete example: if an answer makes four factual claims and the retrieved context only supports three of them, faithfulness scores 0.75 — meaning one claim in the answer was invented rather than retrieved. A low faithfulness score is a strong, specific hallucination signal — the model said something the retrieved material didn't say.",
          "But faithfulness only evaluates the generation step in isolation; it says nothing about whether the retrieved context itself was correct, current, or complete in the first place. That's the trap teams fall into: a model can be perfectly faithful to context that was wrong, outdated, or irrelevant, and still score a clean 1.0 on faithfulness while giving users a confidently wrong answer.",
          "Hallucination detection more broadly uses a few complementary techniques beyond faithfulness scoring: natural language inference (NLI) models that classify whether a claim is entailed, contradicted, or unrelated to a source passage; consistency checks that generate the same answer multiple times and flag disagreement between runs as a sign of low confidence; and simple citation requirements, where the system is required to point to the specific source chunk for each claim, making unsupported claims easier to spot in review.",
          "The practical takeaway for a PM: faithfulness is a necessary metric, but treating it as sufficient is a mistake. It measures one link in the chain — did generation stay within what it was given — not the whole system, and a full picture requires pairing it with the context-quality metrics covered next.",
        ],
        takeaways: [
          "Faithfulness ≈ (claims supported by context) ÷ (total claims) — it isolates hallucination in the generation step.",
          "A perfect faithfulness score doesn't mean a correct answer — it means the model didn't add anything beyond bad context.",
          "Pair faithfulness with NLI-based checks, consistency checks, or citation requirements for a fuller picture.",
        ],
      },
      {
        title: "Context precision vs. context recall",
        duration: "5 min",
        script: [
          "These two RAGAS metrics answer different questions, and mixing them up leads teams to misdiagnose problems and apply the wrong fix. Context precision asks: of the chunks that were retrieved, how many were actually relevant to the question, weighted so relevant chunks ranked higher count more? Roughly, precision = (relevant chunks retrieved) ÷ (total chunks retrieved). Low precision means retrieval is pulling in noise alongside the useful material — the system found the right answer, buried among irrelevant results.",
          "Context recall asks the opposite question: of all the relevant chunks that exist in the knowledge base for this query, how many did retrieval actually find? Roughly, recall = (relevant chunks retrieved) ÷ (total relevant chunks that exist). Low recall means the system is missing information it needs entirely, regardless of whether what it did retrieve was relevant.",
          "A concrete illustration: for a question with three genuinely relevant source passages in the knowledge base, if the system retrieves five chunks and two of them are among those three relevant ones, recall is 2/3 (0.67) and precision is 2/5 (0.4). Both scores are meaningfully different, and they point to different problems.",
          "The fixes are different too, which is why distinguishing them matters. A precision problem usually points toward re-ranking, tighter similarity thresholds, or better query rewriting before retrieval. A recall problem usually points toward chunking strategy, embedding model quality, or actual gaps in the underlying knowledge base — the right document may simply not exist in the index at all.",
          "Treating a recall problem as if it were a precision problem is a common and costly mistake: tightening similarity thresholds when the real issue is that the right chunk was never indexed just makes the system retrieve even less, making a real gap look like a tuning problem instead of a content gap that needs to be filled.",
        ],
        takeaways: [
          "Precision = relevant retrieved chunks ÷ total retrieved chunks — measures noise in what came back.",
          "Recall = relevant retrieved chunks ÷ all relevant chunks that exist — measures what was missed entirely.",
          "Precision problems point to re-ranking/thresholds; recall problems point to chunking, embeddings, or content gaps — don't swap the fixes.",
        ],
      },
      {
        title: "When a high RAGAS score still means a bad product",
        duration: "5 min",
        script: [
          "RAGAS metrics are computed against the golden set and the retrieved context the system was actually given during evaluation — they can only ever measure what they were shown. A high faithfulness score only means the answer matched the retrieved context; it says nothing about whether that context was the right context for what the user actually needed to know, or whether the golden set even represents real usage.",
          "There's a fourth RAGAS metric worth naming here that ties this together: answer relevance, which measures whether the generated answer actually addresses the user's question, independent of faithfulness. A system can be faithful and even reasonably precise/recall-y on its golden set while still scoring poorly on relevance in the real world if it answers a narrower or different question than what users are actually asking.",
          "A common real pattern: RAGAS scores look excellent because the golden set happens to be full of easy, well-covered queries pulled from a clean initial batch, while real production users ask messier, more varied, more ambiguous questions the golden set never anticipated — and the automated metrics simply never see those failures, because they're only ever run against the fixed set.",
          "This is exactly why RAGAS scores should never be read in isolation — they need to sit alongside user-facing signals: escalation rate to a human, repeated follow-up questions that suggest the first answer didn't land, explicit thumbs-down feedback, and session abandonment. When the metrics say \"great\" and users say \"not helpful,\" the gap is almost always in what the golden set covers, not in the metric's underlying math.",
          "Closing that gap means going back to real usage data — pulling recent production queries, especially ones tied to negative feedback or escalations, and folding them into the golden set — rather than endlessly tuning the eval pipeline itself. The golden set's coverage of reality is the actual bottleneck far more often than the metric's formula.",
        ],
        takeaways: [
          "RAGAS metrics can only reflect what the golden set tests — they're blind to real queries the set doesn't cover.",
          "Answer relevance (does the answer address the actual question) is a distinct metric from faithfulness and precision/recall.",
          "When metrics and user sentiment diverge, expand the golden set with real failing production queries — don't just retune the eval.",
        ],
      },
    ],
  },
  {
    id: 5,
    name: "Prompting & System Design for PMs",
    lessons: [
      {
        title: "Writing a spec engineers won't rewrite",
        duration: "5 min",
        script: [
          "A spec that says \"use AI to answer support questions accurately\" forces engineering to make every real decision themselves — which model, how uncertain is too uncertain, what happens on failure — which means the spec wasn't actually specifying anything, just describing a wish. A spec engineering can build directly from names the model or model class, a concrete latency budget such as a p95 response time target, and exactly what happens when the model is uncertain or produces a low-confidence answer.",
          "It should also state fallback behavior explicitly rather than leaving it implied: does the system escalate to a human agent, show a confidence caveat to the user, refuse to answer outright, or offer a narrower but more certain answer? Each of those is a different engineering build, and \"we'll figure it out\" at this stage usually means it gets decided ad hoc, late, under time pressure.",
          "It should define what \"done\" means in testable terms: specific eval thresholds tied to the golden set from Module 3 (for example, faithfulness above a set bar, and a defined ceiling on false escalations), plus a list of example inputs — including deliberately hard and adversarial ones — that the system needs to handle correctly before launch, not just a general sense that it \"seems good.\"",
          "The details that feel like \"engineering's job\" — token budgets per request, timeout and retry behavior, what happens specifically when retrieval returns nothing relevant — are exactly the details that determine whether the feature works in the real world versus works in a demo. A demo only has to survive the happy path once; production has to survive every edge case, repeatedly, at scale.",
          "A PM who can speak to those specifics, even at a rough level of precision, changes the entire conversation with engineering from \"tell us what you want and we'll decide the rest\" to a genuine collaborative build — and gets a fundamentally different quality and speed of delivery than one who leaves all of it unstated and hopes it gets handled well by default.",
        ],
        takeaways: [
          "Name the model/model class, a concrete latency budget, and explicit fallback behavior — not just a desired outcome.",
          "Define \"done\" as specific eval thresholds and example inputs, tied to the golden set, not a general impression of quality.",
          "Details like timeout behavior and retrieval-failure handling decide whether a feature survives production, not just a demo.",
        ],
      },
      {
        title: "Guardrails & structured output",
        duration: "5 min",
        script: [
          "LLMs naturally produce free-form text, but most products need something more constrained: a specific JSON shape the rest of the system can parse reliably, a bounded set of categories for a classification task, or an answer that reliably avoids certain topics entirely. Structured output techniques enforce this — schema-constrained generation that limits what tokens the model can produce next to match a required format, function/tool calling where the model selects from a defined set of structured actions, or output parsing with validation and automatic retry when the model's response doesn't match the expected shape.",
          "Guardrails add a second, complementary layer on top of structured output: checking content before it reaches the user for safety issues, policy violations, or answers that wander outside the system's intended scope. This is frequently implemented with a second, smaller, faster model acting purely as a classifier — is this response safe, on-topic, and policy-compliant — running alongside the main generation model rather than replacing it. Open frameworks like Guardrails AI and NeMo Guardrails exist specifically to standardize this pattern instead of every team building it from scratch.",
          "Every one of these layers adds latency and cost, since each is effectively an additional model call or validation pass before the user sees a response. And every one of them makes an error trade-off, not eliminates errors entirely: an overly strict guardrail will reject valid, safe answers just as often as a loose one lets genuinely bad answers through — there's no configuration that gets both false-positive and false-negative rates to zero simultaneously.",
          "This means the real design question for a PM isn't \"do we need guardrails\" — for anything user-facing, the answer is almost always yes. It's calibrating how strict to set them, and being explicit with the team about which failure mode is more tolerable for this specific product: a support bot that too-cautiously escalates borderline questions to a human is usually safer to launch than one that occasionally lets a bad answer through unchecked, but that calculus flips for a low-stakes internal tool where speed matters more than caution.",
          "Making that tolerance explicit — in writing, tied to specific examples — turns guardrail tuning from an ongoing argument into a decision the team can actually revisit deliberately as the product matures, rather than a setting nobody remembers agreeing to.",
        ],
        takeaways: [
          "Structured output (schemas, function calling, validated parsing) constrains format; guardrails separately constrain content.",
          "Every guardrail layer trades latency and cost for safety — there's no setting that eliminates both false positives and negatives.",
          "Decide and document which failure mode your product tolerates better: over-blocking valid answers, or under-blocking bad ones.",
        ],
      },
      {
        title: "Trade-offs: latency, cost, quality",
        duration: "5 min",
        script: [
          "These three variables move together, and a PM who understands the shape of that trade-off makes sharper calls than one who just asks for \"the best model available.\" A larger, more capable model generally costs more per request and responds more slowly — sometimes meaningfully slower, which matters directly for anything conversational, real-time, or embedded in a workflow where users are actively waiting.",
          "A handful of concrete techniques shift this trade-off rather than eliminating it. Caching common or repeated queries avoids re-running generation entirely for requests the system has already answered. Model routing — sometimes called a cascade — sends easy, common cases to a smaller, cheaper, faster model and escalates only the harder or lower-confidence cases to a larger one, capturing most of the cost savings while preserving quality where it matters most.",
          "Reducing how much context gets sent per request — tighter retrieval, more selective chunk inclusion — cuts both cost and latency simultaneously, since cost typically scales with total tokens processed, but it risks the recall problems covered in Module 2 if pushed too far. Every one of these techniques trades some engineering complexity, and sometimes a small quality hit on the cases routed to the cheaper path, for meaningfully better economics.",
          "There's rarely a single right answer here, only a right answer for a specific product's tolerance for slowness, spend, and error rate — a real-time voice assistant has an extremely tight latency budget that a batch-processed nightly report doesn't, and a free consumer tool has a cost ceiling that an enterprise contract with committed revenue might not.",
          "Naming that tolerance explicitly — this feature needs a p95 latency under two seconds, this feature can tolerate five seconds if it means meaningfully better accuracy — is what turns a vague \"make it fast and good and cheap\" request into a decision engineering can actually design against, instead of a set of unstated assumptions that surface as disagreements after the build is already underway.",
        ],
        takeaways: [
          "Latency, cost, and quality move together — caching, model routing/cascades, and tighter context each shift the trade-off differently.",
          "Cost and latency typically scale with total tokens processed, so context-size decisions are also cost/latency decisions.",
          "State explicit tolerances (e.g. p95 latency, cost per request) — an unstated trade-off becomes a disagreement discovered mid-build.",
        ],
      },
    ],
  },
  {
    id: 6,
    name: "Mock Technical Interviews",
    lessons: [
      {
        title: "\"Design a RAG system for support tickets\"",
        duration: "Mock, 20 min",
        script: [
          "This is a timed system-design mock interview. You'll be asked to design a RAG system that answers questions using a company's historical support tickets as its knowledge source — walking through ingestion, chunking, retrieval, and generation, and specifically how you'd handle tickets that contradict each other, resolutions that go stale over time, and tickets with no clear resolution at all.",
          "Set a timer for 20 minutes and outline your answer in writing before checking the rubric — talking through it in your head doesn't force the same rigor as actually naming the pipeline stages, so treat this like you would a real onsite whiteboard round.",
          "Strong answers name concrete choices instead of staying abstract: how tickets get chunked given that they're often short, conversational, and messy rather than clean prose; how outdated resolutions get filtered, down-weighted by recency, or flagged for review; and specifically how the system behaves when no relevant ticket exists at all, rather than silently guessing.",
          "What the rubric looks for: did you mention a metadata-based recency filter or decay function rather than treating all historical tickets as equally trustworthy; did you address deduplication when many tickets describe the same underlying issue with different wording; and did you propose a concrete fallback (escalate to a human, say \"I don't have information on this\") for the no-match case rather than leaving it unaddressed.",
          "Common mistakes candidates make under time pressure: jumping straight to \"we'll use a vector database\" without addressing data quality first, forgetting to mention how conflicting resolutions get surfaced or resolved, and describing the architecture in such generic terms it could apply to literally any RAG use case rather than one shaped by what support tickets actually look like.",
          "After you outline your approach, compare it against the model answer and scoring rubric to see which trade-offs strong candidates surface that are easy to miss under time pressure — particularly around data freshness and conflicting information.",
        ],
        takeaways: [
          "Address data quality (contradicting/stale tickets, deduplication) before jumping to vector database architecture.",
          "Explicitly design the no-match fallback — don't let the system guess when nothing relevant was retrieved.",
          "Generic RAG architecture answers score lower than ones shaped by support tickets' actual structure and failure modes.",
        ],
      },
      {
        title: "\"How would you evaluate this chatbot?\"",
        duration: "Mock, 15 min",
        script: [
          "This mock interview asks you to design an evaluation plan from scratch for an existing chatbot, with no eval infrastructure currently in place. You'll need to decide what to measure, how to build a golden set, and how offline and online evaluation would work together — the full arc covered in Module 3.",
          "Set a 15-minute timer and structure your answer in three parts: what you'd measure and why, how you'd build the golden set, and how offline and online evaluation fit together over time — resist the urge to jump straight to naming metrics before establishing what \"good\" means for this specific product.",
          "Strong answers anchor metrics to real product outcomes — task completion, escalation rate, faithfulness, answer relevance — rather than reaching for generic accuracy numbers that don't map to what the business actually cares about. They also propose a concrete, scoped first version rather than an exhaustive eval suite that would take a quarter to build.",
          "What the rubric looks for: did you ask what \"good\" means for this specific product before proposing metrics, rather than assuming a generic answer; did you address how the golden set would be built and by whom; and did you distinguish what offline evals would catch versus what would only show up in production.",
          "Common mistakes: proposing only a single blended accuracy number instead of a segmented view by query type; ignoring who owns building and maintaining the golden set over time; and describing an evaluation plan that would require infrastructure the team doesn't currently have, without acknowledging that gap or a path to close it.",
          "Your plan is scored against what strong interviewers look for: whether you asked what \"good\" means for this specific product before proposing metrics, and whether your plan could realistically be built with the data and tooling the team already has today.",
        ],
        takeaways: [
          "Anchor metrics to product outcomes (task completion, escalation, faithfulness) — not generic accuracy alone.",
          "Propose a scoped first version of the eval plan, not an exhaustive suite that can't realistically ship soon.",
          "Address ownership: who builds and maintains the golden set, and with what data the team already has.",
        ],
      },
      {
        title: "\"Our RAGAS scores look great but users are unhappy — why?\"",
        duration: "Mock, 15 min",
        script: [
          "This is a diagnostic-reasoning mock interview: RAGAS metrics look strong, but real users are dissatisfied, and you need to figure out why under time pressure — the exact gap covered in Module 4's lesson on when a high RAGAS score still means a bad product.",
          "Give yourself 15 minutes and talk through your diagnostic process out loud (or in writing) step by step, rather than jumping to a single guessed cause — the rubric is scoring your reasoning process at least as much as your final answer.",
          "Strong candidates don't guess at a single cause. They ask what the golden set actually covers and how it was built, whether it reflects real current query patterns or an old snapshot, and what specific user-facing signals — escalation rate, repeated questions, thumbs-down feedback — are diverging from the metrics before proposing any fix.",
          "What the rubric looks for: did you propose pulling a sample of real production queries and comparing them against the golden set's coverage; did you consider that the golden set itself might be stale or too easy; and did you avoid jumping straight to \"let's retrain\" or \"let's swap the model\" before diagnosing where the actual gap lives.",
          "Common mistakes: treating the RAGAS score as if it must be wrong or miscalculated rather than questioning what it was actually measured against; proposing an expensive fix (model swap, full re-architecture) before doing the cheap diagnostic work of comparing golden-set coverage to real usage; and failing to mention answer relevance as a distinct axis from faithfulness when the two can diverge.",
          "The rubric rewards structured diagnosis over a confident-sounding guess — the same instinct that separates a PM who can credibly run a technical postmortem from one who can only repeat the dashboard numbers back.",
        ],
        takeaways: [
          "Diagnose before fixing: compare golden-set coverage against real production queries and user-facing signals first.",
          "Don't assume the metric is wrong — assume it's measuring something narrower than the real problem.",
          "The rubric scores your diagnostic process, not just your final guess — talk through your reasoning step by step.",
        ],
      },
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

// speechSynthesis.pause()/resume()/.paused are unreliable across browsers
// (pause can silently no-op, or a later resume can fire on its own, even
// after the user stopped it). Instead we always fully stop with cancel(),
// which is reliable, and use a generation counter so a cancelled
// utterance's late onend/onerror callbacks can never restart playback —
// only callbacks from the current, still-current attempt are honored.
let playGeneration = 0;

function stopNarration() {
  playGeneration += 1;
  clearTimeout(startTimer);
  clearInterval(watchdogInterval);
  if (speechSupported) window.speechSynthesis.cancel();
  sentenceQueue = [];
  sentenceIndex = 0;
  modalVideo.classList.remove("playing");
  playBtn.textContent = "▶";
  modalCaptions.textContent = "";
}

function pauseNarration() {
  playGeneration += 1;
  clearTimeout(startTimer);
  clearInterval(watchdogInterval);
  if (speechSupported) window.speechSynthesis.cancel();
  modalVideo.classList.remove("playing");
  playBtn.textContent = "▶";
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
  sentenceIndex = 0;
  modalVideo.classList.remove("playing");
  playBtn.textContent = "▶";
  modalCaptions.textContent = "";
}

function speakAttempt(voiceQueue, queueIndex, generation) {
  if (generation !== playGeneration) return; // superseded by a stop/pause/new play
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
    if (generation !== playGeneration) return;
    started = true;
    clearTimeout(startTimer);
    modalVideo.classList.add("playing");
    playBtn.textContent = "⏸";
    modalCaptions.textContent = sentence;
  };

  utterance.onend = () => {
    clearTimeout(startTimer);
    if (generation !== playGeneration) return; // cancelled by pause/stop — don't advance or continue
    sentenceIndex += 1;
    if (sentenceIndex >= sentenceQueue.length) {
      finishNarration();
    } else {
      speakAttempt(voiceQueue, 0, generation);
    }
  };

  utterance.onerror = () => {
    clearTimeout(startTimer);
    if (generation !== playGeneration) return; // cancelled by pause/stop, not a real playback error
    if (voice) brokenVoiceURIs.add(voice.voiceURI);
    speakAttempt(voiceQueue, queueIndex + 1, generation);
  };

  currentUtterance = utterance;
  window.speechSynthesis.speak(utterance);

  clearTimeout(startTimer);
  startTimer = setTimeout(() => {
    if (generation !== playGeneration) return;
    if (!started) {
      window.speechSynthesis.cancel();
      if (voice) brokenVoiceURIs.add(voice.voiceURI);
      speakAttempt(voiceQueue, queueIndex + 1, generation);
    }
  }, 1500);
}

function playNarration(lesson) {
  if (!speechSupported) return;
  playGeneration += 1;
  window.speechSynthesis.cancel();

  const text = `${lesson.title}. ${lesson.script.join(" ")}`;
  sentenceQueue = splitSentences(text);
  sentenceIndex = 0;
  startWatchdog();
  speakAttempt(candidateVoices(), 0, playGeneration);
}

function resumeNarration() {
  if (!speechSupported) return;
  playGeneration += 1;
  window.speechSynthesis.cancel();
  startWatchdog();
  speakAttempt(candidateVoices(), 0, playGeneration);
}

function openLesson(index) {
  stopNarration();
  currentIndex = (index + allLessons.length) % allLessons.length;
  const lesson = allLessons[currentIndex];
  modalModule.textContent = `${lesson.moduleName} · Lesson ${lesson.index + 1}`;
  modalTitle.textContent = lesson.title;
  modalDesc.innerHTML = "";
  lesson.script.forEach((paragraph) => {
    const p = document.createElement("p");
    p.textContent = paragraph;
    modalDesc.appendChild(p);
  });
  if (lesson.takeaways && lesson.takeaways.length) {
    const heading = document.createElement("h4");
    heading.className = "takeaways-heading";
    heading.textContent = "Key takeaways";
    modalDesc.appendChild(heading);
    const list = document.createElement("ul");
    list.className = "takeaways-list";
    lesson.takeaways.forEach((point) => {
      const li = document.createElement("li");
      li.textContent = point;
      list.appendChild(li);
    });
    modalDesc.appendChild(list);
  }
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
  const isPlaying = modalVideo.classList.contains("playing");
  if (isPlaying) {
    pauseNarration();
  } else if (sentenceQueue.length && sentenceIndex < sentenceQueue.length) {
    resumeNarration();
  } else {
    playNarration(allLessons[currentIndex]);
  }
});
