"""Flask application factory."""
from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from werkzeug.exceptions import HTTPException

from .config import Config
from .db import get_db, init_db
from .utils import APIError


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    CORS(app, origins=app.config["CORS_ORIGINS"])
    init_db(app)

    jwt = JWTManager(app)

    @jwt.token_in_blocklist_loader
    def is_revoked(_header, payload):                # logout support
        return get_db().token_blocklist.find_one({"jti": payload["jti"]}) is not None

    @jwt.unauthorized_loader
    @jwt.invalid_token_loader
    def bad_token(reason):
        return jsonify(error="Authentication required", detail=str(reason)), 401

    @jwt.expired_token_loader
    def expired(_h, _p):
        return jsonify(error="Session expired, please log in again"), 401

    @jwt.revoked_token_loader
    def revoked(_h, _p):
        return jsonify(error="You have been logged out"), 401

    from .routes import auth, dashboard, expenses, goals, income, ml, ocr
    for module in (auth, expenses, income, dashboard, ml, goals, ocr):
        app.register_blueprint(module.bp)

    @app.get("/api/health")
    def health():
        return jsonify(status="ok")

    @app.errorhandler(APIError)
    def api_error(e):
        return jsonify(error=e.message), e.status

    @app.errorhandler(HTTPException)
    def http_error(e):
        return jsonify(error=e.description), e.code

    @app.errorhandler(Exception)
    def unexpected(e):
        app.logger.exception("Unhandled error")
        return jsonify(error="Internal server error"), 500

    return app
