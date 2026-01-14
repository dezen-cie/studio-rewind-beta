import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import Hiw from '../components/Home/Hiw';
import Studio from '../components/Home/Studio';
import Formules from '../components/Home/Formules';
import Podcasteurs from '../components/Home/Podcasteurs';
import SimpleMap from '../components/Home/SimpleMap';

function HomePage() {
  const location = useLocation();

  useEffect(() => {
    if (location.state?.scrollTo === "formules") {
      const el = document.querySelector(".formules");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "end" });
      }
    }
  }, [location]);

  useEffect(() => {
    if (location.state?.scrollTo === "studio") {
      const el = document.querySelector(".studio");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [location]);

  

  return (
    <div className="sr-home">
      <Studio />
      <Hiw />
      {/* TEMPORAIREMENT MASQUÉ - Section Formules
      <Formules />
      */}
      {/* TEMPORAIREMENT MASQUÉ - Section Podcasteurs
      <Podcasteurs />
      */}
      <SimpleMap />
    </div>
  );
}

export default HomePage;
