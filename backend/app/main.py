from fastapi import FastAPI

app = FastAPI(
    title="AMORA API",
    description="Backend API for the AMORA wellness application",
    version="0.1.0",
)


@app.get("/")
def root():
    return {
        "message": "AMORA API is running",
        "status": "healthy",
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "AMORA API",
    }