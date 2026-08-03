function ImagePreview({
  fileName,
  imageUrl,
  isLoading,
  onChange,
  onDelete,
}) {
  return (
    <section className="preview-card" aria-labelledby="preview-title">
      <div className="preview-card__header">
        <div>
          <p className="preview-card__label">선택한 사진</p>
          <h3 id="preview-title" title={fileName}>
            {fileName}
          </h3>
        </div>

        <div className="preview-card__actions">
          <button
            className="button button--secondary"
            type="button"
            disabled={isLoading}
            onClick={onChange}
          >
            사진 변경
          </button>
          <button
            className="button button--danger-ghost"
            type="button"
            disabled={isLoading}
            onClick={onDelete}
          >
            사진 삭제
          </button>
        </div>
      </div>

      <div className="preview-card__image-wrap">
        <img src={imageUrl} alt={`미리보기: ${fileName}`} />
      </div>
    </section>
  )
}

export default ImagePreview
