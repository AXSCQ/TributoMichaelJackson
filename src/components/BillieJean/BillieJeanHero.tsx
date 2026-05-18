import { useState, useEffect, useRef } from 'react';
import SonicMotion from 'sonicmotion';

// Grid items representing "projects"/cards that dance with the beat
const GRID_ITEMS = [
    { id: 1, label: 'Thriller', year: '1982', sub: '65M copias vendidas' },
    { id: 2, label: 'Bad', year: '1987', sub: '45M copias vendidas' },
    { id: 3, label: 'Dangerous', year: '1991', sub: '32M copias vendidas' },
    { id: 4, label: 'HIStory', year: '1995', sub: '22M copias vendidas' },
    { id: 5, label: 'Moonwalk', year: '1983', sub: 'El paso que definió una era' },
    { id: 6, label: 'MTV', year: '1983', sub: 'Primer artista negro en rotación' },
];

export default function BillieJeanHero() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const sonicRef = useRef<any>(null);

    // Title refs
    const titleRef = useRef<HTMLHeadingElement>(null);
    const subtitleRef = useRef<HTMLParagraphElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const actRef = useRef<HTMLParagraphElement>(null);

    // Bass transient: the iconic kick
    const kickLineRef = useRef<HTMLDivElement>(null);
    const bassFlashRef = useRef<HTMLDivElement>(null);
    const tileGridRef = useRef<HTMLDivElement>(null);
    const tileRefs = useRef<(HTMLDivElement | null)[]>([]);

    // Ambient electric accents
    const electricLeft = useRef<HTMLDivElement>(null);
    const electricRight = useRef<HTMLDivElement>(null);
    const scanlineRef = useRef<HTMLDivElement>(null);

    // Track previous bass for transient detection
    const prevBassRef = useRef(0);
    const kickStateRef = useRef(false);
    const kickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const sonic = SonicMotion.create({
            master: '/BillieJean/master.mp3',
            stems: {
                vocals: '/BillieJean/vocal.mp3',
                bass: '/BillieJean/bass.mp3',
                coros: '/BillieJean/coros.mp3',
                guitar_electric: '/BillieJean/guitar-electric.mp3',
                guitar_acoustic: '/BillieJean/guitar-acoustic.mp3',
                other: '/BillieJean/other.mp3',
            }
        });
        sonicRef.current = sonic;

        sonic.onFrame((data: any) => {
            const bassVal = data.bass?.value ?? 0;
            const vocalsVal = data.vocals?.value ?? 0;
            const otherVal = data.other?.value ?? 0;
            const guitarElVal = data.guitar_electric?.value ?? 0;
            const corosVal = data.coros?.value ?? 0;
            const now = Date.now();

            // ── TRANSIENT DETECTION for the kick ──
            const kickThreshold = 0.55;
            const isKick = bassVal > kickThreshold && prevBassRef.current < kickThreshold;
            prevBassRef.current = bassVal;

            if (isKick && !kickStateRef.current) {
                kickStateRef.current = true;
                if (kickTimeoutRef.current) clearTimeout(kickTimeoutRef.current);
                // On kick: tiles shift + glow
                tileRefs.current.forEach((tile, i) => {
                    if (!tile) return;
                    const dir = i % 2 === 0 ? 1 : -1;
                    tile.style.transform = `translateY(${dir * 5}px) scale(1.04)`;
                    tile.style.boxShadow = `0 0 30px rgba(0, 120, 255, 0.7), inset 0 0 20px rgba(0,80,200,0.3)`;
                    tile.style.borderColor = `rgba(0, 140, 255, 0.8)`;
                });
                if (bassFlashRef.current) {
                    bassFlashRef.current.style.opacity = '0.35';
                }
                if (kickLineRef.current) {
                    kickLineRef.current.style.opacity = '1';
                    kickLineRef.current.style.transform = 'scaleX(1.04)';
                }
                kickTimeoutRef.current = setTimeout(() => {
                    kickStateRef.current = false;
                    tileRefs.current.forEach(tile => {
                        if (!tile) return;
                        tile.style.transform = '';
                        tile.style.boxShadow = '';
                        tile.style.borderColor = '';
                    });
                    if (bassFlashRef.current) bassFlashRef.current.style.opacity = '0';
                    if (kickLineRef.current) {
                        kickLineRef.current.style.opacity = '0.15';
                        kickLineRef.current.style.transform = 'scaleX(1)';
                    }
                }, 120);
            }

            // ── TITLE breathes with vocals ──
            if (titleRef.current) {
                const glow = vocalsVal * 30;
                titleRef.current.style.textShadow = `0 0 ${glow}px rgba(0, 140, 255, ${vocalsVal * 0.7}), 0 0 ${glow * 2}px rgba(200, 0, 255, ${vocalsVal * 0.3})`;
                titleRef.current.style.transform = `scale(${1 + vocalsVal * 0.02})`;
            }

            // ── IMAGE pulses with bass continuously ──
            if (imageRef.current) {
                const glowB = bassVal * 60;
                const glowM = guitarElVal * 40;
                imageRef.current.style.filter =
                    `drop-shadow(0 0 ${glowB}px rgba(0,120,255,${bassVal * 0.6})) drop-shadow(0 0 ${glowM}px rgba(220,0,255,${guitarElVal * 0.4}))`;
                imageRef.current.style.transform = `scale(${1 + bassVal * 0.03})`;
            }

            // ── ELECTRIC SIDE ACCENTS (guitar electric) ──
            if (electricLeft.current) {
                const h = 200 + guitarElVal * 60;
                const op = guitarElVal * 0.5;
                electricLeft.current.style.height = `${h}px`;
                electricLeft.current.style.opacity = `${op}`;
            }
            if (electricRight.current) {
                const h = 200 + corosVal * 70;
                const op = corosVal * 0.45;
                electricRight.current.style.height = `${h}px`;
                electricRight.current.style.opacity = `${op}`;
            }

            // ── SCANLINE moves with other ──
            if (scanlineRef.current) {
                const pct = (Math.sin(now * 0.0012) * 0.5 + 0.5) * 100;
                scanlineRef.current.style.top = `${pct}%`;
                scanlineRef.current.style.opacity = `${otherVal * 0.25}`;
            }

            // ── SUBTITLE color shift ──
            if (subtitleRef.current) {
                const hue = 200 + guitarElVal * 80;
                subtitleRef.current.style.color = `hsl(${hue}, 80%, 70%)`;
            }

            // ── BASS continuous ambient glow on tiles ──
            tileRefs.current.forEach((tile, i) => {
                if (!tile || kickStateRef.current) return;
                const phase = Math.sin(now * 0.001 + i * 0.8) * 0.5 + 0.5;
                const glow = bassVal * 15 * phase;
                tile.style.boxShadow = `0 0 ${glow}px rgba(0,100,255,${bassVal * 0.3})`;
            });
        });

        setIsLoaded(true);
        return () => { sonic.destroy(); };
    }, []);

    const togglePlay = () => {
        if (!sonicRef.current) return;
        isPlaying ? sonicRef.current.pause() : sonicRef.current.play();
        setIsPlaying(!isPlaying);
    };

    return (
        <>
            {/* ── Navbar global ─────────────────────────────────────────── */}
            <nav className="sonic-navbar" aria-label="Navegación entre actos">
                <span className="sonic-navbar__brand">MJ Tributo</span>
                <div className="sonic-navbar__links">
                    <a href="/"            className="sonic-navbar__link">
                        <span className="sonic-navbar__num">I</span>
                        <span className="sonic-navbar__name">Ben</span>
                    </a>
                    <a href="/billie-jean"  className="sonic-navbar__link active">
                        <span className="sonic-navbar__num">II</span>
                        <span className="sonic-navbar__name">Billie Jean</span>
                    </a>
                    <a href="/scream"       className="sonic-navbar__link">
                        <span className="sonic-navbar__num">III</span>
                        <span className="sonic-navbar__name">Scream</span>
                    </a>
                </div>
            </nav>

            <section className="bj-hero" style={{ paddingTop: '58px' }}>
            {/* Background layers */}
            <div className="bj-grid-bg"></div>
            <div className="bj-bass-flash" ref={bassFlashRef}></div>
            <div className="bj-scanline" ref={scanlineRef}></div>

            {/* Side electric accents */}
            <div className="bj-electric bj-electric-left" ref={electricLeft}></div>
            <div className="bj-electric bj-electric-right" ref={electricRight}></div>

            {/* Kick indicator line */}
            <div className="bj-kick-line" ref={kickLineRef}></div>

            <div className="bj-content">
                <p className="bj-act" ref={actRef}>Acto II</p>
                <h1 className="bj-title" ref={titleRef}>
                    El Trono<br />del Ritmo
                </h1>
                <p className="bj-subtitle" ref={subtitleRef}>
                    Autoconfianza · Misterio · Pulso Eléctrico
                </p>

                <div className="bj-image-container">
                    <img
                        ref={imageRef}
                        src="/BillieJean/billejean.webp"
                        alt="Michael Jackson — Billie Jean, 1982"
                        className="bj-image"
                    />
                </div>

                {/* The dynamic grid that "walks" with the kick */}
                <div className="bj-tile-grid" ref={tileGridRef}>
                    {GRID_ITEMS.map((item, i) => (
                        <div
                            key={item.id}
                            ref={(el) => { tileRefs.current[i] = el; }}
                            className="bj-tile"
                        >
                            <span className="bj-tile-year">{item.year}</span>
                            <h3 className="bj-tile-label">{item.label}</h3>
                            <p className="bj-tile-sub">{item.sub}</p>
                        </div>
                    ))}
                </div>

                <button
                    className={`bj-play-btn ${isPlaying ? 'playing' : ''}`}
                    onClick={togglePlay}
                    disabled={!isLoaded}
                >
                    <span className="bj-play-icon">{isPlaying ? '❚❚' : '▶'}</span>
                    <span className="bj-play-text">{isPlaying ? 'Pausar' : 'Escuchar "Billie Jean"'}</span>
                </button>
            </div>
        </section>
        </>
    );
}
