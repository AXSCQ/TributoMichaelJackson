import { useState, useEffect, useRef } from 'react';

const TIMELINE = [
    { year: '1982', event: 'Thriller se convierte en el álbum más vendido de la historia.' },
    { year: '1983', event: 'El Moonwalk debuta en vivo en el special "Motown 25". El mundo se detiene.' },
    { year: '1983', event: '"Billie Jean" pasa 7 semanas en el #1 del Billboard Hot 100.' },
    { year: '1984', event: 'Gana 8 Grammys en una sola noche — récord que duró décadas.' },
    { year: '1987', event: 'El tour "Bad World Tour": 4.4 millones de espectadores en 123 shows.' },
];

export default function BillieJeanNarrative() {
    const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());
    const itemRefs = useRef<(HTMLLIElement | null)[]>([]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    const idx = Number(entry.target.getAttribute('data-idx'));
                    if (entry.isIntersecting) {
                        setVisibleItems((prev) => new Set(prev).add(idx));
                    }
                });
            },
            { threshold: 0.4, rootMargin: '0px 0px -40px 0px' }
        );
        itemRefs.current.forEach((el) => { if (el) observer.observe(el); });
        return () => observer.disconnect();
    }, []);

    return (
        <section className="bj-narrative">
            <div className="bj-narrative-title-wrap">
                <span className="bj-narrative-label">La Transformación</span>
                <h2 className="bj-narrative-heading">De niño prodigio a leyenda</h2>
            </div>
            <ul className="bj-timeline">
                {TIMELINE.map((item, i) => (
                    <li
                        key={i}
                        data-idx={i}
                        ref={(el) => { itemRefs.current[i] = el; }}
                        className={`bj-timeline-item ${visibleItems.has(i) ? 'visible' : ''}`}
                    >
                        <span className="bj-timeline-year">{item.year}</span>
                        <div className="bj-timeline-dot"></div>
                        <p className="bj-timeline-event">{item.event}</p>
                    </li>
                ))}
            </ul>
        </section>
    );
}
