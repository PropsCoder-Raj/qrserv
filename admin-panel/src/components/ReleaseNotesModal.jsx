import { useState, useEffect } from 'react';
import {
  HiSparkles,
  HiOutlineX,
  HiOutlineCheckCircle,
  HiOutlineFolder,
  HiOutlineBell,
  HiOutlineClipboardList,
  HiOutlineReceiptTax,
  HiOutlineChartBar,
  HiOutlineQrcode,
  HiOutlinePrinter,
} from 'react-icons/hi';
import {
  APP_VERSION,
  RELEASE_DATE,
  RELEASE_STORAGE_KEY,
  RELEASE_NOTES,
} from '../config/version';

const TAG_STYLES = {
  blue: {
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    iconBg: 'bg-blue-100 text-blue-600',
  },
  amber: {
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    iconBg: 'bg-amber-100 text-amber-600',
  },
  emerald: {
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    iconBg: 'bg-emerald-100 text-emerald-600',
  },
  purple: {
    badge: 'bg-purple-50 text-purple-700 border-purple-200',
    iconBg: 'bg-purple-100 text-purple-600',
  },
  indigo: {
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    iconBg: 'bg-indigo-100 text-indigo-600',
  },
  sky: {
    badge: 'bg-sky-50 text-sky-700 border-sky-200',
    iconBg: 'bg-sky-100 text-sky-600',
  },
  rose: {
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    iconBg: 'bg-rose-100 text-rose-600',
  },
};

function renderItemIcon(iconType) {
  const iconProps = { size: 20 };
  switch (iconType) {
    case 'folder':
      return <HiOutlineFolder {...iconProps} />;
    case 'bell':
      return <HiOutlineBell {...iconProps} />;
    case 'orders':
      return <HiOutlineClipboardList {...iconProps} />;
    case 'tax':
      return <HiOutlineReceiptTax {...iconProps} />;
    case 'chart':
      return <HiOutlineChartBar {...iconProps} />;
    case 'qrcode':
      return <HiOutlineQrcode {...iconProps} />;
    case 'printer':
      return <HiOutlinePrinter {...iconProps} />;
    default:
      return <HiSparkles {...iconProps} />;
  }
}

export default function ReleaseNotesModal({ isOpen: controlledOpen, onClose }) {
  const [internalOpen, setInternalOpen] = useState(false);

  // Check localStorage on mount to show once per system for this version
  useEffect(() => {
    try {
      const seen = localStorage.getItem(RELEASE_STORAGE_KEY);
      if (!seen) {
        setInternalOpen(true);
      }
    } catch {
      // In case localStorage is disabled
    }

    // Support opening the modal from anywhere via custom window event
    const handleOpenEvent = () => setInternalOpen(true);
    window.addEventListener('qrserv:open-release-notes', handleOpenEvent);
    return () => {
      window.removeEventListener('qrserv:open-release-notes', handleOpenEvent);
    };
  }, []);

  const isVisible = controlledOpen !== undefined ? controlledOpen : internalOpen;

  const handleDismiss = () => {
    try {
      localStorage.setItem(RELEASE_STORAGE_KEY, 'true');
    } catch {
      // ignore
    }
    setInternalOpen(false);
    if (onClose) onClose();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
      <div className="relative flex max-h-[92vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header with Dark Modern Theme */}
        <div className="relative border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-6 py-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400/20 text-amber-300 ring-1 ring-amber-400/30">
                <HiSparkles size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold tracking-tight text-white">What's New in QRServ</h2>
                  <span className="inline-flex items-center rounded-full bg-primary/30 px-2.5 py-0.5 text-xs font-semibold text-primary-200 border border-primary/40">
                    {APP_VERSION}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Released {RELEASE_DATE} &bull; Key operational updates, enhancements & bug fixes
                </p>
              </div>
            </div>

            <button
              onClick={handleDismiss}
              className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <HiOutlineX size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 bg-slate-50/50">
          <div className="rounded-xl border border-blue-200/60 bg-blue-50/50 p-3.5 text-xs text-blue-900 flex items-start gap-2.5">
            <HiSparkles size={18} className="text-blue-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Welcome to the <strong>{APP_VERSION}</strong> release! Below are the highlights of the newest features, workflow refinements, and performance upgrades activated in your system.
            </p>
          </div>

          <div className="space-y-3.5">
            {RELEASE_NOTES.map((note) => {
              const styles = TAG_STYLES[note.tagColor] || TAG_STYLES.blue;
              return (
                <div
                  key={note.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-start gap-3.5">
                    {/* Icon */}
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${styles.iconBg}`}
                    >
                      {renderItemIcon(note.icon)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span
                          className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ${styles.badge}`}
                        >
                          {note.tag}
                        </span>
                        <h3 className="text-sm font-bold text-slate-900">
                          {note.id}. {note.title}
                        </h3>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        {note.description}
                      </p>

                      {note.highlights && note.highlights.length > 0 && (
                        <ul className="mt-2.5 space-y-1.5 border-t border-slate-100 pt-2.5">
                          {note.highlights.map((highlight, idx) => (
                            <li
                              key={idx}
                              className="flex items-start gap-2 text-[11px] text-slate-700"
                            >
                              <HiOutlineCheckCircle
                                size={14}
                                className="shrink-0 text-emerald-500 mt-0.5"
                              />
                              <span className="leading-tight">{highlight}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 bg-white px-6 py-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Shown once per device. Re-open anytime via sidebar version {APP_VERSION}.</span>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-primary-dark transition cursor-pointer"
          >
            <span>Got it, Continue</span>
          </button>
        </div>

      </div>
    </div>
  );
}
