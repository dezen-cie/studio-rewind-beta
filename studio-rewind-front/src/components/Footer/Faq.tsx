import { useState } from 'react'
import { ChevronDown } from "lucide-react"

import './Faq.css'

type FaqItem = {
    question: string
    answer: string
}

const FAQ_DATA: FaqItem[] = [
    {
        question: "Est-ce que vous disposez d’un téléprompteur ?",
        answer: "Oui, un téléprompteur est disponible en option sur demande."
    },
    {
        question: "Quels types de podcasts puis-je enregistrer dans vos studios ?",
        answer: "Vous pouvez enregistrer tous types de formats : interviews, solo, conversations à plusieurs, table ronde, voice-over, contenus vidéos et podcasts filmés."
    },
    {
        question: "Comment se déroule une séance d’enregistrement ?",
        answer: "À votre arrivée, l’ingénieur du son vous accueille, effectue les réglages techniques, puis vous accompagne pendant toute la durée de l’enregistrement. Une fois terminé, nous assurons le transfert et la sauvegarde de vos fichiers."
    },
    {
        question: "Proposez-vous des services de post-production ?",
        answer: "Oui, nous proposons le montage audio, le mixage, le nettoyage des pistes, l’ajout de musiques/jingles ainsi que l’étalonnage et le montage vidéo si vous filmez votre podcast."
    },
    {
        question: "Comment vais-je recevoir mes fichiers ?",
        answer: "Vos fichiers audio/vidéo sont livrés par lien de téléchargement sécurisé sous 48 à 72h."
    },
    {
        question: "Puis-je annuler ou modifier ma réservation ?",
        answer: "Oui, les réservations peuvent être modifiées ou annulées sans frais jusqu’à 24h avant la séance. Passé ce délai, des frais peuvent s’appliquer."
    },
    {
        question: "Quels équipements sont fournis/inclus ?",
        answer: "Nous fournissons des micros professionnels, casques, bras articulés, un enregistreur multicanal, un fond studio, un éclairage de base et l’accompagnement de notre technicien."
    }
]



function FAQ(){

    const [openIndex, setOpenIndex] = useState<number | null>(null)

    const handleToggle = (index: number) => {
        setOpenIndex((prev) => (prev === index ? null : index))
    }

    return(
        
        <div className="faq">

            <h3 className="subtitle">Questions Fréquentes</h3>

            {FAQ_DATA.map((item, index) => (
                <div key={index} className="faq-row">
                    <div 
                        className="faq-header"
                        onClick={() => handleToggle(index)}
                    >
                        <span className="faq-question">{item.question}</span>
                        <ChevronDown
                            className={`faq-chevron ${openIndex === index ? 'faq-chevron--open' : ''}`}
                            size={16}
                        />
                    </div>
                    
                    {openIndex === index && (
                        <div className="faq-answer">
                            <span className="faq-answer">{item.answer}</span>
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}

export default FAQ