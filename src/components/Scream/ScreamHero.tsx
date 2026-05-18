import { useState, useEffect, useRef, useCallback } from 'react';
import SonicMotion from 'sonicmotion';

export default function ScreamHero() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [glitchActive, setGlitchActive] = useState(false);
    const sonicRef = useRef<any>(null);

    const heroRef = useRef<HTMLElement>(null);
    const titleRef = useRef<HTMLHeadingElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const subtitleRef = useRef<HTMLParagraphElement>(null);
    const noiseOverlayRef = useRef<HTMLDivElement>(null);
    const chromaRef = useRef<HTMLDivElement>(null);
    const fractureRef = useRef<HTMLDivElement>(null);
    const glitchBar1 = useRef<HTMLDivElement>(null);
    const glitchBar2 = useRef<HTMLDivElement>(null);
    const glitchBar3 = useRef<HTMLDivElement>(null);

    // Transient detection for "Scream" peaks
    const prevVocalsRef = useRef(0);
    const screamTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const screamActiveRef = useRef(false);
    const glitchIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const triggerScream = useCallback(() => {
        if (screamActiveRef.current) return;
        screamActiveRef.current = true;
        setGlitchActive(true);

        // Chromatic aberration shake
        if (chromaRef.current) {
            chromaRef.current.style.opacity = '1';
            chromaRef.current.style.transform = 'translate(-6px, 3px)';
        }
        if (fractureRef.current) {
            fractureRef.current.style.opacity = '1';
        }
        if (heroRef.current) {
            heroRef.current.style.animation = 'scream-shake 0.15s ease-in-out';
        }

        // Random glitch bars
        const bars = [glitchBar1.current, glitchBar2.current, glitchBar3.current];
        glitchIntervalRef.current = setInterval(() => {
            bars.forEach(bar => {
                if (!bar) return;
                bar.style.top = `${Math.random() * 90}%`;
                bar.style.height = `${3 + Math.random() * 12}px`;
                bar.style.opacity = `${0.3 + Math.random() * 0.6}`;
                bar.style.left = `${Math.random() * 30}%`;
                bar.style.width = `${40 + Math.random() * 60}%`;
            });
        }, 40);

        if (screamTimeoutRef.current) clearTimeout(screamTimeoutRef.current);
        screamTimeoutRef.current = setTimeout(() => {
            screamActiveRef.current = false;
            setGlitchActive(false);
            if (chromaRef.current) {
                chromaRef.current.style.opacity = '0';
                chromaRef.current.style.transform = 'translate(0,0)';
            }
            if (fractureRef.current) fractureRef.current.style.opacity = '0';
            if (heroRef.current) heroRef.current.style.animation = '';
            if (glitchIntervalRef.current) clearInterval(glitchIntervalRef.current);
            const bars = [glitchBar1.current, glitchBar2.current, glitchBar3.current];
            bars.forEach(bar => { if (bar) bar.style.opacity = '0'; });
        }, 400);
    }, []);

    useEffect(() => {
        const sonic = SonicMotion.create({
            master: '/Scream/master.mp3',
            stems: {
                vocals: '/Scream/vocals.mp3',
                bass: '/Scream/bass.mp3',
                drums: '/Scream/drums.mp3',
                other: '/Scream/other.mp3',
            }
        });
        sonicRef.current = sonic;

        sonic.onFrame((data: any) => {
            const vocalsVal = data.vocals?.value ?? 0;
            const bassVal = data.bass?.value ?? 0;
            const drumsVal = data.drums?.value ?? 0;
            const otherVal = data.other?.value ?? 0;
            const now = Date.now();

            // ── SCREAM TRANSIENT: vocals spike = screen break ──
            const screamThreshold = 0.7;
            const isScream = vocalsVal > screamThreshold && prevVocalsRef.current < screamThreshold;
            prevVocalsRef.current = vocalsVal;
            if (isScream) triggerScream();

            // ── TITLE: industrial shake with drums ──
            if (titleRef.current) {
                const shakeX = drumsVal > 0.5 ? (Math.random() - 0.5) * drumsVal * 8 : 0;
                const shakeY = drumsVal > 0.5 ? (Math.random() - 0.5) * drumsVal * 4 : 0;
                const contrast = 1 + drumsVal * 0.6;
                titleRef.current.style.transform = `translate(${shakeX}px, ${shakeY}px)`;
                titleRef.current.style.filter = `contrast(${contrast})`;
            }

            // ── IMAGE: heavy distortion on peak ──
            if (imageRef.current) {
                const hueR = drumsVal > 0.4 ? (Math.random() - 0.5) * drumsVal * 40 : 0;
                const saturate = 0.2 + otherVal * 1.8;
                const brightness = 0.7 + bassVal * 0.8;
                imageRef.current.style.filter = `saturate(${saturate}) brightness(${brightness}) hue-rotate(${hueR}deg) contrast(${1 + drumsVal * 0.4})`;
                const scale = 1 + drumsVal * 0.04;
                imageRef.current.style.transform = `scale(${scale})`;
            }

            // ── NOISE OVERLAY intensity ──
            if (noiseOverlayRef.current) {
                noiseOverlayRef.current.style.opacity = `${0.03 + otherVal * 0.12}`;
            }

            // ── SUBTITLE: glitch color flicker ──
            if (subtitleRef.current && !screamActiveRef.current) {
                const flicker = Math.sin(now * 0.005) * drumsVal;
                const r = Math.floor(200 + flicker * 55);
                subtitleRef.current.style.color = drumsVal > 0.4
                    ? `rgb(${r}, ${Math.floor(200 - flicker * 100)}, ${Math.floor(200 - flicker * 100)})`
                    : '#aaaaaa';
            }
        });

        setIsLoaded(true);
        return () => {
            sonic.destroy();
            if (screamTimeoutRef.current) clearTimeout(screamTimeoutRef.current);
            if (glitchIntervalRef.current) clearInterval(glitchIntervalRef.current);
        };
    }, [triggerScream]);

    const togglePlay = () => {
        if (!sonicRef.current) return;
        isPlaying ? sonicRef.current.pause() : sonicRef.current.play();
        setIsPlaying(!isPlaying);
    };

    return (
        <>
            {/* ── Navbar global ──────────────────────────────────────── */}
            <nav className="sonic-navbar" aria-label="Navegación entre actos">
                <span className="sonic-navbar__brand">MJ Tributo</span>
                <div className="sonic-navbar__links">
                    <a href="/"            className="sonic-navbar__link">
                        <span className="sonic-navbar__num">I</span>
                        <span className="sonic-navbar__name">Ben</span>
                    </a>
                    <a href="/billie-jean"  className="sonic-navbar__link">
                        <span className="sonic-navbar__num">II</span>
                        <span className="sonic-navbar__name">Billie Jean</span>
                    </a>
                    <a href="/scream"       className="sonic-navbar__link active">
                        <span className="sonic-navbar__num">III</span>
                        <span className="sonic-navbar__name">Scream</span>
                    </a>
                </div>
            </nav>

            <section
                className={`scream-hero ${glitchActive ? 'glitching' : ''}`}
                ref={heroRef}
                style={{ paddingTop: '58px' }}
            >
            {/* Glitch effect layers */}
            <div className="scream-noise" ref={noiseOverlayRef}></div>
            <div className="scream-chroma" ref={chromaRef}></div>
            <div className="scream-fracture" ref={fractureRef}></div>
            <div className="scream-glitch-bar" ref={glitchBar1}></div>
            <div className="scream-glitch-bar" ref={glitchBar2}></div>
            <div className="scream-glitch-bar" ref={glitchBar3}></div>

            {/* Static scanlines texture */}
            <div className="scream-scanlines"></div>

            <div className="scream-content">
                <p className="scream-act">Acto III</p>

                <h1 className="scream-title" ref={titleRef}>
                    <span className="scream-title-white">La</span>{' '}
                    <span className="scream-title-accent">Armadura</span>
                    <br />
                    <span className="scream-title-white">Tecnológica</span>
                </h1>

                <p className="scream-subtitle" ref={subtitleRef}>
                    Agresión controlada · Vanguardia · Caos Digital
                </p>

                <div className="scream-image-wrap">
                    <img
                        ref={imageRef}
                        src="/Scream/scream.webp"
                        alt="Michael Jackson — Scream, 1995"
                        className="scream-image"
                    />
                    {/* Chroma aberration duplicate */}
                    <img
                        src="/Scream/scream.webp"
                        alt=""
                        aria-hidden="true"
                        className="scream-image-ghost"
                    />
                </div>

                <div className="scream-metadata">
                    <div className="scream-meta-item">
                        <span className="scream-meta-value">$7M</span>
                        <span className="scream-meta-label">Video más caro de la historia (1995)</span>
                    </div>
                    <div className="scream-meta-divider"></div>
                    <div className="scream-meta-item">
                        <span className="scream-meta-value">1995</span>
                        <span className="scream-meta-label">Debut en #5 — récord del Billboard</span>
                    </div>
                    <div className="scream-meta-divider"></div>
                    <div className="scream-meta-item">
                        <span className="scream-meta-value">Janet</span>
                        <span className="scream-meta-label">Primera colaboración con su hermana</span>
                    </div>
                </div>

                <button
                    className={`scream-play-btn ${isPlaying ? 'playing' : ''}`}
                    onClick={togglePlay}
                    disabled={!isLoaded}
                >
                    <span className="scream-play-icon">{isPlaying ? '❚❚' : '▶'}</span>
                    <span className="scream-play-text">
                        {isPlaying ? 'Pausar' : 'Escuchar "Scream"'}
                    </span>
                </button>
            </div>
        </section>
        </>
    );
}
