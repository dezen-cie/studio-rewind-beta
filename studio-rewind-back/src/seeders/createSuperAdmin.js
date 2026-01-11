// src/seeders/createSuperAdmin.js
import bcrypt from 'bcrypt';
import { sequelize, User, Podcaster } from '../models/index.js';
import dotenv from 'dotenv';

dotenv.config();

// Descriptions des membres de l'équipe
const KARIM_DESCRIPTION = `Mon parcours entrepreneurial m'a conduit à créer et développer plusieurs entreprises et projets au fil des années. Ces différentes expériences m'ont naturellement poussé à fonder Studio Rewind, un projet qui me tient particulièrement à cœur. Mon chemin d'entrepreneur n'a pas été linéaire. J'ai connu des succès qui m'ont porté, mais aussi des échecs qui m'ont construit. Ces expériences, qu'elles soient positives ou difficiles, ont forgé ma vision du business et ma façon d'accompagner les autres. Je sais ce que signifie se lancer dans l'inconnu, prendre des risques, douter parfois, mais continuer malgré tout parce qu'on croit en son projet.

Studio Rewind est né de cette envie de mettre mon expérience au service de ceux qui méritent plus qu'un simple accompagnement. Ici, nous ne faisons pas que produire du contenu vidéo. Nous aidons les entrepreneurs, les dirigeants et les créateurs à exprimer leur authenticité, à partager leur vision et à connecter véritablement avec leur audience. Ce qui me passionne particulièrement, c'est le podcast. C'est un format qui permet d'aller en profondeur, de créer une vraie conversation, de laisser le temps aux idées de se développer. En tant que podcasteur au sein de Studio Rewind, j'ai le privilège d'échanger avec des personnalités inspirantes, des entrepreneurs qui ont des parcours fascinants à partager. Chaque épisode est une opportunité d'apprendre, de découvrir et de transmettre.

Ma philosophie est simple : je crois en la puissance des histoires authentiques. Dans un monde saturé de contenus formatés et de messages publicitaires, ce qui fait vraiment la différence, c'est la sincérité. Quand vous venez au studio, mon objectif est de vous aider à trouver votre voix, à exprimer ce qui vous rend unique, sans artifice ni faux-semblant. L'équipe que j'ai réunie autour de ce projet partage cette même vision. Ensemble, nous créons un environnement où vous pouvez vous sentir à l'aise, être vous-même et donner le meilleur de vous-même face à la caméra. Que ce soit pour un podcast, une vidéo de présentation ou du contenu pour vos réseaux sociaux, nous sommes là pour vous accompagner à chaque étape.

Je suis convaincu que chaque entrepreneur a quelque chose d'important à dire. Mon rôle, c'est de vous aider à le dire de la meilleure façon possible. Si vous êtes prêt à partager votre histoire, je serai ravi de vous accueillir au studio et de faire ce chemin avec vous.`;

const GREGORY_DESCRIPTION = `Pendant dix ans, j'ai occupé des postes de direction dans le domaine du commerce. Cette décennie m'a permis de développer une vision globale de l'entreprise, de comprendre les enjeux stratégiques et opérationnels, mais surtout d'apprendre à écouter et à répondre aux besoins des clients. Gérer des équipes, piloter des projets, prendre des décisions parfois difficiles : ces expériences ont façonné ma façon de travailler et m'ont donné une solide compréhension du monde professionnel.

Après ces années dans le commerce, j'ai décidé de me réinventer et de me tourner vers une passion qui m'animait depuis longtemps : le développement web. Aujourd'hui, je suis développeur freelance et c'est moi qui ai conçu et développé le site que vous consultez actuellement. Ce virage professionnel n'était pas anodin, mais il représentait pour moi l'opportunité de combiner ma rigueur acquise en entreprise avec ma créativité technique. Chaque ligne de code que j'écris est pensée pour offrir une expérience fluide, intuitive et agréable aux utilisateurs.

Ma double casquette commerce et tech me permet d'avoir une approche unique. Je ne suis pas seulement un développeur qui code : je comprends les enjeux business derrière chaque projet. Quand je travaille sur un site ou une application, je pense toujours à l'utilisateur final, à son parcours, à ce qui va le convaincre ou le freiner. Cette vision me permet de créer des outils qui ne sont pas seulement beaux techniquement, mais qui répondent véritablement aux objectifs commerciaux de mes clients. Au sein de Studio Rewind, je mets cette expertise au service de l'équipe et des clients qui nous font confiance.

Je suis également disponible si tu as des questions ou si tu souhaites des conseils. Que ce soit sur des aspects techniques liés au digital, sur la stratégie web à adopter, ou simplement pour échanger sur tes projets, n'hésite pas à me solliciter. Mon expérience de dirigeant m'a appris qu'un bon conseil au bon moment peut faire toute la différence dans le développement d'un projet. Je prends plaisir à partager mes connaissances et à aider les entrepreneurs à y voir plus clair dans un domaine qui peut parfois sembler complexe. Chez Studio Rewind, nous sommes une équipe soudée et complémentaire, et je suis fier de contribuer à ce projet en apportant mon expertise technique et mon regard commercial.`;

async function createSuperAdmin() {
  try {
    await sequelize.authenticate();
    console.log("🔌 Connecté à la base PostgreSQL.");

    // ======================================================
    // SUPER ADMIN - Gregory (greg@mail.fr)
    // CSO, pas podcaster mais membre de l'équipe
    // ======================================================
    const existingSuper = await User.findOne({ where: { role: 'super_admin' } });

    if (existingSuper) {
      console.log("⚠️ Un super admin existe déjà :", existingSuper.email);
    } else {
      const superEmail = "dezem.cie@gmail.com";
      const superPassword = "Masterchauvin&8";
      const hashedSuper = await bcrypt.hash(superPassword, 10);

      const gregory = await User.create({
        email: superEmail,
        password: hashedSuper,
        role: 'super_admin',
        account_type: 'professionnel',
        firstname: 'Grégory',
        company_name: 'Studio Rewind',
        phone: '0000000000',
        is_active: true
      });

      // Créer le profil "équipe" pour Gregory (CSO, pas podcaster mais visible sur la page équipe)
      await Podcaster.create({
        name: 'Grégory',
        video_url: null,
        audio_url: null,
        display_order: 2,
        is_active: true,
        photo_url: '/images/Gregory.jpg',
        description: GREGORY_DESCRIPTION,
        profile_online: true,
        team_role: 'CSO',
        user_id: gregory.id
      });

      console.log("✨ Super admin Grégory créé (dezem-cie@gmail.com) avec profil équipe !");
    }

    // ======================================================
    // ADMIN - Karim (karim@mail.fr)
    // CEO & Podcasteur
    // ======================================================
    const existingAdmin = await User.findOne({ where: { email: 'karim@mail.fr' } });

    if (existingAdmin) {
      console.log("⚠️ Karim existe déjà :", existingAdmin.email);
    } else {
      const adminEmail = "karim@mail.fr";
      const adminPassword = "Password1+";
      const hashedAdmin = await bcrypt.hash(adminPassword, 10);

      const karim = await User.create({
        email: adminEmail,
        password: hashedAdmin,
        role: 'admin',
        account_type: 'professionnel',
        firstname: 'Karim',
        company_name: 'Studio Rewind',
        phone: '0000000000',
        is_active: true
      });

      // Créer le profil podcaster complet pour Karim
      await Podcaster.create({
        name: 'Karim',
        video_url: null,
        audio_url: null,
        display_order: 1,
        is_active: true,
        photo_url: '/images/Karim.jpg',
        description: KARIM_DESCRIPTION,
        profile_online: true,
        team_role: 'CEO & Podcasteur',
        user_id: karim.id
      });

      console.log("✨ Admin Karim créé (karim@mail.fr) avec profil podcaster complet !");
    }

    console.log("✅ Seed terminé.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Erreur seed :", error);
    process.exit(1);
  }
}

createSuperAdmin();
