import React, { useMemo, useState } from 'react';
import { RotateCcw, Search, SlidersHorizontal } from 'lucide-react';
import {
  Book,
  BOOK_CONDITIONS,
  BookCondition,
  BookRequest,
  Category,
  COURSES,
  formatINR,
  SEMESTERS,
} from '../types/bookloop';
import { BookCard } from './BookCard';

export interface ExploreFilters {
  search: string;
  author: string;
  category: string;
  course: string;
  semester: string;
  condition: '' | BookCondition;
  maxPrice: number;
  mode: 'all' | 'exchange' | 'donation';
  sort: 'newest' | 'price-asc' | 'price-desc' | 'discount';
}

interface ExploreBooksProps {
  availableBooks: Book[];
  categories: Category[];
  currentUserId: string;
  outgoingRequests: BookRequest[];
  filters: ExploreFilters;
  onFiltersChange: (next: ExploreFilters) => void;
  onResetFilters: () => void;
  onSelectBook: (book: Book) => void;
}

export const ExploreBooks: React.FC<ExploreBooksProps> = ({
  availableBooks,
  categories,
  currentUserId,
  outgoingRequests,
  filters,
  onFiltersChange,
  onResetFilters,
  onSelectBook,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(true);

  const activeOutgoingBookIds = useMemo(
    () =>
      new Set(
        outgoingRequests
          .filter((r) => r.requestStatus === 'Pending' || r.requestStatus === 'Accepted')
          .map((r) => r.bookId)
      ),
    [outgoingRequests]
  );

  const filteredBooks = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    const authorQ = filters.author.trim().toLowerCase();

    const matches = availableBooks.filter((book) => {
      // Strictly exclude unavailable/sold books from default available catalogue
      if (book.availabilityStatus !== 'Available') return false;

      if (q) {
        const haystack =
          `${book.bookTitle} ${book.author} ${book.isbn} ${book.category} ${book.course} ${book.publisher}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      if (authorQ && !book.author.toLowerCase().includes(authorQ)) {
        return false;
      }

      if (filters.category && book.category !== filters.category) {
        return false;
      }

      if (filters.course && book.course !== filters.course) {
        return false;
      }

      if (filters.semester && book.semester !== filters.semester) {
        return false;
      }

      if (filters.condition && book.condition !== filters.condition) {
        return false;
      }

      if (filters.maxPrice > 0 && book.sellingPrice > filters.maxPrice) {
        return false;
      }

      if (filters.mode === 'exchange' && !book.exchangeAvailable) {
        return false;
      }

      if (filters.mode === 'donation' && !book.donationAvailable) {
        return false;
      }

      return true;
    });

    return matches.sort((a, b) => {
      if (filters.sort === 'price-asc') return a.sellingPrice - b.sellingPrice;
      if (filters.sort === 'price-desc') return b.sellingPrice - a.sellingPrice;
      if (filters.sort === 'discount') {
        const discA = a.originalPrice > 0 ? (a.originalPrice - a.sellingPrice) / a.originalPrice : 0;
        const discB = b.originalPrice > 0 ? (b.originalPrice - b.sellingPrice) / b.originalPrice : 0;
        return discB - discA;
      }
      const msA = a.listingDate?.toMillis?.() ?? 0;
      const msB = b.listingDate?.toMillis?.() ?? 0;
      return msB - msA;
    });
  }, [availableBooks, filters]);

  const hasActiveFilters =
    Boolean(filters.search) ||
    Boolean(filters.author) ||
    Boolean(filters.category) ||
    Boolean(filters.course) ||
    Boolean(filters.semester) ||
    Boolean(filters.condition) ||
    filters.maxPrice < 2000 ||
    filters.mode !== 'all';

  return (
    <main className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-8 pb-24 md:pb-16">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-black/8">
        <div>
          <h1 className="font-display text-3xl font-semibold text-[#14181F]">
            Explore Campus Books
          </h1>
          <p className="text-sm text-[#4A5568] mt-1">
            Showing{' '}
            <span className="font-mono-tabular font-semibold text-[#14181F]">
              {filteredBooks.length}
            </span>{' '}
            available {filteredBooks.length === 1 ? 'textbook' : 'textbooks'} across campus.
          </p>
        </div>

        {/* Interactive Mode Segmented Control */}
        <div
          className="inline-flex items-center p-1 bg-[#EFECE5] rounded-lg self-start sm:self-auto"
          role="tablist"
          aria-label="Filter by listing type"
        >
          {(
            [
              { id: 'all', label: 'All Available' },
              { id: 'exchange', label: 'Exchange' },
              { id: 'donation', label: 'Donation' },
            ] as const
          ).map((tab) => {
            const active = filters.mode === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onFiltersChange({ ...filters, mode: tab.id })}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-white text-[#14181F] shadow-xs'
                    : 'text-[#4A5568] hover:text-[#14181F]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search + Filter Controls Bar */}
      <section className="mt-6 bg-white border border-black/8 rounded-xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#6B7280] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={filters.search}
              onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
              placeholder="Search by book title, ISBN, subject, or publisher..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-[#F8F7F4] border border-black/12 rounded-lg focus:bg-white focus:border-[#1B5E43]"
            />
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <select
              aria-label="Sort textbooks"
              value={filters.sort}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  sort: e.target.value as ExploreFilters['sort'],
                })
              }
              className="px-3.5 py-2.5 text-sm bg-[#F8F7F4] border border-black/12 rounded-lg focus:bg-white focus:border-[#1B5E43]"
            >
              <option value="newest">Newest First</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="discount">Biggest Savings</option>
            </select>

            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium text-[#14181F] bg-[#F8F7F4] border border-black/12 rounded-lg hover:bg-[#EFECE5] transition-colors whitespace-nowrap cursor-pointer"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filters</span>
            </button>
          </div>
        </div>

        {showAdvanced && (
          <div className="pt-4 border-t border-black/6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
            <div>
              <label htmlFor="f-author" className="block text-xs text-[#6B7280] mb-1">
                Author
              </label>
              <input
                id="f-author"
                type="text"
                value={filters.author}
                onChange={(e) => onFiltersChange({ ...filters, author: e.target.value })}
                placeholder="e.g., Kotler"
                className="w-full px-3 py-2 text-xs bg-white border border-black/12 rounded-lg focus:border-[#1B5E43]"
              />
            </div>

            <div>
              <label htmlFor="f-category" className="block text-xs text-[#6B7280] mb-1">
                Subject
              </label>
              <select
                id="f-category"
                value={filters.category}
                onChange={(e) => onFiltersChange({ ...filters, category: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white border border-black/12 rounded-lg focus:border-[#1B5E43]"
              >
                <option value="">All Subjects</option>
                {categories.map((cat) => (
                  <option key={cat.categoryId} value={cat.categoryName}>
                    {cat.categoryName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="f-course" className="block text-xs text-[#6B7280] mb-1">
                Course
              </label>
              <select
                id="f-course"
                value={filters.course}
                onChange={(e) => onFiltersChange({ ...filters, course: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white border border-black/12 rounded-lg focus:border-[#1B5E43]"
              >
                <option value="">All Courses</option>
                {COURSES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="f-semester" className="block text-xs text-[#6B7280] mb-1">
                Semester
              </label>
              <select
                id="f-semester"
                value={filters.semester}
                onChange={(e) => onFiltersChange({ ...filters, semester: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white border border-black/12 rounded-lg focus:border-[#1B5E43]"
              >
                <option value="">All Semesters</option>
                {SEMESTERS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="f-condition" className="block text-xs text-[#6B7280] mb-1">
                Condition
              </label>
              <select
                id="f-condition"
                value={filters.condition}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    condition: e.target.value as '' | BookCondition,
                  })
                }
                className="w-full px-3 py-2 text-xs bg-white border border-black/12 rounded-lg focus:border-[#1B5E43]"
              >
                <option value="">Any Condition</option>
                {BOOK_CONDITIONS.map((cond) => (
                  <option key={cond} value={cond}>
                    {cond}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs text-[#6B7280] mb-1">
                <label htmlFor="f-price">Max Price</label>
                <span className="font-mono-tabular font-medium text-[#14181F]">
                  {filters.maxPrice >= 2000 ? 'Any' : formatINR(filters.maxPrice)}
                </span>
              </div>
              <input
                id="f-price"
                type="range"
                min={0}
                max={2000}
                step={50}
                value={filters.maxPrice}
                onChange={(e) =>
                  onFiltersChange({ ...filters, maxPrice: Number(e.target.value) })
                }
                className="w-full accent-[#1B5E43] cursor-pointer"
              />
            </div>
          </div>
        )}

        {hasActiveFilters && (
          <div className="pt-2 flex items-center justify-end">
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#1B5E43] hover:underline cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset all filters</span>
            </button>
          </div>
        )}
      </section>

      {/* Uniform 3-Column Book Grid */}
      <section className="mt-8">
        {filteredBooks.length === 0 ? (
          <div className="bg-white border border-black/8 rounded-xl p-12 text-center">
            <h2 className="font-display text-lg font-semibold text-[#14181F]">
              No matching textbooks found
            </h2>
            <p className="text-sm text-[#4A5568] mt-1.5 max-w-md mx-auto">
              Try broadening your course, semester, or price range filter to see more
              available campus books.
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={onResetFilters}
                className="mt-5 px-4 py-2 bg-[#14181F] text-white text-xs font-medium rounded-lg hover:bg-black cursor-pointer"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBooks.map((book) => (
              <BookCard
                key={book.bookId}
                book={book}
                isOwnBook={book.sellerUid === currentUserId}
                hasActiveRequest={activeOutgoingBookIds.has(book.bookId)}
                onSelect={onSelectBook}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
};
