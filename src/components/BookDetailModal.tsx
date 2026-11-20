import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, Lock, Send } from 'lucide-react';
import {
  Book,
  BookRequest,
  computeDiscountPercent,
  FIELD_LIMITS,
  formatINR,
  formatTimestamp,
  RequestType,
  UserProfile,
} from '../types/bookloop';
import { createBookRequest } from '../lib/bookloopService';
import { BookCover } from './BookCover';

interface BookDetailModalProps {
  book: Book;
  currentUser: UserProfile;
  existingOutgoingRequests: BookRequest[];
  onClose: () => void;
  onRequestCreated: () => void;
  onGoToMyListings: () => void;
  onGoToMyRequests: () => void;
}

export const BookDetailModal: React.FC<BookDetailModalProps> = ({
  book,
  currentUser,
  existingOutgoingRequests,
  onClose,
  onRequestCreated,
  onGoToMyListings,
  onGoToMyRequests,
}) => {
  const [selectedType, setSelectedType] = useState<RequestType | null>(null);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const isOwnBook = book.sellerUid === currentUser.userId;
  const activeRequest = existingOutgoingRequests.find(
    (req) =>
      req.bookId === book.bookId &&
      (req.requestStatus === 'Pending' || req.requestStatus === 'Accepted')
  );
  const discount = computeDiscountPercent(book.originalPrice, book.sellingPrice);
  const savings = Math.max(0, book.originalPrice - book.sellingPrice);

  const handleOpenComposer = (type: RequestType) => {
    setSelectedType(type);
    setError(null);
    if (!message) {
      if (type === 'Purchase') {
        setMessage(
          `Hi ${book.sellerName}, I'd like to buy "${book.bookTitle}" for ${formatINR(book.sellingPrice)}. Let me know a convenient campus spot to meet.`
        );
      } else if (type === 'Exchange') {
        setMessage(
          `Hi ${book.sellerName}, I'm interested in exchanging a textbook from my semester for "${book.bookTitle}".`
        );
      } else {
        setMessage(
          `Hi ${book.sellerName}, I'm studying ${currentUser.course} (${currentUser.semester}) and would really appreciate receiving "${book.bookTitle}" as a donation.`
        );
      }
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType) return;
    setSubmitting(true);
    setError(null);
    try {
      await createBookRequest(
        book,
        currentUser,
        selectedType,
        message,
        existingOutgoingRequests
      );
      setSubmitted(true);
      onRequestCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px] overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="book-detail-title"
    >
      <div className="min-h-screen px-4 py-8 sm:py-12 flex items-start justify-center">
        <div className="w-full max-w-4xl bg-[#F8F7F4] rounded-2xl border border-black/10 overflow-hidden shadow-xl">
          {/* Modal Top Navigation Bar */}
          <div className="px-6 py-4 bg-white border-b border-black/8 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-2 text-sm font-medium text-[#4A5568] hover:text-[#14181F] transition-colors whitespace-nowrap cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to catalogue</span>
            </button>
            <span className="font-mono-tabular text-xs text-[#6B7280]">
              ID: {book.bookId}
            </span>
          </div>

          <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Left Sticky Cover Column */}
            <div className="md:col-span-5">
              <div className="md:sticky md:top-6">
                <BookCover
                  title={book.bookTitle}
                  author={book.author}
                  category={book.category}
                  edition={book.edition}
                  publisher={book.publisher}
                  imageUrl={book.bookImage}
                  size="lg"
                />
                <div className="mt-4 flex items-center justify-between text-xs text-[#6B7280]">
                  <span>Listed {formatTimestamp(book.listingDate)}</span>
                  <span className="font-medium text-[#1B5E43]">
                    Status: {book.availabilityStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Contiguous Purchase & Metadata Module */}
            <div className="md:col-span-7 flex flex-col">
              {/* Quiet metadata line */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#6B7280] mb-2">
                <span>{book.category}</span>
                <span aria-hidden="true">·</span>
                <span>{book.course}</span>
                <span aria-hidden="true">·</span>
                <span>{book.semester}</span>
              </div>

              <h2
                id="book-detail-title"
                className="font-display text-2xl sm:text-3xl font-semibold text-[#14181F] leading-tight"
                style={{ textWrap: 'balance' }}
              >
                {book.bookTitle}
              </h2>
              <p className="mt-1.5 text-sm text-[#4A5568]">by {book.author}</p>

              {/* Pricing Strip */}
              <div className="mt-6 py-4 border-y border-black/8 flex flex-wrap items-baseline justify-between gap-4">
                <div className="flex items-baseline gap-3">
                  <span className="font-mono-tabular text-3xl font-semibold text-[#14181F]">
                    {book.donationAvailable && book.sellingPrice === 0
                      ? 'Free'
                      : formatINR(book.sellingPrice)}
                  </span>
                  {book.originalPrice > book.sellingPrice && (
                    <span className="font-mono-tabular text-sm text-[#6B7280] line-through">
                      MRP {formatINR(book.originalPrice)}
                    </span>
                  )}
                </div>
                {discount > 0 && (
                  <span className="font-mono-tabular text-sm font-medium text-[#1B5E43]">
                    Save {formatINR(savings)} ({discount}% off)
                  </span>
                )}
              </div>

              {/* Action Controls Module */}
              <div className="mt-6">
                {submitted ? (
                  <div className="bg-white border border-black/10 rounded-xl p-5">
                    <div className="flex items-center gap-2 text-[#1B5E43] font-semibold text-sm">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{selectedType} request sent to {book.sellerName}</span>
                    </div>
                    <p className="text-sm text-[#4A5568] mt-2 leading-relaxed">
                      The seller has been notified. Once they accept your request, their
                      campus contact details and meetup location will appear in My Requests.
                    </p>
                    <div className="mt-4 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onGoToMyRequests();
                        }}
                        className="px-4 py-2 bg-[#1B5E43] text-white text-sm font-medium rounded-lg hover:bg-[#154A34] transition-colors whitespace-nowrap cursor-pointer"
                      >
                        Track in My Requests
                      </button>
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-[#4A5568] hover:text-[#14181F] whitespace-nowrap cursor-pointer"
                      >
                        Keep browsing
                      </button>
                    </div>
                  </div>
                ) : isOwnBook ? (
                  <div className="bg-white border border-black/10 rounded-xl p-4 flex items-center justify-between gap-4">
                    <p className="text-sm text-[#4A5568]">
                      This is your own listing. You cannot request your own book.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onGoToMyListings();
                      }}
                      className="px-4 py-2 text-sm font-medium text-[#1B5E43] border border-[#1B5E43]/30 rounded-lg hover:bg-[#1B5E43]/5 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Manage in My Listings
                    </button>
                  </div>
                ) : activeRequest ? (
                  <div className="bg-white border border-black/10 rounded-xl p-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-[#14181F]">
                        Active {activeRequest.requestType} request ({activeRequest.requestStatus})
                      </p>
                      <p className="text-xs text-[#6B7280] mt-0.5">
                        Duplicate active requests for the same book are disabled.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onGoToMyRequests();
                      }}
                      className="px-4 py-2 text-sm font-medium bg-[#1B5E43] text-white rounded-lg hover:bg-[#154A34] whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      View Request
                    </button>
                  </div>
                ) : book.availabilityStatus !== 'Available' ? (
                  <div className="bg-white border border-black/10 rounded-xl p-4 text-sm text-[#4A5568]">
                    This book is currently marked as <strong>{book.availabilityStatus}</strong> and
                    is no longer open for requests.
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => handleOpenComposer('Purchase')}
                        className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                          selectedType === 'Purchase'
                            ? 'bg-[#154A34] text-white'
                            : 'bg-[#1B5E43] text-white hover:bg-[#154A34]'
                        }`}
                      >
                        Request to Buy
                      </button>

                      {book.exchangeAvailable && (
                        <button
                          type="button"
                          onClick={() => handleOpenComposer('Exchange')}
                          className={`px-5 py-2.5 text-sm font-medium rounded-lg border transition-colors whitespace-nowrap cursor-pointer ${
                            selectedType === 'Exchange'
                              ? 'bg-[#14181F] text-white border-[#14181F]'
                              : 'bg-white text-[#14181F] border-black/18 hover:border-black/40'
                          }`}
                        >
                          Request to Exchange
                        </button>
                      )}

                      {book.donationAvailable && (
                        <button
                          type="button"
                          onClick={() => handleOpenComposer('Donation')}
                          className={`px-5 py-2.5 text-sm font-medium rounded-lg border transition-colors whitespace-nowrap cursor-pointer ${
                            selectedType === 'Donation'
                              ? 'bg-[#14181F] text-white border-[#14181F]'
                              : 'bg-white text-[#14181F] border-black/18 hover:border-black/40'
                          }`}
                        >
                          Request Donation
                        </button>
                      )}
                    </div>

                    {selectedType && (
                      <form
                        onSubmit={handleSubmitRequest}
                        className="mt-4 bg-white border border-black/10 rounded-xl p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-[#14181F]">
                            {selectedType} Request Message
                          </span>
                          <span className="font-mono-tabular text-[#6B7280]">
                            {selectedType === 'Purchase'
                              ? formatINR(book.sellingPrice)
                              : selectedType === 'Exchange'
                                ? 'Book Swap'
                                : 'Free Donation'}
                          </span>
                        </div>
                        <textarea
                          rows={3}
                          maxLength={FIELD_LIMITS.requestMessage}
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Add a brief note for the seller (preferred campus pickup time or book you're offering to exchange)..."
                          className="w-full px-3 py-2 text-sm bg-[#F8F7F4] border border-black/12 rounded-lg focus:bg-white focus:border-[#1B5E43]"
                        />
                        {error && (
                          <p className="text-xs text-[#991B1B]" role="alert">
                            {error}
                          </p>
                        )}
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedType(null)}
                            className="px-3.5 py-2 text-xs font-medium text-[#4A5568] hover:text-[#14181F] cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={submitting}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1B5E43] text-white text-xs font-medium rounded-lg hover:bg-[#154A34] disabled:opacity-60 whitespace-nowrap cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>
                              {submitting ? 'Sending...' : `Send ${selectedType} Request`}
                            </span>
                          </button>
                        </div>
                      </form>
                    )}
                  </>
                )}
              </div>

              {/* Description */}
              {book.description && (
                <div className="mt-7">
                  <h3 className="font-display text-sm font-semibold text-[#14181F] mb-2">
                    Condition Notes & Description
                  </h3>
                  <p className="text-sm text-[#4A5568] leading-relaxed">
                    {book.description}
                  </p>
                </div>
              )}

              {/* Structured Academic Specifications Table */}
              <div className="mt-7 pt-6 border-t border-black/8">
                <h3 className="font-display text-sm font-semibold text-[#14181F] mb-3">
                  Textbook Details
                </h3>
                <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <div>
                    <dt className="text-xs text-[#6B7280]">Condition</dt>
                    <dd className="font-medium text-[#14181F] mt-0.5">{book.condition}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-[#6B7280]">Edition</dt>
                    <dd className="font-medium text-[#14181F] mt-0.5">{book.edition}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-[#6B7280]">Publisher</dt>
                    <dd className="font-medium text-[#14181F] mt-0.5">{book.publisher}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-[#6B7280]">ISBN</dt>
                    <dd className="font-mono-tabular text-xs font-medium text-[#14181F] mt-1">
                      {book.isbn || 'Not provided'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-[#6B7280]">Exchange Available</dt>
                    <dd className="font-medium text-[#14181F] mt-0.5">
                      {book.exchangeAvailable ? 'Yes' : 'No'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-[#6B7280]">Donation Available</dt>
                    <dd className="font-medium text-[#14181F] mt-0.5">
                      {book.donationAvailable ? 'Yes' : 'No'}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Seller Information */}
              <div className="mt-7 pt-6 border-t border-black/8">
                <h3 className="font-display text-sm font-semibold text-[#14181F] mb-2">
                  Campus Seller
                </h3>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-[#14181F]">{book.sellerName}</p>
                    <p className="text-xs text-[#4A5568] mt-0.5">
                      {book.sellerCourse} · {book.sellerCollege}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[#6B7280] shrink-0">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Contact shared on accept</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
