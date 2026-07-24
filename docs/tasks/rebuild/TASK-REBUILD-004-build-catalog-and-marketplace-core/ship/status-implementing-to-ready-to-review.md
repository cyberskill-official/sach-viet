# Implementing to ready-to-review

The catalog core implementation is ready for review. The change adds SQLite records for categories, products, media, variants, and vendor offers. Product records have no commercial fields. Public routes expose catalog facts and the selected buy box, while offer writes require a valid session and server-side ownership enforcement.
