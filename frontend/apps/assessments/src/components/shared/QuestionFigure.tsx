import { sanitizeSvgMarkup } from "@/lib/svgMarkup";

type Props = {
  svgCode?: string | null;
  imageUrl?: string | null;
  alt: string;
  className?: string;
};

/** Inline SVG when present, otherwise the hosted image URL. */
export function QuestionFigure({ svgCode, imageUrl, alt, className }: Props) {
  const svg = sanitizeSvgMarkup(svgCode);
  if (svg) {
    return (
      <div
        className={className}
        role="img"
        aria-label={alt}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    );
  }
  if (imageUrl) {
    return <img src={imageUrl} alt={alt} className={className} />;
  }
  return null;
}
