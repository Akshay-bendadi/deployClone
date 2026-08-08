"""Thin wrapper around the Zerops public API (plan.txt §16-17).

Base URL, auth, and every read endpoint below have been verified against a live token
and project (the Swagger reference is a JS-rendered SPA that can't be scraped, so this
was confirmed by direct HTTP calls instead — see git history for the discovery trail).
Write operations (import_service_stack, trigger_deploy) are still unverified and marked
NotImplementedError rather than guessing at a schema that could silently misbehave
against a real account.
"""

from dataclasses import dataclass
from functools import lru_cache

import httpx

from app.config import get_settings

_DEFAULT_BASE_URL = "https://api.app-prg1.zerops.io/api/rest/public"


@dataclass
class ZeropsServiceStack:
    id: str
    name: str
    status: str
    service_type: str
    public_url: str | None


def _extract_public_url(service_stack: dict) -> str | None:
    for entry in service_stack.get("userData", []):
        if entry.get("key") == "zeropsSubdomain":
            return entry.get("content")
    return None


class ZeropsClient:
    def __init__(self, api_token: str, base_url: str = _DEFAULT_BASE_URL) -> None:
        self._client = httpx.Client(
            base_url=base_url,
            headers={"Authorization": f"Bearer {api_token}"},
            timeout=30.0,
        )

    def close(self) -> None:
        self._client.close()

    def __enter__(self) -> "ZeropsClient":
        return self

    def __exit__(self, *exc_info: object) -> None:
        self.close()

    def get_project(self, project_id: str) -> dict:
        response = self._client.get(f"/project/{project_id}")
        response.raise_for_status()
        return response.json()

    def list_service_stacks(self, *, client_id: str, project_id: str) -> list[ZeropsServiceStack]:
        response = self._client.post(
            "/service-stack/search",
            json={
                "search": [
                    {"name": "clientId", "operator": "eq", "value": client_id},
                    {"name": "projectId", "operator": "eq", "value": project_id},
                ]
            },
        )
        response.raise_for_status()
        items = response.json()["items"]
        return [
            ZeropsServiceStack(
                id=item["id"],
                name=item["name"],
                status=item["status"],
                service_type=item["serviceStackTypeId"],
                public_url=_extract_public_url(item),
            )
            for item in items
        ]

    def get_service_stack(self, service_stack_id: str) -> dict:
        response = self._client.get(f"/service-stack/{service_stack_id}")
        response.raise_for_status()
        return response.json()

    def import_service_stack(self, project_id: str, yaml_definition: str) -> dict:
        """Creates candidate services (API/DB/worker/Valkey) from a zerops.yaml-style definition.

        TODO: exact endpoint/payload shape unverified — confirm against a live token
        (likely POST /service-stack/import or similar) before relying on this in production.
        """
        raise NotImplementedError(
            "ZeropsClient.import_service_stack needs its request shape verified against a "
            "live Zerops token before use — see module docstring."
        )

    def trigger_deploy(self, service_stack_id: str, *, package_path: str) -> dict:
        """Deploys a build/package to an existing candidate service.

        TODO: exact endpoint/payload shape unverified — confirm against a live token
        (likely POST /app-version plus an upload step) before relying on this in production.
        """
        raise NotImplementedError(
            "ZeropsClient.trigger_deploy needs its request shape verified against a "
            "live Zerops token before use — see module docstring."
        )


@lru_cache
def get_zerops_client() -> ZeropsClient | None:
    settings = get_settings()
    if not settings.zerops_api_token:
        return None
    return ZeropsClient(api_token=settings.zerops_api_token)
