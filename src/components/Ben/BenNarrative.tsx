import { useEffect, useRef, useState } from 'react';

const NARRATIVE_DATA = [
    {
        title: 'El niño que nunca jugó',
        text: 'A los 5 años, Michael ya ensayaba 5 horas diarias. Mientras otros niños jugaban en la calle, él perfeccionaba rutinas de baile bajo la mirada severa de su padre, Joe Jackson. El éxito llegó antes que la infancia.',
        year: '1963',
    },
    {
        title: 'Jackson 5: La máquina de éxitos',
        text: 'El grupo firmó con Motown Records. Sus primeros cuatro sencillos llegaron al número 1. Michael, con apenas 11 años, era la voz principal y el centro del espectáculo. La presión era absoluta.',
        year: '1969',
    },
    {
        title: '"Ben": Una canción a la soledad',
        text: '"Ben" fue escrita para la secuela de una película de terror sobre ratas. Pero Michael la transformó en algo profundamente personal: un canto a la amistad que nunca tuvo. Una rata de laboratorio era su único confidente imaginario.',
        year: '1972',
    },
    {
        title: 'El reflejo en el espejo',
        text: 'Joe Jackson criticaba constantemente la apariencia de Michael, especialmente su nariz. Estas heridas forjaron una inseguridad que lo acompañaría toda su vida y que más tarde se manifestaría de formas visibles.',
        year: '1974',
    },
];

export default function BenNarrative() {
    const [visibleCards, setVisibleCards] = useState<Set<number>>(new Set());
    const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    const idx = Number(entry.target.getAttribute('data-idx'));
                    if (entry.isIntersecting) {
                        setVisibleCards((prev) => new Set(prev).add(idx));
                    }
                });
            },
            { threshold: 0.3, rootMargin: '0px 0px -60px 0px' }
        );

        cardRefs.current.forEach((card) => {
            if (card) observer.observe(card);
        });

        return () => observer.disconnect();
    }, []);

    return (
        <section className="ben-narrative">
            <div className="ben-narrative-line"></div>

            {NARRATIVE_DATA.map((item, i) => (
                <div
                    key={i}
                    data-idx={i}
                    ref={(el) => { cardRefs.current[i] = el; }}
                    className={`ben-narrative-card ${visibleCards.has(i) ? 'visible' : ''} ${i % 2 === 0 ? 'left' : 'right'}`}
                >
                    <span className="ben-narrative-year">{item.year}</span>
                    <h3 className="ben-narrative-title">{item.title}</h3>
                    <p className="ben-narrative-text">{item.text}</p>
                </div>
            ))}
        </section>
    );
}
