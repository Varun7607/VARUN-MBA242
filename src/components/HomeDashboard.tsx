import React, { useState } from 'react';
import { ArrowRight, Bell, Check, Search } from 'lucide-react';
import {
  Book,
  BookRequest,
  Category,
  NavSection,
  NotificationItem,
  UserProfile,
} from '../types/bookloop';
import { markNotificationRead } from '../lib/bookloopService';
import { BookCard } from './BookCard';

interface HomeDashboardProps {
  profile: UserProfile;
  availableBooks: Book[];
  myBooks: Book[];
  categories: Category[];
  outgoingRequests: BookRequest[];
  incomingRequests: BookRequest[];
  notifications: NotificationItem[];
  onSelectBook: (book: Book) => void;
  onSearchSubmit: (query: string) => void;
  onSelectCategory: (categoryName: string) => void;
  onOpenExchangeOnly: () => void;
  onNavigate: (section: NavSection) => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  profile,
  availableBooks,
  myBooks,
  categories,
  outgoingRequests,
  incomingRequests,
  notifications,
  onSelectBook,
  onSearchSubmit,
  onSelectCategory,
  onOpenExchangeOnly,
  onNavigate,
}) => {
  const [searchInput, setSearchInput] = useState('');

  const featuredBooks = availableBooks.filter((b) => b.featured).slice(0, 3);
  const displayFeatured =
    featuredBooks.length > 0 ? featuredBooks : availableBooks.slice(0, 3);

  const exchangeBooks = availableBooks.filter((b) => b.exchangeAvailable).slice(0, 3);
  const recentBooks = [...availableBooks]
    .sort((a, b) => {
      const aMs = a.listingDate?.toMillis?.() ?? 0;
      const bMs = b.listingDate?.toMillis?.() ?? 0;
      return bMs - aMs;
    })
    .slice(0, 3);

  const myActiveListingsCount = myBooks.filter(
    (b) => b.availabilityStatus === 'Available'
  ).length;
  const activeRequestsCount =
    outgoingRequests.filter((r) => r.requestStatus === 'Pending' || r.requestStatus === 'Accepted')
      .length +
    incomingRequests.filter((r) => r.requestStatus === 'Pending' || r.requestStatus === 'Accepted')
      .length;

  const unreadNotifications = notifications.filter((n) => !n.read).slice(0, 4);

  const activeOutgoingBookIds = new Set(
    outgoingRequests
      .filter((r) => r.requestStatus === 'Pending' || r.requestStatus === 'Accepted')
      .map((r) => r.bookId)
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchSubmit(searchInput.trim());
  };

  return (
    <main className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-8 pb-24 md:pb-16 space-y-12">
      {/* Editorial Welcome & Prominent Search Hero */}
      <section className="space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <p className="text-xs font-medium text-[#1B5E43] mb-2">
              {profile.college} · {profile.course} · {profile.semester}
            </p>
            <h1
              className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-[#14181F]"
              style={{ textWrap: 'balance' }}
            >
              Welcome back, {profile.studentName.split(' ')[0]}
            </h1>
            <p className="text-sm text-[#4A5568] mt-2 max-w-xl">
              Buy Smart. Sell Easy. Share Knowledge. Discover affordable semester textbooks
              directly from fellow students on campus.
            </p>
          </div>

          {/* Quick Action Strip */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('explore')}
              className="px-4 py-2 text-sm font-medium text-[#14181F] bg-white border border-black/14 rounded-lg hover:border-black/30 transition-colors whitespace-nowrap cursor-pointer"
            >
              Browse Books
            </button>
            <button
              type="button"
              onClick={() => onNavigate('listings')}
              className="px-4 py-2 text-sm font-medium text-[#14181F] bg-white border border-black/14 rounded-lg hover:border-black/30 transition-colors whitespace-nowrap cursor-pointer"
            >
              My Listings
            </button>
            <button
              type="button"
              onClick={() => onNavigate('requests')}
              className="px-4 py-2 text-sm font-medium text-[#14181F] bg-white border border-black/14 rounded-lg hover:border-black/30 transition-colors whitespace-nowrap cursor-pointer"
            >
              My Requests
            </button>
            <button
              type="button"
              onClick={() => onNavigate('sell')}
              className="px-4 py-2 text-sm font-medium text-white bg-[#1B5E43] rounded-lg hover:bg-[#154A34] transition-colors whitespace-nowrap cursor-pointer"
            >
              Sell a Book
            </button>
          </div>
        </div>

        {/* Prominent Campus Search Bar */}
        <form onSubmit={handleSearch} className="relative max-w-3xl">
          <Search className="w-4 h-4 text-[#6B7280] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by textbook title, author, course (e.g., MBA, B.Tech CSE), or ISBN..."
            className="w-full pl-11 pr-28 py-3.5 text-sm bg-white border border-black/14 rounded-xl focus:border-[#1B5E43] shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-[#14181F] text-white text-xs font-medium rounded-lg hover:bg-black transition-colors whitespace-nowrap cursor-pointer"
          >
            Search
          </button>
        </form>

        {/* Full-Width 4-Column Tabular KPI Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 border-y border-black/8 divide-y lg:divide-y-0 lg:divide-x divide-black/8 bg-white rounded-xl border">
          <button
            type="button"
            onClick={() => onNavigate('explore')}
            className="p-5 text-left hover:bg-[#F8F7F4]/60 transition-colors cursor-pointer"
          >
            <p className="text-xs text-[#6B7280]">Available Textbooks</p>
            <p className="font-mono-tabular text-2xl font-semibold text-[#14181F] mt-1">
              {availableBooks.length}
            </p>
          </button>
          <button
            type="button"
            onClick={onOpenExchangeOnly}
            className="p-5 text-left hover:bg-[#F8F7F4]/60 transition-colors cursor-pointer"
          >
            <p className="text-xs text-[#6B7280]">Open for Exchange</p>
            <p className="font-mono-tabular text-2xl font-semibold text-[#1B5E43] mt-1">
              {availableBooks.filter((b) => b.exchangeAvailable).length}
            </p>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('listings')}
            className="p-5 text-left hover:bg-[#F8F7F4]/60 transition-colors cursor-pointer"
          >
            <p className="text-xs text-[#6B7280]">Your Active Listings</p>
            <p className="font-mono-tabular text-2xl font-semibold text-[#14181F] mt-1">
              {myActiveListingsCount}
            </p>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('requests')}
            className="p-5 text-left hover:bg-[#F8F7F4]/60 transition-colors cursor-pointer"
          >
            <p className="text-xs text-[#6B7280]">Active Requests</p>
            <p className="font-mono-tabular text-2xl font-semibold text-[#B45309] mt-1">
              {activeRequestsCount}
            </p>
          </button>
        </div>
      </section>

      {/* Real Unread Request Notifications (Only visible when alerts exist) */}
      {unreadNotifications.length > 0 && (
        <section className="bg-white border border-black/10 rounded-xl p-5">
          <div className="flex items-center justify-between gap-4 pb-3 border-b border-black/6">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#14181F]">
              <Bell className="w-4 h-4 text-[#1B5E43]" />
              <span>Campus Request Updates ({unreadNotifications.length})</span>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('requests')}
              className="text-xs font-medium text-[#1B5E43] hover:underline whitespace-nowrap cursor-pointer"
            >
              Open My Requests
            </button>
          </div>
          <div className="divide-y divide-black/6">
            {unreadNotifications.map((item) => (
              <div
                key={item.notificationId}
                className="py-3 flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#14181F]">{item.title}</p>
                  <p className="text-xs text-[#4A5568] mt-0.5 truncate">{item.message}</p>
                </div>
                <button
                  type="button"
                  onClick={() => void markNotificationRead(item.notificationId)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-[#6B7280] hover:text-[#14181F] whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Dismiss</span>
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Featured Textbooks */}
      <section>
        <div className="flex items-baseline justify-between gap-4 mb-6">
          <div>
            <h2 className="font-display text-2xl font-semibold text-[#14181F]">
              Featured on Campus
            </h2>
            <p className="text-sm text-[#6B7280] mt-1">
              High-demand semester editions currently available from peers.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('explore')}
            className="inline-flex items-center gap-1 text-sm font-medium text-[#1B5E43] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>Explore all</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {displayFeatured.length === 0 ? (
          <div className="bg-white border border-black/8 rounded-xl p-10 text-center">
            <p className="text-sm text-[#4A5568]">
              No books are currently listed yet. Be the first student to list a semester textbook.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('sell')}
              className="mt-4 px-5 py-2.5 bg-[#1B5E43] text-white text-sm font-medium rounded-lg hover:bg-[#154A34] cursor-pointer"
            >
              Sell a Book
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayFeatured.map((book) => (
              <BookCard
                key={book.bookId}
                book={book}
                isOwnBook={book.sellerUid === profile.userId}
                hasActiveRequest={activeOutgoingBookIds.has(book.bookId)}
                onSelect={onSelectBook}
              />
            ))}
          </div>
        )}
      </section>

      {/* Academic Categories Directory */}
      <section className="pt-4 border-t border-black/8">
        <div className="mb-6">
          <h2 className="font-display text-2xl font-semibold text-[#14181F]">
            Browse by Academic Subject
          </h2>
          <p className="text-sm text-[#6B7280] mt-1">
            Jump straight into textbooks grouped by department and stream.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => {
            const count = availableBooks.filter((b) => b.category === cat.categoryName).length;
            return (
              <button
                key={cat.categoryId}
                type="button"
                onClick={() => onSelectCategory(cat.categoryName)}
                className="group bg-white border border-black/8 rounded-xl p-5 text-left hover:border-[#1B5E43]/40 transition-colors cursor-pointer"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-display text-base font-semibold text-[#14181F] group-hover:text-[#1B5E43] transition-colors">
                    {cat.categoryName}
                  </h3>
                  <span className="font-mono-tabular text-xs text-[#6B7280] shrink-0">
                    {count} {count === 1 ? 'book' : 'books'}
                  </span>
                </div>
                <p className="text-xs text-[#4A5568] mt-1.5 leading-relaxed line-clamp-2">
                  {cat.description}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Books Available for Exchange & Recently Added */}
      {exchangeBooks.length > 0 && (
        <section className="pt-4 border-t border-black/8">
          <div className="flex items-baseline justify-between gap-4 mb-6">
            <div>
              <h2 className="font-display text-2xl font-semibold text-[#14181F]">
                Available for Peer Exchange
              </h2>
              <p className="text-sm text-[#6B7280] mt-1">
                Swap textbooks directly with fellow students at zero cash outlay.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenExchangeOnly}
              className="inline-flex items-center gap-1 text-sm font-medium text-[#1B5E43] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>View exchange catalogue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {exchangeBooks.map((book) => (
              <BookCard
                key={book.bookId}
                book={book}
                isOwnBook={book.sellerUid === profile.userId}
                hasActiveRequest={activeOutgoingBookIds.has(book.bookId)}
                onSelect={onSelectBook}
              />
            ))}
          </div>
        </section>
      )}

      {recentBooks.length > 0 && (
        <section className="pt-4 border-t border-black/8">
          <div className="flex items-baseline justify-between gap-4 mb-6">
            <div>
              <h2 className="font-display text-2xl font-semibold text-[#14181F]">
                Recently Added
              </h2>
              <p className="text-sm text-[#6B7280] mt-1">
                Fresh listings uploaded by students across campus.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentBooks.map((book) => (
              <BookCard
                key={book.bookId}
                book={book}
                isOwnBook={book.sellerUid === profile.userId}
                hasActiveRequest={activeOutgoingBookIds.has(book.bookId)}
                onSelect={onSelectBook}
              />
            ))}
          </div>
        </section>
      )}
    </main>
  );
};
