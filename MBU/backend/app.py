import os
import datetime
from functools import wraps

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_bcrypt import Bcrypt
import jwt # PyJWT

from config import Config
from database import db
from models import User, UserRole # Import necessary models
from sandbox_executor import execute_code_securely # Import the placeholder

# --- App Initialization --- #
app = Flask(__name__)
app.config.from_object(Config)

# Initialize extensions
db.init_app(app)
bcrypt = Bcrypt(app)
CORS(app) # Enable CORS for all routes by default

# --- Database Initialization Command --- #
# (Run `flask db-init` in the terminal in the backend folder after creating models)
@app.cli.command('db-init')
def init_db():
    """Create database tables from SQLAlchemy models."""
    with app.app_context():
        print("Creating database tables...")
        try:
            db.create_all()
            print("Database tables created successfully.")
            # Optionally create a default admin user here
            if not User.query.filter_by(email=os.environ.get('ADMIN_EMAIL', 'admin@example.com')).first():
                print("Creating default admin user...")
                admin_email = os.environ.get('ADMIN_EMAIL', 'admin@example.com')
                admin_pass = os.environ.get('ADMIN_PASSWORD', 'adminpass')
                admin_id = os.environ.get('ADMIN_UNIQUE_ID', 'ADMIN001')
                admin_name = os.environ.get('ADMIN_NAME', 'Default Admin')
                admin_user = User(
                    unique_id=admin_id,
                    email=admin_email,
                    full_name=admin_name,
                    password=admin_pass,
                    role=UserRole.ADMIN,
                    is_active=True
                )
                db.session.add(admin_user)
                db.session.commit()
                print(f"Default admin user created with email: {admin_email}")
            else:
                print("Admin user already exists.")
        except Exception as e:
            print(f"Error creating database tables or admin user: {e}")
            db.session.rollback() # Rollback in case of error

# --- Authentication Utilities (JWT) --- #

def create_access_token(user):
    payload = {
        'sub': user.id, # Subject (user id)
        'role': user.role.value,
        'name': user.full_name,
        'iat': datetime.datetime.utcnow(), # Issued at time
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24) # Expiration time
    }
    token = jwt.encode(payload, app.config['JWT_SECRET_KEY'], algorithm='HS256')
    return token

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]

        if not token:
            return jsonify({'message': 'Authentication Token is missing!'}), 401

        try:
            payload = jwt.decode(token, app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
            current_user = User.query.get(payload['sub'])
            if not current_user or not current_user.is_active:
                 return jsonify({'message': 'Invalid or inactive user.'}), 401
            # Pass user object or relevant info if needed
            # kwargs['current_user'] = current_user
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token has expired!'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Invalid Token!'}), 401

        return f(current_user=current_user, *args, **kwargs) # Pass current_user to the decorated function
    return decorated

def role_required(required_role):
    def decorator(f):
        @wraps(f)
        def decorated_function(current_user, *args, **kwargs):
            if not isinstance(required_role, list):
                roles_to_check = [required_role]
            else:
                roles_to_check = required_role

            user_role_value = current_user.role.value
            allowed = False
            for role in roles_to_check:
                 if isinstance(role, UserRole):
                     if user_role_value == role.value:
                         allowed = True
                         break
                 elif isinstance(role, str):
                     if user_role_value == role:
                         allowed = True
                         break

            if not allowed:
                return jsonify({'message': f'Access denied. Required role: {required_role}'}), 403
            return f(current_user=current_user, *args, **kwargs)
        return token_required(decorated_function) # Apply token_required first
    return decorator


# --- API Routes --- #

@app.route('/')
def home():
    return jsonify({"message": "Welcome to Campus Bridge Backend API"})

# === Authentication Routes ===

@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.get_json()
    email = data.get('email')
    unique_id = data.get('userid') # Match frontend signup form field name
    password = data.get('password')
    full_name = data.get('name')
    role_str = data.get('role')

    if not email or not password or not full_name or not unique_id or not role_str:
        return jsonify({'message': 'Missing required fields'}), 400

    if User.query.filter_by(email=email.lower()).first() or User.query.filter_by(unique_id=unique_id).first():
        return jsonify({'message': 'Email or Unique ID already exists'}), 409 # Conflict

    try:
        role = UserRole(role_str) # Convert string to Enum
        if role == UserRole.ADMIN: # Prevent admin signup via this route
             return jsonify({'message': 'Admin registration not allowed via signup.'}), 403
    except ValueError:
        return jsonify({'message': 'Invalid role specified'}), 400

    try:
        new_user = User(
            unique_id=unique_id,
            email=email,
            full_name=full_name,
            password=password,
            role=role
        )
        db.session.add(new_user)
        db.session.commit()
        return jsonify({'message': 'User created successfully'}), 201
    except Exception as e:
        db.session.rollback()
        print(f"Signup Error: {e}")
        return jsonify({'message': 'Error creating user'}), 500

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    # Frontend sends 'identifier' which can be email or unique_id
    identifier = data.get('identifier')
    password = data.get('password')
    role_str = data.get('role') # Frontend sends selected role

    if not identifier or not password or not role_str:
        return jsonify({'message': 'Identifier, password, and role are required'}), 400

    # Try finding user by email first, then by unique_id
    user = User.query.filter_by(email=identifier.lower()).first()
    if not user:
        user = User.query.filter_by(unique_id=identifier).first()

    # Validate user exists, password matches, role matches, and user is active
    if not user or not user.check_password(password):
        return jsonify({'message': 'Invalid credentials'}), 401

    if user.role.value != role_str:
         return jsonify({'message': f'Login failed: Role mismatch. You tried logging in as {role_str}.'}), 401

    if not user.is_active:
        return jsonify({'message': 'Account is inactive. Please contact administrator.'}), 403

    # Generate JWT token
    token = create_access_token(user)

    # Return user info (excluding password hash) and token
    user_data = user.to_dict()
    return jsonify({
        'message': 'Login successful',
        'token': token,
        'user': user_data
    }), 200


@app.route('/api/forgot_password', methods=['POST'])
def forgot_password():
    data = request.get_json()
    email = data.get('email')
    # --- TODO: Implement password reset logic --- #
    # 1. Check if email exists.
    # 2. Generate a secure, time-limited reset token.
    # 3. Store the token hash associated with the user.
    # 4. Send an email to the user with a reset link containing the token.
    # 5. Create another endpoint to handle the reset link (verify token, allow new password).
    print(f"Password reset requested for: {email} (Not Implemented)")
    # Simulate success to frontend
    return jsonify({'message': f'If an account with email {email} exists, a reset link will be sent.'}), 200


# === Protected Routes Example ===

@app.route('/api/profile', methods=['GET'])
@token_required
def get_profile(current_user):
    # The current_user object is passed by the token_required decorator
    return jsonify({
        'message': 'Profile data',
        'user': current_user.to_dict()
     }), 200

# === Compiler Route ===

@app.route('/api/execute', methods=['POST'])
@token_required # Secure the endpoint
def handle_code_execution(current_user):
    # Add rate limiting or further checks if needed
    data = request.get_json()
    language = data.get('language')
    code = data.get('code')
    input_data = data.get('input', '')

    if not language or code is None:
        return jsonify({'success': False, 'stderr': 'Language and code are required.'}), 400

    # --- Call the secure execution function --- #
    # IMPORTANT: Replace execute_code_securely with your actual sandbox implementation
    try:
        result = execute_code_securely(language, code, input_data)
        return jsonify(result), 200
    except Exception as e:
        print(f"Code execution sandbox call failed: {e}")
        return jsonify({'success': False, 'stderr': f'Code execution failed on server: {e}'}), 500

# === Placeholder Routes for Dashboard Data ===
# (These need implementation: fetching from DB, role checks)

# --- Student Data --- #
@app.route('/api/student/dashboard_data', methods=['GET'])
@role_required(UserRole.STUDENT)
def get_student_dashboard(current_user):
    # TODO: Fetch stats, attendance, courses, assignments for the current_user (student)
    print(f"Fetching dashboard data for student: {current_user.id}")
    # Simulate data based on frontend
    sample_data = {
        'stats': { 'attendance': 92, 'pending': 3, 'streak': 15, 'badges': 5 },
        'attendance': [
            { 'course': "CS101", 'rate': "95%" },
            { 'course': "MA101", 'rate': "88%" },
            { 'course': "PH101", 'rate': "90%" },
        ],
        'detailedAttendance': [
            { 'course': 'CS101 - Intro to Programming', 'percentage': 95, 'present': 19, 'total': 20 },
            { 'course': 'MA101 - Calculus I', 'percentage': 88, 'present': 15, 'total': 17 },
            { 'course': 'PH101 - Physics', 'percentage': 90, 'present': 18, 'total': 20 },
            { 'course': 'CH101 - Chemistry', 'percentage': 74, 'present': 14, 'total': 19 },
            { 'course': 'HS101 - History', 'percentage': 60, 'present': 12, 'total': 20 },
        ],
         'courses': [
            { 'id': 'cs101', 'name': "CS101 - Intro to Programming", 'links': [{ 'name': 'Notes', 'url': '#' }, { 'name': 'Videos', 'url': '#' }, { 'name': 'Syllabus', 'url': '#' }] },
            { 'id': 'ma101', 'name': "MA101 - Calculus I", 'links': [{ 'name': 'Problems', 'url': '#' }, { 'name': 'Recordings', 'url': '#' }] },
            { 'id': 'ph101', 'name': "PH101 - Physics", 'links': [{ 'name': 'Manuals', 'url': '#' }, { 'name': 'Slides', 'url': '#' }] },
        ],
        'assignments': [
            { 'id': 'a1', 'course': 'CS101', 'title': 'Lab 1: Variables', 'due': '2024-06-10', 'status': 'Submitted', 'grade': 'A', 'review': 'Good work!' },
            { 'id': 'a2', 'course': 'MA101', 'title': 'Problem Set 2', 'due': '2024-06-15', 'status': 'Pending', 'grade': '-', 'review': None },
            { 'id': 'a3', 'course': 'CS101', 'title': 'Quiz 1: Basics', 'due': '2024-06-05', 'status': 'Graded', 'grade': '85/100', 'review': 'Solid understanding.' },
            { 'id': 'a4', 'course': 'CS101', 'title': 'Lab 2: Conditionals', 'due': '2024-06-20', 'status': 'Pending', 'grade': '-', 'review': None },
        ],
        'profile': {
            'name': current_user.full_name,
            'id': current_user.unique_id,
            'email': current_user.email,
            'badges': ['Pythonista', 'DSA Novice', 'Web Crawler', '10-Day Streak', 'Problem Solver'],
            'currentStreak': 15,
            'longestStreak': 21
        },
        'codingTracks': [
            { 'id': 'track1', 'name': 'DSA Essentials' },
            { 'id': 'track2', 'name': 'Web Development (MERN)' },
            { 'id': 'track3', 'name': 'Python for Data Science' },
        ],
        'jobMatches': [
            { 'title': 'Junior Web Developer', 'skills': 'HTML, CSS, JS, React', 'match': '75%', 'detail': 'Strong in JS, Learning React' },
            { 'title': 'Python Dev Intern', 'skills': 'Python, Algo, Git', 'match': '90%', 'detail': 'Excellent Python skills' },
        ]
    }
    return jsonify(sample_data), 200

# --- Faculty Data --- #
@app.route('/api/faculty/dashboard_data', methods=['GET'])
@role_required(UserRole.FACULTY)
def get_faculty_dashboard(current_user):
    # TODO: Fetch courses taught by faculty, submissions for those courses, etc.
    print(f"Fetching dashboard data for faculty: {current_user.id}")
    # Simulate data based on frontend
    sample_data = {
        'courses': [{ 'id': 'cs101', 'name': 'CS101 - Intro to Programming' }, { 'id': 'cs201', 'name': 'CS201 - Data Structures' }],
        'submissions': [
            { 'studentId': '101', 'studentName': 'Alice Smith', 'assignmentId': 'a1', 'assignmentName': 'Lab 1: Variables', 'submittedOn': '2024-06-09', 'status': 'Submitted', 'grade': None, 'submissionData': 'print("Hello")', 'review': None },
            { 'studentId': '103', 'studentName': 'Charlie Brown', 'assignmentId': 'a1', 'assignmentName': 'Lab 1: Variables', 'submittedOn': '2024-06-10', 'status': 'Submitted', 'grade': None, 'submissionData': 'print("World")', 'review': None },
        ],
        'students': [
            { 'id': '101', 'name': 'Alice Smith' }, { 'id': '102', 'name': 'Bob Johnson' },
            { 'id': '103', 'name': 'Charlie Brown' }, { 'id': '104', 'name': 'Diana Prince' }
        ]
    }
    return jsonify(sample_data), 200

# --- Admin Data --- #
@app.route('/api/admin/dashboard_data', methods=['GET'])
@role_required(UserRole.ADMIN)
def get_admin_dashboard(current_user):
    # TODO: Fetch users, courses, metrics, events
    print(f"Fetching dashboard data for admin: {current_user.id}")
     # Simulate data based on frontend
    sample_data = {
        'users': [
            { 'id': '101', 'name': 'Alice Smith', 'email': 'alice@example.com', 'role': 'Student', 'status': 'Active' },
            { 'id': 'F201', 'name': 'Prof. Davis', 'email': 'davis@example.com', 'role': 'Faculty', 'status': 'Active' },
            { 'id': 'ADM01', 'name': current_user.full_name, 'email': current_user.email, 'role': 'Admin', 'status': 'Active' },
        ],
        'courses': [
            { 'code': 'CS101', 'title': 'Intro to Programming', 'faculty': 'Prof. Davis' },
            { 'code': 'MA101', 'title': 'Calculus I', 'faculty': 'Prof. Einstein' },
        ],
        'leaderboard': [
            { 'name': 'Alice Smith', 'score': 1500 },
            { 'name': 'Charlie Brown', 'score': 1300 },
        ],
        'metrics': { 'totalUsers': 150, 'activeStudents': 120, 'submissionsToday': 45 },
        'events': [
            { 'id': 'e1', 'type': 'Contest', 'title': 'Weekly Challenge #5', 'datetime': '2024-07-01T10:00' },
            { 'id': 'e2', 'type': 'Test', 'title': 'Mock Placement Test - July', 'datetime': '2024-07-15T14:00' }
        ]
    }
    return jsonify(sample_data), 200

# Add more specific API routes for actions (POST/PUT/DELETE) as needed
# Example: POST /api/faculty/attendance
# Example: PUT /api/admin/users/{user_id}/status
# Example: POST /api/admin/courses


# --- Main Execution --- #
if __name__ == '__main__':
    # TODO: Before running for the first time:
    # 1. Ensure MySQL server is running.
    # 2. Create the database specified in your .env file.
    # 3. Install requirements: pip install -r requirements.txt
    # 4. Run database initialization: flask db-init
    # 5. Set environment variables (e.g., FLASK_APP=app.py, FLASK_DEBUG=1 for development)
    # 6. Run the app: flask run
    app.run(debug=True) # debug=True is for development only! 