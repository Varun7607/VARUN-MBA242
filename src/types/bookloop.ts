import { Timestamp } from 'firebase/firestore';

export type BookCondition = 'Like New' | 'Very Good' | 'Good' | 'Acceptable';

export type AvailabilityStatus =
  | 'Available'
  | 'Requested'
  | 'Sold'
  | 'Exchanged'
  | 'Donated'
  | 'Inactive';

export type RequestType = 'Purchase' | 'Exchange' | 'Donation';

export type RequestStatus =
  | 'Pending'
  | 'Accepted'
  | 'Rejected'
  | 'Completed'
  | 'Cancelled';

export type NavSection =
  | 'home'
  | 'explore'
  | 'sell'
  | 'listings'
  | 'requests'
  | 'profile';

export interface UserProfile {
  userId: string;
  studentName: string;
  email: string;
  studentId: string;
  college: string;
  course: string;
  semester: string;
  contactNumber: string;
  profilePhoto: string;
  userStatus: 'Active' | 'Inactive';
  registrationDate: Timestamp;
  updatedAt: Timestamp;
}

export interface Category {
  categoryId: string;
  categoryName: string;
  description: string;
  active: boolean;
  createdAt?: Timestamp;
}

export interface Book {
  bookId: string;
  bookTitle: string;
  author: string;
  isbn: string;
  category: string;
  course: string;
  semester: string;
  edition: string;
  publisher: string;
  description: string;
  condition: BookCondition;
  originalPrice: number;
  sellingPrice: number;
  exchangeAvailable: boolean;
  donationAvailable: boolean;
  bookImage: string;
  sellerUid: string;
  sellerName: string;
  sellerCollege: string;
  sellerCourse: string;
  availabilityStatus: AvailabilityStatus;
  featured: boolean;
  completedRequestId: string;
  listingDate: Timestamp;
  updatedAt: Timestamp;
}

export interface BookRequest {
  requestId: string;
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  buyerUid: string;
  buyerName: string;
  buyerEmail: string;
  buyerContact: string;
  buyerCourse: string;
  sellerUid: string;
  sellerName: string;
  sellerEmail: string;
  sellerContact: string;
  meetupNote: string;
  requestType: RequestType;
  requestMessage: string;
  proposedPrice: number;
  requestStatus: RequestStatus;
  buyerConfirmed: boolean;
  sellerConfirmed: boolean;
  requestDate: Timestamp;
  updatedAt: Timestamp;
}

export interface Transaction {
  transactionId: string;
  requestId: string;
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  buyerUid: string;
  buyerName: string;
  buyerEmail: string;
  sellerUid: string;
  sellerName: string;
  sellerEmail: string;
  transactionType: RequestType;
  finalPrice: number;
  transactionStatus: 'Completed';
  transactionDate: Timestamp;
}

export interface NotificationItem {
  notificationId: string;
  recipientUid: string;
  senderUid: string;
  requestId: string;
  bookId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: Timestamp;
}

export interface BookFormValues {
  bookTitle: string;
  author: string;
  isbn: string;
  category: string;
  course: string;
  semester: string;
  edition: string;
  publisher: string;
  description: string;
  condition: BookCondition;
  originalPrice: number;
  sellingPrice: number;
  exchangeAvailable: boolean;
  donationAvailable: boolean;
  bookImage: string;
}

export interface ProfileFormValues {
  studentName: string;
  studentId: string;
  college: string;
  course: string;
  semester: string;
  contactNumber: string;
  profilePhoto: string;
}

// Validation limits synchronized verbatim with firebase-blueprint.json
export const FIELD_LIMITS = {
  studentName: 100,
  studentId: 40,
  college: 120,
  course: 80,
  semester: 30,
  contactNumberMin: 7,
  contactNumberMax: 20,
  bookTitle: 160,
  author: 120,
  isbn: 30,
  category: 80,
  edition: 40,
  publisher: 100,
  description: 1000,
  requestMessage: 500,
  meetupNote: 300,
  imageMaxChars: 120000,
  priceMax: 50000,
} as const;

export const BOOK_CONDITIONS: BookCondition[] = [
  'Like New',
  'Very Good',
  'Good',
  'Acceptable',
];

export const AVAILABILITY_STATUSES: AvailabilityStatus[] = [
  'Available',
  'Requested',
  'Sold',
  'Exchanged',
  'Donated',
  'Inactive',
];

export const COURSES = [
  'MBA',
  'BBA',
  'B.Tech CSE',
  'B.Tech ECE',
  'BCA',
  'MCA',
  'B.Com (Hons)',
  'BA LLB',
  'B.Sc Agriculture',
  'B.Pharm',
  'M.Sc Data Science',
  'Other',
];

export const SEMESTERS = [
  'Semester 1',
  'Semester 2',
  'Semester 3',
  'Semester 4',
  'Semester 5',
  'Semester 6',
  'Semester 7',
  'Semester 8',
];

export const COLLEGES_DEHRADUN = [
  'DBS Global University, Dehradun',
  'UPES, Dehradun',
  'Graphic Era University, Dehradun',
  'DIT University, Dehradun',
  'Uttaranchal University, Dehradun',
  'Doon University, Dehradun',
  'Other Campus',
];

export const DEFAULT_CATEGORIES: Category[] = [
  {
    categoryId: 'CAT-MGMT',
    categoryName: 'Management & Finance',
    description: 'Marketing, corporate finance, organizational behavior, economics, and strategy texts.',
    active: true,
  },
  {
    categoryId: 'CAT-CS',
    categoryName: 'Computer Science & IT',
    description: 'Data structures, algorithms, operating systems, DBMS, and software engineering.',
    active: true,
  },
  {
    categoryId: 'CAT-COMM',
    categoryName: 'Commerce & Accounting',
    description: 'Financial accounting, taxation, auditing, business law, and quantitative methods.',
    active: true,
  },
  {
    categoryId: 'CAT-ENG',
    categoryName: 'Engineering & Sciences',
    description: 'Engineering mathematics, physics, digital electronics, and applied sciences.',
    active: true,
  },
  {
    categoryId: 'CAT-LAW',
    categoryName: 'Law & Humanities',
    description: 'Constitutional law, contract law, jurisprudence, communication, and ethics.',
    active: true,
  },
  {
    categoryId: 'CAT-PREP',
    categoryName: 'Competitive & Entrance',
    description: 'CAT, GATE, UGC-NET, placement aptitude, and quantitative reasoning guides.',
    active: true,
  },
];

export interface SeedBookTemplate {
  bookId: string;
  bookTitle: string;
  author: string;
  isbn: string;
  category: string;
  course: string;
  semester: string;
  edition: string;
  publisher: string;
  description: string;
  condition: BookCondition;
  originalPrice: number;
  sellingPrice: number;
  exchangeAvailable: boolean;
  donationAvailable: boolean;
  sellerUid: string;
  sellerName: string;
  sellerCollege: string;
  sellerCourse: string;
  featured: boolean;
  peerEmail: string;
  peerContact: string;
  peerMeetupHint: string;
}

export const SEED_CAMPUS_BOOKS: SeedBookTemplate[] = [
  {
    bookId: 'BK-DGU101',
    bookTitle: 'Marketing Management',
    author: 'Philip Kotler & Kevin Lane Keller',
    isbn: '978-9332557185',
    category: 'Management & Finance',
    course: 'MBA',
    semester: 'Semester 1',
    edition: '15th Edition',
    publisher: 'Pearson Education',
    description: 'Clean copy used for MBA Sem 1 at DBS Global University. Light pencil notes on Chapter 4 case studies; binding completely intact.',
    condition: 'Like New',
    originalPrice: 895,
    sellingPrice: 380,
    exchangeAvailable: true,
    donationAvailable: false,
    sellerUid: 'dgu-peer-aarav',
    sellerName: 'Aarav Rawat',
    sellerCollege: 'DBS Global University, Dehradun',
    sellerCourse: 'MBA',
    featured: true,
    peerEmail: 'aarav.rawat.mba@dgu.ac.in',
    peerContact: '+91 98971 42018',
    peerMeetupHint: 'Meet outside DGU Central Library Reading Room between 1:30 PM and 3:00 PM.',
  },
  {
    bookId: 'BK-DGU102',
    bookTitle: 'Introduction to Algorithms',
    author: 'Thomas H. Cormen, Charles E. Leiserson',
    isbn: '978-8120340077',
    category: 'Computer Science & IT',
    course: 'B.Tech CSE',
    semester: 'Semester 4',
    edition: '3rd Edition (Eastern Economy)',
    publisher: 'PHI Learning',
    description: 'Essential CLRS edition for Design & Analysis of Algorithms. Slight wear on spine corners, zero torn pages. Open to exchange for Operating Systems by Silberschatz.',
    condition: 'Very Good',
    originalPrice: 995,
    sellingPrice: 440,
    exchangeAvailable: true,
    donationAvailable: false,
    sellerUid: 'dgu-peer-meera',
    sellerName: 'Meera Negi',
    sellerCollege: 'DBS Global University, Dehradun',
    sellerCourse: 'B.Tech CSE',
    featured: true,
    peerEmail: 'meera.negi.cse@dgu.ac.in',
    peerContact: '+91 97604 88123',
    peerMeetupHint: 'Available near Academic Block B Ground Floor after 4:00 PM.',
  },
  {
    bookId: 'BK-DGU103',
    bookTitle: 'Financial Management: Theory & Practice',
    author: 'Prasanna Chandra',
    isbn: '978-9353166526',
    category: 'Management & Finance',
    course: 'MBA',
    semester: 'Semester 2',
    edition: '10th Edition',
    publisher: 'McGraw Hill India',
    description: 'Complete corporate finance reference with solved numerical sets. Highlighted key formulas in capital budgeting chapters.',
    condition: 'Very Good',
    originalPrice: 825,
    sellingPrice: 320,
    exchangeAvailable: true,
    donationAvailable: false,
    sellerUid: 'dgu-peer-rohan',
    sellerName: 'Rohan Bisht',
    sellerCollege: 'DBS Global University, Dehradun',
    sellerCourse: 'MBA',
    featured: true,
    peerEmail: 'rohan.bisht.mba@dgu.ac.in',
    peerContact: '+91 94120 65309',
    peerMeetupHint: 'Meet at Campus Cafeteria Courtyard during lunch break (1:00 PM).',
  },
  {
    bookId: 'BK-DGU104',
    bookTitle: 'Database System Concepts',
    author: 'Abraham Silberschatz, Henry F. Korth',
    isbn: '978-9332901384',
    category: 'Computer Science & IT',
    course: 'BCA',
    semester: 'Semester 3',
    edition: '6th Edition',
    publisher: 'McGraw Hill Education',
    description: 'Covers ER modeling, normalization, SQL queries, and transaction concurrency. Great condition with plastic protective jacket.',
    condition: 'Good',
    originalPrice: 780,
    sellingPrice: 290,
    exchangeAvailable: true,
    donationAvailable: false,
    sellerUid: 'dgu-peer-priyanshi',
    sellerName: 'Priyanshi Joshi',
    sellerCollege: 'DBS Global University, Dehradun',
    sellerCourse: 'BCA',
    featured: false,
    peerEmail: 'priyanshi.joshi.bca@dgu.ac.in',
    peerContact: '+91 81265 39014',
    peerMeetupHint: 'Handover near Computer Lab Wing, 2nd Floor.',
  },
  {
    bookId: 'BK-DGU105',
    bookTitle: 'Organizational Behavior',
    author: 'Stephen P. Robbins, Timothy A. Judge',
    isbn: '978-9353067038',
    category: 'Management & Finance',
    course: 'BBA',
    semester: 'Semester 2',
    edition: '18th Edition',
    publisher: 'Pearson India',
    description: 'Passing this along to a junior student! Completely readable with a few sticky notes summarizing exam frameworks. Available for donation or nominal buy.',
    condition: 'Good',
    originalPrice: 720,
    sellingPrice: 180,
    exchangeAvailable: true,
    donationAvailable: true,
    sellerUid: 'dgu-peer-kabir',
    sellerName: 'Kabir Verma',
    sellerCollege: 'DBS Global University, Dehradun',
    sellerCourse: 'BBA',
    featured: false,
    peerEmail: 'kabir.verma.bba@dgu.ac.in',
    peerContact: '+91 75009 21844',
    peerMeetupHint: 'Happy to hand it over at Main Gate Book Drop Bench around 3:30 PM.',
  },
  {
    bookId: 'BK-DGU106',
    bookTitle: 'Corporate Accounting',
    author: 'S.N. Maheshwari & S.K. Maheshwari',
    isbn: '978-9352595617',
    category: 'Commerce & Accounting',
    course: 'B.Com (Hons)',
    semester: 'Semester 3',
    edition: '6th Edition',
    publisher: 'Vikas Publishing',
    description: 'Updated with Companies Act schedules and solved balance sheet problems. Barely used as I mostly studied from class slides.',
    condition: 'Like New',
    originalPrice: 650,
    sellingPrice: 260,
    exchangeAvailable: false,
    donationAvailable: false,
    sellerUid: 'dgu-peer-ananya',
    sellerName: 'Ananya Sharma',
    sellerCollege: 'DBS Global University, Dehradun',
    sellerCourse: 'B.Com (Hons)',
    featured: false,
    peerEmail: 'ananya.sharma.bcom@dgu.ac.in',
    peerContact: '+91 96342 77810',
    peerMeetupHint: 'Meet at Commerce Block Reception at 11:30 AM.',
  },
  {
    bookId: 'BK-DGU107',
    bookTitle: 'Higher Engineering Mathematics',
    author: 'B.S. Grewal',
    isbn: '978-8193328491',
    category: 'Engineering & Sciences',
    course: 'B.Tech CSE',
    semester: 'Semester 1',
    edition: '44th Edition',
    publisher: 'Khanna Publishers',
    description: 'Standard first-year engineering math companion covering calculus, differential equations, and Laplace transforms. Donating free to first-year students who need it.',
    condition: 'Acceptable',
    originalPrice: 740,
    sellingPrice: 0,
    exchangeAvailable: false,
    donationAvailable: true,
    sellerUid: 'dgu-peer-devansh',
    sellerName: 'Devansh Pant',
    sellerCollege: 'DBS Global University, Dehradun',
    sellerCourse: 'B.Tech CSE',
    featured: false,
    peerEmail: 'devansh.pant.cse@dgu.ac.in',
    peerContact: '+91 89791 54022',
    peerMeetupHint: 'Pick up near Boys Hostel Block A Common Area after 5:00 PM.',
  },
  {
    bookId: 'BK-DGU108',
    bookTitle: 'Constitutional Law of India',
    author: 'J.N. Pandey',
    isbn: '978-9388267403',
    category: 'Law & Humanities',
    course: 'BA LLB',
    semester: 'Semester 4',
    edition: '59th Edition',
    publisher: 'Central Law Agency',
    description: 'Includes landmark Supreme Court case digests and constitutional amendments. Clean margins, great for semester prep and moot courts.',
    condition: 'Very Good',
    originalPrice: 695,
    sellingPrice: 310,
    exchangeAvailable: true,
    donationAvailable: false,
    sellerUid: 'dgu-peer-ishita',
    sellerName: 'Ishita Chauhan',
    sellerCollege: 'DBS Global University, Dehradun',
    sellerCourse: 'BA LLB',
    featured: false,
    peerEmail: 'ishita.chauhan.law@dgu.ac.in',
    peerContact: '+91 90128 33490',
    peerMeetupHint: 'Available at Law School Moot Court Corridor between 2:00 PM and 4:00 PM.',
  },
];

export function formatINR(amount: number): string {
  if (amount <= 0) return 'Free';
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

export function computeDiscountPercent(originalPrice: number, sellingPrice: number): number {
  if (originalPrice <= 0 || sellingPrice >= originalPrice) return 0;
  return Math.round(((originalPrice - sellingPrice) / originalPrice) * 100);
}

export function formatTimestamp(ts?: Timestamp | null): string {
  if (!ts) return 'Just now';
  try {
    const date = ts.toDate();
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return 'Just now';
  }
}
