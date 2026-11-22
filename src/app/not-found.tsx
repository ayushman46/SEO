import Image from "next/image";
import { TornFrame } from "@/components/collage/TornFrame";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { SiteChrome } from "@/components/site/SiteChrome";
import { notFoundCopy } from "@/content/site";

/** Root 404: renders inside the bare root layout, so it composes the site chrome itself. */
export default function NotFound() {
  return (
    <SiteChrome>
      <Container className="flex flex-col items-center py-24 text-center sm:py-32">
        <div aria-hidden className="w-[min(80%,22rem)]">
          <TornFrame seed={404} shape="ellipse" shadow="float" className="aspect-[2.15/1]">
            <Image
              src="/images/sky-cumulus.webp"
              alt=""
              fill
              sizes="(min-width: 440px) 352px, 80vw"
              className="object-cover"
            />
          </TornFrame>
        </div>
        <p className="mt-10 text-kicker font-semibold text-muted uppercase">
          {notFoundCopy.kicker}
        </p>
        <h1 className="mt-4 max-w-xl font-serif text-display-md text-balance text-ink">
          {notFoundCopy.title}
        </h1>
        <p className="mt-5 max-w-md text-muted">{notFoundCopy.body}</p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Button href={notFoundCopy.primary.href} icon="arrow-right">
            {notFoundCopy.primary.label}
          </Button>
          <Button href={notFoundCopy.secondary.href} variant="secondary">
            {notFoundCopy.secondary.label}
          </Button>
        </div>
      </Container>
    </SiteChrome>
  );
}
