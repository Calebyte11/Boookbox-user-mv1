import React from "react";
import { Document, Page, pdfjs } from "react-pdf";
// Use Vite URL import so the worker comes from the installed pdfjs-dist version
// and gets the proper hashed URL at build time.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - Vite query import provides a string URL
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";


// Configure PDF.js worker for Vite using the resolved URL
try {
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc as string;
} catch {
  // no-op; react-pdf will warn if worker is missing
}

type PDFPreviewProps = {
  url: string;
  initialPage?: number;
  width?: number;
};

export default function PDFPreview({ url, initialPage = 1, width }: PDFPreviewProps) {
  const [numPages, setNumPages] = React.useState<number | null>(null);
  const [pageNumber, setPageNumber] = React.useState<number>(initialPage);
  const [error, setError] = React.useState<string | null>(null);

  const onLoadSuccess = React.useCallback((info: { numPages: number }) => {
    setNumPages(info.numPages);
    setError(null);
  }, []);

  const onLoadError = React.useCallback((err: unknown) => {
    // Provide a friendly message; fall back to opening in a new tab
    setError(
      err instanceof Error ? err.message : "Failed to load PDF preview."
    );
  }, []);

  const canPrev = pageNumber > 1;
  const canNext = numPages ? pageNumber < numPages : false;

  const viewportWidth = width ?? Math.min(900, typeof window !== "undefined" ? window.innerWidth - 48 : 600);

  return (
    <div className="flex flex-col gap-3">
      {error ? (
        <div className="text-sm text-red-600">
          {error} — You can still open the brochure in a new tab.
        </div>
      ) : null}
      <div className="rounded-md overflow-hidden border border-gray-200 bg-white">
        <Document file={url} onLoadSuccess={onLoadSuccess} onLoadError={onLoadError} loading={<div className="p-6 text-center text-sm">Loading preview…</div>}>
          <Page pageNumber={pageNumber} width={viewportWidth} renderMode="canvas" />
        </Document>
      </div>
      {numPages && numPages > 1 ? (
        <div className="flex items-center justify-between text-sm">
          <div>
            Page {pageNumber} of {numPages}
          </div>
          <div className="flex gap-2">
            <button
              className="px-3 py-1 rounded-md border bg-white disabled:opacity-50"
              onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
              disabled={!canPrev}
            >
              Prev
            </button>
            <button
              className="px-3 py-1 rounded-md border bg-white disabled:opacity-50"
              onClick={() => setPageNumber((p) => (numPages ? Math.min(numPages, p + 1) : p))}
              disabled={!canNext}
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
