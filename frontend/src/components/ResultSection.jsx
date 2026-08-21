const RESULT_CARDS = [
  {
    key: 'total',
    label: '전체 탐지 객체',
    suffix: '건',
    tone: 'blue',
  },
  {
    key: 'noHelmet',
    label: '안전모 미착용',
    suffix: '건',
    tone: 'orange',
  },
  {
    key: 'multiRiding',
    label: '다인 탑승',
    suffix: '건',
    tone: 'green',
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
        <p>
          업로드한 이미지를 AI 모델이 분석한 결과입니다.
        </p>
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
            <strong>안전모 미착용 객체가 탐지되었습니다.</strong>
            <p>
              전동 킥보드 이용 시 안전모 착용이 필요합니다.
            </p>
          </div>
        </div>
      )}

      {result.multiRiding > 0 && (
        <div className="warning-message" role="alert">
          <span className="warning-message__icon" aria-hidden="true">
            !
          </span>
          <div>
            <strong>다인 탑승 객체가 탐지되었습니다.</strong>
            <p>
              전동 킥보드의 안전한 단독 탑승이 필요합니다.
            </p>
          </div>
        </div>
      )}

      <article className="result-image-card">
        <div className="result-image-card__header">
          <div>
            <p className="preview-card__label">결과 이미지</p>
            <h3>탐지 결과 미리보기</h3>
          </div>
          <span className="result-image-card__badge">
            YOLO AI 분석
          </span>
        </div>

        <div className="result-image-card__image-wrap">
          <img
            src={resultImageUrl}
            alt={`AI 탐지 결과: ${fileName}`}
          />
          <span>AI 탐지 결과</span>
        </div>

        <p className="result-image-card__caption">
          탐지된 객체의 위치와 AI 모델의 예측 클래스를
          바운딩 박스로 표시합니다.
        </p>
      </article>
    </section>
  )
}

export default ResultSection
