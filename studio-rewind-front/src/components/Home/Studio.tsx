import './Studio.css'

function Studio(){

    return(
        <section className="studio">
            <div className="studio_text"> 
                <figure className="studio_img studio_img-main studio_img-main--left">
                    <img src="/images/studio.jpg" alt="Vue du studio avec canapé et lumière" />
                </figure>
                
                <div>
                    <h2 className="subtitle">Notre studio <span><em>d'</em>enregistrement</span></h2>
                    <p>
                    Notre studio a été pensé comme un espace où l’on se concentre uniquement sur la création. Tout est organisé pour que l’expérience soit simple, fluide et professionnelle du début à la fin. Dès que l’on entre, on comprend que l’endroit a été conçu pour produire du contenu de qualité sans avoir à se soucier de la technique : l’acoustique est maîtrisée, la lumière est calibrée, et chaque élément du décor a été choisi pour créer une ambiance crédible, chaleureuse et immédiatement “filmable”.
                    Les podcasters comme les créateurs vidéo trouvent ici un environnement prêt à l’emploi, avec un matériel déjà réglé, testé, et toujours opérationnel. Les micros captent la voix avec précision, les caméras offrent une image propre et fidèle, et les lumières donnent un rendu constant, quelles que soient les conditions. On peut enregistrer seul, à deux, ou en groupe, sans craindre de manquer d’espace ou de perturber la prise de son.
                    </p>
                </div>
            </div>
        </section>
    )
}

export default Studio



