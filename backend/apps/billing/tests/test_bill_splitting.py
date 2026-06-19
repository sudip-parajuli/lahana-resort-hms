"""
SIA HMS — Group Bill Splitting Tests
"""

import pytest
from decimal import Decimal
from django.urls import reverse
from rest_framework import status
from django_tenants.utils import schema_context

from apps.billing.models import Invoice, InvoiceStatus, InvoiceType, PaymentMethod, SplitPayment, Payment
from apps.billing.tests.test_billing import billing_tenant, billing_manager, billing_client, billing_setup_data

pytestmark = pytest.mark.django_db


class TestGroupBillSplitting:
    """Verifies group check-out split payment actions and models."""

    def test_split_payment_model_creation(self, billing_tenant, billing_setup_data):
        with schema_context(billing_tenant.schema_name):
            res = billing_setup_data["reservation"]
            invoice = Invoice.objects.create(
                invoice_type=InvoiceType.HOTEL,
                reservation=res,
                total_amount=Decimal("1000.00"),
                balance_due=Decimal("1000.00"),
                status=InvoiceStatus.UNPAID,
            )
            
            sp = SplitPayment.objects.create(
                invoice=invoice,
                amount=Decimal("500.00"),
                payment_method=PaymentMethod.CASH,
                reference="REF-SPLIT-1",
                description="Guest 1 Share",
            )
            
            assert sp.pk is not None
            assert sp.amount == Decimal("500.00")
            assert sp.payment_method == "cash"
            assert sp.reference == "REF-SPLIT-1"
            assert str(sp) == f"Split Payment of Rs. 500.00 for {invoice.invoice_number}"

    def test_split_action_success(self, billing_tenant, billing_setup_data, billing_client):
        invoice_id = None
        with schema_context(billing_tenant.schema_name):
            res = billing_setup_data["reservation"]
            invoice = Invoice.objects.create(
                invoice_type=InvoiceType.HOTEL,
                reservation=res,
                total_amount=Decimal("15000.00"),
                balance_due=Decimal("15000.00"),
                status=InvoiceStatus.UNPAID,
            )
            invoice_id = invoice.id

        url = reverse("invoice-split", kwargs={"pk": invoice_id})
        payload = {
            "splits": [
                {
                    "amount": "5000.00",
                    "payment_method": "cash",
                    "reference": "REF-CASH",
                    "description": "Guest A Cash Payment",
                },
                {
                    "amount": "10000.00",
                    "payment_method": "esewa",
                    "reference": "REF-ESEWA",
                    "description": "Guest B eSewa Payment",
                }
            ]
        }

        response = billing_client.post(url, payload, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["status"] == "paid"
        assert response.data["paid_amount"] == "15000.00"
        assert response.data["balance_due"] == "0.00"
        
        # Verify split payments list is serialized
        assert len(response.data["split_payments"]) == 2
        assert response.data["split_payments"][0]["amount"] == "10000.00"
        assert response.data["split_payments"][0]["payment_method"] == "esewa"

        # Check DB states
        with schema_context(billing_tenant.schema_name):
            inv = Invoice.objects.get(pk=invoice_id)
            assert inv.status == InvoiceStatus.PAID
            assert inv.payments.count() == 2
            assert inv.split_payments.count() == 2

    def test_split_action_validation_fails_on_sum_mismatch(self, billing_tenant, billing_setup_data, billing_client):
        invoice_id = None
        with schema_context(billing_tenant.schema_name):
            res = billing_setup_data["reservation"]
            invoice = Invoice.objects.create(
                invoice_type=InvoiceType.HOTEL,
                reservation=res,
                total_amount=Decimal("10000.00"),
                balance_due=Decimal("10000.00"),
                status=InvoiceStatus.UNPAID,
            )
            invoice_id = invoice.id

        url = reverse("invoice-split", kwargs={"pk": invoice_id})
        # Sum of splits is 9000, but balance_due is 10000
        payload = {
            "splits": [
                {"amount": "4000.00", "payment_method": "cash"},
                {"amount": "5000.00", "payment_method": "card"}
            ]
        }

        response = billing_client.post(url, payload, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "must equal balance due" in response.data["error"]
