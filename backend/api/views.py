from rest_framework import viewsets, permissions, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.contrib.auth.models import User
from django.db.models import Sum
from django.utils import timezone
from datetime import date
from rest_framework_simplejwt.tokens import RefreshToken

from .models import (
    Hotel, Room, Client, Reservation, 
    Notification, DemandePlacement, CommissionAdmin,
    ChatConversation, ChatMessage
)
from .serializers import (
    HotelSerializer, HotelListSerializer,
    RoomSerializer, RoomListSerializer,
    ClientSerializer, UserSerializer,
    ReservationSerializer, ReservationCreateSerializer,
    NotificationSerializer,
    DemandePlacementSerializer,
    CommissionAdminSerializer,
    ChatConversationSerializer, ChatMessageSerializer
)
from .ai_service import get_ai_response
from .permissions import IsProprietaire, IsAdminUser, IsClient

# ========== PAGINATION ==========
class StandardPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 100


# ========== HÔTEL VIEWS ==========
class HotelViewSet(viewsets.ModelViewSet):
    queryset = Hotel.objects.all().order_by('-date_creation')
    serializer_class = HotelSerializer
    pagination_class = StandardPagination
    
    def get_serializer_class(self):
        if self.action == 'list':
            return HotelListSerializer
        return HotelSerializer
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]
    
    def get_queryset(self):
        queryset = Hotel.objects.all().order_by('-date_creation')
        user = self.request.user
        if user.is_authenticated and self.request.query_params.get('mine') == 'true':
            queryset = queryset.filter(proprietaire=user)
        return queryset
    
    # ============================================================
    # ✅ CRÉATION AVEC PHOTOS SUPPLÉMENTAIRES
    # ============================================================
    def create(self, request, *args, **kwargs):
        """Créer un hôtel avec photo principale + photos supplémentaires"""
        from django.core.files.storage import default_storage
        from django.conf import settings
        
        try:
            photos_supp = request.FILES.getlist('photos_supplementaires')
            
            photo_urls = []
            for photo in photos_supp:
                file_path = default_storage.save(f'hotels/supp/{photo.name}', photo)
                file_url = f"{settings.MEDIA_URL}{file_path}"
                photo_urls.append(file_url)
            
            print(f"📸 {len(photo_urls)} photos supplémentaires sauvegardées")
            
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            
            user = request.user
            if user.is_superuser:
                est_actif = True
            else:
                has_valid_hotel = Hotel.objects.filter(
                    proprietaire=user,
                    est_actif=True
                ).exists()
                est_actif = has_valid_hotel
            
            hotel = serializer.save(
                proprietaire=user,
                est_actif=est_actif,
                photos_supplementaires=photo_urls
            )
            
            full_serializer = HotelSerializer(hotel, context={'request': request})
            headers = self.get_success_headers(full_serializer.data)
            return Response(full_serializer.data, status=status.HTTP_201_CREATED, headers=headers)
            
        except Exception as e:
            print(f"❌ Erreur création hôtel: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    # ============================================================
    # ✅ MODIFICATION AVEC PHOTOS SUPPLÉMENTAIRES
    # ============================================================
    def update(self, request, *args, **kwargs):
        """Modifier un hôtel avec gestion des photos supplémentaires"""
        from django.core.files.storage import default_storage
        from django.conf import settings
        import json
        
        try:
            instance = self.get_object()
            
            if instance.proprietaire != request.user and not request.user.is_superuser:
                return Response(
                    {'error': 'Vous n\'êtes pas le propriétaire de cet hôtel'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            new_photos = request.FILES.getlist('photos_supplementaires')
            
            existing_photos_json = request.data.get('photos_supplementaires_existing')
            if existing_photos_json:
                try:
                    kept_photos = json.loads(existing_photos_json)
                except:
                    kept_photos = list(instance.photos_supplementaires or [])
            else:
                kept_photos = list(instance.photos_supplementaires or [])
            
            new_photo_urls = []
            for photo in new_photos:
                file_path = default_storage.save(f'hotels/supp/{photo.name}', photo)
                file_url = f"{settings.MEDIA_URL}{file_path}"
                new_photo_urls.append(file_url)
            
            all_photos = kept_photos + new_photo_urls
            
            print(f"📸 Photos: {len(kept_photos)} existantes + {len(new_photo_urls)} nouvelles = {len(all_photos)}")
            
            TEXT_FIELDS = ['nom', 'adresse', 'ville', 'pays', 'description', 'telephone', 'email_contact']
            BOOLEAN_FIELDS = ['est_actif', 'est_visible']
            
            for key in TEXT_FIELDS:
                if key in request.data:
                    setattr(instance, key, request.data.get(key))
            
            for key in BOOLEAN_FIELDS:
                if key in request.data:
                    value = request.data.get(key)
                    if isinstance(value, str):
                        value = value.lower() in ('true', '1', 'yes', 'on')
                    elif isinstance(value, bool):
                        pass
                    else:
                        value = bool(value)
                    setattr(instance, key, value)
            
            if 'photo_principale' in request.FILES:
                instance.photo_principale = request.FILES['photo_principale']
            
            instance.photos_supplementaires = all_photos
            instance.save()
            
            full_serializer = HotelSerializer(instance, context={'request': request})
            return Response(full_serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"❌ Erreur update hôtel: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def perform_create(self, serializer):
        serializer.save(proprietaire=self.request.user)
    
    # ============================================================
    # ✅ LISTE DES CHAMBRES D'UN HÔTEL
    # ============================================================
    @action(detail=True, methods=['get'])
    def chambres(self, request, pk=None):
        """
        ✅ Retourne TOUTES les chambres actives d'un hôtel (occupées ou non)
        avec leur statut dynamique.
        """
        hotel = self.get_object()
        # ✅ Filtrer uniquement par est_actif, PAS par est_disponible
        chambres = hotel.chambres.filter(est_actif=True).order_by('numero')
        serializer = RoomListSerializer(
            chambres, 
            many=True, 
            context={'request': request}
        )
        return Response(serializer.data)
    
    # ============================================================
    # ✅ CHAMBRES DISPONIBLES AUJOURD'HUI
    # ============================================================
    @action(detail=True, methods=['get'])
    def disponible(self, request, pk=None):
        """Chambres disponibles aujourd'hui"""
        hotel = self.get_object()
        chambres_disponibles = [
            c for c in hotel.chambres.filter(est_actif=True)
            if c.est_disponible_aujourd_hui()
        ]
        serializer = RoomListSerializer(
            chambres_disponibles, 
            many=True, 
            context={'request': request}
        )
        return Response({
            'hotel': hotel.nom,
            'chambres_disponibles': serializer.data,
            'total': len(chambres_disponibles)
        })
    
    # ============================================================
    # ✅ 8 HÔTELS POPULAIRES
    # ============================================================
    @action(detail=False, methods=['get'])
    def populaires(self, request):
        hotels = Hotel.objects.filter(
            est_actif=True,
            est_visible=True
        ).order_by('-note_moyenne', '-date_creation')[:8]
        serializer = HotelListSerializer(hotels, many=True, context={'request': request})
        return Response(serializer.data)
    
    # ============================================================
    # ✅ 4 HÔTELS RÉCENTS
    # ============================================================
    @action(detail=False, methods=['get'])
    def recents(self, request):
        hotels = Hotel.objects.filter(
            est_actif=True,
            est_visible=True
        ).order_by('-date_creation')[:4]
        serializer = HotelListSerializer(hotels, many=True, context={'request': request})
        return Response(serializer.data)


# ========== CHAMBRE VIEWS ==========
class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.all().order_by('numero')
    serializer_class = RoomSerializer
    pagination_class = StandardPagination
    
    def get_serializer_class(self):
        if self.action == 'list':
            return RoomListSerializer
        return RoomSerializer
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]
    
    def get_queryset(self):
        queryset = Room.objects.filter(est_actif=True).order_by('-date_creation')
        user = self.request.user
        
        # ✅ Filtrer par hôtel si fourni
        hotel_id = self.request.query_params.get('hotel')
        if hotel_id:
            queryset = queryset.filter(hotel_id=hotel_id)
        
        # ✅ Filtrer par propriétaire si mine=true
        if user.is_authenticated and self.request.query_params.get('mine') == 'true':
            queryset = queryset.filter(hotel__proprietaire=user)
        
        # ✅ Filtrer les chambres disponibles sur une période
        date_debut = self.request.query_params.get('date_debut')
        date_fin = self.request.query_params.get('date_fin')
        if date_debut and date_fin:
            # ✅ Exclure les chambres qui ont une réservation qui chevauche
            from django.db.models import Q
            queryset = queryset.exclude(
                Q(reservations__statut__in=['EN_ATTENTE', 'PAYEE', 'CONFIRMEE']) &
                Q(reservations__date_debut__lt=date_fin) &
                Q(reservations__date_fin__gt=date_debut)
            ).distinct()
        
        return queryset
    
    def perform_create(self, serializer):
        hotel = serializer.validated_data.get('hotel')
        if hotel and hotel.proprietaire != self.request.user and not self.request.user.is_superuser:
            raise permissions.PermissionDenied(
                "Vous n'êtes pas le propriétaire de cet hôtel"
            )
        serializer.save()
    
    # ✅ CHAMBRES DISPONIBLES (PAGE D'ACCUEIL) - 12 chambres
    @action(detail=False, methods=['get'])
    def disponibles(self, request):
        """
        ✅ Retourne les 12 chambres les plus récentes qui sont :
        - Actives (est_actif=True)
        - Sans réservation active AUJOURD'HUI
        - OU avec réservation future (mais libres aujourd'hui)
        """
        today = date.today()
        
        # ✅ Chambres avec leurs prochaines réservations
        chambres = Room.objects.filter(
            est_actif=True,
            hotel__est_actif=True
        ).order_by('-date_creation')[:12]
        
        serializer = RoomListSerializer(chambres, many=True, context={'request': request})
        return Response(serializer.data)
    
    # ✅ CHAMBRES RÉCENTES - 4 chambres
    @action(detail=False, methods=['get'])
    def recentes(self, request):
        chambres = Room.objects.filter(
            est_actif=True,
            hotel__est_actif=True
        ).order_by('-date_creation')[:4]
        serializer = RoomListSerializer(chambres, many=True, context={'request': request})
        return Response(serializer.data)
    
    # ✅ VÉRIFIER DISPONIBILITÉ D'UNE CHAMBRE
    @action(detail=True, methods=['get'])
    def disponibilite(self, request, pk=None):
        """
        ✅ Vérifier la disponibilité d'une chambre sur une période donnée.
        Query params: date_debut, date_fin
        """
        chambre = self.get_object()
        date_debut = request.query_params.get('date_debut')
        date_fin = request.query_params.get('date_fin')
        
        if not date_debut or not date_fin:
            return Response({
                'disponible': chambre.est_disponible_aujourd_hui(),
                'message': chambre.statut_disponibilite
            })
        
        disponible = chambre.est_disponible_pour_periode(date_debut, date_fin)
        
        if disponible:
            return Response({
                'disponible': True,
                'message': 'Disponible pour cette période'
            })
        else:
            # ✅ Trouver la réservation qui bloque
            reservation = chambre.reservations.filter(
                statut__in=['EN_ATTENTE', 'PAYEE', 'CONFIRMEE'],
                date_debut__lt=date_fin,
                date_fin__gt=date_debut
            ).first()
            
            return Response({
                'disponible': False,
                'message': f'Réservé à cette période' + (
                    f' (du {reservation.date_debut} au {reservation.date_fin})' 
                    if reservation else ''
                ),
                'reservation': {
                    'date_debut': str(reservation.date_debut),
                    'date_fin': str(reservation.date_fin),
                } if reservation else None
            })


# ========== CLIENT VIEWS ==========
class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return Client.objects.all()
        return Client.objects.filter(user=user)
    
    @action(detail=False, methods=['get', 'put', 'patch'])
    def me(self, request):
        try:
            client = Client.objects.get(user=request.user)
        except Client.DoesNotExist:
            client = Client.objects.create(
                user=request.user,
                telephone=request.data.get('telephone', ''),
                adresse=request.data.get('adresse', '')
            )
        
        if request.method == 'GET':
            serializer = ClientSerializer(client)
            return Response(serializer.data)
        
        serializer = ClientSerializer(client, data=request.data, partial=(request.method == 'PATCH'))
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ========== RÉSERVATION VIEWS ==========
class ReservationViewSet(viewsets.ModelViewSet):
    queryset = Reservation.objects.all()
    serializer_class = ReservationSerializer
    pagination_class = StandardPagination
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ReservationCreateSerializer
        return ReservationSerializer
    
    def get_permissions(self):
        if self.action in ['valider', 'refuser']:
            return [permissions.IsAuthenticated(), IsProprietaire()]
        if self.action in ['create']:
            return [permissions.IsAuthenticated(), IsClient()]
        return [permissions.IsAuthenticated()]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return Reservation.objects.all()
        try:
            hotels = Hotel.objects.filter(proprietaire=user)
            if hotels.exists():
                return Reservation.objects.filter(hotel__in=hotels)
        except:
            pass
        try:
            client = Client.objects.get(user=user)
            return Reservation.objects.filter(client=client)
        except:
            return Reservation.objects.none()
    
    # ✅✅✅ CORRECTION PRINCIPALE - OVERRIDE CREATE ✅✅✅
    def create(self, request, *args, **kwargs):
        """
        Override pour retourner la réservation COMPLÈTE après création.
        Sans cette méthode, DRF retourne seulement les champs du 
        ReservationCreateSerializer (chambre, date_debut, date_fin) 
        sans l'ID, ce qui casse la redirection vers /payment/:id
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        # ✅ Récupérer l'instance créée
        reservation = serializer.instance
        
        # ✅ Retourner avec le serializer COMPLET (inclut id, montant_total, statut, etc.)
        full_serializer = ReservationSerializer(reservation, context={'request': request})
        headers = self.get_success_headers(full_serializer.data)
        return Response(full_serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    def perform_create(self, serializer):
        client = Client.objects.get(user=self.request.user)
        chambre = serializer.validated_data['chambre']
        serializer.save(
            client=client,
            hotel=chambre.hotel,
            prix_nuit=chambre.prix_nuit
        )
    
    @action(detail=True, methods=['post'])
    def valider(self, request, pk=None):
        """Valider une réservation (propriétaire)"""
        reservation = self.get_object()
        
        # Vérifier le propriétaire
        if reservation.hotel.proprietaire != request.user:
            return Response(
                {'error': 'Vous n\'êtes pas le propriétaire de cet hôtel'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Vérifier que la réservation est payée
        if reservation.statut != 'PAYEE':
            return Response(
                {'error': 'Cette réservation n\'a pas encore été payée'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # ✅ Valider la réservation
        reservation.statut = 'CONFIRMEE'
        reservation.valide_par = request.user
        reservation.date_validation = timezone.now()
        reservation.save()
        
        # ❌ SUPPRIMER CES LIGNES (elles causent l'erreur) :
        # reservation.chambre.est_disponible = False
        # reservation.chambre.save()
        
        # ✅ LA DISPONIBILITÉ EST CALCULÉE AUTOMATIQUEMENT
        # La chambre devient indisponible dès que la réservation passe à CONFIRMEE
        
        # Notification
        Notification.objects.create(
            client=reservation.client,
            reservation=reservation,
            type='VALIDATION',
            message=f"✅ Votre réservation #{reservation.id} a été CONFIRMÉE par le propriétaire !"
        )
        
        serializer = ReservationSerializer(reservation)
        return Response(serializer.data)


    @action(detail=True, methods=['post'])
    def refuser(self, request, pk=None):
        """Refuser une réservation (propriétaire)"""
        reservation = self.get_object()
        
        # Vérifier le propriétaire
        if reservation.hotel.proprietaire != request.user:
            return Response(
                {'error': 'Vous n\'êtes pas le propriétaire de cet hôtel'},
                status=status.HTTP_403_FORBIDDEN
            )
    
        # ✅ Refuser la réservation
        reservation.statut = 'REFUSEE'
        reservation.valide_par = request.user
        reservation.date_validation = timezone.now()
        reservation.save()
        
        # ❌ Pas besoin de toucher est_disponible (calculé automatiquement)
        
        # Notification
        Notification.objects.create(
            client=reservation.client,
            reservation=reservation,
            type='VALIDATION',
            message=f"❌ Votre réservation #{reservation.id} a été REFUSÉE par le propriétaire."
        )
        
        serializer = ReservationSerializer(reservation)
        return Response(serializer.data)

# ========== DEMANDE PLACEMENT VIEWS ==========
class DemandePlacementViewSet(viewsets.ModelViewSet):
    queryset = DemandePlacement.objects.all()
    serializer_class = DemandePlacementSerializer
    pagination_class = StandardPagination
    
    def get_permissions(self):
        if self.action in ['valider', 'refuser']:
            return [permissions.IsAuthenticated(), IsAdminUser()]
        if self.action == 'create':
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated()]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return DemandePlacement.objects.all()
        return DemandePlacement.objects.filter(proprietaire=user)
    
    def create(self, request, *args, **kwargs):
        try:
            print("📥 Données reçues:")
            print("POST data:", request.POST)
            print("FILES:", request.FILES)
            
            serializer = self.get_serializer(data=request.data)
            
            if not serializer.is_valid():
                print("❌ Erreurs de validation:", serializer.errors)
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
            
        except Exception as e:
            print(f"❌ Erreur création demande: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {'detail': f'Erreur: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def perform_create(self, serializer):
        try:
            from django.core.files.storage import default_storage
            from django.conf import settings
            
            hotel_photo = self.request.FILES.get('hotel_photo')
            proprietaire_photo = self.request.FILES.get('proprietaire_photo')
            photos_supp = self.request.FILES.getlist('hotel_photos_supp')
            
            photo_urls = []
            for photo in photos_supp:
                file_path = default_storage.save(f'demandes/hotels/{photo.name}', photo)
                file_url = f"{settings.MEDIA_URL}{file_path}"
                photo_urls.append(file_url)
            
            demande = serializer.save(
                proprietaire=self.request.user,
                hotel_photo=hotel_photo,
                proprietaire_photo=proprietaire_photo,
                hotel_photos_supp=photo_urls
            )
            
            print(f"✅ Demande créée: {demande.id} avec {len(photo_urls)} photos supp")
            return demande
            
        except Exception as e:
            print(f"❌ Erreur dans perform_create: {str(e)}")
            import traceback
            traceback.print_exc()
            raise
    
    @action(detail=True, methods=['post'])
    def valider(self, request, pk=None):
        demande = self.get_object()
        if demande.statut != 'EN_ATTENTE':
            return Response(
                {'error': 'Cette demande a déjà été traitée'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        hotel = Hotel.objects.create(
            proprietaire=demande.proprietaire,
            nom=demande.hotel_nom,
            adresse=demande.hotel_adresse,
            ville=demande.hotel_ville,
            telephone=demande.hotel_telephone,
            email_contact=demande.hotel_email,
            description=demande.hotel_description,
            photo_principale=demande.hotel_photo,
            est_actif=True
        )
        
        demande.statut = 'VALIDE'
        demande.traite_par = request.user
        demande.date_traitement = timezone.now()
        demande.save()
        
        return Response({
            'message': 'Hôtel validé et créé avec succès',
            'hotel_id': hotel.id,
            'demande': DemandePlacementSerializer(demande).data
        })
    
    @action(detail=True, methods=['post'])
    def refuser(self, request, pk=None):
        demande = self.get_object()
        if demande.statut != 'EN_ATTENTE':
            return Response(
                {'error': 'Cette demande a déjà été traitée'},
                status=status.HTTP_400_BAD_REQUEST
            )
        demande.statut = 'REFUSE'
        demande.traite_par = request.user
        demande.date_traitement = timezone.now()
        demande.save()
        serializer = DemandePlacementSerializer(demande)
        return Response(serializer.data)


# ========== NOTIFICATION VIEWS ==========
class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        try:
            client = Client.objects.get(user=user)
            return Notification.objects.filter(client=client)
        except:
            return Notification.objects.none()
    
    @action(detail=True, methods=['post'])
    def marquer_lue(self, request, pk=None):
        notification = self.get_object()
        notification.est_lue = True
        notification.save()
        return Response({'status': 'Notification marquée comme lue'})


# ========== COMMISSION VIEWS ==========
# ========== COMMISSION VIEWS ==========
class CommissionAdminViewSet(viewsets.ModelViewSet):
    queryset = CommissionAdmin.objects.all().order_by('-date_creation')
    serializer_class = CommissionAdminSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        total = CommissionAdmin.objects.aggregate(total=Sum('montant'))
        en_attente = CommissionAdmin.objects.filter(statut='EN_ATTENTE').count()
        payees = CommissionAdmin.objects.filter(statut='PAYEE').count()
        return Response({
            'total_commissions': total['total'] or 0,
            'en_attente': en_attente,
            'payees': payees,
            'nombre_total': CommissionAdmin.objects.count()
        })
    
    # ✅ NOUVELLE ACTION : Marquer une commission comme payée
    @action(detail=True, methods=['post'])
    def marquer_payee(self, request, pk=None):
        """Marquer une commission comme payée (admin a reçu l'argent)"""
        commission = self.get_object()
        
        if commission.statut == 'PAYEE':
            return Response(
                {'error': 'Cette commission est déjà marquée comme payée'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        commission.statut = 'PAYEE'
        commission.date_paiement = timezone.now()
        commission.save()
        
        # ✅ Notification au propriétaire
        try:
            client = Client.objects.get(user=commission.reservation.hotel.proprietaire)
            Notification.objects.create(
                client=client,
                reservation=commission.reservation,
                type='SYSTEME',
                message=f"💰 Commission de {commission.montant} Ar payée à la plateforme pour la réservation #{commission.reservation.id}."
            )
        except Client.DoesNotExist:
            pass
        
        serializer = CommissionAdminSerializer(commission)
        return Response(serializer.data)
    
    # ✅ NOUVELLE ACTION : Marquer toutes les commissions en attente comme payées
    @action(detail=False, methods=['post'])
    def marquer_toutes_payees(self, request):
        """Marquer TOUTES les commissions en attente comme payées"""
        commissions = CommissionAdmin.objects.filter(statut='EN_ATTENTE')
        count = commissions.count()
        
        for commission in commissions:
            commission.statut = 'PAYEE'
            commission.date_paiement = timezone.now()
            commission.save()
        
        return Response({
            'message': f'{count} commission(s) marquée(s) comme payée(s)',
            'count': count
        })


# ========== AUTH VIEWS ==========
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]
    
    def create(self, request, *args, **kwargs):
        # ✅ LOGS DE DEBUG
        print("=" * 50)
        print("📥 DONNÉES REÇUES POUR INSCRIPTION:")
        print("POST:", request.POST)
        print("DATA:", request.data)
        print("FILES:", request.FILES)
        print("=" * 50)
        
        required_fields = ['username', 'email', 'password']
        for field in required_fields:
            if not request.data.get(field):
                error_msg = f'Le champ {field} est requis'
                print(f"❌ {error_msg}")
                return Response(
                    {'error': error_msg},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        if User.objects.filter(username=request.data.get('username')).exists():
            error_msg = 'Ce nom d\'utilisateur est déjà pris'
            print(f"❌ {error_msg}")
            return Response(
                {'error': error_msg},
                status=status.HTTP_400_BAD_REQUEST
            )
        if User.objects.filter(email=request.data.get('email')).exists():
            error_msg = 'Cet email est déjà utilisé'
            print(f"❌ {error_msg}")
            return Response(
                {'error': error_msg},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.create_user(
                username=request.data.get('username'),
                email=request.data.get('email'),
                password=request.data.get('password'),
                first_name=request.data.get('first_name', ''),
                last_name=request.data.get('last_name', '')
            )
            
            # ✅ Créer le client
            client = Client.objects.create(
                user=user,
                telephone=request.data.get('telephone', ''),
                adresse=request.data.get('adresse', ''),
            )
            
            # ✅ Gérer la photo de profil
            photo_profil = request.FILES.get('photo_profil')
            if photo_profil:
                client.photo_profil = photo_profil
                client.save()
            
            print(f"✅ Utilisateur créé: {user.username}")
            
            refresh = RefreshToken.for_user(user)
            refresh['role'] = 'client'
            refresh['user_id'] = user.id
            refresh['username'] = user.username
            
            return Response({
                'user': UserSerializer(user).data,
                'client': ClientSerializer(client).data,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'message': 'Inscription réussie'
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            print(f"❌ ERREUR CRÉATION: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


# ============================================================
# CHAT AGENT IA
# ============================================================
class ChatViewSet(viewsets.ViewSet):
    """
    Endpoint pour l'agent IA de la plateforme.
    Chaque utilisateur a sa propre conversation privée.
    """
    permission_classes = [permissions.AllowAny]  # Accessible à tous
    
    def _get_or_create_conversation(self, request):
        """Récupère ou crée une conversation pour l'utilisateur actuel"""
        if request.user.is_authenticated:
            # ✅ Utilisateur connecté : conversation liée au compte
            conversation, created = ChatConversation.objects.get_or_create(
                user=request.user,
                defaults={'title': f'Conversation de {request.user.username}'}
            )
        else:
            # ✅ Visiteur non connecté : conversation liée à la session
            if not request.session.session_key:
                request.session.create()
            session_key = request.session.session_key
            conversation, created = ChatConversation.objects.get_or_create(
                session_key=session_key,
                user__isnull=True,
                defaults={'title': f'Conversation visiteur'}
            )
        return conversation
    
    @action(detail=False, methods=['post'])
    def send_message(self, request):
        """Envoyer un message à l'agent IA"""
        try:
            content = request.data.get('content', '').strip()
            
            if not content:
                return Response(
                    {'error': 'Le message ne peut pas être vide'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if len(content) > 500:
                return Response(
                    {'error': 'Le message est trop long (max 500 caractères)'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # ✅ Récupérer/créer la conversation
            conversation = self._get_or_create_conversation(request)
            
            # ✅ Sauvegarder le message utilisateur
            user_message = ChatMessage.objects.create(
                conversation=conversation,
                role='user',
                content=content
            )
            
            # ✅ Récupérer l'historique
            history = list(
                conversation.messages
                .order_by('date_creation')
                .values('role', 'content')[:20]
            )
            
            # ✅ Obtenir la réponse IA
            ai_result = get_ai_response(
                question=content,
                is_authenticated=request.user.is_authenticated,
                user=request.user if request.user.is_authenticated else None,
                conversation_history=history
            )
            
            # ✅ Sauvegarder la réponse
            assistant_message = ChatMessage.objects.create(
                conversation=conversation,
                role='assistant',
                content=ai_result['content'],
                metadata={'source': ai_result['source']}
            )
            
            # ✅ Mettre à jour la date de modification
            conversation.save()  # auto_now sur date_modification
            
            return Response({
                'user_message': ChatMessageSerializer(user_message).data,
                'assistant_message': ChatMessageSerializer(assistant_message).data,
                'conversation_id': conversation.id,
            })
            
        except Exception as e:
            print(f"❌ Erreur chat: {e}")
            import traceback
            traceback.print_exc()
            return Response(
                {'error': 'Erreur lors du traitement du message'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def history(self, request):
        """Récupérer l'historique de la conversation"""
        conversation = self._get_or_create_conversation(request)
        serializer = ChatConversationSerializer(conversation)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def clear_history(self, request):
        """Effacer l'historique de la conversation"""
        conversation = self._get_or_create_conversation(request)
        conversation.messages.all().delete()
        return Response({'message': 'Historique effacé'})