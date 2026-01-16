import { useEffect, useRef } from "react";
import "./Timeline.css";

const items = [
  {
    img: "/images/micro.png",
    imgWebp: "/images/micro.webp",
    title: "Audio",
    icon: "🎙️",
    features: [
      "2 microphones RØDE Podmic",
      "Enregistreur audio Zoom H4 Essential (sécurité et back)",
      "Cablàge audio professionel XLR UGREEN"
    ]
  },
  {
    img: "/images/camera.png",
    imgWebp: "/images/camera.webp",
    title: "Vidéo - captation cinéma",
    icon: "🎥",
    features: [
      "Sony FX30 - caméra cinéma super 35",
      "Sony A7 - caméra plein format cinéma",
      "Trépieds vidéo Neewer pour caméras cinéma"
    ]
  },
  {
    img: "/images/objectif.png",
    imgWebp: "/images/objectif.webp",
    title: "Parc d'objectifs Sony",
    icon: "📷",
    features: [
      "Sony E PZ 18–105 mm G (zoom cinéma polyvalent)",
      "Objectifs Sony à focale fixe (équivalent 50 mm et 100 mm)",
	    "→ plans larges, plans serrés, portraits, profondeur de champ cinéma"
    ]
  },
  {
    img: "/images/light.png",
    imgWebp: "/images/light.webp",
    title: "Éclairage et monitoring",
    icon: "💡",
    features: [
      "2 panneaux LED professionnels Godox",
      "Éclairage d'ambiance Neewer LED RGB",
      "Écrans de retour plateau Godox"
    ]
  },
  {
    img: "/images/regie.png",
    imgWebp: "/images/regie.webp",
    title: "Régie & accessoires",
    icon: "🖥️",
    features: [
      "Logiciel de téléprompteur sur tablette",
      "Câblage audio, vidéo et électrique professionnel",
    ]
  },
  {
    img: "/images/studio.png",
    imgWebp: "/images/studio.webp",
    title: "Décor & ambiance",
    icon: "🛋️",
    features: [
      "Fond noir studio",
      "2 fauteuils cuir",
      "Ambiance cosy, élégante et immersive",
    ]
  }
];

function Timeline() {
  const sectionRef = useRef<HTMLElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const isPausedRef = useRef(false);

  // Animation JS pour un défilement infini sans reset visible
  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider) return;

    let position = 0;
    const speed = 2; // pixels par frame
    let animationId: number;

    function animate() {
      if (!isPausedRef.current) {
        position -= speed;

        // Quand on atteint 1/4, reset invisible (car 4 copies)
        const quarterWidth = slider!.scrollWidth / 4;
        if (Math.abs(position) >= quarterWidth) {
          position = 0;
        }

        slider!.style.transform = `translateX(${position}px)`;
      }
      animationId = requestAnimationFrame(animate);
    }

    animationId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationId);
  }, []);

  // Gestion du hover pour pause
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const handleMouseEnter = () => { isPausedRef.current = true; };
    const handleMouseLeave = () => { isPausedRef.current = false; };

    section.addEventListener('mouseenter', handleMouseEnter);
    section.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      section.removeEventListener('mouseenter', handleMouseEnter);
      section.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  useEffect(() => {
    function updateLinePosition() {
      if (!sectionRef.current || !sliderRef.current || !lineRef.current) return;

      const dot = sliderRef.current.querySelector('.materiel-dot');
      if (!dot) return;

      const sectionRect = sectionRef.current.getBoundingClientRect();
      const dotRect = dot.getBoundingClientRect();
      const dotCenter = dotRect.top + dotRect.height / 2;

      // Positionner par rapport à la section (parent de la ligne)
      const topPosition = dotCenter - sectionRect.top;
      lineRef.current.style.top = `${topPosition}px`;
    }

    // Calcul après le rendu
    requestAnimationFrame(updateLinePosition);

    window.addEventListener('resize', updateLinePosition);

    return () => {
      window.removeEventListener('resize', updateLinePosition);
    };
  }, []);

  return (
    <>
    <div className="materiel-section">
      <section className="materiel" ref={sectionRef}>
        <h2 className="subtitle">Un matériel professionnel <span>pensé pour tes podcasts</span></h2>

        <div className="materiel-slider" ref={sliderRef}>
          {[...items, ...items, ...items, ...items].map((item, index) => (
            <div className="materiel-item" key={index}>
              <div className="materiel-item-img">
                <picture>
                  <source srcSet={item.imgWebp} type="image/webp" />
                  <img src={item.img} alt={item.title} loading="lazy" />
                </picture>
              </div>
              <div className="materiel-dot"></div>
              <h3><span className="materiel-icon">{item.icon}</span> {item.title}</h3>
              <ul>
                {item.features.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="materiel-line" ref={lineRef}></div>
      </section>
    </div>
    </>
  );
}

export default Timeline;
