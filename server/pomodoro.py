from flask import Blueprint, request, session, jsonify
from datetime import datetime
from config import db
from models import PomodoroBlock, StudySession

pomodoro_bp = Blueprint('pomodoro', __name__)


def get_current_user_id():
    return session.get('user_id')


# GET all blocks for a specific study session
@pomodoro_bp.route('/study_sessions/<int:session_id>/pomodoro_blocks', methods=['GET'])
def get_blocks(session_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'error': 'Not logged in.'}), 401

    # Verify the session belongs to this user
    study_session = StudySession.query.filter_by(id=session_id, user_id=user_id).first()
    if not study_session:
        return jsonify({'error': 'Session not found.'}), 404

    blocks = PomodoroBlock.query.filter_by(study_session_id=session_id).all()

    return jsonify([{
        'id': b.id,
        'block_type': b.block_type,
        'duration_minutes': b.duration_minutes,
        'completed': b.completed,
        'started_at': b.started_at.isoformat() if b.started_at else None,
        'ended_at': b.ended_at.isoformat() if b.ended_at else None,
        'study_session_id': b.study_session_id
    } for b in blocks]), 200


# POST create a new pomodoro block for a session
@pomodoro_bp.route('/study_sessions/<int:session_id>/pomodoro_blocks', methods=['POST'])
def create_block(session_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'error': 'Not logged in.'}), 401

    study_session = StudySession.query.filter_by(id=session_id, user_id=user_id).first()
    if not study_session:
        return jsonify({'error': 'Session not found.'}), 404

    data = request.get_json()

    block_type = data.get('block_type', 'work')
    if block_type not in ['work', 'break']:
        return jsonify({'error': 'block_type must be "work" or "break".'}), 422

    # Default durations: 25 min for work, 5 min for break
    default_duration = 25 if block_type == 'work' else 5
    duration = data.get('duration_minutes', default_duration)

    new_block = PomodoroBlock(
        block_type=block_type,
        duration_minutes=duration,
        started_at=datetime.utcnow(),
        study_session_id=session_id
    )

    db.session.add(new_block)
    db.session.commit()

    return jsonify({
        'id': new_block.id,
        'block_type': new_block.block_type,
        'duration_minutes': new_block.duration_minutes,
        'completed': new_block.completed,
        'started_at': new_block.started_at.isoformat(),
        'study_session_id': new_block.study_session_id
    }), 201


# PATCH mark a block as completed
@pomodoro_bp.route('/pomodoro_blocks/<int:id>/complete', methods=['PATCH'])
def complete_block(id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'error': 'Not logged in.'}), 401

    block = PomodoroBlock.query.get(id)
    if not block:
        return jsonify({'error': 'Block not found.'}), 404

    # Make sure this block belongs to this user's session
    study_session = StudySession.query.filter_by(
        id=block.study_session_id,
        user_id=user_id
    ).first()
    if not study_session:
        return jsonify({'error': 'Unauthorized.'}), 403

    block.completed = True
    block.ended_at = datetime.utcnow()

    # Add the block's duration to the session's total_minutes if it's a work block
    if block.block_type == 'work':
        study_session.total_minutes += block.duration_minutes

    db.session.commit()

    return jsonify({
        'id': block.id,
        'block_type': block.block_type,
        'duration_minutes': block.duration_minutes,
        'completed': block.completed,
        'ended_at': block.ended_at.isoformat()
    }), 200


# DELETE a pomodoro block
@pomodoro_bp.route('/pomodoro_blocks/<int:id>', methods=['DELETE'])
def delete_block(id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'error': 'Not logged in.'}), 401

    block = PomodoroBlock.query.get(id)
    if not block:
        return jsonify({'error': 'Block not found.'}), 404

    study_session = StudySession.query.filter_by(
        id=block.study_session_id,
        user_id=user_id
    ).first()
    if not study_session:
        return jsonify({'error': 'Unauthorized.'}), 403

    db.session.delete(block)
    db.session.commit()

    return jsonify({'message': 'Block deleted successfully.'}), 200