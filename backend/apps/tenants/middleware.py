"""
SIA HMS — Tenants Middleware
Includes ImpersonationMiddleware for SaaS mode and SingleTenantMiddleware for private installation mode.
"""

from rest_framework_simplejwt.tokens import AccessToken
from django.db import connection
from django.conf import settings
from apps.tenants.models import Client

class ImpersonationMiddleware:
    """
    Middleware that inspects the JWT token (from Auth header or cookie)
    for a tenant_schema claim. If found, and the token user role is SUPER_ADMIN,
    it dynamically overrides the active tenant context.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        raw_token = None
        header = request.META.get("HTTP_AUTHORIZATION")
        if header and header.startswith("Bearer "):
            raw_token = header.split(" ")[1]
        else:
            raw_token = request.COOKIES.get("access_token")

        if raw_token:
            try:
                token = AccessToken(raw_token)
                role = token.get("role")
                tenant_schema = token.get("tenant_schema")

                if tenant_schema and role == "SUPER_ADMIN":
                    # Dynamically route DB connection to target tenant
                    tenant = Client.objects.filter(schema_name=tenant_schema, is_active=True).first()
                    if tenant:
                        connection.set_tenant(tenant)
                        request.tenant = tenant
            except Exception:
                pass

        return self.get_response(request)


class SingleTenantMiddleware:
    """
    Middleware that bypasses subdomain-based tenant routing and instead forces
    all DB connections and requests to run under a single configured schema.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        schema_name = getattr(settings, 'SINGLE_TENANT_SCHEMA', 'lahana')
        try:
            tenant = Client.objects.filter(schema_name=schema_name, is_active=True).first()
            if tenant:
                connection.set_tenant(tenant)
                request.tenant = tenant
            else:
                connection.set_schema_to_public()
        except Exception:
            # During initial migrations, Client table might not exist yet
            connection.set_schema_to_public()

        return self.get_response(request)
