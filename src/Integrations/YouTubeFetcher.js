import youtubedl from 'youtube-dl'

export default function YouTubeFetcher(url) {
  return youtubedl(url)
}