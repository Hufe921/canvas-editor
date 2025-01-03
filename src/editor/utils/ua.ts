export const isApple =
  typeof navigator !== 'undefined' && /Mac OS X/.test(navigator.userAgent)

export const isIOS =
  typeof navigator !== 'undefined' && /iPad|iPhone/.test(navigator.userAgent)

export const isMobile =
  /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  )
