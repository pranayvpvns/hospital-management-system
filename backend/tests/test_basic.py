import pytest
from fastapi.testclient import TestClient
from app import app
from extensions import Base, engine


@pytest.fixture(scope="module")
def client():
    """Create test client with fresh database tables."""
    Base.metadata.create_all(bind=engine)
    with TestClient(app) as c:
        yield c


def test_health_check(client):
    """Verify the app is running."""
    response = client.get('/')
    assert response.status_code == 200
    assert response.json()['status'] == 'MNH Hospital API is running'


def test_api_health(client):
    """Verify the API health endpoint."""
    response = client.get('/api/health')
    assert response.status_code == 200


def test_auth_login_requires_body(client):
    """Login endpoint should reject empty requests."""
    response = client.post('/api/auth/login')
    assert response.status_code == 422  # Pydantic validation error


def test_register_and_login(client):
    """Test full register + login flow."""
    # Register
    reg = client.post('/api/auth/register', json={
        'email': 'test_basic@hospital.com',
        'password': 'test123',
        'name': 'Test User',
        'role': 'patient'
    })
    assert reg.status_code == 201

    # Login
    login = client.post('/api/auth/login', json={
        'email': 'test_basic@hospital.com',
        'password': 'test123'
    })
    assert login.status_code == 200
    data = login.json()
    assert 'token' in data
    assert data['user']['email'] == 'test_basic@hospital.com'
