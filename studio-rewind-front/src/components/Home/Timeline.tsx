import { useEffect, useRef } from "react";
import "./Timeline.css";

const items = [
  {
    img: "/images/micro.png",
    title: "Micro Shure SM78",
    icon: "🎙️",
    features: [
      "Son broadcast professionnel",
      "Déjection du bruit optimisée",
      "Directivité cardioïde"
    ]
  },
  {
    img: "/images/camera.png",
    title: "Caméra Black Magics",
    icon: "📷",
    features: [
      "Résolution 4K DCI",
      "Autofocus précis et rapide",
      "Capteur HDR"
    ]
  },
  {
    img: "/images/light.png",
    title: "Éclairage Aputure F21X",
    icon: "💡",
    features: [
      "Éclairage LED ajustable",
      "Zéro Scintillement (no-flicker)",
      "Ambiance modulable"
    ]
  }
];

function Timeline() {
  const sectionRef = useRef<HTMLElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function updateLinePosition() {
      if (!sectionRef.current || !lineRef.current) return;

      const dot = sectionRef.current.querySelector('.materiel-dot');
      if (!dot) return;

      const sectionRect = sectionRef.current.getBoundingClientRect();
      const dotRect = dot.getBoundingClientRect();
      const dotCenter = dotRect.top + dotRect.height / 2 - sectionRect.top;

      lineRef.current.style.top = `${dotCenter}px`;
    }

    // Attendre que les images soient chargées avant de calculer la position
    const images = sectionRef.current?.querySelectorAll('img');
    let loadedCount = 0;
    const totalImages = images?.length || 0;

    function onImageLoad() {
      loadedCount++;
      if (loadedCount >= totalImages) {
        updateLinePosition();
      }
    }

    images?.forEach(img => {
      if (img.complete) {
        loadedCount++;
      } else {
        img.addEventListener('load', onImageLoad);
      }
    });

    // Si toutes les images sont déjà chargées, mettre à jour immédiatement
    if (loadedCount >= totalImages) {
      updateLinePosition();
    }

    window.addEventListener('resize', updateLinePosition);

    return () => {
      window.removeEventListener('resize', updateLinePosition);
      images?.forEach(img => {
        img.removeEventListener('load', onImageLoad);
      });
    };
  }, []);

  return (
    <>
    <div className="materiel-section">
      <section className="materiel" ref={sectionRef}>
        <h2 className="subtitle">Un matériel professionnel <span>pensé pour tes podcasts</span></h2>

        <div className="materiel-slider">
          {[...items, ...items].map((item, index) => (
            <div className="materiel-item" key={index}>
              <img src={item.img} alt={item.title} loading="lazy" />
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
