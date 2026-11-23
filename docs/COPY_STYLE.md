# noticr copy style

Adopted 2026-11-23 from the copy review (docs/reviews/R4-copy-slop.md). Applies to every user-facing string in `src/content/**`, `src/lib/audit/issues.ts` and `src/components/audit/labels.ts`. The mechanical rules are enforced by `tests/content/copy-style.test.ts`.

1. **Result first.** The first sentence says what the reader gets or must do. Never open with "X is a..." unless the heading is literally "What is X?".
2. **One fact, one place.** A caveat, price rule or promise is stated once per page, where the reader needs it. If you are about to write it again, link to it instead. *(Test: no sentence of 6+ words repeated verbatim on a page; the pricing page is checked per currency view.)*
3. **Two verbs, not three.** "Read and quote" is the house phrase. No list of three unless there are exactly three things and each would be missed. *(Test: no three-verb lists built from find/found, read, trust, understand, cite, quote, chosen.)*
4. **Headings carry information.** A heading names the thing or states the fact. No slogans ("After dark"), no questions outside an FAQ, no "not X, but Y". *(Test: no `title`, `kicker` or `heading` ends in "?".)*
5. **Numbers beat adjectives.** "Up to six pages", "$49", "two working days", not "a handful", "simple", "affordable", "increasingly". *(Test: banned-words list.)*
6. **Say the limit like a fact, then stop.** "We cannot control what an AI says." No "nobody can", no "anyone who promises is guessing", no second sentence defending the first.
7. **Write for the dentist.** If a term needs a parenthesis to explain it (entity, canonical, soft 404, user agent, snippet eligibility), use plain words on marketing pages and keep the term for /methodology and how-to-fix steps.
8. **FAQ answers start with the answer.** "Yes." "No." "$49." Then at most two sentences. An answer that runs long belongs on a page, with a link. *(Test: FAQ answers on marketing pages max 75 words; other marketing strings max 90 words.)*
9. **Plain punctuation.** One colon per sentence at most, no semicolon where a full stop works, no fragments in threes ("Free, about a minute, no setup.").
10. **Hard rules stay hard.** noticr is lowercase. The AI reading is one model's reading and never what ChatGPT, Gemini or any assistant says. The crawler test is "simulated", never "live". No testimonials, counts, logos or guarantees. Nothing that suggests an online member area.

## Banned on marketing pages

a handful, simple/simply, affordable, increasingly, seamless, robust, leverage, empower, unlock the power, game-changer, cutting-edge, supercharge, effortless, elevate, delve, journey, landscape, "in today's", "not enterprise budgets", "ten blue links", done-with-you, action plan, "worth flagging", "nobody can", "builds trust", "well-kept", "from time to time", "a strong candidate", "plan your week", "live test".

Statistics: at most one sourced statistic on the marketing site, with the source named in the sentence (currently the BrightLocal owner survey in the home problem section).
