export interface Event {
  data: string;
}

export interface Source {
  repoSource?: RepoSource;
}

export interface RepoSource {
  repoName: string;
  branchName: string;
  tagName: string;
  commitSha: string;
  dir: string;
  projectId: string;
}

export interface Substitutions {
  _PLATFORM: string;
  TRIGGER_BUILD_CONFIG_PATH: string;
  REVISION_ID: string;
  TRIGGER_NAME: string;
  REPO_NAME: string;
  COMMIT_SHA: string;
  BRANCH_NAME: string;
  _SERVICE_NAME: string;
  SHORT_SHA: string;
  _GCR_HOSTNAME: string;
  _LABELS: string;
  REF_NAME: string;
  _DEPLOY_REGION: string;
  _TRIGGER_ID: string;
  _GOOGLE_FUNCTION_TARGET?: string;
}

export interface Build {
  id: string;
  status: string;
  logUrl: string;
  source: Source;
  substitutions: Substitutions;
  BRANCH_NAME: string;
  SHORT_SHA: string;
}

export function deserBuild(event: Event): Build {
  return JSON.parse(Buffer.from(event.data, 'base64').toString());
}
