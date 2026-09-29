import functools
import io
import os
import tempfile
import subprocess
import logging
from resemblyzer import VoiceEncoder, preprocess_wav
import numpy as np 
import librosa
import soundfile as sf

logger = logging.getLogger(__name__)

@functools.lru_cache(maxsize=1)
def load_voice_encoder():
    return VoiceEncoder()

def load_audio_to_wav(audio_bytes):
    """
    Robust audio loader:
    1. Attempts direct reading with soundfile / librosa via BytesIO.
    2. Falls back to writing a temporary file and running ffmpeg to decode WebM/Opus/OGG/MP4.
    Returns: (audio_numpy_array, sample_rate)
    """
    if not audio_bytes or len(audio_bytes) < 4:
        raise ValueError("Audio data is empty or corrupted")

    # 1. Direct load via soundfile / librosa
    try:
        audio, sr = librosa.load(io.BytesIO(audio_bytes), sr=16000)
        if audio is not None and len(audio) > 0:
            return audio, sr
    except Exception as direct_err:
        logger.warning(f"Direct audio decode failed: {direct_err}. Attempting FFmpeg conversion...")

    # 2. Convert through temporary file with FFmpeg
    tmp_in_path = None
    tmp_out_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".raw") as tmp_in:
            tmp_in.write(audio_bytes)
            tmp_in_path = tmp_in.name

        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp_out:
            tmp_out_path = tmp_out.name

        # Transcode to 16kHz mono 16-bit WAV
        cmd = [
            "ffmpeg", "-y", "-i", tmp_in_path,
            "-ar", "16000", "-ac", "1",
            "-f", "wav", tmp_out_path
        ]
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if res.returncode == 0 and os.path.exists(tmp_out_path) and os.path.getsize(tmp_out_path) > 0:
            audio, sr = librosa.load(tmp_out_path, sr=16000)
            return audio, sr
        else:
            logger.error(f"FFmpeg error: {res.stderr.decode('utf-8', errors='ignore')}")
    except Exception as ffmpeg_err:
        logger.error(f"Fallback audio decoding error: {ffmpeg_err}")
    finally:
        if tmp_in_path and os.path.exists(tmp_in_path):
            try:
                os.remove(tmp_in_path)
            except Exception:
                pass
        if tmp_out_path and os.path.exists(tmp_out_path):
            try:
                os.remove(tmp_out_path)
            except Exception:
                pass

    # Final fallback attempt
    return librosa.load(io.BytesIO(audio_bytes), sr=16000)

def get_voice_embedding(audio_bytes):
    try:
        encoder = load_voice_encoder()
        audio, sr = load_audio_to_wav(audio_bytes)
        wav = preprocess_wav(audio)
        embedding = encoder.embed_utterance(wav)
        return embedding.tolist()
    except Exception as e:
        logger.error(f"Voice recognition error: {e}", exc_info=True)
        return None

def identify_speaker(new_embedding, candidates_dict, threshold=0.65):
    if new_embedding is None or not candidates_dict:
        return None, 0.0
    
    best_sid = None
    best_score = -1.0

    for sid, stored_embedding in candidates_dict.items():
        if stored_embedding:
            similarity = np.dot(new_embedding, stored_embedding)
            if similarity > best_score:
                best_score = similarity
                best_sid = sid

    if best_score >= threshold:
        return best_sid, best_score
    
    return None, best_score

def process_bulk_audio(audio_bytes, candidates_dict, threshold=0.65):
    try:
        encoder = load_voice_encoder()
        audio, sr = load_audio_to_wav(audio_bytes)
        segments = librosa.effects.split(audio, top_db=30)

        identified_results = {}

        for start, end in segments:
            if (end - start) < sr * 0.5:
                continue
            segment_audio = audio[start:end]
            wav = preprocess_wav(segment_audio)
            embedding = encoder.embed_utterance(wav)

            sid, score = identify_speaker(embedding, candidates_dict, threshold)
            if sid:
                if sid not in identified_results or score > identified_results[sid]:
                    identified_results[sid] = score

        return identified_results
    except Exception as e:
        logger.error(f"Bulk voice process error: {e}", exc_info=True)
        return {}