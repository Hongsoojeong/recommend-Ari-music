"use client"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogClose } from "./ui/dialog.jsx"
import { Badge } from "./ui/badge.jsx"
import { PlayCircle, PauseCircle, X } from "lucide-react"
import { Button } from "./ui/button.jsx"
import { useEffect, useRef, useState } from "react"

// YouTube IFrame Player API 로드를 관리하는 함수
let youtubeAPIReadyPromise = null
function loadYoutubeAPI() {
  if (youtubeAPIReadyPromise) {
    return youtubeAPIReadyPromise
  }

  youtubeAPIReadyPromise = new Promise((resolve) => {
    if (window.YT && window.YT.Player) {
      resolve(window.YT)
      return
    }

    const tag = document.createElement("script")
    tag.src = "https://www.youtube.com/iframe_api"
    const firstScriptTag = document.getElementsByTagName("script")[0]
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)

    window.onYouTubeIframeAPIReady = () => {
      resolve(window.YT)
    }
  })
  return youtubeAPIReadyPromise
}

export function TrackDetailModal({ track, isOpen, onClose }) {
  const [player, setPlayer] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const playerRef = useRef(null) // YouTube 플레이어 DOM 요소를 위한 ref

  useEffect(() => {
    // 모달이 닫히거나 트랙에 YouTube ID가 없으면 플레이어 정리
    if (!track?.youtubeVideoId || !isOpen) {
      if (player) {
        player.destroy()
        setPlayer(null)
        setIsPlaying(false)
      }
      return
    }

    // 기존 플레이어가 있다면 파괴
    if (player) {
      player.destroy()
      setPlayer(null)
      setIsPlaying(false)
    }

    // YouTube API 로드 및 플레이어 초기화
    loadYoutubeAPI().then((YT) => {
      // API 로드 후에도 모달이 열려있고 트랙 ID가 유효한지 다시 확인
      if (playerRef.current && track.youtubeVideoId && isOpen) {
        const newPlayer = new YT.Player(playerRef.current, {
          videoId: track.youtubeVideoId,
          playerVars: {
            autoplay: 1, // 자동 재생
            controls: 1, // 컨트롤 표시
            rel: 0, // 관련 동영상 표시 안 함
            modestbranding: 1, // YouTube 로고 간소화
            enablejsapi: 1,
          },
          events: {
            onReady: (event) => {
              setPlayer(event.target)
              event.target.playVideo()
              setIsPlaying(true)
            },
            onStateChange: (event) => {
              if (event.data === YT.PlayerState.PLAYING) {
                setIsPlaying(true)
              } else {
                setIsPlaying(false)
              }
            },
          },
        })
      }
    })

    // 컴포넌트 언마운트 또는 모달 닫힘 시 플레이어 정리
    return () => {
      if (player) {
        player.destroy()
        setPlayer(null)
        setIsPlaying(false)
      }
    }
  }, [track?.youtubeVideoId, isOpen]) // player를 의존성 배열에서 제거

  const handlePlayPause = () => {
    if (player) {
      if (isPlaying) {
        player.pauseVideo()
      } else {
        player.playVideo()
      }
    }
  }

  if (!track) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-zinc-900 text-white border-zinc-700 rounded-lg p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
        <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground text-zinc-400 hover:text-rose-400 z-20">
          <X className="h-5 w-5" />
          <span className="sr-only">닫기</span>
        </DialogClose>
        <div className="relative w-full h-48 sm:h-64 bg-black flex items-center justify-center">
          {track.youtubeVideoId ? (
            <div id="youtube-player" ref={playerRef} className="w-full h-full aspect-video relative">
              {/* 재생/일시정지 버튼을 YouTube 플레이어 div 안으로 이동 */}
              {track.youtubeVideoId && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute inset-0 m-auto w-24 h-24 rounded-full bg-rose-600/80 hover:bg-rose-700/90 text-white transition-colors duration-200 flex items-center justify-center z-20"
                  onClick={handlePlayPause}
                >
                  {isPlaying ? <PauseCircle className="w-12 h-12" /> : <PlayCircle className="w-12 h-12" />}
                  <span className="sr-only">{isPlaying ? "정지" : "재생"}</span>
                </Button>
              )}
            </div>
          ) : (
            <img
              src={
                track.album?.images?.[0]?.url || "/placeholder.svg?height=256&width=425&query=music album cover large"
              }
              alt={`${track.name} album cover`}
              width={425}
              height={256}
              className="w-full h-full object-cover rounded-t-lg"
            />
          )}
        </div>
        <div className="p-6 pt-4 text-center">
          <DialogHeader className="flex flex-col items-center text-center mb-4">
            <DialogTitle className="text-2xl font-bold text-rose-400 whitespace-normal w-full text-wrap">
              {track.name}
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-base mt-1">
              {track.album?.name} - {track.artists?.[0]?.name || "Unknown Artist"}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {track.hashtags &&
              Array.isArray(track.hashtags) &&
              track.hashtags.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="text-sm px-3 py-1 bg-zinc-700 text-zinc-300 border-zinc-600"
                >
                  {tag}
                </Badge>
              ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
