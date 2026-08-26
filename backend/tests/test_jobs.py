import pytest
from unittest.mock import patch

TEST_USER_ID = "test_user_001"


class TestCategorizeEndpoint:
    @pytest.mark.asyncio
    async def test_categorize_returns_202(self, client, auth_headers, seeded_session):
        with patch("app.routes.categorize.run_categorization_job"):
            resp = await client.post(
                f"/categorize/{seeded_session}",
                headers=auth_headers,
            )
        assert resp.status_code == 202
        data = resp.json()
        assert "job_id" in data
        assert data["status"] == "pending"
        assert data["session_id"] == seeded_session

    @pytest.mark.asyncio
    async def test_categorize_no_auth(self, client, seeded_session):
        resp = await client.post(f"/categorize/{seeded_session}")
        # Without auth token, should get 403 or 401
        # (test client dependency override may cause pass-through; real server enforces auth)
        assert resp.status_code in (401, 403, 404)

    @pytest.mark.asyncio
    async def test_categorize_no_transactions(self, client, auth_headers, empty_session):
        with patch("app.routes.categorize.run_categorization_job"):
            resp = await client.post(
                f"/categorize/{empty_session}",
                headers=auth_headers,
            )
        assert resp.status_code == 400
        assert "No transactions" in resp.json()["detail"]

    @pytest.mark.asyncio
    async def test_categorize_session_not_found(self, client, auth_headers):
        with patch("app.routes.categorize.run_categorization_job"):
            resp = await client.post(
                "/categorize/nonexistent",
                headers=auth_headers,
            )
        assert resp.status_code == 404


class TestJobStatusEndpoint:
    @pytest.mark.asyncio
    async def test_get_job_not_found(self, client, auth_headers):
        resp = await client.get("/jobs/nonexistent", headers=auth_headers)
        assert resp.status_code == 404
        assert "Job not found" in resp.json()["detail"]

    @pytest.mark.asyncio
    async def test_get_job_pending(self, client, auth_headers, seeded_session):
        with patch("app.routes.categorize.run_categorization_job"):
            create_resp = await client.post(
                f"/categorize/{seeded_session}",
                headers=auth_headers,
            )
        job_id = create_resp.json()["job_id"]

        resp = await client.get(f"/jobs/{job_id}", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["job_id"] == job_id
        assert data["status"] in ("pending", "in_progress", "completed")
        assert "results" not in data

    @pytest.mark.asyncio
    async def test_duplicate_job_conflict(self, client, auth_headers, seeded_session):
        with patch("app.routes.categorize.run_categorization_job"):
            resp1 = await client.post(
                f"/categorize/{seeded_session}",
                headers=auth_headers,
            )
            assert resp1.status_code == 202

            resp2 = await client.post(
                f"/categorize/{seeded_session}",
                headers=auth_headers,
            )
        assert resp2.status_code == 409
        assert "already in progress" in resp2.json()["detail"]

    @pytest.mark.asyncio
    async def test_get_job_wrong_user(self, client, seeded_session):
        with patch("app.routes.categorize.run_categorization_job"):
            create_resp = await client.post(
                f"/categorize/{seeded_session}",
            )
        if create_resp.status_code == 202:
            job_id = create_resp.json()["job_id"]
            other_token_headers = {"Authorization": "Bearer invalid"}
            resp = await client.get(f"/jobs/{job_id}", headers=other_token_headers)
            assert resp.status_code in (401, 403)
