'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { X, CloudUpload, Loader2, Check, User, Gamepad2 } from 'lucide-react';
import Image from 'next/image';
import { useAuthStore } from '@/lib/auth-store';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface Props {
  open: boolean;
  onClose: () => void;
}

function useDelayedBool(value: boolean, delayMs: number) {
  const [delayed, setDelayed] = useState(value);
  useEffect(() => {
    if (value) {
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => setDelayed(true));
      });
      return () => cancelAnimationFrame(raf);
    } else {
      const timer = setTimeout(() => setDelayed(false), delayMs);
      return () => clearTimeout(timer);
    }
  }, [value, delayMs]);
  return value ? value : delayed;
}

export default function ReelTheVibeRegisterModal({ open, onClose }: Props) {
  const { member, token } = useAuthStore();
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const mousePos = useRef({ x: 0.5, y: 0.5 });
  const rafRef = useRef<number>(0);

  // Keep mounted during close animation (400ms after open becomes false)
  const shouldRender = useDelayedBool(open, 400);

  // Check registration status
  useEffect(() => {
    if (!open || !token) return;
    fetch('/api/reel-the-vibe/register', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => {
        if (d.data?.registered) setAlreadyRegistered(true);
      })
      .catch(() => {});
  }, [open, token]);

  // Cleanup preview URL
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  // Animate in: trigger CSS transition one frame after mount
  useEffect(() => {
    if (!open) return;
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => setAnimateIn(true));
    });
    return () => {
      cancelAnimationFrame(raf);
      setAnimateIn(false);
    };
  }, [open]);

  // Body scroll lock
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Parallax cursor tracking
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!modalRef.current) return;
    const rect = modalRef.current.getBoundingClientRect();
    mousePos.current = {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    };

    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      if (!modalRef.current) return;
      const rx = (mousePos.current.y - 0.5) * -2;
      const ry = (mousePos.current.x - 0.5) * 2;
      modalRef.current.style.transform = `perspective(1200px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1)`;

      const shine = modalRef.current.querySelector('[data-shine]') as HTMLElement;
      if (shine) {
        shine.style.background = `radial-gradient(600px circle at ${mousePos.current.x * 100}% ${mousePos.current.y * 100}%, rgba(200,154,114,0.06), transparent 50%)`;
      }
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (!modalRef.current) return;
    modalRef.current.style.transform = 'perspective(1200px) rotateX(0deg) rotateY(0deg) scale(1)';
    const shine = modalRef.current.querySelector('[data-shine]') as HTMLElement;
    if (shine) shine.style.background = 'transparent';
  }, []);

  const handleFile = (file: File) => {
    setError(null);
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Only JPG, PNG, or WebP images allowed');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('Image must be under 5MB');
      return;
    }
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleSubmit = async () => {
    if (!photo || !token) return;
    setSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('photo', photo);

      const res = await fetch('/api/reel-the-vibe/register', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Registration failed');
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setPhoto(null);
        setPreview(null);
      }, 2000);
    } catch {
      setError('Network error. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!shouldRender) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Photographic backdrop */}
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{ opacity: animateIn ? 1 : 0 }}
      >
        <Image
          src="/backdrop.jpg"
          alt=""
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* Click-to-close overlay */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal */}
      <div
        ref={modalRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative w-full transition-all duration-[400ms] ease-out"
        style={{
          maxWidth: '520px',
          opacity: animateIn ? 1 : 0,
          transform: animateIn
            ? 'perspective(1200px) rotateX(0deg) rotateY(0deg) scale(1)'
            : 'perspective(1200px) rotateX(0deg) rotateY(0deg) scale(0.96) translateY(10px)',
          willChange: 'transform, opacity',
        }}
      >
        {/* Modal surface */}
        <div
          className="relative rounded-[18px] overflow-hidden"
          style={{
            background: 'linear-gradient(170deg, #15120E 0%, #0B0A08 60%, #100E0A 100%)',
            boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 1px rgba(185,130,85,0.15), inset 0 1px 0 rgba(232,223,210,0.04)',
            border: '1px solid rgba(90,81,70,0.25)',
          }}
        >
          {/* Grain texture overlay */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            }}
          />

          {/* Warm ambient glow - top right */}
          <div
            className="absolute -top-20 -right-20 w-64 h-64 pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(200,154,114,0.08) 0%, transparent 70%)',
            }}
          />

          {/* Cursor-following shine */}
          <div data-shine className="absolute inset-0 pointer-events-none transition-[background] duration-200" />

          {/* Content */}
          <div className="relative p-7 sm:p-9">
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-5 right-5 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200"
              style={{
                color: '#A9A095',
                background: 'transparent',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(169,160,149,0.1)';
                e.currentTarget.style.color = '#E8DFD2';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#A9A095';
              }}
            >
              <X size={18} strokeWidth={1.5} />
            </button>

            {/* Header */}
            <div className="text-center mb-7">
              <span
                className="text-[11px] uppercase tracking-[3.5px] font-medium"
                style={{ color: '#B98255' }}
              >
                Reel the Vibe
              </span>
              <div
                className="w-10 h-px mx-auto mt-3 mb-4"
                style={{ background: 'linear-gradient(to right, transparent, #B98255, transparent)' }}
              />
              <h2
                className="text-[28px] sm:text-[32px] font-display font-medium"
                style={{ color: '#E8DFD2' }}
              >
                Register
              </h2>
            </div>

            {alreadyRegistered ? (
              <div className="text-center py-10">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                  style={{ background: 'rgba(185,130,85,0.12)', border: '1px solid rgba(185,130,85,0.2)' }}
                >
                  <Check size={28} style={{ color: '#B98255' }} />
                </div>
                <p className="text-lg font-display" style={{ color: '#E8DFD2' }}>
                  You&apos;re already in the game!
                </p>
                <p className="text-sm mt-2" style={{ color: '#A9A095' }}>
                  Stay tuned for team assignments.
                </p>
              </div>
            ) : success ? (
              <div className="text-center py-10">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                  style={{ background: 'rgba(185,130,85,0.12)', border: '1px solid rgba(185,130,85,0.2)' }}
                >
                  <Check size={28} style={{ color: '#B98255' }} />
                </div>
                <p className="text-xl font-display" style={{ color: '#E8DFD2' }}>
                  You&apos;re IN!
                </p>
              </div>
            ) : (
              <>
                {/* Name field */}
                <div className="mb-5">
                  <label
                    className="block text-[10px] uppercase tracking-[2px] mb-2.5 font-medium"
                    style={{ color: '#A9A095' }}
                  >
                    Name
                  </label>
                  <div
                    className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm transition-all duration-200"
                    style={{
                      background: 'rgba(11,10,8,0.6)',
                      border: '1px solid rgba(90,81,70,0.3)',
                      color: '#E8DFD2',
                    }}
                  >
                    <User size={16} strokeWidth={1.5} style={{ color: '#B98255', flexShrink: 0 }} />
                    {member?.full_name || '—'}
                  </div>
                </div>

                {/* Photo upload */}
                <div className="mb-6">
                  <label
                    className="block text-[10px] uppercase tracking-[2px] mb-2.5 font-medium"
                    style={{ color: '#A9A095' }}
                  >
                    Your Photo{' '}
                    <span style={{ color: 'rgba(169,160,149,0.5)' }}>(max. 5MB · JPG/PNG/WebP)</span>
                  </label>
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileRef.current?.click()}
                    className="relative rounded-xl overflow-hidden cursor-pointer transition-all duration-300"
                    style={{
                      aspectRatio: preview ? 'auto' : '4/3',
                      background: dragging ? 'rgba(185,130,85,0.06)' : 'rgba(11,10,8,0.5)',
                      border: `1.5px dashed ${dragging ? 'rgba(185,130,85,0.5)' : preview ? 'rgba(185,130,85,0.25)' : 'rgba(90,81,70,0.35)'}`,
                    }}
                  >
                    {preview ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={preview}
                        alt="Preview"
                        className="w-full object-cover rounded-xl"
                        style={{ maxHeight: '240px' }}
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5">
                        <CloudUpload size={30} strokeWidth={1.2} style={{ color: '#B98255' }} />
                        <span className="text-sm" style={{ color: '#E8DFD2' }}>
                          Drop or tap to upload
                        </span>
                        <span className="text-xs" style={{ color: 'rgba(169,160,149,0.5)' }}>
                          JPG, PNG, WebP · Max 5MB
                        </span>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFile(file);
                    }}
                  />
                </div>

                {/* Error */}
                {error && (
                  <p className="text-sm text-center mb-4" style={{ color: '#D4836A' }}>
                    {error}
                  </p>
                )}

                {/* CTA */}
                <button
                  onClick={handleSubmit}
                  disabled={!photo || submitting}
                  className="w-full py-4 rounded-xl text-base tracking-wide font-display flex items-center justify-center gap-2.5 transition-all duration-300"
                  style={{
                    background: photo && !submitting
                      ? 'linear-gradient(135deg, #1A1611 0%, #2A2118 50%, #1E1A14 100%)'
                      : 'rgba(21,18,14,0.5)',
                    border: photo && !submitting
                      ? '1px solid rgba(185,130,85,0.35)'
                      : '1px solid rgba(90,81,70,0.15)',
                    color: photo && !submitting ? '#E8DFD2' : 'rgba(169,160,149,0.3)',
                    cursor: photo && !submitting ? 'pointer' : 'not-allowed',
                    boxShadow: photo && !submitting
                      ? '0 4px 20px rgba(185,130,85,0.08)'
                      : 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!photo || submitting) return;
                    e.currentTarget.style.boxShadow = '0 6px 28px rgba(185,130,85,0.15)';
                    e.currentTarget.style.borderColor = 'rgba(185,130,85,0.5)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    if (!photo || submitting) return;
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(185,130,85,0.08)';
                    e.currentTarget.style.borderColor = 'rgba(185,130,85,0.35)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {submitting ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>
                      <Gamepad2 size={18} strokeWidth={1.5} style={{ color: '#B98255' }} />
                      IN for the Game
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
