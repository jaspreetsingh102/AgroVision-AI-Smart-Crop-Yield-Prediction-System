import os
from dotenv import load_dotenv
from flask import Flask, send_from_directory, request, jsonify
from flask_cors import CORS
from supabase import create_client
import bcrypt
import sys
sys.path.append('./backend')
from mailer import generate_otp, send_otp_email

load_dotenv()

# Ensure we use absolute paths to prevent "Not Found" errors
BASE_DIR = os.path.abspath(os.path.dirname(__file__))

# Try both spellings just in case of typos in folder names
F_DIR = 'frountend' if os.path.exists(os.path.join(BASE_DIR, 'frountend')) else 'frontend'
PAGES_DIR = os.path.join(BASE_DIR, F_DIR, 'pages')
SCRIPTS_DIR = os.path.join(BASE_DIR, F_DIR, 'scripts')
ASSETS_DIR = os.path.join(BASE_DIR, F_DIR, 'assets')

DEFAULT_PORT = 5500

if not os.getenv("SUPABASE_URL") or not os.getenv("SUPABASE_KEY"):
    print("CRITICAL: Supabase credentials missing in .env file.")

# Temporary storage for OTPs (In a production app, use Redis or a DB table with expiry)
otp_store = {}

# Supabase Setup
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Initialize Flask without a default static_url_path to avoid routing conflicts
app = Flask(__name__, static_folder=None)
CORS(app)

# Serve the main entry point
@app.route('/')
def index():
    """Serves the login page as the entry point."""
    # Explicitly serve login.html from the pages directory
    if os.path.exists(os.path.join(PAGES_DIR, 'login.html')):
        return send_from_directory(PAGES_DIR, 'login.html')
    
    # Fallback error message
    return f"404: login.html not found in {PAGES_DIR}", 404

@app.route('/signup', methods=['POST'])
def signup():
    data = request.json
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')

    if not all([name, email, password]):
        return jsonify({"status": "error", "message": "Missing required fields"}), 400

    # Check if user already exists
    existing_user = supabase.table('Client').select("Gmail").eq("Gmail", email).execute()
    if existing_user.data:
        return jsonify({"status": "error", "message": "Email already registered"}), 409

    # Hash password for security
    hashed_pw = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode()

    try:
        insert_data = {
            "Username": name,
            "Gmail": email,
            "password": hashed_pw,
            "Gender": data.get('gender'),
            "Age": int(float(data.get('age'))) if data.get('age') else None,
            "Education": data.get('education'),
            "Contect_No": data.get('phone'),
            "Experience": float(data.get('experience')) if data.get('experience') else 0.0,
            "Farm_Area": float(data.get('farm_size') or 0),
            "Farming_Goal": data.get('goal'),
            "Current_Crops": ", ".join(data.get('crops', [])) if isinstance(data.get('crops'), list) else str(data.get('crops', '')),
            "Previous_Data": str(data.get('history', ''))
        }
        res = supabase.table('Client').insert(insert_data).execute()
        return jsonify({"status": "success", "message": "Account created successfully"}), 201
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email', '').strip()
    password = data.get('password', '')

    try:
        res = supabase.table('Client').select("id", "Username", "Gmail", "password").eq("Gmail", email).execute()
        if not res.data:
            return jsonify({"status": "error", "message": "User not found"}), 404

        user = res.data[0]
        if bcrypt.checkpw(password.encode('utf-8'), user['password'].encode()):
            return jsonify({"status": "success", "message": "Welcome back!", "user": {"name": user['Username'], "id": user['id']}}), 200
        return jsonify({"status": "error", "message": "Invalid password"}), 401
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/get-profile', methods=['POST'])
def get_profile():
    data = request.json
    email = data.get('email', '').strip()
    if not email:
        return jsonify({"status": "error", "message": "Email required"}), 400
    
    try:
        # Query by Gmail column
        res = supabase.table('Client').select("*").eq("Gmail", email).limit(1).execute()
        if res.data:
            return jsonify({"status": "success", "user": res.data[0]}), 200
        return jsonify({"status": "error", "message": "User not found"}), 404
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/request-otp', methods=['POST'])
def request_otp():
    data = request.json
    identifier = data.get('identifier') # Can be email or username
    if not identifier:
        return jsonify({"status": "error", "message": "Username or Email required"}), 400

    # Find user in database by either Gmail or Username
    res = supabase.table('Client').select("Gmail").or_(f'Gmail.eq.{identifier},Username.eq.{identifier}').execute()
    if not res.data:
        return jsonify({"status": "error", "message": "User not found"}), 404
    
    target_email = res.data[0]['Gmail']
    otp = generate_otp()
    otp_store[target_email] = otp
    
    # FIXED: Check if the mailer actually succeeded in sending the email
    email_sent = send_otp_email(target_email, otp)
    
    if email_sent:
        return jsonify({
            "status": "success", 
            "message": f"OTP sent to {target_email}", 
            "email": target_email
        }), 200
    else:
        return jsonify({"status": "error", "message": "Failed to send email. Check SMTP settings."}), 500

@app.route('/verify-otp', methods=['POST'])
def verify_otp():
    data = request.json
    email = data.get('email')
    otp = data.get('otp')

    if not email or not otp:
        return jsonify({"status": "error", "message": "Missing OTP or email"}), 400

    if otp_store.get(email) == str(otp):
        return jsonify({"status": "success", "message": "OTP Verified"}), 200
    
    return jsonify({"status": "error", "message": "Invalid OTP"}), 401

@app.route('/verify-and-change-password', methods=['POST'])
def verify_and_change_password():
    data = request.json
    email = data.get('email')
    otp = data.get('otp')
    new_password = data.get('password')

    if otp_store.get(email) != str(otp):
        return jsonify({"status": "error", "message": "Invalid or expired OTP"}), 401

    # Hash the new password
    hashed_pw = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode()
    
    res = supabase.table('Client').update({"password": hashed_pw}).eq("Gmail", email).execute()
    if res.data:
        del otp_store[email] # Clear OTP after use
        return jsonify({"status": "success", "message": "Password updated successfully"}), 200
    return jsonify({"status": "error", "message": "Update failed"}), 400

@app.route('/save-profile', methods=['POST'])
def update_profile():
    data = request.json
    email = data.get('Gmail')
    if not email:
        return jsonify({"status": "error", "message": "Email required"}), 400
    
    # If password update is requested, hash it correctly
    password = data.get('password')
    if password:
        data['password'] = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode()

    # Clean payload to prevent database integrity errors
    keys_to_remove = ['id', 'created_at', 'Gmail']
    for key in keys_to_remove:
        data.pop(key, None)
    email = email.strip()

    try:
        supabase.table('Client').update(data).eq("Gmail", email).execute()
        return jsonify({"status": "success", "message": "Profile updated"}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# Catch-all route for serving frontend files and handling direct page requests
@app.route('/<path:filename>')
def serve_any(filename):
    # 1. Normalize filename to handle spelling mismatch in URL (frontend vs frountend)
    normalized_filename = filename.replace('frontend/', f'{F_DIR}/').replace('frountend/', f'{F_DIR}/')

    # 2. Check direct path from root
    if os.path.isfile(os.path.join(BASE_DIR, filename)):
        return send_from_directory(BASE_DIR, filename)
    
    if os.path.isfile(os.path.join(BASE_DIR, normalized_filename)):
        return send_from_directory(BASE_DIR, normalized_filename)

    # 3. Handle root-relative requests (e.g., /scripts/login.js -> /frountend/scripts/login.js)
    # This is critical when serving login.html from the root / route
    if os.path.isfile(os.path.join(BASE_DIR, F_DIR, filename)):
        return send_from_directory(os.path.join(BASE_DIR, F_DIR), filename)

    # 4. Search inside specific subdirectories as a fallback
    for folder in [PAGES_DIR, SCRIPTS_DIR, ASSETS_DIR]:
        target_path = os.path.join(folder, filename.split('/')[-1])
        if os.path.isfile(target_path):
            return send_from_directory(folder, filename.split('/')[-1])
            
    return f"404: Resource '{filename}' not found. Checked in {F_DIR} and subfolders.", 404

if __name__ == '__main__':
    
    app.run(debug=True, host='0.0.0.0', port=DEFAULT_PORT)