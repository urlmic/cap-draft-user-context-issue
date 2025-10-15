# CAP Draft User Context - Understanding and Solutions

## 🚀 Quick Start

```bash
git clone https://github.com/YOUR_USERNAME/cap-draft-user-context-issue.git
cd cap-draft-user-context-issue
npm install
npm test
```

**Expected Output:**
- ✅ Test 1: Create draft via OData (passes)
- ✅ Test 2: Query draft with user context (passes)
- ✅ Test 3: Query draft via database layer (passes)
- ✅ Test 4: Query draft via OData (passes)

---

## Understanding Draft User Context in SAP CAP

**Key Insight:** Draft filtering by user is **by design**, not a bug. The service layer automatically filters drafts by the current user for security - users can only see their own drafts (intended for Fiori UI usage).

### The Behavior

When querying drafts via the **service layer** (`srv.run()`), CAP automatically adds:
```sql
WHERE ... AND DraftAdministrativeData.InProcessByUser = '<current-user>'
```

In programmatic/test contexts with no HTTP request, there's **no user context**, so it defaults to `'anonymous'`.

---

## 💡 Solutions

### Option 1: Create User Context (Recommended for Business Logic)

When you need to query drafts in service handlers or business logic, create a transaction with user context:

```javascript
const srv = await cds.connect.to('CatalogService');
const { Books } = srv.entities;

// Create transaction with specific user
const draft = await srv.tx({ user: new cds.User.Privileged({ id: 'alice' }) }, async (tx) => {
  return tx.run(SELECT.from(Books.drafts).where({ ID: draftID }));
});
```

**Use Case:** Service handlers, business logic where you need service-level authorization checks.

### Option 2: Use Database Layer (Access All Drafts)

For administrative tasks or tests where you need to access all drafts regardless of user:

```javascript
const srv = await cds.connect.to('CatalogService');
const { Books } = srv.entities;

// Query directly via database (bypasses service-level user filtering)
// Use service entity for reflection, but query against cds.db
const drafts = await cds.db.run(SELECT.from(Books.drafts).where({ ID: draftID }));
```

**Use Case:** Admin operations, tests, background jobs, cross-user draft queries.

**Important:** Use service entity reflection (`srv.entities`) to get the correct entity reference, but execute the query against `cds.db` to bypass user filtering.

---

## ⚠️ Important Security Note

The service layer's user-based draft filtering is a **security feature**:
- Prevents users from seeing/modifying other users' drafts
- Aligns with Fiori UI expectations
- Enforces data isolation

Only bypass via `cds.db` when you have a legitimate reason (admin, testing, etc.).

## SQL Evidence

With `cds.env.log.sql = true`, you can observe the behavior:

**Draft Creation via OData:**
```sql
INSERT INTO my_bookshop_Books_drafts (...) VALUES (...)
INSERT INTO my_bookshop_Books_drafts_DraftAdministrativeData 
  (InProcessByUser, ...) VALUES ('alice', ...)
```

**Query via Service Layer (with user context):**
```sql
SELECT ... FROM my_bookshop_Books_drafts 
WHERE ID = ? AND DraftAdministrativeData.InProcessByUser = 'alice'
```

**Query via Database Layer (no user filter):**
```sql
SELECT ... FROM my_bookshop_Books_drafts WHERE ID = ?
-- No InProcessByUser filter applied
```

---

## 🎯 When to Use Each Approach

| Scenario | Use | Reason |
|----------|-----|--------|
| Service handler with `req.user` | `req.tx.run()` | Already has user context from HTTP request |
| Background job/cron | `cds.db.run()` | No user context available |
| Admin operations | `cds.db.run()` | Need to access all drafts |
| Testing | Either approach | Depends on what you're testing |
| Cross-user queries | `cds.db.run()` | Service layer filters by user |

---

## Test Results

Run `npm test` to see both approaches working:
- ✅ Test 1: Create draft via OData (passes)
- ✅ Test 2: Query draft with user context (passes)
- ✅ Test 3: Query draft via database layer (passes)
- ✅ Test 4: Query draft via OData (passes)

---

## 📁 Project Structure

```
.
├── db/
│   └── schema.cds          # Simple Books entity
├── srv/
│   └── catalog-service.cds # Draft-enabled CatalogService
├── test/
│   └── draft-context.test.js # Demonstrates both approaches
├── package.json
├── jest.config.js
└── README.md
```

---

## 🎯 Key Takeaways

This repository demonstrates the correct patterns for querying drafts programmatically in SAP CAP.

**Remember:** Draft user filtering is a security feature, not a bug. Choose the right approach:
- **Service layer (`srv.tx()` with user):** When you have/need user context and authorization
- **Database layer (`cds.db`):** When you need all drafts or have no user context

---

## Environment

- @sap/cds: ^9
- Node.js: v18+
- Test framework: Jest with @cap-js/cds-test
- Test framework: Jest with @cap-js/cds-test
