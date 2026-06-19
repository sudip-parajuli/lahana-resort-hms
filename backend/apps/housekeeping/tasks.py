"""
SIA HMS — Housekeeping Background & Scheduled Tasks
"""

import logging
from datetime import date
from celery import shared_task
from django.utils import timezone
from django.db import transaction
from django.db.models import Q
from django.contrib.auth import get_user_model

from apps.accounts.models import UserRole
from apps.properties.models import Room, RoomStatus
from apps.bookings.models import Reservation, ReservationStatus
from apps.housekeeping.models import (
    HousekeepingTask,
    HousekeepingStatus,
    HousekeepingPriority,
    HousekeepingTaskType,
    HousekeepingTrigger,
)
from apps.notifications.sms import send_sms

logger = logging.getLogger(__name__)
User = get_user_model()


@shared_task
def generate_morning_housekeeping_schedule():
    """
    Automated task running daily at 7:00 AM.
    Identifies dirty rooms and checkouts, groups assignments by floor,
    assigns tasks to housekeepers, and dispatches SMS checklists.
    """
    today_val = timezone.localdate()
    logger.info(f"Generating morning housekeeping schedule for {today_val}...")

    # Find checkout rooms for today
    checkout_room_ids = Reservation.objects.filter(
        status=ReservationStatus.CHECKED_IN,
        check_out_date=today_val,
    ).values_list("room_id", flat=True)

    # Find all dirty rooms or rooms checking out today
    rooms_to_clean = Room.objects.filter(
        Q(status=RoomStatus.DIRTY) | Q(id__in=checkout_room_ids),
        is_active=True,
    ).distinct()

    # Find active housekeeping staff
    staff = User.objects.filter(role=UserRole.HOUSEKEEPING, is_active=True)
    staff_list = list(staff)
    num_staff = len(staff_list)

    if not rooms_to_clean.exists():
        logger.info("No rooms need cleaning today.")
        return "No rooms to clean."

    if num_staff == 0:
        logger.warning("No active housekeeping staff found to distribute tasks to.")
        return "No active staff found."

    # Group rooms by floor to minimize transit times
    rooms_by_floor = {}
    for room in rooms_to_clean:
        rooms_by_floor.setdefault(room.floor, []).append(room)

    # Flatten the rooms ordered by floor so that contiguous indices belong to same/near floors
    ordered_rooms = []
    for floor in sorted(rooms_by_floor.keys()):
        ordered_rooms.extend(rooms_by_floor[floor])

    created_tasks = []

    with transaction.atomic():
        # Round-robin distribution of floor-ordered rooms
        for idx, room in enumerate(ordered_rooms):
            assigned_staff = staff_list[idx % num_staff]
            is_checkout = room.id in checkout_room_ids
            
            priority = HousekeepingPriority.HIGH if is_checkout else HousekeepingPriority.NORMAL
            notes = f"Morning scheduled cleaning for Room {room.room_number}."
            if is_checkout:
                notes += " Guest checking out today."

            # Check if there is already a pending cleaning task for this room to avoid duplicates
            existing_task = HousekeepingTask.objects.filter(
                room=room,
                status=HousekeepingStatus.PENDING,
                task_type=HousekeepingTaskType.CLEAN,
            ).first()

            if existing_task:
                existing_task.assigned_to = assigned_staff
                existing_task.priority = priority
                existing_task.notes = notes
                existing_task.save()
                created_tasks.append(existing_task)
            else:
                task = HousekeepingTask.objects.create(
                    room=room,
                    assigned_to=assigned_staff,
                    task_type=HousekeepingTaskType.CLEAN,
                    status=HousekeepingStatus.PENDING,
                    priority=priority,
                    triggered_by=HousekeepingTrigger.SCHEDULED,
                    due_by=today_val,
                    notes=notes,
                )
                created_tasks.append(task)

    # Dispatch Sparrow SMS checklist notifications to assigned staff members
    for staff_member in staff_list:
        staff_tasks = [t for t in created_tasks if t.assigned_to == staff_member]
        if staff_tasks:
            room_numbers = [t.room.room_number for t in staff_tasks]
            room_list_str = ", ".join(room_numbers)
            msg = f"Hello {staff_member.first_name}, your housekeeping checklist for today: Rooms {room_list_str}. Please complete tasks via the PMS portal."
            try:
                send_sms(staff_member.phone, msg)
                logger.info(f"Dispatched morning schedule SMS to {staff_member.first_name} ({staff_member.phone}).")
            except Exception as e:
                logger.error(f"Failed to dispatch SMS to {staff_member.first_name}: {e}")

    return f"Distributed {len(created_tasks)} tasks to {num_staff} staff members."
