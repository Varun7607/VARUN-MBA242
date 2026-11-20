import React, { useState } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { ArrowRight, Upload } from 'lucide-react';
import {
  COLLEGES_DEHRADUN,
  COURSES,
  FIELD_LIMITS,
  ProfileFormValues,
  SEED_CAMPUS_BOOKS,
  SEMESTERS,
} from '../types/bookloop';
import { compressImageFile, saveUserProfile } from '../lib/bookloopService';
import { BookCover } from './BookCover';

interface AuthOnboardingProps {
  firebaseUser: FirebaseUser | null;
  onGoogleSignIn: () => Promise<void>;
  onSignOut: () => Promise<void>;
  authError: string | null;
  signingIn: boolean;
}

export const AuthOnboarding: React.FC<AuthOnboardingProps> = ({
  firebaseUser,
  onGoogleSignIn,
  onSignOut,
  authError,
  signingIn,
}) => {
  const [form, setForm] = useState<ProfileFormValues>({
    studentName: firebaseUser?.displayName ?? '',
    studentId: '',
    college: COLLEGES_DEHRADUN[0],
    course: 'MBA',
    semester: 'Semester 1',
    contactNumber: '',
    profilePhoto: firebaseUser?.photoURL ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormError(null);
    try {
      const compressed = await compressImageFile(file, 320);
      setForm((prev) => ({ ...prev, profilePhoto: compressed }));
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to process photo.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser || !firebaseUser.email) return;

    if (!form.studentName.trim() || !form.studentId.trim() || !form.contactNumber.trim()) {
      setFormError('Please fill in your name, Student ID, and contact number.');
      return;
    }

    if (form.contactNumber.trim().length < FIELD_LIMITS.contactNumberMin) {
      setFormError('Contact number must be at least 7 characters.');
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      await saveUserProfile(firebaseUser.uid, firebaseUser.email, form, true);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not complete registration.');
    } finally {
      setSaving(false);
    }
  };

  // State 1: Signed out — Campus Landing & Sign In
  if (!firebaseUser) {
    const previewBooks = SEED_CAMPUS_BOOKS.slice(0, 3);

    return (
      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
          {/* Left Hero Column */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            <p className="text-sm font-medium text-[#1B5E43] mb-4">
              DBS Global University, Dehradun · Campus Book Exchange
            </p>
            <h1
              className="font-display text-4xl sm:text-5xl font-semibold tracking-tight text-[#14181F] leading-[1.12] max-w-xl"
              style={{ textWrap: 'balance' }}
            >
              Buy Smart. Sell Easy. Share Knowledge.
            </h1>
            <p className="mt-5 text-base text-[#4A5568] leading-relaxed max-w-lg">
              BookLoop connects university students directly to buy, sell, exchange, or
              donate second-hand academic textbooks at 30–60% of retail cost — organized
              by course, semester, and edition.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={onGoogleSignIn}
                disabled={signingIn}
                className="inline-flex items-center gap-2.5 px-6 py-3 bg-[#1B5E43] text-white text-sm font-medium rounded-lg hover:bg-[#154A34] transition-colors disabled:opacity-60 whitespace-nowrap cursor-pointer"
              >
                <span>{signingIn ? 'Signing in...' : 'Sign in with College / Google Email'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {authError && (
              <p className="mt-4 text-sm text-[#991B1B]" role="alert">
                {authError}
              </p>
            )}

            <div className="mt-10 pt-6 border-t border-black/8 grid grid-cols-3 gap-6 max-w-lg">
              <div>
                <p className="font-mono-tabular text-xl font-semibold text-[#14181F]">
                  30–60%
                </p>
                <p className="text-xs text-[#6B7280] mt-1">Typical student savings vs. MRP</p>
              </div>
              <div>
                <p className="font-mono-tabular text-xl font-semibold text-[#14181F]">
                  Direct
                </p>
                <p className="text-xs text-[#6B7280] mt-1">Peer handover right on campus</p>
              </div>
              <div>
                <p className="font-mono-tabular text-xl font-semibold text-[#14181F]">
                  3 Modes
                </p>
                <p className="text-xs text-[#6B7280] mt-1">Buy, exchange, or donate books</p>
              </div>
            </div>
          </div>

          {/* Right Editorial Preview Showcase */}
          <div className="lg:col-span-6 bg-white border border-black/8 rounded-2xl p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-[#6B7280] pb-4 border-b border-black/6">
                <span>Featured on DBS Global University</span>
                <span className="font-mono-tabular">Dehradun Campus</span>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-4">
                {previewBooks.map((book) => (
                  <div key={book.bookId} className="flex flex-col">
                    <BookCover
                      title={book.bookTitle}
                      author={book.author}
                      category={book.category}
                      edition={book.edition}
                      publisher={book.publisher}
                      size="sm"
                    />
                    <p className="mt-2.5 text-xs font-medium text-[#14181F] line-clamp-1">
                      {book.bookTitle}
                    </p>
                    <p className="font-mono-tabular text-xs text-[#1B5E43] font-medium mt-0.5">
                      ₹{book.sellingPrice}
                      <span className="text-[#6B7280] line-through ml-1.5 font-normal">
                        ₹{book.originalPrice}
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-5 border-t border-black/6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-[#4A5568]">
              <div>
                <p className="font-semibold text-[#14181F]">01. Verify Profile</p>
                <p className="mt-1 leading-relaxed">
                  Register with your college details and course semester.
                </p>
              </div>
              <div>
                <p className="font-semibold text-[#14181F]">02. List or Request</p>
                <p className="mt-1 leading-relaxed">
                  Upload used textbooks or request copies from seniors.
                </p>
              </div>
              <div>
                <p className="font-semibold text-[#14181F]">03. Meet & Confirm</p>
                <p className="mt-1 leading-relaxed">
                  Exchange on campus and confirm to record the handover.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // State 2: Signed in with Google, completing Module 1 Student Registration
  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <div className="bg-white border border-black/8 rounded-2xl p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4 pb-6 border-b border-black/8">
          <div>
            <p className="text-xs font-medium text-[#1B5E43] mb-1">
              Student Registration · Step 1 of 1
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#14181F]">
              Complete your campus profile
            </h1>
            <p className="text-sm text-[#4A5568] mt-1.5">
              One account lets you both buy and sell textbooks across your campus community.
            </p>
          </div>
          <button
            type="button"
            onClick={onSignOut}
            className="text-xs font-medium text-[#6B7280] hover:text-[#14181F] whitespace-nowrap cursor-pointer"
          >
            Switch account
          </button>
        </div>

        <form onSubmit={handleRegisterSubmit} className="mt-6 space-y-5">
          {/* Verified Email (auto-captured) */}
          <div>
            <label className="block text-xs font-medium text-[#4A5568] mb-1.5">
              Verified Email Address
            </label>
            <input
              type="email"
              value={firebaseUser.email ?? ''}
              disabled
              className="w-full px-3.5 py-2.5 text-sm bg-[#F4F3EF] border border-black/8 rounded-lg text-[#4A5568] font-mono-tabular"
            />
            <p className="text-xs text-[#6B7280] mt-1">
              Automatically captured from your authenticated account. Prefer your @dgu.ac.in or college email where available.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="reg-name" className="block text-xs font-medium text-[#14181F] mb-1.5">
                Student Name *
              </label>
              <input
                id="reg-name"
                type="text"
                required
                maxLength={FIELD_LIMITS.studentName}
                value={form.studentName}
                onChange={(e) => setForm({ ...form, studentName: e.target.value })}
                placeholder="e.g., Varunendra Singh"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-black/15 rounded-lg focus:border-[#1B5E43]"
              />
            </div>

            <div>
              <label htmlFor="reg-sid" className="block text-xs font-medium text-[#14181F] mb-1.5">
                Student ID / Enrollment No. *
              </label>
              <input
                id="reg-sid"
                type="text"
                required
                maxLength={FIELD_LIMITS.studentId}
                value={form.studentId}
                onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                placeholder="e.g., 0251MBA242"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-black/15 rounded-lg font-mono-tabular focus:border-[#1B5E43]"
              />
            </div>
          </div>

          <div>
            <label htmlFor="reg-college" className="block text-xs font-medium text-[#14181F] mb-1.5">
              College / University *
            </label>
            <select
              id="reg-college"
              value={form.college}
              onChange={(e) => setForm({ ...form, college: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-black/15 rounded-lg focus:border-[#1B5E43]"
            >
              {COLLEGES_DEHRADUN.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="reg-course" className="block text-xs font-medium text-[#14181F] mb-1.5">
                Course *
              </label>
              <select
                id="reg-course"
                value={form.course}
                onChange={(e) => setForm({ ...form, course: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-black/15 rounded-lg focus:border-[#1B5E43]"
              >
                {COURSES.map((course) => (
                  <option key={course} value={course}>
                    {course}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="reg-sem" className="block text-xs font-medium text-[#14181F] mb-1.5">
                Semester *
              </label>
              <select
                id="reg-sem"
                value={form.semester}
                onChange={(e) => setForm({ ...form, semester: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-black/15 rounded-lg focus:border-[#1B5E43]"
              >
                {SEMESTERS.map((sem) => (
                  <option key={sem} value={sem}>
                    {sem}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
            <div>
              <label htmlFor="reg-phone" className="block text-xs font-medium text-[#14181F] mb-1.5">
                Contact Number (Phone / WhatsApp) *
              </label>
              <input
                id="reg-phone"
                type="tel"
                required
                minLength={FIELD_LIMITS.contactNumberMin}
                maxLength={FIELD_LIMITS.contactNumberMax}
                value={form.contactNumber}
                onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
                placeholder="e.g., +91 98765 43210"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-black/15 rounded-lg font-mono-tabular focus:border-[#1B5E43]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#14181F] mb-1.5">
                Profile Photo (Optional)
              </label>
              <label className="flex items-center justify-center gap-2 px-3.5 py-2.5 text-sm font-medium text-[#14181F] bg-[#F8F7F4] border border-black/15 rounded-lg hover:bg-[#EFECE5] transition-colors cursor-pointer">
                <Upload className="w-4 h-4 text-[#4A5568]" />
                <span>{form.profilePhoto ? 'Change photo' : 'Upload photo'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="sr-only"
                />
              </label>
            </div>
          </div>

          {formError && (
            <p className="text-sm text-[#991B1B]" role="alert">
              {formError}
            </p>
          )}

          <div className="pt-4 border-t border-black/8 flex items-center justify-between gap-4">
            <p className="text-xs text-[#6B7280]">
              Your phone number stays private until you exchange a request.
            </p>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-[#1B5E43] text-white text-sm font-medium rounded-lg hover:bg-[#154A34] transition-colors disabled:opacity-60 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {saving ? 'Saving Profile...' : 'Enter BookLoop'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
};
