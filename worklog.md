---
Task ID: 1
Agent: Main Agent
Task: Upgrade AI companion and pet pixel art

Work Log:
- Upgraded /api/chat/route.ts: added diaryContext parameter, breathing exercise guidance, relaxation exercise guidance, improved system prompt with more detailed scenarios
- Upgraded AICompanion.tsx: added chat history localStorage persistence, breathing exercise animation (inhale 4s → hold 4s → exhale 6s × 3 rounds), mood care prompt when user writes negative diary, diary context passing, markdown rendering for AI messages, free badge, more quick action chips
- Created PixelPet.tsx: shared pixel art SVG library with 4 pet types × 5 moods (happy/normal/sad/sleeping/eating)
- Upgraded PetCompanion.tsx: replaced emoji pets with pixel art SVGs from shared PixelPet module, added pixel art decorative elements (hearts, stars), added "像素风" label in pet type selector, idle animation on pet, added tip about AI companion
- Updated NewEntry.tsx: onSubmitted callback now passes mood and diary text for AI context
- Updated page.tsx: passes lastDiaryContext to AICompanion component
- Build succeeded with no errors

Stage Summary:
- AI companion now has breathing exercise feature, mood care prompts, diary context awareness, chat history persistence
- All pets are now pixel art style (shared between PetCompanion and AICompanion)
- z-ai-web-dev-sdk provides FREE AI chat capability - no external API key needed
