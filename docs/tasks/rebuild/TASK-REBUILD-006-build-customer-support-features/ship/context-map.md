# Repo context map

The support core is contained in `app/web`. It uses the signed-session boundary from Task 2 and the SQLite catalog and order records from Tasks 4 and 5. The support routes create their stores only inside handlers, so Next.js build evaluation does not open a database.
