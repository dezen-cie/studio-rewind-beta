// src/controllers/admin.podcaster.controller.js
import {
  getAllPodcasters,
  createPodcaster,
  updatePodcaster,
  deletePodcaster
} from '../services/podcaster.service.js';
import { deleteFile } from '../config/upload.js';

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
      // Supprimer la video si l'audio manque
      if (videoFile) deleteFile('/uploads/videos/' + videoFile.filename);
      return res.status(400).json({ message: 'L\'audio est obligatoire.' });
    }

    const video_url = '/uploads/videos/' + videoFile.filename;
    const audio_url = '/uploads/audios/' + audioFile.filename;

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
    // Supprimer les fichiers en cas d'erreur
    if (req.files?.video?.[0]) {
      deleteFile('/uploads/videos/' + req.files.video[0].filename);
    }
    if (req.files?.audio?.[0]) {
      deleteFile('/uploads/audios/' + req.files.audio[0].filename);
    }
    return res.status(error.status || 500).json({ message: error.message });
  }
}

export async function updatePodcasterController(req, res) {
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

    // Si nouveau fichier video, mettre a jour l'URL
    if (videoFile) {
      updateData.video_url = '/uploads/videos/' + videoFile.filename;
      updateData.oldVideoUrl = true; // Flag pour supprimer l'ancien
    }

    // Si nouveau fichier audio, mettre a jour l'URL
    if (audioFile) {
      updateData.audio_url = '/uploads/audios/' + audioFile.filename;
      updateData.oldAudioUrl = true; // Flag pour supprimer l'ancien
    }

    const podcaster = await updatePodcaster(id, updateData);

    return res.json(podcaster);
  } catch (error) {
    console.error('Erreur updatePodcaster:', error);
    // Supprimer les nouveaux fichiers en cas d'erreur
    if (req.files?.video?.[0]) {
      deleteFile('/uploads/videos/' + req.files.video[0].filename);
    }
    if (req.files?.audio?.[0]) {
      deleteFile('/uploads/audios/' + req.files.audio[0].filename);
    }
    return res.status(error.status || 500).json({ message: error.message });
  }
}

export async function deletePodcasterController(req, res) {
  try {
    const { id } = req.params;
    const result = await deletePodcaster(id);
    return res.json(result);
  } catch (error) {
    console.error('Erreur deletePodcaster:', error);
    return res.status(error.status || 500).json({ message: error.message });
  }
}
