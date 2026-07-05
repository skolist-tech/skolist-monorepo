from aws_cdk import (
    CfnOutput,
    RemovalPolicy,
    Stack,
    aws_iam as iam,
    aws_secretsmanager as secretsmanager,
)
from constructs import Construct

# Mirrors infra/secrets.tf (the GCP Secret Manager equivalent) so the same
# secret names can be looked up regardless of which cloud is serving a given
# environment.
SHARED_SECRETS = [
    "SUPABASE_SMS_HOOK_SECRET",
    "FIREBASE_CREDENTIALS",
]

PROD_SECRETS = [
    "SUPABASE_URL",
    "SUPABASE_SERVICE_KEY",
    "SUPABASE_ANON_KEY",
    "GEMINI_API_KEY",
    "OPENAI_API_KEY",
]

STAGE_SECRETS = [
    "SUPABASE_URL_STAGE",
    "SUPABASE_SERVICE_KEY_STAGE",
    "SUPABASE_ANON_KEY_STAGE",
    "GEMINI_API_KEY_STAGE",
    "OPENAI_API_KEY_STAGE",
]


class SecretsStack(Stack):
    """Provisions one AWS Secrets Manager secret per entry in
    SHARED_SECRETS / PROD_SECRETS / STAGE_SECRETS.

    Secrets are created empty (a random placeholder value) — populate the
    real values out of band (console, CLI, or CI) after deploy, the same way
    infra/secrets.tf leaves version management outside Terraform.
    """

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        self.secrets: dict[str, secretsmanager.Secret] = {}

        for name in [*SHARED_SECRETS, *PROD_SECRETS, *STAGE_SECRETS]:
            secret = secretsmanager.Secret(
                self,
                name,
                secret_name=name,
                description=f"Skolist backend secret: {name}",
                # Secrets are managed by hand after creation; don't let a
                # stack teardown take the live values with it.
                removal_policy=RemovalPolicy.RETAIN,
            )
            self.secrets[name] = secret
            CfnOutput(self, f"{name}Arn", value=secret.secret_arn)

    def grant_read(
        self, grantee: iam.IGrantable, names: list[str] | None = None
    ) -> None:
        """Grant an IAM principal (e.g. an ECS task role) read access to the
        given secrets, or to all of them if names is omitted."""
        for name in names or self.secrets.keys():
            self.secrets[name].grant_read(grantee)
