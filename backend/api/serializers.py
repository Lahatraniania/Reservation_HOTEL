from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    Hotel, Room, Client, Reservation, 
    Notification, DemandePlacement, CommissionAdmin,
    ChatConversation, ChatMessage
)


# ========== USER ==========
class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'date_joined', 'role']
        read_only_fields = ['date_joined', 'role']
    
    def get_role(self, obj):
        if obj.is_superuser:
            return 'admin'
        if obj.hotels.exists():
            return 'proprietaire'
        return 'client'


# ========== HÔTEL ==========
class HotelSerializer(serializers.ModelSerializer):
    """
    ✅ Serializer complet pour création/modification d'hôtel
    Gère : photo_principale + photos_supplementaires (multiple)
    """
    proprietaire_details = UserSerializer(source='proprietaire', read_only=True)
    nombre_chambres = serializers.IntegerField(source='chambres.count', read_only=True)
    photo_principale_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Hotel
        exclude = ['proprietaire']
        read_only_fields = [
            'date_creation', 
            'date_modification',
            'photos_supplementaires',  # ✅ Géré dans la vue
        ]
    
    def get_photo_principale_url(self, obj):
        if obj.photo_principale:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.photo_principale.url)
            return obj.photo_principale.url
        return None
    
    def create(self, validated_data):
        """✅ Ajouter automatiquement le propriétaire connecté"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['proprietaire'] = request.user
        return super().create(validated_data)
    
    def to_representation(self, instance):
        """✅ Transformer les URLs pour le frontend"""
        data = super().to_representation(instance)
        
        # Ajouter le propriétaire en lecture
        data['proprietaire'] = instance.proprietaire_id
        
        # URL complète pour photo_principale
        if instance.photo_principale:
            request = self.context.get('request')
            if request:
                data['photo_principale'] = request.build_absolute_uri(instance.photo_principale.url)
        
        # ✅ URLs complètes pour photos_supplementaires
        if instance.photos_supplementaires:
            request = self.context.get('request')
            photos_urls = []
            for photo_url in instance.photos_supplementaires:
                # Si c'est déjà une URL complète
                if photo_url.startswith('http'):
                    photos_urls.append(photo_url)
                # Si c'est un chemin relatif
                elif photo_url.startswith('/'):
                    if request:
                        photos_urls.append(request.build_absolute_uri(photo_url))
                    else:
                        photos_urls.append(photo_url)
                # Sinon, construire l'URL
                else:
                    from django.conf import settings
                    full_url = f"{settings.MEDIA_URL}{photo_url}"
                    if request:
                        photos_urls.append(request.build_absolute_uri(full_url))
                    else:
                        photos_urls.append(full_url)
            
            data['photos_supplementaires'] = photos_urls
        
        return data


class HotelListSerializer(serializers.ModelSerializer):
    """Serializer simplifié pour les listes"""
    photo_principale = serializers.SerializerMethodField()
    
    class Meta:
        model = Hotel
        fields = ['id', 'nom', 'ville', 'photo_principale', 'note_moyenne', 
                  'est_actif', 'est_visible', 'proprietaire', 'nombre_chambres']
    
    nombre_chambres = serializers.IntegerField(source='chambres.count', read_only=True)
    
    def get_photo_principale(self, obj):
        if obj.photo_principale:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.photo_principale.url)
            return obj.photo_principale.url
        return None


# ========== CHAMBRE ==========
class RoomSerializer(serializers.ModelSerializer):
    """Serializer complet pour les chambres"""
    hotel_details = HotelListSerializer(source='hotel', read_only=True)
    photo_principale_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Room
        fields = '__all__'
        read_only_fields = ['date_creation', 'date_modification']
    
    def get_photo_principale_url(self, obj):
        if obj.photo_principale:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.photo_principale.url)
            return obj.photo_principale.url
        return None
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.photo_principale:
            request = self.context.get('request')
            if request:
                data['photo_principale'] = request.build_absolute_uri(instance.photo_principale.url)
        return data


class RoomListSerializer(serializers.ModelSerializer):
    """Serializer simplifié pour les listes avec disponibilité dynamique"""
    hotel_nom = serializers.CharField(source='hotel.nom', read_only=True)
    hotel_ville = serializers.CharField(source='hotel.ville', read_only=True)
    hotel_id = serializers.IntegerField(source='hotel.id', read_only=True)
    photo_principale = serializers.SerializerMethodField()
    est_disponible = serializers.SerializerMethodField()
    statut_disponibilite = serializers.SerializerMethodField()
    prochaine_reservation = serializers.SerializerMethodField()
    
    class Meta:
        model = Room
        fields = [
            'id', 'numero', 'type', 'prix_nuit', 'hotel', 'hotel_id',
            'hotel_nom', 'hotel_ville', 'photo_principale', 
            'est_disponible', 'statut_disponibilite', 'prochaine_reservation',
            'capacite', 'surface', 'equipements', 'est_actif', 'date_creation'
        ]
    
    def get_photo_principale(self, obj):
        if obj.photo_principale:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.photo_principale.url)
            return obj.photo_principale.url
        return None
    
    def get_est_disponible(self, obj):
        """✅ Disponibilité dynamique basée sur les réservations"""
        request = self.context.get('request')
        if request and request.query_params.get('date_debut') and request.query_params.get('date_fin'):
            try:
                return obj.est_disponible_pour_periode(
                    request.query_params.get('date_debut'),
                    request.query_params.get('date_fin')
                )
            except:
                pass
        return obj.est_disponible_aujourd_hui()
    
    def get_statut_disponibilite(self, obj):
        """✅ Message détaillé de disponibilité"""
        return obj.statut_disponibilite
    
    def get_prochaine_reservation(self, obj):
        """✅ Détails de la prochaine réservation"""
        prochaine = obj.prochaine_reservation()
        if not prochaine:
            return None
        return {
            'date_debut': str(prochaine.date_debut),
            'date_fin': str(prochaine.date_fin),
            'statut': prochaine.statut,
        }


# ========== CLIENT ==========
class ClientSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    photo_profil = serializers.SerializerMethodField()
    
    class Meta:
        model = Client
        fields = '__all__'
        read_only_fields = ['date_inscription', 'date_modification']
    
    def get_photo_profil(self, obj):
        if obj.photo_profil:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.photo_profil.url)
            return obj.photo_profil.url
        return None


# ========== RÉSERVATION ==========
class ReservationSerializer(serializers.ModelSerializer):
    client_details = ClientSerializer(source='client', read_only=True)
    chambre_details = RoomSerializer(source='chambre', read_only=True)
    hotel_details = HotelListSerializer(source='hotel', read_only=True)
    valide_par_details = UserSerializer(source='valide_par', read_only=True)
    
    class Meta:
        model = Reservation
        fields = '__all__'
        read_only_fields = ['montant_total', 'commission_admin', 'date_creation', 'date_modification']


class ReservationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reservation
        fields = ['chambre', 'date_debut', 'date_fin', 'client']
        read_only_fields = ['client']
    
    def validate(self, data):
        chambre = data['chambre']
        date_debut = data['date_debut']
        date_fin = data['date_fin']
        
        if not chambre.est_disponible:
            raise serializers.ValidationError("Cette chambre n'est pas disponible")
        
        if date_debut >= date_fin:
            raise serializers.ValidationError("La date de fin doit être après la date de début")
        
        reservations_existantes = Reservation.objects.filter(
            chambre=chambre,
            statut__in=['EN_ATTENTE', 'PAYEE', 'CONFIRMEE'],
            date_debut__lt=date_fin,
            date_fin__gt=date_debut
        )
        
        if reservations_existantes.exists():
            raise serializers.ValidationError("Cette chambre est déjà réservée sur ces dates")
        
        return data


# ========== NOTIFICATION ==========
class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'
        read_only_fields = ['date_creation']


# ========== DEMANDE PLACEMENT ==========
class DemandePlacementSerializer(serializers.ModelSerializer):
    proprietaire_details = UserSerializer(source='proprietaire', read_only=True)
    traite_par_details = UserSerializer(source='traite_par', read_only=True)
    hotel_photo_url = serializers.SerializerMethodField()
    proprietaire_photo_url = serializers.SerializerMethodField()
    
    class Meta:
        model = DemandePlacement
        fields = [
            'id', 'proprietaire', 'proprietaire_details',
            'hotel_nom', 'hotel_adresse', 'hotel_ville', 
            'hotel_telephone', 'hotel_email', 'hotel_description',
            'hotel_photo', 'hotel_photo_url', 'hotel_photos_supp',
            'proprietaire_photo', 'proprietaire_photo_url', 'documents',
            'statut', 'traite_par', 'traite_par_details',
            'date_traitement', 'date_demande', 'date_modification'
        ]
        read_only_fields = [
            'id', 'proprietaire', 'statut', 'traite_par',
            'date_traitement', 'date_demande', 'date_modification',
            'proprietaire_details', 'traite_par_details',
            'hotel_photos_supp', 'documents',
        ]
        extra_kwargs = {
            'hotel_photo': {'required': False, 'allow_null': True},
            'proprietaire_photo': {'required': False, 'allow_null': True},
        }
    
    def get_hotel_photo_url(self, obj):
        if obj.hotel_photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.hotel_photo.url)
            return obj.hotel_photo.url
        return None
    
    def get_proprietaire_photo_url(self, obj):
        if obj.proprietaire_photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.proprietaire_photo.url)
            return obj.proprietaire_photo.url
        return None


# ========== COMMISSION ==========
class CommissionAdminSerializer(serializers.ModelSerializer):
    reservation_details = ReservationSerializer(source='reservation', read_only=True)
    
    class Meta:
        model = CommissionAdmin
        fields = '__all__'
        read_only_fields = ['date_creation']


# ============================================================
# CHAT AGENT IA
# ============================================================
class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ['id', 'role', 'content', 'metadata', 'date_creation']
        read_only_fields = ['id', 'date_creation']


class ChatConversationSerializer(serializers.ModelSerializer):
    messages = ChatMessageSerializer(many=True, read_only=True)
    message_count = serializers.IntegerField(source='messages.count', read_only=True)
    
    class Meta:
        model = ChatConversation
        fields = ['id', 'title', 'messages', 'message_count', 'date_creation', 'date_modification']
        read_only_fields = ['id', 'date_creation', 'date_modification']