import './LegalPage.css'

function PolitiqueConfidentialite() {
  return (
    <div className="legal-page">
      <div className="legal-header">
        <picture>
          <source srcSet="/images/logo.webp" type="image/webp" />
          <img src="/images/logo.png" alt="Studio Rewind" className="legal-logo" />
        </picture>
        <h1>Politique de Confidentialité</h1>
        <p className="legal-update">Dernière mise à jour : Janvier 2025</p>
      </div>

      <div className="legal-content">
        <section className="legal-section">
          <h2>1. Introduction</h2>
          <p>
            Studio Rewind accorde une grande importance à la protection de vos données personnelles.
            La présente Politique de Confidentialité a pour objectif de vous informer sur la manière
            dont nous collectons, utilisons et protégeons vos informations lorsque vous utilisez
            notre site web studio-rewind.fr et nos services.
          </p>
          <p>
            En utilisant notre site, vous acceptez les pratiques décrites dans cette politique.
          </p>
        </section>

        <section className="legal-section">
          <h2>2. Responsable du traitement</h2>
          <div className="legal-info-box">
            <p><strong>Studio Rewind</strong></p>
            <p>7 avenue de la Libération</p>
            <p>74200 Thonon-les-Bains</p>
            <p>France</p>
            <br />
            <p><strong>Email :</strong> contact@studio-rewind.fr</p>
            <p><strong>Téléphone :</strong> 06 67 29 69 65</p>
          </div>
        </section>

        <section className="legal-section">
          <h2>3. Données collectées</h2>
          <p>Nous collectons différentes catégories de données personnelles :</p>

          <h3>3.1 Données que vous nous fournissez directement</h3>
          <ul>
            <li><strong>Données d'identification :</strong> nom, prénom</li>
            <li><strong>Données de contact :</strong> adresse email, numéro de téléphone</li>
            <li><strong>Données professionnelles :</strong> nom de l'entreprise (optionnel)</li>
            <li><strong>Données de compte :</strong> identifiant, mot de passe (chiffré)</li>
            <li><strong>Contenu des messages :</strong> messages envoyés via le formulaire de contact</li>
          </ul>

          <h3>3.2 Données collectées automatiquement</h3>
          <ul>
            <li><strong>Données de connexion :</strong> adresse IP, type de navigateur, système d'exploitation</li>
            <li><strong>Données de navigation :</strong> pages visitées, durée de visite, actions effectuées</li>
            <li><strong>Cookies :</strong> identifiants de session et préférences (voir section Cookies)</li>
          </ul>

          <h3>3.3 Données liées aux réservations</h3>
          <ul>
            <li>Date et heure des réservations</li>
            <li>Formule choisie</li>
            <li>Historique des réservations</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>4. Finalités du traitement</h2>
          <p>Vos données personnelles sont collectées et traitées pour les finalités suivantes :</p>

          <table className="legal-table">
            <thead>
              <tr>
                <th>Finalité</th>
                <th>Base légale</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Gestion des réservations et des comptes clients</td>
                <td>Exécution du contrat</td>
              </tr>
              <tr>
                <td>Réponse aux demandes de contact</td>
                <td>Intérêt légitime</td>
              </tr>
              <tr>
                <td>Envoi de confirmations et rappels</td>
                <td>Exécution du contrat</td>
              </tr>
              <tr>
                <td>Amélioration de nos services</td>
                <td>Intérêt légitime</td>
              </tr>
              <tr>
                <td>Envoi de communications commerciales</td>
                <td>Consentement</td>
              </tr>
              <tr>
                <td>Respect des obligations légales</td>
                <td>Obligation légale</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="legal-section">
          <h2>5. Durée de conservation</h2>
          <p>Nous conservons vos données personnelles uniquement pendant la durée nécessaire aux finalités pour lesquelles elles ont été collectées :</p>
          <ul>
            <li><strong>Données de compte client :</strong> pendant toute la durée de la relation commerciale, puis 3 ans après le dernier contact</li>
            <li><strong>Données de réservation :</strong> 5 ans à compter de la prestation (obligations comptables)</li>
            <li><strong>Données de contact (prospects) :</strong> 3 ans à compter du dernier contact</li>
            <li><strong>Cookies :</strong> 13 mois maximum</li>
          </ul>
          <p>
            À l'expiration de ces délais, vos données sont supprimées ou anonymisées.
          </p>
        </section>

        <section className="legal-section">
          <h2>6. Destinataires des données</h2>
          <p>Vos données personnelles peuvent être transmises aux destinataires suivants :</p>
          <ul>
            <li><strong>Personnel de Studio Rewind :</strong> équipe commerciale, intervenants, équipe technique</li>
            <li><strong>Prestataires techniques :</strong> hébergeur du site, services de paiement</li>
            <li><strong>Autorités compétentes :</strong> en cas d'obligation légale</li>
          </ul>
          <p>
            Nous ne vendons jamais vos données personnelles à des tiers. Nos prestataires sont
            contractuellement tenus de respecter la confidentialité de vos données.
          </p>
        </section>

        <section className="legal-section">
          <h2>7. Transferts hors UE</h2>
          <p>
            En principe, vos données sont hébergées et traitées au sein de l'Union Européenne.
            Si un transfert vers un pays tiers devait avoir lieu, nous nous assurerions que des
            garanties appropriées sont mises en place (clauses contractuelles types, décision
            d'adéquation de la Commission européenne).
          </p>
        </section>

        <section className="legal-section">
          <h2>8. Sécurité des données</h2>
          <p>
            Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour
            protéger vos données personnelles contre tout accès non autorisé, modification,
            divulgation ou destruction :
          </p>
          <ul>
            <li>Chiffrement des données sensibles (mots de passe)</li>
            <li>Connexions sécurisées (HTTPS)</li>
            <li>Accès restreint aux données selon les besoins</li>
            <li>Mises à jour régulières de sécurité</li>
            <li>Sauvegardes régulières</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>9. Cookies</h2>
          <h3>9.1 Qu'est-ce qu'un cookie ?</h3>
          <p>
            Un cookie est un petit fichier texte déposé sur votre terminal (ordinateur, tablette,
            smartphone) lors de la visite d'un site web. Il permet de stocker des informations
            relatives à votre navigation.
          </p>

          <h3>9.2 Cookies utilisés</h3>
          <p>Notre site utilise les types de cookies suivants :</p>
          <ul>
            <li>
              <strong>Cookies strictement nécessaires :</strong> indispensables au fonctionnement
              du site (authentification, session)
            </li>
            <li>
              <strong>Cookies de performance :</strong> permettent d'analyser l'utilisation du
              site pour en améliorer le fonctionnement
            </li>
          </ul>

          <h3>9.3 Gestion des cookies</h3>
          <p>
            Vous pouvez à tout moment modifier vos préférences en matière de cookies via les
            paramètres de votre navigateur. La désactivation de certains cookies peut affecter
            votre expérience de navigation.
          </p>
        </section>

        <section className="legal-section">
          <h2>10. Vos droits</h2>
          <p>
            Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez
            des droits suivants sur vos données personnelles :
          </p>
          <ul>
            <li>
              <strong>Droit d'accès :</strong> obtenir la confirmation que des données vous
              concernant sont traitées et en recevoir une copie
            </li>
            <li>
              <strong>Droit de rectification :</strong> demander la correction de données
              inexactes ou incomplètes
            </li>
            <li>
              <strong>Droit à l'effacement :</strong> demander la suppression de vos données
              dans certains cas
            </li>
            <li>
              <strong>Droit à la limitation :</strong> demander la suspension du traitement
              de vos données
            </li>
            <li>
              <strong>Droit à la portabilité :</strong> recevoir vos données dans un format
              structuré et couramment utilisé
            </li>
            <li>
              <strong>Droit d'opposition :</strong> vous opposer au traitement de vos données
              pour des motifs légitimes
            </li>
            <li>
              <strong>Droit de retirer votre consentement :</strong> à tout moment, pour les
              traitements basés sur le consentement
            </li>
          </ul>

          <h3>Comment exercer vos droits ?</h3>
          <p>
            Pour exercer ces droits, vous pouvez nous contacter :
          </p>
          <div className="legal-info-box">
            <p><strong>Par email :</strong> contact@studio-rewind.fr</p>
            <p><strong>Par courrier :</strong></p>
            <p>Studio Rewind - Protection des données</p>
            <p>7 avenue de la Libération</p>
            <p>74200 Thonon-les-Bains</p>
          </div>
          <p>
            Nous nous engageons à répondre à votre demande dans un délai d'un mois. Une pièce
            d'identité pourra vous être demandée pour vérifier votre identité.
          </p>
        </section>

        <section className="legal-section">
          <h2>11. Réclamation auprès de la CNIL</h2>
          <p>
            Si vous estimez que le traitement de vos données personnelles constitue une violation
            de vos droits, vous avez la possibilité d'introduire une réclamation auprès de la
            Commission Nationale de l'Informatique et des Libertés (CNIL) :
          </p>
          <div className="legal-info-box">
            <p><strong>CNIL</strong></p>
            <p>3 Place de Fontenoy - TSA 80715</p>
            <p>75334 Paris Cedex 07</p>
            <p><strong>Site web :</strong> www.cnil.fr</p>
          </div>
        </section>

        <section className="legal-section">
          <h2>12. Modifications de la politique</h2>
          <p>
            Nous nous réservons le droit de modifier cette Politique de Confidentialité à tout
            moment. En cas de modification substantielle, nous vous en informerons par email ou
            par un avis visible sur notre site.
          </p>
          <p>
            Nous vous invitons à consulter régulièrement cette page pour prendre connaissance
            des éventuelles mises à jour.
          </p>
        </section>

        <section className="legal-section">
          <h2>13. Contact</h2>
          <p>
            Pour toute question relative à cette Politique de Confidentialité ou au traitement
            de vos données personnelles, vous pouvez nous contacter :
          </p>
          <div className="legal-info-box">
            <p><strong>Studio Rewind</strong></p>
            <p>7 avenue de la Libération</p>
            <p>74200 Thonon-les-Bains</p>
            <br />
            <p><strong>Email :</strong> contact@studio-rewind.fr</p>
            <p><strong>Téléphone :</strong> 06 67 29 69 65</p>
          </div>
        </section>
      </div>

      <div className="legal-footer">
        <p>Studio Rewind - 7 avenue de la Libération, 74200 Thonon-les-Bains</p>
        <p>contact@studio-rewind.fr | 06 67 29 69 65</p>
      </div>
    </div>
  )
}

export default PolitiqueConfidentialite
