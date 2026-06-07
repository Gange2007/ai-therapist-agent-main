# TODO

## Completed
- [x] Initial repo exploration and locating symptom handling code

## In Progress
- [ ] Add contextual symptom detection + response templates

## Next Steps
- [ ] Update backend fallback responder (backend/utils/aiService.js) to map symptoms -> contextual guidance
- [ ] Update Gemini local fallback responder (lib/gemini.ts) to include the same symptom set
- [ ] Widen keyword/synonym matching for symptom categories
- [ ] Update any remaining template-based placeholders (if any) to avoid `clinical_symptom_clarification` leakage
- [ ] Run quick smoke test by sending sample prompts

