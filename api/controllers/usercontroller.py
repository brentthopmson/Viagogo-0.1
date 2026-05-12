from fastapi import APIRouter
from api.services.userservice import UserService, UserRegisterRequest, UserLoginRequest, VerifyAccountRequest

router = APIRouter()
user_service = UserService()

@router.post("/register-user")
def register_user(request: UserRegisterRequest):
    return user_service.register_user(request)

@router.post("/login")
def login_user(request: UserLoginRequest):
    return user_service.login_user(request)

@router.get("/confirm")
def confirm_user():
    return user_service.confirm_user()

@router.post("/verify")
def verify_account(request: VerifyAccountRequest):
    return user_service.verify_account(request)

@router.put("/update-user")
def update_user():
    return user_service.update_user()

@router.delete("/delete-user")
def delete_user():
    return user_service.delete_user()

@router.get("/list-users")
def list_users():
    return user_service.list_users()

@router.get("/get-user-by-id")
def get_user_by_id():
    return user_service.get_user_by_id()

@router.get("/get-user-by-email")
def get_user_by_email():
    return user_service.get_user_by_email()