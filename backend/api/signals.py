from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from decimal import Decimal
from .models import Reservation, CommissionAdmin, Notification, Client, Hotel
from django.contrib.auth.models import User

@receiver(pre_save, sender=Reservation)
def calculer_commission_signal(sender, instance, **kwargs):
    """
    Calcule la commission avant la sauvegarde
    """
    if not instance.montant_total:
        instance.calculer_total()


@receiver(post_save, sender=Reservation)
def creer_commission_signal(sender, instance, created, **kwargs):
    """
    Crée automatiquement la commission admin lors d'une réservation confirmée
    """
    if instance.statut == 'CONFIRMEE' and instance.montant_total > 0:
        # Vérifier si la commission existe déjà
        if not hasattr(instance, 'commission'):
            CommissionAdmin.objects.create(
                reservation=instance,
                montant=instance.commission_admin,
                statut='EN_ATTENTE'
            )
            print(f"✅ Commission de {instance.commission_admin} Ar créée pour réservation #{instance.id}")


@receiver(post_save, sender=Reservation)
def notifier_client_signal(sender, instance, created, **kwargs):
    """
    Envoie une notification au client lors de la création/validation
    """
    if created:
        Notification.objects.create(
            client=instance.client,
            reservation=instance,
            type='RESERVATION',
            message=f"Votre réservation #{instance.id} a été créée. En attente de paiement."
        )
    
    if instance.statut == 'CONFIRMEE':
        existing_notif = Notification.objects.filter(
            client=instance.client,
            reservation=instance,
            type='VALIDATION'
        ).exists()
        
        if not existing_notif:
            Notification.objects.create(
                client=instance.client,
                reservation=instance,
                type='VALIDATION',
                message=f"✅ Votre réservation #{instance.id} a été CONFIRMÉE par le propriétaire !"
            )


# ✅ Ajouter ce signal pour mettre à jour le rôle
@receiver(post_save, sender=Hotel)
def mettre_a_jour_role_proprietaire(sender, instance, created, **kwargs):
    """
    Met à jour le rôle de l'utilisateur quand il crée un hôtel
    """
    if created:
        # Le rôle est déterminé dynamiquement via le serializer
        print(f"✅ Hôtel créé par {instance.proprietaire.username} - rôle: proprietaire")