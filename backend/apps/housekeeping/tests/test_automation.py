"""
SIA HMS — Housekeeping Automation Tests
"""

import pytest
from datetime import date, timedelta
from decimal import Decimal
from django_tenants.utils import schema_context

from apps.accounts.models import UserRole, User
from apps.properties.models import Property, RoomType, Room, RoomStatus
from apps.bookings.models import GuestProfile, Reservation, ReservationStatus
from apps.housekeeping.models import HousekeepingTask, HousekeepingStatus, HousekeepingPriority
from apps.housekeeping.tasks import generate_morning_housekeeping_schedule
from apps.housekeeping.tests.test_housekeeping import test_tenant

pytestmark = pytest.mark.django_db


class TestHousekeepingAutomation:
    """Verifies Celery tasks for morning cleaning schedules allocations."""

    def test_generate_morning_housekeeping_schedule_success(self, test_tenant):
        with schema_context(test_tenant.schema_name):
            # Create property and rooms
            p = Property.objects.create(name="Hk Oasis", address="Baluwatar", city="Kathmandu")
            rt = RoomType.objects.create(property=p, name="Deluxe Villa", base_price_per_night=10000.00)
            
            # Room 101 - dirty
            room1 = Room.objects.create(room_type=rt, room_number="101", floor=1, status=RoomStatus.DIRTY)
            # Room 102 - available
            room2 = Room.objects.create(room_type=rt, room_number="102", floor=1, status=RoomStatus.AVAILABLE)
            # Room 103 - occupied & checking out today
            room3 = Room.objects.create(room_type=rt, room_number="103", floor=2, status=RoomStatus.OCCUPIED)
            
            guest = GuestProfile.objects.create(first_name="Anita", last_name="Adhikari", phone="9800000004")
            
            # Booking checking out today
            res = Reservation.objects.create(
                guest=guest,
                room=room3,
                check_in_date=date.today() - timedelta(days=2),
                check_out_date=date.today(),
                adults=2,
                total_nights=2,
                base_amount=20000.00,
                tax_amount=2600.00,
                total_amount=22600.00,
                status=ReservationStatus.CHECKED_IN,
            )

            # Create 2 housekeeping staff
            hk1 = User.objects.create(
                username="hk1@test.com",
                email="hk1@test.com",
                first_name="Nabin",
                role=UserRole.HOUSEKEEPING,
                phone="9801111111",
                is_active=True,
            )
            hk2 = User.objects.create(
                username="hk2@test.com",
                email="hk2@test.com",
                first_name="Ramesh",
                role=UserRole.HOUSEKEEPING,
                phone="9802222222",
                is_active=True,
            )

            # Deactivate any other active housekeepers temporarily to make task assignment deterministic
            other_hks = list(User.objects.filter(role=UserRole.HOUSEKEEPING, is_active=True).exclude(id__in=[hk1.id, hk2.id]))
            for ohk in other_hks:
                ohk.is_active = False
                ohk.save()

            try:
                # Run morning schedule generator task
                result = generate_morning_housekeeping_schedule()
                assert "Distributed 2 tasks" in result  # room1 (dirty) and room3 (checkout today)

                # Verify tasks were created
                tasks = HousekeepingTask.objects.all()
                assert tasks.count() == 2

                # Room 103 (checkout) should have HIGH priority
                task_103 = tasks.filter(room=room3).first()
                assert task_103 is not None
                assert task_103.priority == HousekeepingPriority.HIGH
                assert task_103.status == HousekeepingStatus.PENDING
                assert "checking out" in task_103.notes

                # Room 101 (dirty) should have NORMAL priority
                task_101 = tasks.filter(room=room1).first()
                assert task_101 is not None
                assert task_101.priority == HousekeepingPriority.NORMAL

                # Verification of round-robin floor-ordered assignment
                # Floor 1 (Room 101) and Floor 2 (Room 103). Nabin and Ramesh.
                # Sorted by floor: Room 101 then Room 103.
                # So Room 101 goes to Nabin (hk1) and Room 103 goes to Ramesh (hk2).
                assert task_101.assigned_to == hk1
                assert task_103.assigned_to == hk2
            finally:
                # Restore other housekeepers
                for ohk in other_hks:
                    ohk.is_active = True
                    ohk.save()
