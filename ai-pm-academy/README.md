# PM Technicals — AI Technical Training for Senior AI Product Managers

A static landing page for a learning platform teaching senior AI product managers the technical foundations they need: LLMs, RAG, LLM evaluation, and RAGAS metrics — through short video lessons, module tests, and mock technical interviews.

## Structure

- `index.html` — page content (Hero, How It Works, Curriculum, Mock Interviews, Pricing, FAQ)
- `styles.css` — dark-themed styling and responsive layout
- `script.js` — mobile nav toggle and footer year

## Curriculum covered

1. LLM Foundations
2. Retrieval-Augmented Generation (RAG)
3. Evaluating LLM Systems
4. RAGAS & RAG-specific metrics
5. Prompting & System Design for PMs
6. Mock Technical Interviews

## Customize

Replace placeholder pricing, sample interview questions, and lesson lengths with your real content. Hook up the "Start Learning" / "Get Started" buttons to your signup flow or LMS.

## Run locally

```
python3 -m http.server 8000
```

Then visit `http://localhost:8000/ai-pm-academy/`.
