"""
SIA HMS — Booking Advance Deposit & Cancellation Policy Tests
"""

import pytest
from decimal import Decimal
from datetime import date, timedelta
from django.urls import reverse
from rest_framework import status
from django_tenants.utils import schema_context

from apps.accounts.models import UserRole
from apps.bookings.models import Reservation, ReservationStatus, GuestProfile
from apps.billing.models import Invoice, InvoiceStatus, Payment, PaymentMethod
from apps.bookings.tests.test_bookings import test_tenant, tenant_user, tenant_auth_client, sample_setup

pytestmark = pytest.mark.django_db


class TestCancellationAndDepositPolicies:
    """Verifies advance deposits invoice generation and proximity refunds."""

    def test_reservation_creation_generates_deposit_invoice(self, test_tenant, tenant_auth_client, sample_setup):
        p, rt, room, guest_profile = sample_setup
        with schema_context(test_tenant.schema_name):
            # Update property policies
            p.advance_deposit_percent = 50
            p.save()

            guest = GuestProfile.objects.create(
                first_name="Sita",
                last_name="Kumari",
                phone="9800000002",
            )
            guest_id = guest.id

        url = reverse("reservation-list")
        payload = {
            "guest_id": guest_id,
            "room_id": room.id,
            "check_in_date": str(date.today() + timedelta(days=5)),
            "check_out_date": str(date.today() + timedelta(days=7)),
            "adults": 1,
        }

        response = tenant_auth_client.post(url, payload, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        
        # Check generated invoice in DB
        with schema_context(test_tenant.schema_name):
            res = Reservation.objects.get(id=response.data["id"])
            assert res.deposit_amount > 0
            assert res.deposit_paid is False
            
            # Verify deposit invoice exists
            deposit_invoice = res.invoices.filter(notes="Advance deposit invoice").first()
            assert deposit_invoice is not None
            assert deposit_invoice.total_amount == res.deposit_amount
            assert deposit_invoice.status == InvoiceStatus.UNPAID

    def test_deposit_invoice_payment_updates_deposit_paid(self, test_tenant, tenant_auth_client, sample_setup):
        p, rt, room, guest_profile = sample_setup
        with schema_context(test_tenant.schema_name):
            p.advance_deposit_percent = 50
            p.save()
            guest = GuestProfile.objects.create(first_name="Sita", last_name="Kumari", phone="9800000002")
            res = Reservation.objects.create(
                guest=guest,
                room=room,
                check_in_date=date.today() + timedelta(days=5),
                check_out_date=date.today() + timedelta(days=7),
                adults=1,
                total_nights=2,
                base_amount=Decimal("10000.00"),
                tax_amount=Decimal("1300.00"),
                total_amount=Decimal("11300.00"),
                deposit_amount=Decimal("5650.00"),
                deposit_paid=False,
            )
            # Create invoice
            inv = Invoice.objects.create(
                reservation=res,
                subtotal=Decimal("5650.00"),
                total_amount=Decimal("5650.00"),
                balance_due=Decimal("5650.00"),
                status=InvoiceStatus.UNPAID,
                notes="Advance deposit invoice",
            )
            inv_id = inv.id

        # Settle the deposit invoice
        pay_url = reverse("invoice-payments", kwargs={"pk": inv_id})
        pay_payload = {
            "amount": "5650.00",
            "payment_method": PaymentMethod.CASH,
            "reference_number": "DEP-CASH-1",
        }
        
        response = tenant_auth_client.post(pay_url, pay_payload)
        assert response.status_code == status.HTTP_201_CREATED
        
        with schema_context(test_tenant.schema_name):
            res.refresh_from_db()
            assert res.deposit_paid is True

    def test_cancel_outside_free_window_full_refund(self, test_tenant, tenant_auth_client, sample_setup):
        p, rt, room, guest_profile = sample_setup
        with schema_context(test_tenant.schema_name):
            p.free_cancellation_days = 2
            p.cancellation_refund_percent = 50
            p.save()
            
            guest = GuestProfile.objects.create(first_name="Ram", last_name="Prasad", phone="9800000003")
            # Proximity is 5 days (>= 2 days free window)
            res = Reservation.objects.create(
                guest=guest,
                room=room,
                check_in_date=date.today() + timedelta(days=5),
                check_out_date=date.today() + timedelta(days=7),
                adults=1,
                total_nights=2,
                base_amount=Decimal("10000.00"),
                tax_amount=Decimal("1300.00"),
                total_amount=Decimal("11300.00"),
                deposit_amount=Decimal("5650.00"),
                deposit_paid=True,
            )
            inv = Invoice.objects.create(
                reservation=res,
                subtotal=Decimal("5650.00"),
                total_amount=Decimal("5650.00"),
                paid_amount=Decimal("5650.00"),
                balance_due=Decimal("0.00"),
                status=InvoiceStatus.PAID,
                notes="Advance deposit invoice",
            )
            res_id = res.id
            inv_id = inv.id

        url = reverse("reservation-cancel", kwargs={"pk": res_id})
        response = tenant_auth_client.post(url, {"cancellation_reason": "Change of plan"})
        assert response.status_code == status.HTTP_200_OK
        assert response.data["status"] == "cancelled"

        with schema_context(test_tenant.schema_name):
            inv.refresh_from_db()
            # 100% refund creates a negative Payment of Rs. 5650
            assert inv.paid_amount == Decimal("0.00")
            refund_payment = inv.payments.filter(amount=Decimal("-5650.00")).first()
            assert refund_payment is not None
            assert refund_payment.notes == "Cancellation refund (100%)"

    def test_cancel_inside_free_window_partial_refund(self, test_tenant, tenant_auth_client, sample_setup):
        p, rt, room, guest_profile = sample_setup
        with schema_context(test_tenant.schema_name):
            p.free_cancellation_days = 3
            p.cancellation_refund_percent = 60 # 60% refund inside free cancellation
            p.save()
            
            guest = GuestProfile.objects.create(first_name="Ram", last_name="Prasad", phone="9800000003")
            # Proximity is 1 day (< 3 days free window)
            res = Reservation.objects.create(
                guest=guest,
                room=room,
                check_in_date=date.today() + timedelta(days=1),
                check_out_date=date.today() + timedelta(days=3),
                adults=1,
                total_nights=2,
                base_amount=Decimal("10000.00"),
                tax_amount=Decimal("1300.00"),
                total_amount=Decimal("11300.00"),
                deposit_amount=Decimal("5000.00"),
                deposit_paid=True,
            )
            inv = Invoice.objects.create(
                reservation=res,
                subtotal=Decimal("5000.00"),
                total_amount=Decimal("5000.00"),
                paid_amount=Decimal("5000.00"),
                balance_due=Decimal("0.00"),
                status=InvoiceStatus.PAID,
                notes="Advance deposit invoice",
            )
            res_id = res.id
            inv_id = inv.id

        url = reverse("reservation-cancel", kwargs={"pk": res_id})
        response = tenant_auth_client.post(url, {"cancellation_reason": "Too late"})
        assert response.status_code == status.HTTP_200_OK

        with schema_context(test_tenant.schema_name):
            inv.refresh_from_db()
            # 60% of 5000 is 3000 refund, so remaining paid is 2000
            assert inv.paid_amount == Decimal("2000.00")
            refund_payment = inv.payments.filter(amount=Decimal("-3000.00")).first()
            assert refund_payment is not None
            assert refund_payment.notes == "Cancellation refund (60%)"
