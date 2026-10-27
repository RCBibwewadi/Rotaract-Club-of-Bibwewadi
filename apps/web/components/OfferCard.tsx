'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, X } from 'lucide-react';
import {
  motion, AnimatePresence, useMotionValue, useSpring, useTransform, useReducedMotion,
} from 'framer-motion';
import { useActiveRegistration } from '@/hooks/useActiveRegistration';
import { useAuthStore } from '@/lib/auth-store';

const DISMISS_KEY = 'rcb-offer-dismissed-';
const SPLASH_MS = 3200; // SplashScreen fades out at 3.1s; open after it is gone
const EASE = [0.16, 1, 0.3, 1] as const;

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

function isDismissed(formId: string) {
  try { return sessionStorage.getItem(DISMISS_KEY + formId) === '1'; } catch { return false; }
}

/** Home page modal advertising the active registration form, once per browser session. */
export default function OfferCard() {
  const form = useActiveRegistration();
  const token = useAuthStore(s => s.token);
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [imageOk, setImageOk] = useState(true);
  const closeRef = useRef<HTMLButtonElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Mouse parallax: pointer position in [-1, 1] drives tilt and layered drift.
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 60, damping: 18 });
  const springY = useSpring(mouseY, { stiffness: 60, damping: 18 });
  const glowX1 = useTransform(springX, [-1, 1], [40, -40]);
  const glowY1 = useTransform(springY, [-1, 1], [25, -25]);
  const glowX2 = useTransform(springX, [-1, 1], [-40, 40]);
  const glowY2 = useTransform(springY, [-1, 1], [-25, 25]);
  const imageX = useTransform(springX, [-1, 1], [-20, 20]);
  const imageY = useTransform(springY, [-1, 1], [-12, 12]);
  const badgeX = useTransform(springX, [-1, 1], [10, -10]);
  const badgeY = useTransform(springY, [-1, 1], [6, -6]);
  const titleX = useTransform(springX, [-1, 1], [6, -6]);
  const priceX = useTransform(springX, [-1, 1], [-8, 8]);
  const rotateX = useTransform(springY, [-1, 1], [-5, 5]);
  const rotateY = useTransform(springX, [-1, 1], [7, -7]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect || reduceMotion) return;
    mouseX.set(Math.max(-1, Math.min(1, (e.clientX - rect.left - rect.width / 2) / (rect.width / 2))));
    mouseY.set(Math.max(-1, Math.min(1, (e.clientY - rect.top - rect.height / 2) / (rect.height / 2))));
  }, [mouseX, mouseY, reduceMotion]);

  const onMouseLeave = useCallback(() => { mouseX.set(0); mouseY.set(0); }, [mouseX, mouseY]);

  const dismiss = () => {
    try { if (form) sessionStorage.setItem(DISMISS_KEY + form.form_id, '1'); } catch { /* private mode */ }
    setOpen(false);
  };

  useEffect(() => {
    if (!form || isDismissed(form.form_id)) return;
    const t = setTimeout(() => setOpen(true), Math.max(0, SPLASH_MS - performance.now()));
    return () => clearTimeout(t);
  }, [form]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') dismiss(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!form) return null;

  const register = () => {
    dismiss();
    router.push(form.auth_required && !token ? '/login?next=%2Fregister' : '/register');
  };

  const amount = form.payment_enabled ? form.payment_amount : null;
  const original = amount ? form.payment_original_amount : null;
  const discountPct = amount && original && original > amount ? Math.round((1 - amount / original) * 100) : 0;
  const hasImage = !!form.image_url && imageOk;
  const m = !reduceMotion; // motion allowed

  const stagger = (i: number) => (m ? {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: 0.15 + i * 0.08, duration: 0.5, ease: EASE },
  } : {});

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onMouseMove={onMouseMove}
          onMouseLeave={onMouseLeave}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={dismiss} aria-hidden />

          {/* Glow blobs drifting against the pointer */}
          <motion.div
            aria-hidden
            className="absolute w-[500px] h-[400px] max-w-full rounded-full pointer-events-none bg-accent/30 blur-[120px]"
            style={m ? { x: glowX1, y: glowY1 } : undefined}
          />
          <motion.div
            aria-hidden
            className="absolute w-[500px] h-[400px] max-w-full rounded-full pointer-events-none bg-warm/25 blur-[120px]"
            style={m ? { x: glowX2, y: glowY2 } : undefined}
          />

          <motion.div
            ref={cardRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="offer-card-title"
            className={`relative w-full ${hasImage ? 'max-w-4xl' : 'max-w-md'} max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain rounded-3xl shadow-2xl`}
            style={m ? { rotateX, rotateY, transformPerspective: 1000 } : undefined}
            initial={m ? { scale: 0.85, y: 40, opacity: 0 } : false}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={m ? { scale: 0.9, y: 20, opacity: 0 } : { opacity: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            {/* Close: on the card corner so it stays visible over the image on mobile */}
            <button
              ref={closeRef}
              onClick={dismiss}
              aria-label="Close offer"
              className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 w-10 h-10 rounded-full flex items-center justify-center bg-black/45 text-white backdrop-blur-md hover:bg-black/65 transition-colors"
            >
              <X size={18} />
            </button>

            <div className={`grid grid-cols-1 ${hasImage ? 'md:grid-cols-2' : ''}`}>
              {hasImage && (
                <div className="relative overflow-hidden h-52 sm:h-72 md:h-auto md:min-h-[480px]">
                  <motion.img
                    src={form.image_url!}
                    alt=""
                    onError={() => setImageOk(false)}
                    className="absolute inset-0 w-full h-full object-cover"
                    style={m ? { x: imageX, y: imageY, scale: 1.12 } : undefined}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />

                  {discountPct > 0 && (
                    <motion.div
                      className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10"
                      style={m ? { x: badgeX, y: badgeY } : undefined}
                      initial={m ? { scale: 0, rotate: -20 } : false}
                      animate={{ scale: 1, rotate: -8 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.3 }}
                    >
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-warm text-dark flex flex-col items-center justify-center shadow-lg">
                        <span className="text-[8px] sm:text-[9px] font-black uppercase leading-none tracking-wide">Save</span>
                        <span className="text-xl sm:text-2xl font-black leading-none">{discountPct}%</span>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              <div className="relative bg-light dark:bg-dark-card p-6 pt-8 sm:p-8 md:p-10 flex flex-col justify-center">
                <motion.div {...stagger(0)} className="mb-4 sm:mb-5">
                  <span className="inline-flex items-center gap-2 rounded-full border border-dark/15 dark:border-white/15 bg-dark/5 dark:bg-white/5 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-dark dark:text-white">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-75 motion-safe:animate-ping" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
                    </span>
                    Registrations open
                  </span>
                </motion.div>

                <motion.div style={m ? { x: titleX } : undefined} {...stagger(1)}>
                  <h2 id="offer-card-title" className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-[1] text-dark dark:text-white pr-8 md:pr-0">
                    {form.offer_title}
                  </h2>
                </motion.div>

                {form.offer_description && (
                  <motion.p {...stagger(2)} className="mt-4 text-sm leading-relaxed text-dark/65 dark:text-white/65 whitespace-pre-line">
                    {form.offer_description}
                  </motion.p>
                )}

                {amount && (
                  <motion.div style={m ? { x: priceX } : undefined} {...stagger(3)} className="mt-5 flex items-center gap-3 flex-wrap">
                    <span className="font-display text-3xl font-bold text-dark dark:text-white">{inr(amount)}</span>
                  </motion.div>
                )}

                <motion.div {...stagger(4)} className="mt-6">
                  <motion.button
                    onClick={register}
                    className="group/cta relative w-full overflow-hidden rounded-2xl bg-accent hover:bg-accent-light text-white font-bold text-sm uppercase tracking-[0.18em] py-4 px-8 flex items-center justify-center gap-2 transition-colors"
                    whileHover={m ? { scale: 1.03 } : undefined}
                    whileTap={m ? { scale: 0.97 } : undefined}
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      Register Now <ArrowRight size={16} className="group-hover/cta:translate-x-1 transition-transform" />
                    </span>
                    <span
                      aria-hidden
                      className="absolute inset-0 -translate-x-full motion-safe:group-hover/cta:translate-x-full transition-transform duration-700 ease-in-out bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    />
                  </motion.button>
                </motion.div>

                {form.auth_required && !token && (
                  <motion.p {...stagger(5)} className="mt-3 text-[11px] text-center text-dark/40 dark:text-white/40">
                    Members only · you&apos;ll be asked to log in
                  </motion.p>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
