"""
SIA HMS — Billing App Views
Defines InvoiceViewSet, InvoiceItemViewSet, and PaymentViewSet.
"""

from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.accounts.permissions import IsPropertyManager, IsAnyStaff
from .models import Invoice, InvoiceItem, Payment, InvoiceStatus, PaymentMethod, SplitPayment
from .serializers import InvoiceSerializer, InvoiceItemSerializer, PaymentSerializer


class InvoiceViewSet(viewsets.ModelViewSet):
    """
    CRUD for Invoices.
    """
    queryset = Invoice.objects.select_related("reservation__guest", "reservation__room").prefetch_related("items", "payments").all()
    serializer_class = InvoiceSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["status", "invoice_type", "reservation"]
    search_fields = ["invoice_number", "walk_in_guest_name", "walk_in_guest_phone"]
    ordering_fields = ["created_at", "total_amount", "paid_amount"]

    def get_permissions(self):
        if self.action in ["list", "retrieve", "pdf", "payments", "split"]:
            return [IsAnyStaff()]
        return [IsPropertyManager()]

    @action(detail=True, methods=["post"])
    def payments(self, request, pk=None):
        """
        Record a payment transaction settling a portion or all of the invoice.
        """
        invoice = self.get_object()
        amount = request.data.get("amount")
        payment_method = request.data.get("payment_method", PaymentMethod.CASH)
        reference_number = request.data.get("reference_number", "")
        notes = request.data.get("notes", "")

        if not amount:
            return Response({"error": "amount is required."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            payment = Payment.objects.create(
                invoice=invoice,
                amount=Decimal(str(amount)),
                payment_method=payment_method,
                reference_number=reference_number,
                received_by=request.user,
                notes=notes,
            )

            invoice.paid_amount += Decimal(str(amount))
            invoice.save()  # recalculated balances inside model save()

            if invoice.balance_due <= 0:
                invoice.status = InvoiceStatus.PAID
            elif invoice.paid_amount > 0:
                invoice.status = InvoiceStatus.PARTIALLY_PAID
            invoice.save()

        return Response(PaymentSerializer(payment).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def split(self, request, pk=None):
        """
        Processes a group check-out split payment allocation.
        """
        invoice = self.get_object()
        splits = request.data.get("splits", [])

        if not splits:
            return Response({"error": "splits list is required."}, status=status.HTTP_400_BAD_REQUEST)

        # Enforce that the allocated sum matches the remaining balance
        total_split_amount = sum(Decimal(str(item.get("amount", 0))) for item in splits)
        if total_split_amount != invoice.balance_due:
            return Response(
                {"error": f"Total split allocations (Rs. {total_split_amount}) must equal balance due (Rs. {invoice.balance_due})."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            for item in splits:
                amount = Decimal(str(item.get("amount", 0)))
                method = item.get("payment_method", PaymentMethod.CASH)
                ref = item.get("reference", "")
                desc = item.get("description", "Group Split Payment")

                # Create audit SplitPayment record
                SplitPayment.objects.create(
                    invoice=invoice,
                    amount=amount,
                    payment_method=method,
                    reference=ref,
                    description=desc,
                )

                # Create standard Payment record for accounting flow
                Payment.objects.create(
                    invoice=invoice,
                    amount=amount,
                    payment_method=method,
                    reference_number=ref,
                    received_by=request.user,
                    notes=desc,
                )

                invoice.paid_amount += amount

            # Recalculate balance and status
            invoice.save()
            if invoice.balance_due <= 0:
                invoice.status = InvoiceStatus.PAID
            elif invoice.paid_amount > 0:
                invoice.status = InvoiceStatus.PARTIALLY_PAID
            invoice.save()

        return Response(InvoiceSerializer(invoice).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def void(self, request, pk=None):
        """
        Voids the current invoice.
        """
        invoice = self.get_object()
        if invoice.status == InvoiceStatus.PAID:
            return Response({"error": "Cannot void a fully paid invoice."}, status=status.HTTP_400_BAD_REQUEST)

        invoice.status = InvoiceStatus.VOIDED
        invoice.save()
        return Response(InvoiceSerializer(invoice).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["get"])
    def pdf(self, request, pk=None):
        """
        Generates and streams a print-ready IRD VAT Invoice.
        """
        invoice = self.get_object()
        
        # Prepare context for the printable HTML invoice
        from django.template.loader import render_to_string
        
        # Get dynamic property information
        from apps.properties.models import Property
        from apps.properties.utils import get_logo_base64

        prop = Property.objects.first()
        company_name = prop.name if prop else "Lahana Resort"
        company_address = f"{prop.address}, {prop.city}, {prop.country}" if prop else "Kathmandu, Nepal"
        company_phone = prop.phone if prop else "+977-1-4XXXXXX"
        company_email = prop.email if prop else "info@lahanaresort.com"
        company_pan = prop.pan_number or prop.vat_number or "601234567"
        logo_url = get_logo_base64()

        lang = request.query_params.get("lang") or (request.user.preferred_language if hasattr(request.user, "preferred_language") else "en")
        context = {
            "invoice": invoice,
            "company_name": company_name,
            "company_pan": company_pan,
            "company_address": company_address,
            "company_phone": company_phone,
            "company_email": company_email,
            "logo_url": logo_url,
            "fiscal_year": invoice.fiscal_year,
            "lang": lang,
        }
        
        html_string = render_to_string("pdf/invoice.html", context)
        
        from django.http import HttpResponse
        
        try:
            from weasyprint import HTML
            html = HTML(string=html_string, base_url=request.build_absolute_uri("/"))
            pdf = html.write_pdf()
            response = HttpResponse(pdf, content_type="application/pdf")
            response["Content-Disposition"] = f'inline; filename="invoice_{invoice.invoice_number}.pdf"'
            return response
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"WeasyPrint PDF invoice generation failed: {e}")
            response = HttpResponse(html_string, content_type="text/html")
            return response

    @action(detail=False, methods=["get"])
    def daily_summary(self, request):
        """
        Returns dynamic summary statistics of payments and invoices settled today.
        """
        today = timezone.localdate()
        date_str = request.query_params.get("date", str(today))
        
        payments = Payment.objects.filter(created_at__date=date_str)
        invoices = Invoice.objects.filter(created_at__date=date_str)
        
        total_payments = sum(p.amount for p in payments)
        payment_by_method = {}
        for p in payments:
            payment_by_method[p.payment_method] = payment_by_method.get(p.payment_method, Decimal(0)) + p.amount
            
        total_invoiced = sum(i.total_amount for i in invoices)
        
        return Response({
            "date": date_str,
            "total_payments_collected": str(total_payments),
            "payment_by_method": {k: str(v) for k, v in payment_by_method.items()},
            "total_invoiced_today": str(total_invoiced),
            "invoice_count": invoices.count(),
        }, status=status.HTTP_200_OK)


class InvoiceItemViewSet(viewsets.ModelViewSet):
    """
    CRUD for Invoice items. Modifying items automatically recalculates parent Invoice totals.
    """
    queryset = InvoiceItem.objects.all()
    serializer_class = InvoiceItemSerializer
    permission_classes = [IsPropertyManager]

    @transaction.atomic
    def perform_create(self, serializer):
        item = serializer.save()
        self._recalculate_invoice(item.invoice)

    @transaction.atomic
    def perform_update(self, serializer):
        item = serializer.save()
        self._recalculate_invoice(item.invoice)

    @transaction.atomic
    def perform_destroy(self, instance):
        invoice = instance.invoice
        instance.delete()
        self._recalculate_invoice(invoice)

    def _recalculate_invoice(self, invoice):
        # Sum items total
        items = invoice.items.all()
        subtotal = sum(i.amount for i in items)
        
        # Calculate Service Charge (10% of subtotal)
        sc = subtotal * (invoice.service_charge_rate / Decimal("100.00"))
        
        # Calculate VAT (13% of subtotal + service charge)
        taxable_amount = subtotal + sc
        vat = taxable_amount * (invoice.tax_rate / Decimal("100.00"))
        
        # Calculate final amount
        total = taxable_amount + vat - invoice.discount_amount
        
        invoice.subtotal = subtotal
        invoice.service_charge_amount = sc
        invoice.tax_amount = vat
        invoice.total_amount = total
        invoice.save()


class PaymentViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only view for payment transactions audit logs.
    """
    queryset = Payment.objects.select_related("invoice", "received_by").all()
    serializer_class = PaymentSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ["invoice", "payment_method"]
    ordering_fields = ["created_at", "amount"]
    permission_classes = [IsAnyStaff]
