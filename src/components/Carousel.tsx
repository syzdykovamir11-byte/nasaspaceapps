"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import styles from "./Carousel.module.css";

export interface CarouselItem {
  key: string;
  title: string;
  node: React.ReactNode;
}

/**
 * Horizontal, scroll-snapped list of a few peer items with a page control (Apple HIG "Page controls":
 * an ordered flat list, solid dot for the current page, uncoloured indicators, no extra animation while
 * scrubbing). Swiping uses native scrolling; dots and buttons scroll with a short smooth scroll unless
 * the person prefers reduced motion. Tab order: track, Previous, current dot (roving), Next.
 */
export function Carousel({ items, label }: { items: CarouselItem[]; label: string }) {
  const count = items.length;
  // Reset to the first card whenever the set of items changes.
  const signature = items.map((i) => i.key).join("|");
  return count === 0 ? null : count === 1 ? (
    <div className={styles.single}>{items[0]!.node}</div>
  ) : (
    <CarouselInner key={signature} items={items} label={label} />
  );
}

function CarouselInner({ items, label }: { items: CarouselItem[]; label: string }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dotRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [current, setCurrent] = useState(0);
  // Text of the live region; changes only when the person changes the card.
  const [announced, setAnnounced] = useState<string>("");
  const count = items.length;
  const index = Math.min(current, count - 1);
  // The track takes the height of the card in view, so a short card never leaves a gap above the controls.
  const [height, setHeight] = useState<number | undefined>(undefined);

  // Measured before paint (layout effect) so the controls never jump on mount or card change.
  useLayoutEffect(() => {
    const track = trackRef.current;
    const card = track?.children[index] as HTMLElement | undefined;
    if (!track || !card || typeof ResizeObserver === "undefined") return;
    const pad = parseFloat(getComputedStyle(track).paddingTop) + parseFloat(getComputedStyle(track).paddingBottom);
    const measure = () => setHeight(card.offsetHeight + pad);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(card);
    return () => ro.disconnect();
  }, [index]);

  const currentRef = useRef(0);
  // Card a dot or button asked for; scroll updates are ignored until the track arrives there.
  const targetRef = useRef<number | null>(null);

  const select = (i: number, announce = true) => {
    // If focus is inside the card that is about to become inert, move it to the track first,
    // so keyboard and switch users keep their place instead of dropping to <body>.
    const track = trackRef.current;
    const leaving = track?.children[currentRef.current] as HTMLElement | undefined;
    if (i !== currentRef.current && leaving?.contains(document.activeElement)) {
      track?.focus({ preventScroll: true });
    }
    currentRef.current = i;
    setCurrent(i);
    if (announce) setAnnounced(`Showing ${i + 1} of ${items.length}: ${items[i]!.title}`);
  };
  // Latest select for the scroll listener, which subscribes once.
  const selectRef = useRef(select);
  useEffect(() => {
    selectRef.current = select;
  });

  // Track position -> current index (nearest card start), one read per frame. Subscribes once.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const cards = Array.from(track.children) as HTMLElement[];
        const x = track.scrollLeft;
        const dist = (c: HTMLElement) => Math.abs(c.offsetLeft - track.offsetLeft - x);
        let best = 0;
        cards.forEach((c, i) => {
          if (dist(c) < dist(cards[best]!)) best = i;
        });
        if (targetRef.current !== null) {
          // A programmatic scroll is running: wait until it reaches its card.
          if (best === targetRef.current) targetRef.current = null;
          return;
        }
        if (best !== currentRef.current) selectRef.current(best);
      });
    };
    const onScrollEnd = () => {
      targetRef.current = null;
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    track.addEventListener("scrollend", onScrollEnd);
    return () => {
      track.removeEventListener("scroll", onScroll);
      track.removeEventListener("scrollend", onScrollEnd);
      cancelAnimationFrame(frame);
    };
  }, []);

  const goTo = (i: number, focusDot = false) => {
    if (i < 0 || i >= count) return;
    const track = trackRef.current;
    const card = track?.children[i] as HTMLElement | undefined;
    if (!track || !card) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    targetRef.current = i;
    track.scrollTo({ left: card.offsetLeft - track.offsetLeft, behavior: reduce ? "auto" : "smooth" });
    // Focus on the dot already reads "Option N of M: title", so the live region stays quiet then.
    select(i, !focusDot);
    if (focusDot) dotRefs.current[i]?.focus();
  };

  const atStart = index === 0;
  const atEnd = index === count - 1;

  return (
    <div className={styles.carousel}>
      <div
        ref={trackRef}
        className={styles.track}
        style={height ? { height } : undefined}
        role="region"
        aria-roledescription="carousel"
        aria-label={label}
        tabIndex={0}
      >
        {items.map((it, i) => (
          <div
            key={it.key}
            className={styles.slide}
            role="group"
            aria-label={`${i + 1} of ${count}: ${it.title}`}
            // Cards outside the view are inert, so Tab only reaches the card on screen; the dots and buttons reach the others.
            inert={i !== index}
          >
            {it.node}
          </div>
        ))}
      </div>

      <div className={styles.controls}>
        <button
          type="button"
          className={styles.arrow}
          onClick={() => goTo(index - 1)}
          aria-disabled={atStart || undefined}
        >
          <span className={`${styles.chevron} ${styles.left}`} aria-hidden="true" />
          Previous
        </button>

        <div
          className={styles.dots}
          role="group"
          aria-label="Choose option"
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") {
              e.preventDefault();
              goTo(index + 1, true);
            } else if (e.key === "ArrowLeft") {
              e.preventDefault();
              goTo(index - 1, true);
            }
          }}
        >
          {items.map((it, i) => (
            <button
              key={it.key}
              ref={(el) => {
                dotRefs.current[i] = el;
              }}
              type="button"
              className={styles.dot}
              tabIndex={i === index ? 0 : -1}
              aria-current={i === index ? "true" : undefined}
              aria-label={`Option ${i + 1} of ${count}: ${it.title}`}
              onClick={() => goTo(i)}
            >
              <span aria-hidden="true" />
            </button>
          ))}
        </div>

        <button
          type="button"
          className={styles.arrow}
          onClick={() => goTo(index + 1)}
          aria-disabled={atEnd || undefined}
        >
          Next
          <span className={`${styles.chevron} ${styles.right}`} aria-hidden="true" />
        </button>
      </div>
      <p className={styles.status} aria-live="polite">
        {announced || `Showing ${index + 1} of ${count}: ${items[index]!.title}`}
      </p>
    </div>
  );
}
