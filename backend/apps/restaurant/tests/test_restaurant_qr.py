"""
SIA HMS — Restaurant QR Code and Public Menu Tests
"""

import pytest
import uuid
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django_tenants.utils import schema_context

from apps.accounts.models import User
from apps.restaurant.models import DiningArea, DiningTable, MenuCategory, MenuItem
from apps.tenants.models import Client, Domain

pytestmark = pytest.mark.django_db


@pytest.fixture
def test_tenant(db):
    """Creates a test tenant client and domain."""
    try:
        Domain.objects.filter(domain="restaurant-test.localhost").delete()
        Client.objects.filter(schema_name="test_restaurant_tenant").delete()
    except Exception:
        pass

    client = Client.objects.create(
        schema_name="test_restaurant_tenant",
        name="Restaurant Test Hotel",
        contact_email="restaurant_test@hotel.com",
    )
    domain = Domain.objects.create(
        domain="restaurant-test.localhost",
        tenant=client,
        is_primary=True,
    )
    yield client


@pytest.fixture
def public_client(test_tenant):
    """Returns an unauthenticated APIClient routed to the tenant schema."""
    return APIClient(HTTP_HOST="restaurant-test.localhost")


@pytest.fixture
def sample_data(test_tenant):
    """Sets up dining tables and menu catalogs in the test tenant context."""
    with schema_context(test_tenant.schema_name):
        area = DiningArea.objects.create(name="Garden Terrace")
        
        # Table 1: with auto-generated UUID
        table1 = DiningTable.objects.create(
            area=area,
            table_number="GT-1",
            capacity=2,
        )
        
        # Menu catalog
        cat = MenuCategory.objects.create(name="Starters", display_order=1, is_active=True)
        cat_inactive = MenuCategory.objects.create(name="Specials", display_order=2, is_active=False)
        
        # Available item in active category
        item1 = MenuItem.objects.create(
            category=cat,
            name="Garlic Bread",
            price=250.00,
            is_available=True,
        )
        # Unavailable item in active category
        item2 = MenuItem.objects.create(
            category=cat,
            name="Chicken Wings",
            price=450.00,
            is_available=False,
        )
        # Available item in inactive category
        item3 = MenuItem.objects.create(
            category=cat_inactive,
            name="Lobster",
            price=1500.00,
            is_available=True,
        )

        return table1, cat, item1, item2, item3


class TestRestaurantQRAndPublicMenu:
    """Verifies QR resolution and public menu filtering endpoints."""

    def test_resolve_qr_code_success(self, test_tenant, public_client, sample_data):
        table1, _, _, _, _ = sample_data
        
        # We need the actual QR code UUID from the created table
        with schema_context(test_tenant.schema_name):
            qr_uuid = str(table1.qr_code)
            
        url = f"/api/restaurant/tables/qr/{qr_uuid}/"
        response = public_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data["table_id"] == table1.id
        assert response.data["table_number"] == "GT-1"
        assert response.data["area_name"] == "Garden Terrace"

    def test_resolve_qr_code_not_found(self, test_tenant, public_client, sample_data):
        fake_uuid = str(uuid.uuid4())
        url = f"/api/restaurant/tables/qr/{fake_uuid}/"
        response = public_client.get(url)
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "error" in response.data

    def test_public_menu_filtering_and_caching(self, test_tenant, public_client, sample_data):
        url = "/api/restaurant/categories/public/"
        response = public_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        # Cache control header
        assert response["Cache-Control"] == "public, max-age=300"
        
        # Inactive category ("Specials") and unavailable item ("Chicken Wings") should be filtered out
        # Active category "Starters" should exist and contain only "Garlic Bread"
        assert len(response.data) == 1
        category_data = response.data[0]
        assert category_data["name"] == "Starters"
        
        items_data = category_data["items"]
        assert len(items_data) == 1
        assert items_data[0]["name"] == "Garlic Bread"
        assert float(items_data[0]["price"]) == 250.00
