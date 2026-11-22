import { describe, expect, it } from "vitest";
import { selectInternalLinks } from "@/lib/audit/crawl";
import { parsePage } from "@/lib/audit/html";

const HOME = "https://www.acme.example.com/";

function linksOf(body: string) {
  return parsePage({
    url: HOME,
    requestedUrl: HOME,
    statusCode: 200,
    headers: {},
    html: `<html><body>${body}</body></html>`,
    isHome: true,
  }).links;
}

describe("selectInternalLinks", () => {
  it("keeps same-site http(s) pages, drops assets/utility/external, dedupes, prefers nav + shallow", () => {
    const links = linksOf(`
      <a href="/blog/2024/01/deep-post">deep</a>
      <a href="mailto:hi@acme.example.com">mail</a>
      <a href="tel:+441234">tel</a>
      <a href="javascript:void(0)">js</a>
      <a href="https://other.com/x">external</a>
      <a href="/brochure.pdf">pdf</a>
      <a href="/img/photo.JPG">img</a>
      <a href="/cart">cart</a>
      <a href="/wp-admin/">admin</a>
      <a href="#top">hash</a>
      <a href="/">home</a>
      <a href="https://acme.example.com/pricing">apex pricing</a>
      <a href="/pricing/">pricing dup</a>
      <a href="/pricing#plans">pricing hash</a>
      <a href="http://www.acme.example.com:8080/x">bad port</a>
      <nav><a href="/contact">contact</a><a href="/services/plumbing">services</a></nav>
    `);
    const picked = selectInternalLinks({ homeUrl: HOME, links, sitemapUrls: [], max: 5 });
    expect(picked).toEqual([
      "https://www.acme.example.com/contact",
      "https://www.acme.example.com/services/plumbing",
      "https://www.acme.example.com/pricing",
      "https://www.acme.example.com/blog/2024/01/deep-post",
    ]);
  });

  it("fills gaps from the sitemap after page links", () => {
    const links = linksOf('<a href="/about">about</a>');
    const picked = selectInternalLinks({
      homeUrl: HOME,
      links,
      sitemapUrls: ["https://www.acme.example.com/a/b", "https://www.acme.example.com/faq", "https://evil.com/x", HOME],
      max: 5,
    });
    expect(picked).toEqual([
      "https://www.acme.example.com/about",
      "https://www.acme.example.com/faq",
      "https://www.acme.example.com/a/b",
    ]);
  });

  it("returns a bounded candidate list (3× max, to allow robots.txt skips)", () => {
    const links = linksOf(Array.from({ length: 40 }, (_, i) => `<a href="/p${i}">p</a>`).join(""));
    expect(selectInternalLinks({ homeUrl: HOME, links, sitemapUrls: [], max: 5 })).toHaveLength(15);
    expect(selectInternalLinks({ homeUrl: HOME, links, sitemapUrls: [], max: 0 })).toHaveLength(0);
  });
});
