"""
SIA HMS — Reports Tests
"""

import pytest
from unittest.mock import patch, MagicMock
from datetime import date
from django_tenants.utils import schema_context
from apps.tenants.models import Client, Domain
from apps.reports import pdf_builders

pytestmark = pytest.mark.django_db


@pytest.fixture
def test_tenant(db):
    """Creates a test tenant client and domain."""
    # Clean up stale test data if any
    try:
        Domain.objects.filter(domain="reports-test.localhost").delete()
        Client.objects.filter(schema_name="test_reports_tenant").delete()
    except Exception:
        pass

    client = Client.objects.create(
        schema_name="test_reports_tenant",
        name="Reports Test Hotel",
        contact_email="reports_test@hotel.com",
    )
    Domain.objects.create(
        domain="reports-test.localhost",
        tenant=client,
        is_primary=True,
    )
    yield client


@patch("apps.reports.pdf_builders.HTML")
@patch("apps.reports.pdf_builders.render_to_string")
def test_pdf_revenue_builder(mock_render, mock_html, test_tenant):
    mock_render.return_value = "<html>Test</html>"
    mock_write_pdf = MagicMock()
    mock_html.return_value.write_pdf = mock_write_pdf
    
    start = date(2026, 6, 1)
    end = date(2026, 6, 14)
    
    with schema_context(test_tenant.schema_name):
        pdf_builders.build_revenue_pdf(start, end)
    
    mock_render.assert_called_once()
    mock_html.assert_called_with(string="<html>Test</html>")
    mock_write_pdf.assert_called_once()


@patch("apps.reports.pdf_builders.HTML")
@patch("apps.reports.pdf_builders.render_to_string")
def test_pdf_occupancy_builder(mock_render, mock_html, test_tenant):
    mock_render.return_value = "<html>Test</html>"
    mock_write_pdf = MagicMock()
    mock_html.return_value.write_pdf = mock_write_pdf
    
    start = date(2026, 6, 1)
    end = date(2026, 6, 14)
    
    with schema_context(test_tenant.schema_name):
        pdf_builders.build_occupancy_pdf(start, end)
    
    mock_render.assert_called_once()
    mock_write_pdf.assert_called_once()


@patch("apps.reports.pdf_builders.HTML")
@patch("apps.reports.pdf_builders.render_to_string")
def test_pdf_guest_ledger_builder(mock_render, mock_html, test_tenant):
    mock_render.return_value = "<html>Test</html>"
    mock_write_pdf = MagicMock()
    mock_html.return_value.write_pdf = mock_write_pdf
    
    with schema_context(test_tenant.schema_name):
        pdf_builders.build_guest_ledger_pdf()
    
    mock_render.assert_called_once()
    mock_write_pdf.assert_called_once()


@patch("apps.reports.pdf_builders.HTML")
@patch("apps.reports.pdf_builders.render_to_string")
def test_pdf_nepal_vat_book_builder(mock_render, mock_html, test_tenant):
    mock_render.return_value = "<html>Test</html>"
    mock_write_pdf = MagicMock()
    mock_html.return_value.write_pdf = mock_write_pdf
    
    start = date(2026, 6, 1)
    end = date(2026, 6, 14)
    
    with schema_context(test_tenant.schema_name):
        pdf_builders.build_nepal_vat_book_pdf(start, end)
    
    mock_render.assert_called_once()
    mock_write_pdf.assert_called_once()
