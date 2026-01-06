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
  return (
    <>
    <div className="materiel-section">
      <section className="materiel">
        <h2 className="subtitle">Un matériel professionnel pensé pour tes podcasts</h2>

        <div className="materiel-slider">
          {[...items, ...items].map((item, index) => (
            <div className="materiel-item" key={index}>
              <img src={item.img} alt={item.title} />
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
        <div className="materiel-line"></div>
      </section>
    </div>
    </>
  );
}

export default Timeline;
