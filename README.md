# Draft User Context Issue Reproduction

## 🚀 Quick Start

```bash
git clone https://github.com/YOUR_USERNAME/cap-draft-user-context-issue.git
cd cap-draft-user-context-issue
npm install
npm test
```

**Expected Output:**
- ✅ Test 1: Create draft via OData (passes)
- ❌ Test 2: Query draft programmatically (fails - returns empty array)
- ✅ Test 3: Query draft via OData (passes)

---

## Problem Description

When creating drafts via authenticated OData requests, subsequent programmatic queries using `srv.run()` fail to find those drafts. The root cause is that `srv.run()` defaults to `'anonymous'` user context instead of preserving the authenticated user.

## Expected Behavior

When user 'alice' creates a draft via POST and then queries it programmatically:
- The programmatic query should find the draft created by 'alice'
- Both OData and programmatic queries should use the same user context

## Actual Behavior

- OData POST creates draft with `DraftAdministrativeData.InProcessByUser = 'alice'`
- Programmatic `srv.run()` query uses `InProcessByUser = 'anonymous'`
- Query returns empty result despite draft existing

## SQL Evidence

With `cds.env.log.sql = true`, you can see:

**Draft Creation (works):**
```sql
INSERT INTO my_bookshop_Books_drafts (...) VALUES (...)
INSERT INTO my_bookshop_Books_drafts_DraftAdministrativeData (InProcessByUser, ...) VALUES ('alice', ...)
```

**OData Query (works):**
```sql
SELECT ... FROM my_bookshop_Books_drafts WHERE ID = ? AND DraftAdministrativeData.InProcessByUser = 'alice'
```

**Programmatic Query (fails):**
```sql
SELECT ... FROM my_bookshop_Books_drafts WHERE ID = ? AND DraftAdministrativeData.InProcessByUser = 'anonymous'
```

## The Question

**How do I maintain user context when making programmatic draft queries in SAP CAP?**

The draft was created by user 'alice' via an authenticated OData request. When I query for it programmatically using `srv.run(SELECT.from(Books.drafts))`, CAP filters by `InProcessByUser = 'anonymous'` instead of 'alice', so the query returns no results.

I've tried:
- Using `srv.run()` directly
- Creating a transaction with `srv.tx()`
- Using `srv.tx({ user: new cds.User.Privileged() })`

None preserve the user context from the original HTTP request. What's the correct pattern?

## Test Results

Run `npm test` to see:
- ✅ Test 1: Create draft via OData (passes)
- ❌ Test 2: Query draft programmatically (fails - returns empty array)
- ✅ Test 3: Query draft via OData (passes)

---

## 📁 Project Structure

```
.
├── db/
│   └── schema.cds          # Simple Books entity
├── srv/
│   └── catalog-service.cds # Draft-enabled CatalogService
├── test/
│   └── draft-context.test.js # Test demonstrating the issue
├── package.json
├── jest.config.js
└── README.md
```

---

## Environment

- @sap/cds: ^9
- Node.js: v18+
- Test framework: Jest with @cap-js/cds-test
