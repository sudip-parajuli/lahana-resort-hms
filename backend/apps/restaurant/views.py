"""
SIA HMS — Restaurant Views
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Prefetch

from apps.accounts.permissions import IsRestaurantStaff, IsPropertyManager, IsAnyStaff
from .models import DiningArea, DiningTable, MenuCategory, MenuItem
from .serializers import (
    DiningAreaSerializer,
    DiningTableSerializer,
    MenuCategorySerializer,
    MenuItemSerializer,
)


class DiningAreaViewSet(viewsets.ModelViewSet):
    queryset = DiningArea.objects.filter(is_active=True)
    serializer_class = DiningAreaSerializer
    permission_classes = [IsAuthenticated, IsRestaurantStaff | IsPropertyManager]
    pagination_class = None


class DiningTableViewSet(viewsets.ModelViewSet):
    queryset = DiningTable.objects.all()
    serializer_class = DiningTableSerializer
    permission_classes = [IsAuthenticated, IsRestaurantStaff | IsPropertyManager]
    pagination_class = None

    def get_permissions(self):
        if self.action in ["resolve_qr"]:
            return []
        return super().get_permissions()

    @action(detail=False, methods=["get"], url_path=r"qr/(?P<qr_uuid>[a-f0-9-]+)")
    def resolve_qr(self, request, qr_uuid=None):
        """
        Public endpoint to resolve dining table UUID to table metadata.
        """
        try:
            table = DiningTable.objects.select_related("area").get(qr_code=qr_uuid)
            return Response({
                "table_id": table.id,
                "table_number": table.table_number,
                "area_name": table.area.name,
            })
        except (DiningTable.DoesNotExist, ValueError):
            return Response(
                {"error": "Dining table not found for the provided QR code."},
                status=status.HTTP_404_NOT_FOUND,
            )

    @action(detail=True, methods=["put"])
    def status(self, request, pk=None):
        """
        Updates the table operational status (available, occupied, cleaning, etc.)
        """
        table = self.get_object()
        new_status = request.data.get("status")
        if new_status not in DiningTable.TableStatus.values:
            return Response(
                {"error": f"Invalid table status: {new_status}"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        table.status = new_status
        table.save()
        return Response(DiningTableSerializer(table).data)


class MenuCategoryViewSet(viewsets.ModelViewSet):
    queryset = MenuCategory.objects.filter(is_active=True)
    serializer_class = MenuCategorySerializer
    permission_classes = [IsAuthenticated, IsAnyStaff]
    pagination_class = None

    def get_permissions(self):
        if self.action in ["public_menu"]:
            return []
        if self.action in ["create", "update", "partial_update", "destroy"]:
            self.permission_classes = [IsAuthenticated, IsPropertyManager]
        return super().get_permissions()

    @action(detail=False, methods=["get"], url_path="public")
    def public_menu(self, request):
        """
        Public menu list with active categories and available items only.
        """
        categories = MenuCategory.objects.filter(is_active=True).prefetch_related(
            Prefetch("items", queryset=MenuItem.objects.filter(is_available=True))
        )
        serializer = self.get_serializer(categories, many=True)
        response = Response(serializer.data)
        response["Cache-Control"] = "public, max-age=300"
        return response


class MenuItemViewSet(viewsets.ModelViewSet):
    queryset = MenuItem.objects.all()
    serializer_class = MenuItemSerializer
    permission_classes = [IsAuthenticated, IsAnyStaff]
    pagination_class = None

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            self.permission_classes = [IsAuthenticated, IsPropertyManager]
        return super().get_permissions()
