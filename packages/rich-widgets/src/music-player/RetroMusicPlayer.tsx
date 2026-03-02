import { useState, useEffect, useCallback } from 'react';
import { Btn } from '@hypercard/engine';
import { RICH_PARTS as P } from '../parts';
import { EmptyState } from '../primitives/EmptyState';
import { WidgetStatusBar } from '../primitives/WidgetStatusBar';
import { WidgetToolbar } from '../primitives/WidgetToolbar';
import { type Track, type ViewMode, parseDuration, fmtTime } from './types';
import { PLAYLISTS, ALBUMS, getTracksForPlaylist } from './sampleData';
import type { Playlist } from './types';

/* ── EQ Visualizer ── */
function EqViz({ playing }: { playing: boolean }) {
  const [bars, setBars] = useState(Array(16).fill(3) as number[]);
  useEffect(() => {
    if (!playing) {
      setBars(Array(16).fill(1));
      return;
    }
    const id = setInterval(() => {
      setBars(
        Array(16)
          .fill(0)
          .map(() => Math.floor(Math.random() * 12) + 1),
      );
    }, 180);
    return () => clearInterval(id);
  }, [playing]);
  return (
    <div data-part={P.mpEqViz}>
      {bars.map((h, i) => (
        <div
          key={i}
          data-part={P.mpEqBar}
          style={{ height: h }}
        />
      ))}
    </div>
  );
}

/* ── Marquee ── */
function Marquee({ text }: { text: string }) {
  return (
    <div data-part={P.mpMarquee}>
      <div data-part={P.mpMarqueeInner}>{text}</div>
    </div>
  );
}

/* ── Main ── */
export interface RetroMusicPlayerProps {
  initialPlaylists?: Playlist[];
}

export function RetroMusicPlayer({
  initialPlaylists = PLAYLISTS,
}: RetroMusicPlayerProps) {
  const [selPlaylist, setSelPlaylist] = useState(initialPlaylists[0]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [trackIdx, setTrackIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(72);
  const [elapsed, setElapsed] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [showEq, setShowEq] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [view, setView] = useState<ViewMode>('list');

  const tracks = getTracksForPlaylist(selPlaylist.id);

  // Elapsed timer
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [playing, currentTrack]);

  const playTrack = useCallback(
    (track: Track, idx: number) => {
      setCurrentTrack(track);
      setTrackIdx(idx);
      setPlaying(true);
      setElapsed(0);
    },
    [],
  );

  const totalDuration = currentTrack
    ? parseDuration(currentTrack.duration)
    : 200;
  const progress = currentTrack
    ? Math.min(100, (elapsed / totalDuration) * 100)
    : 0;

  const nextTrack = useCallback(() => {
    const next = shuffle
      ? Math.floor(Math.random() * tracks.length)
      : (trackIdx + 1) % tracks.length;
    playTrack(tracks[next], next);
  }, [shuffle, trackIdx, tracks, playTrack]);

  const prevTrack = useCallback(() => {
    if (elapsed > 3) {
      setElapsed(0);
      return;
    }
    const prev = (trackIdx - 1 + tracks.length) % tracks.length;
    playTrack(tracks[prev], prev);
  }, [elapsed, trackIdx, tracks, playTrack]);

  // Auto-advance
  useEffect(() => {
    if (playing && currentTrack && elapsed >= totalDuration) {
      if (repeat) {
        setElapsed(0);
      } else {
        nextTrack();
      }
    }
  }, [elapsed, playing, currentTrack, totalDuration, repeat, nextTrack]);

  const filteredTracks = tracks.filter(
    (t) =>
      !searchTerm ||
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.artist.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const albumMeta = ALBUMS[selPlaylist.id];

  const toggleLike = (t: Track) => {
    const key = `${t.title}-${t.artist}`;
    setLiked((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div data-part={P.musicPlayer}>
      {/* ── Now Playing ── */}
      <div data-part={P.mpNowPlaying}>
        <div data-part={P.mpNpContent}>
          {/* Album art */}
          <div data-part={P.mpAlbumArt}>
            {currentTrack
              ? albumMeta?.cover || '\uD83C\uDFB5'
              : '\uD83C\uDFB5'}
          </div>

          {/* Track info + controls */}
          <div data-part={P.mpTrackInfo}>
            <div data-part={P.mpTrackTitle}>
              {currentTrack ? currentTrack.title : 'No track selected'}
            </div>
            <div data-part={P.mpTrackArtist}>
              {currentTrack
                ? `${currentTrack.artist} \u2014 ${currentTrack.album}`
                : 'Select a song to play'}
            </div>

            {/* Transport */}
            <div data-part={P.mpTransport}>
              <Btn
                onClick={() => setShuffle(!shuffle)}
                data-state={shuffle ? 'active' : undefined}
              >
                {'\uD83D\uDD00'}
              </Btn>
              <Btn onClick={prevTrack}>{'\u23EE'}</Btn>
              <Btn
                data-state="active"
                onClick={() => {
                  if (!currentTrack && tracks.length) {
                    playTrack(tracks[0], 0);
                  } else {
                    setPlaying(!playing);
                  }
                }}
              >
                {playing ? '\u23F8' : '\u25B6'}
              </Btn>
              <Btn onClick={nextTrack}>{'\u23ED'}</Btn>
              <Btn
                onClick={() => setRepeat(!repeat)}
                data-state={repeat ? 'active' : undefined}
              >
                {repeat ? '\uD83D\uDD02' : '\uD83D\uDD01'}
              </Btn>

              {/* Progress */}
              <div data-part={P.mpProgressArea}>
                <span data-part={P.mpTimeLabel}>{fmtTime(elapsed)}</span>
                <div
                  data-part={P.mpProgressBar}
                  onClick={(e) => {
                    if (!currentTrack) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    const pct = (e.clientX - rect.left) / rect.width;
                    setElapsed(Math.floor(pct * totalDuration));
                  }}
                >
                  <div
                    data-part={P.mpProgressFill}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span data-part={P.mpTimeLabel}>
                  {currentTrack ? currentTrack.duration : '0:00'}
                </span>
              </div>

              {/* Volume */}
              <span data-part={P.mpVolIcon}>{'\uD83D\uDD08'}</span>
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => setVolume(+e.target.value)}
                data-part={P.mpVolSlider}
              />
              <span data-part={P.mpVolIcon}>{'\uD83D\uDD0A'}</span>
            </div>
          </div>

          {/* EQ */}
          {showEq && (
            <div data-part={P.mpEqContainer}>
              <EqViz playing={playing} />
            </div>
          )}
        </div>

        {/* Marquee ticker */}
        {currentTrack && playing && (
          <div data-part={P.mpTicker}>
            <Marquee
              text={`\u266B  Now Playing: ${currentTrack.title} by ${currentTrack.artist}  \u2014  Album: ${currentTrack.album}  \u2014  ${selPlaylist.name}  \u266B`}
            />
          </div>
        )}
      </div>

      {/* ── Main Layout ── */}
      <div data-part={P.mpBody}>
        {/* Sidebar */}
        <div data-part={P.mpSidebar}>
          <div data-part={P.mpSidebarTitle}>YOUR LIBRARY</div>
          {initialPlaylists.map((p) => (
            <div
              key={p.id}
              data-part={P.mpPlaylistRow}
              data-state={selPlaylist.id === p.id ? 'active' : undefined}
              onClick={() => {
                setSelPlaylist(p);
                setSearchTerm('');
              }}
            >
              <span data-part={P.mpPlaylistIcon}>{p.icon}</span>
              <div data-part={P.mpPlaylistInfo}>
                <div data-part={P.mpPlaylistName}>{p.name}</div>
                <div data-part={P.mpPlaylistCount}>{p.count} songs</div>
              </div>
            </div>
          ))}
        </div>

        {/* Main content */}
        <div data-part={P.mpMain}>
          {/* Toolbar */}
          <WidgetToolbar>
            <Btn onClick={() => playTrack(tracks[0], 0)}>
              {'\u25B6'} Play All
            </Btn>
            <Btn
              onClick={() => {
                const i = Math.floor(Math.random() * tracks.length);
                playTrack(tracks[i], i);
                setShuffle(true);
              }}
            >
              {'\uD83D\uDD00'} Shuffle
            </Btn>
            <Btn
              onClick={() => setView(view === 'list' ? 'grid' : 'list')}
            >
              {view === 'list' ? 'Grid' : 'List'}
            </Btn>
            <Btn
              onClick={() => setShowEq(!showEq)}
              data-state={showEq ? 'active' : undefined}
            >
              EQ
            </Btn>
            <Btn
              onClick={() => setShowQueue(!showQueue)}
              data-state={showQueue ? 'active' : undefined}
            >
              Queue
            </Btn>
            <div style={{ flex: 1 }} />
            <input
              data-part={P.mpSearchInput}
              type="text"
              placeholder="Search in playlist\u2026"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </WidgetToolbar>

          {/* Playlist header */}
          <div data-part={P.mpPlaylistHeader}>
            <div data-part={P.mpPlaylistCover}>
              {albumMeta?.cover || '\uD83C\uDFB5'}
            </div>
            <div>
              <div data-part={P.mpPlaylistHeaderName}>
                {selPlaylist.name}
              </div>
              <div data-part={P.mpPlaylistHeaderArtist}>
                {albumMeta?.artist}{' '}
                {albumMeta?.year && `\u2022 ${albumMeta.year}`}
              </div>
              <div data-part={P.mpPlaylistHeaderCount}>
                {selPlaylist.count} songs
              </div>
            </div>
          </div>

          {view === 'list' ? (
            <div data-part={P.mpTrackList}>
              {/* Column headers */}
              <div data-part={P.mpTrackListHeader}>
                <span style={{ width: 20, textAlign: 'center' }}>#</span>
                <span style={{ flex: 2 }}>Title</span>
                <span style={{ flex: 1 }}>Artist</span>
                <span style={{ flex: 1 }}>Album</span>
                <span style={{ width: 20, textAlign: 'center' }}>
                  {'\u2764\uFE0F'}
                </span>
                <span style={{ width: 40, textAlign: 'right' }}>Time</span>
              </div>
              {filteredTracks.map((t, i) => {
                const isCurrent =
                  currentTrack?.title === t.title &&
                  currentTrack?.artist === t.artist;
                return (
                  <div
                    key={i}
                    data-part={P.mpTrackRow}
                    data-state={isCurrent ? 'active' : undefined}
                    data-stripe={i % 2 === 0 ? 'even' : 'odd'}
                    onDoubleClick={() => playTrack(t, i)}
                  >
                    <span data-part={P.mpTrackNum}>
                      {isCurrent && playing ? '\uD83D\uDD0A' : i + 1}
                    </span>
                    <span data-part={P.mpTrackRowTitle}>{t.title}</span>
                    <span data-part={P.mpTrackRowArtist}>{t.artist}</span>
                    <span data-part={P.mpTrackRowAlbum}>{t.album}</span>
                    <span
                      data-part={P.mpLikeBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLike(t);
                      }}
                    >
                      {liked[`${t.title}-${t.artist}`]
                        ? '\u2764\uFE0F'
                        : '\uD83E\uDD0D'}
                    </span>
                    <span data-part={P.mpTrackDuration}>{t.duration}</span>
                  </div>
                );
              })}
              {filteredTracks.length === 0 && (
                <EmptyState message="No matching tracks." />
              )}
            </div>
          ) : (
            <div data-part={P.mpGridView}>
              {filteredTracks.map((t, i) => {
                const isCurrent = currentTrack?.title === t.title;
                return (
                  <div
                    key={i}
                    data-part={P.mpGridCard}
                    data-state={isCurrent ? 'active' : undefined}
                    onDoubleClick={() => playTrack(t, i)}
                  >
                    <div data-part={P.mpGridCardIcon}>{'\uD83C\uDFB5'}</div>
                    <div data-part={P.mpGridCardTitle}>{t.title}</div>
                    <div data-part={P.mpGridCardArtist}>{t.artist}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Queue */}
        {showQueue && (
          <div data-part={P.mpQueue}>
            <div data-part={P.mpQueueHeader}>
              <span>Up Next</span>
              <Btn onClick={() => setShowQueue(false)}>{'\u00D7'}</Btn>
            </div>
            <div data-part={P.mpQueueList}>
              {tracks
                .slice(trackIdx + 1, trackIdx + 10)
                .map((t, i) => (
                  <div
                    key={i}
                    data-part={P.mpQueueRow}
                    onDoubleClick={() =>
                      playTrack(t, trackIdx + 1 + i)
                    }
                  >
                    <span data-part={P.mpQueueNum}>{i + 1}</span>
                    <div data-part={P.mpQueueInfo}>
                      <div data-part={P.mpQueueTitle}>{t.title}</div>
                      <div data-part={P.mpQueueArtist}>{t.artist}</div>
                    </div>
                    <span data-part={P.mpQueueDuration}>
                      {t.duration}
                    </span>
                  </div>
                ))}
              {tracks.slice(trackIdx + 1).length === 0 && (
                <EmptyState message="Queue empty." />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Status bar */}
      <WidgetStatusBar>
        <span>{playing ? '\uD83D\uDD0A Playing' : '\u23F8 Paused'}</span>
        {shuffle && <span>{'\uD83D\uDD00'} Shuffle</span>}
        {repeat && <span>{'\uD83D\uDD02'} Repeat</span>}
        <div style={{ flex: 1 }} />
        <span>Vol: {volume}%</span>
        <span>{initialPlaylists.length} playlists</span>
      </WidgetStatusBar>
    </div>
  );
}
