from fastapi import FastAPI
from api.controllers import usercontroller

app = FastAPI()

app.include_router(usercontroller.router, prefix="/api/v1/auth", tags=["User"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api.index:app", host="0.0.0.0", port=8000, reload=True)