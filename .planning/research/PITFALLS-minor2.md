### Pitfall 4: SQLite Database File Not in .gitignore
**What goes wrong:** Committing SQLite database file to git causes merge conflicts and bloated repository.

**Why it happens:**
- Default .gitignore doesn't include *.db files
- Database created in project root
- Not thinking about version control

**Consequences:**
- Large git repository
- Merge conflicts on database file
- Accidental commit of user data

**Prevention:**
- Add *.db, *.db-shm, *.db-wal to .gitignore immediately
- Store database outside project root or in dedicated data/ folder
- Document database location in README

---

### Pitfall 5: No Logging for Vectorization Pipeline
**What goes wrong:** When vectorization fails, no visibility into what went wrong or which images failed.

**Why it happens:**
- No structured logging
- Silent failures
- No progress tracking

**Consequences:**
- Difficult debugging
- Unknown failure rates
- Can't identify problematic images

**Prevention:**
- Add structured logging from day 1
- Log start/end of each vectorization
- Log failures with image path and error
- Track success/failure metrics

---

