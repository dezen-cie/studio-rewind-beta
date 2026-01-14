// import { Link } from 'react-router-dom' // TEMPORAIREMENT MASQUÉ
import { useEffect, useRef } from 'react'
import './Hiw.css'

function Hiw() {
    const itemsRef = useRef<(HTMLElement | null)[]>([])

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('number--visible')
                        observer.unobserve(entry.target)
                    }
                })
            },
            {
                threshold: 0.3,
            }
        )

        itemsRef.current.forEach((el) => {
            if (el) observer.observe(el)
        })

        return () => observer.disconnect()
    }, [])

    return (
        <section className="hiw">
            <h3 className="subtitle">Comment ça marche?</h3>

            <p className="subtitle-baseline">
                Réserve et tourne dans le studio en 3 étapes simples
            </p>

            <div className="hiw-grid">
                <article
                    className="number number1"
                    ref={(el) => {
                    itemsRef.current[0] = el
                    }}
                >
                    <p className="number-subtitle">Etape 1 / Choisis ta formule:</p>
                    <p className="number-text">Selon ton niveau d'accompagnement. Automome - Ameliorée - Pack d'heures - formule réseaux</p>
                </article>

                <article
                    className="number number2"
                    ref={(el) => {
                    itemsRef.current[1] = el
                    }}
                >
                    <p className="number-subtitle">Etape 2 / Choisis un créneau</p>
                    <p className="number-text">Réservation en ligne - calendrier en temps réel - paiement sécurisé</p>
                </article>

                <article
                    className="number number3"
                    ref={(el) => {
                    itemsRef.current[2] = el
                    }}
                >
                    <p className="number-subtitle">Etape 3 / Tourne dans un studio prêt à l'emploi</p>
                    <p className="number-text">Tu arrives : tout est déjà installé. Tu n'a plus qu'à enregistrer.</p>
                </article>
            </div>

            {/* TEMPORAIREMENT MASQUÉ - CTA Réservation
            <Link className="btn btn-primary" to="/" state={{ scrollTo: "formules" }}>
                Voir les formules & les tarifs
            </Link>
            */}
        </section>
    )
}

export default Hiw
