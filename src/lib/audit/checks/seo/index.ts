import type { Check } from "../../context";
import { canonicalCheck } from "./canonical";
import { headingsCheck } from "./headings";
import { httpsCheck } from "./https";
import { imageAltCheck } from "./image-alt";
import { indexabilityCheck } from "./indexability";
import { langCheck } from "./lang";
import { metaDescriptionCheck } from "./meta-description";
import { openGraphCheck } from "./open-graph";
import { robotsTxtCheck } from "./robots-txt";
import { bingIndexNowCheck } from "./bing-indexnow";
import { sitemapCheck } from "./sitemap";
import { structuredDataCheck } from "./structured-data";
import { titleCheck } from "./title";
import { viewportCheck } from "./viewport";

export const SEO_CHECKS: Check[] = [
  indexabilityCheck,
  httpsCheck,
  titleCheck,
  metaDescriptionCheck,
  headingsCheck,
  canonicalCheck,
  robotsTxtCheck,
  sitemapCheck,
  viewportCheck,
  structuredDataCheck,
  imageAltCheck,
  openGraphCheck,
  langCheck,
  bingIndexNowCheck,
];
