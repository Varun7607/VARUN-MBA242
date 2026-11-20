import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, Trash2, Upload } from 'lucide-react';
import {
  Book,
  BOOK_CONDITIONS,
  BookCondition,
  BookFormValues,
  Category,
  computeDiscountPercent,
  COURSES,
  FIELD_LIMITS,
  formatINR,
  SEMESTERS,
  UserProfile,
} from '../types/bookloop';
import {
  compressImageFile,
  createBookListing,
  updateBookListing,
} from '../lib/bookloopService';
import { BookCover } from './BookCover';

interface BookListingFormProps {
  profile: UserProfile;
  categories: Category[];
  editingBook?: Book | null;
  onSuccess: (bookId: string, wasEdit: boolean) => void;
  onCancel: () => void;
}

export const BookListingForm: React.FC<BookListingFormProps> = ({
  profile,
  categories,
  editingBook,
  onSuccess,
  onCancel,
}) => {
  const isEditing = Boolean(editingBook);
  const [form, setForm] = useState<BookFormValues>({
    bookTitle: editingBook?.bookTitle ?? '',
    author: editingBook?.author ?? '',
    isbn: editingBook?.isbn ?? '',
    category: editingBook?.category ?? categories[0]?.categoryName ?? 'Management & Finance',
    course: editingBook?.course ?? profile.course,
    semester: editingBook?.semester ?? profile.semester,
    edition: editingBook?.edition ?? '',
    publisher: editingBook?.publisher ?? '',
    description: editingBook?.description ?? '',
    condition: editingBook?.condition ?? 'Very Good',
    originalPrice: editingBook?.originalPrice ?? 650,
    sellingPrice: editingBook?.sellingPrice ?? 280,
    exchangeAvailable: editingBook?.exchangeAvailable ?? true,
    donationAvailable: editingBook?.donationAvailable ?? false,
    bookImage: editingBook?.bookImage ?? '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageProcessing, setImageProcessing] = useState(false);

  const discount = computeDiscountPercent(form.originalPrice, form.sellingPrice);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageProcessing(true);
    setError(null);
    try {
      const compressed = await compressImageFile(file, 520);
      setForm((prev) => ({ ...prev, bookImage: compressed }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to process image.');
    } finally {
      setImageProcessing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (
      !form.bookTitle.trim() ||
      !form.author.trim() ||
      !form.edition.trim() ||
      !form.publisher.trim()
    ) {
      setError('Please complete all required textbook details (Title, Author, Edition, Publisher).');
      return;
    }

    if (form.originalPrice <= 0) {
      setError('Original MRP must be greater than ₹0.');
      return;
    }

    if (form.sellingPrice < 0) {
      setError('Selling price cannot be negative.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingBook) {
        await updateBookListing(editingBook.bookId, form);
        onSuccess(editingBook.bookId, true);
      } else {
        const newBookId = await createBookListing(profile, form);
        onSuccess(newBookId, false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save listing.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="max-w-[1100px] mx-auto px-4 sm:px-6 pt-8 pb-24 md:pb-16">
      <div className="flex items-center justify-between gap-4 pb-6 border-b border-black/8">
        <div>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#4A5568] hover:text-[#14181F] mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>
          <h1 className="font-display text-3xl font-semibold text-[#14181F]">
            {isEditing ? 'Edit Book Listing' : 'Sell, Exchange, or Donate a Book'}
          </h1>
          <p className="text-sm text-[#4A5568] mt-1">
            {isEditing
              ? `Updating listing ${editingBook?.bookId}`
              : 'Book ID, seller identity, and listing timestamp are captured automatically.'}
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
      >
        {/* Left Live Jacket Preview & Photo Upload */}
        <div className="lg:col-span-4 lg:sticky lg:top-24 bg-white border border-black/8 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between text-xs text-[#6B7280]">
            <span>Listing Preview</span>
            <span className="font-mono-tabular">
              {editingBook ? editingBook.bookId : 'Auto-ID'}
            </span>
          </div>

          <BookCover
            title={form.bookTitle || 'Your Textbook Title'}
            author={form.author || 'Author Name'}
            category={form.category}
            edition={form.edition || 'Edition'}
            publisher={form.publisher || 'Publisher'}
            imageUrl={form.bookImage}
            size="md"
          />

          <div className="flex items-baseline justify-between pt-2 border-t border-black/6">
            <span className="font-mono-tabular text-lg font-semibold text-[#14181F]">
              {form.donationAvailable && form.sellingPrice === 0
                ? 'Free'
                : formatINR(form.sellingPrice)}
            </span>
            {discount > 0 && (
              <span className="font-mono-tabular text-xs font-medium text-[#1B5E43]">
                {discount}% off MRP
              </span>
            )}
          </div>

          <div className="space-y-2 pt-2">
            <label className="flex items-center justify-center gap-2 w-full px-3.5 py-2.5 text-xs font-medium text-[#14181F] bg-[#F8F7F4] border border-black/14 rounded-lg hover:bg-[#EFECE5] transition-colors cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-[#4A5568]" />
              <span>
                {imageProcessing
                  ? 'Compressing photo...'
                  : form.bookImage
                    ? 'Replace cover photo'
                    : 'Upload real book photo (optional)'}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="sr-only"
              />
            </label>

            {form.bookImage && (
              <button
                type="button"
                onClick={() => setForm({ ...form, bookImage: '' })}
                className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 text-xs text-[#991B1B] hover:underline cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove photo (use editorial cover)</span>
              </button>
            )}
          </div>

          <div className="pt-3 border-t border-black/6 text-xs text-[#6B7280] space-y-1">
            <p>
              Seller: <span className="text-[#14181F] font-medium">{profile.studentName}</span>
            </p>
            <p className="font-mono-tabular truncate">{profile.email}</p>
            <p>{profile.college}</p>
          </div>
        </div>

        {/* Right Structured Form Fields */}
        <div className="lg:col-span-8 bg-white border border-black/8 rounded-xl p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="font-display text-lg font-semibold text-[#14181F]">
              01. Textbook Information
            </h2>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label htmlFor="bk-title" className="block text-xs font-medium text-[#14181F] mb-1.5">
                  Book Title *
                </label>
                <input
                  id="bk-title"
                  type="text"
                  required
                  maxLength={FIELD_LIMITS.bookTitle}
                  value={form.bookTitle}
                  onChange={(e) => setForm({ ...form, bookTitle: e.target.value })}
                  placeholder="e.g., Principles of Corporate Finance"
                  className="w-full px-3.5 py-2.5 text-sm border border-black/15 rounded-lg focus:border-[#1B5E43]"
                />
              </div>

              <div>
                <label htmlFor="bk-author" className="block text-xs font-medium text-[#14181F] mb-1.5">
                  Author Name *
                </label>
                <input
                  id="bk-author"
                  type="text"
                  required
                  maxLength={FIELD_LIMITS.author}
                  value={form.author}
                  onChange={(e) => setForm({ ...form, author: e.target.value })}
                  placeholder="e.g., Brealey, Myers & Allen"
                  className="w-full px-3.5 py-2.5 text-sm border border-black/15 rounded-lg focus:border-[#1B5E43]"
                />
              </div>

              <div>
                <label htmlFor="bk-isbn" className="block text-xs font-medium text-[#14181F] mb-1.5">
                  ISBN (Optional)
                </label>
                <input
                  id="bk-isbn"
                  type="text"
                  maxLength={FIELD_LIMITS.isbn}
                  value={form.isbn}
                  onChange={(e) => setForm({ ...form, isbn: e.target.value })}
                  placeholder="e.g., 978-9353166526"
                  className="w-full px-3.5 py-2.5 text-sm font-mono-tabular border border-black/15 rounded-lg focus:border-[#1B5E43]"
                />
              </div>

              <div>
                <label htmlFor="bk-edition" className="block text-xs font-medium text-[#14181F] mb-1.5">
                  Edition *
                </label>
                <input
                  id="bk-edition"
                  type="text"
                  required
                  maxLength={FIELD_LIMITS.edition}
                  value={form.edition}
                  onChange={(e) => setForm({ ...form, edition: e.target.value })}
                  placeholder="e.g., 12th Edition"
                  className="w-full px-3.5 py-2.5 text-sm border border-black/15 rounded-lg focus:border-[#1B5E43]"
                />
              </div>

              <div>
                <label htmlFor="bk-publisher" className="block text-xs font-medium text-[#14181F] mb-1.5">
                  Publisher *
                </label>
                <input
                  id="bk-publisher"
                  type="text"
                  required
                  maxLength={FIELD_LIMITS.publisher}
                  value={form.publisher}
                  onChange={(e) => setForm({ ...form, publisher: e.target.value })}
                  placeholder="e.g., McGraw Hill Education"
                  className="w-full px-3.5 py-2.5 text-sm border border-black/15 rounded-lg focus:border-[#1B5E43]"
                />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-black/8">
            <h2 className="font-display text-lg font-semibold text-[#14181F]">
              02. Academic Mapping & Condition
            </h2>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="bk-cat" className="block text-xs font-medium text-[#14181F] mb-1.5">
                  Subject / Category *
                </label>
                <select
                  id="bk-cat"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-black/15 rounded-lg focus:border-[#1B5E43]"
                >
                  {categories.map((cat) => (
                    <option key={cat.categoryId} value={cat.categoryName}>
                      {cat.categoryName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="bk-course" className="block text-xs font-medium text-[#14181F] mb-1.5">
                  Course *
                </label>
                <select
                  id="bk-course"
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
                <label htmlFor="bk-sem" className="block text-xs font-medium text-[#14181F] mb-1.5">
                  Semester *
                </label>
                <select
                  id="bk-sem"
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
                <label htmlFor="bk-cond" className="block text-xs font-medium text-[#14181F] mb-1.5">
                  Book Condition *
                </label>
                <select
                  id="bk-cond"
                  value={form.condition}
                  onChange={(e) =>
                    setForm({ ...form, condition: e.target.value as BookCondition })
                  }
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-black/15 rounded-lg focus:border-[#1B5E43]"
                >
                  {BOOK_CONDITIONS.map((cond) => (
                    <option key={cond} value={cond}>
                      {cond}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="bk-desc" className="block text-xs font-medium text-[#14181F] mb-1.5">
                  Book Description & Condition Notes
                </label>
                <textarea
                  id="bk-desc"
                  rows={3}
                  maxLength={FIELD_LIMITS.description}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Mention highlights, binding condition, missing pages (if any), or which book you'd like in exchange..."
                  className="w-full px-3.5 py-2.5 text-sm border border-black/15 rounded-lg focus:border-[#1B5E43]"
                />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-black/8">
            <h2 className="font-display text-lg font-semibold text-[#14181F]">
              03. Pricing & Exchange Options
            </h2>
            <p className="text-xs text-[#6B7280] mt-1">
              Most students on campus price used textbooks at 30–60% of the printed MRP.
            </p>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="bk-mrp" className="block text-xs font-medium text-[#14181F] mb-1.5">
                  Original Price / MRP (₹) *
                </label>
                <input
                  id="bk-mrp"
                  type="number"
                  required
                  min={1}
                  max={FIELD_LIMITS.priceMax}
                  value={form.originalPrice}
                  onChange={(e) =>
                    setForm({ ...form, originalPrice: Number(e.target.value) })
                  }
                  className="w-full px-3.5 py-2.5 text-sm font-mono-tabular border border-black/15 rounded-lg focus:border-[#1B5E43]"
                />
              </div>

              <div>
                <label htmlFor="bk-sell" className="block text-xs font-medium text-[#14181F] mb-1.5">
                  Selling Price (₹) *
                </label>
                <input
                  id="bk-sell"
                  type="number"
                  required
                  min={0}
                  max={FIELD_LIMITS.priceMax}
                  value={form.sellingPrice}
                  onChange={(e) =>
                    setForm({ ...form, sellingPrice: Number(e.target.value) })
                  }
                  className="w-full px-3.5 py-2.5 text-sm font-mono-tabular border border-black/15 rounded-lg focus:border-[#1B5E43]"
                />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex items-start gap-3 p-3.5 rounded-lg border border-black/12 bg-[#F8F7F4] cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.exchangeAvailable}
                  onChange={(e) =>
                    setForm({ ...form, exchangeAvailable: e.target.checked })
                  }
                  className="mt-0.5 accent-[#1B5E43]"
                />
                <div>
                  <span className="block text-sm font-medium text-[#14181F]">
                    Exchange Available
                  </span>
                  <span className="block text-xs text-[#6B7280] mt-0.5">
                    Allow classmates to propose a direct textbook swap.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 rounded-lg border border-black/12 bg-[#F8F7F4] cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.donationAvailable}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      donationAvailable: e.target.checked,
                      sellingPrice: e.target.checked && form.sellingPrice === 0 ? 0 : form.sellingPrice,
                    })
                  }
                  className="mt-0.5 accent-[#1B5E43]"
                />
                <div>
                  <span className="block text-sm font-medium text-[#14181F]">
                    Donation Available
                  </span>
                  <span className="block text-xs text-[#6B7280] mt-0.5">
                    Allow students in need to request this book for free.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {error && (
            <p className="text-sm text-[#991B1B]" role="alert">
              {error}
            </p>
          )}

          <div className="pt-4 border-t border-black/8 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 text-sm font-medium text-[#4A5568] hover:text-[#14181F] whitespace-nowrap cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || imageProcessing}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#1B5E43] text-white text-sm font-medium rounded-lg hover:bg-[#154A34] transition-colors disabled:opacity-60 whitespace-nowrap cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {submitting
                  ? 'Saving...'
                  : isEditing
                    ? 'Save Changes'
                    : 'Publish Book Listing'}
              </span>
            </button>
          </div>
        </div>
      </form>
    </main>
  );
};
