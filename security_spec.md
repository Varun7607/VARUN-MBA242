# BookLoop Security Specification (Phase 0 TDD)

## 1. Data Invariants
1. **PII Isolation**: `/users/{userId}` documents contain private PII (`email`, `contactNumber`, `studentId`). Only the owning authenticated user (`request.auth.uid == userId`) can `get`, `create`, or `update` their own profile. Listing `/users` is globally denied (`allow list: if false`).
2. **Seller Ownership**: Only the original seller (`existing().sellerUid == request.auth.uid`) or a verified campus admin can edit or delete a book listing in `/books/{bookId}`.
3. **Self-Request Prevention**: A student cannot submit a request in `/requests/{requestId}` for their own book (`incoming().buyerUid != incoming().sellerUid`), and the referenced book must exist with matching `sellerUid` and `availabilityStatus == 'Available'`.
4. **Private Request Scoping**: Requests in `/requests/{requestId}` can only be read (`get`/`list`) by `buyerUid` or `sellerUid` (or verified campus admin).
5. **State Machine & Terminal Locking**: Requests start strictly as `Pending` with `buyerConfirmed == false` and `sellerConfirmed == false`. Once a request reaches `Completed`, `Rejected`, or `Cancelled`, no further client updates are permitted.
6. **Atomic Mutual Completion**: A `/transactions/{transactionId}` record can only be created when the linked request transitions to `Completed` in the same atomic batch (`getAfter(...)`), and both buyer and seller have confirmed completion. Transactions are immutable (`allow update, delete: if false`).
7. **Temporal Integrity**: All creation (`registrationDate`, `listingDate`, `requestDate`, `transactionDate`, `createdAt`) and mutation (`updatedAt`) timestamps must strictly match `request.time`.
8. **Zero Shadow Fields & Volumetric Guards**: Every collection enforces exact `hasAll` + `hasOnly` keys, string `.size()` ceilings, valid ID regexes (`^[a-zA-Z0-9_\-]+$`), and verified emails (`request.auth.token.email_verified == true`).

## 2. The "Dirty Dozen" Attack Payloads
1. **PII Cross-Read Attack**: Student B attempts `get(/users/studentA)` -> MUST return `PERMISSION_DENIED`.
2. **Users Collection Scrape**: Any authenticated user attempts `list(/users)` -> MUST return `PERMISSION_DENIED`.
3. **Shadow Field Injection on Profile**: Student A creates `/users/studentA` with extra ghost field `isAdmin: true` -> MUST return `PERMISSION_DENIED`.
4. **Seller Spoofing on Book Create**: Student A creates `/books/BK-SPOOF` with `sellerUid: "studentB"` -> MUST return `PERMISSION_DENIED`.
5. **ID Poisoning on Book Create**: Student A creates `/books/bad id with spaces!!!` -> MUST return `PERMISSION_DENIED`.
6. **Self-Purchase Request Attack**: Student A creates `/requests/REQ-SELF` where `buyerUid == sellerUid == studentA` -> MUST return `PERMISSION_DENIED`.
7. **Orphan Request Attack**: Student B creates `/requests/REQ-ORPHAN` pointing to non-existent `bookId: "BK-DOES-NOT-EXIST"` -> MUST return `PERMISSION_DENIED`.
8. **Request State Shortcutting**: Student B creates `/requests/REQ-SKIP` with `requestStatus: "Completed"` -> MUST return `PERMISSION_DENIED`.
9. **Unauthorized Book Edit**: Student B attempts to update `sellingPrice` on Student A's `/books/BK-1` -> MUST return `PERMISSION_DENIED`.
10. **Terminal Request Tampering**: Student A attempts to change a `Completed` request back to `Pending` -> MUST return `PERMISSION_DENIED`.
11. **Unbacked Transaction Forgery**: Student B creates `/transactions/TX-FAKE` referencing a `Pending` request -> MUST return `PERMISSION_DENIED`.
12. **Unverified Email Spoof**: An account with `email_verified: false` (even with admin email string) attempts to write to `/books` or `/categories` -> MUST return `PERMISSION_DENIED`.
