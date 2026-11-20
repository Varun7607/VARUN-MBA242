import React from 'react';
import { Book, computeDiscountPercent, formatINR } from '../types/bookloop';
import { BookCover } from './BookCover';

interface BookCardProps {
  book: Book;
  isOwnBook: boolean;
  hasActiveRequest?: boolean;
  onSelect: (book: Book) => void;
}

export const BookCard: React.FC<BookCardProps> = ({
  book,
  isOwnBook,
  hasActiveRequest,
  onSelect,
}) => {
  const discount = computeDiscountPercent(book.originalPrice, book.sellingPrice);

  const modes: string[] = [];
  if (book.exchangeAvailable) modes.push('Exchange');
  if (book.donationAvailable) modes.push('Donation');

  return (
    <article
      onClick={() => onSelect(book)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(book);
        }
      }}
      role="button"
      tabIndex={0}
      className="group flex flex-col bg-white rounded-xl border border-black/8 p-4 transition-transform duration-150 ease-out hover:-translate-y-0.5 hover:border-black/18 cursor-pointer text-left"
    >
      {/* 65-75% Visual Weight: Uniform 3:4 Cover */}
      <div className="w-full mb-4">
        <BookCover
          title={book.bookTitle}
          author={book.author}
          category={book.category}
          edition={book.edition}
          publisher={book.publisher}
          imageUrl={book.bookImage}
          size="md"
        />
      </div>

      {/* Quiet 1-line unboxed metadata kicker */}
      <div className="flex items-center gap-1.5 text-xs text-[#6B7280] mb-1.5 truncate">
        <span className="truncate">{book.course}</span>
        <span aria-hidden="true">·</span>
        <span className="shrink-0">{book.semester}</span>
        <span aria-hidden="true">·</span>
        <span className="shrink-0 text-[#14181F] font-medium">{book.condition}</span>
      </div>

      {/* Title & Author */}
      <h3 className="font-display text-base font-semibold text-[#14181F] leading-snug line-clamp-2 group-hover:text-[#1B5E43] transition-colors">
        {book.bookTitle}
      </h3>
      <p className="text-xs text-[#4A5568] mt-1 truncate">{book.author}</p>

      {/* Price Baseline & Exchange/Donation Indicator */}
      <div className="mt-auto pt-4 border-t border-black/6 flex items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <span className="font-mono-tabular text-base font-semibold text-[#14181F]">
            {book.donationAvailable && book.sellingPrice === 0
              ? 'Free'
              : formatINR(book.sellingPrice)}
          </span>
          {book.originalPrice > book.sellingPrice && (
            <span className="font-mono-tabular text-xs text-[#6B7280] line-through">
              {formatINR(book.originalPrice)}
            </span>
          )}
          {discount > 0 && (
            <span className="font-mono-tabular text-xs font-medium text-[#1B5E43]">
              -{discount}%
            </span>
          )}
        </div>
        <span className="text-xs font-medium text-[#1B5E43] shrink-0">
          {book.availabilityStatus}
        </span>
      </div>

      {/* Seller & Quiet Mode Line */}
      <div className="mt-2 flex items-center justify-between gap-2 text-xs text-[#6B7280]">
        <span className="truncate">
          {isOwnBook ? 'Your listing' : `By ${book.sellerName}`}
        </span>
        {hasActiveRequest ? (
          <span className="text-[#B45309] font-medium shrink-0">Requested</span>
        ) : modes.length > 0 ? (
          <span className="text-[#4A5568] shrink-0">{modes.join(' · ')}</span>
        ) : null}
      </div>
    </article>
  );
};
