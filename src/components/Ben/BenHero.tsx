import { useEffect, useRef, useState, useCallback } from 'react';
import SonicMotion from 'sonicmotion';
import SonicFX from 'sonicfx';
import SonicPerf from 'sonicperf';
import SonicScroll from 'sonicscroll';
import SonicWave from 'sonicwave';

const damp = (cur: number, tgt: number, rate: number) => cur + (tgt - cur) * rate;
const isMobile = () => typeof window !== 'undefined' && window.innerWidth < 768;
const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function BenHero() {
    const [isPlaying, setIsPlaying] = useState(false);
    const isPlayingRef = useRef(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [currentWord, setCurrentWord] = useState('');
    const [currentLine, setCurrentLine] = useState('');
    const [keyWordActive, setKeyWordActive] = useState(false);
    const [benActive, setBenActive] = useState(false);      // "Ben" word — extra intense
    const [twoOfUsActive, setTwoOfUsActive] = useState(false);      // "two of us" phrase
    const [choirDiffuse, setChoirDiffuse] = useState(false);      // choir diffusion
    const [mouseMode, setMouseMode] = useState(true);       // pre-play mouse waves
    const [scrollUnlocked, setScrollUnlocked] = useState(false);      // end-of-song scroll
    const [expandedCard, setExpandedCard] = useState<string | null>(null);

    // ── Library refs ──────────────────────────────────────────────
    const sonicRef = useRef<any>(null);
    const fxRef = useRef<any>(null);
    const scrollRef = useRef<any>(null);
    const waveRef = useRef<any>(null);
    const throttlerRef = useRef<any>(null);
    const lyricsRef = useRef<any>(null);

    // ── DOM refs ──────────────────────────────────────────────────
    const sectionRef = useRef<HTMLElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const vocalGlowRef = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLHeadingElement>(null);
    const titleWordRef = useRef<HTMLSpanElement>(null);
    const bassVigRef = useRef<HTMLDivElement>(null);
    const ripplePoolRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const canvasWrapRef = useRef<HTMLDivElement>(null);
    const lyricRef = useRef<HTMLParagraphElement>(null);
    const quoteRef = useRef<HTMLQuoteElement>(null);
    const chorusLRef = useRef<HTMLDivElement>(null);
    const chorusRRef = useRef<HTMLDivElement>(null);
    const yearRef = useRef<HTMLSpanElement>(null);
    const keyFlashRef = useRef<HTMLDivElement>(null);
    const mouseWaveRef = useRef<HTMLDivElement>(null);
    const lyricsWordRef = useRef<HTMLSpanElement>(null);
    const lyricsLineRef = useRef<HTMLParagraphElement>(null);


    // ── Inertia state ─────────────────────────────────────────────
    const st = useRef({
        vocalScale: 1, vocalSaturate: 1, vocalBlur: 0, vocalBright: 1, vocalGlow: 0,
        guitarWeight: 300, guitarSpacing: 0, guitarX: 0, guitarPrev: 0,
        bassInset: 0, bassPrev: 0,
        otherAmp: 0, corosIntensity: 0,
        keyFlash: 0,
        globalSpacing: 0,
        mouseX: 0.5, mouseY: 0.5,
        // ── Cromática 1972 ──────────────────────────────────────
        guitarTextColor: 0,   // 0 = oscuro, 1 = sepia (#5D4037)
        bgWarmth: 0,          // 0 = papel (#F9F9F9) → 1 = crema cálida (#FFF9E1)
        crescendoScale: 1,    // 1 → 1.005 en clímax
        raw: { vocals: 0, guitar: 0, other: 0, coros: 0, bass: 0 },
        latestData: {} as Record<string, any>,
        silenceTimer: 0,
    });

    // ── SonicWave setup — plata metálica (violines 70s) ─────────
    const setupWave = useCallback(() => {
        if (!canvasRef.current) return;
        try {
            waveRef.current = SonicWave.createWaveform({
                canvas: canvasRef.current,
                color: '#A8ACBA',   // plata metálica — elegancia 70s
                lineWidth: 1.5,
                style: 'sine', amplitude: 0.12, speed: 0.003,
            });
        } catch { /* degrade */ }
    }, []);

    // ── Bass ripple emitter ───────────────────────────────────────
    const emitRipple = useCallback((intensity: number) => {
        if (!ripplePoolRef.current) return;
        const div = document.createElement('div');
        div.className = 'ben-bass-ripple';
        div.style.setProperty('--intensity', String(intensity));
        ripplePoolRef.current.appendChild(div);
        div.addEventListener('animationend', () => div.remove(), { once: true });
    }, []);

    // ─────────────────────────────────────────────────────────────
    useEffect(() => {
        const reduced = reducedMotion();
        const mobile = isMobile();
        const VH = window.innerHeight;

        // ── Mouse tracking (pre-play mode) ────────────────────────
        const handleMouse = (e: MouseEvent) => {
            if (!sectionRef.current) return;
            const rect = sectionRef.current.getBoundingClientRect();
            st.current.mouseX = (e.clientX - rect.left) / rect.width;
            st.current.mouseY = (e.clientY - rect.top) / rect.height;
        };
        window.addEventListener('mousemove', handleMouse, { passive: true });

        // ── 1. SonicMotion ────────────────────────────────────────
        const sonic = SonicMotion.create({
            master: '/Ben/master.mp3',
            stems: {
                vocals: { src: '/Ben/vocals.mp3', noiseFloor: 0.06 },
                bass: { src: '/Ben/bass.mp3', noiseFloor: 0.08 },
                guitar: { src: '/Ben/guitar-acoustic.mp3', noiseFloor: 0.07 },
                coros: { src: '/Ben/coros.mp3', noiseFloor: 0.05 },
                other: { src: '/Ben/other.mp3', noiseFloor: 0.04 },
            }
        });
        sonicRef.current = sonic;
        sonic.onFrame((data: any) => {
            st.current.raw.vocals = data.vocals?.value ?? 0;
            st.current.raw.guitar = data.guitar?.value ?? 0;
            st.current.raw.other = data.other?.value ?? 0;
            st.current.raw.coros = data.coros?.value ?? 0;
            st.current.raw.bass = data.bass?.value ?? 0;
            st.current.latestData = data;
        });

        // ── 2. SonicFX ────────────────────────────────────────────
        const fx = SonicFX.create();
        fxRef.current = fx;
        fx.setDataSource(() => st.current.latestData);
        if (imageRef.current) {
            fx.bind(imageRef.current, 'vocalsWave', { stem: 'vocals', intensity: 0.3, color: 'rgba(200,190,160,0.2)' });
        }
        const overlay = fx.createOverlay({ type: 'inset', color: 'rgba(30,20,10,1)', maxOpacity: 0.08 });

        // ── 3. SonicPerf ──────────────────────────────────────────
        const throttler = SonicPerf.createThrottler({ targetFPS: mobile ? 30 : 60, useIdleCallback: false });
        throttlerRef.current = throttler;
        const lazyLoader = SonicPerf.createLazyLoader();
        if ('requestIdleCallback' in window) {
            (window as any).requestIdleCallback(() => {
                lazyLoader.preload('/BillieJean/master.mp3', 'prefetch');
            }, { timeout: 5000 });
        }

        // ── 4. SonicWave ──────────────────────────────────────────
        setupWave();

        // ── 5. SonicScroll ────────────────────────────────────────
        const scroll = SonicScroll.create({ once: true, threshold: 0.15 });
        scrollRef.current = scroll;
        requestAnimationFrame(() => scroll.init());

        // ── 6. SonicLyrics ────────────────────────────────────────
        let lyrics: any = null;
        import('../../libs/soniclyrics/soniclyrics.js').then((mod) => {
            const SL = mod.default ?? mod.SonicLyrics;
            lyrics = SL.create({ src: '/Ben/lyrics.json', sonic, lookahead: 0.08 });
            lyricsRef.current = lyrics;

            lyrics.onWord((word: any) => setCurrentWord(word.word));

            lyrics.onLine((line: any) => {
                const text = line?.text ?? '';
                setCurrentLine(text);
                // "The two of us" — sync ALL elements
                if (text.toLowerCase().includes('two of us')) {
                    setTwoOfUsActive(true);
                    st.current.globalSpacing = 1; // triggers letter-spacing expansion
                    setTimeout(() => { setTwoOfUsActive(false); st.current.globalSpacing = 0; }, 3500);
                }
            });

            lyrics.onTag('key', (word: any) => {
                const isBen = word.word.toLowerCase() === 'ben';
                if (isBen) {
                    setBenActive(true);
                    st.current.keyFlash = 1.8;   // hyper-intense for "Ben"
                    setTimeout(() => setBenActive(false), 900);
                } else {
                    st.current.keyFlash = 1.0;
                    setKeyWordActive(true);
                    setTimeout(() => setKeyWordActive(false), 500);
                }
            });

            lyrics.onPhrase('chorus', (phrase: any) => {
                const active = phrase !== null;
                setChoirDiffuse(active);
            });

            lyrics.onPhrase('verse-1', (phrase: any) => {
                setChoirDiffuse(false); // verse resets diffusion
            });
        }).catch(() => { });

        // ── 7. Main rAF loop ──────────────────────────────────────
        const DAMP = { water: 0.055, med: 0.10, snap: 0.55 };
        let lastBassTransient = 0;

        throttler.start((_delta: number) => {
            const r = st.current.raw;
            const s = st.current;

            // ─ VOCALS → CentralPortrait (breathing) ────────────
            const silent = r.vocals < 0.04;
            s.vocalScale = damp(s.vocalScale, silent ? 0.960 : 1 + r.vocals * 0.09, DAMP.water);
            s.vocalSaturate = damp(s.vocalSaturate, silent ? 0.28 : 1 + r.vocals * 0.45, DAMP.water);
            s.vocalBlur = damp(s.vocalBlur, silent ? 1.2 : Math.max(0, 0.3 - r.vocals * 2), DAMP.water);
            s.vocalBright = damp(s.vocalBright, 0.70 + r.vocals * 0.55, DAMP.water);
            s.vocalGlow = damp(s.vocalGlow, r.vocals * 0.85, DAMP.med);

            if (!reduced && imageRef.current) {
                imageRef.current.style.transform = `scale(${s.vocalScale.toFixed(4)})`;
                imageRef.current.style.filter =
                    `saturate(${s.vocalSaturate.toFixed(3)})` +
                    ` brightness(${s.vocalBright.toFixed(3)})` +
                    ` blur(${s.vocalBlur.toFixed(2)}px)`;
            }

            // ── VOCAL GLOW — Dorado Ámbar (#FFECB3) ──────────────
            // Representa la luz cálida de la amistad emergiendo de la soledad
            if (vocalGlowRef.current) {
                const boost = s.keyFlash > 1 ? 1.5 : 1;   // "Ben" → ultra boost
                const gR = 80 + s.vocalGlow * 380 * boost;
                const op1 = (s.vocalGlow * 0.55 * boost).toFixed(3);  // ámbar centro
                const op2 = (s.vocalGlow * 0.25 * boost).toFixed(3);  // halo difuso
                const op3 = (s.vocalGlow * 0.08 * boost).toFixed(3);  // corona lejana
                // hsla(45,100%,84%) ≈ #FFECB3 — Dorado Ámbar Tenue
                vocalGlowRef.current.style.background =
                    `radial-gradient(circle ${gR.toFixed(0)}px at 50% 50%,` +
                    `hsla(45,100%,84%,${op1}) 0%,` +
                    `hsla(45,80%,78%,${op2}) 38%,` +
                    `hsla(40,60%,72%,${op3}) 62%,` +
                    `transparent 80%)`;
                // Blur real en el elemento para efecto "luz celestial"
                vocalGlowRef.current.style.filter =
                    `blur(${(18 + s.vocalGlow * 22).toFixed(0)}px)`;
            }

            // ─ KEY WORD FLASH (decaying) ──────────────────────────
            s.keyFlash *= 0.91;
            if (keyFlashRef.current) {
                keyFlashRef.current.style.opacity = Math.min(s.keyFlash, 1).toFixed(3);
            }

            // ─ GUITAR → Tipografía Sepia + letter-spacing ────────
            // Cada rasgueo lleva el texto de negro a Marrón Sepia (#5D4037)
            const gDelta = r.guitar - s.guitarPrev;
            s.guitarPrev = r.guitar;
            const isAttack = gDelta > 0.07;
            const gDamp = isAttack ? DAMP.snap : DAMP.water;

            s.guitarWeight = damp(s.guitarWeight, 300 + r.guitar * 600, gDamp);
            s.guitarSpacing = damp(s.guitarSpacing, r.guitar * 12, gDamp);
            s.guitarX = damp(s.guitarX, isAttack ? (Math.random() - 0.5) * 12 : 0, gDamp);
            s.guitarTextColor = damp(s.guitarTextColor, Math.min(1, r.guitar * 1.6), DAMP.water);

            // Interpolar: #2A2520 (oscuro) → #5D4037 (sepia madera) — contraste mayor
            const tR = Math.round(42 + s.guitarTextColor * (93 - 42));
            const tG = Math.round(37 + s.guitarTextColor * (64 - 37));
            const tB = Math.round(32 + s.guitarTextColor * (55 - 32));
            const sepiaColor = `rgb(${tR},${tG},${tB})`;
            // Filtro sepia en la imagen también, da textura 1972
            if (!reduced && imageRef.current && r.guitar > 0.05) {
                const sepiaAmt = (s.guitarTextColor * 0.35).toFixed(2);
                imageRef.current.style.filter +=
                    ` sepia(${sepiaAmt})`;
            }

            // "Two of us" letter-spacing global boost
            const twoBoost = s.globalSpacing > 0 ? damp(0, 8, 0.04) : 0;
            if (s.globalSpacing > 0) s.globalSpacing = damp(s.globalSpacing, 0, 0.008);
            const totalSpacing = s.guitarSpacing + twoBoost;

            if (titleWordRef.current) {
                titleWordRef.current.style.fontWeight = s.guitarWeight.toFixed(0);
                titleWordRef.current.style.letterSpacing = `${totalSpacing.toFixed(2)}px`;
                titleWordRef.current.style.color = sepiaColor;
            }
            if (titleRef.current) {
                if (twoBoost > 0.5) (titleRef.current as HTMLElement).style.letterSpacing = `${(twoBoost * 0.5).toFixed(2)}px`;
                else (titleRef.current as HTMLElement).style.letterSpacing = '';
                (titleRef.current as HTMLElement).style.color = sepiaColor;
            }
            if (lyricRef.current) {
                lyricRef.current.style.transform = `translateX(${s.guitarX.toFixed(2)}px)`;
                lyricRef.current.style.letterSpacing = `${(totalSpacing * 0.4).toFixed(2)}px`;
                lyricRef.current.style.color = sepiaColor;
            }
            if (quoteRef.current) {
                quoteRef.current.style.borderLeftColor = `rgba(180,160,120,${(r.guitar * 0.7).toFixed(3)})`;
                quoteRef.current.style.color = sepiaColor;
            }

            // ─ BASS → Gris Carbón PROFUNDO — esquinas que se cierran ──
            s.bassInset = damp(s.bassInset, r.bass, DAMP.water);
            if (bassVigRef.current) {
                const sh = s.bassInset * 180;                      // radio 180px vs 110px
                const op = (s.bassInset * 0.42).toFixed(3);        // opacidad 0.42 vs 0.22
                bassVigRef.current.style.boxShadow =
                    `inset 0 0 ${sh.toFixed(0)}px rgba(66,66,66,${op}),` +
                    `inset 0 0 ${(sh * 0.4).toFixed(0)}px rgba(30,20,10,${(s.bassInset * 0.2).toFixed(3)})`;
            }
            const now = performance.now();
            const bassDelta = r.bass - s.bassPrev;
            s.bassPrev = r.bass;
            if (bassDelta > 0.08 && now - lastBassTransient > 250) {  // más sensible
                lastBassTransient = now;
                emitRipple(r.bass);
            }

            // ─ FONDO — Evolución cromática MUY VISIBLE ────────────
            // El fondo debe sentirse cambiando mientras la canción avanza
            const targetWarmth = s.globalSpacing > 0.01 ? 1.0
                : r.vocals > 0.05 ? 0.5 + r.vocals * 0.7           // calienta agresivo con voz
                    : r.bass > 0.1 ? 0.15 + r.bass * 0.3            // algo de calor con el bajo
                        : 0;
            s.bgWarmth = damp(s.bgWarmth, targetWarmth, 0.015);      // 2.5x más rápido
            // #F9F9F9 → #FFF9E1  (R+6, G+0, B-24) — rango ampliado
            const bgR = Math.round(249 + s.bgWarmth * 10);          // más rojo-ámbar
            const bgG = Math.round(249 - s.bgWarmth * 4);           // verde baja levemente
            const bgB = Math.round(249 - s.bgWarmth * 42);          // azul baja mucho = más cálido
            if (sectionRef.current) {
                sectionRef.current.style.backgroundColor = `rgb(${bgR},${bgG},${bgB})`;
            }

            // ─ CRESCENDO — Toda la página late NOTORIAMENTE ───────
            const crescendoTarget = 1 + Math.min(1, (r.bass + r.other) * 0.8) * 0.012; // 0.005 → 0.012
            s.crescendoScale = damp(s.crescendoScale, crescendoTarget, 0.04);
            if (sectionRef.current) {
                sectionRef.current.style.transform = `scale(${s.crescendoScale.toFixed(5)})`;
            }

            // ─ OTHER/VIOLINES → SonicWave intensa + canvas sube alto ─
            s.otherAmp = damp(s.otherAmp, r.other, DAMP.water);
            if (waveRef.current?.setAmplitude) {
                waveRef.current.setAmplitude(s.otherAmp * 1.4);   // 0.7 → 1.4 doble
            }
            if (canvasWrapRef.current) {
                const targetH = 80 + s.otherAmp * (VH * 0.45 - 80); // sube hasta 45vh
                canvasWrapRef.current.style.height = `${targetH.toFixed(0)}px`;
                canvasWrapRef.current.style.opacity = `${(0.5 + s.otherAmp * 0.5).toFixed(3)}`;
            }

            // ─ COROS → vignette lateral MUY CÁLIDA ───────────────
            s.corosIntensity = damp(s.corosIntensity, r.coros, DAMP.water);
            const coOp = Math.min(0.7, s.corosIntensity * 0.75).toFixed(3); // 0.3 → 0.75
            if (chorusLRef.current) chorusLRef.current.style.opacity = coOp;
            if (chorusRRef.current) chorusRRef.current.style.opacity = coOp;

            // ─ YEAR watermark ─────────────────────────────────────
            if (yearRef.current) {
                yearRef.current.style.opacity = `${(0.07 + s.bassInset * 0.11).toFixed(3)}`;
            }

            // ─ MOUSE MODE: pre-play ambient wave ─────────────────
            if (!isPlayingRef.current && mouseWaveRef.current) {
                const mx = s.mouseX, my = s.mouseY;
                mouseWaveRef.current.style.background =
                    `radial-gradient(circle 220px at ${(mx * 100).toFixed(1)}% ${(my * 100).toFixed(1)}%,` +
                    `rgba(200,192,175,0.07) 0%, transparent 70%)`;
            }

            // ─ End-of-song: scroll unlock ─────────────────────────
            if (isPlayingRef.current && r.vocals < 0.02 && r.bass < 0.02 && r.guitar < 0.02) {
                s.silenceTimer += 0.016;
                if (s.silenceTimer > 5) {
                    setScrollUnlocked(true);
                }
            } else {
                s.silenceTimer = 0;
            }


        });

        setIsLoaded(true);

        return () => {
            window.removeEventListener('mousemove', handleMouse);
            throttler.stop();
            sonic.destroy();
            fx.destroy();
            overlay?.destroy?.();
            scroll.destroy();
            waveRef.current?.destroy?.();
            lyrics?.destroy?.();
        };
    }, [setupWave, emitRipple]);

    const togglePlay = () => {
        if (!sonicRef.current) return;
        if (isPlaying) {
            sonicRef.current.pause();
            fxRef.current?.stop();
            lyricsRef.current?.stop?.();
        } else {
            sonicRef.current.play();
            fxRef.current?.start();
            lyricsRef.current?.start?.();
            setMouseMode(false);
        }
        setIsPlaying(p => {
            const next = !p;
            isPlayingRef.current = next;
            return next;
        });
    };

    const handleCardClick = (year: string) => {
        setExpandedCard(prev => prev === year ? null : year);
    };

    return (
        <>
            {/* Navbar */}
            <nav className="sonic-navbar" aria-label="Navegación entre actos">
                <span className="sonic-navbar__brand">MJ Tributo</span>
                <div className="sonic-navbar__links">
                    <a href="/" className="sonic-navbar__link active"><span className="sonic-navbar__num">I</span><span className="sonic-navbar__name">Ben</span></a>
                    <a href="/billie-jean" className="sonic-navbar__link"><span className="sonic-navbar__num">II</span><span className="sonic-navbar__name">Billie Jean</span></a>
                    <a href="/scream" className="sonic-navbar__link"><span className="sonic-navbar__num">III</span><span className="sonic-navbar__name">Scream</span></a>
                </div>
            </nav>

            {/* SECTION: SPLIT LAYOUT */}
            <section className="ben-split-layout">
                {/* Left side: Sticky Hero */}
                <div className="sticky-col">
                    <section
                        ref={sectionRef}
                        className={[
                            'ben-hero',
                            mouseMode ? 'mouse-mode' : '',
                            choirDiffuse ? 'choir-diffuse' : '',
                            benActive ? 'ben-word-active' : '',
                            twoOfUsActive ? 'two-of-us-active' : '',
                            scrollUnlocked ? 'scroll-unlocked' : '',
                        ].filter(Boolean).join(' ')}
                        style={{ overflow: scrollUnlocked ? 'visible' : 'hidden' }}
                    >
                        {/* Floating gold particles — CSS only */}
                        <div className="ben-particles" aria-hidden="true">
                            <span className="ben-particle" />
                            <span className="ben-particle" />
                            <span className="ben-particle" />
                            <span className="ben-particle" />
                            <span className="ben-particle" />
                            <span className="ben-particle" />
                        </div>
                        {/* Bass inset layer */}
                        <div className="ben-bass-vig" ref={bassVigRef} />

                        {/* Bass ripple pool */}
                        <div className="ben-ripple-pool" ref={ripplePoolRef} aria-hidden="true" />

                        {/* Key-word flash */}
                        <div className={`ben-key-flash ${benActive ? 'ben-flash' : keyWordActive ? 'active' : ''}`}
                            ref={keyFlashRef} aria-hidden="true" />

                        {/* Mouse-mode ambient wave */}
                        <div className="ben-mouse-wave" ref={mouseWaveRef} aria-hidden="true" />

                        {/* Chorus edge vignette */}
                        <div className="ben-chorus-wave ben-chorus-left" ref={chorusLRef} />
                        <div className="ben-chorus-wave ben-chorus-right" ref={chorusRRef} />

                        {/* Year watermark */}
                        <span className="ben-year" ref={yearRef} aria-hidden="true">1972</span>

                        {/* Violin SonicWave — rising canvas */}
                        <div className="ben-wave-wrap" ref={canvasWrapRef} aria-hidden="true">
                            <canvas ref={canvasRef} className="ben-wave-canvas" />
                        </div>

                        <div className="ben-content">
                            <p className="ben-act">Acto I · 1972</p>

                            <h1 className="ben-title" ref={titleRef}>
                                La Inocencia<br />
                                <span ref={titleWordRef} className="ben-title-word">Aislada</span>
                            </h1>

                            {/* SonicLyrics karaoke */}
                            <div className="ben-lyrics-display" aria-live="polite">
                                <p ref={lyricsLineRef} className={`ben-lyrics-line ${currentLine ? 'visible' : ''}`}>
                                    {currentLine || '\u00A0'}
                                </p>
                                <span ref={lyricsWordRef} className={`ben-lyrics-word ${currentWord ? 'visible' : ''} ${benActive ? 'ben-glow' : ''}`}>
                                    {currentWord}
                                </span>
                            </div>

                            <p className="ben-lyric" ref={lyricRef}>La soledad en medio del éxito</p>

                            {/* Central Portrait */}
                            <div className="ben-image-container">
                                <div className="ben-vocal-glow" ref={vocalGlowRef} aria-hidden="true" />
                                <img
                                    ref={imageRef}
                                    src="/Ben/bensinfondo.png"
                                    alt="Michael Jackson a los 14 años, 1972"
                                    className="ben-image"
                                    loading="eager" decoding="async" width="360" height="520"
                                />
                            </div>

                            <blockquote className="ben-quote" ref={quoteRef}>
                                "Ben, the two of us need look no more…<br />
                                We both found what we were looking for."
                            </blockquote>

                            <button
                                className={`ben-play-btn ${isPlaying ? 'playing' : ''}`}
                                onClick={togglePlay} disabled={!isLoaded}
                                aria-label={isPlaying ? 'Pausar Ben' : 'Reproducir Ben'}
                            >
                                <span className="ben-play-icon" aria-hidden="true">{isPlaying ? '❚❚' : '▶'}</span>
                                <span className="ben-play-text">{isPlaying ? 'Pausar' : 'Escuchar "Ben"'}</span>
                            </button>
                        </div>
                    </section>
                </div>

                {/* Right side: Scrolling Narrative */}
                <div className="scroll-col">
                    <section className="ben-narrative" aria-label="Historia de Ben">
                        <div className="ben-narrative-line" aria-hidden="true" />
                        {[
                            { year: '1963', title: 'El niño que nunca jugó', text: 'La pérdida de la infancia. Mientras otros niños descubrían el mundo, Michael descubría la disciplina marcial.', deepContext: 'A los 5 años, la sala de estar de los Jackson no era un lugar de juegos, era un centro de entrenamiento. Las "5 horas de ensayo" no eran una opción; eran el estándar impuesto por Joe Jackson. Michael miraba por la ventana a otros niños jugar en el parque mientras él perfeccionaba el footwork.', meaning: 'El éxito llegó antes que la capacidad de procesarlo. Michael aprendió que el amor y la aceptación estaban condicionados al rendimiento perfecto.', side: 'left', delay: 0 },
                            { year: '1969', title: 'Jackson 5: La máquina de éxitos', text: 'El peso de la corona a los 11 años. De niño a producto global.', deepContext: 'Con hits como "I Want You Back", Michael se convirtió en el rostro de la Motown. Era el centro de una maquinaria que no podía permitirse fallar. A los 11 años, él era el sustento económico de una familia de diez personas y el pilar de un imperio discográfico.', meaning: 'La presión era "absoluta". Michael empezó a desarrollar una hiper-vigilancia y una búsqueda de perfección que rozaba la ansiedad. Ya no era Michael; era "el pequeño Michael".', side: 'right', delay: 120 },
                            { year: '1972', title: '"Ben": Un canto a la amistad', text: 'El espejo de la soledad. Cuando un niño solo puede ser él mismo ante un animal.', deepContext: 'Originalmente escrita para la secuela de una película de terror sobre ratas, Michael transformó "Ben" en algo profundamente personal. Para él, Ben no era una rata; era el concepto de alguien que te acepta sin pedirte un hit a cambio. Es el año de su primer éxito masivo como solista. Mientras el mundo celebraba su voz, él cantaba "If you ever look behind and don\'t like what you find", una confesión directa de su soledad. Fue su primer grito de auxilio disfrazado de balada pop.', meaning: '', side: 'left', delay: 240 },
                            { year: '1974', title: 'El reflejo en el espejo', text: 'La fragmentación de la identidad. El inicio de la lucha con su propia imagen.', deepContext: 'En plena adolescencia, Joe Jackson comenzó a burlarse cruelmente de las facciones de Michael, especialmente de su nariz. Estas críticas, en el momento más vulnerable de su desarrollo, crearon una dismorfia que lo perseguiría siempre.', meaning: 'Michael empezó a odiar el espejo. La música seguía siendo su refugio, pero su cuerpo se convirtió en su prisión. "Ben" seguía resonando, pero ahora la soledad era interna.', side: 'right', delay: 360 },
                        ].map((item) => {
                            const isExpanded = expandedCard === item.year;
                            return (
                                <article key={item.year} data-scroll="slideUp" data-scroll-delay={String(item.delay)}
                                    className={`ben-narrative-card ${isExpanded ? 'expanded' : ''}`}
                                    onClick={() => handleCardClick(item.year)}>
                                    <time className="ben-narrative-year" dateTime={item.year}>{item.year}</time>
                                    <h3 className="ben-narrative-title">{item.title}</h3>
                                    <p className="ben-narrative-text">{item.text}</p>
                                    <div className="card-content-deep">
                                        <p className="ben-narrative-context">{item.deepContext}</p>
                                        {item.meaning && <p className="ben-narrative-meaning">{item.meaning}</p>}
                                    </div>
                                </article>
                            );
                        })}
                    </section>
                </div>
            </section>
        </>
    );
}
