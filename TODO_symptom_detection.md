# Symptom contextual responses TODO

- [ ] Update fallback symptom response logic to detect specific common symptoms (headache, knee pain, back pain, stomach pain, anxiety, stress) and provide contextual responses.
- [ ] Ensure response structure: acknowledge, possible common causes, self-care suggestions, 2 follow-up questions, medical disclaimer.
- [ ] Add helper functions in backend/utils/aiService.js to map symptom keywords to structured templates.
- [ ] Ensure Gemini fallback (lib/gemini.ts) also has contextual responses for the same symptom set (headache, knee pain, back pain, stomach pain, anxiety, stress).
- [ ] Add/adjust keyword matching to include synonyms (e.g., stomach ache, lower back pain, etc.).
- [ ] Quick manual test plan: send sample messages and verify tailored outputs.

