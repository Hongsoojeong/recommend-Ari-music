"use client"

// src/components/MusicPlayer.jsx
import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardFooter } from "./ui/card"
import { Button } from "./ui/button"
import { ScrollArea } from "./ui/scroll-area"
import { Heart, Music, CheckCircle, PlayCircle } from "lucide-react" // PlayCircle 아이콘 추가
import { artistData, allTracksData, popularTrackData } from "../lib/data.js"
import { useToast } from "./ui/use-toast.jsx"
import { TrackDetailModal } from "./track-detail-modal.jsx"

// Track 인터페이스 업데이트
const Track = {
  id: "",
  name: "",
  popularity: 0,
  hashtags: [], // 해시태그 속성 추가
  album: {
    name: "",
    images: [{ url: "", height: 0, width: 0 }],
  },
  artists: [{ name: "" }],
  youtubeVideoId: "", // YouTube Video ID 속성 추가
}

export default function MusicPlayer() {
  const { toast } = useToast()

  const [selectedTracks, setSelectedTracks] = useState([])
  const [recommendedTracks, setRecommendedTracks] = useState([])
  const [randomTracks, setRandomTracks] = useState([]) // 랜덤 추천곡 상태 추가
  const [selectedTrackInModal, setSelectedTrackInModal] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleTrackSelect = (track) => {
    setSelectedTracks((prevSelected) => {
      if (prevSelected.some((t) => t.id === track.id)) {
        return prevSelected.filter((t) => t.id !== track.id)
      } else {
        if (prevSelected.length < 5) {
          return [...prevSelected, track]
        } else {
          toast({
            title: "Selection Limit",
            description: "You can select up to 5 tracks.",
            variant: "destructive",
          })
          return prevSelected
        }
      }
    })
  }

  const generateRecommendations = () => {
    if (selectedTracks.length < 3) {
      toast({
        title: "Recommendation Unavailable",
        description: "Please select at least 3 tracks to get recommendations.",
        variant: "destructive",
      })
      return
    }

    const hashtagCounts = {}
    selectedTracks.forEach((track) => {
      if (track.hashtags && Array.isArray(track.hashtags)) {
        track.hashtags.forEach((h) => {
          hashtagCounts[h] = (hashtagCounts[h] || 0) + 1
        })
      }
    })

    const sortedHashtags = Object.keys(hashtagCounts).sort((a, b) => hashtagCounts[b] - hashtagCounts[a])

    const recommendations = []
    const recommendedTrackIds = new Set()

    const availableTracksForRec = allTracksData.filter((track) => !selectedTracks.some((s) => s.id === track.id))

    for (const hashtag of sortedHashtags) {
      if (recommendations.length >= 10) break

      const matchedTracks = availableTracksForRec.filter(
        (track) =>
          track.hashtags &&
          Array.isArray(track.hashtags) &&
          track.hashtags.includes(hashtag) &&
          !recommendedTrackIds.has(track.id),
      )

      matchedTracks.sort((a, b) => b.popularity - a.popularity)

      for (const track of matchedTracks) {
        if (recommendations.length >= 10) break
        recommendations.push(track)
        recommendedTrackIds.add(track.id)
      }
    }

    if (recommendations.length < 10) {
      const remainingSlots = 10 - recommendations.length
      const fillerTracks = availableTracksForRec
        .filter((track) => !recommendedTrackIds.has(track.id))
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, remainingSlots)
      recommendations.push(...fillerTracks)
    }

    setRecommendedTracks(recommendations)
    setSelectedTrackInModal(null)
    setIsModalOpen(false)

    // 랜덤 추천곡 생성 (선택된 곡과 추천된 곡을 제외)
    const allUsedTrackIds = new Set([...selectedTracks.map((t) => t.id), ...recommendations.map((t) => t.id)])
    const availableForRandom = allTracksData.filter((track) => !allUsedTrackIds.has(track.id))

    // 트랙을 섞어서 7개 선택
    const shuffledAvailable = [...availableForRandom].sort(() => 0.5 - Math.random())
    setRandomTracks(shuffledAvailable.slice(0, 7))
  }

  const handleTrackPlay = (track) => {
    setSelectedTrackInModal(track)
    setIsModalOpen(true)
  }

  const formatFollowers = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M"
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K"
    }
    return num.toString()
  }

  const popularTracks = useMemo(() => {
    return (
      Array.isArray(popularTrackData) &&
      popularTrackData.filter((track) => track.popularity).sort((a, b) => b.popularity - a.popularity)
    )
  }, [])

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 md:p-6 lg:p-8 flex flex-col">
      <Card className="max-w-2xl mx-auto bg-zinc-900 border-zinc-800 shadow-lg rounded-xl overflow-hidden flex-grow">
        <CardHeader className="p-0 border-b border-zinc-800 relative">
          <img
            src={artistData?.images?.[0]?.url || "/placeholder.svg?height=400&width=600&query=ariana grande profile"}
            alt={artistData?.name || "Artist"}
            width={600}
            height={400}
            className="w-full h-48 sm:h-64 object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent" />
          <div className="absolute bottom-0 left-0 p-6 text-white z-10">
            <h1 className="text-4xl font-bold drop-shadow-lg">{artistData?.name || "Unknown Artist"}</h1>
            <p className="text-zinc-200 text-lg mt-1 drop-shadow-md">
              <span className="font-semibold text-rose-400">{formatFollowers(artistData?.followers?.total || 0)}</span>{" "}
              Followers
            </p>
            <div className="flex gap-2 mt-2">
              {artistData?.genres &&
                Array.isArray(artistData.genres) &&
                artistData.genres.map((genre) => (
                  <div key={genre} className="bg-zinc-700 text-zinc-200 px-2 py-1 rounded text-sm">
                    {genre}
                  </div>
                ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-zinc-200">Popular Tracks</h2>
          <ScrollArea className="h-[300px] pr-4">
            <div className="grid gap-3">
              {popularTracks &&
                Array.isArray(popularTracks) &&
                popularTracks.map((track) => (
                  <div
                    key={track.id}
                    className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-colors duration-200
                    ${
                      selectedTracks.some((t) => t.id === track.id)
                        ? "bg-rose-500/20 ring-2 ring-rose-500"
                        : "hover:bg-zinc-800"
                    }`}
                    onClick={() => handleTrackSelect(track)} // 트랙 항목 클릭 시 선택/해제
                  >
                    <img
                      src={
                        track.album?.images?.[0]?.url || "/placeholder.svg?height=64&width=64&query=music album cover"
                      }
                      alt={`${track.name} album cover`}
                      width={64}
                      height={64}
                      className="rounded-md object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-zinc-100 truncate">{track.name}</p>
                      <p className="text-sm text-zinc-400 truncate">{track.album?.name}</p>
                      {track.hashtags && Array.isArray(track.hashtags) && track.hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {track.hashtags.map((tag) => (
                            <div
                              key={tag}
                              className="text-xs px-2 py-0.5 bg-zinc-700 text-zinc-300 border-zinc-600 rounded"
                            >
                              {tag}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* 선택/해제 상태 표시 */}
                    {selectedTracks.some((t) => t.id === track.id) && (
                      <CheckCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                    )}
                  </div>
                ))}
            </div>
          </ScrollArea>
          <div className="mt-6 border-t border-zinc-800 pt-6">
            <h2 className="text-xl font-semibold mb-4 text-zinc-200">Selected Tracks ({selectedTracks.length}/5)</h2>
            <p className="text-zinc-500 text-sm mb-4">
              Select 3 to 5 tracks from the "Popular Tracks" list to get personalized recommendations based on their
              hashtags and genres.
            </p>
            {selectedTracks.length === 0 ? (
              <p className="text-zinc-500 text-center">Please select 3-5 tracks from Popular Tracks.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedTracks.map((track) => (
                  <div key={track.id} className="bg-zinc-800 border-zinc-700 flex items-center p-3 gap-3">
                    <img
                      src={
                        track.album?.images?.[0]?.url || "/placeholder.svg?height=48&width=48&query=music album cover"
                      }
                      alt={`${track.name} album cover`}
                      width={48}
                      height={48}
                      className="rounded-md object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-zinc-100 text-sm truncate">{track.name}</p>
                      <p className="text-xs text-zinc-400 truncate">{track.album?.name}</p>
                    </div>
                    {/* 선택된 트랙 개별 재생 버튼 */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-zinc-400 hover:text-rose-400 flex-shrink-0"
                      onClick={() => handleTrackPlay(track)}
                    >
                      <PlayCircle className="w-5 h-5" />
                      <span className="sr-only">재생</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-zinc-400 hover:text-rose-400 flex-shrink-0"
                      onClick={() => handleTrackSelect(track)}
                    >
                      <Heart className="w-4 h-4 fill-rose-400 stroke-rose-400" />
                      <span className="sr-only">Deselect</span>
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <Button
              onClick={generateRecommendations}
              className="w-full mt-6 bg-rose-600 hover:bg-rose-700 text-white font-semibold py-2 rounded-lg transition-colors duration-200"
              disabled={selectedTracks.length < 3}
            >
              <Music className="w-5 h-5 mr-2" />
              Get Recommendations
            </Button>
          </div>
          {recommendedTracks.length > 0 && (
            <div className="mt-8 border-t border-zinc-800 pt-6">
              <h2 className="text-xl font-semibold mb-4 text-zinc-200">Recommended Tracks</h2>
              <div className="grid gap-3">
                {recommendedTracks.map((track) => (
                  <div
                    key={track.id}
                    className={`flex items-center gap-4 p-3 rounded-lg border border-zinc-700 cursor-pointer transition-colors duration-200
                      ${selectedTrackInModal?.id === track.id ? "bg-rose-500/20 ring-2 ring-rose-500" : "bg-zinc-800 hover:bg-zinc-700"}`}
                    onClick={() => handleTrackPlay(track)} // 추천곡도 클릭 시 재생 모달 열기
                  >
                    <img
                      src={
                        track.album?.images?.[0]?.url || "/placeholder.svg?height=64&width=64&query=music album cover"
                      }
                      alt={`${track.name} album cover`}
                      width={64}
                      height={64}
                      className="rounded-md object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-zinc-100 truncate">{track.name}</p>
                      <p className="text-sm text-zinc-400 truncate">{track.album?.name}</p>
                      {track.hashtags && Array.isArray(track.hashtags) && track.hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {track.hashtags.map((tag) => (
                            <div
                              key={tag}
                              className="text-xs px-2 py-0.5 bg-zinc-700 text-rose-300 border-rose-600 rounded"
                            >
                              {tag}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 랜덤 추천곡 섹션 추가 */}
          {randomTracks.length > 0 && (
            <div className="mt-8 border-t border-zinc-800 pt-6">
              <h2 className="text-xl font-semibold mb-4 text-zinc-200">Random Picks for You</h2>
              <div className="grid gap-3">
                {randomTracks.map((track) => (
                  <div
                    key={track.id}
                    className="flex items-center gap-4 p-3 rounded-lg bg-zinc-800 border border-zinc-700 cursor-pointer hover:bg-zinc-700 transition-colors duration-200"
                    onClick={() => handleTrackPlay(track)} // 랜덤곡도 모달로 재생
                  >
                    <img
                      src={
                        track.album?.images?.[0]?.url || "/placeholder.svg?height=64&width=64&query=music album cover"
                      }
                      alt={`${track.name} album cover`}
                      width={64}
                      height={64}
                      className="rounded-md object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-zinc-100 truncate">{track.name}</p>
                      <p className="text-sm text-zinc-400 truncate">{track.album?.name}</p>
                      {track.hashtags && Array.isArray(track.hashtags) && track.hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {track.hashtags.map((tag) => (
                            <div
                              key={tag}
                              className="text-xs px-2 py-0.5 bg-zinc-700 text-zinc-300 border-zinc-600 rounded"
                            >
                              {tag}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="p-4 border-t border-zinc-800 text-center text-zinc-500 text-xs">
          <p>Powered by v0 & Spotify API (Simulated Data)</p>
        </CardFooter>
      </Card>
      <TrackDetailModal track={selectedTrackInModal} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  )
}
