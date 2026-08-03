import LoadingSpinner from './LoadingSpinner'

function DetectButton({ hasFile, isLoading, onClick }) {
  return (
    <button
      className={`detect-button ${!hasFile ? 'detect-button--inactive' : ''}`}
      type="button"
      disabled={isLoading}
      aria-disabled={!hasFile || isLoading}
      aria-busy={isLoading}
      onClick={onClick}
    >
      {isLoading ? (
        <>
          <LoadingSpinner />
          AI 분석 중...
        </>
      ) : (
        <>
          <span aria-hidden="true">✦</span>
          헬멧 착용 여부 탐지
        </>
      )}
    </button>
  )
}

export default DetectButton
