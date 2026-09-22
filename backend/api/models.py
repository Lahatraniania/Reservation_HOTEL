from django.db import models
from django.contrib.auth.models import User
from datetime import date
from decimal import Decimal

# ========== HÔTEL ==========
class Hotel(models.Model):
    """
    Modèle Hôtel - Géré par le propriétaire
    """
    proprietaire = models.ForeignKey(User, on_delete=models.CASCADE, related_name='hotels')
    nom = models.CharField(max_length=200)
    adresse = models.TextField()
    ville = models.CharField(max_length=100)
    pays = models.CharField(max_length=100, default='Madagascar')
    description = models.TextField(blank=True)
    telephone = models.CharField(max_length=20)
    email_contact = models.EmailField()
    
    # ✅ IMAGES
    photo_principale = models.ImageField(upload_to='hotels/', null=True, blank=True)
    photos_supplementaires = models.JSONField(default=list, blank=True)
    
    # Statut
    est_actif = models.BooleanField(default=False)
    est_visible = models.BooleanField(default=True)
    
    # Métriques
    note_moyenne = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    nombre_avis = models.IntegerField(default=0)
    
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.nom} - {self.ville}"
    
    class Meta:
        ordering = ['-date_creation']

class Room(models.Model):
    ROOM_TYPES = [
        ('STANDARD', 'Standard'),
        ('SUPERIEUR', 'Supérieur'),
        ('LUXE', 'Luxe'),
        ('FAMILIALE', 'Familiale'),
        ('SUITE', 'Suite'),
    ]
    
    # ========== RELATIONS ==========
    hotel = models.ForeignKey(
        Hotel, 
        on_delete=models.CASCADE, 
        related_name='chambres'
    )
    
    # ========== IDENTIFICATION ==========
    numero = models.CharField(max_length=10, help_text="Numéro de la chambre (ex: 101)")
    type = models.CharField(
        max_length=20, 
        choices=ROOM_TYPES, 
        default='STANDARD'
    )
    
    # ========== TARIFS ==========
    prix_nuit = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        help_text="Prix par nuit en Ariary"
    )
    
    # ========== IMAGES ==========
    photo_principale = models.ImageField(
        upload_to='rooms/', 
        null=True, 
        blank=True
    )
    photos_supplementaires = models.JSONField(
        default=list, 
        blank=True,
        help_text="Liste d'URLs des photos supplémentaires"
    )
    
    # ========== CARACTÉRISTIQUES ==========
    capacite = models.IntegerField(
        default=2,
        help_text="Nombre maximum de personnes"
    )
    surface = models.IntegerField(
        null=True, 
        blank=True,
        help_text="Surface en m²"
    )
    equipements = models.JSONField(
        default=list,
        help_text="Liste des équipements (WiFi, Clim, TV...)"
    )
    nb_lits_simples = models.IntegerField(default=0)
    nb_lits_doubles = models.IntegerField(default=1)
    
    # ========== STATUT ==========
    est_actif = models.BooleanField(
        default=True,
        help_text="Chambre activée par le propriétaire (visible aux clients)"
    )
    
    # ========== DESCRIPTION ==========
    description = models.TextField(
        blank=True,
        help_text="Description de la chambre"
    )
    
    # ========== MÉTRIQUES ==========
    note_moyenne = models.DecimalField(
        max_digits=3, 
        decimal_places=2, 
        default=0,
        help_text="Note moyenne (0-5)"
    )
    nombre_avis = models.IntegerField(default=0)
    
    # ========== DATES ==========
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['hotel', 'numero']
        ordering = ['-date_creation']
        verbose_name = "Chambre"
        verbose_name_plural = "Chambres"
    
    def __str__(self):
        return f"Chambre {self.numero} - {self.hotel.nom}"
    
    # ============================================================
    # MÉTHODES DE DISPONIBILITÉ
    # ============================================================
    
    def est_disponible_pour_periode(self, date_debut, date_fin):
        """
        ✅ Vérifie si la chambre est disponible sur une période donnée.
        
        Args:
            date_debut: Date d'arrivée (str ou date)
            date_fin: Date de départ (str ou date)
        
        Returns:
            bool: True si disponible, False sinon
        """
        from datetime import datetime
        
        # Convertir les strings en dates si nécessaire
        if isinstance(date_debut, str):
            date_debut = datetime.strptime(date_debut, '%Y-%m-%d').date()
        if isinstance(date_fin, str):
            date_fin = datetime.strptime(date_fin, '%Y-%m-%d').date()
        
        # ✅ Vérifier les réservations qui chevauchent la période
        reservations_actives = self.reservations.filter(
            statut__in=['EN_ATTENTE', 'PAYEE', 'CONFIRMEE'],
            date_debut__lt=date_fin,
            date_fin__gt=date_debut
        )
        return not reservations_actives.exists()
    
    def est_disponible_aujourd_hui(self):
        """✅ Vérifie si la chambre est libre aujourd'hui"""
        today = date.today()
        return self.est_disponible_pour_periode(today, today)
    
    def a_reservation_future(self):
        """✅ Vérifie si la chambre a une réservation future"""
        today = date.today()
        return self.reservations.filter(
            statut__in=['EN_ATTENTE', 'PAYEE', 'CONFIRMEE'],
            date_fin__gte=today
        ).exists()
    
    def prochaine_reservation(self):
        """✅ Retourne la prochaine réservation (à venir ou en cours)"""
        today = date.today()
        return self.reservations.filter(
            statut__in=['EN_ATTENTE', 'PAYEE', 'CONFIRMEE'],
            date_fin__gte=today
        ).order_by('date_debut').first()
    
    # ============================================================
    # PROPRIÉTÉS CALCULÉES
    # ============================================================
    
    @property
    def est_disponible(self):
        """
        ✅ Propriété calculée : la chambre est disponible si aucune 
        réservation active ne chevauche la date d'aujourd'hui.
        
        ⚠️ LECTURE SEULE - Ne peut pas être modifiée manuellement.
        """
        return self.est_disponible_aujourd_hui()
    
    @property
    def statut_disponibilite(self):
        """✅ Retourne le statut détaillé pour l'affichage"""
        prochaine = self.prochaine_reservation()
        if not prochaine:
            return {'disponible': True, 'message': 'Disponible'}
        
        today = date.today()
        if prochaine.date_debut <= today <= prochaine.date_fin:
            return {
                'disponible': False,
                'message': f'Occupée jusqu\'au {prochaine.date_fin}'
            }
        else:
            return {
                'disponible': True,
                'message': f'Réservée à partir du {prochaine.date_debut}'
            }
    
    @property
    def prix_par_nuit_formate(self):
        """✅ Retourne le prix formaté"""
        return f"{self.prix_nuit:,.0f} Ar"
    
    @property
    def prix_total_pour_nuits(self):
        """✅ Retourne le prix total selon le nombre de nuits"""
        def calc(nb_nuits):
            return self.prix_nuit * nb_nuits
        return calc
    
    @property
    def type_display(self):
        """✅ Retourne le libellé du type"""
        return dict(self.ROOM_TYPES).get(self.type, self.type)
    
    @property
    def nombre_lits_total(self):
        """✅ Nombre total de lits"""
        return self.nb_lits_simples + self.nb_lits_doubles
    
    # ============================================================
    # MÉTHODES UTILITAIRES
    # ============================================================
    
    def get_reservations_actives(self):
        """✅ Toutes les réservations non terminées"""
        return self.reservations.filter(
            statut__in=['EN_ATTENTE', 'PAYEE', 'CONFIRMEE']
        ).order_by('date_debut')
    
    def get_taux_occupation(self, date_debut, date_fin):
        """
        ✅ Calcule le taux d'occupation sur une période (en %)
        """
        from datetime import datetime, timedelta
        
        if isinstance(date_debut, str):
            date_debut = datetime.strptime(date_debut, '%Y-%m-%d').date()
        if isinstance(date_fin, str):
            date_fin = datetime.strptime(date_fin, '%Y-%m-%d').date()
        
        total_jours = (date_fin - date_debut).days
        if total_jours == 0:
            return 0
        
        reservations = self.reservations.filter(
            statut__in=['PAYEE', 'CONFIRMEE'],
            date_debut__lt=date_fin,
            date_fin__gt=date_debut
        )
        
        jours_occupes = 0
        for res in reservations:
            debut = max(res.date_debut, date_debut)
            fin = min(res.date_fin, date_fin)
            jours_occupes += (fin - debut).days
        
        return round((jours_occupes / total_jours) * 100, 2)

# ========== CLIENT ==========
class Client(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='client')
    telephone = models.CharField(max_length=20)
    
    # ✅ IMAGE DE PROFIL
    photo_profil = models.ImageField(upload_to='clients/', null=True, blank=True)
    
    adresse = models.TextField(blank=True)
    date_naissance = models.DateField(null=True, blank=True)
    preferences = models.JSONField(default=dict, blank=True)
    
    date_inscription = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.user.username
    @property
    def nom_complet(self):
        return f"{self.user.first_name} {self.user.last_name}".strip()


# ========== RÉSERVATION ==========
class Reservation(models.Model):
    """
    Modèle Réservation - Faite par un client
    """
    STATUS_CHOICES = [
        ('EN_ATTENTE', 'En attente de paiement'),
        ('PAYEE', 'Payée - En attente de validation'),
        ('CONFIRMEE', 'Confirmée par le propriétaire'),
        ('REFUSEE', 'Refusée par le propriétaire'),
        ('ANNULEE', 'Annulée par le client'),
        ('EXPIREE', 'Expirée'),
        ('ECHEC_PAIEMENT', 'Échec du paiement'),
    ]
    
    # Relations
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='reservations')
    chambre = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='reservations')
    hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE, related_name='reservations')
    
    # Période
    date_debut = models.DateField()
    date_fin = models.DateField()
    nombre_nuits = models.IntegerField()
    
    # Tarifs
    prix_nuit = models.DecimalField(max_digits=10, decimal_places=2)
    montant_total = models.DecimalField(max_digits=10, decimal_places=2)
    commission_admin = models.DecimalField(max_digits=10, decimal_places=2, default=0)  # 1%
    
    # Statut
    statut = models.CharField(max_length=20, choices=STATUS_CHOICES, default='EN_ATTENTE')
    
    # Paiement Stripe
    stripe_session_id = models.CharField(max_length=255, blank=True, null=True)
    stripe_payment_intent = models.CharField(max_length=255, blank=True, null=True)
    
    # Validation par propriétaire
    valide_par = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reservations_validees')
    date_validation = models.DateTimeField(null=True, blank=True)
    
    # Dates
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-date_creation']
    
    def __str__(self):
        return f"Réservation #{self.id} - {self.client.user.username}"
    
    def calculer_total(self):
        """Calcule le montant total et la commission"""
        if self.date_debut and self.date_fin:
            jours = (self.date_fin - self.date_debut).days
            if jours > 0:
                self.nombre_nuits = jours
                self.montant_total = jours * self.prix_nuit
                self.commission_admin = self.montant_total * Decimal('0.01')  # 1%
            else:
                self.nombre_nuits = 1
                self.montant_total = self.prix_nuit
                self.commission_admin = self.prix_nuit * Decimal('0.01')
        return self.montant_total
    
    def save(self, *args, **kwargs):
        # Récupérer le prix de la chambre
        if not self.prix_nuit:
            self.prix_nuit = self.chambre.prix_nuit
        
        # Calculer le total
        if self.date_debut and self.date_fin:
            self.calculer_total()
        
        super().save(*args, **kwargs)


# ========== NOTIFICATION ==========
class Notification(models.Model):
    """
    Modèle Notification - Alertes pour les utilisateurs
    """
    TYPES = [
        ('RESERVATION', 'Réservation'),
        ('PAIEMENT', 'Paiement'),
        ('VALIDATION', 'Validation'),
        ('SYSTEME', 'Système'),
    ]
    
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='notifications')
    reservation = models.ForeignKey(Reservation, on_delete=models.CASCADE, null=True, blank=True)
    type = models.CharField(max_length=20, choices=TYPES, default='SYSTEME')
    message = models.TextField()
    est_lue = models.BooleanField(default=False)
    date_creation = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-date_creation']
    
    def __str__(self):
        return f"Notification - {self.client.user.username}"


# ========== DEMANDE PLACEMENT HÔTEL ==========
class DemandePlacement(models.Model):
    STATUT_CHOICES = [
        ('EN_ATTENTE', 'En attente'),
        ('VALIDE', 'Validé'),
        ('REFUSE', 'Refusé'),
    ]
    
    proprietaire = models.ForeignKey(User, on_delete=models.CASCADE, related_name='demandes')
    
    # Informations hôtel
    hotel_nom = models.CharField(max_length=200)
    hotel_adresse = models.TextField()
    hotel_ville = models.CharField(max_length=100)
    hotel_telephone = models.CharField(max_length=20)
    hotel_email = models.EmailField()
    hotel_description = models.TextField()
    
    # ✅ IMAGES DE L'HÔTEL
    hotel_photo = models.ImageField(upload_to='demandes/hotels/', null=True, blank=True)
    hotel_photos_supp = models.JSONField(default=list, blank=True)
    
    # ✅ IMAGE DE PROFIL DU PROPRIÉTAIRE
    proprietaire_photo = models.ImageField(upload_to='demandes/proprietaires/', null=True, blank=True)
    
    # Documents
    documents = models.JSONField(default=list)
    
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='EN_ATTENTE')
    traite_par = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='demandes_traitees')
    date_traitement = models.DateTimeField(null=True, blank=True)
    
    date_demande = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Demande {self.hotel_nom} - {self.proprietaire.username}"
    

# ========== COMMISSION ADMIN ==========
class CommissionAdmin(models.Model):
    """
    Modèle Commission - Suivi des 1% reversés à l'admin
    """
    STATUT_CHOICES = [
        ('EN_ATTENTE', 'En attente'),
        ('PAYEE', 'Payée'),
    ]
    
    reservation = models.OneToOneField(Reservation, on_delete=models.CASCADE, related_name='commission')
    montant = models.DecimalField(max_digits=10, decimal_places=2)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='EN_ATTENTE')
    date_creation = models.DateTimeField(auto_now_add=True)
    date_paiement = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"Commission {self.montant} Ar - Réservation #{self.reservation.id}"

# ============================================================
# CHAT AGENT IA
# ============================================================
class ChatConversation(models.Model):
    """
    Conversation privée entre un utilisateur et l'agent IA.
    """
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='conversations',
        null=True,
        blank=True
    )
    session_key = models.CharField(max_length=100, null=True, blank=True)
    title = models.CharField(max_length=200, default='Nouvelle conversation')
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-date_modification']
    
    def __str__(self):
        if self.user:
            return f"Conversation de {self.user.username}"
        return f"Conversation visiteur {self.session_key}"


class ChatMessage(models.Model):
    """
    Message individuel dans une conversation.
    """
    ROLE_CHOICES = [
        ('user', 'Utilisateur'),
        ('assistant', 'Assistant IA'),
    ]
    
    conversation = models.ForeignKey(
        ChatConversation, 
        on_delete=models.CASCADE, 
        related_name='messages'
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    content = models.TextField()
    is_public = models.BooleanField(default=False)
    metadata = models.JSONField(default=dict, blank=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['date_creation']
    
    def __str__(self):
        return f"{self.role}: {self.content[:50]}"