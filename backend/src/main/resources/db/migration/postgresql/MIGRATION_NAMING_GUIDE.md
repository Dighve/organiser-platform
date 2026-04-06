# Flyway Migration Naming Guide

## ⚠️ CRITICAL: Always Check Latest Migration Number First!

Before creating a new migration, **ALWAYS** run this command to find the latest version:

```bash
ls -1 backend/src/main/resources/db/migration/postgresql/V*.sql | tail -1
```

## Current Migration Numbering

**Latest Migration:** V44__insert_test_review_data.sql

**Next Migration Should Be:** V45

**RULE:** Always find the last migration number and add 1 to its version number.

## Naming Convention

Format: `V{VERSION}__{DESCRIPTION}.sql`

Example: `V43__insert_test_review_data.sql`

### Rules:
1. **Version number** must be sequential (V1, V2, V3, etc.)
2. **Two underscores** between version and description
3. **Description** uses underscores for spaces (snake_case)
4. **Extension** must be `.sql`

## How to Find Next Version Number

### Method 1: List all migrations
```bash
cd backend/src/main/resources/db/migration/postgresql
ls -1 V*.sql | sort -V | tail -5
```

### Method 2: Check in IDE
Navigate to: `backend/src/main/resources/db/migration/postgresql/`
Sort files by name
Look at the highest V number

### Method 3: Check Flyway schema history table
```sql
SELECT version, description, installed_on 
FROM flyway_schema_history 
ORDER BY installed_rank DESC 
LIMIT 5;
```

## Common Mistakes to Avoid

❌ **WRONG:** Using an old version number (e.g., V32 when V31 already exists)
✅ **CORRECT:** Always increment from the latest version

❌ **WRONG:** `V32_insert_test_data.sql` (single underscore)
✅ **CORRECT:** `V32__insert_test_data.sql` (double underscore)

❌ **WRONG:** `V32__Insert Test Data.sql` (spaces in description)
✅ **CORRECT:** `V32__insert_test_data.sql` (underscores for spaces)

## Migration History (for reference)

| Version | Description | Date Added |
|---------|-------------|------------|
| V1.1 | Combined schema | Initial |
| V10 | Add user agreement fields | - |
| V11 | Add group terms and conditions | - |
| V12 | Add is_admin to members | - |
| V13 | Add host_member_id to events | - |
| V14 | Remove organiser from participants | - |
| V15 | Rename is_organiser to has_organiser_role | - |
| V16 | Create notifications table | - |
| V17 | Create feature flags table | - |
| V18 | Enhanced legal audit trail | - |
| V19 | Populate agreement texts | - |
| V20 | Version existing agreements | - |
| V21 | Fix agreement hash column size | - |
| V22 | Increase created_by field size | - |
| V23 | Fix agreement version hashes | - |
| V24 | Fix feature flags updated_by column | - |
| V25 | Add disable become organiser flag | - |
| V26 | Create feedback table | - |
| V27 | Add guest count to event participants | - |
| V28 | Create web push subscriptions table | - |
| V29 | Create banned members table | - |
| V30 | Add join question to events | - |
| V31 | Add group guidelines column | - |
| V44 | Insert test review data | Apr 2026 |
| **V45** | **[Next migration]** | **Next** |

## Quick Checklist Before Creating Migration

- [ ] Ran `ls -1 backend/src/main/resources/db/migration/postgresql/V*.sql | tail -1`
- [ ] Confirmed latest version number
- [ ] Incremented version by 1 (or more if multiple migrations added)
- [ ] Used double underscore `__` between version and description
- [ ] Used snake_case for description
- [ ] Tested SQL script locally before committing

## Why This Matters

Flyway executes migrations in **version order**. If you use an old version number:
- Migration may not run (if that version already executed)
- Migration may run out of order (causing dependency issues)
- Database state becomes inconsistent across environments
- Rollbacks become complicated

**Always check the latest version first!** 🚨
