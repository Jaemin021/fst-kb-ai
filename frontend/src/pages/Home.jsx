import { useEffect, useRef, useState } from 'react'
import DetectButton from '../components/DetectButton'
import ImagePreview from '../components/ImagePreview'
import ImageUploader from '../components/ImageUploader'
import ResultSection from '../components/ResultSection'
import { detectHelmet } from '../services/detectionApi'

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png']
const MAX_FILE_SIZE_MB = 10
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

function Home() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)
  const previewUrlRef = useRef('')

  // 화면을 벗어날 때 브라우저가 만든 미리보기 주소를 정리합니다.
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current)
      }
    }
  }, [])

  const handleFileSelect = (file) => {
    if (isLoading || !file) return

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setError('JPG, JPEG, PNG 형식의 사진만 업로드할 수 있습니다.')
      return
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError(`사진 용량이 너무 큽니다. ${MAX_FILE_SIZE_MB}MB 이하 사진을 올려주세요.`)
      return
    }

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
    }

    const nextPreviewUrl = URL.createObjectURL(file)
    previewUrlRef.current = nextPreviewUrl
    setSelectedFile(file)
    setPreviewUrl(nextPreviewUrl)
    setResult(null)
    setError('')
  }

  const handleFileError = (message) => {
    if (!isLoading) setError(message)
  }

  const handleFileDelete = () => {
    if (isLoading) return

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = ''
    }

    setSelectedFile(null)
    setPreviewUrl('')
    setResult(null)
    setError('')

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDetect = async () => {
    if (!selectedFile) {
      setError('사진을 먼저 업로드해주세요.')
      return
    }

    setIsLoading(true)
    setResult(null)
    setError('')

    try {
      const detectionResult = await detectHelmet(selectedFile)
      setResult(detectionResult)
    } catch {
      setError('분석 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setIsLoading(false)
    }
  }

  const openFilePicker = () => {
    if (!isLoading) fileInputRef.current?.click()
  }

  return (
    <main>
      <section className="hero">
        <div className="hero__badge">
          <span aria-hidden="true">●</span>
          AI Vision Safety
        </div>
        <h1>
          AI 기반 킥보드
          <br />
          <span>헬멧 미착용 탐지</span>
        </h1>
        <p>
          사진을 업로드하면 AI가 킥보드 이용자의 헬멧 착용 여부를
          분석합니다.
        </p>
      </section>

      <section className="analysis-section" aria-labelledby="analysis-title">
        <div className="section-heading">
          <p className="section-heading__eyebrow">PHOTO ANALYSIS</p>
          <h2 id="analysis-title">사진으로 안전 상태 확인하기</h2>
          <p>
            분석할 사진 한 장을 선택하면 AI 모델이 안전 위반 여부를
            분석합니다.
          </p>
        </div>

        <div className="analysis-panel">
          <ImageUploader
            inputRef={fileInputRef}
            isLoading={isLoading}
            onFileSelect={handleFileSelect}
            onError={handleFileError}
          />

          {previewUrl && selectedFile && (
            <ImagePreview
              fileName={selectedFile.name}
              imageUrl={previewUrl}
              isLoading={isLoading}
              onChange={openFilePicker}
              onDelete={handleFileDelete}
            />
          )}

          {error && (
            <p className="form-error" role="alert">
              <span aria-hidden="true">!</span>
              {error}
            </p>
          )}

          <DetectButton
            hasFile={Boolean(selectedFile)}
            isLoading={isLoading}
            onClick={handleDetect}
          />
        </div>
      </section>

      {result && (
        <ResultSection
          result={result}
          fallbackImageUrl={previewUrl}
          fileName={selectedFile?.name ?? '업로드 사진'}
        />
      )}
    </main>
  )
}

export default Home
