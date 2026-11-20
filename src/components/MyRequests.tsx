import React, { useState } from 'react';
import { CheckCircle2, Mail, Phone, XCircle } from 'lucide-react';
import {
  BookRequest,
  FIELD_LIMITS,
  formatINR,
  formatTimestamp,
  Transaction,
  UserProfile,
} from '../types/bookloop';
import {
  acceptBookRequest,
  cancelBookRequest,
  confirmHandover,
  getSeedPeerMetadata,
  rejectBookRequest,
} from '../lib/bookloopService';
import { ADMIN_EMAIL } from '../lib/firebase';

interface MyRequestsProps {
  profile: UserProfile;
  outgoingRequests: BookRequest[];
  incomingRequests: BookRequest[];
  transactions: Transaction[];
  onExploreBooks: () => void;
}

type RequestsTab = 'outgoing' | 'incoming' | 'transactions';

function statusTone(status: string): string {
  if (status === 'Accepted' || status === 'Completed') return 'text-[#1B5E43]';
  if (status === 'Pending') return 'text-[#B45309]';
  return 'text-[#6B7280]';
}

export const MyRequests: React.FC<MyRequestsProps> = ({
  profile,
  outgoingRequests,
  incomingRequests,
  transactions,
  onExploreBooks,
}) => {
  const [activeTab, setActiveTab] = useState<RequestsTab>(() =>
    incomingRequests.some((r) => r.requestStatus === 'Pending')
      ? 'incoming'
      : 'outgoing'
  );
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [meetupNote, setMeetupNote] = useState(
    'Meet outside DGU Central Library Reading Room between 1:30 PM and 3:00 PM.'
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const isCampusAdmin =
    profile.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const totalBuyerSpend = transactions
    .filter((t) => t.buyerUid === profile.userId)
    .reduce((sum, t) => sum + t.finalPrice, 0);
  const totalSellerEarned = transactions
    .filter((t) => t.sellerUid === profile.userId)
    .reduce((sum, t) => sum + t.finalPrice, 0);

  const handleAccept = async (req: BookRequest) => {
    setBusyId(req.requestId);
    setFeedback(null);
    try {
      await acceptBookRequest(req, profile.email, profile.contactNumber, meetupNote);
      setAcceptingId(null);
      setFeedback(
        `Accepted ${req.buyerName}'s request for "${req.bookTitle}". Your contact details and meetup note have been shared.`
      );
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Failed to accept request.');
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (req: BookRequest) => {
    setBusyId(req.requestId);
    setFeedback(null);
    try {
      await rejectBookRequest(req);
      setFeedback(`Declined request for "${req.bookTitle}".`);
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Failed to decline request.');
    } finally {
      setBusyId(null);
    }
  };

  const handleCancel = async (req: BookRequest) => {
    setBusyId(req.requestId);
    setFeedback(null);
    try {
      await cancelBookRequest(req);
      setFeedback(`Cancelled your request for "${req.bookTitle}".`);
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Failed to cancel request.');
    } finally {
      setBusyId(null);
    }
  };

  const handleConfirm = async (req: BookRequest, role: 'buyer' | 'seller') => {
    setBusyId(req.requestId);
    setFeedback(null);
    try {
      const result = await confirmHandover(req, role);
      if (result.completed) {
        setFeedback(
          `Handover mutually confirmed! Transaction ${result.transactionId} recorded and "${req.bookTitle}" removed from the available catalogue.`
        );
      } else {
        setFeedback(
          `Your confirmation is recorded for "${req.bookTitle}". Waiting for the other student to confirm completion.`
        );
      }
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Failed to confirm handover.');
    } finally {
      setBusyId(null);
    }
  };

  const handleSimulateSeededSellerAccept = async (req: BookRequest) => {
    const peer = getSeedPeerMetadata(req.sellerUid);
    if (!peer) return;
    setBusyId(req.requestId);
    setFeedback(null);
    try {
      await acceptBookRequest(req, peer.peerEmail, peer.peerContact, peer.peerMeetupHint);
      setFeedback(
        `Campus pilot seller (${peer.sellerName}) accepted your request. Contact details and campus meetup note are now unlocked.`
      );
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Simulation action failed.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <main className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-8 pb-24 md:pb-16">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-black/8">
        <div>
          <h1 className="font-display text-3xl font-semibold text-[#14181F]">
            Requests & Transactions
          </h1>
          <p className="text-sm text-[#4A5568] mt-1">
            Coordinate campus handovers, respond to fellow students, and review your completed exchanges.
          </p>
        </div>

        {/* Segmented Control for Outgoing / Incoming / Transaction History */}
        <div
          className="inline-flex items-center p-1 bg-[#EFECE5] rounded-lg self-start md:self-auto"
          role="tablist"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'outgoing'}
            onClick={() => setActiveTab('outgoing')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'outgoing'
                ? 'bg-white text-[#14181F] shadow-xs'
                : 'text-[#4A5568] hover:text-[#14181F]'
            }`}
          >
            Outgoing ({outgoingRequests.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'incoming'}
            onClick={() => setActiveTab('incoming')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'incoming'
                ? 'bg-white text-[#14181F] shadow-xs'
                : 'text-[#4A5568] hover:text-[#14181F]'
            }`}
          >
            Incoming ({incomingRequests.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'transactions'}
            onClick={() => setActiveTab('transactions')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'transactions'
                ? 'bg-white text-[#14181F] shadow-xs'
                : 'text-[#4A5568] hover:text-[#14181F]'
            }`}
          >
            Transactions ({transactions.length})
          </button>
        </div>
      </div>

      {feedback && (
        <div className="mt-5 px-4 py-3 bg-white border border-black/12 rounded-lg text-sm text-[#14181F]">
          {feedback}
        </div>
      )}

      {/* TAB 1: OUTGOING REQUESTS */}
      {activeTab === 'outgoing' && (
        <section className="mt-6 space-y-4">
          {outgoingRequests.length === 0 ? (
            <div className="bg-white border border-black/8 rounded-xl p-12 text-center">
              <h2 className="font-display text-xl font-semibold text-[#14181F]">
                No outgoing requests yet
              </h2>
              <p className="text-sm text-[#4A5568] mt-1.5 max-w-md mx-auto">
                Browse the campus catalogue and send a purchase, exchange, or donation request to connect with a seller.
              </p>
              <button
                type="button"
                onClick={onExploreBooks}
                className="mt-5 px-5 py-2.5 bg-[#1B5E43] text-white text-sm font-medium rounded-lg hover:bg-[#154A34] cursor-pointer"
              >
                Explore Books
              </button>
            </div>
          ) : (
            outgoingRequests.map((req) => {
              const busy = busyId === req.requestId;
              const isSeededPeer =
                isCampusAdmin && req.sellerUid.startsWith('dgu-peer-');

              return (
                <article
                  key={req.requestId}
                  className="bg-white border border-black/8 rounded-xl p-5 sm:p-6 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#6B7280]">
                        <span className="font-mono-tabular">{req.requestId}</span>
                        <span aria-hidden="true">·</span>
                        <span>{req.requestType}</span>
                        <span aria-hidden="true">·</span>
                        <span>Sent {formatTimestamp(req.requestDate)}</span>
                      </div>
                      <h2 className="font-display text-xl font-semibold text-[#14181F] mt-1">
                        {req.bookTitle}
                      </h2>
                      <p className="text-xs text-[#4A5568] mt-0.5">
                        {req.bookAuthor} · Seller: <strong className="text-[#14181F]">{req.sellerName}</strong>
                      </p>
                    </div>

                    <div className="text-left sm:text-right shrink-0">
                      <p className={`text-sm font-semibold ${statusTone(req.requestStatus)}`}>
                        Status: {req.requestStatus}
                      </p>
                      <p className="font-mono-tabular text-sm font-medium text-[#14181F] mt-0.5">
                        {req.requestType === 'Purchase'
                          ? formatINR(req.proposedPrice)
                          : req.requestType}
                      </p>
                    </div>
                  </div>

                  {req.requestMessage && (
                    <p className="text-sm text-[#4A5568] bg-[#F8F7F4] rounded-lg px-4 py-3">
                      Your note: “{req.requestMessage}”
                    </p>
                  )}

                  {/* Unlocked Seller Coordination Info on Accepted */}
                  {(req.requestStatus === 'Accepted' || req.requestStatus === 'Completed') && (
                    <div className="pt-4 border-t border-black/8 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="flex items-center gap-2 text-[#14181F]">
                          <Mail className="w-3.5 h-3.5 text-[#1B5E43] shrink-0" />
                          <span className="font-mono-tabular">{req.sellerEmail}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[#14181F]">
                          <Phone className="w-3.5 h-3.5 text-[#1B5E43] shrink-0" />
                          <span className="font-mono-tabular">{req.sellerContact}</span>
                        </div>
                      </div>
                      {req.meetupNote && (
                        <p className="text-xs text-[#4A5568]">
                          <strong className="text-[#14181F]">Campus Meetup Note:</strong>{' '}
                          {req.meetupNote}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-xs text-[#4A5568]">
                        <span>
                          Buyer Confirmed:{' '}
                          <strong className="text-[#14181F]">
                            {req.buyerConfirmed ? 'Yes' : 'Pending'}
                          </strong>
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>
                          Seller Confirmed:{' '}
                          <strong className="text-[#14181F]">
                            {req.sellerConfirmed ? 'Yes' : 'Pending'}
                          </strong>
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Buyer Actions */}
                  <div className="pt-3 border-t border-black/6 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {req.requestStatus === 'Pending' && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void handleCancel(req)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#991B1B] border border-[#991B1B]/25 rounded-lg hover:bg-[#991B1B]/5 disabled:opacity-50 whitespace-nowrap cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Cancel Request</span>
                        </button>
                      )}

                      {req.requestStatus === 'Accepted' && !req.buyerConfirmed && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void handleConfirm(req, 'buyer')}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1B5E43] text-white text-xs font-medium rounded-lg hover:bg-[#154A34] disabled:opacity-50 whitespace-nowrap cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Confirm Book Received</span>
                        </button>
                      )}

                      {req.requestStatus === 'Accepted' && req.buyerConfirmed && !req.sellerConfirmed && (
                        <span className="text-xs font-medium text-[#1B5E43]">
                          You confirmed handover — waiting for {req.sellerName} to confirm.
                        </span>
                      )}
                    </div>

                    {/* Campus Pilot Helper strictly for seeded peer listings */}
                    {isSeededPeer && req.requestStatus === 'Pending' && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void handleSimulateSeededSellerAccept(req)}
                        className="px-3.5 py-1.5 text-xs font-medium text-[#14181F] bg-[#EFECE5] rounded-lg hover:bg-[#E4E0D6] disabled:opacity-50 whitespace-nowrap cursor-pointer"
                      >
                        Campus Pilot: Simulate Seller Accept
                      </button>
                    )}

                    {isSeededPeer && req.requestStatus === 'Accepted' && !req.sellerConfirmed && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void handleConfirm(req, 'seller')}
                        className="px-3.5 py-1.5 text-xs font-medium text-[#14181F] bg-[#EFECE5] rounded-lg hover:bg-[#E4E0D6] disabled:opacity-50 whitespace-nowrap cursor-pointer"
                      >
                        Campus Pilot: Simulate Seller Confirm
                      </button>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </section>
      )}

      {/* TAB 2: INCOMING REQUESTS */}
      {activeTab === 'incoming' && (
        <section className="mt-6 space-y-4">
          {incomingRequests.length === 0 ? (
            <div className="bg-white border border-black/8 rounded-xl p-12 text-center">
              <h2 className="font-display text-xl font-semibold text-[#14181F]">
                No incoming requests yet
              </h2>
              <p className="text-sm text-[#4A5568] mt-1.5 max-w-md mx-auto">
                When a student requests to buy, exchange, or receive one of your listed books, their request will appear here immediately.
              </p>
            </div>
          ) : (
            incomingRequests.map((req) => {
              const busy = busyId === req.requestId;
              const isAcceptOpen = acceptingId === req.requestId;

              return (
                <article
                  key={req.requestId}
                  className="bg-white border border-black/8 rounded-xl p-5 sm:p-6 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#6B7280]">
                        <span className="font-mono-tabular">{req.requestId}</span>
                        <span aria-hidden="true">·</span>
                        <span>{req.requestType}</span>
                        <span aria-hidden="true">·</span>
                        <span>Received {formatTimestamp(req.requestDate)}</span>
                      </div>
                      <h2 className="font-display text-xl font-semibold text-[#14181F] mt-1">
                        {req.bookTitle}
                      </h2>
                      <p className="text-xs text-[#4A5568] mt-1">
                        Requested by <strong className="text-[#14181F]">{req.buyerName}</strong> ({req.buyerCourse})
                      </p>
                    </div>

                    <div className="text-left sm:text-right shrink-0">
                      <p className={`text-sm font-semibold ${statusTone(req.requestStatus)}`}>
                        Status: {req.requestStatus}
                      </p>
                      <p className="font-mono-tabular text-sm font-medium text-[#14181F] mt-0.5">
                        {req.requestType === 'Purchase'
                          ? formatINR(req.proposedPrice)
                          : req.requestType}
                      </p>
                    </div>
                  </div>

                  {/* Buyer Contact Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-[#F8F7F4] rounded-lg px-4 py-3">
                    <div className="flex items-center gap-2 text-[#14181F]">
                      <Mail className="w-3.5 h-3.5 text-[#1B5E43] shrink-0" />
                      <span className="font-mono-tabular">{req.buyerEmail}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#14181F]">
                      <Phone className="w-3.5 h-3.5 text-[#1B5E43] shrink-0" />
                      <span className="font-mono-tabular">{req.buyerContact}</span>
                    </div>
                    {req.requestMessage && (
                      <p className="sm:col-span-2 text-sm text-[#4A5568] pt-1 border-t border-black/6">
                        “{req.requestMessage}”
                      </p>
                    )}
                  </div>

                  {/* Accept Composer */}
                  {isAcceptOpen && req.requestStatus === 'Pending' && (
                    <div className="p-4 border border-black/12 rounded-lg space-y-3">
                      <label className="block text-xs font-medium text-[#14181F]">
                        Campus Meetup Note (shared along with your email & phone)
                      </label>
                      <input
                        type="text"
                        maxLength={FIELD_LIMITS.meetupNote}
                        value={meetupNote}
                        onChange={(e) => setMeetupNote(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-black/15 rounded-lg focus:border-[#1B5E43]"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setAcceptingId(null)}
                          className="px-3 py-1.5 text-xs font-medium text-[#4A5568] cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void handleAccept(req)}
                          className="px-4 py-1.5 bg-[#1B5E43] text-white text-xs font-medium rounded-lg hover:bg-[#154A34] disabled:opacity-50 whitespace-nowrap cursor-pointer"
                        >
                          Confirm Accept & Share Contact
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Seller Actions */}
                  {req.requestStatus === 'Pending' && !isAcceptOpen && (
                    <div className="pt-2 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setAcceptingId(req.requestId)}
                        className="px-4 py-2 bg-[#1B5E43] text-white text-xs font-medium rounded-lg hover:bg-[#154A34] disabled:opacity-50 whitespace-nowrap cursor-pointer"
                      >
                        Accept Request
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void handleReject(req)}
                        className="px-4 py-2 text-xs font-medium text-[#991B1B] border border-[#991B1B]/25 rounded-lg hover:bg-[#991B1B]/5 disabled:opacity-50 whitespace-nowrap cursor-pointer"
                      >
                        Reject
                      </button>
                    </div>
                  )}

                  {req.requestStatus === 'Accepted' && (
                    <div className="pt-3 border-t border-black/6 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3 text-xs text-[#4A5568]">
                        <span>
                          Seller Confirmed:{' '}
                          <strong className="text-[#14181F]">
                            {req.sellerConfirmed ? 'Yes' : 'Pending'}
                          </strong>
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>
                          Buyer Confirmed:{' '}
                          <strong className="text-[#14181F]">
                            {req.buyerConfirmed ? 'Yes' : 'Pending'}
                          </strong>
                        </span>
                      </div>

                      {!req.sellerConfirmed ? (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void handleConfirm(req, 'seller')}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1B5E43] text-white text-xs font-medium rounded-lg hover:bg-[#154A34] disabled:opacity-50 whitespace-nowrap cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Confirm Handover Completed</span>
                        </button>
                      ) : (
                        <span className="text-xs font-medium text-[#1B5E43]">
                          Waiting for {req.buyerName} to confirm receipt.
                        </span>
                      )}
                    </div>
                  )}
                </article>
              );
            })
          )}
        </section>
      )}

      {/* TAB 3: TRANSACTION HISTORY (MODULE 9) */}
      {activeTab === 'transactions' && (
        <section className="mt-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 bg-white border border-black/8 rounded-xl divide-y sm:divide-y-0 sm:divide-x divide-black/8">
            <div className="p-5">
              <p className="text-xs text-[#6B7280]">Completed Transactions</p>
              <p className="font-mono-tabular text-2xl font-semibold text-[#14181F] mt-1">
                {transactions.length}
              </p>
            </div>
            <div className="p-5">
              <p className="text-xs text-[#6B7280]">Total Spent on Campus Books</p>
              <p className="font-mono-tabular text-2xl font-semibold text-[#14181F] mt-1">
                {formatINR(totalBuyerSpend)}
              </p>
            </div>
            <div className="p-5">
              <p className="text-xs text-[#6B7280]">Total Recovered from Sales</p>
              <p className="font-mono-tabular text-2xl font-semibold text-[#1B5E43] mt-1">
                {formatINR(totalSellerEarned)}
              </p>
            </div>
          </div>

          {transactions.length === 0 ? (
            <div className="bg-white border border-black/8 rounded-xl p-12 text-center">
              <h2 className="font-display text-xl font-semibold text-[#14181F]">
                No completed transactions yet
              </h2>
              <p className="text-sm text-[#4A5568] mt-1.5 max-w-md mx-auto">
                Transactions are recorded automatically once both buyer and seller confirm book handover on an accepted request.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-black/8 rounded-xl overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-black/8 text-xs text-[#6B7280]">
                    <th className="py-3.5 px-4 font-medium">Transaction ID</th>
                    <th className="py-3.5 px-4 font-medium">Textbook</th>
                    <th className="py-3.5 px-4 font-medium">Role & Counterparty</th>
                    <th className="py-3.5 px-4 font-medium">Type</th>
                    <th className="py-3.5 px-4 font-medium text-right">Final Price</th>
                    <th className="py-3.5 px-4 font-medium">Date</th>
                    <th className="py-3.5 px-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/6 text-sm">
                  {transactions.map((tx) => {
                    const isBuyer = tx.buyerUid === profile.userId;
                    return (
                      <tr key={tx.transactionId}>
                        <td className="py-3.5 px-4 font-mono-tabular text-xs text-[#4A5568] whitespace-nowrap">
                          {tx.transactionId}
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-medium text-[#14181F]">{tx.bookTitle}</p>
                          <p className="text-xs text-[#6B7280] font-mono-tabular">
                            {tx.bookId}
                          </p>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-[#4A5568]">
                          <p className="font-medium text-[#14181F]">
                            {isBuyer ? `Bought from ${tx.sellerName}` : `Sold to ${tx.buyerName}`}
                          </p>
                          <p className="font-mono-tabular text-[#6B7280]">
                            {isBuyer ? tx.sellerEmail : tx.buyerEmail}
                          </p>
                        </td>
                        <td className="py-3.5 px-4 text-xs font-medium text-[#14181F] whitespace-nowrap">
                          {tx.transactionType}
                        </td>
                        <td className="py-3.5 px-4 font-mono-tabular font-semibold text-[#14181F] text-right whitespace-nowrap">
                          {tx.transactionType === 'Purchase'
                            ? formatINR(tx.finalPrice)
                            : '₹0'}
                        </td>
                        <td className="py-3.5 px-4 font-mono-tabular text-xs text-[#4A5568] whitespace-nowrap">
                          {formatTimestamp(tx.transactionDate)}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-semibold text-[#1B5E43] whitespace-nowrap">
                          {tx.transactionStatus}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </main>
  );
};
