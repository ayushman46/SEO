import type { Check } from "../../context";
import { aiCrawlersCheck } from "./ai-crawlers";
import { answerReadyCheck } from "./answer-ready";
import { contentFormatCheck } from "./content-format";
import { factConsistencyCheck } from "./fact-consistency";
import { rawHtmlFactsCheck } from "./raw-html-facts";
import { reviewSignalsCheck } from "./review-signals";
import { snippetEligibilityCheck } from "./snippet-eligibility";
import { authorCheck } from "./author";
import { datesCheck } from "./dates";
import { entityConsistencyCheck } from "./entity-consistency";
import { faqCheck } from "./faq";
import { llmsTxtCheck } from "./llms-txt";
import { organizationSchemaCheck } from "./organization-schema";

export const GEO_CHECKS: Check[] = [
  aiCrawlersCheck,
  organizationSchemaCheck,
  answerReadyCheck,
  faqCheck,
  entityConsistencyCheck,
  datesCheck,
  authorCheck,
  llmsTxtCheck,
  contentFormatCheck,
  factConsistencyCheck,
  rawHtmlFactsCheck,
  snippetEligibilityCheck,
  reviewSignalsCheck,
];
