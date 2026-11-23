# Review R4: copy slop

Reviewer: copy editor. Scope: every string in `src/content/*.ts`, the short UI strings in `src/components/audit/labels.ts`, the report issue copy in `src/lib/audit/issues.ts`, and the eleven rendered pages on https://seenhq.vercel.app read as a visitor (23 November 2026). Nothing in `src/**` was changed.

**Verdict: the facts are honest and the report issue copy is good. The marketing pages say each true thing three to nine times, and the three AI service descriptions are 150-word walls.** The 116 edits below cut the edited text from about 22,900 characters to about 14,100 (38% shorter) without removing a single required caveat.

How the edits were checked: every "Current" string was matched against the source file by script, and every replacement is shorter than what it replaces (edit 2 is the same length; it fixes a contradiction). All 116 edits were applied to a scratch copy of the repo and `vitest run` was run there: 674 of 675 tests pass. The one failure is the sample-report fixture, which is expected after any change to issue copy and is fixed by re-running `scripts/build-sample-report.ts`. Typecheck and build were not run.

Three patterns do most of the damage:

- **The verb triad.** "Find, trust and cite", "found, cited and chosen", "read, trust and quote", "read, understand and quote", "found, trusted and cited": nine variants across `site.ts`, `home.ts`, `about.ts`, `services.ts` and `methodology.ts`. Pick "read and quote" and stop.
- **The caveat on repeat.** A caveat of the "we cannot promise" or "this is not ChatGPT" family appears 11 times on /services and 6 times on the home page. "You get a fixed quote before any work starts" appears 9 times on /pricing. Said once in the right place, each is credible. Said nine times, each reads as nervous.
- **Definition openers.** "An SEO audit is a structured check of...", "A technical fix sprint is a fixed-scope block of work where...", "AI crawler unblock is a fixed-scope job that...". The visitor asked what they get, and the page answers with what the thing is.

## 1. Page-by-page verdict

| Page | Verdict |
|---|---|
| `/` | Strong H1, good four-point problem section. Then it repeats itself: the "people now ask AI" argument is made twice, "no setup" three times, a not-ChatGPT or no-promises caveat six times, and three FAQ answers run past 100 words. |
| `/audit` | The form is the page, and the form copy is fine. The H1 is a rhetorical question and the intro is one 45-word sentence about internals. |
| `/services` | The worst page. A 120-word intro lists the services the page then lists; the three AI services each carry a 150-word description, a survey statistic, three caveats and a disclaimer inside "What you get". Deliverable lists are specific and should carry the page. |
| `/pricing` | Prices are clear on the cards. Around them, the quote promise is made nine times and the tax line four; four of the eleven FAQ answers restate the question or the card above. |
| `/about` | Reuses the home H1 word for word. "At a glance" repeats the intro, "Why we started" repeats the home page, and "How we work" opens with a three-noun slogan. One honest paragraph is trying to get out. |
| `/contact` | Short and mostly fine. "Prefer email? Use the contact form" contradicts itself, and the audit prompt appears twice on one screen. |
| `/methodology` | The best long page: real numbers, real limits. It over-explains "not ChatGPT" (section, limits list, FAQ), and one check is labelled "live test" while its own description says "simulated". |
| `/bot` | Does its job for a site owner reading logs. Trim "a handful" and "a small, bounded number" to the numbers, and stop saying "much like opening it in a browser" twice. |
| `/sample-report` | Good idea, good title. The disclaimer has a sentence that does not parse ("the same engine and wording as a real report"), and it says "under a minute" where the rest of the site says "about a minute". |
| `/privacy` | Plain and specific. Two wording trims only. One inconsistency for the owner, not an editor: "if we store data, our database provider" sits beside a 24-month retention promise. |
| `/terms` | Reads like a person wrote it. One rhetorical "Questions?" and one "from time to time" to cut; the rest stays as is. |
| Report issues (`issues.ts`) | The best copy on the site: concrete title, one reason, one fix, a real snippet. Slop is confined to hedges ("vendor-run and correlational" twice), a few filler reasons ("builds trust", "a basic signal of a well-kept site") and a caveat appended to ten issues in engineer's language. |

## 2. Edits, most damaging first

Format: file, current text, replacement, reason. Text is shown as it renders; where the source file escapes a quotation mark (`\"`), keep the escape.

### 1. `src/components/home/Sections.tsx`

Current:

````text
Checks how you show up in
````

Replacement:

````text
Readiness checked for
````

Reason: Over-claim. The audit checks readiness; this label says it reports how you appear in ChatGPT and Gemini, which the same page then denies three times.

### 2. `src/content/methodology.ts`

Current:

````text
AI crawler access (live test)
````

Replacement:

````text
AI crawler access (simulated)
````

Reason: The label says "live", the sentence under it says "simulated". The engine label in src/lib/audit/checks/geo/crawler-probe.ts line 11 needs the same change so the report and this page agree.

### 3. `src/content/services.ts`

Current:

````text
seenhq offers eight focused services for startups, SaaS teams and local businesses. Each one has a fixed scope and a clear deliverable, so you know exactly what you are paying for before we start. The SEO audit and GEO audit are delivered together as one Full audit, at one price. Three services look beyond your own website: an AI fact-check that corrects the sources behind wrong AI answers, a local AI visibility setup for the profiles AI assistants read, and an AI crawler unblock for sites that turn AI crawlers away without meaning to. Every service is done by a person, and none of them can promise what an AI will say.
````

Replacement:

````text
Eight services, each with a fixed scope and done by a person. You get the price in writing before we start. None of them can promise what Google or an AI will say.
````

Reason: 120-word intro that lists the services the page is about to list. One caveat, once.

### 4. `src/content/services.ts`

Current:

````text
An AI fact-check is a manual test of what AI assistants such as ChatGPT, Gemini, Perplexity, Microsoft Copilot and Google AI Overviews tell people about your business, compared line by line with the real facts you give us. For a local business that means hours, phone number, address and whether you are open; for a SaaS product or startup it means pricing, plans and features. We trace each wrong fact to the pages it most likely comes from, fix the sources you control, send correction requests for the rest and re-test after 30 days. In a Small Business Expo survey of 3,608 small business owners, 14.8% said AI search had shown wrong information about their business and a further 34.4% were not sure. We cannot control what an AI says or promise that an answer changes, or when: answers vary from one run to the next, so our screenshots are a dated sample, not a permanent record.
````

Replacement:

````text
A person asks ChatGPT, Gemini, Perplexity, Microsoft Copilot and Google AI Overviews about your business and compares every answer with the facts you give us: hours, phone and address for a local business, or pricing, plans and features for a product. We trace each wrong fact to its likely source, fix the sources you control, request corrections on the rest and re-test after 30 days. We cannot control what an AI says, and answers vary between runs, so our screenshots are a dated sample.
````

Reason: 170 words, a survey statistic used as padding, and one caveat said three ways. Says what the customer gets first; keeps both required limits.

### 5. `src/content/services.ts`

Current:

````text
AI crawler unblock is a fixed-scope job that tests what AI crawlers such as GPTBot, ClaudeBot and PerplexityBot actually receive from your server, not just what your robots.txt says. Blocks often sit in a CDN, firewall, security plugin or host setting that robots.txt never mentions: in one founder's scan of 591 websites, published on HackerNoon in November 2026, 100 refused GPTBot or ClaudeBot and only 4 said so in robots.txt. We find the layer doing the blocking, change the settings you control or write and follow up the support ticket to your host, set one consistent access policy and retest. A block set by your host is the host's decision. Our test requests do not come from the AI companies' own network addresses, so they can be wrong in either direction, and being reachable does not mean being cited.
````

Replacement:

````text
We test what AI crawlers such as GPTBot, ClaudeBot and PerplexityBot actually receive from your server, which is often not what your robots.txt says: the block can sit in a CDN, firewall, security plugin or host setting. We name the layer, change the settings you control or write and chase the support ticket to your host, then retest. A block set by your host is the host's decision. Our requests are simulated from our own servers, so they can be wrong in either direction, and being reachable does not mean being cited.
````

Reason: 150 words. Drops the one-founder HackerNoon scan (an anecdote dressed as evidence) and the definition opener; keeps "host's decision", "simulated" and "does not mean being cited".

### 6. `src/content/services.ts`

Current:

````text
Local AI visibility setup is a one-time, done-with-you project that puts your business facts right on the profiles AI assistants draw on beyond Google: Bing Places, Apple Business, Yelp or your country's equivalent, and the ChatGPT business profile where you are eligible. We write one master fact sheet, make every profile match it, build a review plan and check a set of local questions before and after. A BrightLocal survey of 1,002 US local business owners, published in October 2026, found 46% had not checked or did not know whether they appear in AI results. OpenAI currently lets local stores and restaurants claim a ChatGPT business profile only for an existing US listing, so elsewhere we prepare everything for when that opens up. A complete profile does not mean any AI assistant will recommend you, and we cannot promise the date a platform publishes a profile.
````

Replacement:

````text
We get your business facts right on the profiles AI assistants draw on beyond Google: Bing Places, Apple Business, Yelp or your country's equivalent, and the ChatGPT business profile where you are eligible. We write one fact sheet, make every profile match it, and run a set of local questions before and after. OpenAI currently lets local stores and restaurants claim a ChatGPT business profile only for an existing US listing; elsewhere we prepare everything for when that opens. A complete profile does not mean any AI assistant will recommend you, and each platform publishes profiles on its own schedule.
````

Reason: 150 words. Drops the BrightLocal statistic and "done-with-you"; both required limits stay, each said once.

### 7. `src/content/home.ts`

Current:

````text
The free audit checks your homepage and up to five internal pages for SEO basics, GEO readiness and mobile performance. That includes titles, headings, canonicals, robots.txt, sitemap, structured data, AI crawler access, llms.txt, answer-ready content and Google PageSpeed Insights results. It also flags key facts that exist only in images, PDFs or JavaScript, crossed-out or conflicting prices, phone numbers and hours, snippet settings that keep pages out of AI Overviews, missing pages that don't return 404, Bing readiness and review signals, and it runs a simulated AI-crawler test. It usually finishes in about a minute.
````

Replacement:

````text
Your homepage and up to five more pages. It checks whether Google and AI crawlers can reach and read them, whether your name, prices, hours and contact details are in plain text and agree from page to page, and how fast the page loads on a phone. It also runs a simulated AI-crawler test. Every check and its weight is on the methodology page.
````

Reason: A 100-word answer that lists 25 things. Nobody reads it; the methodology page already holds the list.

### 8. `src/content/home.ts`

Current:

````text
Yes, for one part. Most checks are fixed rules that read your HTML, robots.txt and sitemap. The AI reading is separate: an open-weight language model hosted on NVIDIA's API reads the text of the pages we fetch and reports how an AI model would describe your business, which of seven core facts are clear, vague or missing, and which customer questions you answer. It also drafts a title, meta description, llms.txt, Organization schema and an answer-ready paragraph, using only facts from your site. It is one model's reading of your pages, not what ChatGPT, Gemini or Perplexity say about you, and it can be wrong, so review every draft before you use it.
````

Replacement:

````text
Yes, for one part. Most checks are fixed rules. Separately, an open-weight language model hosted on NVIDIA's API reads your page text, reports which basic facts about your business are clear, vague or missing, and drafts fixes from facts already on your site. It is one model's reading, not what ChatGPT, Gemini or Perplexity say about you, and it can be wrong, so check every draft before you publish it.
````

Reason: 110 words for a yes/no question. Keeps every required fact (NVIDIA, one model, not ChatGPT, can be wrong) in half the space.

### 9. `src/content/home.ts`

Current:

````text
Fix the sources it learns from, because you cannot edit an AI answer directly. Assistants such as ChatGPT, Gemini and Google AI Overviews build answers from your website, your business profiles and other pages about you, so a wrong phone number, an old price or a "permanently closed" label usually traces back to a page somewhere. Correct the facts on your own site and profiles first, then ask other sites to fix theirs and use each assistant's feedback button. Our AI fact-check & fix service does this for you and re-tests after 30 days. Nobody can control what an AI says, and answers vary between runs, so we report what changed rather than promise a result.
````

Replacement:

````text
You cannot edit an AI answer, so fix what it reads. A wrong phone number, an old price or a "permanently closed" label usually traces back to a page somewhere: your site, a business profile or a directory. Correct your own site and profiles first, then ask the other sites to fix theirs. Our AI fact-check & fix service does this for you and re-tests after 30 days. Answers vary between runs, so we report what changed and cannot promise a result.
````

Reason: 120 words, ending on the "nobody can control an AI" caveat that the next FAQ repeats. Leads with the instruction.

### 10. `src/content/pricing.ts`

Current:

````text
The seenhq audit is free. The Full audit and Monitoring have one fixed price per site. A fix sprint depends on how much needs fixing, so its price is a starting point: you get a fixed quote by email before any work starts, and you pay nothing until you agree to it. Monitoring can be cancelled any month. Prices are per site and exclude applicable taxes. We confirm scope and a fixed quote in writing before any paid work starts.
````

Replacement:

````text
The audit is free. The Full audit and Monitoring have one fixed price. A fix sprint's price is a starting point, because it depends on how much needs fixing. Prices are per site and exclude applicable taxes. We confirm scope and a fixed quote in writing before any paid work starts.
````

Reason: "Fixed quote before any work starts" is said three times in one paragraph. Once is enough; the test-pinned closing lines stay.

### 11. `src/content/home.ts`

Current:

````text
seenhq checks your website for Google and for AI answer engines like ChatGPT, Perplexity and Gemini. Paste your address to get scores, a separate AI model's reading of your pages and a ranked list of fixes, in about a minute.
````

Replacement:

````text
Paste your website address. In about a minute you get scores and a ranked list of what stops Google and AI answer engines like ChatGPT and Perplexity from reading and quoting your site, with the fix for each.
````

Reason: The hero explains the product before the visitor's result, and "a separate AI model's reading" is insider language. Result first.

### 12. `src/content/home.ts`

Current:

````text
Checks your site against what search engines and AI answer engines need to find, trust and cite you.
````

Replacement:

````text
Reads up to six public pages. Nothing to install.
````

Reason: Restates the hero one line below it, with the site's favourite three-verb list. Give a fact instead.

### 13. `src/content/home.ts`

Current:

````text
When someone asks an AI assistant for the best tool, clinic or café near them, the engine has already decided which sources to trust. The free audit shows whether your site gives those engines what they need to read, understand and quote you, and what to change if it doesn't. It checks readiness; it does not track what the engines say about you.
````

Replacement:

````text
When someone asks an AI assistant for the best clinic or café nearby, it has already chosen its sources. The free audit checks whether those engines can read and quote your site, and lists what to change if they can't.
````

Reason: 70 words and a defensive closer ("it does not track...") for a claim nobody made in this section.

### 14. `src/content/home.ts`

Current:

````text
Eight focused services: a Full audit that covers SEO and GEO together, hands-on technical fixes, content and entity work, monthly monitoring, an AI fact-check and fix, local AI visibility setup and AI crawler unblocking. Fixed scope, plain pricing, all done by a person.
````

Replacement:

````text
Eight services, each with a fixed scope and a price shown up front, each done by a person.
````

Reason: The section sits directly above a list of all eight services, then lists them again in a sentence.

### 15. `src/content/home.ts`

Current:

````text
GEO (Generative Engine Optimization) is making your site easy for AI answer engines to read, trust and quote. We check the signals that make a site easier for them to use as a source, and have a language model read your pages to see how clearly they describe you.
````

Replacement:

````text
GEO (Generative Engine Optimization) means making your site easy for AI answer engines to read and quote. We check what gets in their way.
````

Reason: "Read, trust and quote" again, then "signals", then a third mention of the AI reading on one page.

### 16. `src/content/home.ts`

Current:

````text
Many buyers now ask ChatGPT, Perplexity or Google's AI Overviews and get a single written answer instead of ten blue links. If your site is hard for those systems to read, trust or quote, you are left out of the answer, even when your Google rankings look fine.
````

Replacement:

````text
Many buyers now ask ChatGPT, Perplexity or Google's AI Overviews and get one written answer instead of a list of links. If those systems can't read or quote your site, you are not in the answer, however well you rank on Google.
````

Reason: "Ten blue links" is trade slang, and "read, trust or quote" is the same triad as the line above the fold.

### 17. `src/content/home.ts`

Current:

````text
Your scores and top three issues are free with no strings. To see every issue and fix, we ask for your email and for your agreement that we may store it with the report and contact you about it. You can ask us to delete it at any time. No password, no card and nothing to install.
````

Replacement:

````text
Because we may contact you about the report, and we store your email with it. Scores and your top three issues need no email, and you can ask us to delete yours at any time.
````

Reason: The answer never says why. It restates the gate and closes on a list of three reassurances.

### 18. `src/content/home.ts`

Current:

````text
Yes. Local businesses are increasingly recommended by AI assistants when someone asks for a nearby service. We check LocalBusiness schema, a consistent business name and the basics that help both Google and AI engines connect your website to your real-world location.
````

Replacement:

````text
Yes. For a local site the audit checks that your address, hours and phone number are in plain text, agree from page to page and are in LocalBusiness schema.
````

Reason: "Increasingly recommended" is an unsupported trend claim. Say what the audit checks for a local site.

### 19. `src/content/home.ts`

Current:

````text
No. Nobody controls what Google or an AI engine chooses to show, and anyone who promises a specific ranking or citation is guessing. What we can do is remove the problems that stop you being considered and make your site clear enough to be a strong candidate.
````

Replacement:

````text
No. Nobody controls what Google or an AI engine shows. We remove what stops your site being read and quoted.
````

Reason: Two sentences of positioning after "No". "A strong candidate" says nothing.

### 20. `src/content/home.ts`

Current:

````text
A report written for people, not just developers
````

Replacement:

````text
A report a business owner can read
````

Reason: "Not X, but Y" heading. Say who it is for.

### 21. `src/content/home.ts`

Current:

````text
Each issue says what is wrong, why it matters for search and AI answers, and exactly how to fix it. Pages, checks, Core Web Vitals and the AI reading are laid out in one place.
````

Replacement:

````text
Each issue says what is wrong, why it matters and how to fix it.
````

Reason: The second sentence is an inventory of the screenshot beside it.

### 22. `src/content/home.ts`

Current:

````text
Prefer it done for you?
````

Replacement:

````text
We can fix it for you
````

Reason: Rhetorical-question heading.

### 23. `src/content/home.ts`

Current:

````text
Start free. Pay only when you want more.
````

Replacement:

````text
Free audit. Paid work is quoted first.
````

Reason: Slogan heading.

### 24. `src/content/home.ts`

Current:

````text
The audit is free. A full expert audit, a one-time fix sprint and monthly monitoring are priced for small teams and local businesses, not enterprise budgets.
````

Replacement:

````text
A person-reviewed Full audit, a one-time fix sprint and monthly monitoring. Prices below.
````

Reason: "Priced for small teams, not enterprise budgets" appears on three pages. The price cards are directly below; point at them.

### 25. `src/content/home.ts`

Current:

````text
From address to action plan in three steps
````

Replacement:

````text
Three steps, about a minute
````

Reason: Slogan heading with a filler noun ("action plan").

### 26. `src/content/home.ts`

Current:

````text
No setup and no code to install. We fetch only the public pages anyone can see.
````

Replacement:

````text
Nothing to install. We read only public pages.
````

Reason: "No setup" or "nothing to install" is said three times on the home page. This is the one place it belongs, so make it short.

### 27. `src/content/home.ts`

Current:

````text
Free, about a minute, no setup. Just your website address.
````

Replacement:

````text
Free. Takes about a minute.
````

Reason: The page has said "free", "a minute" and "no setup" already; here they come again as fragments.

### 28. `src/content/home.ts`

Current:

````text
After dark
````

Replacement:

````text
AI search
````

Reason: Kicker that means nothing out of context.

### 29. `src/content/home.ts`

Current:

````text
The shift
````

Replacement:

````text
Problem
````

Reason: Kicker that means nothing out of context.

### 30. `src/content/home.ts`

Current:

````text
The fundamentals Google still runs on
````

Replacement:

````text
What Google needs to index you
````

Reason: Slogan heading ("still runs on").

### 31. `src/content/home.ts`

Current:

````text
Present, unique and the right length, so your result reads well on the page.
````

Replacement:

````text
Present, unique and short enough not to be cut off in results.
````

Reason: "Reads well on the page" is vague. Name the failure.

### 32. `src/content/home.ts`

Current:

````text
Critical issues first, each labelled as a quick fix, a moderate job or involved work, so you can plan your week.
````

Replacement:

````text
Critical issues first, each labelled quick, moderate or involved.
````

Reason: "So you can plan your week" is filler tacked on for rhythm.

### 33. `src/content/home.ts`

Current:

````text
Identity and trust signals
````

Replacement:

````text
Who you are
````

Reason: Abstract-noun heading.

### 34. `src/content/home.ts`

Current:

````text
Structured data that states who you are (Organization or LocalBusiness schema), a consistent name, authors and visible dates.
````

Replacement:

````text
Structured data that names your business, the same name everywhere, named authors and visible dates.
````

Reason: Parenthetical jargon in the middle of the sentence.

### 35. `src/content/home.ts`

Current:

````text
A language model reads your pages and reports how it would describe you, which core facts are clear, vague or missing, and which customer questions you answer. It is one model's reading, not what ChatGPT or Gemini say.
````

Replacement:

````text
A language model reads your pages and reports which core facts are clear, vague or missing and which customer questions you answer. One model's reading, not what ChatGPT or Gemini say.
````

Reason: Trim the list; keep the one honesty line this page needs, in fewer words.

### 36. `src/content/site.ts`

Current:

````text
seenhq audits your website for Google and AI answer engines like ChatGPT and Perplexity, then fixes what stops you from being found, cited and chosen.
````

Replacement:

````text
seenhq audits your website for Google and AI answer engines like ChatGPT and Perplexity, then fixes what stops them reading and quoting it.
````

Reason: "Found, cited and chosen": a list of three for rhythm, and "chosen" is a result seenhq cannot deliver. This string is the default meta description and the llms.txt summary.

### 37. `src/content/contact.ts`

Current:

````text
Prefer email? Use the contact form and we'll reply by email.
````

Replacement:

````text
No public email: use the form and we reply by email.
````

Reason: Asks "Prefer email?" and then tells the visitor to use the form. Say the true thing.

### 38. `src/content/about.ts`

Current:

````text
Be seen by people and by the machines they ask
````

Replacement:

````text
A small studio for SEO and AI search
````

Reason: The About H1 is the home page H1, word for word. Say what seenhq is.

### 39. `src/content/about.ts`

Current:

````text
seenhq is a small SEO and GEO studio. We audit websites for search engines and AI answer engines, then help fix what stops them from being found, trusted and cited.
````

Replacement:

````text
seenhq is a small SEO and GEO studio. We audit websites for Google and AI answer engines, then fix what the audit finds.
````

Reason: "Found, trusted and cited" triad; "help fix" hedges a thing the studio simply does.

### 40. `src/content/about.ts`

Current:

````text
More people now ask an AI assistant instead of scrolling through search results. Most small businesses have no idea whether those assistants can read their website, let alone recommend it. We built seenhq to make that visible and fixable without an agency retainer.
````

Replacement:

````text
A small business has no easy way to tell whether AI assistants can read its website. seenhq checks that for free and fixes it without an agency retainer.
````

Reason: Third telling of "people now ask AI" on the site, plus an unsupported "most small businesses have no idea".

### 41. `src/content/about.ts`

Current:

````text
Startups and SaaS teams who need their product understood by the tools their buyers use, and local businesses such as clinics, studios, cafés and trades who want to be the answer when someone nearby asks. We work remotely with clients worldwide, with a focus on India.
````

Replacement:

````text
Startups and SaaS teams, and local businesses such as clinics, studios, cafés and trades. We work remotely, worldwide, with a focus on India.
````

Reason: "Want to be the answer when someone nearby asks" is a slogan inside a list of customers.

### 42. `src/content/about.ts`

Current:

````text
Plain language, fixed scope and honest limits. We tell you what we found, what it is worth fixing and what it will cost before we start. We never promise rankings or AI citations, because nobody can.
````

Replacement:

````text
Before we start, you get what we found, what is worth fixing and a fixed price. We never promise rankings or AI citations, because nobody can.
````

Reason: Opens with a three-noun fragment, then a three-item sentence. One sentence of substance does it.

### 43. `src/content/about.ts`

Current:

````text
About us: SEO and GEO for real businesses
````

Replacement:

````text
About us: a small SEO and GEO studio
````

Reason: "For real businesses" is filler. Rendered title is 44 characters with the suffix.

### 44. `src/content/about.ts`

Current:

````text
seenhq helps startups, SaaS teams and local businesses be found on Google and cited by AI answer engines. Learn who we are and how we work.
````

Replacement:

````text
seenhq is a small SEO and GEO studio for startups, SaaS teams and local businesses: free audit, fixed-price fixes, no promised rankings.
````

Reason: "Learn who we are and how we work" is a filler closer. 136 characters.

### 45. `src/content/services.ts`

Current:

````text
The SEO audit and GEO audit are delivered together as the Full audit: one review by a person, one fixed price per site.
````

Replacement:

````text
The SEO and GEO audits are sold together as one Full audit, at one fixed price per site.
````

Reason: Shared by two descriptions; says "together", "one" and "one" for a single fact.

### 46. `src/content/services.ts`

Current:

````text
An SEO audit is a structured check of how well search engines can crawl, index and understand your website. We go well beyond the free tool's six pages, review your key pages by hand and turn the findings into a short, written, prioritised plan.
````

Replacement:

````text
A person reviews up to 50 pages of your site, not the six the free audit reads, and writes a short plan: what to fix first, what can wait and what to ignore.
````

Reason: Opens with a dictionary definition of an SEO audit. Lead with what the buyer gets.

### 47. `src/content/services.ts`

Current:

````text
A GEO audit checks how ready your website is to be used as a source by AI answer engines such as ChatGPT, Perplexity, Claude, Gemini and Google AI Overviews. We review whether their crawlers can get in, whether your pages answer questions clearly enough to be quoted, and whether your site states plainly who you are.
````

Replacement:

````text
A person checks whether AI answer engines such as ChatGPT, Perplexity and Google AI Overviews can use your site as a source: whether their crawlers get in, whether your pages answer questions clearly enough to quote, and whether the site says plainly who you are.
````

Reason: Definition opener, a five-name engine list and "how ready your website is to be used as a source".

### 48. `src/content/services.ts`

Current:

````text
Check whether AI answer engines can read, understand and quote your site.
````

Replacement:

````text
A person checks whether AI answer engines can read and quote your site.
````

Reason: "Read, understand and quote": the triad again.

### 49. `src/content/services.ts`

Current:

````text
A technical fix sprint is a fixed-scope block of work where we implement the highest-impact fixes from your audit. That usually means meta tags, canonicals, robots.txt, sitemaps, structured data, llms.txt and the quick performance wins. The price depends on how much needs fixing, and you get a fixed quote before we start.
````

Replacement:

````text
We make the highest-impact fixes from your audit for you: usually meta tags, canonicals, robots.txt, sitemap, structured data, llms.txt and the quick speed wins. You get a fixed quote before we start.
````

Reason: Definition opener ("a fixed-scope block of work where we implement") and the quote promise said twice.

### 50. `src/content/services.ts`

Current:

````text
Content and entity work makes your key pages easy to quote and makes your business easy to identify. An entity is your business as search and AI engines understand it: one name, one clear description and one set of details they can match across the web. We rewrite page openings into clear, answer-ready statements, add FAQs where they help, and align your name, description and details everywhere they appear. The price depends on how many pages are involved, and you get a fixed quote before we start.
````

Replacement:

````text
We rewrite the openings of your key pages so they answer the question directly, add FAQs where they help, and make your business name, description and contact details the same everywhere they appear. You get a fixed quote before we start.
````

Reason: 100 words, half of them defining "entity", a word no dentist needs. Describe the work.

### 51. `src/content/services.ts`

Current:

````text
Monitoring is a monthly re-audit of your website, done by us, with a short written report by email. It catches the regressions that quietly undo good work, such as a redesign that drops your titles or a new firewall rule that blocks AI crawlers. It is a monthly check, not real-time tracking.
````

Replacement:

````text
Once a month we re-audit your site and email you what changed and what to fix, such as a redesign that dropped your titles or a firewall rule that now blocks AI crawlers. It is a monthly check, not real-time tracking.
````

Reason: "The regressions that quietly undo good work" is filler around two good examples.

### 52. `src/content/services.ts`

Current:

````text
What we don't promise: third-party sites may ignore correction requests, an assistant may keep repeating an old fact for a while, and we ask from our own location with your city named in the question, so your customers may see different answers
````

Replacement:

````text
Not promised: third-party sites may ignore requests, an assistant may repeat an old fact for a while, and answers can differ by location
````

Reason: A 45-word disclaimer inside a list headed "What you get". Keep it, short.

### 53. `src/content/services.ts`

Current:

````text
What we don't promise: a host can refuse to lift a block, robots.txt is a request that crawlers may ignore, and allowing crawlers does not protect your content from AI training
````

Replacement:

````text
Not promised: a host can refuse to lift a block, and crawlers can ignore robots.txt
````

Reason: Same problem; the training-data clause is a third caveat nobody asked about.

### 54. `src/content/services.ts`

Current:

````text
$149; changes to how a custom JavaScript app renders its pages are quoted separately
````

Replacement:

````text
Changes to how a custom JavaScript app renders its pages are quoted separately
````

Reason: The price is printed directly under this list. Only the exception is news.

### 55. `src/content/services.ts`

Current:

````text
$149 for one location; each extra location is priced the same
````

Replacement: **DELETE**

Reason: Repeats the Price field two lines below it ("$149 per location").

### 56. `src/content/services.ts`

Current:

````text
A review plan: your review count and recency against 3 competitors, which review sites show up for your trade and city, and ready-to-use wording for asking customers, with no incentives and no filtering out of unhappy customers (Yelp does not allow asking for reviews, so the plan leaves it out)
````

Replacement:

````text
A review plan: your reviews against 3 competitors, the review sites that matter for your trade and city, and wording for asking customers. No incentives, no filtering out unhappy customers, and no asking on Yelp, which forbids it
````

Reason: A 55-word bullet with a parenthetical policy note.

### 57. `src/content/services.ts`

Current:

````text
Local businesses whose hours, phone number, address or open status are stated wrongly by AI assistants, SaaS and startup founders whose pricing, plans or features are, and anyone who has never checked.
````

Replacement:

````text
Any business whose hours, contact details, prices or features AI assistants get wrong, and any business that has never looked.
````

Reason: 40-word "who it's for" with a clause missing its verb ("whose pricing, plans or features are").

### 58. `src/content/services.ts`

Current:

````text
Clinics, salons, restaurants, studios and trades with one or a few locations that have only ever set up a Google Business Profile and hear that customers now ask AI assistants for the best option nearby.
````

Replacement:

````text
Clinics, salons, restaurants, studios and trades with one or a few locations and nothing set up beyond a Google Business Profile.
````

Reason: "And hear that customers now ask AI assistants" is narration.

### 59. `src/content/services.ts`

Current:

````text
Not sure which service you need?
````

Replacement:

````text
Start with the free audit
````

Reason: Rhetorical-question heading.

### 60. `src/content/services.ts`

Current:

````text
Run the free audit first. It shows what is holding your site back, and we can tell you which service fits from there. Or just tell us about your site.
````

Replacement:

````text
It shows what is wrong, and we can tell you which service fits. Or tell us about your site.
````

Reason: Three sentences, one of which repeats the heading.

### 61. `src/content/pricing.ts`

Current:

````text
Prices are in US dollars. Fix sprints and content work are quoted by email before any work starts, and you pay nothing until you agree to the quote. The AI fact-check, local AI setup and AI crawler unblock are priced on the services page.
````

Replacement:

````text
Prices are in US dollars. The AI fact-check, local AI setup and AI crawler unblock are priced on the services page.
````

Reason: The quote promise is in the intro, the tax note and the three steps below. This note only needs its two new facts.

### 62. `src/content/pricing.ts`

Current:

````text
Prices are in Indian rupees for businesses in India. Fix sprints are quoted in rupees by email before any work starts, and you pay nothing until you agree to the quote.
````

Replacement:

````text
Prices are in Indian rupees for businesses in India.
````

Reason: Same quote promise, fifth time on the page.

### 63. `src/content/pricing.ts`

Current:

````text
The same plans for businesses in India, priced in rupees. You get the same work and the same written plan as on the US dollar prices. Prices are per site and exclude applicable taxes.
````

Replacement:

````text
The same plans and the same work, priced in rupees for businesses in India. Prices are per site and exclude applicable taxes.
````

Reason: "Same" three times. The two test-pinned sentences stay.

### 64. `src/content/pricing.ts`

Current:

````text
Prices are per site and exclude applicable taxes
````

Replacement: **DELETE**

Reason: Third statement of the tax line in one section (India intro, tax note, this).

### 65. `src/content/pricing.ts`

Current:

````text
Yes. Our prices are set for small teams and local businesses such as clinics, cafés, studios and trades, not for enterprise budgets. A sensible path for a local site is a Full audit, a fix sprint if you would rather not make the changes yourself, and monitoring if you want someone to check each month that nothing has broken.
````

Replacement:

````text
Yes. The audit is free, the Full audit is $49 and monitoring is $29 a month. A fix sprint starts at $199 and is quoted before we begin.
````

Reason: A leading question answered with "not for enterprise budgets" and "a sensible path". Answer with the prices.

### 66. `src/content/pricing.ts`

Current:

````text
The free audit is automated: it runs a fixed set of checks on your homepage and up to five more pages. In the Full audit a person reviews a much larger part of your site and judges what a script can't, such as whether a page really answers the question a customer would ask. You get a written plan that says what to fix first, what can wait and what to ignore, plus a written walkthrough of your report, with a short call if you want one.
````

Replacement:

````text
A person. The free audit runs fixed checks on six pages. In the Full audit someone reads up to 50 pages, judges what a script can't, such as whether a page really answers a customer's question, and writes you a plan: what to fix first, what can wait and what to ignore.
````

Reason: 90 words; the last sentence is the tier card read aloud.

### 67. `src/content/pricing.ts`

Current:

````text
We can fix the sources they read, not the answers themselves. Three services on the services page cover this: an AI fact-check & fix that compares what assistants say with your real facts and corrects the sources behind wrong answers, a local AI visibility setup for profiles such as Bing Places, Apple Business and Yelp, and an AI crawler unblock for sites that turn AI crawlers away without meaning to. Each has its own fixed price, and none of them can promise what an AI will say.
````

Replacement:

````text
We can fix the sources they read, not the answers. Three services do this: AI fact-check & fix (from $69), local AI visibility setup ($149 per location) and AI crawler unblock ($149). None can promise what an AI will say.
````

Reason: 85 words that describe three services already described on /services, then the caveat. Name them, price them, caveat once.

### 68. `src/content/pricing.ts`

Current:

````text
Yes. Content and entity work, where we rewrite key page sections so they answer questions clearly, add an FAQ block and make your business details consistent everywhere, is a separate fixed-scope service. It is described on the services page, and we confirm the price by email before any work starts.
````

Replacement:

````text
Yes. Content and entity work, where we rewrite key pages so they answer questions directly, starts at $149. It is on the services page.
````

Reason: One 35-word sentence with the definition wedged in the middle.

### 69. `src/content/pricing.ts`

Current:

````text
Once a month we re-audit your key pages and email you a short written report on what changed since last month and what to fix. If something has broken, such as a new firewall rule blocking AI crawlers or a redesign dropping your page titles, the report says so clearly. It is a monthly check, not real-time tracking, and you can cancel any month by email.
````

Replacement:

````text
Once a month we re-audit your key pages and email you what changed and what to fix. It is a monthly check, not real-time tracking. Cancel any month by email.
````

Reason: Copies the tier card and the service description. Three facts are enough.

### 70. `src/content/pricing.ts`

Current:

````text
No. There is no minimum term. Monitoring is billed monthly in advance, and it can be cancelled any time by email and stops at the end of the month you have paid for.
````

Replacement:

````text
No. Monitoring is billed monthly in advance. Cancel any time by email and it stops at the end of the month you have paid for.
````

Reason: "No. There is no minimum term." The second sentence is the question again.

### 71. `src/content/pricing.ts`

Current:

````text
Yes. Every plan has a price in Indian rupees for businesses in India: switch the prices on this page to India ₹ to see them. The free audit costs nothing, the Full audit and monitoring each have one fixed price, and a fix sprint is quoted in rupees by email before any work starts. There is no retainer and no minimum term.
````

Replacement:

````text
Yes. Switch the prices on this page to India ₹. Fix sprints are quoted in rupees before any work starts.
````

Reason: Recites the whole price ladder again to answer a yes/no question.

### 72. `src/content/pricing.ts`

Current:

````text
Yes. The automated audit is free and shows your scores and top three issues straight away. To see the full list of issues and fixes, you enter your email. No card is needed.
````

Replacement:

````text
Yes. Scores and your top three issues show straight away. The full list of issues and fixes needs your email. No card.
````

Reason: "Is it really free?" answered in four sentences.

### 73. `src/content/pricing.ts`

Current:

````text
Simple prices for small teams and local businesses
````

Replacement:

````text
Prices for small teams and local businesses
````

Reason: "Simple" is the site praising itself.

### 74. `src/content/pricing.ts`

Current:

````text
Our SEO audit and GEO audit in one review by a person, at one fixed price per site, with a written plan you can act on.
````

Replacement:

````text
A person reviews up to 50 pages for SEO and GEO and writes you a plan.
````

Reason: "In one review", "at one fixed price", "a plan you can act on": three phrases, one fact.

### 75. `src/content/pricing.ts`

Current:

````text
Just your email, no card needed
````

Replacement:

````text
No card needed
````

Reason: The line above it already says "unlocked with your email".

### 76. `src/content/pricing.ts`

Current:

````text
Start with a free SEO and GEO audit. Upgrade to a full audit, a one-time fix sprint or monthly monitoring, priced for startups and local businesses.
````

Replacement:

````text
Free SEO and GEO audit. Full audit $49, fix sprint from $199, monitoring $29 a month. Fixed quote in writing before any paid work starts.
````

Reason: "Upgrade" is subscription-software language for a studio with no plans to upgrade. Give the prices. 138 characters.

### 77. `src/content/pricing.ts`

Current:

````text
Start free, then decide
````

Replacement:

````text
Start with the audit
````

Reason: Slogan heading over a paragraph that makes the point properly.

### 78. `src/content/pricing.ts`

Current:

````text
The free audit shows your scores and top issues in about a minute. If you want a person to look deeper, or want us to do the fixing, tell us about your site and we will reply with a fixed quote.
````

Replacement:

````text
It takes about a minute. If you want a person to look deeper or do the fixing, tell us about your site and we reply with a fixed quote.
````

Reason: Wordy. Same offer, shorter.

### 79. `src/content/audit.ts`

Current:

````text
How does your site look to search and AI?
````

Replacement:

````text
Audit your site for Google and AI search
````

Reason: Rhetorical-question H1 on the page whose only job is the form.

### 80. `src/content/audit.ts`

Current:

````text
Enter your website address. seenhq checks your homepage and up to five key pages for SEO, GEO and mobile performance, has a language model read them to see how clearly they describe your business, then scores everything and ranks what to fix first.
````

Replacement:

````text
Enter your website address. We read your homepage and up to five more pages, score them for SEO, GEO and mobile speed, and rank what to fix first. It takes about a minute.
````

Reason: One 45-word sentence describing internals ("has a language model read them to see how clearly...").

### 81. `src/content/audit.ts`

Current:

````text
That doesn't look like a valid website address. Check the spelling and try again, for example example.com.
````

Replacement:

````text
That doesn't look like a website address. Try something like example.com.
````

Reason: Two wordings of the same error (see auditForm.invalidInput). Use one.

### 82. `src/content/audit.ts`

Current:

````text
The website took too long to respond. It may be slow or busy right now, so please try again in a few minutes.
````

Replacement:

````text
The website took too long to respond. Try again in a few minutes.
````

Reason: Speculation about why ("may be slow or busy right now") before the instruction.

### 83. `src/content/audit.ts`

Current:

````text
What it would cost for us to fix what this audit found, worked out from the issues above. You can also fix everything yourself: every issue has the steps.
````

Replacement:

````text
Our price to fix what this audit found. Or fix it yourself: every issue has the steps.
````

Reason: "What it would cost for us to fix what this audit found, worked out from the issues above" is one idea in 18 words.

### 84. `src/content/audit.ts`

Current:

````text
Want a person to look first?
````

Replacement:

````text
Have a person look first
````

Reason: Rhetorical-question heading.

### 85. `src/content/contact.ts`

Current:

````text
Share a few details and we will reply by email with next steps and a fixed quote. If you haven't run the free audit yet, it is a good place to start.
````

Replacement:

````text
Tell us what you need. We reply by email within two working days with a fixed quote.
````

Reason: The second sentence is repeated in the panel beside the form. Put the reply time in the first.

### 86. `src/content/sample-report.ts`

Current:

````text
Scores and issues are computed by the same engine and wording as a real report; the AI reading shown here is an example.
````

Replacement:

````text
Scores and issues come from the real engine; the AI reading is an example.
````

Reason: "Computed by the same engine and wording as a real report" does not parse.

### 87. `src/content/sample-report.ts`

Current:

````text
The audit is free and takes under a minute. You see your scores and top issues straight away; the full report like this one needs only an email.
````

Replacement:

````text
Free, and it takes about a minute. Scores and top issues show straight away; the full report needs only an email.
````

Reason: "Under a minute" here, "about a minute" on the home page, "15 to 40 seconds" in the tool. Pick one.

### 88. `src/content/sample-report.ts`

Current:

````text
Not sure? See a full sample report first
````

Replacement:

````text
See a full sample report first
````

Reason: Rhetorical opener on a link.

### 89. `src/content/bot.ts`

Current:

````text
seenhqbot is the web crawler behind the free seenhq website audit. It fetches a handful of public pages from a site only when someone asks us to audit that site, and it never crawls the web on its own.
````

Replacement:

````text
seenhqbot fetches up to six public pages from a site, only when someone asks seenhq to audit that site. It never crawls on its own.
````

Reason: "A handful" and "the web crawler behind the free seenhq website audit" where a number and a verb will do. A site owner reading logs wants the number.

### 90. `src/content/bot.ts`

Current:

````text
seenhq is a small SEO and GEO studio. Our free audit checks a website for Google and for AI answer engines, and seenhqbot is the part that fetches the pages. It is not a search engine, it does not build an index, and we do not use the pages it fetches to train AI models.
````

Replacement:

````text
seenhq is a small SEO and GEO studio, and seenhqbot fetches pages for its free website audit. It builds no index, and the pages are not used to train AI models.
````

Reason: Third copy of "seenhq is a small SEO and GEO studio" plus three negatives where two matter.

### 91. `src/content/bot.ts`

Current:

````text
One audit makes a small, bounded number of requests: up to six pages, a few site files, and the simulated requests.
````

Replacement:

````text
One audit requests up to six pages, a few site files and the simulated requests.
````

Reason: "A small, bounded number of requests:" announces the numbers that follow.

### 92. `src/content/bot.ts`

Current:

````text
robots.txt does not stop the single page a person enters, for the reason above.
````

Replacement:

````text
robots.txt does not stop the one page a person enters.
````

Reason: "For the reason above" points at a paragraph three sections up.

### 93. `src/content/methodology.ts`

Current:

````text
The seenhq audit is a free, automated check that reads up to six public pages of a website and scores them for SEO, GEO (Generative Engine Optimization) and mobile performance. This page lists what it fetches, every check it runs, how the scores are calculated, what the AI reading is and is not, and the limits we know about.
````

Replacement:

````text
The free audit reads up to six public pages of a website and scores them for SEO, GEO (Generative Engine Optimization) and mobile speed. Every check, weight and known limit is below.
````

Reason: The second sentence is a table of contents written as prose, on a page that has one.

### 94. `src/content/methodology.ts`

Current:

````text
What the AI reading is, and what it is not
````

Replacement:

````text
The AI reading and its limits
````

Reason: "Is, and is not" heading: the symmetric tic.

### 95. `src/content/methodology.ts`

Current:

````text
The audit is a guide, not a guarantee. These are the limits we know about.
````

Replacement:

````text
These are the limits we know about.
````

Reason: "A guide, not a guarantee" is a slogan (it is also in the terms, where it belongs).

### 96. `src/content/methodology.ts`

Current:

````text
No. The AI reading is one open-weight language model, hosted on NVIDIA's API, reading the text of the pages we fetched from your site. ChatGPT, Gemini, Perplexity and other assistants use their own models and sources, and we do not query them. Use the AI reading to see whether your pages state your key facts clearly, not as a record of what any assistant says.
````

Replacement:

````text
No. It is one open-weight language model, hosted on NVIDIA's API, reading the pages we fetched. We do not query ChatGPT, Gemini, Perplexity or any other assistant.
````

Reason: Third explanation of "not ChatGPT" on this page (section, limits, FAQ). The FAQ can be two sentences.

### 97. `src/content/methodology.ts`

Current:

````text
No. The audit reads the HTML a plain fetcher receives, without running scripts. If your core facts only appear after JavaScript runs, the audit reports them as missing from the raw HTML, because fetchers that do not run JavaScript will not see them either.
````

Replacement:

````text
No. It reads the HTML your server sends. Facts that only appear after JavaScript runs are reported as missing, because many AI crawlers will not see them either.
````

Reason: "The HTML a plain fetcher receives" is jargon, and the reason is circular.

### 98. `src/content/methodology.ts`

Current:

````text
Can Google and Bing find, read and show your pages?
````

Replacement:

````text
Checks that affect Google and Bing.
````

Reason: Rhetorical question as a section intro.

### 99. `src/content/methodology.ts`

Current:

````text
Can AI answer engines read, understand and quote your site?
````

Replacement:

````text
Checks that affect AI answer engines.
````

Reason: Rhetorical question, and the "read, understand and quote" triad. A label is enough.

### 100. `src/content/legal.ts`

Current:

````text
If you have any question about this policy or your data, contact us via the contact form at /contact and we will reply by email.
````

Replacement:

````text
For any question about this policy or your data, use the contact form at /contact and we will reply by email.
````

Reason: Tightening only; same meaning.

### 101. `src/content/legal.ts`

Current:

````text
We may update these terms from time to time. The date at the top shows when they last changed. Questions? Use the contact form at /contact and we'll reply by email.
````

Replacement:

````text
We may update these terms. The date at the top shows when they last changed. For questions, use the contact form at /contact and we'll reply by email.
````

Reason: "From time to time" and a rhetorical "Questions?" in a legal page; same meaning without them.

### 102. `src/components/audit/labels.ts`

Current:

````text
We found no issues worth flagging on the pages we checked.
````

Replacement:

````text
No issues found on the pages we checked.
````

Reason: "Worth flagging" hedges a clean result. The same string is mirrored in auditFlowCopy.noTopIssues in src/content/audit.ts; change both.

### 103. `src/lib/audit/issues.ts`

Current:

````text
Simulated from our servers with a labelled test user agent; sites that verify crawler IP addresses may treat the real bot differently.
````

Replacement:

````text
Simulated from our servers, so a site that verifies crawler IP addresses may treat the real bot differently.
````

Reason: Appended to ten report issues. "A labelled test user agent" means nothing to a business owner. Change PROBE_HONESTY in checks/geo/crawler-probe.ts to the same text (a test compares them).

### 104. `src/lib/audit/issues.ts`

Current:

````text
We found no links to profiles on Google Business Profile, Trustpilot, G2, Capterra, Yelp, Tripadvisor, Justdial, Practo or similar sites. Some vendor studies associate review profiles with more AI citations; that evidence is mostly vendor-run and correlational. We don't read the review sites themselves.
````

Replacement:

````text
We found no links to review profiles such as Google Business Profile, Trustpilot, G2 or Yelp. Evidence that this affects AI answers is mostly vendor-run and correlational, so it counts for little. We don't read the review sites themselves.
````

Reason: Eight brand names and the evidence hedge said twice in one sentence. ("vendor-run and correlational" is pinned by tests/audit/checks-t020.test.ts, so it stays here; it is jargon and the test should be relaxed.)

### 105. `src/lib/audit/issues.ts`

Current:

````text
Most testimonials we found have no named source. Quotes without a name, role or company are harder for people and AI tools to trust. Evidence that this changes AI recommendations is mostly vendor-run and correlational.
````

Replacement:

````text
Most testimonials we found have no name, role or company, which makes them harder to trust. Evidence that this changes AI answers is weak.
````

Reason: Same jargon hedge; say it in plain words.

### 106. `src/lib/audit/issues.ts`

Current:

````text
Markup that doesn't match the page is a mismatch risk: Google's review snippet guidelines require the reviews to be visible.
````

Replacement:

````text
Google's review snippet guidelines require the reviews to be visible.
````

Reason: "Markup that doesn't match the page is a mismatch risk" is a tautology.

### 107. `src/lib/audit/issues.ts`

Current:

````text
robots.txt is a small file that tells search engines and AI crawlers what they may visit and where your sitemap is. It's a basic signal of a well-kept site.
````

Replacement:

````text
robots.txt is a small file that tells search engines and AI crawlers what they may visit and where your sitemap is.
````

Reason: "A basic signal of a well-kept site" is an unsupported filler closer.

### 108. `src/lib/audit/issues.ts`

Current:

````text
People ask AI assistants questions. Pages that answer common customer questions directly are far more likely to be quoted.
````

Replacement:

````text
AI assistants quote pages that answer a customer's question directly.
````

Reason: "People ask AI assistants questions" says nothing; "far more likely" is unsupported.

### 109. `src/lib/audit/issues.ts`

Current:

````text
A handful of Q&As is a start; more coverage of real customer questions gives AI assistants more to quote.
````

Replacement:

````text
More answered customer questions give AI assistants more to quote.
````

Reason: "A handful is a start; more coverage gives more": filler either side of a semicolon.

### 110. `src/lib/audit/issues.ts`

Current:

````text
Content isn't written in quotable, answer-first blocks
````

Replacement:

````text
Sections don't start with a direct answer
````

Reason: Report-issue title in SEO jargon ("answer-first blocks").

### 111. `src/lib/audit/issues.ts`

Current:

````text
AI assistants and Google favour content from identifiable people. Showing who wrote or stands behind your content builds trust.
````

Replacement:

````text
Content with a named author or owner is easier for Google and AI assistants to trust and attribute.
````

Reason: "Builds trust" is the vaguest reason available.

### 112. `src/lib/audit/issues.ts`

Current:

````text
llms.txt is an emerging, optional standard: a short plain-text guide to your site written for AI tools. It's cheap to add and helps AI assistants find your key pages.
````

Replacement:

````text
llms.txt is an optional, proposed standard: a short plain-text guide to your site for AI tools. It is quick to add.
````

Reason: "Helps AI assistants find your key pages" is not established for an optional proposal; the site says so itself elsewhere.

### 113. `src/lib/audit/issues.ts`

Current:

````text
Bing also allows verification by DNS or an XML file we can't see, so if you've verified another way, ignore this.
````

Replacement:

````text
If you verified by DNS or an XML file, which we can't see, ignore this.
````

Reason: Second hedge in a row. The sentence before it ("confirmed to feed Microsoft Copilot; whether it feeds other assistants isn't confirmed") is pinned by a test and stays.

### 114. `src/lib/audit/issues.ts`

Current:

````text
A very low `max-snippet` value lets search engines quote only a few characters from these pages, which Google lists among the controls that limit what's shown from your pages in Search and its AI features. Google doesn't publish which values matter.
````

Replacement:

````text
A very low `max-snippet` value lets search engines quote only a few characters from these pages, in Search and in Google's AI features.
````

Reason: A citation of Google's docs and a shrug ("doesn't publish which values matter") in a line that should say why it matters.

### 115. `src/lib/audit/issues.ts`

Current:

````text
Start with the biggest wins: compress and resize images (use WebP/AVIF), remove unused plugins/apps and third-party scripts, and enable caching on your host or a CDN.
````

Replacement:

````text
Compress and resize images (use WebP/AVIF), remove unused plugins, apps and third-party scripts, and turn on caching on your host or a CDN.
````

Reason: "Start with the biggest wins:" is a filler opener.

### 116. `src/lib/audit/issues.ts`

Current:

````text
Missing pages return "200 OK" (soft 404)
````

Replacement:

````text
Missing pages don't return a 404 error
````

Reason: "200 OK (soft 404)" is two pieces of jargon in a title meant for a business owner.

### Companion changes the edits above need

These are outside the files under review but must change in the same commit, or tests fail or the site contradicts itself.

| Edit | Also change | Why |
|---|---|---|
| 2 | `src/lib/audit/checks/geo/crawler-probe.ts` line 11: `label: "AI crawler access (live test)"` to `"AI crawler access (simulated)"` | The report and /methodology must show the same label. |
| 102 | `src/content/audit.ts`, `auditFlowCopy.noTopIssues` | The string is mirrored there. |
| 103 | `src/lib/audit/checks/geo/crawler-probe.ts` line 13, `PROBE_HONESTY` | `tests/audit/probe.test.ts` requires every probe issue description to contain it. |
| 103 to 116 | Re-run `scripts/build-sample-report.ts` | `src/content/sample-report.json` embeds issue copy; `doc-pages.test.ts` fails until it is regenerated. |

## 3. Sections to delete or merge

**Delete**

1. **/about, "seenhq at a glance"** (`aboutSections[0]`). It repeats the page intro and the home hero. Nothing is lost.
2. **Home FAQ, "Is seenhq useful for a local business, not just a startup?"** A leading question the hero eyebrow already answers ("for startups and local businesses"). If it stays, use edit 18.
3. **Pricing FAQ, "Is seenhq affordable for a local business?"** Same problem. The price cards are the answer. If it stays, use edit 65.
4. **The three statistics in `services.ts`** (Small Business Expo survey, BrightLocal survey, the HackerNoon scan). They are sourced, so they are not fake proof, but they are padding in a service description, and a single founder's scan of 591 sites is an anecdote. Edits 4, 5 and 6 remove them. If one is wanted, put it on the home problem section with a link to the source.
5. **`pricingNoteInr` and the third India note.** Both repeat the line directly above them (edits 62 and 64).

**Merge**

6. **Home FAQ: "What is GEO?" and "How is GEO different from SEO?"** One answer. Keep the question "What is GEO (Generative Engine Optimization)?" because `buildLlmsTxt()` picks up questions that start "What is". With deletion 2 the home FAQ drops from 10 to 8 (the test allows 6 to 10).
7. **Pricing FAQ: "Is there a minimum term for monitoring?" into "What does monitoring actually involve?"**, and **"Do you offer anything beyond..." into "Can you fix what AI assistants say..."**. Eleven questions become eight.
8. **Home "The shift" and "After dark" sections.** They make the same argument (people ask AI; be a source) in two sections of one page. Keep the first with its four concrete points; reduce the second to its heading, one sentence and the button (edit 13 gets most of the way).
9. **`auditForm.invalidInput` and `auditErrors.invalid_url`.** Two wordings of one error (edit 81 makes them identical; better to keep one key).
10. **`src/components/audit/labels.ts` and `auditFlowCopy` in `src/content/audit.ts`.** Ten strings exist in both files "wording unchanged". Keep one source or they will drift.
11. **"What happens next"** exists three times (pricing order steps, contact panel, contact quote panel) with the same third step. One shared block.

**Say once, in one place**

12. **The quote promise.** After the edits it is in the pricing intro, the three order steps and the contact panel. That is enough. Do not add it back to notes and FAQ answers.
13. **The taxes line.** `tests/content/seo-copy.test.ts` pins the same two sentences in both `pricingPage.intro` and `pricingIndiaHeading.intro`, and `pricingTaxNote` says it a third time between them. Relax the test to require the line once per currency view, then drop it from the India intro.
14. **"Not what ChatGPT says".** Required wherever the AI reading is explained. It does not need to be in the home hero, the GEO tab body, the dark section and two FAQ answers as well. After the edits the home page says it in the GEO bullet and the "Does the audit use AI?" answer.
15. **"What we don't promise" inside "What you get".** A disclaimer is not a deliverable. Edits 52 and 53 shorten the two bullets in place because the `Service` contract has no field for limits. When the contract can change, add one and move them.
16. **Speed of the audit.** "About a minute" (home, four times), "15 to 40 seconds" and "up to a minute" (progress hints), "under a minute" (sample report). Use "about a minute" in marketing copy and keep the precise range only in the progress hint.

**Contradictions to fix (not style)**

17. **"Live" versus "simulated".** The constraint is that the crawler test is always called simulated. Besides the label in edit 2, engine strings shown in reports still say "the live AI-crawler test": `src/lib/audit/checks/geo/crawler-probe.ts` lines 150 to 153 and 187, and `src/lib/audit/run.ts` lines 112 and 115. Change each to "the simulated AI-crawler test".
18. **Engine strip label.** "Checks how you show up in [ChatGPT, Perplexity, ...]" (`src/components/home/Sections.tsx` line 31, also `design-preview/page.tsx` line 238) claims visibility tracking the product does not do. Edit 1.
19. **Privacy, "Who processes your data".** "If we store data, our database provider; if we send email notifications, our email provider" is conditional, while "How long we keep it" says records are kept for up to 24 months. One of them is wrong. This is a legal-meaning change, so it is the owner's call and is not edited here.
20. **Two cards, one product.** /services lists "01 SEO audit, $49 as part of the Full audit" and "02 GEO audit, $49 as part of the Full audit". That can be read as $98. Slugs are fixed, so the cheap fix is edit 45 plus showing the price once across both cards; the real fix is one "Full audit" card.

**Test pins that hold worse copy in place**

These phrases are required verbatim by tests, so the edits keep them. Each is worth relaxing to a looser pattern:

- `checks-t020.test.ts`: "vendor-run and correlational" (research jargon in a report for a business owner) and "confirmed to feed Microsoft Copilot; whether it feeds other assistants isn't confirmed" (a double hedge).
- `seo-copy.test.ts`: the two-sentence taxes line in the India intro (see 13).
- `probe.test.ts`: exact `PROBE_HONESTY` text in every probe issue, which forces a 20-word caveat onto ten issues. A single "Simulated." prefix plus one explanation in the check summary would read better.

## 4. House style

1. **Result first.** The first sentence says what the reader gets or must do. Never open with "X is a..." unless the heading is literally "What is X?".
2. **One fact, one place.** A caveat, price rule or promise is stated once per page, where the reader needs it. If you are about to write it again, link to it instead.
3. **Two verbs, not three.** "Read and quote" is the house phrase. No list of three unless there are exactly three things and each one would be missed.
4. **Headings carry information.** A heading names the thing or states the fact. No slogans ("After dark"), no questions outside an FAQ, no "not X, but Y".
5. **Numbers beat adjectives.** "Up to six pages", "$49", "two working days", not "a handful", "simple", "affordable", "increasingly".
6. **Say the limit like a fact, then stop.** "We cannot control what an AI says." No "nobody can", no "anyone who promises is guessing", no second sentence defending the first.
7. **Write for the dentist.** If a term needs a parenthesis to explain it (entity, canonical, soft 404, user agent, snippet eligibility), use the plain words on marketing pages and keep the term for /methodology and how-to-fix steps.
8. **FAQ answers start with the answer.** "Yes." "No." "$49." Then at most two sentences. An answer over 60 words belongs on a page, with a link.
9. **Plain punctuation.** One colon per sentence at most, no semicolon where a full stop works, no fragments in threes ("Free, about a minute, no setup.").
10. **Hard rules stay hard.** seenhq is lowercase. The AI reading is one model's reading and never what ChatGPT, Gemini or any assistant says. The crawler test is "simulated", never "live". No testimonials, counts, logos or guarantees. Nothing that suggests an online member area.

## Counts

| File | Edits |
|---|---|
| `src/content/home.ts` | 28 |
| `src/content/services.ts` | 20 |
| `src/content/pricing.ts` | 19 |
| `src/lib/audit/issues.ts` | 14 |
| `src/content/methodology.ts` | 8 |
| `src/content/about.ts` | 7 |
| `src/content/audit.ts` | 6 |
| `src/content/bot.ts` | 4 |
| `src/content/sample-report.ts` | 3 |
| `src/content/contact.ts` | 2 |
| `src/content/legal.ts` | 2 |
| `src/content/site.ts` | 1 |
| `src/components/audit/labels.ts` | 1 |
| `src/components/home/Sections.tsx` | 1 |
| **Total** | **116** |

`src/content/types.ts` needs no edits (contract only). `src/content/sample-report.json` is generated.
