export type StationId = 'listen' | 'voice' | 'face' | 'read' | 'fake' | 'clone'

export type Station = {
  id: StationId
  num: string
  path: string
  title: string
  kicker: string
  model: string
  deck: string
  media: string
}

export const stations: Station[] = [
  {
    id: 'listen',
    num: '01',
    path: '/lab/listen',
    title: 'Language Detection',
    kicker: 'Speech',
    model: 'MMS-LID-4017 · cloud',
    deck: 'Drop a clip. Seconds later, you know what language it speaks.',
    media: '/media/listen.mp4',
  },
  {
    id: 'voice',
    num: '02',
    path: '/lab/voice',
    title: 'Voice Matching',
    kicker: 'Speaker',
    model: 'Resemblyzer + NeMo ECAPA · cloud',
    deck: 'Two recordings. One question: same person, or not.',
    media: '/media/voice.mp4',
  },
  {
    id: 'face',
    num: '03',
    path: '/lab/face',
    title: 'Face Match',
    kicker: 'Video',
    model: 'InsightFace buffalo_l · 512-D',
    deck: 'A still of a face, a stretch of video. The engine marks the frames where that person appears.',
    media: '/media/face.mp4',
  },
  {
    id: 'read',
    num: '04',
    path: '/lab/read',
    title: 'Document Reader',
    kicker: 'Documents',
    model: 'Tesseract hin+eng · cloud',
    deck: 'Pages and scans. Raw text, then the numbers that matter: PAN, Aadhaar, phones, IFSC.',
    media: '/media/read.mp4',
  },
  {
    id: 'fake',
    num: '05',
    path: '/lab/fake',
    title: 'Deepfake',
    kicker: 'Deepfake',
    model: 'DFDS · cloud',
    deck: 'Real or generated? Drop an image, a voice clip, or a video. The lab routes it.',
    media: '/media/fake.mp4',
  },
  {
    id: 'clone',
    num: '06',
    path: '/lab/clone',
    title: 'Voice Cloning',
    kicker: 'Synthesis',
    model: 'OpenVoice V2 + MeloTTS · CPU',
    deck: 'A few seconds of someone speaking, and a line of text. The engine says it back in their voice.',
    // No dedicated clip shot for this station yet — borrowing the voice loop.
    media: '/media/voice.mp4',
  },
]
