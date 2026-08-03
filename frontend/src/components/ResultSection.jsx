const RESULT_CARDS = [
  {
    key: 'total',
    label: '전체 탐지 인원',
    suffix: '명',
    tone: 'blue',
  },
  {
    key: 'helmet',
    label: '헬멧 착용',
    suffix: '명',
    tone: 'green',
  },
  {
    key: 'noHelmet',
    label: '헬멧 미착용',
    suffix: '명',
    tone: 'orange',
  },
  {
    key: 'confidence',
    label: '분석 신뢰도',
    suffix: '%',
    tone: 'cyan',
  },
]

function ResultSection({ result, fallbackImageUrl, fileName }) {
  const resultImageUrl = result.resultImageUrl || fallbackImageUrl

  return (
    <section
      className="result-section"
      aria-labelledby="result-title"
      aria-live="polite"
    >
      <div className="section-heading section-heading--left">
        <p className="section-heading__eyebrow">ANALYSIS RESULT</p>
        <h2 id="result-title">AI 분석 결과</h2>
        <p>현재는 화면 확인을 위한 임시 데이터가 표시됩니다.</p>
      </div>

      <div className="result-grid">
        {RESULT_CARDS.map((card) => (
          <article
            className={`result-card result-card--${card.tone}`}
            key={card.key}
          >
            <span>{card.label}</span>
            <strong>
              {result[card.key]}
              <small>{card.suffix}</small>
            </strong>
          </article>
        ))}
      </div>

      {result.noHelmet > 0 && (
        <div className="warning-message" role="alert">
          <span className="warning-message__icon" aria-hidden="true">
            !
          </span>
          <div>
            <strong>헬멧 미착용 이용자가 탐지되었습니다.</strong>
            <p>안전한 킥보드 이용을 위해 헬멧 착용을 안내해주세요.</p>
          </div>
        </div>
      )}

      <article className="result-image-card">
        <div className="result-image-card__header">
          <div>
            <p className="preview-card__label">결과 이미지</p>
            <h3>탐지 결과 미리보기</h3>
          </div>
          <span className="result-image-card__badge">AI 분석 결과 예시</span>
        </div>

        <div className="result-image-card__image-wrap">
          <img src={resultImageUrl} alt={`AI 분석 결과 예시: ${fileName}`} />
          <span>AI 분석 결과 예시</span>
        </div>
        <p className="result-image-card__caption">
          현재는 업로드한 원본 사진을 표시합니다. FastAPI 연결 후 탐지 결과
          이미지 URL로 교체됩니다.
        </p>
      </article>
    </section>
  )
}

export default ResultSection
