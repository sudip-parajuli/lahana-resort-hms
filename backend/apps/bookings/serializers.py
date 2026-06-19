"""
SIA HMS — Booking & Reservation Serializers
"""

from rest_framework import serializers
from datetime import date

from apps.properties.serializers import RoomSerializer
from apps.properties.models import Room
from .models import GuestProfile, Reservation, RatePlan, ReservationStatus, BookingSource
from .availability import calculate_price, get_available_rooms


class GuestProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = GuestProfile
        fields = "__all__"


class RatePlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = RatePlan
        fields = "__all__"


class ReservationSerializer(serializers.ModelSerializer):
    guest = GuestProfileSerializer(read_only=True)
    guest_id = serializers.PrimaryKeyRelatedField(
        queryset=GuestProfile.objects.all(),
        write_only=True,
        source="guest",
    )
    room = RoomSerializer(read_only=True)
    room_id = serializers.PrimaryKeyRelatedField(
        queryset=Room.objects.all(),
        write_only=True,
        source="room",
    )
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    booking_source_display = serializers.CharField(source="get_booking_source_display", read_only=True)
    cancellation_policy_details = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Reservation
        fields = [
            "id",
            "guest",
            "guest_id",
            "room",
            "room_id",
            "check_in_date",
            "check_out_date",
            "adults",
            "children",
            "infants",
            "status",
            "status_display",
            "booking_source",
            "booking_source_display",
            "total_nights",
            "base_amount",
            "tax_amount",
            "discount_amount",
            "total_amount",
            "deposit_paid",
            "deposit_amount",
            "special_requests",
            "internal_notes",
            "confirmed_at",
            "cancelled_at",
            "cancellation_reason",
            "created_by",
            "created_at",
            "updated_at",
            "cancellation_policy_details",
        ]
        read_only_fields = [
            "total_nights",
            "base_amount",
            "tax_amount",
            "total_amount",
            "confirmed_at",
            "cancelled_at",
            "created_by",
            "created_at",
            "updated_at",
        ]

    def get_cancellation_policy_details(self, obj):
        try:
            prop = obj.room.room_type.property
            return {
                "free_cancellation_days": prop.free_cancellation_days,
                "cancellation_refund_percent": prop.cancellation_refund_percent,
                "advance_deposit_percent": prop.advance_deposit_percent,
            }
        except Exception:
            return None

    def validate(self, attrs):
        check_in = attrs.get("check_in_date")
        check_out = attrs.get("check_out_date")
        room = attrs.get("room")
        
        if check_in and check_out:
            if check_in < date.today() and not self.instance:
                raise serializers.ValidationError({"check_in_date": "Check-in date cannot be in the past."})
            if check_in >= check_out:
                raise serializers.ValidationError({"check_out_date": "Check-out date must be after check-in date."})

        # Overbooking check
        if room and check_in and check_out:
            active_statuses = [
                ReservationStatus.PENDING,
                ReservationStatus.CONFIRMED,
                ReservationStatus.CHECKED_IN,
            ]
            
            overlapping = Reservation.objects.filter(
                room=room,
                status__in=active_statuses,
                check_in_date__lt=check_out,
                check_out_date__gt=check_in,
            )
            
            if self.instance:
                overlapping = overlapping.exclude(id=self.instance.id)

            if overlapping.exists():
                raise serializers.ValidationError(
                    "Room is already booked or occupied during the selected date range."
                )

        return attrs

    def create(self, validated_data):
        room = validated_data["room"]
        check_in = validated_data["check_in_date"]
        check_out = validated_data["check_out_date"]
        discount_amount = validated_data.get("discount_amount", 0)

        # Automatically calculate pricing details
        pricing = calculate_price(room.room_type, check_in, check_out)
        
        validated_data["total_nights"] = pricing["nights"]
        validated_data["base_amount"] = pricing["base_amount"]
        validated_data["tax_amount"] = pricing["tax_amount"]
        
        # Apply discount to total
        total = pricing["total_amount"] - discount_amount
        validated_data["total_amount"] = max(total, 0)
        
        # Assign creator from request if present
        request = self.context.get("request")
        if request and request.user and request.user.is_authenticated:
            validated_data["created_by"] = request.user

        # Calculate advance deposit if required by property
        from decimal import Decimal
        prop = room.room_type.property
        deposit_amount = Decimal("0.00")
        if prop.advance_deposit_percent > 0:
            deposit_percent = Decimal(str(prop.advance_deposit_percent))
            total_amount = Decimal(str(validated_data["total_amount"]))
            deposit_amount = (total_amount * deposit_percent / Decimal("100.00")).quantize(Decimal("0.01"))

        validated_data["deposit_amount"] = deposit_amount
        validated_data["deposit_paid"] = False

        reservation = super().create(validated_data)

        # Automatically generate unpaid deposit invoice
        if deposit_amount > 0:
            from apps.billing.models import Invoice, InvoiceStatus, InvoiceType
            Invoice.objects.create(
                reservation=reservation,
                subtotal=deposit_amount,
                total_amount=deposit_amount,
                balance_due=deposit_amount,
                status=InvoiceStatus.UNPAID,
                invoice_type=InvoiceType.HOTEL,
                notes="Advance deposit invoice",
            )

        return reservation
