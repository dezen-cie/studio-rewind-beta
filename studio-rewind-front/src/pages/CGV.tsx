import './LegalPage.css'

function CGV() {
  return (
    <div className="legal-page">
      <div className="legal-header">
        <picture>
          <source srcSet="/images/logo.webp" type="image/webp" />
          <img src="/images/logo.png" alt="Studio Rewind" className="legal-logo" />
        </picture>
        <h1>Conditions Générales de Vente</h1>
        <p className="legal-update">Dernière mise à jour : Janvier 2025</p>
      </div>

      <div className="legal-content">
        <section className="legal-section">
          <h2>Article 1 - Objet</h2>
          <p>
            Les présentes Conditions Générales de Vente (CGV) régissent les relations contractuelles
            entre Studio Rewind et ses clients dans le cadre de la réservation et de l'utilisation
            des services de studio d'enregistrement podcast.
          </p>
        </section>

        <section className="legal-section">
          <h2>Article 2 - Identification du prestataire</h2>
          <div className="legal-info-box">
            <p><strong>Studio Rewind</strong></p>
            <p>7 avenue de la Libération</p>
            <p>74200 Thonon-les-Bains</p>
            <p>Téléphone : 06 67 29 69 65</p>
            <p>Email : contact@studio-rewind.fr</p>
          </div>
        </section>

        <section className="legal-section">
          <h2>Article 3 - Services proposés</h2>
          <p>Studio Rewind propose les services suivants :</p>
          <ul>
            <li>Location de studio d'enregistrement podcast</li>
            <li>Accompagnement par un intervenant professionnel</li>
            <li>Montage et post-production des contenus enregistrés</li>
            <li>Livraison des fichiers finaux dans les formats convenus</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>Article 4 - Réservation</h2>
          <h3>4.1 Modalités de réservation</h3>
          <p>
            Les réservations s'effectuent via notre site internet ou par contact direct avec notre équipe.
            Toute réservation est considérée comme ferme et définitive après confirmation par Studio Rewind
            et réception du paiement ou de l'acompte.
          </p>

          <h3>4.2 Confirmation</h3>
          <p>
            Un email de confirmation récapitulant les détails de la réservation (date, heure, formule choisie)
            est envoyé au client. Il appartient au client de vérifier l'exactitude des informations.
          </p>
        </section>

        <section className="legal-section">
          <h2>Article 5 - Tarifs et paiement</h2>
          <h3>5.1 Tarifs</h3>
          <p>
            Les tarifs applicables sont ceux en vigueur au moment de la réservation, disponibles sur notre site
            ou communiqués sur demande. Ils sont exprimés en euros TTC.
          </p>

          <h3>5.2 Modalités de paiement</h3>
          <p>
            Le paiement peut s'effectuer par carte bancaire, virement ou tout autre moyen accepté par Studio Rewind.
            Un acompte de 30% peut être demandé lors de la réservation, le solde étant dû le jour de la prestation.
          </p>
        </section>

        <section className="legal-section">
          <h2>Article 6 - Annulation et modification</h2>
          <h3>6.1 Par le client</h3>
          <ul>
            <li>Annulation plus de 7 jours avant : remboursement intégral</li>
            <li>Annulation entre 7 et 48 heures avant : remboursement de 50%</li>
            <li>Annulation moins de 48 heures avant : aucun remboursement</li>
          </ul>

          <h3>6.2 Par Studio Rewind</h3>
          <p>
            En cas d'annulation de notre fait (force majeure, problème technique), le client sera intégralement
            remboursé ou une nouvelle date lui sera proposée.
          </p>
        </section>

        <section className="legal-section">
          <h2>Article 7 - Déroulement des séances</h2>
          <p>
            Le client s'engage à se présenter à l'heure convenue. Tout retard supérieur à 15 minutes sans
            prévenance pourra entraîner l'annulation de la séance sans remboursement. Le temps perdu ne sera
            pas rattrapé.
          </p>
        </section>

        <section className="legal-section">
          <h2>Article 8 - Propriété intellectuelle</h2>
          <p>
            Le client conserve l'intégralité des droits sur le contenu enregistré. Studio Rewind se réserve
            le droit d'utiliser des extraits à des fins promotionnelles, sauf opposition expresse du client.
          </p>
        </section>

        <section className="legal-section">
          <h2>Article 9 - Responsabilité</h2>
          <p>
            Studio Rewind s'engage à mettre en œuvre tous les moyens nécessaires pour assurer la qualité
            de ses prestations. Sa responsabilité ne saurait être engagée en cas de force majeure ou de
            faute du client.
          </p>
          <p>
            Le client est responsable de ses effets personnels pendant toute la durée de sa présence dans
            les locaux.
          </p>
        </section>

        <section className="legal-section">
          <h2>Article 10 - Protection des données</h2>
          <p>
            Les données personnelles collectées sont traitées conformément à notre Politique de Confidentialité
            et au Règlement Général sur la Protection des Données (RGPD).
          </p>
        </section>

        <section className="legal-section">
          <h2>Article 11 - Litiges</h2>
          <p>
            En cas de litige, une solution amiable sera recherchée avant toute action judiciaire.
            À défaut, les tribunaux compétents seront ceux du ressort du siège social de Studio Rewind.
          </p>
        </section>

        <section className="legal-section">
          <h2>Article 12 - Acceptation des CGV</h2>
          <p>
            Toute réservation implique l'acceptation sans réserve des présentes Conditions Générales de Vente.
          </p>
        </section>
      </div>

      <div className="legal-footer">
        <p>Studio Rewind - 7 avenue de la Libération, 74200 Thonon-les-Bains</p>
        <p>contact@studio-rewind.fr | 06 67 29 69 65</p>
      </div>
    </div>
  )
}

export default CGV
