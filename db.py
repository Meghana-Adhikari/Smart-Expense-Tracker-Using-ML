"""MongoDB connection + index management."""
from pymongo import ASCENDING, DESCENDING, MongoClient

_db = None


def init_db(app):
    global _db
    uri = app.config["MONGO_URI"]
    if uri.startswith("mongomock://"):              # in-memory DB for unit tests
        import mongomock
        client = mongomock.MongoClient()
    else:
        client = MongoClient(uri, serverSelectionTimeoutMS=5000)
    _db = client[app.config["MONGO_DB_NAME"]]
    _db.users.create_index("email", unique=True)
    _db.expenses.create_index([("user_id", ASCENDING), ("date", DESCENDING)])
    _db.expenses.create_index([("user_id", ASCENDING), ("category", ASCENDING)])
    _db.income.create_index([("user_id", ASCENDING), ("date", DESCENDING)])
    _db.goals.create_index("user_id")
    if not uri.startswith("mongomock://"):
        # revoked JWTs auto-expire after 13h (token lifetime is 12h)
        _db.token_blocklist.create_index("created_at", expireAfterSeconds=13 * 3600)
    return _db


def get_db():
    return _db
