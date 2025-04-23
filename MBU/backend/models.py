from database import db
from flask_bcrypt import generate_password_hash, check_password_hash
import enum
import datetime

class UserRole(enum.Enum):
    STUDENT = 'student'
    FACULTY = 'faculty'
    ADMIN = 'admin'

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    # Use unique_id for student/faculty ID, allowing multiple users with same email if needed (e.g., shared admin email)
    # Or make email primary if email must be unique identifier for login
    unique_id = db.Column(db.String(80), unique=True, nullable=False) # For student/faculty ID
    email = db.Column(db.String(120), unique=True, nullable=False) # Use this for login identifier
    full_name = db.Column(db.String(100), nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    role = db.Column(db.Enum(UserRole), nullable=False, default=UserRole.STUDENT)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True) # For activate/deactivate

    def __init__(self, unique_id, email, full_name, password, role=UserRole.STUDENT):
        self.unique_id = unique_id
        self.email = email.lower()
        self.full_name = full_name
        self.set_password(password)
        self.role = role

    def set_password(self, password):
        self.password_hash = generate_password_hash(password).decode('utf8')

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        """Return user data in a dictionary format suitable for JSON serialization."""
        return {
            'id': self.id,
            'unique_id': self.unique_id,
            'email': self.email,
            'full_name': self.full_name,
            'role': self.role.value, # Send role as string
            'created_at': self.created_at.isoformat(),
            'is_active': self.is_active
        }

# --- Add more models as needed --- #

# Example: Course Model
# class Course(db.Model):
#     __tablename__ = 'courses'
#     id = db.Column(db.Integer, primary_key=True)
#     course_code = db.Column(db.String(20), unique=True, nullable=False)
#     title = db.Column(db.String(150), nullable=False)
#     faculty_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True) # Link to faculty user
#     faculty = db.relationship('User')
#
# Example: Assignment Model
# class Assignment(db.Model):
#     __tablename__ = 'assignments'
#     # ... columns for title, description, due_date, course_id (FK to courses)
#
# Example: Submission Model
# class Submission(db.Model):
#     __tablename__ = 'submissions'
#     # ... columns for student_id (FK to users), assignment_id (FK to assignments), content, submitted_at, grade, review
#
# Example: Attendance Model
# class Attendance(db.Model):
#     __tablename__ = 'attendance'
#     # ... columns for student_id, course_id, date, is_present (boolean)

# ... etc. for Content, Events, etc. 