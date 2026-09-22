from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """✅ Ajoute le rôle dans le token JWT"""
    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        # ✅ Ajouter les informations personnalisées
        token['user_id'] = user.id
        token['username'] = user.username
        token['email'] = user.email
        token['first_name'] = user.first_name
        token['last_name'] = user.last_name
        
        # ✅ Déterminer le rôle de manière EXPLICITE
        if user.is_superuser:
            token['role'] = 'admin'
        elif user.hotels.exists():
            # ✅ A déjà un hôtel validé
            token['role'] = 'proprietaire'
        elif user.demandes.filter(statut__in=['EN_ATTENTE', 'VALIDE']).exists():
            # ✅ A une demande de placement en attente ou validée
            token['role'] = 'proprietaire'
        else:
            token['role'] = 'client'
        
        return token


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer