from app import app
from config import db
from models import User, StudySession, PomodoroBlock
from datetime import datetime

with app.app_context():
    print("Clearing existing data...")
    PomodoroBlock.query.delete()
    StudySession.query.delete()
    User.query.delete()
    db.session.commit()

    print("Seeding users...")
    user1 = User(username='greg', email='greg@example.com')
    user1.password = 'password123'

    user2 = User(username='testuser', email='test@example.com')
    user2.password = 'test123'

    db.session.add_all([user1, user2])
    db.session.commit()

    print("Seeding study sessions...")
    session1 = StudySession(
        subject='Flask Authentication',
        goal='Understand session management and password hashing',
        user_id=user1.id
    )
    session2 = StudySession(
        subject='React State Management',
        goal='Build a working Pomodoro timer component',
        user_id=user1.id
    )

    db.session.add_all([session1, session2])
    db.session.commit()

    print("Seeding Pomodoro blocks...")
    blocks = [
        PomodoroBlock(block_type='work', duration_minutes=25, completed=True,
                      started_at=datetime.utcnow(), study_session_id=session1.id),
        PomodoroBlock(block_type='break', duration_minutes=5, completed=True,
                      study_session_id=session1.id),
        PomodoroBlock(block_type='work', duration_minutes=25, completed=False,
                      study_session_id=session1.id),
    ]

    db.session.add_all(blocks)
    db.session.commit()

    print("Done! Database seeded successfully.")