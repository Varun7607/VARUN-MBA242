import { useEffect, useMemo, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from './lib/firebase';
import { seedCampusCatalogIfNeeded } from './lib/bookloopService';
import {
  Book,
  BookRequest,
  Category,
  DEFAULT_CATEGORIES,
  NavSection,
  NotificationItem,
  Transaction,
  UserProfile,
} from './types/bookloop';
import { TopBar } from './components/TopBar';
import { AuthOnboarding } from './components/AuthOnboarding';
import { HomeDashboard } from './components/HomeDashboard';
import { ExploreBooks, ExploreFilters } from './components/ExploreBooks';
import { BookDetailModal } from './components/BookDetailModal';
import { BookListingForm } from './components/BookListingForm';
import { MyListings } from './components/MyListings';
import { MyRequests } from './components/MyRequests';
import { ProfileView } from './components/ProfileView';

const DEFAULT_EXPLORE_FILTERS: ExploreFilters = {
  search: '',
  author: '',
  category: '',
  course: '',
  semester: '',
  condition: '',
  maxPrice: 2000,
  mode: 'all',
  sort: 'newest',
};

export default function App() {
  const [authReady, setAuthReady] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [signingIn, setSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [activeSection, setActiveSection] = useState<NavSection>('home');
  const [exploreFilters, setExploreFilters] = useState<ExploreFilters>(
    DEFAULT_EXPLORE_FILTERS
  );
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [editingBook, setEditingBook] = useState<Book | null>(null);

  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [availableBooks, setAvailableBooks] = useState<Book[]>([]);
  const [myBooks, setMyBooks] = useState<Book[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<BookRequest[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<BookRequest[]>([]);
  const [buyerTransactions, setBuyerTransactions] = useState<Transaction[]>([]);
  const [sellerTransactions, setSellerTransactions] = useState<Transaction[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 1. Observe Firebase Authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setAuthReady(true);
      if (!user) {
        setProfile(null);
        setProfileLoading(false);
        setAvailableBooks([]);
        setMyBooks([]);
        setOutgoingRequests([]);
        setIncomingRequests([]);
        setBuyerTransactions([]);
        setSellerTransactions([]);
        setNotifications([]);
        setSelectedBook(null);
        setEditingBook(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Load current student's private profile document
  useEffect(() => {
    if (!authReady || !firebaseUser) return;
    setProfileLoading(true);
    const profilePath = `users/${firebaseUser.uid}`;
    const unsubscribe = onSnapshot(
      doc(db, 'users', firebaseUser.uid),
      (snapshot) => {
        if (snapshot.exists()) {
          setProfile(snapshot.data() as UserProfile);
        } else {
          setProfile(null);
        }
        setProfileLoading(false);
      },
      (error) => {
        setProfileLoading(false);
        handleFirestoreError(error, OperationType.GET, profilePath);
      }
    );
    return () => unsubscribe();
  }, [authReady, firebaseUser]);

  // 3. Seed campus categories & sample DBS Global University catalog (when admin signs in)
  useEffect(() => {
    if (!authReady || !firebaseUser || !profile) return;
    void seedCampusCatalogIfNeeded(firebaseUser.email);
  }, [authReady, firebaseUser, profile]);

  // 4. Attach real-time Firestore listeners only once authenticated & registered
  useEffect(() => {
    if (!authReady || !firebaseUser || !profile) return;
    const uid = firebaseUser.uid;

    const unsubCategories = onSnapshot(
      query(collection(db, 'categories'), where('active', '==', true)),
      (snap) => {
        if (!snap.empty) {
          const list = snap.docs
            .map((d) => d.data() as Category)
            .sort((a, b) => a.categoryName.localeCompare(b.categoryName));
          setCategories(list);
        } else {
          setCategories(DEFAULT_CATEGORIES);
        }
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'categories')
    );

    const unsubAvailableBooks = onSnapshot(
      query(collection(db, 'books'), where('availabilityStatus', '==', 'Available')),
      (snap) => {
        const list = snap.docs
          .map((d) => d.data() as Book)
          .sort((a, b) => (b.listingDate?.toMillis?.() ?? 0) - (a.listingDate?.toMillis?.() ?? 0));
        setAvailableBooks(list);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'books')
    );

    const unsubMyBooks = onSnapshot(
      query(collection(db, 'books'), where('sellerUid', '==', uid)),
      (snap) => {
        const list = snap.docs
          .map((d) => d.data() as Book)
          .sort((a, b) => (b.listingDate?.toMillis?.() ?? 0) - (a.listingDate?.toMillis?.() ?? 0));
        setMyBooks(list);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, `books?sellerUid=${uid}`)
    );

    const unsubOutgoing = onSnapshot(
      query(collection(db, 'requests'), where('buyerUid', '==', uid)),
      (snap) => {
        const list = snap.docs
          .map((d) => d.data() as BookRequest)
          .sort((a, b) => (b.requestDate?.toMillis?.() ?? 0) - (a.requestDate?.toMillis?.() ?? 0));
        setOutgoingRequests(list);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, `requests?buyerUid=${uid}`)
    );

    const unsubIncoming = onSnapshot(
      query(collection(db, 'requests'), where('sellerUid', '==', uid)),
      (snap) => {
        const list = snap.docs
          .map((d) => d.data() as BookRequest)
          .sort((a, b) => (b.requestDate?.toMillis?.() ?? 0) - (a.requestDate?.toMillis?.() ?? 0));
        setIncomingRequests(list);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, `requests?sellerUid=${uid}`)
    );

    const unsubBuyerTx = onSnapshot(
      query(collection(db, 'transactions'), where('buyerUid', '==', uid)),
      (snap) => {
        setBuyerTransactions(snap.docs.map((d) => d.data() as Transaction));
      },
      (error) => handleFirestoreError(error, OperationType.LIST, `transactions?buyerUid=${uid}`)
    );

    const unsubSellerTx = onSnapshot(
      query(collection(db, 'transactions'), where('sellerUid', '==', uid)),
      (snap) => {
        setSellerTransactions(snap.docs.map((d) => d.data() as Transaction));
      },
      (error) => handleFirestoreError(error, OperationType.LIST, `transactions?sellerUid=${uid}`)
    );

    const unsubNotifications = onSnapshot(
      query(collection(db, 'notifications'), where('recipientUid', '==', uid)),
      (snap) => {
        const list = snap.docs
          .map((d) => d.data() as NotificationItem)
          .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
        setNotifications(list);
      },
      (error) =>
        handleFirestoreError(error, OperationType.LIST, `notifications?recipientUid=${uid}`)
    );

    return () => {
      unsubCategories();
      unsubAvailableBooks();
      unsubMyBooks();
      unsubOutgoing();
      unsubIncoming();
      unsubBuyerTx();
      unsubSellerTx();
      unsubNotifications();
    };
  }, [authReady, firebaseUser, profile]);

  // Keep selectedBook synced with live Firestore data
  useEffect(() => {
    if (!selectedBook) return;
    const latest =
      availableBooks.find((b) => b.bookId === selectedBook.bookId) ??
      myBooks.find((b) => b.bookId === selectedBook.bookId);
    if (latest) {
      setSelectedBook(latest);
    }
  }, [availableBooks, myBooks, selectedBook]);

  // Auto-dismiss transient feedback toast
  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 4500);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const allTransactions = useMemo(() => {
    const map = new Map<string, Transaction>();
    for (const tx of [...buyerTransactions, ...sellerTransactions]) {
      map.set(tx.transactionId, tx);
    }
    return Array.from(map.values()).sort(
      (a, b) => (b.transactionDate?.toMillis?.() ?? 0) - (a.transactionDate?.toMillis?.() ?? 0)
    );
  }, [buyerTransactions, sellerTransactions]);

  const pendingActionableRequests = useMemo(() => {
    const pendingIncoming = incomingRequests.filter(
      (r) => r.requestStatus === 'Pending' || (r.requestStatus === 'Accepted' && !r.sellerConfirmed)
    ).length;
    const acceptedOutgoing = outgoingRequests.filter(
      (r) => r.requestStatus === 'Accepted' && !r.buyerConfirmed
    ).length;
    return pendingIncoming + acceptedOutgoing;
  }, [incomingRequests, outgoingRequests]);

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setAuthError(
        err instanceof Error
          ? err.message
          : 'Sign-in was interrupted. Please try again.'
      );
    } finally {
      setSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setActiveSection('home');
  };

  const handleNavigate = (section: NavSection) => {
    if (section !== 'sell') {
      setEditingBook(null);
    }
    setActiveSection(section);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrimaryTopBarAction = () => {
    if (!firebaseUser) {
      void handleGoogleSignIn();
      return;
    }
    if (!profile) return;
    setEditingBook(null);
    handleNavigate('sell');
  };

  const handleSearchFromHome = (searchText: string) => {
    setExploreFilters({ ...DEFAULT_EXPLORE_FILTERS, search: searchText });
    handleNavigate('explore');
  };

  const handleCategoryFromHome = (categoryName: string) => {
    setExploreFilters({ ...DEFAULT_EXPLORE_FILTERS, category: categoryName });
    handleNavigate('explore');
  };

  const handleExchangeFromHome = () => {
    setExploreFilters({ ...DEFAULT_EXPLORE_FILTERS, mode: 'exchange' });
    handleNavigate('explore');
  };

  const isFullyRegistered = Boolean(firebaseUser && profile);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F7F4] text-[#14181F]">
      <TopBar
        activeSection={activeSection}
        onNavigate={handleNavigate}
        isSignedIn={isFullyRegistered}
        onPrimaryAction={handlePrimaryTopBarAction}
        pendingRequestCount={pendingActionableRequests}
      />

      {!authReady || profileLoading ? (
        <div className="flex-1 flex items-center justify-center p-8">
          <p className="text-sm text-[#4A5568]">Loading BookLoop campus catalogue...</p>
        </div>
      ) : !isFullyRegistered ? (
        <div className="flex-1">
          <AuthOnboarding
            firebaseUser={firebaseUser}
            onGoogleSignIn={handleGoogleSignIn}
            onSignOut={handleSignOut}
            authError={authError}
            signingIn={signingIn}
          />
        </div>
      ) : (
        <div className="flex-1">
          {toastMessage && (
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-5">
              <div
                role="status"
                className="bg-white border border-[#1B5E43]/30 rounded-lg px-4 py-3 text-sm text-[#14181F] flex items-center justify-between gap-4"
              >
                <span>{toastMessage}</span>
                <button
                  type="button"
                  onClick={() => setToastMessage(null)}
                  className="text-xs font-medium text-[#6B7280] hover:text-[#14181F] cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {activeSection === 'home' && profile && (
            <HomeDashboard
              profile={profile}
              availableBooks={availableBooks}
              myBooks={myBooks}
              categories={categories}
              outgoingRequests={outgoingRequests}
              incomingRequests={incomingRequests}
              notifications={notifications}
              onSelectBook={(book) => setSelectedBook(book)}
              onSearchSubmit={handleSearchFromHome}
              onSelectCategory={handleCategoryFromHome}
              onOpenExchangeOnly={handleExchangeFromHome}
              onNavigate={handleNavigate}
            />
          )}

          {activeSection === 'explore' && profile && (
            <ExploreBooks
              availableBooks={availableBooks}
              categories={categories}
              currentUserId={profile.userId}
              outgoingRequests={outgoingRequests}
              filters={exploreFilters}
              onFiltersChange={setExploreFilters}
              onResetFilters={() => setExploreFilters(DEFAULT_EXPLORE_FILTERS)}
              onSelectBook={(book) => setSelectedBook(book)}
            />
          )}

          {activeSection === 'sell' && profile && (
            <BookListingForm
              profile={profile}
              categories={categories}
              editingBook={editingBook}
              onSuccess={(bookId, wasEdit) => {
                setEditingBook(null);
                setToastMessage(
                  wasEdit
                    ? `Updated textbook listing (${bookId}).`
                    : `Published your textbook listing (${bookId}) to the campus catalogue.`
                );
                handleNavigate('listings');
              }}
              onCancel={() => {
                setEditingBook(null);
                handleNavigate(editingBook ? 'listings' : 'home');
              }}
            />
          )}

          {activeSection === 'listings' && profile && (
            <MyListings
              myBooks={myBooks}
              incomingRequests={incomingRequests}
              onCreateNew={() => {
                setEditingBook(null);
                handleNavigate('sell');
              }}
              onEditBook={(book) => {
                setEditingBook(book);
                handleNavigate('sell');
              }}
              onViewRequests={() => handleNavigate('requests')}
            />
          )}

          {activeSection === 'requests' && profile && (
            <MyRequests
              profile={profile}
              outgoingRequests={outgoingRequests}
              incomingRequests={incomingRequests}
              transactions={allTransactions}
              onExploreBooks={() => handleNavigate('explore')}
            />
          )}

          {activeSection === 'profile' && profile && (
            <ProfileView
              profile={profile}
              myBooks={myBooks}
              transactions={allTransactions}
              onSignOut={handleSignOut}
            />
          )}

          {selectedBook && profile && (
            <BookDetailModal
              book={selectedBook}
              currentUser={profile}
              existingOutgoingRequests={outgoingRequests}
              onClose={() => setSelectedBook(null)}
              onRequestCreated={() =>
                setToastMessage(`Request sent for "${selectedBook.bookTitle}".`)
              }
              onGoToMyListings={() => handleNavigate('listings')}
              onGoToMyRequests={() => handleNavigate('requests')}
            />
          )}
        </div>
      )}

      {/* Quiet Editorial Footer */}
      <footer className="border-t border-black/8 bg-white/60 mt-auto pb-16 md:pb-0">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#6B7280]">
          <p>
            <span className="font-display font-semibold text-[#14181F]">BookLoop</span> ·
            Student Book Exchange · DBS Global University, Dehradun
          </p>
          <p>Buy Smart. Sell Easy. Share Knowledge.</p>
        </div>
      </footer>
    </div>
  );
}
