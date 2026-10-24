from backend.app.db.session import engine, Base
import backend.app.models  # Ensure all models are registered with Base metadata


def init_db():
    Base.metadata.create_all(bind=engine)


if __name__ == "__main__":
    print("Initializing database tables...")
    init_db()
    print("Database tables initialized successfully!")
