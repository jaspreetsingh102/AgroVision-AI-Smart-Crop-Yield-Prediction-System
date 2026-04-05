import os
from flask import Flask, jsonify, redirect, request
from flask_cors import CORS
from supabase import create_client, Client
import bcrypt
from dotenv import load_dotenv
import time
from otp_service import generate_otp, send_otp_email

# Load environment variables from .env file (override=True ensures .env values always win)
load_dotenv(override=True)

# Temporary in-memory store for OTPs. Format: { "seller_id": {"otp": "123456", "expires": timestamp} }
OTP_STORE = {}

# Point static_folder to the frontend directory and set static_url_path to '' 
# so files like 'seller-login.html' are served directly from the root URL.
app = Flask(__name__, static_folder='../frontend', static_url_path='')
# Enable CORS to allow the frontend to communicate with this API
CORS(app)

# Initialize Supabase Client
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY") # Changed to use SUPABASE_KEY for backend operations
supabase: Client = create_client(url, key)

@app.route('/')
def index():
    # Redirect the base URL directly to the seller login page
    return redirect('/seller-login.html')

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy"}), 200

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    try:
        # Query the 'seller' table for the matching email
        response = supabase.table('seller').select("*").eq("email", email).execute()

        if not response.data:
            return jsonify({"error": "No account found with this email"}), 404

        user = response.data[0]

        # Check if the stored password is a bcrypt hash and verify it
        # IMPORTANT: This assumes passwords in the 'seller' table are now hashed.
        # If your existing 'seller' passwords are plain text, they will fail this check.
        # You will need to hash existing passwords or update the signup process to hash them.
        stored_password_hash = user.get('password')
        
        is_valid = False
        if stored_password_hash:
            try:
                is_valid = bcrypt.checkpw(password.encode('utf-8'), stored_password_hash.encode('utf-8'))
            except ValueError:
                # If ValueError (Invalid salt), it might be a legacy plaintext password
                is_valid = (password == stored_password_hash)

        if is_valid:
             seller_data = {
                 "seller_id": user.get('seller_id'), # Changed to seller_id as per schema
                 "shop_name": user.get('Shop_name'), # Updated to match new schema
                 "username": user.get('username'),
                 "email": user.get('email'),
                 "phone": user.get('phone'), # Updated to match new schema
                 "location": user.get('location')
             }
             return jsonify({"message": "Login successful", "user": seller_data}), 200
        else: # Either password doesn't match, or stored password is not a valid hash
            return jsonify({"error": "Invalid password"}), 401

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.json
    shop_name = data.get('shop_name')
    username = data.get('username')
    email = data.get('email')
    phone = data.get('phone')
    location = data.get('location')
    password = data.get('password')

    if not all([shop_name, username, email, phone, location, password]):
        return jsonify({"error": "All fields are required"}), 400

    try:
        # Check if email already exists
        existing_seller = supabase.table('seller').select('email').eq('email', email).execute()
        if existing_seller.data:
            return jsonify({"error": "This email is already registered"}), 409 # 409 Conflict

        # Hash the password
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        # Insert new seller into the 'seller' table
        response = supabase.table('seller').insert({
            "Shop_name": shop_name, # Use "Shop_name" to match your schema's case-sensitivity
            "username": username,
            "email": email,
            "phone": phone,
            "location": location,
            "password": hashed_password # Store the hashed password
        }).execute()

        # Supabase insert returns the inserted data in response.data
        return jsonify({"message": "Seller account created successfully", "user": response.data[0]}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/orders/<order_id>/status', methods=['PATCH'])
def update_order_status(order_id):
    data = request.json
    new_status = data.get('status')

    allowed_statuses = ['Pending', 'Shipped', 'Delivered', 'Cancelled', 'Completed']
    if not new_status or new_status not in allowed_statuses:
        return jsonify({"error": f"Invalid status. Must be one of: {', '.join(allowed_statuses)}"}), 400

    try:
        # First check if the order exists
        check = supabase.table('orders').select('id, status').eq('id', order_id).execute()
        if not check.data:
            return jsonify({"error": "Order not found"}), 404

        # Perform the update
        supabase.table('orders').update({"status": new_status}).eq('id', order_id).execute()

        # Verify the update
        verify = supabase.table('orders').select('id, status').eq('id', order_id).execute()
        updated_order = verify.data[0] if verify.data else {"id": order_id, "status": new_status}

        return jsonify({"message": f"Order #{order_id} updated to {new_status}", "order": updated_order}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/products/<product_id>', methods=['DELETE'])
def delete_product(product_id):
    try:
        # Execute the delete operation in Supabase
        supabase.table('products').delete().eq('id', product_id).execute()
        return jsonify({"message": "Product deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ========== SELLER PROFILE ==========

@app.route('/api/seller/<seller_id>/profile', methods=['GET'])
def get_seller_profile(seller_id):
    try:
        response = supabase.table('seller').select('seller_id, Shop_name, username, email, phone, location, created_at').eq('seller_id', seller_id).execute()

        if not response.data:
            return jsonify({"error": "Seller not found"}), 404

        return jsonify({"seller": response.data[0]}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/seller/<seller_id>/profile', methods=['PATCH'])
def update_seller_profile(seller_id):
    data = request.json

    allowed_fields = ['Shop_name', 'username', 'email', 'phone', 'location']
    update_data = {k: v for k, v in data.items() if k in allowed_fields}

    if not update_data:
        return jsonify({"error": "No valid fields to update"}), 400

    try:
        # Check seller exists
        check = supabase.table('seller').select('seller_id').eq('seller_id', seller_id).execute()
        if not check.data:
            return jsonify({"error": "Seller not found"}), 404

        # If email is being changed, check uniqueness
        if 'email' in update_data:
            existing = supabase.table('seller').select('seller_id').eq('email', update_data['email']).neq('seller_id', seller_id).execute()
            if existing.data:
                return jsonify({"error": "This email is already in use by another account"}), 409

        # Perform update
        supabase.table('seller').update(update_data).eq('seller_id', seller_id).execute()

        # Verify
        verify = supabase.table('seller').select('seller_id, Shop_name, username, email, phone, location').eq('seller_id', seller_id).execute()
        updated = verify.data[0] if verify.data else update_data

        return jsonify({"message": "Profile updated successfully", "seller": updated}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/seller/<seller_id>/generate-otp', methods=['POST'])
def generate_password_otp(seller_id):
    data = request.json
    old_password = data.get('old_password')

    if not old_password:
        return jsonify({"error": "Old password is required"}), 400

    try:
        # Verify the old password before sending an OTP
        check = supabase.table('seller').select('password, email').eq('seller_id', seller_id).execute()
        if not check.data:
            return jsonify({"error": "Seller not found"}), 404

        user = check.data[0]
        stored_hash = user.get('password')

        is_valid = False
        if stored_hash:
            try:
                is_valid = bcrypt.checkpw(old_password.encode('utf-8'), stored_hash.encode('utf-8'))
            except ValueError:
                # Legacy plaintext password check
                is_valid = (old_password == stored_hash)

        if not stored_hash or not is_valid:
            return jsonify({"error": "Incorrect old password"}), 401

        # Generate and store OTP (valid for 10 minutes)
        otp = generate_otp()
        OTP_STORE[seller_id] = {
            "otp": otp,
            "expires": time.time() + 600
        }

        # Send the OTP email
        user_email = user.get('email')
        send_otp_email(user_email, otp)

        return jsonify({
            "message": "OTP generated and sent successfully",
            "email": user_email
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/seller/<seller_id>/verify-otp', methods=['POST'])
def verify_password_otp(seller_id):
    data = request.json
    otp = data.get('otp')
    if not otp:
        return jsonify({"error": "OTP is required"}), 400
        
    try:
        stored_otp_data = OTP_STORE.get(seller_id)
        if not stored_otp_data:
            return jsonify({"error": "Please request an OTP first"}), 400
            
        if time.time() > stored_otp_data['expires']:
            del OTP_STORE[seller_id]
            return jsonify({"error": "OTP has expired. Please request a new one"}), 400
            
        if str(stored_otp_data['otp']) != str(otp):
            return jsonify({"error": "Invalid OTP"}), 401
            
        return jsonify({"message": "OTP verified successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/seller/<seller_id>/password', methods=['PATCH'])
def update_seller_password(seller_id):
    data = request.json
    otp = data.get('otp')
    new_password = data.get('password')

    if not new_password or len(new_password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400
        
    if not otp:
        return jsonify({"error": "OTP is required"}), 400

    try:
        # Check if OTP is valid and not expired
        stored_otp_data = OTP_STORE.get(seller_id)
        if not stored_otp_data:
            return jsonify({"error": "Please request an OTP first"}), 400
            
        if time.time() > stored_otp_data['expires']:
            del OTP_STORE[seller_id]
            return jsonify({"error": "OTP has expired. Please request a new one"}), 400
            
        if str(stored_otp_data['otp']) != str(otp):
            return jsonify({"error": "Invalid OTP"}), 401

        # Check seller exists
        check = supabase.table('seller').select('seller_id').eq('seller_id', seller_id).execute()
        if not check.data:
            return jsonify({"error": "Seller not found"}), 404

        # Hash the password using bcrypt
        hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Update with hashed password
        supabase.table('seller').update({"password": hashed_password}).eq('seller_id', seller_id).execute()

        # Clear the OTP after successful use
        del OTP_STORE[seller_id]

        return jsonify({"message": "Password updated successfully"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True, port=5000)