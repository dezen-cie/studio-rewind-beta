import './LegalPage.css'

function MentionsLegales() {
  return (
    <div className="legal-page">
      <div className="legal-header">
        <picture>
          <source srcSet="/images/logo.webp" type="image/webp" />
          <img src="/images/logo.png" alt="Studio Rewind" className="legal-logo" />
        </picture>
        <h1>Mentions Légales</h1>
        <p className="legal-update">Dernière mise à jour : Janvier 2025</p>
      </div>

      <div className="legal-content">
        <section className="legal-section">
          <h2>1. Éditeur du site</h2>
          <div className="legal-info-box">
            <p><strong>Studio Rewind</strong></p>
            <p>7 avenue de la Libération</p>
            <p>74200 Thonon-les-Bains</p>
            <p>France</p>
            <br />
            <p><strong>Email :</strong> contact@studio-rewind.fr</p>
          </div>
        </section>

        <section className="legal-section">
          <h2>2. Directeur de la publication</h2>
          <p>
            Le directeur de la publication du site studio-rewind.fr est le représentant légal
            de la société Studio Rewind.
          </p>
        </section>

        <section className="legal-section">
          <h2>3. Hébergement</h2>
          <div className="legal-info-box">
            <p><strong>Hébergeur du site :</strong></p>
            <p>[Nom de l'hébergeur]</p>
            <p>[Adresse de l'hébergeur]</p>
            <p>[Contact de l'hébergeur]</p>
          </div>
        </section>

        <section className="legal-section">
          <h2>4. Conception et développement</h2>
          <div className="legal-info-box">
            <p><strong>Dezem Compagnie</strong></p>
            <p>Grégory Virmaud</p>
            <p>400A rue de la Gorge</p>
            <p>74890 Lully</p>
            <br />
            <p><strong>Email :</strong> dezem-cie@gmail.com</p>
          </div>
        </section>

        <section className="legal-section">
          <h2>5. Propriété intellectuelle</h2>
          <p>
            L'ensemble du contenu présent sur le site studio-rewind.fr (textes, images, vidéos,
            logos, graphismes, icônes, sons, logiciels, etc.) est la propriété exclusive de
            Studio Rewind ou de ses partenaires et est protégé par les lois françaises et
            internationales relatives à la propriété intellectuelle.
          </p>
          <p>
            Toute reproduction, représentation, modification, publication, adaptation de tout
            ou partie des éléments du site, quel que soit le moyen ou le procédé utilisé, est
            interdite, sauf autorisation écrite préalable de Studio Rewind.
          </p>
          <p>
            Toute exploitation non autorisée du site ou de l'un quelconque des éléments qu'il
            contient sera considérée comme constitutive d'une contrefaçon et poursuivie
            conformément aux dispositions des articles L.335-2 et suivants du Code de la
            Propriété Intellectuelle.
          </p>
        </section>

        <section className="legal-section">
          <h2>6. Protection des données personnelles</h2>
          <h3>6.1 Responsable du traitement</h3>
          <p>
            Studio Rewind est responsable du traitement des données personnelles collectées
            sur ce site.
          </p>

          <h3>6.2 Données collectées</h3>
          <p>Dans le cadre de l'utilisation du site, nous pouvons collecter les données suivantes :</p>
          <ul>
            <li>Nom et prénom</li>
            <li>Adresse email</li>
            <li>Numéro de téléphone</li>
            <li>Nom de l'entreprise (optionnel)</li>
            <li>Données de connexion et de navigation</li>
          </ul>

          <h3>6.3 Finalités du traitement</h3>
          <p>Vos données sont collectées pour :</p>
          <ul>
            <li>La gestion des réservations</li>
            <li>La communication avec nos clients</li>
            <li>L'amélioration de nos services</li>
            <li>L'envoi d'informations commerciales (avec votre consentement)</li>
          </ul>

          <h3>6.4 Durée de conservation</h3>
          <p>
            Les données personnelles sont conservées pendant une durée n'excédant pas celle
            nécessaire aux finalités pour lesquelles elles sont collectées, conformément à
            la réglementation en vigueur.
          </p>

          <h3>6.5 Vos droits</h3>
          <p>
            Conformément au Règlement Général sur la Protection des Données (RGPD), vous
            disposez des droits suivants :
          </p>
          <ul>
            <li>Droit d'accès à vos données</li>
            <li>Droit de rectification</li>
            <li>Droit à l'effacement</li>
            <li>Droit à la limitation du traitement</li>
            <li>Droit à la portabilité</li>
            <li>Droit d'opposition</li>
          </ul>
          <p>
            Pour exercer ces droits, contactez-nous à : <strong>contact@studio-rewind.fr</strong>
          </p>
        </section>

        <section className="legal-section">
          <h2>7. Cookies</h2>
          <p>
            Le site studio-rewind.fr peut utiliser des cookies pour améliorer l'expérience
            utilisateur et réaliser des statistiques de visites.
          </p>
          <p>
            Vous pouvez paramétrer votre navigateur pour accepter ou refuser les cookies,
            ou être averti lorsqu'un cookie est déposé sur votre terminal.
          </p>
        </section>

        <section className="legal-section">
          <h2>8. Liens hypertextes</h2>
          <p>
            Le site peut contenir des liens vers d'autres sites web. Studio Rewind n'exerce
            aucun contrôle sur ces sites et décline toute responsabilité quant à leur contenu.
          </p>
        </section>

        <section className="legal-section">
          <h2>9. Limitation de responsabilité</h2>
          <p>
            Studio Rewind s'efforce de fournir sur le site des informations aussi précises
            que possible. Toutefois, il ne pourra être tenu responsable des omissions, des
            inexactitudes et des carences dans la mise à jour, qu'elles soient de son fait
            ou du fait des tiers partenaires qui lui fournissent ces informations.
          </p>
          <p>
            Studio Rewind décline toute responsabilité en cas d'interruption du site, de
            survenance de bugs ou d'incompatibilité du site avec votre équipement.
          </p>
        </section>

        <section className="legal-section">
          <h2>10. Droit applicable</h2>
          <p>
            Les présentes mentions légales sont régies par le droit français. En cas de
            litige, les tribunaux français seront seuls compétents.
          </p>
        </section>

        <section className="legal-section">
          <h2>11. Contact</h2>
          <p>
            Pour toute question relative aux présentes mentions légales ou au site, vous
            pouvez nous contacter :
          </p>
          <div className="legal-info-box">
            <p><strong>Par email :</strong> contact@studio-rewind.fr</p>
            <p><strong>Par courrier :</strong></p>
            <p>Studio Rewind</p>
            <p>7 avenue de la Libération</p>
            <p>74200 Thonon-les-Bains</p>
          </div>
        </section>
      </div>

      <div className="legal-footer">
        <p>Studio Rewind - 7 avenue de la Libération, 74200 Thonon-les-Bains</p>
        <p>contact@studio-rewind.fr</p>
      </div>
    </div>
  )
}

export default MentionsLegales
