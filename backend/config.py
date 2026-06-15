import os
from dotenv import load_dotenv

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
# Load backend/.env if exists
load_dotenv(os.path.join(BASE_DIR, '.env'))
# Also load azure/.env to fetch the deployed database credentials
load_dotenv(os.path.join(BASE_DIR, '..', 'azure', '.env'))


class Config:
    SECRET_KEY: str = os.getenv('SECRET_KEY', 'dev_default_key')
    JWT_SECRET_KEY: str = os.getenv('JWT_SECRET_KEY', 'dev_jwt_key')
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_SECONDS: int = 86400  # 24 hours

    # Database - Azure SQL/MySQL or SQLite fallback
    AZURE_SQL_CONNECTION = os.getenv('AZURE_SQL_CONNECTION', '')
    MYSQL_HOST = os.getenv('MYSQL_HOST')
    MYSQL_USER = os.getenv('MYSQL_USER')
    MYSQL_PASSWORD = os.getenv('MYSQL_PASSWORD')
    MYSQL_DATABASE = os.getenv('MYSQL_DATABASE')

    if AZURE_SQL_CONNECTION:
        DATABASE_URL = AZURE_SQL_CONNECTION
    elif MYSQL_HOST and MYSQL_USER and MYSQL_PASSWORD and MYSQL_DATABASE:
        # Require PyMySQL to be installed (`pip install pymysql`)
        DATABASE_URL = f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}/{MYSQL_DATABASE}"
    else:
        DATABASE_URL = f"sqlite:///{os.path.join(BASE_DIR, 'mnh_hospital.db')}"

    # Azure OpenAI
    AZURE_OPENAI_KEY = os.getenv('AZURE_OPENAI_KEY', '')
    AZURE_OPENAI_ENDPOINT = os.getenv('AZURE_OPENAI_ENDPOINT', '')

    # Azure ML
    AZURE_ML_ENDPOINT = os.getenv('AZURE_ML_ENDPOINT', '')
    AZURE_ML_KEY = os.getenv('AZURE_ML_KEY', '')

    # Azure Storage
    AZURE_STORAGE_CONNECTION = os.getenv('AZURE_STORAGE_CONNECTION', '')


settings = Config()
