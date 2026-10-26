"""Shared helpers: serialisation, validation, error type."""
from datetime import datetime

from bson import ObjectId
from bson.errors import InvalidId
from flask import jsonify


class APIError(Exception):
    def __init__(self, message, status=400):
        super().__init__(message)
        self.message, self.status = message, status


def oid(value):
    try:
        return ObjectId(value)
    except (InvalidId, TypeError):
        raise APIError("Invalid id", 400)


def parse_date(value, field="date"):
    try:
        return datetime.strptime(str(value)[:10], "%Y-%m-%d")
    except ValueError:
        raise APIError(f"'{field}' must be in YYYY-MM-DD format")


def parse_amount(value, field="amount"):
    try:
        amount = round(float(value), 2)
    except (TypeError, ValueError):
        raise APIError(f"'{field}' must be a number")
    if amount <= 0 or amount > 1e9:
        raise APIError(f"'{field}' must be greater than 0")
    return amount


def serialize(doc):
    """Make a Mongo document JSON-safe (ObjectId -> str, datetime -> YYYY-MM-DD)."""
    if doc is None:
        return None
    out = {}
    for k, v in doc.items():
        if k == "_id":
            out["id"] = str(v)
        elif isinstance(v, ObjectId):
            out[k] = str(v)
        elif isinstance(v, datetime):
            out[k] = v.strftime("%Y-%m-%d") if k in ("date", "deadline") else v.isoformat()
        else:
            out[k] = v
    return out


def current_uid() -> str:
    from flask_jwt_extended import get_jwt_identity
    return get_jwt_identity()


def today():
    import pandas as pd
    return pd.Timestamp.now().normalize()


def json_body():
    from flask import request
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        raise APIError("Request body must be valid JSON")
    return data


def require_category(value, allowed):
    if value not in allowed:
        raise APIError(f"'category' must be one of: {', '.join(allowed)}")
    return value
