export async function detectHelmet(imageFile) {
  if (!imageFile) {
    throw new Error('분석할 이미지가 필요합니다.')
  }

  const formData = new FormData()
  formData.append('file', imageFile)

  // 브라우저가 multipart boundary를 자동으로 추가하므로 Content-Type은 직접 지정하지 않습니다.
  const response = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}/detect`,
    {
      method: 'POST',
      body: formData,
    },
  )

  if (!response.ok) {
    throw new Error('이미지 분석에 실패했습니다.')
  }

  return response.json()
}
