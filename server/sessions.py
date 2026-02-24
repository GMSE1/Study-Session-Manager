from flask import Blueprint, request, session, jsonify
from config import db
from models import StudySession, PomodoroBlock

sessions_bp = Blueprint('sessions', __name__)


def get_current_user_id():
    """Helper to grab the logged-in user's ID from the session."""
    return session.get('user_id')


# GET all sessions for the logged-in user
@sessions_bp.route('/study_sessions', methods=['GET'])
def get_sessions():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'error': 'Not logged in.'}), 401

    sessions = StudySession.query.filter_by(user_id=user_id).all()

    return jsonify([{
        'id': s.id,
        'subject': s.subject,
        'goal': s.goal,
        'total_minutes': s.total_minutes,
        'completed': s.completed,
        'created_at': s.created_at.isoformat(),
        'pomodoro_count': len(s.pomodoro_blocks)
    } for s in sessions]), 200


# GET a single session by ID
@sessions_bp.route('/study_sessions/<int:id>', methods=['GET'])
def get_session(id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'error': 'Not logged in.'}), 401

    s = StudySession.query.filter_by(id=id, user_id=user_id).first()
    if not s:
        return jsonify({'error': 'Session not found.'}), 404

    return jsonify({
        'id': s.id,
        'subject': s.subject,
        'goal': s.goal,
        'total_minutes': s.total_minutes,
        'completed': s.completed,
        'created_at': s.created_at.isoformat(),
        'pomodoro_blocks': [{
            'id': b.id,
            'block_type': b.block_type,
            'duration_minutes': b.duration_minutes,
            'completed': b.completed
        } for b in s.pomodoro_blocks]
    }), 200


# POST create a new session
@sessions_bp.route('/study_sessions', methods=['POST'])
def create_session():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'error': 'Not logged in.'}), 401

    data = request.get_json()

    if not data.get('subject'):
        return jsonify({'error': 'Subject is required.'}), 422

    new_session = StudySession(
        subject=data['subject'],
        goal=data.get('goal', ''),
        user_id=user_id
    )

    db.session.add(new_session)
    db.session.commit()

    return jsonify({
        'id': new_session.id,
        'subject': new_session.subject,
        'goal': new_session.goal,
        'total_minutes': new_session.total_minutes,
        'completed': new_session.completed
    }), 201


# PATCH update a session
@sessions_bp.route('/study_sessions/<int:id>', methods=['PATCH'])
def update_session(id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'error': 'Not logged in.'}), 401

    s = StudySession.query.filter_by(id=id, user_id=user_id).first()
    if not s:
        return jsonify({'error': 'Session not found.'}), 404

    data = request.get_json()

    # Only update fields that were actually sent
    if 'subject' in data:
        s.subject = data['subject']
    if 'goal' in data:
        s.goal = data['goal']
    if 'total_minutes' in data:
        s.total_minutes = data['total_minutes']
    if 'completed' in data:
        s.completed = data['completed']

    db.session.commit()

    return jsonify({
        'id': s.id,
        'subject': s.subject,
        'goal': s.goal,
        'total_minutes': s.total_minutes,
        'completed': s.completed
    }), 200


# DELETE a session
@sessions_bp.route('/study_sessions/<int:id>', methods=['DELETE'])
def delete_session(id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'error': 'Not logged in.'}), 401

    s = StudySession.query.filter_by(id=id, user_id=user_id).first()
    if not s:
        return jsonify({'error': 'Session not found.'}), 404

    db.session.delete(s)
    db.session.commit()

    return jsonify({'message': 'Session deleted successfully.'}), 200