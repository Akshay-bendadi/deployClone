"""Resolves a branch name to its latest commit SHA via the GitHub REST API."""

import re

import httpx
from pydantic import BaseModel

from app.config import get_settings

_GITHUB_REPO_RE = re.compile(r"github\.com[:/](?P<owner>[^/]+)/(?P<repo>[^/.]+)")


class GitHubError(Exception):
    pass


def parse_github_repository(repository: str) -> tuple[str, str]:
    match = _GITHUB_REPO_RE.search(repository)
    if not match:
        raise GitHubError(f"Not a recognizable GitHub repository: {repository!r}")
    return match.group("owner"), match.group("repo")


def resolve_branch_commit(repository: str, branch: str, token: str | None = None) -> str:
    """Returns the latest commit SHA on `branch` for `repository` (e.g. 'github.com/org/repo').

    `token` is a per-project GitHub PAT (required for private repos — GitHub returns 404,
    not 403, for private repos to unauthorized requests). Falls back to a global
    GITHUB_TOKEN env var if set, for higher rate limits on public repos.
    """
    owner, repo = parse_github_repository(repository)
    effective_token = token or get_settings().github_token
    headers = {"Accept": "application/vnd.github+json"}
    if effective_token:
        headers["Authorization"] = f"Bearer {effective_token}"

    url = f"https://api.github.com/repos/{owner}/{repo}/commits/{branch}"
    response = httpx.get(url, headers=headers, timeout=15.0)
    if response.status_code >= 400:
        raise GitHubError(f"Branch {branch!r} not found in {repository} ({response.status_code})")
    return response.json()["sha"]


def list_branches(repository: str, token: str | None = None) -> list[str]:
    owner, repo = parse_github_repository(repository)
    effective_token = token or get_settings().github_token
    headers = {"Accept": "application/vnd.github+json"}
    if effective_token:
        headers["Authorization"] = f"Bearer {effective_token}"

    url = f"https://api.github.com/repos/{owner}/{repo}/branches"
    response = httpx.get(url, headers=headers, params={"per_page": 100}, timeout=15.0)
    if response.status_code >= 400:
        raise GitHubError(f"Could not list branches for {repository} ({response.status_code})")
    return [entry["name"] for entry in response.json()]


class BranchDiffFile(BaseModel):
    filename: str
    status: str
    additions: int
    deletions: int
    patch: str | None = None


class BranchDiff(BaseModel):
    ahead_by: int
    behind_by: int
    total_commits: int
    files: list[BranchDiffFile]


def compare_branches(repository: str, base: str, head: str, token: str | None = None) -> BranchDiff:
    # base = what's live in production, head = the release commit being tested.
    owner, repo = parse_github_repository(repository)
    effective_token = token or get_settings().github_token
    headers = {"Accept": "application/vnd.github+json"}
    if effective_token:
        headers["Authorization"] = f"Bearer {effective_token}"

    url = f"https://api.github.com/repos/{owner}/{repo}/compare/{base}...{head}"
    response = httpx.get(url, headers=headers, timeout=20.0)
    if response.status_code >= 400:
        raise GitHubError(f"Could not compare {base}...{head} in {repository} ({response.status_code})")
    payload = response.json()
    return BranchDiff(
        ahead_by=payload.get("ahead_by", 0),
        behind_by=payload.get("behind_by", 0),
        total_commits=payload.get("total_commits", 0),
        files=[
            BranchDiffFile(
                filename=f["filename"],
                status=f["status"],
                additions=f.get("additions", 0),
                deletions=f.get("deletions", 0),
                patch=f.get("patch"),
            )
            for f in payload.get("files", []) or []
        ],
    )


def download_repo_tarball(repository: str, commit_sha: str, token: str | None = None) -> bytes:
    """Downloads a gzip tarball of `repository` at the exact `commit_sha`.

    Needed because Zerops' buildFromGit only supports a repo's default branch (no ref
    pinning) — for a candidate to test the release's exact commit, we download the
    tarball ourselves and upload it to Zerops directly.
    """
    owner, repo = parse_github_repository(repository)
    effective_token = token or get_settings().github_token
    headers = {"Accept": "application/vnd.github+json"}
    if effective_token:
        headers["Authorization"] = f"Bearer {effective_token}"

    url = f"https://api.github.com/repos/{owner}/{repo}/tarball/{commit_sha}"
    response = httpx.get(url, headers=headers, timeout=60.0, follow_redirects=True)
    if response.status_code >= 400:
        raise GitHubError(f"Could not download tarball for {commit_sha} in {repository} ({response.status_code})")
    return response.content
