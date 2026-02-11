## Moderate Pitfalls

### Pitfall 1: Prisma Schema Not Configured for sqlite-vss Virtual Tables
**What goes wrong:** Prisma doesn't natively support sqlite-vss virtual tables, requiring raw SQL queries that bypass type safety.

**Why it happens:**
- sqlite-vss uses virtual tables (CREATE VIRTUAL TABLE)
- Prisma schema doesn't support virtual table syntax
- Attempting to define vss tables in schema.prisma fails

**Consequences:**
- Loss of type safety for vector operations
- Manual SQL query management
- No migration support for vector tables
- Increased maintenance burden

**Prevention:**
- Use Prisma for regular tables only
- Create separate migration files for sqlite-vss tables
- Wrap raw SQL in typed repository layer
- Document the hybrid approach clearly
- Consider using Prisma.$executeRaw with typed parameters

---

### Pitfall 2: No Pagination for Vector Search Results
**What goes wrong:** Returning all matching vectors from search without pagination causes memory issues and slow response times.

**Why it happens:**
- Vector search returns similarity scores for all items
- No LIMIT clause on vector queries
- Assuming small result sets

**Consequences:**
- Large JSON payloads (4000+ results)
- Slow API responses
- High memory usage
- Poor mobile performance

**Prevention:**
- Always use LIMIT on vector searches (default 20-50)
- Implement cursor-based pagination
- Return only necessary fields
- Add configurable result limits

---

### Pitfall 3: Storing Full File Paths Instead of Relative Paths
**What goes wrong:** Storing absolute file paths in database makes the system non-portable across environments.

**Why it happens:**
- Using process.cwd() or __dirname in file path storage
- Not separating storage root from relative paths
- Hardcoding paths during development

**Consequences:**
- Database not portable between dev/prod
- Broken paths when moving storage location
- Difficult to backup/restore
- Environment-specific database

**Prevention:**
- Store relative paths from storage root
- Configure storage root via environment variable
- Resolve full paths at runtime only
- Test with different storage locations

---

