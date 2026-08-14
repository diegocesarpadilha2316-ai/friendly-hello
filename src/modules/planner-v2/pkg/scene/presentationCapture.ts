import { useEffect, useState } from "react";

export const PRESENTATION_CAPTURE_EVENT = "dioris:presentation-capture";

export type PresentationCaptureDetail = {
  active: boolean;
};

export function usePresentationCapture() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const onCapture = (event: Event) => {
      const detail = (event as CustomEvent<PresentationCaptureDetail>).detail;
      setActive(Boolean(detail?.active));
    };
    window.addEventListener(PRESENTATION_CAPTURE_EVENT, onCapture);
    return () => window.removeEventListener(PRESENTATION_CAPTURE_EVENT, onCapture);
  }, []);

  return active;
}

export function setPresentationCapture(active: boolean) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<PresentationCaptureDetail>(PRESENTATION_CAPTURE_EVENT, { detail: { active } }),
  );
}
