from unittest.mock import patch

# Patch create_all before the app is imported so it never tries to
# create tables (which would fail on SQLite due to the JSONB column).
patch("sqlalchemy.schema.MetaData.create_all", lambda *a, **kw: None).start()