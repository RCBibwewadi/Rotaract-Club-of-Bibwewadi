'use client';

import { useState } from 'react';
import AnimatedSection from '@/components/AnimatedSection';

import Image from 'next/image';
import {
  Users, Award, Globe, Heart, Send, CheckCircle, ChevronRight, ChevronLeft,
  User, Mail, Lock, Phone, Briefcase, Building2, MapPin, GraduationCap, AlertCircle,
  IndianRupee, Upload, ArrowLeft,
} from 'lucide-react';

const benefits = [
  { icon: Users, title: 'Community', desc: 'Join 200+ passionate members who share your vision.' },
  { icon: Award, title: 'Leadership', desc: 'Develop real-world skills through project management.' },
  { icon: Globe, title: 'Network', desc: 'Connect with Rotaract clubs worldwide through RI.' },
  { icon: Heart, title: 'Impact', desc: 'Make tangible difference in your community every day.' },
];

const memberTypeOptions = [
  { value: 'business', label: 'Business Owner', desc: 'I run my own business', icon: Building2 },
  { value: 'professional', label: 'Professional', desc: 'I work in a profession', icon: Briefcase },
  { value: 'student', label: 'Student', desc: 'I am currently studying', icon: GraduationCap },
] as const;

type MemberTypeOption = typeof memberTypeOptions[number]['value'];



interface FormData {
  // Step 1: Account
  full_name: string;
  email: string;
  username: string;
  password: string;
  phone: string;
  dob: string;
  interests: string;
  // Step 2: Business
  business_name: string;
  industry: string;
  designation: string;
  business_description: string;
  website_url: string;
  business_city: string;
  // Step 3: Profession
  profession_type: string;
  specialisation: string;
  years_experience: string;
  employer: string;
  // Step: Student
  college_name: string;
  course: string;
  aspiration: string;
  // Payment
  payment_method: 'cash' | 'online' | '';
  payment_proof_url: string;
}

const initialFormData: FormData = {
  full_name: '', email: '', username: '', password: '', phone: '', dob: '',
  interests: '',
  business_name: '', industry: '', designation: '', business_description: '',
  website_url: '', business_city: '',
  profession_type: '', specialisation: '', years_experience: '', employer: '',
  college_name: '', course: '', aspiration: '',
  payment_method: '', payment_proof_url: '',
};

const inputClass =
  'w-full px-4 py-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-dark dark:text-white placeholder-dark/30 dark:placeholder-white/30 focus:border-accent focus:outline-none transition-colors';

const labelClass = 'block text-dark/60 dark:text-white/60 text-sm mb-1.5';

export default function JoinPage() {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [selectedTypes, setSelectedTypes] = useState<Set<MemberTypeOption>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showQR, setShowQR] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);

  const set = (key: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setFieldErrors(prev => ({ ...prev, [key]: '' }));
    setError('');
  };

  const toggleType = (type: MemberTypeOption) => {
    setSelectedTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
    setFieldErrors(prev => ({ ...prev, member_type: '' }));
    setError('');
  };

  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const blur = (key: keyof FormData) => {
    setTouched(prev => ({ ...prev, [key]: true }));
    validateField(key);
  };

  const validateField = (key: keyof FormData) => {
    let error = '';
    const v = formData[key];
    switch (key) {
      case 'full_name':
        if (!v.trim()) error = 'Name is required';
        else if (v.trim().length < 2) error = 'At least 2 characters';
        break;
      case 'email':
        if (!v.trim()) error = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) error = 'Invalid email';
        break;
      case 'username':
        if (!v.trim()) error = 'Username is required';
        else if (v.length < 3) error = 'At least 3 characters';
        else if (!/^[a-z0-9_]+$/.test(v)) error = 'Only lowercase, numbers, underscores';
        break;
      case 'password':
        if (!v) error = 'Password is required';
        else if (v.length < 8) error = 'At least 8 characters';
        break;
      case 'phone':
        if (!v.trim()) error = 'Phone is required';
        break;
      case 'business_name':
        if (!v.trim()) error = 'Business name is required';
        break;
      case 'profession_type':
        if (!v.trim()) error = 'Profession type is required';
        break;
      case 'college_name':
        if (!v.trim()) error = 'College name is required';
        break;
      case 'course':
        if (!v.trim()) error = 'Course is required';
        break;
    }
    setFieldErrors(prev => ({ ...prev, [key]: error }));
  };

  const handleProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingProof(true);
    setError('');
    try {
      const fd = new globalThis.FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload/payment-proof', { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok && data.data?.url) {
        set('payment_proof_url', data.data.url);
      } else {
        setError(data.message || 'Upload failed');
      }
    } catch {
      setError('Upload failed. Check your connection.');
    } finally {
      setUploadingProof(false);
    }
  };

  const needsBusiness = selectedTypes.has('business');
  const needsProfession = selectedTypes.has('professional');
  const needsStudent = selectedTypes.has('student');

  const getSteps = () => {
    const steps = ['Account'];
    if (needsBusiness) steps.push('Business');
    if (needsProfession) steps.push('Profession');
    if (needsStudent) steps.push('Student');
    steps.push('Review');
    return steps;
  };

  const steps = getSteps();
  const totalSteps = steps.length;

  const validateStep = (): boolean => {
    const errors: Record<string, string> = {};

    if (step === 0) {
      if (!formData.full_name.trim()) errors.full_name = 'Name is required';
      else if (formData.full_name.trim().length < 2) errors.full_name = 'At least 2 characters';
      if (!formData.email.trim()) errors.email = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Invalid email';
      if (!formData.username.trim()) errors.username = 'Username is required';
      else if (formData.username.length < 3) errors.username = 'At least 3 characters';
      else if (!/^[a-z0-9_]+$/.test(formData.username)) errors.username = 'Only lowercase, numbers, underscores';
      if (!formData.password) errors.password = 'Password is required';
      else if (formData.password.length < 8) errors.password = 'At least 8 characters';
      if (!formData.phone.trim()) errors.phone = 'Phone is required';
      if (selectedTypes.size === 0) errors.member_type = 'Please select at least one type';
    }

    const currentLabel = steps[step];
    if (currentLabel === 'Business') {
      if (!formData.business_name.trim()) errors.business_name = 'Business name is required';
    }
    if (currentLabel === 'Profession') {
      if (!formData.profession_type.trim()) errors.profession_type = 'Profession type is required';
    }
    if (currentLabel === 'Student') {
      if (!formData.college_name.trim()) errors.college_name = 'College name is required';
      if (!formData.course.trim()) errors.course = 'Course is required';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const next = () => {
    if (validateStep()) setStep(s => Math.min(s + 1, totalSteps - 1));
  };

  const prev = () => setStep(s => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');

    const payload: Record<string, unknown> = {
      full_name: formData.full_name.trim(),
      email: formData.email.trim(),
      username: formData.username.trim(),
      password: formData.password,
      member_type: Array.from(selectedTypes).join(','),
      phone: formData.phone.trim(),
      ...(formData.dob && { dob: formData.dob }),
      ...(formData.interests && { interests: formData.interests.trim() }),
      payment_method: formData.payment_method,
      ...(formData.payment_proof_url && { payment_proof_url: formData.payment_proof_url }),
      ...(needsStudent && formData.college_name && { college_name: formData.college_name.trim() }),
      ...(needsStudent && formData.course && { course: formData.course.trim() }),
      ...(needsStudent && formData.aspiration && { aspiration: formData.aspiration.trim() }),
    };

    if (needsBusiness && formData.business_name) {
      payload.business = {
        business_name: formData.business_name.trim(),
        ...(formData.industry && { industry: formData.industry.trim() }),
        ...(formData.designation && { designation: formData.designation.trim() }),
        ...(formData.business_description && { description: formData.business_description.trim() }),
        ...(formData.website_url && { website_url: formData.website_url.trim() }),
        ...(formData.business_city && { business_city: formData.business_city.trim() }),
      };
    }

    if (needsProfession && formData.profession_type) {
      payload.profession = {
        profession_type: formData.profession_type.trim(),
        ...(formData.specialisation && { specialisation: formData.specialisation.trim() }),
        ...(formData.years_experience && { years_experience: formData.years_experience.trim() }),
        ...(formData.employer && { employer: formData.employer.trim() }),
      };
    }

    try {
      const res = await fetch(`/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Registration failed. Please try again.');
        setSubmitting(false);
        return;
      }

      setSubmitted(true);
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const FieldError = ({ field }: { field: string }) =>
    fieldErrors[field] ? (
      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
        <AlertCircle size={12} /> {fieldErrors[field]}
      </p>
    ) : null;

  const renderAccountStep = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}><User size={14} className="inline mr-1" />Full Name *</label>
          <input type="text" value={formData.full_name} onChange={e => set('full_name', e.target.value)}
            onBlur={() => blur('full_name')} placeholder="John Doe" className={inputClass} />
          <FieldError field="full_name" />
        </div>
        <div>
          <label className={labelClass}><Mail size={14} className="inline mr-1" />Email *</label>
          <input type="email" value={formData.email} onChange={e => set('email', e.target.value)}
            onBlur={() => blur('email')} placeholder="john@example.com" className={inputClass} />
          <FieldError field="email" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}><User size={14} className="inline mr-1" />Username *</label>
          <input type="text" value={formData.username} onChange={e => set('username', e.target.value.toLowerCase())}
            onBlur={() => blur('username')} placeholder="john_doe" className={inputClass} />
          <FieldError field="username" />
        </div>
        <div>
          <label className={labelClass}><Lock size={14} className="inline mr-1" />Password *</label>
          <input type="password" value={formData.password} onChange={e => set('password', e.target.value)}
            onBlur={() => blur('password')} placeholder="Min 8 characters" className={inputClass} />
          <FieldError field="password" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}><Phone size={14} className="inline mr-1" />Phone *</label>
          <input type="tel" value={formData.phone} onChange={e => set('phone', e.target.value)}
            onBlur={() => blur('phone')} placeholder="+91 98765 43210" className={inputClass} />
          <FieldError field="phone" />
        </div>
        <div>
          <label className={labelClass}>Date of Birth</label>
          <input type="date" value={formData.dob} onChange={e => set('dob', e.target.value)}
            className={inputClass} />
        </div>
      </div>

      <div>
        <label className={labelClass}>Interests</label>
        <input type="text" value={formData.interests} onChange={e => set('interests', e.target.value)}
          placeholder="Community service, leadership, networking..." className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>I am a... * <span className="text-dark/30 dark:text-white/30 font-normal">(select all that apply)</span></label>
        <div className="grid grid-cols-3 gap-3 mt-1">
          {memberTypeOptions.map(t => {
            const active = selectedTypes.has(t.value);
            return (
              <button key={t.value} type="button"
                onClick={() => toggleType(t.value)}
                className={`p-4 rounded-xl border text-center transition-all duration-200 ${
                  active
                    ? 'border-accent bg-accent/10 ring-1 ring-accent'
                    : 'border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 hover:border-accent/50'
                }`}>
                <t.icon size={20} className={`mx-auto mb-1.5 ${active ? 'text-accent' : 'text-dark/40 dark:text-white/40'}`} />
                <p className="text-dark dark:text-white font-medium text-sm truncate">{t.label}</p>
                <p className="text-dark/40 dark:text-white/40 text-xs mt-0.5 truncate">{t.desc}</p>
              </button>
            );
          })}
        </div>
        <FieldError field="member_type" />
      </div>
    </div>
  );

  const renderBusinessStep = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Building2 size={20} className="text-accent" />
        <h4 className="text-dark dark:text-white font-semibold">Business Details</h4>
      </div>
      <div>
        <label className={labelClass}>Business Name *</label>
        <input type="text" value={formData.business_name} onChange={e => set('business_name', e.target.value)}
          onBlur={() => blur('business_name')} placeholder="Acme Corp" className={inputClass} />
        <FieldError field="business_name" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Industry</label>
          <input type="text" value={formData.industry} onChange={e => set('industry', e.target.value)}
            placeholder="Technology, Retail, etc." className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Your Designation</label>
          <input type="text" value={formData.designation} onChange={e => set('designation', e.target.value)}
            placeholder="CEO, Founder, etc." className={inputClass} />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}><MapPin size={14} className="inline mr-1" />Business City</label>
          <input type="text" value={formData.business_city} onChange={e => set('business_city', e.target.value)}
            placeholder="Pune" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}><Globe size={14} className="inline mr-1" />Website URL</label>
          <input type="url" value={formData.website_url} onChange={e => set('website_url', e.target.value)}
            placeholder="https://example.com" className={inputClass} />
        </div>
      </div>
      <div>
        <label className={labelClass}>Description <span className="text-dark/30 dark:text-white/30 font-normal">({formData.business_description.length}/250)</span></label>
        <textarea rows={3} value={formData.business_description}
          onChange={e => {
            if (e.target.value.length <= 250) set('business_description', e.target.value);
          }}
          maxLength={250}
          placeholder="Tell us about your business..." className={`${inputClass} resize-none`} />
      </div>
    </div>
  );

  const renderProfessionStep = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <GraduationCap size={20} className="text-accent" />
        <h4 className="text-dark dark:text-white font-semibold">Profession Details</h4>
      </div>
      <div>
        <label className={labelClass}>Profession Type *</label>
        <input type="text" value={formData.profession_type} onChange={e => set('profession_type', e.target.value)}
          onBlur={() => blur('profession_type')} placeholder="Software Engineer, Doctor, etc." className={inputClass} />
        <FieldError field="profession_type" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Specialisation</label>
          <input type="text" value={formData.specialisation} onChange={e => set('specialisation', e.target.value)}
            placeholder="Full-stack, Cardiology, etc." className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Years of Experience</label>
          <input type="text" value={formData.years_experience} onChange={e => set('years_experience', e.target.value)}
            placeholder="3 years" className={inputClass} />
        </div>
      </div>
      <div>
        <label className={labelClass}><Briefcase size={14} className="inline mr-1" />Employer / Company</label>
        <input type="text" value={formData.employer} onChange={e => set('employer', e.target.value)}
          placeholder="Company name" className={inputClass} />
      </div>
    </div>
  );

  const renderStudentStep = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <GraduationCap size={20} className="text-accent" />
        <h4 className="text-dark dark:text-white font-semibold">Student Details</h4>
      </div>
      <div>
        <label className={labelClass}>College / University Name *</label>
        <input type="text" value={formData.college_name} onChange={e => set('college_name', e.target.value)}
          onBlur={() => blur('college_name')} placeholder="e.g. MIT Pune" className={inputClass} />
        <FieldError field="college_name" />
      </div>
      <div>
        <label className={labelClass}>Course *</label>
        <input type="text" value={formData.course} onChange={e => set('course', e.target.value)}
          onBlur={() => blur('course')} placeholder="e.g. B.Tech Computer Science" className={inputClass} />
        <FieldError field="course" />
      </div>
      <div>
        <label className={labelClass}>What do you aspire to be?</label>
        <input type="text" value={formData.aspiration} onChange={e => set('aspiration', e.target.value)}
          placeholder="e.g. Software Architect, Entrepreneur..." className={inputClass} />
      </div>
    </div>
  );

  const renderReviewStep = () => {
    // If online selected and showing QR screen
    if (showQR) {
      return (
        <div className="space-y-5">
          <div className="text-center">
            <h4 className="text-dark dark:text-white font-semibold mb-1">Pay Online</h4>
            <p className="text-dark/50 dark:text-white/50 text-sm mb-4">Scan QR code to pay <span className="text-accent font-bold">&#8377;3,500</span></p>
            <div className="inline-block rounded-xl overflow-hidden border-2 border-accent/30 mb-4">
              <Image src="/QR.jpeg" alt="Payment QR Code" width={220} height={220} className="block" />
            </div>
          </div>

          {/* Upload proof */}
          <div>
            <label className={labelClass}><Upload size={14} className="inline mr-1" />Upload Payment Proof *</label>
            {formData.payment_proof_url ? (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                <CheckCircle size={16} className="text-green-500" />
                <span className="text-green-600 dark:text-green-400 text-sm flex-1">Proof uploaded</span>
                <button type="button" onClick={() => set('payment_proof_url', '')}
                  className="text-xs text-dark/40 dark:text-white/40 hover:text-red-400 transition-colors">Remove</button>
              </div>
            ) : (
              <label className={`${inputClass} cursor-pointer flex items-center gap-2 ${uploadingProof ? 'opacity-50' : ''}`}>
                <Upload size={14} className="text-dark/30 dark:text-white/30" />
                <span className="text-dark/30 dark:text-white/30 text-sm">
                  {uploadingProof ? 'Uploading...' : 'Choose screenshot / PDF'}
                </span>
                <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleProofUpload} disabled={uploadingProof} />
              </label>
            )}
          </div>

          {/* Back to payment options */}
          <button type="button" onClick={() => setShowQR(false)}
            className="flex items-center gap-1.5 text-sm text-dark/50 dark:text-white/50 hover:text-accent transition-colors">
            <ArrowLeft size={14} /> Back to payment options
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-5">
        {/* Payment Details */}
        <div>
          <h4 className="text-dark dark:text-white font-semibold mb-3 flex items-center gap-2">
            <IndianRupee size={16} className="text-accent" /> Payment Details
          </h4>
          <div className="p-4 rounded-xl bg-accent/5 border border-accent/20 mb-3">
            <div className="flex items-center justify-between">
              <span className="text-dark/60 dark:text-white/60 text-sm">Membership Fee</span>
              <span className="text-dark dark:text-white font-bold text-lg">&#8377;3,500</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => { set('payment_method', 'cash'); set('payment_proof_url', ''); setShowQR(false); }}
              className={`p-4 rounded-xl border text-center transition-all duration-200 ${
                formData.payment_method === 'cash'
                  ? 'border-accent bg-accent/10 ring-1 ring-accent'
                  : 'border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 hover:border-accent/50'
              }`}>
              <IndianRupee size={20} className="mx-auto mb-1 text-accent" />
              <p className="text-dark dark:text-white font-medium text-sm">Cash</p>
              <p className="text-dark/40 dark:text-white/40 text-xs">Pay in person</p>
            </button>
            <button type="button" onClick={() => { set('payment_method', 'online'); setShowQR(true); }}
              className={`p-4 rounded-xl border text-center transition-all duration-200 ${
                formData.payment_method === 'online'
                  ? 'border-accent bg-accent/10 ring-1 ring-accent'
                  : 'border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 hover:border-accent/50'
              }`}>
              <Upload size={20} className="mx-auto mb-1 text-accent" />
              <p className="text-dark dark:text-white font-medium text-sm">Online</p>
              <p className="text-dark/40 dark:text-white/40 text-xs">Pay via QR code</p>
            </button>
          </div>
          <FieldError field="payment_method" />
        </div>

        {/* Account Info */}
        <div className="pt-3 border-t border-black/10 dark:border-white/10">
          <h4 className="text-dark dark:text-white font-semibold mb-3 flex items-center gap-2">
            <User size={16} className="text-accent" /> Account Info
          </h4>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <ReviewItem label="Name" value={formData.full_name} />
            <ReviewItem label="Email" value={formData.email} />
            <ReviewItem label="Username" value={formData.username} />
            <ReviewItem label="Type" value={Array.from(selectedTypes).map(t => memberTypeOptions.find(o => o.value === t)?.label).filter(Boolean).join(', ')} />
            {formData.phone && <ReviewItem label="Phone" value={formData.phone} />}
            {formData.dob && <ReviewItem label="DOB" value={formData.dob} />}
            {formData.interests && <ReviewItem label="Interests" value={formData.interests} />}
          </div>
        </div>

        {needsBusiness && formData.business_name && (
          <div className="pt-3 border-t border-black/10 dark:border-white/10">
            <h4 className="text-dark dark:text-white font-semibold mb-3 flex items-center gap-2">
              <Building2 size={16} className="text-accent" /> Business
            </h4>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <ReviewItem label="Name" value={formData.business_name} />
              {formData.industry && <ReviewItem label="Industry" value={formData.industry} />}
              {formData.designation && <ReviewItem label="Designation" value={formData.designation} />}
              {formData.business_city && <ReviewItem label="City" value={formData.business_city} />}
            </div>
          </div>
        )}

        {needsStudent && formData.college_name && (
          <div className="pt-3 border-t border-black/10 dark:border-white/10">
            <h4 className="text-dark dark:text-white font-semibold mb-3 flex items-center gap-2">
              <GraduationCap size={16} className="text-accent" /> Student
            </h4>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <ReviewItem label="College" value={formData.college_name} />
              <ReviewItem label="Course" value={formData.course} />
              {formData.aspiration && <ReviewItem label="Aspiration" value={formData.aspiration} />}
            </div>
          </div>
        )}

        {needsProfession && formData.profession_type && (
          <div className="pt-3 border-t border-black/10 dark:border-white/10">
            <h4 className="text-dark dark:text-white font-semibold mb-3 flex items-center gap-2">
              <GraduationCap size={16} className="text-accent" /> Profession
            </h4>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <ReviewItem label="Type" value={formData.profession_type} />
              {formData.specialisation && <ReviewItem label="Specialisation" value={formData.specialisation} />}
              {formData.years_experience && <ReviewItem label="Experience" value={formData.years_experience} />}
              {formData.employer && <ReviewItem label="Employer" value={formData.employer} />}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCurrentStep = () => {
    const label = steps[step];
    if (label === 'Account') return renderAccountStep();
    if (label === 'Business') return renderBusinessStep();
    if (label === 'Profession') return renderProfessionStep();
    if (label === 'Student') return renderStudentStep();
    if (label === 'Review') return renderReviewStep();
    return null;
  };

  const isStepComplete = (): boolean => {
    if (step === 0) {
      if (!formData.full_name.trim()) return false;
      if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return false;
      if (!formData.username.trim() || formData.username.length < 3 || !/^[a-z0-9_]+$/.test(formData.username)) return false;
      if (!formData.password || formData.password.length < 8) return false;
      if (!formData.phone.trim()) return false;
      if (selectedTypes.size === 0) return false;
    }
    const currentLabel = steps[step];
    if (currentLabel === 'Business' && !formData.business_name.trim()) return false;
    if (currentLabel === 'Profession' && !formData.profession_type.trim()) return false;
    if (currentLabel === 'Student' && (!formData.college_name.trim() || !formData.course.trim())) return false;
    if (currentLabel === 'Review') {
      if (!formData.payment_method) return false;
      if (formData.payment_method === 'online' && !formData.payment_proof_url) return false;
    }
    if (Object.values(fieldErrors).some(e => e)) return false;
    return true;
  };

  const isLastStep = step === totalSteps - 1;

  return (
    <div className="min-h-screen transition-colors">
      {/* Hero */}
      <section data-rota="hero" className="min-h-[60vh] flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-transparent to-accent-light/10" />
        <div className="relative z-10 text-center px-6 max-w-4xl py-20">
          <AnimatedSection>
            <p className="text-accent font-semibold tracking-wider uppercase text-sm mb-4">
              Be Part of Something Big
            </p>
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl text-dark dark:text-white mb-6">
              <span className="gradient-text">Join Us</span>
            </h1>
            <p className="text-dark/60 dark:text-white/60 text-lg md:text-xl max-w-2xl mx-auto">
              Take the first step towards becoming a leader who serves.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Benefits + Form */}
      <section data-rota="benefits" className="px-6 md:px-12 lg:px-16 py-20">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Benefits */}
            <div>
              <AnimatedSection>
                <h2 className="font-display text-3xl md:text-5xl text-dark dark:text-white mb-8">
                  Why Join RCB?
                </h2>
              </AnimatedSection>
              <div className="space-y-4">
                {benefits.map((b, i) => (
                  <AnimatedSection key={i} delay={i * 100}>
                    <div className="flex gap-4 p-5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
                      <b.icon size={24} className="text-accent flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="text-dark dark:text-white font-semibold mb-1">{b.title}</h3>
                        <p className="text-dark/50 dark:text-white/50 text-sm">{b.desc}</p>
                      </div>
                    </div>
                  </AnimatedSection>
                ))}
              </div>
            </div>

            {/* Registration Form */}
            <AnimatedSection delay={200}>
              <div className="p-8 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
                {submitted ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <CheckCircle size={48} className="text-accent mb-4" />
                    <h3 className="text-dark dark:text-white text-2xl font-semibold mb-2">
                      Registration Successful!
                    </h3>
                    <p className="text-dark/60 dark:text-white/60 mb-4">
                      Your account is pending admin approval. You&apos;ll be able to log in once approved.
                    </p>
                    <p className="text-dark/40 dark:text-white/40 text-sm">
                      Welcome to the RCB family!
                    </p>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-dark dark:text-white text-xl font-semibold mb-1">
                      Membership Registration
                    </h3>
                    <p className="text-dark/40 dark:text-white/40 text-sm mb-5">
                      Step {step + 1} of {totalSteps}: {steps[step]}
                    </p>

                    {/* Step indicators */}
                    <div className="flex gap-2 mb-6">
                      {steps.map((_, i) => (
                        <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                          i <= step ? 'bg-accent' : 'bg-black/10 dark:bg-white/10'
                        }`} />
                      ))}
                    </div>

                    {error && (
                      <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center gap-2">
                        <AlertCircle size={16} /> {error}
                      </div>
                    )}

                    {renderCurrentStep()}

                    {/* Navigation buttons — hidden on QR view (has its own back button) */}
                    {!showQR && (
                      <div className="flex gap-3 mt-6">
                        {step > 0 && (
                          <button type="button" onClick={prev}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-black/10 dark:border-white/10 text-dark dark:text-white font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                            <ChevronLeft size={18} /> Back
                          </button>
                        )}
                        {isLastStep ? (
                          <button type="button" onClick={handleSubmit} disabled={submitting || !isStepComplete()}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-accent text-white rounded-xl font-semibold hover:bg-accent-light transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
                            {submitting ? (
                              <span className="flex items-center gap-2">
                                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Registering...
                              </span>
                            ) : (
                              <>
                                <Send size={18} /> Submit Registration
                              </>
                            )}
                          </button>
                        ) : (
                          <button type="button" onClick={next} disabled={!isStepComplete()}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-accent text-white rounded-xl font-semibold hover:bg-accent-light transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
                            Next <ChevronRight size={18} />
                          </button>
                        )}
                      </div>
                    )}

                    {/* Submit from QR view once proof uploaded */}
                    {showQR && formData.payment_proof_url && (
                      <div className="mt-6">
                        <button type="button" onClick={() => setShowQR(false)}
                          className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-accent text-white rounded-xl font-semibold hover:bg-accent-light transition-colors duration-300">
                          <CheckCircle size={18} /> Continue to Submit
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>
    </div>
  );
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <span className="text-dark/40 dark:text-white/40">{label}:</span>{' '}
      <span className="text-dark dark:text-white truncate inline-block max-w-full align-bottom">{value}</span>
    </div>
  );
}
