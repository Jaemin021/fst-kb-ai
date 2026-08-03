const STEPS = [
  {
    number: '01',
    title: '사진 업로드',
    description: '킥보드 이용자가 담긴 사진을 업로드해주세요.',
  },
  {
    number: '02',
    title: 'AI 분석',
    description: 'AI가 사진 속 이용자와 헬멧 착용 여부를 탐지합니다.',
  },
  {
    number: '03',
    title: '결과 확인',
    description: '탐지 인원, 착용 여부, 분석 신뢰도를 바로 확인하세요.',
  },
]

function ServiceIntroPage() {
  return (
    <main>
      <section className="page-hero">
        <p className="section-heading__eyebrow">SERVICE INTRO</p>
        <h1>왜 헬멧 확인이 중요할까요?</h1>
        <p>
          개인형 이동장치(PM) 이용이 늘어나면서 관련 사고도 함께 늘고
          있습니다. 그중 헬멧 미착용은 사고가 났을 때 부상 정도를 크게
          키우는 요인으로 꼽힙니다. First Penguin은 사진 한 장으로 헬멧
          착용 여부를 빠르게 확인해, 안전 점검을 더 쉽게 만들고자 합니다.
        </p>
      </section>

      <section className="intro-page" aria-labelledby="intro-steps-title">
        <div className="section-heading">
          <p className="section-heading__eyebrow">HOW IT WORKS</p>
          <h2 id="intro-steps-title">이용 흐름</h2>
        </div>

        <ol className="intro-steps">
          {STEPS.map((step) => (
            <li className="intro-step" key={step.number}>
              <span className="intro-step__number" aria-hidden="true">
                {step.number}
              </span>
              <strong>{step.title}</strong>
              <p>{step.description}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="purpose-section" aria-labelledby="purpose-title">
        <div className="purpose-card">
          <p className="section-heading__eyebrow">PUBLIC VALUE</p>
          <h2 id="purpose-title">안전을 넘어, 공익으로</h2>
          <p>
            저희는 이 서비스가 개인이 안전을 확인하는 용도를 넘어서,
            지자체나 관계 기관의 단속과 공익 목적의 공무 수행을 돕는
            도구로도 쓰이길 바랍니다. 헬멧 미착용처럼 위험한 상황을
            시민이 사진 한 장으로 손쉽게 신고하고 공유할 수 있는, 국민
            신문고와 비슷한 형태의 공익 신고 기능으로 확장하는 것이 저희
            팀의 장기적인 목표입니다.
          </p>
        </div>
      </section>
    </main>
  )
}

export default ServiceIntroPage
