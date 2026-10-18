import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export interface Slide {
  key: string;
  kicker: string;
  title: string;
  highlight?: string;
  body?: string;
  cta?: { label: string; to: string };
  tiles: [string, string, string];
}

const reducedMotion = (): boolean => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function HeroCarousel({ slides }: { slides: Slide[] }) {
  const [index, setIndex] = useState(0);
  const [hovering, setHovering] = useState(false);
  const [userPaused, setUserPaused] = useState(() => reducedMotion());
  const count = slides.length;
  const current = Math.min(index, count - 1);
  const paused = hovering || userPaused;

  useEffect(() => {
    if (paused || count < 2) return;
    const id = window.setInterval(() => setIndex((v) => (v + 1) % count), 7000);
    return () => window.clearInterval(id);
  }, [paused, count]);

  const go = (n: number) => setIndex((n + count) % count);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Highlights"
      className="relative overflow-hidden rounded-xl2 border border-border bg-surface shadow-card"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onFocus={() => setHovering(true)}
      onBlur={() => setHovering(false)}
    >
      <div className="grid">
        {slides.map((s, i) => {
          const active = i === current;
          return (
            <div
              key={s.key}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
              aria-hidden={!active}
              className={`col-start-1 row-start-1 grid transition-opacity duration-500 md:grid-cols-[1fr_1.1fr] ${active ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
            >
              <div className="relative flex min-h-[11rem] items-center justify-center overflow-hidden bg-gradient-to-br from-primary to-ink p-6 md:min-h-[26rem]" aria-hidden="true">
                <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
                <div className="absolute -bottom-16 right-0 h-56 w-56 rounded-full bg-accent/30" />
                <div className="relative grid grid-cols-3 gap-3 sm:gap-4">
                  {s.tiles.map((t, n) => (
                    <div
                      key={n}
                      className={`flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 text-4xl shadow-lg backdrop-blur-sm sm:h-28 sm:w-28 sm:text-6xl ${n === 1 ? '-translate-y-4' : n === 2 ? 'translate-y-3' : ''}`}
                    >
                      {t}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col justify-center gap-3 px-6 py-8 sm:px-12 sm:py-12">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{s.kicker}</p>
                <h2 className={`break-words font-extrabold uppercase leading-[1.05] ${s.title.length > 26 ? 'text-3xl sm:text-4xl' : 'text-4xl sm:text-6xl'}`}>{s.title}</h2>
                {s.highlight && (
                  <p className="w-fit max-w-full break-words bg-accent px-4 py-1.5 text-2xl font-extrabold uppercase text-on-accent sm:text-4xl">{s.highlight}</p>
                )}
                {s.body && <p className="max-w-md text-base text-muted">{s.body}</p>}
                {s.cta && (
                  <Link
                    to={s.cta.to}
                    tabIndex={active ? 0 : -1}
                    className="mt-2 w-fit rounded-full bg-accent px-7 py-3 text-base font-extrabold uppercase tracking-wide text-on-accent shadow-lg hover:opacity-90"
                  >
                    {s.cta.label}
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {count > 1 && (
        <>
          <button onClick={() => go(current - 1)} aria-label="Previous slide" className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-surface/90 text-3xl leading-none text-accent shadow hover:bg-surface">
            ‹
          </button>
          <button onClick={() => go(current + 1)} aria-label="Next slide" className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-surface/90 text-3xl leading-none text-accent shadow hover:bg-surface">
            ›
          </button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-surface/90 px-3 py-1.5 shadow">
            {slides.map((s, i) => (
              <button
                key={s.key}
                onClick={() => setIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === current}
                className={`h-2.5 rounded-full ${i === current ? 'w-6 bg-accent' : 'w-2.5 bg-muted/50'}`}
              />
            ))}
            <button onClick={() => setUserPaused((p) => !p)} aria-label={userPaused ? 'Play slideshow' : 'Pause slideshow'} className="ml-1 text-xs font-bold text-muted">
              {userPaused ? '▶' : '⏸'}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
