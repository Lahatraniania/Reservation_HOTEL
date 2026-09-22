from django.contrib import admin
from .models import (
    Hotel, Room, Client, Reservation,
    Notification, DemandePlacement, CommissionAdmin
)


@admin.register(Hotel)
class HotelAdmin(admin.ModelAdmin):
    list_display = ['nom', 'ville', 'proprietaire', 'est_actif', 'est_visible', 'date_creation']
    list_filter = ['est_actif', 'est_visible', 'ville']
    search_fields = ['nom', 'adresse', 'ville']
    readonly_fields = ['date_creation', 'date_modification']


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    # ✅ Supprimer 'est_disponible' de list_display et list_filter
    list_display = ['numero', 'hotel', 'type', 'prix_nuit', 'est_actif', 'date_creation']
    list_filter = ['type', 'est_actif', 'hotel']  # ✅ 'est_disponible' supprimé
    search_fields = ['numero', 'hotel__nom']
    readonly_fields = ['date_creation', 'date_modification']


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ['user', 'telephone', 'date_inscription']
    search_fields = ['user__username', 'user__email', 'telephone']
    readonly_fields = ['date_inscription', 'date_modification']


@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    list_display = ['id', 'client', 'hotel', 'chambre', 'date_debut', 'date_fin', 'statut', 'montant_total']
    list_filter = ['statut', 'date_creation']
    search_fields = ['client__user__username', 'hotel__nom', 'chambre__numero']
    readonly_fields = ['montant_total', 'commission_admin', 'date_creation', 'date_modification']


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['client', 'type', 'message', 'est_lue', 'date_creation']
    list_filter = ['est_lue', 'type']
    search_fields = ['client__user__username', 'message']
    readonly_fields = ['date_creation']


@admin.register(DemandePlacement)
class DemandePlacementAdmin(admin.ModelAdmin):
    list_display = ['hotel_nom', 'proprietaire', 'hotel_ville', 'statut', 'date_demande']
    list_filter = ['statut']
    search_fields = ['hotel_nom', 'hotel_ville', 'proprietaire__username']
    readonly_fields = ['date_demande', 'date_modification']


@admin.register(CommissionAdmin)
class CommissionAdminAdmin(admin.ModelAdmin):
    list_display = ['reservation', 'montant', 'statut', 'date_creation']
    list_filter = ['statut']
    readonly_fields = ['date_creation']