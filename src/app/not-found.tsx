import Image from "next/image";
import { TornFrame } from "@/components/collage/TornFrame";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

export default function NotFound() {
  return (
    <Container className="flex flex-col items-center py-24 text-center sm:py-32">
      <div aria-hidden className="w-[min(80%,22rem)]">
        <TornFrame seed={404} shape="ellipse" shadow="float" className="aspect-[2.15/1]">
          <Image src="/images/sky-cumulus.webp" alt="" fill sizes="352px" className="object-cover" />
        </TornFrame>
      </div>
      <p className="mt-10 text-kicker font-semibold text-muted uppercase">404</p>
      <h1 className="mt-4 max-w-xl font-serif text-display-md text-balance text-ink">Nothing to see here. Not even by us.</h1>
      <p className="mt-5 max-w-md text-muted">The page you were looking for has moved or never existed.</p>
      <div className="mt-9 flex flex-wrap justify-center gap-3">
        <Button href="/" icon="arrow-right">
          Back to home
        </Button>
        <Button href="/audit" variant="secondary">
          Run a free audit
        </Button>
      </div>
    </Container>
  );
}
