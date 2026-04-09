import type { Presentation, PresentationSlide } from '@/types/presentation'
import type { SceneItem } from '@/context/PresentationContext'
import { generateId } from '@/context/PresentationContext'

export function makePresentationSceneItem(
  presentation: Presentation,
  slide: PresentationSlide
): SceneItem {
  return {
    id: generateId(),
    type: 'slide',
    title: presentation.title,
    subtitle: `${slide.index + 1} / ${presentation.slideCount}`,
    content: slide.text ?? '',
    presentationId: presentation.id,
    presentationTitle: presentation.title,
    presentationFilePath: presentation.filePath,
    presentationFileType: presentation.fileType,
    presentationSlides: presentation.slides,
    navIndex: slide.index,
    thumbnailUrl: slide.thumbnailUrl
  }
}