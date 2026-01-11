// src/controllers/admin.podcaster.controller.js
import {
  getAllPodcasters,
  createPodcaster,
  updatePodcaster,
  deletePodcaster,
  togglePodcasterAdmin,
  updatePodcasterCoreTeam
} from '../services/podcaster.service.js';
import { deleteFile, processAndUploadFile } from '../config/upload.js';

export async function listPodcasters(req, res) {
  try {
    const podcasters = await getAllPodcasters();
    return res.json(podcasters);
  } catch (error) {
    console.error('Erreur listPodcasters:', error);
    return res.status(error.status || 500).json({ message: error.message });
  }
}

export async function createPodcasterController(req, res) {
  let video_url = null;
  let audio_url = null;

  try {
    const { name, display_order, is_active, email } = req.body;

    // Recuperer les fichiers uploades
    const videoFile = req.files?.video?.[0];
    const audioFile = req.files?.audio?.[0];

    if (!email) {
      return res.status(400).json({ message: 'L\'email est obligatoire.' });
    }
    if (!videoFile) {
      return res.status(400).json({ message: 'La video est obligatoire.' });
    }
    if (!audioFile) {
      return res.status(400).json({ message: 'L\'audio est obligatoire.' });
    }

    // Uploader les fichiers vers le stockage (local ou Supabase)
    video_url = await processAndUploadFile(videoFile);
    audio_url = await processAndUploadFile(audioFile);

    const podcaster = await createPodcaster({
      name,
      email,
      video_url,
      audio_url,
      display_order: display_order ? parseInt(display_order, 10) : undefined,
      is_active: is_active === 'true' || is_active === true
    });

    return res.status(201).json(podcaster);
  } catch (error) {
    console.error('Erreur createPodcaster:', error);
    // Supprimer les fichiers uploades en cas d'erreur
    if (video_url) deleteFile(video_url);
    if (audio_url) deleteFile(audio_url);
    return res.status(error.status || 500).json({ message: error.message });
  }
}

export async function updatePodcasterController(req, res) {
  let newVideoUrl = null;
  let newAudioUrl = null;

  try {
    const { id } = req.params;
    const { name, display_order, is_active } = req.body;

    // Recuperer les nouveaux fichiers si uploades
    const videoFile = req.files?.video?.[0];
    const audioFile = req.files?.audio?.[0];

    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (display_order !== undefined) updateData.display_order = parseInt(display_order, 10);
    if (is_active !== undefined) updateData.is_active = is_active === 'true' || is_active === true;

    // Si nouveau fichier video, uploader et mettre a jour l'URL
    if (videoFile) {
      newVideoUrl = await processAndUploadFile(videoFile);
      updateData.video_url = newVideoUrl;
      updateData.oldVideoUrl = true; // Flag pour supprimer l'ancien
    }

    // Si nouveau fichier audio, uploader et mettre a jour l'URL
    if (audioFile) {
      newAudioUrl = await processAndUploadFile(audioFile);
      updateData.audio_url = newAudioUrl;
      updateData.oldAudioUrl = true; // Flag pour supprimer l'ancien
    }

    const podcaster = await updatePodcaster(id, updateData, req.user);

    return res.json(podcaster);
  } catch (error) {
    console.error('Erreur updatePodcaster:', error);
    // Supprimer les nouveaux fichiers uploades en cas d'erreur
    if (newVideoUrl) deleteFile(newVideoUrl);
    if (newAudioUrl) deleteFile(newAudioUrl);
    return res.status(error.status || 500).json({ message: error.message });
  }
}

export async function deletePodcasterController(req, res) {
  try {
    const { id } = req.params;
    const result = await deletePodcaster(id, req.user);
    return res.json(result);
  } catch (error) {
    console.error('Erreur deletePodcaster:', error);
    return res.status(error.status || 500).json({ message: error.message });
  }
}

export async function togglePodcasterAdminController(req, res) {
  try {
    const { id } = req.params;
    const { makeAdmin } = req.body;

    if (typeof makeAdmin !== 'boolean') {
      return res.status(400).json({ message: 'Le paramètre makeAdmin est obligatoire (true/false).' });
    }

    const podcaster = await togglePodcasterAdmin(id, makeAdmin, req.user.id);
    return res.json(podcaster);
  } catch (error) {
    console.error('Erreur togglePodcasterAdmin:', error);
    return res.status(error.status || 500).json({ message: error.message });
  }
}

export async function toggleCoreTeamController(req, res) {
  try {
    const { id } = req.params;
    const { is_core_team } = req.body;

    if (typeof is_core_team !== 'boolean') {
      return res.status(400).json({ message: 'Le paramètre is_core_team est obligatoire (true/false).' });
    }

    const podcaster = await updatePodcasterCoreTeam(id, is_core_team);
    return res.json(podcaster);
  } catch (error) {
    console.error('Erreur toggleCoreTeam:', error);
    return res.status(error.status || 500).json({ message: error.message });
  }
}
