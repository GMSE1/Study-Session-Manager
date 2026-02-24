from flask import Flask
from flask_cors import CORS
from config import db, migrate, bcrypt, login_manager
from models import User


def create_app():
    app = Flask(__name__)

    app.config['SECRET_KEY'] = 'dev-secret-key-change-in-production'
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///app.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Allow the React frontend (port 5173) to communicate with Flask (port 5555)
    CORS(app, 
     supports_credentials=True, 
     resources={r"/*": {"origins": "http://localhost:3000"}},
     allow_headers=["Content-Type"],
     methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"]
)

    # Bind extensions
    db.init_app(app)
    migrate.init_app(app, db)
    bcrypt.init_app(app)
    login_manager.init_app(app)

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    # Register blueprints
    from auth import auth_bp
    from sessions import sessions_bp
    from pomodoro import pomodoro_bp
    app.register_blueprint(auth_bp)
    app.register_blueprint(sessions_bp)
    app.register_blueprint(pomodoro_bp)

    return app


app = create_app()

if __name__ == '__main__':
    app.run(debug=True, port=5555)