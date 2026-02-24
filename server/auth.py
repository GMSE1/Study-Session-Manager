from flask import Blueprint, request, session, jsonify
from config import db, bcrypt
from models import User

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()

    # Validate required fields
    if not data.get('username') or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Username, email, and password are required.'}), 422

    # Check for existing username or email
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already taken.'}), 422

    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already registered.'}), 422

    # Create the new user (password setter handles hashing)
    new_user = User(username=data['username'], email=data['email'])
    new_user.password = data['password']

    db.session.add(new_user)
    db.session.commit()

    # Log them in immediately after registering
    session['user_id'] = new_user.id

    return jsonify({
        'id': new_user.id,
        'username': new_user.username,
        'email': new_user.email
    }), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()

    if not data.get('username') or not data.get('password'):
        return jsonify({'error': 'Username and password are required.'}), 422

    user = User.query.filter_by(username=data['username']).first()

    if not user or not user.check_password(data['password']):
        return jsonify({'error': 'Invalid username or password.'}), 401

    # Store user ID in the server-side session
    session['user_id'] = user.id

    return jsonify({
        'id': user.id,
        'username': user.username,
        'email': user.email
    }), 200


@auth_bp.route('/logout', methods=['DELETE'])
def logout():
    session.pop('user_id', None)
    return jsonify({'message': 'Logged out successfully.'}), 200


@auth_bp.route('/check_session', methods=['GET'])
def check_session():
    user_id = session.get('user_id')

    if not user_id:
        return jsonify({'error': 'Not logged in.'}), 401

    user = User.query.get(user_id)

    if not user:
        return jsonify({'error': 'User not found.'}), 404

    return jsonify({
        'id': user.id,
        'username': user.username,
        'email': user.email
    }), 200