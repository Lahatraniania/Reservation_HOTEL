from rest_framework import permissions


class IsProprietaireOrReadOnly(permissions.BasePermission):
    """
    Permission pour les propriétaires d'hôtel (lecture publique, écriture propriétaire)
    """
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        
        if hasattr(obj, 'proprietaire'):
            return obj.proprietaire == request.user
        if hasattr(obj, 'hotel'):
            return obj.hotel.proprietaire == request.user
        return False


class IsProprietaire(permissions.BasePermission):
    """
    Vérifie que l'utilisateur est un propriétaire (a au moins un hôtel) OU admin
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        # ✅ Admin a tous les droits
        if request.user.is_superuser:
            return True
        # ✅ Propriétaire = a au moins un hôtel OU est en train d'en créer un
        if request.method == 'POST':
            return True  # Création libre pour tout utilisateur connecté
        return request.user.hotels.exists()


class IsAdminUser(permissions.BasePermission):
    """
    Vérifie que l'utilisateur est administrateur
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_superuser


class IsClient(permissions.BasePermission):
    """
    Vérifie que l'utilisateur est un client
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Permission combinée: propriétaire de la ressource ou admin
    """
    def has_object_permission(self, request, view, obj):
        if request.user.is_superuser:
            return True
        
        if hasattr(obj, 'proprietaire'):
            return obj.proprietaire == request.user
        if hasattr(obj, 'hotel'):
            return obj.hotel.proprietaire == request.user
        if hasattr(obj, 'client'):
            return obj.client.user == request.user
        return False