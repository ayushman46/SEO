import type { Check } from "../../context";
import { aiCrawlersCheck } from "./ai-crawlers";
import { answerReadyCheck } from "./answer-ready";
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
];
