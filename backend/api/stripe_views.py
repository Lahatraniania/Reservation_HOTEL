import stripe
import logging
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from .models import Reservation, Room, Notification, CommissionAdmin
from decimal import Decimal

logger = logging.getLogger(__name__)
stripe.api_key = settings.STRIPE_SECRET_KEY


# ============================================================
# CRÉER UNE SESSION DE PAIEMENT STRIPE
# ============================================================
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_checkout_session(request):
    """Créer une session de paiement Stripe"""
    try:
        reservation_id = request.data.get('reservation_id')
        
        if not reservation_id:
            return JsonResponse({'error': 'reservation_id requis'}, status=400)
        
        try:
            reservation = Reservation.objects.get(id=reservation_id, client__user=request.user)
        except Reservation.DoesNotExist:
            return JsonResponse({'error': 'Réservation non trouvée'}, status=404)
        
        # ✅ Vérifier que la réservation est en attente
        if reservation.statut != 'EN_ATTENTE':
            return JsonResponse({'error': 'Cette réservation a déjà été traitée'}, status=400)
        
        # ✅ Vérifier que la chambre est disponible
        if not reservation.chambre.est_disponible:
            return JsonResponse({'error': 'Cette chambre n\'est plus disponible'}, status=400)
        
        # ✅ Montant en centimes (MGA = pas de centimes, utiliser USD)
        # ⚠️ MGA n'est PAS supporté par Stripe, utiliser USD
        # 1 USD ≈ 4500 MGA (taux approximatif)
        amount_mga = int(reservation.montant_total)
        amount_usd = max(1, amount_mga // 4500)  # Minimum 1 USD
        amount_cents = amount_usd * 100
        
        # ✅ Email du client
        customer_email = reservation.client.user.email
        
        try:
            checkout_session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                customer_email=customer_email,  # ✅ AJOUTER L'EMAIL DU CLIENT
                line_items=[{
                    'price_data': {
                        'currency': 'usd',
                        'product_data': {
                            'name': f"Hôtel - Chambre {reservation.chambre.numero}",
                            'description': f"Du {reservation.date_debut} au {reservation.date_fin} ({reservation.nombre_nuits} nuits)",
                        },
                        'unit_amount': amount_cents,
                    },
                    'quantity': 1,
                }],
                mode='payment',
                success_url=f"{settings.FRONTEND_URL}/payment-success?session_id={{CHECKOUT_SESSION_ID}}",
                cancel_url=f"{settings.FRONTEND_URL}/payment-cancel",
                metadata={
                    'reservation_id': str(reservation.id),
                    'client_id': str(reservation.client.id),
                }
            )
            
            # ✅ Sauvegarder l'ID de la session
            reservation.stripe_session_id = checkout_session.id
            reservation.save()
            
            logger.info(f"✅ Session Stripe créée: {checkout_session.id} pour réservation #{reservation.id}")
            
            return JsonResponse({
                'session_id': checkout_session.id,
                'session_url': checkout_session.url,
                'reservation_id': reservation.id
            })
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error: {str(e)}")
            return JsonResponse({'error': str(e)}, status=400)
            
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        import traceback
        traceback.print_exc()
        return JsonResponse({'error': 'Erreur interne du serveur'}, status=500)


# ============================================================
# WEBHOOK STRIPE
# ============================================================
@csrf_exempt
@require_http_methods(["POST"])
def stripe_webhook(request):
    """Webhook Stripe pour confirmer les paiements"""
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
    webhook_secret = settings.STRIPE_WEBHOOK_SECRET
    
    if not webhook_secret:
        logger.error("STRIPE_WEBHOOK_SECRET non configuré")
        return JsonResponse({'error': 'Webhook secret not configured'}, status=500)
    
    try:
        event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
    except ValueError as e:
        logger.error(f"Invalid payload: {str(e)}")
        return JsonResponse({'error': 'Invalid payload'}, status=400)
    except stripe.error.SignatureVerificationError as e:
        logger.error(f"Invalid signature: {str(e)}")
        return JsonResponse({'error': 'Invalid signature'}, status=400)
    
    # ✅ Paiement complété
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        
        # ✅ Utiliser .get() sur metadata (qui est un dict-like object)
        metadata = session.metadata or {}
        reservation_id = metadata.get('reservation_id')
        
        if reservation_id:
            try:
                reservation = Reservation.objects.get(id=reservation_id)
                
                # ✅ Passer le statut à PAYEE
                reservation.statut = 'PAYEE'
                # ✅ Utiliser .payment_intent (attribut) au lieu de .get()
                reservation.stripe_payment_intent = session.payment_intent
                reservation.save()
                
                # ✅ Créer la commission SEULEMENT si elle n'existe pas
                try:
                    reservation.commission
                    logger.info(f"Commission existe déjà pour réservation #{reservation.id}")
                except CommissionAdmin.DoesNotExist:
                    commission = CommissionAdmin.objects.create(
                        reservation=reservation,
                        montant=reservation.commission_admin,
                        statut='EN_ATTENTE'
                    )
                    logger.info(f"✅ Commission créée: {commission.montant} Ar")
                
                # ✅ Notification pour le client
                Notification.objects.create(
                    client=reservation.client,
                    reservation=reservation,
                    type='PAIEMENT',
                    message=f"✅ Paiement reçu ! Réservation #{reservation.id} PAYÉE. En attente de validation du propriétaire."
                )
                
                logger.info(f"✅ Réservation #{reservation_id} passée à PAYEE")
                
            except Reservation.DoesNotExist:
                logger.error(f"Réservation {reservation_id} non trouvée")
                return JsonResponse({'error': 'Reservation not found'}, status=404)
    
    # ✅ Session expirée
    elif event['type'] == 'checkout.session.expired':
        session = event['data']['object']
        metadata = session.metadata or {}
        reservation_id = metadata.get('reservation_id')
        
        if reservation_id:
            try:
                reservation = Reservation.objects.get(id=reservation_id)
                reservation.statut = 'EXPIREE'
                reservation.save()
                logger.info(f"Réservation #{reservation_id} expirée")
            except Reservation.DoesNotExist:
                pass
    
    return JsonResponse({'status': 'success'})


# ============================================================
# VÉRIFIER LE PAIEMENT (AVEC FALLBACK WEBHOOK)
# ============================================================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def verify_payment(request, session_id):
    """
    Vérifier le statut du paiement.
    ✅ Fallback : Si le webhook n'a pas été appelé, on traite le paiement manuellement.
    """
    try:
        session = stripe.checkout.Session.retrieve(session_id)
        reservation = Reservation.objects.filter(stripe_session_id=session_id).first()
        
        if not reservation:
            return JsonResponse({'error': 'Réservation non trouvée'}, status=404)
        
        # ✅ FALLBACK : Si paiement réussi mais statut encore EN_ATTENTE
        # ⚠️ Utiliser les ATTRIBUTS au lieu de .get()
        payment_status = session.payment_status  # ✅ .payment_status
        payment_intent = session.payment_intent   # ✅ .payment_intent
        
        if payment_status == 'paid' and reservation.statut == 'EN_ATTENTE':
            logger.warning(f"⚠️ Fallback - Traitement manuel réservation #{reservation.id}")
            
            reservation.statut = 'PAYEE'
            reservation.stripe_payment_intent = payment_intent
            reservation.save()
            
            logger.info(f"✅ Réservation #{reservation.id} → PAYEE, PI: {payment_intent}")
            
            # ✅ Créer la commission SEULEMENT si elle n'existe pas
            try:
                reservation.commission
                logger.info(f"Commission existe déjà pour #{reservation.id}")
            except CommissionAdmin.DoesNotExist:
                commission = CommissionAdmin.objects.create(
                    reservation=reservation,
                    montant=reservation.commission_admin,
                    statut='EN_ATTENTE'
                )
                logger.info(f"✅ Commission créée: {commission.montant} Ar")
                
                # ✅ Notification pour le client
                Notification.objects.create(
                    client=reservation.client,
                    reservation=reservation,
                    type='PAIEMENT',
                    message=f"✅ Paiement reçu ! Réservation #{reservation.id} PAYÉE. En attente de validation du propriétaire."
                )
        
        # ✅ Mettre à jour le payment_intent si manquant
        if payment_status == 'paid' and not reservation.stripe_payment_intent:
            reservation.stripe_payment_intent = payment_intent
            reservation.save()
            logger.info(f"✅ PI mis à jour pour #{reservation.id}")
        
        return JsonResponse({
            'reservation_id': reservation.id,
            'statut': reservation.statut,
            'payment_status': payment_status,
            'montant_total': str(reservation.montant_total),
            'commission': str(reservation.commission_admin),
            'stripe_payment_intent': reservation.stripe_payment_intent or '',
        })
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {str(e)}")
        return JsonResponse({'error': str(e)}, status=400)
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        import traceback
        traceback.print_exc()
        return JsonResponse({'error': 'Erreur interne'}, status=500)


# ============================================================
# CONFIGURATION STRIPE PUBLIQUE
# ============================================================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_stripe_config(request):
    """Récupérer la clé publique Stripe"""
    return JsonResponse({
        'publishable_key': settings.STRIPE_PUBLISHABLE_KEY
    })