import React, { useState } from 'react';
import { Edit3, Plus, Trash2 } from 'lucide-react';
import {
  AvailabilityStatus,
  Book,
  BookRequest,
  formatINR,
  formatTimestamp,
} from '../types/bookloop';
import { deleteBookListing, updateBookListing } from '../lib/bookloopService';
import { BookCover } from './BookCover';

interface MyListingsProps {
  myBooks: Book[];
  incomingRequests: BookRequest[];
  onCreateNew: () => void;
  onEditBook: (book: Book) => void;
  onViewRequests: () => void;
}

const TERMINAL_STATUSES: AvailabilityStatus[] = ['Sold', 'Exchanged', 'Donated'];

export const MyListings: React.FC<MyListingsProps> = ({
  myBooks,
  incomingRequests,
  onCreateNew,
  onEditBook,
  onViewRequests,
}) => {
  const [busyBookId, setBusyBookId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'closed'>('all');
  const [feedback, setFeedback] = useState<string | null>(null);

  const filtered = myBooks.filter((book) => {
    if (statusFilter === 'active') {
      return book.availabilityStatus === 'Available' || book.availabilityStatus === 'Requested';
    }
    if (statusFilter === 'closed') {
      return (
        book.availabilityStatus === 'Sold' ||
        book.availabilityStatus === 'Exchanged' ||
        book.availabilityStatus === 'Donated' ||
        book.availabilityStatus === 'Inactive'
      );
    }
    return true;
  });

  const handleStatusChange = async (book: Book, nextStatus: AvailabilityStatus) => {
    setBusyBookId(book.bookId);
    setFeedback(null);
    try {
      await updateBookListing(book.bookId, { availabilityStatus: nextStatus });
      setFeedback(`"${book.bookTitle}" marked as ${nextStatus}.`);
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Could not update listing status.');
    } finally {
      setBusyBookId(null);
    }
  };

  const handleDelete = async (book: Book) => {
    setBusyBookId(book.bookId);
    setFeedback(null);
    try {
      await deleteBookListing(book.bookId);
      setConfirmDeleteId(null);
      setFeedback(`Removed "${book.bookTitle}" from your listings.`);
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Could not delete listing.');
    } finally {
      setBusyBookId(null);
    }
  };

  return (
    <main className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-8 pb-24 md:pb-16">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-black/8">
        <div>
          <h1 className="font-display text-3xl font-semibold text-[#14181F]">
            My Listings
          </h1>
          <p className="text-sm text-[#4A5568] mt-1">
            Manage textbooks you have listed for sale, exchange, or donation. Only you can edit or remove your listings.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="inline-flex items-center p-1 bg-[#EFECE5] rounded-lg">
            {(
              [
                { id: 'all', label: `All (${myBooks.length})` },
                { id: 'active', label: 'Active' },
                { id: 'closed', label: 'Closed' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-white text-[#14181F] shadow-xs'
                    : 'text-[#4A5568] hover:text-[#14181F]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onCreateNew}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1B5E43] text-white text-sm font-medium rounded-lg hover:bg-[#154A34] transition-colors whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Book</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className="mt-5 px-4 py-3 bg-white border border-black/10 rounded-lg text-sm text-[#14181F]">
          {feedback}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="mt-8 bg-white border border-black/8 rounded-xl p-12 text-center">
          <h2 className="font-display text-xl font-semibold text-[#14181F]">
            {myBooks.length === 0 ? 'You have not listed any books yet' : 'No listings in this view'}
          </h2>
          <p className="text-sm text-[#4A5568] mt-1.5 max-w-md mx-auto">
            Upload your previous semester textbooks in under a minute to earn back part of your study expenses or pass them on to juniors.
          </p>
          <button
            type="button"
            onClick={onCreateNew}
            className="mt-5 px-5 py-2.5 bg-[#1B5E43] text-white text-sm font-medium rounded-lg hover:bg-[#154A34] cursor-pointer"
          >
            List Your First Book
          </button>
        </div>
      ) : (
        <div className="mt-6 bg-white border border-black/8 rounded-xl divide-y divide-black/8 overflow-hidden">
          {filtered.map((book) => {
            const bookRequests = incomingRequests.filter((r) => r.bookId === book.bookId);
            const pendingCount = bookRequests.filter((r) => r.requestStatus === 'Pending').length;
            const isTerminal = TERMINAL_STATUSES.includes(book.availabilityStatus);
            const busy = busyBookId === book.bookId;

            return (
              <div
                key={book.bookId}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-5"
              >
                <div className="flex items-start gap-4 min-w-0">
                  <div className="w-16 shrink-0">
                    <BookCover
                      title={book.bookTitle}
                      author={book.author}
                      category={book.category}
                      edition={book.edition}
                      publisher={book.publisher}
                      imageUrl={book.bookImage}
                      size="sm"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#6B7280]">
                      <span className="font-mono-tabular">{book.bookId}</span>
                      <span aria-hidden="true">·</span>
                      <span>{book.course}</span>
                      <span aria-hidden="true">·</span>
                      <span>Listed {formatTimestamp(book.listingDate)}</span>
                    </div>
                    <h2 className="font-display text-lg font-semibold text-[#14181F] mt-1 truncate">
                      {book.bookTitle}
                    </h2>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                      <span className="font-mono-tabular font-semibold text-[#14181F]">
                        {book.donationAvailable && book.sellingPrice === 0
                          ? 'Free'
                          : formatINR(book.sellingPrice)}
                      </span>
                      <span className="text-[#4A5568]">Condition: {book.condition}</span>
                      <span
                        className={`font-medium ${
                          book.availabilityStatus === 'Available'
                            ? 'text-[#1B5E43]'
                            : isTerminal
                              ? 'text-[#4A5568]'
                              : 'text-[#B45309]'
                        }`}
                      >
                        Status: {book.availabilityStatus}
                      </span>
                      <button
                        type="button"
                        onClick={onViewRequests}
                        className="font-mono-tabular text-[#1B5E43] hover:underline cursor-pointer"
                      >
                        {bookRequests.length}{' '}
                        {bookRequests.length === 1 ? 'request' : 'requests'}
                        {pendingCount > 0 ? ` (${pendingCount} pending)` : ''}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Seller Management Controls */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {isTerminal ? (
                    <span className="text-xs text-[#6B7280] font-medium">
                      Completed ({book.availabilityStatus}) · Hidden from catalogue
                    </span>
                  ) : (
                    <>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => onEditBook(book)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#14181F] bg-[#F8F7F4] border border-black/14 rounded-lg hover:bg-[#EFECE5] disabled:opacity-50 whitespace-nowrap cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>

                      {book.availabilityStatus === 'Available' ? (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void handleStatusChange(book, 'Inactive')}
                          className="px-3 py-1.5 text-xs font-medium text-[#4A5568] border border-black/14 rounded-lg hover:text-[#14181F] disabled:opacity-50 whitespace-nowrap cursor-pointer"
                        >
                          Hide (Inactive)
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void handleStatusChange(book, 'Available')}
                          className="px-3 py-1.5 text-xs font-medium text-[#1B5E43] border border-[#1B5E43]/30 rounded-lg hover:bg-[#1B5E43]/5 disabled:opacity-50 whitespace-nowrap cursor-pointer"
                        >
                          Re-list Available
                        </button>
                      )}

                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void handleStatusChange(book, 'Sold')}
                        className="px-3 py-1.5 text-xs font-medium text-[#14181F] border border-black/14 rounded-lg hover:bg-[#F8F7F4] disabled:opacity-50 whitespace-nowrap cursor-pointer"
                      >
                        Mark Sold
                      </button>

                      {confirmDeleteId === book.bookId ? (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void handleDelete(book)}
                            className="px-3 py-1.5 text-xs font-medium text-white bg-[#991B1B] rounded-lg hover:bg-[#7F1D1D] whitespace-nowrap cursor-pointer"
                          >
                            Confirm Delete
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-1.5 text-xs text-[#6B7280] cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => setConfirmDeleteId(book.bookId)}
                          aria-label={`Delete ${book.bookTitle}`}
                          className="p-1.5 text-[#6B7280] hover:text-[#991B1B] rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
};
