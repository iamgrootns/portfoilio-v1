import { useEffect, useRef, useState } from 'react'

type Props = {
  label: string
  hint: string
  accept: string
  file: File | null
  onFile: (file: File | null) => void
  preview?: 'image' | 'video' | 'none'
}

export default function DropZone({ label, hint, accept, file, onFile, preview = 'none' }: Props) {
  const input = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)
  const [url, setUrl] = useState('')

  useEffect(() => {
    if (!file || (preview !== 'image' && preview !== 'video')) {
      setUrl('')
      return
    }
    const next = URL.createObjectURL(file)
    setUrl(next)
    return () => URL.revokeObjectURL(next)
  }, [file, preview])

  return (
    <div>
      <div className="field-label">{label}</div>
      <div
        className={`drop ${over ? 'over' : ''} ${file ? 'has-file' : ''}`}
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setOver(true)
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setOver(false)
          const next = e.dataTransfer.files?.[0]
          if (next) onFile(next)
        }}
      >
        <input
          ref={input}
          type="file"
          accept={accept}
          onChange={(e) => onFile(e.target.files?.[0] || null)}
        />
        <strong>{file ? file.name : 'Drop a file, or click'}</strong>
        <span>{file ? `${Math.ceil(file.size / 1024)} KB` : hint}</span>
        {url && preview === 'image' ? <img className="preview" src={url} alt="" /> : null}
        {url && preview === 'video' ? <video className="preview" src={url} muted /> : null}
      </div>
    </div>
  )
}
