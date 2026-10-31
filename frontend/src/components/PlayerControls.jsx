
import { useEffect, useRef, useState } from 'react'

import {
  Play,
  Pause,
  Volume2,
  Volume1,
  VolumeX,
  Maximize,
  Minimize,
  Captions,
  RotateCcw,
  RotateCw
} from 'lucide-react'

// ==========================================
// FORMATEAR TIEMPO
// ==========================================

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '0:00'
  }

  const total = Math.floor(seconds)
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const remaining = total % 60

  if (hours > 0) {
    return (
      `${hours}:` +
      `${String(minutes).padStart(2, '0')}:` +
      `${String(remaining).padStart(2, '0')}`
    )
  }

  return (
    `${minutes}:` +
    `${String(remaining).padStart(2, '0')}`
  )
}

// ==========================================
// COMPONENTE
// ==========================================

function PlayerControls({ videoRef, enabled = true }) {
  const hideTimerRef = useRef(null)
  const interactingRef = useRef(false)
  const subtitlesOpenRef = useRef(false)

  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)

  const [fullscreen, setFullscreen] = useState(false)
  const [visible, setVisible] = useState(true)

  const [subtitleTracks, setSubtitleTracks] = useState([])
  const [selectedSubtitle, setSelectedSubtitle] = useState(-1)
  const [showSubtitles, setShowSubtitles] = useState(false)

  // ==========================================
  // VISIBILIDAD AUTOMÁTICA
  // ==========================================

  const clearHideTimer = () => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }
  }

  const scheduleHide = () => {
    clearHideTimer()

    const video = videoRef.current

    if (
      !enabled ||
      !video ||
      video.paused ||
      interactingRef.current ||
      subtitlesOpenRef.current
    ) {
      return
    }

    hideTimerRef.current = setTimeout(() => {
      const currentVideo = videoRef.current

      if (
        currentVideo &&
        !currentVideo.paused &&
        !interactingRef.current &&
        !subtitlesOpenRef.current
      ) {
        setVisible(false)
      }
    }, 3000)
  }

  const showControls = () => {
    setVisible(true)
    scheduleHide()
  }

  // ==========================================
  // SINCRONIZAR CON EL VIDEO
  // ==========================================

  useEffect(() => {
    const video = videoRef.current

    if (!video) return

    const updateTime = () => {
      setCurrentTime(video.currentTime || 0)
    }

    const updateDuration = () => {
      setDuration(
        Number.isFinite(video.duration)
          ? video.duration
          : 0
      )
    }

    const updateVolume = () => {
      setVolume(video.volume)
      setMuted(video.muted)
    }

    const updatePlay = () => {
      setPlaying(true)
      scheduleHide()
    }

    const updatePause = () => {
      setPlaying(false)
      clearHideTimer()
      setVisible(true)
    }

    const updateSubtitles = () => {
      const tracks = Array.from(video.textTracks || [])

      setSubtitleTracks(
        tracks.map((track, index) => ({
          index,
          label:
            track.label ||
            track.language ||
            `Pista ${index + 1}`
        }))
      )

      setSelectedSubtitle(
        tracks.findIndex(
          (track) => track.mode === 'showing'
        )
      )
    }

    const updateFullscreen = () => {
      setFullscreen(Boolean(document.fullscreenElement))
      setVisible(true)
      scheduleHide()
    }

    video.addEventListener('timeupdate', updateTime)
    video.addEventListener('durationchange', updateDuration)
    video.addEventListener('loadedmetadata', updateDuration)
    video.addEventListener('volumechange', updateVolume)
    video.addEventListener('play', updatePlay)
    video.addEventListener('pause', updatePause)
    video.addEventListener('ended', updatePause)
    video.addEventListener('loadedmetadata', updateSubtitles)

    video.textTracks?.addEventListener?.(
      'change',
      updateSubtitles
    )

    document.addEventListener(
      'fullscreenchange',
      updateFullscreen
    )

    updateTime()
    updateDuration()
    updateVolume()
    updateSubtitles()
    setPlaying(!video.paused)

    return () => {
      video.removeEventListener('timeupdate', updateTime)
      video.removeEventListener('durationchange', updateDuration)
      video.removeEventListener('loadedmetadata', updateDuration)
      video.removeEventListener('volumechange', updateVolume)
      video.removeEventListener('play', updatePlay)
      video.removeEventListener('pause', updatePause)
      video.removeEventListener('ended', updatePause)
      video.removeEventListener(
        'loadedmetadata',
        updateSubtitles
      )

      video.textTracks?.removeEventListener?.(
        'change',
        updateSubtitles
      )

      document.removeEventListener(
        'fullscreenchange',
        updateFullscreen
      )

      clearHideTimer()
    }
  }, [videoRef, enabled])

  // ==========================================
  // DETECTAR ACTIVIDAD EN TODO EL VIDEO
  // ==========================================

  useEffect(() => {
    const video = videoRef.current
    const container = video?.parentElement

    if (!video || !container) return

    const handleMouseMove = () => {
      showControls()
    }

    const handleTouch = () => {
      showControls()
    }

    const handleMouseLeave = () => {
      interactingRef.current = false
      scheduleHide()
    }

    container.addEventListener(
      'mousemove',
      handleMouseMove
    )

    container.addEventListener(
      'touchstart',
      handleTouch,
      { passive: true }
    )

    container.addEventListener(
      'mouseleave',
      handleMouseLeave
    )

    return () => {
      container.removeEventListener(
        'mousemove',
        handleMouseMove
      )

      container.removeEventListener(
        'touchstart',
        handleTouch
      )

      container.removeEventListener(
        'mouseleave',
        handleMouseLeave
      )

      clearHideTimer()
    }
  }, [videoRef, enabled])

  // ==========================================
  // INICIALIZAR VISIBILIDAD
  // ==========================================

  useEffect(() => {
    setVisible(true)
    scheduleHide()

    return () => clearHideTimer()
  }, [enabled])

  // ==========================================
  // REPRODUCIR / PAUSAR
  // ==========================================

  const togglePlay = async () => {
    const video = videoRef.current

    if (!video || !enabled) return

    try {
      if (video.paused) {
        await video.play()
      } else {
        video.pause()
      }
    } catch (error) {
      console.error(
        'Error al cambiar reproducción:',
        error
      )
    }

    showControls()
  }

  // ==========================================
  // BARRA DE PROGRESO
  // ==========================================

  const seek = (value) => {
    const video = videoRef.current

    if (!video || !enabled || !duration) return

    const nextTime = Number(value)

    video.currentTime = nextTime
    setCurrentTime(nextTime)

    showControls()
  }

  // ==========================================
  // RETROCEDER / AVANZAR 10 SEGUNDOS
  // ==========================================

  const skip = (seconds) => {
    const video = videoRef.current

    if (!video || !enabled) return

    const nextTime = video.currentTime + seconds

    video.currentTime = Math.max(
      0,
      Math.min(nextTime, duration || nextTime)
    )

    showControls()
  }

  // ==========================================
  // VOLUMEN
  // ==========================================

  const changeVolume = (value) => {
    const video = videoRef.current

    if (!video) return

    const nextVolume = Number(value)

    video.volume = nextVolume
    video.muted = nextVolume === 0

    setVolume(nextVolume)
    setMuted(nextVolume === 0)

    showControls()
  }

  const toggleMute = () => {
    const video = videoRef.current

    if (!video) return

    video.muted = !video.muted

    showControls()
  }

  // ==========================================
  // PANTALLA COMPLETA
  // ==========================================

  const toggleFullscreen = async () => {
    const video = videoRef.current
    const container = video?.parentElement

    if (!container) return

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      } else {
        await container.requestFullscreen()
      }
    } catch (error) {
      console.error(
        'Error al cambiar pantalla completa:',
        error
      )
    }

    showControls()
  }

  // ==========================================
  // SUBTÍTULOS
  // ==========================================

  const toggleSubtitlesMenu = () => {
    const nextValue = !showSubtitles

    setShowSubtitles(nextValue)
    subtitlesOpenRef.current = nextValue

    setVisible(true)

    if (nextValue) {
      clearHideTimer()
    } else {
      scheduleHide()
    }
  }

  const changeSubtitle = (index) => {
    const video = videoRef.current

    if (!video) return

    const selected = Number(index)
    const tracks = Array.from(video.textTracks || [])

    tracks.forEach((track, i) => {
      track.mode =
        i === selected ? 'showing' : 'disabled'
    })

    setSelectedSubtitle(selected)
    setShowSubtitles(false)
    subtitlesOpenRef.current = false

    showControls()
  }

  // ==========================================
  // INTERACCIÓN CON CONTROLES
  // ==========================================

  const handleControlsEnter = () => {
    interactingRef.current = true
    clearHideTimer()
    setVisible(true)
  }

  const handleControlsLeave = () => {
    interactingRef.current = false
    scheduleHide()
  }

  // ==========================================
  // ICONO DE VOLUMEN
  // ==========================================

  const VolumeIcon =
    muted || volume === 0
      ? VolumeX
      : volume < 0.5
        ? Volume1
        : Volume2

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div
      className={`sp-player-controls ${
        visible ? 'visible' : 'hidden'
      }`}
      onMouseEnter={handleControlsEnter}
      onMouseLeave={handleControlsLeave}
    >
      {/* BARRA DE PROGRESO */}

      <input
        type="range"
        className="sp-player-progress"
        min="0"
        max={duration || 1}
        step="0.1"
        value={Math.min(
          currentTime,
          duration || 1
        )}
        onChange={(event) =>
          seek(event.target.value)
        }
        disabled={!enabled || !duration}
        aria-label="Progreso del video"
        style={{
          '--progress': `${
            duration > 0
              ? (currentTime / duration) * 100
              : 0
          }%`
        }}
      />

      {/* BARRA DE HERRAMIENTAS */}

      <div className="sp-player-toolbar">
        <div className="sp-player-left">

          {/* REPRODUCIR / PAUSAR */}

          <button
            type="button"
            className="sp-player-icon"
            onClick={togglePlay}
            disabled={!enabled}
            title={playing ? 'Pausar' : 'Reproducir'}
            aria-label={playing ? 'Pausar' : 'Reproducir'}
          >
            {playing ? (
              <Pause
                size={22}
                fill="currentColor"
              />
            ) : (
              <Play
                size={22}
                fill="currentColor"
              />
            )}
          </button>

          {/* RETROCEDER */}

          <button
            type="button"
            className="sp-player-icon"
            onClick={() => skip(-10)}
            disabled={!enabled}
            title="Retroceder 10 segundos"
            aria-label="Retroceder 10 segundos"
          >
            <RotateCcw size={22} />
          </button>

          {/* AVANZAR */}

          <button
            type="button"
            className="sp-player-icon"
            onClick={() => skip(10)}
            disabled={!enabled}
            title="Avanzar 10 segundos"
            aria-label="Avanzar 10 segundos"
          >
            <RotateCw size={22} />
          </button>

          {/* VOLUMEN */}

          <div className="sp-player-volume-group">
            <button
              type="button"
              className="sp-player-icon"
              onClick={toggleMute}
              title={
                muted
                  ? 'Activar sonido'
                  : 'Silenciar'
              }
              aria-label={
                muted
                  ? 'Activar sonido'
                  : 'Silenciar'
              }
            >
              <VolumeIcon size={22} />
            </button>

            <input
              type="range"
              className="sp-player-volume"
              min="0"
              max="1"
              step="0.05"
              value={muted ? 0 : volume}
              onChange={(event) =>
                changeVolume(event.target.value)
              }
              aria-label="Volumen"
            />
          </div>

          {/* TIEMPO */}

          <span className="sp-player-time">
            {formatTime(currentTime)}
            {' / '}
            {formatTime(duration)}
          </span>
        </div>

        <div className="sp-player-right">

          {/* SUBTÍTULOS */}

          {subtitleTracks.length > 0 && (
            <div className="sp-player-subtitle-container">
              <button
                type="button"
                className="sp-player-icon"
                onClick={toggleSubtitlesMenu}
                title="Subtítulos"
                aria-label="Subtítulos"
              >
                <Captions size={24} />
              </button>

              {showSubtitles && (
                <div className="sp-player-subtitle-menu">
                  <button
                    type="button"
                    onClick={() => changeSubtitle(-1)}
                  >
                    Desactivados
                  </button>

                  {subtitleTracks.map((track) => (
                    <button
                      type="button"
                      key={track.index}
                      onClick={() =>
                        changeSubtitle(track.index)
                      }
                      className={
                        selectedSubtitle === track.index
                          ? 'selected'
                          : ''
                      }
                    >
                      {track.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PANTALLA COMPLETA */}

          <button
            type="button"
            className="sp-player-icon"
            onClick={toggleFullscreen}
            title={
              fullscreen
                ? 'Salir de pantalla completa'
                : 'Pantalla completa'
            }
            aria-label={
              fullscreen
                ? 'Salir de pantalla completa'
                : 'Pantalla completa'
            }
          >
            {fullscreen ? (
              <Minimize size={22} />
            ) : (
              <Maximize size={22} />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default PlayerControls
