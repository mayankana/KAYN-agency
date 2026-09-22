import { useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Cursor from './components/Cursor';
import Nav from './components/Nav';
import Hero from './components/Hero';
import WhatsAppButton from './components/WhatsAppButton';
import { About, Cta, Footer, Process, Services, Why, Work } from './components/Sections';

gsap.registerPlugin(ScrollTrigger);

export default function App() {
  useLayoutEffect(() => {
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      // headline line reveals
      gsap.utils.toArray<HTMLElement>('[data-lines]').forEach((el) => {
        gsap.from(el.querySelectorAll('.ln > span'), {
          yPercent: 112,
          duration: 1.1,
          ease: 'power4.out',
          stagger: 0.09,
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        });
      });
      // hero headline drifts up slightly as you leave
      gsap.to('.hero-title', {
        yPercent: -10,
        ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
      });
      gsap.to('.hero-foot', {
        opacity: 0,
        ease: 'none',
        scrollTrigger: { trigger: '.hero', start: '18% top', end: '55% top', scrub: true },
      });
      // process line draws with scroll
      gsap.fromTo(
        '.process-line i',
        { scaleX: 0 },
        { scaleX: 1, ease: 'none', scrollTrigger: { trigger: '.process-steps', start: 'top 72%', end: 'bottom 62%', scrub: true } },
      );
      // about statement lights up word by word
      gsap.fromTo(
        '.about-word',
        { opacity: 0.16 },
        { opacity: 1, ease: 'none', stagger: 0.12, scrollTrigger: { trigger: '.about-text', start: 'top 80%', end: 'bottom 50%', scrub: true } },
      );
      // work cards drift at different speeds
      gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach((el, i) => {
        gsap.fromTo(
          el,
          { yPercent: i % 2 ? 5 : 8 },
          { yPercent: i % 2 ? -5 : -8, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } },
        );
      });
    });
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
    return () => mm.revert();
  }, []);

  return (
    <>
      <Cursor />
      <Nav />
      <main>
        <Hero />
        <Services />
        <Work />
        <Why />
        <Process />
        <About />
        <Cta />
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
