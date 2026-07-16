import type { FitResult } from '../types';

/**
 * Fit an image inside the slide bounds preserving aspect ratio (letterbox/pillarbox
 * as needed), centered on both axes.
 */
export function fitImageWithinSlide(
  imageWidth: number,
  imageHeight: number,
  slideWidthEmu: number,
  slideHeightEmu: number,
): FitResult {
  const imageRatio = imageWidth / imageHeight;
  const slideRatio = slideWidthEmu / slideHeightEmu;

  let widthEmu: number;
  let heightEmu: number;

  if (imageRatio > slideRatio) {
    widthEmu = slideWidthEmu;
    heightEmu = Math.round(slideWidthEmu / imageRatio);
  } else {
    heightEmu = slideHeightEmu;
    widthEmu = Math.round(slideHeightEmu * imageRatio);
  }

  widthEmu = Math.min(widthEmu, slideWidthEmu);
  heightEmu = Math.min(heightEmu, slideHeightEmu);

  const offsetXEmu = Math.round((slideWidthEmu - widthEmu) / 2);
  const offsetYEmu = Math.round((slideHeightEmu - heightEmu) / 2);

  return { offsetXEmu, offsetYEmu, widthEmu, heightEmu };
}
