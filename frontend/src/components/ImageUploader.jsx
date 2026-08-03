import { useState } from 'react'

function ImageIcon() {
  return (
    <svg
      aria-hidden="true"
      className="upload-box__icon"
      viewBox="0 0 48 48"
      fill="none"
    >
      <rect
        x="6"
        y="8"
        width="36"
        height="32"
        rx="5"
        stroke="currentColor"
        strokeWidth="2.5"
      />
      <circle cx="17" cy="19" r="4" fill="currentColor" opacity=".5" />
      <path
        d="m10 35 9-9 6 6 5-5 8 8"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M24 4v10m-4-4 4 4 4-4"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ImageUploader({ inputRef, isLoading, onFileSelect, onError }) {
  const [isDragging, setIsDragging] = useState(false)

  const openFilePicker = () => {
    if (!isLoading) inputRef.current?.click()
  }

  const handleFiles = (files) => {
    if (!files?.length) return

    if (files.length > 1) {
      onError('사진은 한 번에 한 장만 선택할 수 있습니다.')
      return
    }

    onFileSelect(files[0])
  }

  const handleInputChange = (event) => {
    handleFiles(event.target.files)
    event.target.value = ''
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setIsDragging(false)
    if (!isLoading) handleFiles(event.dataTransfer.files)
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      openFilePicker()
    }
  }

  return (
    <div
      className={[
        'upload-box',
        isDragging ? 'upload-box--dragging' : '',
        isLoading ? 'upload-box--disabled' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      role="button"
      tabIndex={isLoading ? -1 : 0}
      aria-disabled={isLoading}
      onClick={openFilePicker}
      onKeyDown={handleKeyDown}
      onDragEnter={(event) => {
        event.preventDefault()
        if (!isLoading) setIsDragging(true)
      }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsDragging(false)
        }
      }}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        className="visually-hidden"
        type="file"
        accept=".jpg,.jpeg,.png,image/jpeg,image/png"
        disabled={isLoading}
        onChange={handleInputChange}
      />

      <span className="upload-box__icon-wrap">
        <ImageIcon />
      </span>
      <strong>분석할 사진을 업로드해주세요.</strong>
      <span>사진을 끌어다 놓거나 이 영역을 클릭하세요.</span>
      <small>JPG, JPEG, PNG · 최대 10MB</small>
    </div>
  )
}

export default ImageUploader
