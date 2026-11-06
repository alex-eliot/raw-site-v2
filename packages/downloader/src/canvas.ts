export function canvasToBuffer(canvas: HTMLCanvasElement) {
  const dataUrl = canvas.toDataURL('image/jpeg', 1)
  const buffer = Uint8Array.from(
    atob(dataUrl.split(',')[1]),
    c => c.charCodeAt(0)
  )

  return buffer
}
