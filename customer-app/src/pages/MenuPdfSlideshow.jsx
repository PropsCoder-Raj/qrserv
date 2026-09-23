import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { HiOutlineChevronLeft, HiOutlineChevronRight, HiOutlineXMark } from 'react-icons/hi2';
import api from '../services/api';
import restaurantService from '../services/restaurantService';

// pdfjs-dist (no PDF viewer UI) -> we render each page to a canvas and convert to image data URLs.
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist/legacy/build/pdf";
import workerSrc from "pdfjs-dist/legacy/build/pdf.worker.min.mjs?url";

GlobalWorkerOptions.workerSrc = workerSrc;

const getPdfUrl = (menuPdf) => {
  if (!menuPdf) return '';
  if (/^https?:\/\//i.test(menuPdf)) return menuPdf;

  const apiBaseUrl = api.defaults.baseURL || import.meta.env.VITE_API_URL || '/api';
  const apiUrl = new URL(apiBaseUrl, window.location.origin);

  return new URL(menuPdf, apiUrl.origin).toString();
};

const isPdfBuffer = (buffer) => {
  const signature = new TextDecoder('ascii').decode(buffer.slice(0, 5));
  return signature === '%PDF-';
};

export default function MenuPdfSlideshow() {
  const { restaurantId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [images, setImages] = useState([]);
  const [index, setIndex] = useState(0);

  const canPrev = index > 0;
  const canNext = index < images.length - 1;

  const title = useMemo(() => {
    if (images.length === 0) return 'Menu';
    return `Menu (${index + 1}/${images.length})`;
  }, [images.length, index]);

  useEffect(() => {
    let cancelled = false;

    const renderPdfToImages = async () => {
      setLoading(true);
      setImages([]);
      setIndex(0);

      try {
        const res = await restaurantService.getPublicInfo(restaurantId);
        const info = res?.data?.data;
        const menuPdf = info?.menuPdf;

        if (!info?.isMenuPdfEnabled) {
          toast.error('Menu PDF is not enabled for this restaurant plan');
          navigate(`/restaurant/${restaurantId}`, { replace: true });
          return;
        }

        if (!info?.hasMenuPdf || !info?.canShowMenuPdf || !menuPdf) {
          toast.error('Menu PDF not available for this restaurant');
          navigate(`/restaurant/${restaurantId}`, { replace: true });
          return;
        }

        // Fetch as ArrayBuffer so the browser PDF viewer is bypassed.
        const pdfUrl = getPdfUrl(menuPdf);
        const pdfRes = await fetch(pdfUrl, {
          headers: {
            Accept: 'application/pdf',
          },
        });
        if (!pdfRes.ok) {
          throw new Error('Failed to download PDF');
        }

        const data = await pdfRes.arrayBuffer();
        const contentType = pdfRes.headers.get('content-type') || '';

        if (!contentType.toLowerCase().includes('pdf') && !isPdfBuffer(data)) {
          throw new Error('Menu PDF URL returned invalid file data');
        }

        const task = getDocument({ data });
        const pdf = await task.promise;

        const rendered = [];
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
          const page = await pdf.getPage(pageNum);
          // Mobile-friendly scaling; adjust if you want higher quality.
          const viewport = page.getViewport({ scale: 2 });

          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          await page.render({ canvasContext: ctx, viewport }).promise;
          rendered.push(canvas.toDataURL('image/png'));

          if (cancelled) return;
        }

        if (!cancelled) {
          setImages(rendered);
        }
      } catch (e) {
        if (!cancelled) {
          toast.error(e?.message || 'Failed to load menu PDF');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    renderPdfToImages();
    return () => {
      cancelled = true;
    };
  }, [restaurantId, navigate]);

  const prev = () => setIndex((i) => Math.max(0, i - 1));
  const next = () => setIndex((i) => Math.min(images.length - 1, i + 1));

  // Swipe support (mobile): swipe left -> next, swipe right -> prev
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchStartY, setTouchStartY] = useState(null);

  const onTouchStart = (e) => {
    const t = e.touches?.[0];
    if (!t) return;
    setTouchStartX(t.clientX);
    setTouchStartY(t.clientY);
  };

  const onTouchEnd = (e) => {
    const t = e.changedTouches?.[0];
    if (!t || touchStartX == null || touchStartY == null) return;

    const dx = t.clientX - touchStartX;
    const dy = t.clientY - touchStartY;

    // If vertical movement is bigger, ignore (allow scroll)
    if (Math.abs(dy) > Math.abs(dx)) {
      setTouchStartX(null);
      setTouchStartY(null);
      return;
    }

    const threshold = 60; // px
    if (dx <= -threshold) next();
    if (dx >= threshold) prev();

    setTouchStartX(null);
    setTouchStartY(null);
  };

  return (
    <div className="fixed inset-0 bg-slate-950 text-white">
      {/* Fixed header */}
      <div className="fixed left-0 right-0 top-0 z-20 border-b border-white/10 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div className="text-sm font-semibold">{title}</div>
          {/* <button
            onClick={() => {
              window.close();
            }}
            className="rounded-lg p-2 text-white/80 hover:bg-white/10"
            title="Close"
          >
            <HiOutlineXMark size={20} />
          </button> */}
        </div>
      </div>

      {/* Content area (fixed/absolute so the slide stays centered) */}
      <div className="absolute inset-0 mx-auto max-w-3xl px-4 pt-16 pb-20">
        {loading && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center text-sm text-white/70">
            Loading menu...
          </div>
        )}

        {!loading && images.length === 0 && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center text-sm text-white/70">
            No pages to show.
          </div>
        )}

        {!loading && images.length > 0 && (
          <div className="space-y-4">
            <div
              className="flex h-[calc(100vh-10.5rem)] items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-black"
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            >
              <img
                src={images[index]}
                alt={`Page ${index + 1}`}
                className="max-h-full w-auto max-w-full select-none object-contain"
                draggable={false}
              />
            </div>
          </div>
        )}
      </div>

      {/* Fixed navigation */}
      {!loading && images.length > 0 && (
        <div className="fixed bottom-4 left-0 right-0 z-20">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-4">
            <button
              onClick={prev}
              disabled={!canPrev}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${
                canPrev ? 'bg-white/10 hover:bg-white/15' : 'bg-white/5 text-white/30'
              }`}
            >
              <HiOutlineChevronLeft size={18} /> Prev
            </button>

            <button
              onClick={next}
              disabled={!canNext}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${
                canNext ? 'bg-white/10 hover:bg-white/15' : 'bg-white/5 text-white/30'
              }`}
            >
              Next <HiOutlineChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
