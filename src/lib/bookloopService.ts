import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  AvailabilityStatus,
  Book,
  BookFormValues,
  BookRequest,
  DEFAULT_CATEGORIES,
  FIELD_LIMITS,
  ProfileFormValues,
  RequestType,
  SEED_CAMPUS_BOOKS,
  UserProfile,
} from '../types/bookloop';
import { ADMIN_EMAIL, db, handleFirestoreError, OperationType } from './firebase';

function generateEntityId(prefix: string): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${stamp}${rand}`.replace(/[^a-zA-Z0-9_-]/g, '');
}

function clampString(value: string, maxLen: number): string {
  return value.trim().slice(0, maxLen);
}

function clampPrice(value: number, allowZero: boolean): number {
  const numeric = Number.isFinite(value) ? Math.round(value) : 0;
  const minVal = allowZero ? 0 : 1;
  return Math.max(minVal, Math.min(FIELD_LIMITS.priceMax, numeric));
}

export async function compressImageFile(file: File, maxDimension = 540): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the selected image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Selected file is not a valid image.'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > height && width > maxDimension) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else if (height >= width && height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable.'));
          return;
        }
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        let quality = 0.78;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);
        while (dataUrl.length > FIELD_LIMITS.imageMaxChars && quality > 0.3) {
          quality -= 0.12;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }
        if (dataUrl.length > FIELD_LIMITS.imageMaxChars) {
          reject(new Error('Image is too large even after compression. Please pick a smaller photo.'));
          return;
        }
        resolve(dataUrl);
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export async function saveUserProfile(
  uid: string,
  email: string,
  values: ProfileFormValues,
  isNewProfile: boolean
): Promise<void> {
  const path = `users/${uid}`;
  const docRef = doc(db, 'users', uid);

  const sanitizedContact = clampString(values.contactNumber, FIELD_LIMITS.contactNumberMax);
  if (sanitizedContact.length < FIELD_LIMITS.contactNumberMin) {
    throw new Error('Please enter a valid contact number (at least 7 digits).');
  }

  try {
    if (isNewProfile) {
      await setDoc(docRef, {
        userId: uid,
        studentName: clampString(values.studentName, FIELD_LIMITS.studentName),
        email: clampString(email, 150),
        studentId: clampString(values.studentId, FIELD_LIMITS.studentId),
        college: clampString(values.college, FIELD_LIMITS.college),
        course: clampString(values.course, FIELD_LIMITS.course),
        semester: clampString(values.semester, FIELD_LIMITS.semester),
        contactNumber: sanitizedContact,
        profilePhoto: values.profilePhoto.slice(0, FIELD_LIMITS.imageMaxChars),
        userStatus: 'Active',
        registrationDate: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(docRef, {
        studentName: clampString(values.studentName, FIELD_LIMITS.studentName),
        studentId: clampString(values.studentId, FIELD_LIMITS.studentId),
        college: clampString(values.college, FIELD_LIMITS.college),
        course: clampString(values.course, FIELD_LIMITS.course),
        semester: clampString(values.semester, FIELD_LIMITS.semester),
        contactNumber: sanitizedContact,
        profilePhoto: values.profilePhoto.slice(0, FIELD_LIMITS.imageMaxChars),
        userStatus: 'Active',
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, isNewProfile ? OperationType.CREATE : OperationType.UPDATE, path);
  }
}

export async function seedCampusCatalogIfNeeded(userEmail: string | null | undefined): Promise<void> {
  if (!userEmail || userEmail.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return;
  }

  try {
    const existingCats = await getDocs(
      query(collection(db, 'categories'), where('active', '==', true), limit(1))
    );
    if (existingCats.empty) {
      const catBatch = writeBatch(db);
      for (const cat of DEFAULT_CATEGORIES) {
        catBatch.set(doc(db, 'categories', cat.categoryId), {
          categoryId: cat.categoryId,
          categoryName: cat.categoryName,
          description: cat.description,
          active: true,
          createdAt: serverTimestamp(),
        });
      }
      await catBatch.commit();
    }

    const existingBooks = await getDocs(
      query(collection(db, 'books'), where('availabilityStatus', '==', 'Available'), limit(1))
    );
    if (existingBooks.empty) {
      const bookBatch = writeBatch(db);
      for (const item of SEED_CAMPUS_BOOKS) {
        bookBatch.set(doc(db, 'books', item.bookId), {
          bookId: item.bookId,
          bookTitle: item.bookTitle,
          author: item.author,
          isbn: item.isbn,
          category: item.category,
          course: item.course,
          semester: item.semester,
          edition: item.edition,
          publisher: item.publisher,
          description: item.description,
          condition: item.condition,
          originalPrice: item.originalPrice,
          sellingPrice: item.sellingPrice,
          exchangeAvailable: item.exchangeAvailable,
          donationAvailable: item.donationAvailable,
          bookImage: '',
          sellerUid: item.sellerUid,
          sellerName: item.sellerName,
          sellerCollege: item.sellerCollege,
          sellerCourse: item.sellerCourse,
          availabilityStatus: 'Available',
          featured: item.featured,
          completedRequestId: '',
          listingDate: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      await bookBatch.commit();
    }
  } catch (error) {
    console.warn('Campus catalog seed skipped or already initialized:', error);
  }
}

export async function createBookListing(
  profile: UserProfile,
  form: BookFormValues
): Promise<string> {
  const bookId = generateEntityId('BK');
  const path = `books/${bookId}`;

  const originalPrice = clampPrice(form.originalPrice, false);
  const sellingPrice = clampPrice(form.sellingPrice, true);

  try {
    await setDoc(doc(db, 'books', bookId), {
      bookId,
      bookTitle: clampString(form.bookTitle, FIELD_LIMITS.bookTitle),
      author: clampString(form.author, FIELD_LIMITS.author),
      isbn: clampString(form.isbn, FIELD_LIMITS.isbn),
      category: clampString(form.category, FIELD_LIMITS.category),
      course: clampString(form.course, FIELD_LIMITS.course),
      semester: clampString(form.semester, FIELD_LIMITS.semester),
      edition: clampString(form.edition, FIELD_LIMITS.edition),
      publisher: clampString(form.publisher, FIELD_LIMITS.publisher),
      description: clampString(form.description, FIELD_LIMITS.description),
      condition: form.condition,
      originalPrice,
      sellingPrice,
      exchangeAvailable: Boolean(form.exchangeAvailable),
      donationAvailable: Boolean(form.donationAvailable),
      bookImage: form.bookImage.slice(0, FIELD_LIMITS.imageMaxChars),
      sellerUid: profile.userId,
      sellerName: clampString(profile.studentName, FIELD_LIMITS.studentName),
      sellerCollege: clampString(profile.college, FIELD_LIMITS.college),
      sellerCourse: clampString(profile.course, FIELD_LIMITS.course),
      availabilityStatus: 'Available',
      featured: false,
      completedRequestId: '',
      listingDate: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return bookId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateBookListing(
  bookId: string,
  updates: Partial<BookFormValues> & { availabilityStatus?: AvailabilityStatus }
): Promise<void> {
  const path = `books/${bookId}`;
  const payload: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };

  if (updates.bookTitle !== undefined)
    payload.bookTitle = clampString(updates.bookTitle, FIELD_LIMITS.bookTitle);
  if (updates.author !== undefined)
    payload.author = clampString(updates.author, FIELD_LIMITS.author);
  if (updates.isbn !== undefined)
    payload.isbn = clampString(updates.isbn, FIELD_LIMITS.isbn);
  if (updates.category !== undefined)
    payload.category = clampString(updates.category, FIELD_LIMITS.category);
  if (updates.course !== undefined)
    payload.course = clampString(updates.course, FIELD_LIMITS.course);
  if (updates.semester !== undefined)
    payload.semester = clampString(updates.semester, FIELD_LIMITS.semester);
  if (updates.edition !== undefined)
    payload.edition = clampString(updates.edition, FIELD_LIMITS.edition);
  if (updates.publisher !== undefined)
    payload.publisher = clampString(updates.publisher, FIELD_LIMITS.publisher);
  if (updates.description !== undefined)
    payload.description = clampString(updates.description, FIELD_LIMITS.description);
  if (updates.condition !== undefined) payload.condition = updates.condition;
  if (updates.originalPrice !== undefined)
    payload.originalPrice = clampPrice(updates.originalPrice, false);
  if (updates.sellingPrice !== undefined)
    payload.sellingPrice = clampPrice(updates.sellingPrice, true);
  if (updates.exchangeAvailable !== undefined)
    payload.exchangeAvailable = Boolean(updates.exchangeAvailable);
  if (updates.donationAvailable !== undefined)
    payload.donationAvailable = Boolean(updates.donationAvailable);
  if (updates.bookImage !== undefined)
    payload.bookImage = updates.bookImage.slice(0, FIELD_LIMITS.imageMaxChars);
  if (updates.availabilityStatus !== undefined)
    payload.availabilityStatus = updates.availabilityStatus;

  try {
    await updateDoc(doc(db, 'books', bookId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteBookListing(bookId: string): Promise<void> {
  const path = `books/${bookId}`;
  try {
    await deleteDoc(doc(db, 'books', bookId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function createBookRequest(
  book: Book,
  buyerProfile: UserProfile,
  requestType: RequestType,
  requestMessage: string,
  existingOutgoing: BookRequest[]
): Promise<string> {
  if (book.sellerUid === buyerProfile.userId) {
    throw new Error('You cannot submit a request for your own listed book.');
  }

  if (book.availabilityStatus !== 'Available') {
    throw new Error('This book is no longer available for new requests.');
  }

  const duplicate = existingOutgoing.find(
    (req) =>
      req.bookId === book.bookId &&
      (req.requestStatus === 'Pending' || req.requestStatus === 'Accepted')
  );
  if (duplicate) {
    throw new Error('You already have an active request for this book.');
  }

  if (requestType === 'Exchange' && !book.exchangeAvailable) {
    throw new Error('This seller has not enabled book exchange for this listing.');
  }

  if (requestType === 'Donation' && !book.donationAvailable) {
    throw new Error('This listing is not open for donation requests.');
  }

  const requestId = generateEntityId('REQ');
  const notifId = generateEntityId('NTF');
  const proposedPrice =
    requestType === 'Purchase' ? clampPrice(book.sellingPrice, true) : 0;

  const batch = writeBatch(db);
  batch.set(doc(db, 'requests', requestId), {
    requestId,
    bookId: book.bookId,
    bookTitle: clampString(book.bookTitle, FIELD_LIMITS.bookTitle),
    bookAuthor: clampString(book.author, FIELD_LIMITS.author),
    buyerUid: buyerProfile.userId,
    buyerName: clampString(buyerProfile.studentName, FIELD_LIMITS.studentName),
    buyerEmail: clampString(buyerProfile.email, 150),
    buyerContact: clampString(buyerProfile.contactNumber, FIELD_LIMITS.contactNumberMax),
    buyerCourse: clampString(buyerProfile.course, FIELD_LIMITS.course),
    sellerUid: book.sellerUid,
    sellerName: clampString(book.sellerName, FIELD_LIMITS.studentName),
    sellerEmail: '',
    sellerContact: '',
    meetupNote: '',
    requestType,
    requestMessage: clampString(requestMessage, FIELD_LIMITS.requestMessage),
    proposedPrice,
    requestStatus: 'Pending',
    buyerConfirmed: false,
    sellerConfirmed: false,
    requestDate: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  batch.set(doc(db, 'notifications', notifId), {
    notificationId: notifId,
    recipientUid: book.sellerUid,
    senderUid: buyerProfile.userId,
    requestId,
    bookId: book.bookId,
    title: `New ${requestType} Request`,
    message: clampString(
      `${buyerProfile.studentName} requested "${book.bookTitle}" (${requestType}).`,
      300
    ),
    read: false,
    createdAt: serverTimestamp(),
  });

  try {
    await batch.commit();
    return requestId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `requests/${requestId}`);
  }
}

export async function acceptBookRequest(
  request: BookRequest,
  sellerEmail: string,
  sellerContact: string,
  meetupNote: string
): Promise<void> {
  const notifId = generateEntityId('NTF');
  const batch = writeBatch(db);

  batch.update(doc(db, 'requests', request.requestId), {
    requestStatus: 'Accepted',
    sellerEmail: clampString(sellerEmail, 150),
    sellerContact: clampString(sellerContact, FIELD_LIMITS.contactNumberMax),
    meetupNote: clampString(meetupNote, FIELD_LIMITS.meetupNote),
    updatedAt: serverTimestamp(),
  });

  batch.set(doc(db, 'notifications', notifId), {
    notificationId: notifId,
    recipientUid: request.buyerUid,
    senderUid: request.sellerUid,
    requestId: request.requestId,
    bookId: request.bookId,
    title: 'Request Accepted',
    message: clampString(
      `${request.sellerName} accepted your ${request.requestType.toLowerCase()} request for "${request.bookTitle}". View contact details in My Requests.`,
      300
    ),
    read: false,
    createdAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `requests/${request.requestId}`);
  }
}

export async function rejectBookRequest(request: BookRequest): Promise<void> {
  const notifId = generateEntityId('NTF');
  const batch = writeBatch(db);

  batch.update(doc(db, 'requests', request.requestId), {
    requestStatus: 'Rejected',
    updatedAt: serverTimestamp(),
  });

  batch.set(doc(db, 'notifications', notifId), {
    notificationId: notifId,
    recipientUid: request.buyerUid,
    senderUid: request.sellerUid,
    requestId: request.requestId,
    bookId: request.bookId,
    title: 'Request Declined',
    message: clampString(
      `${request.sellerName} declined your request for "${request.bookTitle}". Explore other available campus copies.`,
      300
    ),
    read: false,
    createdAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `requests/${request.requestId}`);
  }
}

export async function cancelBookRequest(request: BookRequest): Promise<void> {
  try {
    await updateDoc(doc(db, 'requests', request.requestId), {
      requestStatus: 'Cancelled',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `requests/${request.requestId}`);
  }
}

export async function confirmHandover(
  request: BookRequest,
  actorRole: 'buyer' | 'seller'
): Promise<{ completed: boolean; transactionId?: string }> {
  const willComplete =
    actorRole === 'buyer' ? request.sellerConfirmed : request.buyerConfirmed;

  const batch = writeBatch(db);
  const reqRef = doc(db, 'requests', request.requestId);

  if (actorRole === 'buyer') {
    batch.update(reqRef, {
      buyerConfirmed: true,
      ...(willComplete ? { requestStatus: 'Completed' } : {}),
      updatedAt: serverTimestamp(),
    });
  } else {
    batch.update(reqRef, {
      sellerConfirmed: true,
      ...(willComplete ? { requestStatus: 'Completed' } : {}),
      updatedAt: serverTimestamp(),
    });
  }

  let transactionId: string | undefined;

  if (willComplete) {
    transactionId = generateEntityId('TX');
    const nextBookStatus: AvailabilityStatus =
      request.requestType === 'Purchase'
        ? 'Sold'
        : request.requestType === 'Exchange'
          ? 'Exchanged'
          : 'Donated';

    batch.set(doc(db, 'transactions', transactionId), {
      transactionId,
      requestId: request.requestId,
      bookId: request.bookId,
      bookTitle: request.bookTitle,
      bookAuthor: request.bookAuthor,
      buyerUid: request.buyerUid,
      buyerName: request.buyerName,
      buyerEmail: request.buyerEmail,
      sellerUid: request.sellerUid,
      sellerName: request.sellerName,
      sellerEmail: request.sellerEmail,
      transactionType: request.requestType,
      finalPrice: request.proposedPrice,
      transactionStatus: 'Completed',
      transactionDate: serverTimestamp(),
    });

    batch.update(doc(db, 'books', request.bookId), {
      availabilityStatus: nextBookStatus,
      completedRequestId: request.requestId,
      updatedAt: serverTimestamp(),
    });

    const notifId = generateEntityId('NTF');
    const recipientUid =
      actorRole === 'buyer' ? request.sellerUid : request.buyerUid;
    const senderUid =
      actorRole === 'buyer' ? request.buyerUid : request.sellerUid;

    batch.set(doc(db, 'notifications', notifId), {
      notificationId: notifId,
      recipientUid,
      senderUid,
      requestId: request.requestId,
      bookId: request.bookId,
      title: 'Exchange Completed',
      message: clampString(
        `Transaction ${transactionId} completed for "${request.bookTitle}". Recorded in Transaction History.`,
        300
      ),
      read: false,
      createdAt: serverTimestamp(),
    });
  }

  try {
    await batch.commit();
    return { completed: willComplete, transactionId };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `requests/${request.requestId}`);
  }
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'notifications', notificationId), {
      read: true,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `notifications/${notificationId}`);
  }
}

export function getSeedPeerMetadata(sellerUid: string) {
  return SEED_CAMPUS_BOOKS.find((b) => b.sellerUid === sellerUid) ?? null;
}
