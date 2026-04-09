export type PresentationFileType = 'pdf' | 'ppt' | 'pptx'

export interface PresentationSlide {
  id: string
  index: number
  title?: string
  text?: string
  thumbnailUrl?: string
}

export interface Presentation {
  id: string
  title: string
  fileName: string
  filePath: string
  fileType: PresentationFileType
  slideCount: number
  slides: PresentationSlide[]
  createdAt: string
  updatedAt: string
}