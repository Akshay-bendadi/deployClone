"""Thin wrapper around the Zerops public API.

Every endpoint below is verified against Zerops' real OpenAPI spec (fetched from
`{base_url}/swagger/openapi.yml` — their interactive Swagger UI is a JS-rendered SPA
that can't be scraped, but it loads this static spec file directly) and, for the
core read/write flow, against a live token and project.

Candidate creation flow:
  1. import_service_stack  — POST /project/{id}/service-stack/import, creates the
     service with `startWithoutCode: true` (code is uploaded separately, not via
     buildFromGit, because buildFromGit only supports a repo's default branch with
     no way to pin an exact commit — confirmed live: BaseAppVersionPublicGitSource
     only tracks gitUrl+branchName, no commit field).
  2. create_app_version     — POST /service-stack/{id}/app-version, returns an
     upload URL.
  3. upload_artifact        — PUT the release's exact-commit tarball to that URL.
  4. build_and_deploy       — POST /app-version/{id}/build-and-deploy with the
     repository's own zerops.yaml content (already fetched by deployment_service).
"""

import time
from dataclasses import dataclass
from functools import lru_cache

import httpx
import yaml

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

    def import_service_stack(
        self,
        project_id: str,
        *,
        hostname: str,
        service_type: str,
        env_vars: dict[str, str] | None = None,
    ) -> str:
        """Creates a service with no code yet, ready for an explicit app-version upload.

        Returns the new service stack's id.
        """
        service: dict[str, object] = {
            "hostname": hostname,
            "type": service_type,
            "startWithoutCode": True,
            # Confirmed via direct testing (with Zerops support) that this flag is
            # silently ignored at import time — subdomain routing never actually gets
            # enabled from this alone, producing a permanent 502 with no error anywhere.
            # Kept here for whenever that's fixed; enable_subdomain_access() below is
            # the real, verified-working mechanism and must always be called too.
            "enableSubdomainAccess": True,
        }
        if env_vars:
            service["envSecrets"] = env_vars

        yaml_definition = yaml.safe_dump({"services": [service]}, sort_keys=False)
        response = self._client.post(
            f"/project/{project_id}/service-stack/import", json={"yaml": yaml_definition}
        )
        response.raise_for_status()
        return response.json()["serviceStacks"][0]["id"]

    def enable_subdomain_access(self, service_stack_id: str) -> None:
        """Actually enables subdomain routing for a service.

        Required even though `import_service_stack` also sets `enableSubdomainAccess:
        true` in its YAML — that field is confirmed silently ignored (verified live
        with Zerops support), so without this explicit call the service builds and
        reports ACTIVE but is permanently unreachable (502) with zero indication why.

        This can only succeed once the service is recognized as HTTP (i.e. its `ports`
        with httpSupport from the build have actually been applied) — calling it right
        when the app-version first reports ACTIVE can still 400 with
        "Service stack is not http or https", since that metadata propagates a moment
        after the status flips. Retried briefly to absorb that race.
        """
        last_exc: httpx.HTTPStatusError | None = None
        for attempt in range(5):
            if attempt:
                time.sleep(3)
            response = self._client.put(f"/service-stack/{service_stack_id}/enable-subdomain-access", json={})
            if response.status_code < 400:
                return
            last_exc = httpx.HTTPStatusError(
                f"{response.status_code}: {response.text}", request=response.request, response=response
            )
        assert last_exc is not None
        raise last_exc

    def create_app_version(self, service_stack_id: str) -> tuple[str, str]:
        """Returns (app_version_id, upload_url)."""
        response = self._client.post(f"/service-stack/{service_stack_id}/app-version", json={})
        response.raise_for_status()
        payload = response.json()
        return payload["id"], payload["uploadUrl"]

    def upload_artifact(self, upload_url: str, content: bytes) -> None:
        """Uploads a build artifact (gzip tarball) to a presigned URL from create_app_version."""
        response = httpx.put(upload_url, content=content, timeout=120.0)
        response.raise_for_status()

    def build_and_deploy(self, app_version_id: str, zeropsyaml_content: str) -> None:
        response = self._client.put(
            f"/app-version/{app_version_id}/build-and-deploy",
            json={"zeropsYaml": zeropsyaml_content},
        )
        response.raise_for_status()

    def get_app_version(self, app_version_id: str) -> dict:
        response = self._client.get(f"/app-version/{app_version_id}")
        response.raise_for_status()
        return response.json()

    def delete_service_stack(self, service_stack_id: str) -> None:
        response = self._client.delete(f"/service-stack/{service_stack_id}")
        response.raise_for_status()


@lru_cache
def get_zerops_client() -> ZeropsClient | None:
    settings = get_settings()
    if not settings.zerops_api_token:
        return None
    return ZeropsClient(api_token=settings.zerops_api_token)
