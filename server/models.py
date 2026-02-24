from config import db, bcrypt
from flask_login import UserMixin
from datetime import datetime


class User(UserMixin, db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    _password_hash = db.Column(db.String(256), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationship: one user has many study sessions
    study_sessions = db.relationship('StudySession', back_populates='user', cascade='all, delete-orphan')

    @property
    def password(self):
        raise AttributeError("Password is not readable.")

    @password.setter
    def password(self, plaintext):
        self._password_hash = bcrypt.generate_password_hash(plaintext).decode('utf-8')

    def check_password(self, plaintext):
        return bcrypt.check_password_hash(self._password_hash, plaintext)

    def __repr__(self):
        return f'<User {self.username}>'


class StudySession(db.Model):
    __tablename__ = 'study_sessions'

    id = db.Column(db.Integer, primary_key=True)
    subject = db.Column(db.String(100), nullable=False)
    goal = db.Column(db.String(255))
    total_minutes = db.Column(db.Integer, default=0)     # total focused time logged
    completed = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Foreign key linking session to its owner
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    # Relationships
    user = db.relationship('User', back_populates='study_sessions')
    pomodoro_blocks = db.relationship('PomodoroBlock', back_populates='study_session', cascade='all, delete-orphan')

    def __repr__(self):
        return f'<StudySession {self.subject}>'


class PomodoroBlock(db.Model):
    __tablename__ = 'pomodoro_blocks'

    id = db.Column(db.Integer, primary_key=True)
    block_type = db.Column(db.String(10), nullable=False, default='work')  # 'work' or 'break'
    duration_minutes = db.Column(db.Integer, nullable=False)               # typically 25 or 5
    completed = db.Column(db.Boolean, default=False)
    started_at = db.Column(db.DateTime, nullable=True)
    ended_at = db.Column(db.DateTime, nullable=True)

    # Foreign key linking block to its session
    study_session_id = db.Column(db.Integer, db.ForeignKey('study_sessions.id'), nullable=False)

    # Relationship back to session
    study_session = db.relationship('StudySession', back_populates='pomodoro_blocks')

    def __repr__(self):
        return f'<PomodoroBlock {self.block_type} {self.duration_minutes}min>'