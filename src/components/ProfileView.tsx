import React, { useState } from 'react';
import { LogOut, Save, Upload } from 'lucide-react';
import {
  Book,
  COLLEGES_DEHRADUN,
  COURSES,
  FIELD_LIMITS,
  formatTimestamp,
  ProfileFormValues,
  SEMESTERS,
  Transaction,
  UserProfile,
} from '../types/bookloop';
import { compressImageFile, saveUserProfile } from '../lib/bookloopService';

interface ProfileViewProps {
  profile: UserProfile;
  myBooks: Book[];
  transactions: Transaction[];
  onSignOut: () => Promise<void>;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  profile,
  myBooks,
  transactions,
  onSignOut,
}) => {
  const [form, setForm] = useState<ProfileFormValues>({
    studentName: profile.studentName,
    studentId: profile.studentId,
    college: profile.college,
    course: profile.course,
    semester: profile.semester,
    contactNumber: profile.contactNumber,
    profilePhoto: profile.profilePhoto,
  });
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const initials = profile.studentName
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      const compressed = await compressImageFile(file, 320);
      setForm((prev) => ({ ...prev, profilePhoto: compressed }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process photo.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    setError(null);
    try {
      await saveUserProfile(profile.userId, profile.email, form, false);
      setFeedback('Your student profile has been updated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-24 md:pb-16 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-black/8">
        <div className="flex items-center gap-4">
          {form.profilePhoto ? (
            <img
              src={form.profilePhoto}
              alt={profile.studentName}
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-full object-cover border border-black/10 shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-[#1B5E43] text-white font-display text-xl font-semibold flex items-center justify-center shrink-0">
              {initials || 'ST'}
            </div>
          )}
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#14181F]">
              {profile.studentName}
            </h1>
            <p className="text-xs text-[#4A5568] mt-1">
              {profile.studentId} · {profile.course} · Member since{' '}
              {formatTimestamp(profile.registrationDate)}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void onSignOut()}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-[#991B1B] border border-[#991B1B]/25 rounded-lg hover:bg-[#991B1B]/5 self-start sm:self-auto whitespace-nowrap cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Activity Summary Strip */}
      <div className="grid grid-cols-3 bg-white border border-black/8 rounded-xl divide-x divide-black/8">
        <div className="p-4 sm:p-5">
          <p className="text-xs text-[#6B7280]">Total Listed</p>
          <p className="font-mono-tabular text-2xl font-semibold text-[#14181F] mt-1">
            {myBooks.length}
          </p>
        </div>
        <div className="p-4 sm:p-5">
          <p className="text-xs text-[#6B7280]">Books Shared / Sold</p>
          <p className="font-mono-tabular text-2xl font-semibold text-[#1B5E43] mt-1">
            {transactions.filter((t) => t.sellerUid === profile.userId).length}
          </p>
        </div>
        <div className="p-4 sm:p-5">
          <p className="text-xs text-[#6B7280]">Books Acquired</p>
          <p className="font-mono-tabular text-2xl font-semibold text-[#14181F] mt-1">
            {transactions.filter((t) => t.buyerUid === profile.userId).length}
          </p>
        </div>
      </div>

      {/* Private Profile Editor */}
      <form
        onSubmit={handleSave}
        className="bg-white border border-black/8 rounded-xl p-6 sm:p-8 space-y-5"
      >
        <div className="flex items-baseline justify-between pb-4 border-b border-black/6">
          <h2 className="font-display text-lg font-semibold text-[#14181F]">
            Student Account Details
          </h2>
          <span className="text-xs font-medium text-[#1B5E43]">
            Status: {profile.userStatus}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-[#6B7280] mb-1.5">
              Verified Email Address (Private)
            </label>
            <input
              type="email"
              value={profile.email}
              disabled
              className="w-full px-3.5 py-2.5 text-sm font-mono-tabular bg-[#F4F3EF] border border-black/8 rounded-lg text-[#4A5568]"
            />
          </div>

          <div>
            <label htmlFor="prof-name" className="block text-xs font-medium text-[#14181F] mb-1.5">
              Student Name *
            </label>
            <input
              id="prof-name"
              type="text"
              required
              maxLength={FIELD_LIMITS.studentName}
              value={form.studentName}
              onChange={(e) => setForm({ ...form, studentName: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm border border-black/15 rounded-lg focus:border-[#1B5E43]"
            />
          </div>

          <div>
            <label htmlFor="prof-sid" className="block text-xs font-medium text-[#14181F] mb-1.5">
              Student ID *
            </label>
            <input
              id="prof-sid"
              type="text"
              required
              maxLength={FIELD_LIMITS.studentId}
              value={form.studentId}
              onChange={(e) => setForm({ ...form, studentId: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm font-mono-tabular border border-black/15 rounded-lg focus:border-[#1B5E43]"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="prof-college" className="block text-xs font-medium text-[#14181F] mb-1.5">
              College / University *
            </label>
            <select
              id="prof-college"
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

          <div>
            <label htmlFor="prof-course" className="block text-xs font-medium text-[#14181F] mb-1.5">
              Course *
            </label>
            <select
              id="prof-course"
              value={form.course}
              onChange={(e) => setForm({ ...form, course: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-black/15 rounded-lg focus:border-[#1B5E43]"
            >
              {COURSES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="prof-sem" className="block text-xs font-medium text-[#14181F] mb-1.5">
              Semester *
            </label>
            <select
              id="prof-sem"
              value={form.semester}
              onChange={(e) => setForm({ ...form, semester: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-black/15 rounded-lg focus:border-[#1B5E43]"
            >
              {SEMESTERS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="prof-phone" className="block text-xs font-medium text-[#14181F] mb-1.5">
              Contact Number *
            </label>
            <input
              id="prof-phone"
              type="tel"
              required
              minLength={FIELD_LIMITS.contactNumberMin}
              maxLength={FIELD_LIMITS.contactNumberMax}
              value={form.contactNumber}
              onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm font-mono-tabular border border-black/15 rounded-lg focus:border-[#1B5E43]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#14181F] mb-1.5">
              Profile Photo
            </label>
            <label className="flex items-center justify-center gap-2 px-3.5 py-2.5 text-sm font-medium text-[#14181F] bg-[#F8F7F4] border border-black/15 rounded-lg hover:bg-[#EFECE5] transition-colors cursor-pointer">
              <Upload className="w-4 h-4 text-[#4A5568]" />
              <span>Upload new photo</span>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="sr-only"
              />
            </label>
          </div>
        </div>

        {error && (
          <p className="text-sm text-[#991B1B]" role="alert">
            {error}
          </p>
        )}
        {feedback && (
          <p className="text-sm text-[#1B5E43]" role="status">
            {feedback}
          </p>
        )}

        <div className="pt-4 border-t border-black/8 flex items-center justify-between gap-4">
          <p className="text-xs text-[#6B7280]">
            Your private profile is only accessible to your own account.
          </p>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1B5E43] text-white text-sm font-medium rounded-lg hover:bg-[#154A34] disabled:opacity-60 whitespace-nowrap cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Profile'}</span>
          </button>
        </div>
      </form>
    </main>
  );
};
