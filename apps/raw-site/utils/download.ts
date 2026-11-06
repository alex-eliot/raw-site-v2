import JSZip from "jszip"
import { nanoid } from "nanoid"

export async function downloadZipFile(zipFile: JSZip) {
  const zipBlob = await zipFile.generateAsync({ type: 'blob' })

  const url = URL.createObjectURL(zipBlob)

  const link = document.createElement('a')
  link.href = url
  link.download = `${nanoid(16)}.zip`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
