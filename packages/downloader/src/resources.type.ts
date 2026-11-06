import JSZip from "jszip"

export interface ResourceHandler {
  url: URL
  states: {
    name: string
    percentage: number
  }[]
  currentStateIndex: number
  zipFile: JSZip

  execute(): Promise<JSZip>
}