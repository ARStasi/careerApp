from pathlib import Path
import sys

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.database import get_db  # noqa: E402
from app.main import app  # noqa: E402
from app.models import Base  # noqa: E402


@pytest.fixture()
def client(tmp_path: Path):
  test_db_path = tmp_path / 'career_test.db'
  test_engine = create_engine(
    f'sqlite:///{test_db_path}',
    connect_args={'check_same_thread': False},
  )
  TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

  Base.metadata.create_all(bind=test_engine)

  def override_get_db():
    db = TestingSessionLocal()
    try:
      yield db
    finally:
      db.close()

  app.dependency_overrides[get_db] = override_get_db
  with TestClient(app) as test_client:
    yield test_client
  app.dependency_overrides.clear()


def create_company_and_role(client: TestClient) -> tuple[int, int]:
  company_resp = client.post(
    '/api/companies',
    json={'name': 'Acme Corp', 'industry': 'Tech', 'city': 'Austin', 'state': 'TX'},
  )
  assert company_resp.status_code == 201
  company_id = company_resp.json()['id']

  role_resp = client.post(
    f'/api/companies/{company_id}/roles',
    json={
      'title': 'Principal Engineer',
      'level': 'L6',
      'city': 'Austin',
      'state': 'TX',
      'is_remote': True,
    },
  )
  assert role_resp.status_code == 201
  role_id = role_resp.json()['id']
  return company_id, role_id


def test_role_update_flow(client: TestClient):
  _, role_id = create_company_and_role(client)

  update_resp = client.put(
    f'/api/roles/{role_id}',
    json={
      'title': 'Senior Principal Engineer',
      'level': 'L7',
      'city': 'Austin',
      'state': 'TX',
      'is_remote': False,
      'summary': 'Owns architecture and execution.',
    },
  )
  assert update_resp.status_code == 200
  payload = update_resp.json()
  assert payload['title'] == 'Senior Principal Engineer'
  assert payload['is_remote'] is False
  assert payload['summary'] == 'Owns architecture and execution.'


def test_accomplishment_reorder_endpoint(client: TestClient):
  _, role_id = create_company_and_role(client)

  first = client.post(
    f'/api/roles/{role_id}/accomplishments',
    json={'description': 'Built platform', 'category': 'resume_bullet', 'sort_order': 0},
  )
  second = client.post(
    f'/api/roles/{role_id}/accomplishments',
    json={'description': 'Scaled services', 'category': 'resume_bullet', 'sort_order': 1},
  )
  assert first.status_code == 201
  assert second.status_code == 201

  first_id = first.json()['id']
  second_id = second.json()['id']

  reorder_resp = client.patch(
    f'/api/roles/{role_id}/accomplishments/reorder',
    json={'accomplishment_ids': [second_id, first_id]},
  )
  assert reorder_resp.status_code == 200

  list_resp = client.get(f'/api/roles/{role_id}/accomplishments')
  assert list_resp.status_code == 200
  items = list_resp.json()
  assert [item['id'] for item in items] == [second_id, first_id]


def test_workflow_validate_and_export(client: TestClient):
  _, role_id = create_company_and_role(client)
  client.put('/api/profile', json={'name': 'Taylor Dev', 'email': 'taylor@example.com'})
  client.post(
    f'/api/roles/{role_id}/accomplishments',
    json={'description': 'Shipped product', 'category': 'resume_bullet', 'sort_order': 0},
  )

  invalid_yaml_resp = client.post('/api/workflow/validate-yaml', json={'yaml_content': 'foo: bar'})
  assert invalid_yaml_resp.status_code == 200
  assert invalid_yaml_resp.json()['valid'] is False

  valid_yaml = """
resumeStructure:
  header:
    line1: Taylor Dev
    line2: test@example.com | https://portfolio.example.com
  workExperience:
    companies: []
  education: {}
  certificationsSkills: {}
""".strip()
  valid_yaml_resp = client.post('/api/workflow/validate-yaml', json={'yaml_content': valid_yaml})
  assert valid_yaml_resp.status_code == 200
  assert valid_yaml_resp.json()['valid'] is True

  export_resp = client.post(
    '/api/workflow/export-document',
    json={'role_ids': [role_id], 'include_supporting': True, 'include_awards': True, 'include_presentations': True},
  )
  assert export_resp.status_code == 200
  export_content = export_resp.json()['content']
  assert '# Profile' in export_content
  assert '# Work Experience' in export_content
  assert 'Shipped product' in export_content
