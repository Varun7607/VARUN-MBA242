/**
 * Phase 0 Security TDD Specification Tests for BookLoop Firestore Rules.
 * Verifies the "Dirty Dozen" adversarial payloads against the Eight Pillars.
 * Run against Firebase Emulator Suite with @firebase/rules-unit-testing.
 */

export interface DirtyDozenCase {
  id: number;
  name: string;
  actorUid: string;
  actorEmail: string;
  emailVerified: boolean;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  path: string;
  payload?: Record<string, unknown>;
  expected: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_CASES: DirtyDozenCase[] = [
  {
    id: 1,
    name: 'PII Cross-Read Attack on /users/{otherUid}',
    actorUid: 'student_b',
    actorEmail: 'studentb@dgu.ac.in',
    emailVerified: true,
    operation: 'get',
    path: '/users/student_a',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Users Collection Blanket Scrape',
    actorUid: 'student_b',
    actorEmail: 'studentb@dgu.ac.in',
    emailVerified: true,
    operation: 'list',
    path: '/users',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Shadow Field Injection (isAdmin: true) on UserProfile',
    actorUid: 'student_a',
    actorEmail: 'studenta@dgu.ac.in',
    emailVerified: true,
    operation: 'create',
    path: '/users/student_a',
    payload: {
      userId: 'student_a',
      studentName: 'Aarav',
      email: 'studenta@dgu.ac.in',
      studentId: '0251MBA001',
      college: 'DBS Global University',
      course: 'MBA',
      semester: 'Semester 2',
      contactNumber: '9876543210',
      profilePhoto: '',
      userStatus: 'Active',
      isAdmin: true,
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Seller UID Spoofing on Book Listing Creation',
    actorUid: 'student_a',
    actorEmail: 'studenta@dgu.ac.in',
    emailVerified: true,
    operation: 'create',
    path: '/books/BK-SPOOF01',
    payload: {
      bookId: 'BK-SPOOF01',
      sellerUid: 'student_b',
      bookTitle: 'Spoofed Book',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Path Variable ID Poisoning with Invalid Characters',
    actorUid: 'student_a',
    actorEmail: 'studenta@dgu.ac.in',
    emailVerified: true,
    operation: 'create',
    path: '/books/invalid id !!! $$$',
    payload: { bookId: 'invalid id !!! $$$' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Self-Request Violation (buyerUid == sellerUid)',
    actorUid: 'student_a',
    actorEmail: 'studenta@dgu.ac.in',
    emailVerified: true,
    operation: 'create',
    path: '/requests/REQ-SELF01',
    payload: {
      requestId: 'REQ-SELF01',
      bookId: 'BK-OWNED1',
      buyerUid: 'student_a',
      sellerUid: 'student_a',
      requestStatus: 'Pending',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Orphan Request Referencing Non-Existent Book',
    actorUid: 'student_b',
    actorEmail: 'studentb@dgu.ac.in',
    emailVerified: true,
    operation: 'create',
    path: '/requests/REQ-ORPHAN',
    payload: {
      requestId: 'REQ-ORPHAN',
      bookId: 'BK-MISSING-999',
      buyerUid: 'student_b',
      sellerUid: 'student_a',
      requestStatus: 'Pending',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'State Shortcutting Request Directly to Completed',
    actorUid: 'student_b',
    actorEmail: 'studentb@dgu.ac.in',
    emailVerified: true,
    operation: 'create',
    path: '/requests/REQ-SKIP01',
    payload: {
      requestId: 'REQ-SKIP01',
      bookId: 'BK-OWNED1',
      buyerUid: 'student_b',
      sellerUid: 'student_a',
      requestStatus: 'Completed',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Unauthorized Price Update by Non-Seller',
    actorUid: 'student_b',
    actorEmail: 'studentb@dgu.ac.in',
    emailVerified: true,
    operation: 'update',
    path: '/books/BK-OWNED1',
    payload: { sellingPrice: 1 },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Terminal State Tampering on Completed Request',
    actorUid: 'student_a',
    actorEmail: 'studenta@dgu.ac.in',
    emailVerified: true,
    operation: 'update',
    path: '/requests/REQ-COMPLETED',
    payload: { requestStatus: 'Pending' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Unbacked Transaction Forgery without Completed Request',
    actorUid: 'student_b',
    actorEmail: 'studentb@dgu.ac.in',
    emailVerified: true,
    operation: 'create',
    path: '/transactions/TX-FORGE01',
    payload: {
      transactionId: 'TX-FORGE01',
      requestId: 'REQ-STILL-PENDING',
      bookId: 'BK-OWNED1',
      buyerUid: 'student_b',
      sellerUid: 'student_a',
      transactionStatus: 'Completed',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Unverified Email Admin Spoofing Attack',
    actorUid: 'attacker_uid',
    actorEmail: 'y68046626@gmail.com',
    emailVerified: false,
    operation: 'create',
    path: '/categories/CAT-SPOOF',
    payload: {
      categoryId: 'CAT-SPOOF',
      categoryName: 'Spoof',
      description: 'Spoof attempt',
      active: true,
    },
    expected: 'PERMISSION_DENIED',
  },
];
