"""
Service Agent IA pour Reservation_HOTEL
Gère les interactions avec l'IA et la base de données.
"""
import os
import json
import re
from typing import Optional, Dict, List
from decimal import Decimal
from datetime import date, datetime

# ✅ Import Django
from django.conf import settings
from django.db import models
from django.db.models import Count, Q, Min, Max, Sum, Avg

# ✅ Supprimer les warnings Gemini déprécié
import warnings
warnings.filterwarnings('ignore', category=FutureWarning)

# ✅ Import Google Gemini
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    print("⚠️ google-generativeai non installé. L'agent utilisera le fallback.")

from .models import Hotel, Room, Client, Reservation, DemandePlacement


# ============================================================
# CONFIGURATION
# ============================================================
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')
if GEMINI_AVAILABLE and GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# ✅ Liste de modèles à essayer (du plus récent au plus ancien)
GEMINI_MODELS = [
    'gemini-3.6-flash',      # ✅ Le plus récent (suggéré par Google)
    'gemini-3-flash',        # ✅ Alternative
    'gemini-2.5-flash',      # ⚠️ Ancien (peut ne plus fonctionner)
    'gemini-2.0-flash',      # ⚠️ Ancien
    'gemini-flash-latest',   # ✅ Toujours le dernier
]

# ✅ Modèle actif (sera déterminé automatiquement)
ACTIVE_MODEL = None


def find_working_model():
    """Trouve automatiquement le premier modèle Gemini qui fonctionne"""
    global ACTIVE_MODEL
    
    if not GEMINI_AVAILABLE or not GEMINI_API_KEY:
        return None
    
    if ACTIVE_MODEL:
        return ACTIVE_MODEL
    
    for model_name in GEMINI_MODELS:
        try:
            model = genai.GenerativeModel(model_name)
            # Test rapide
            response = model.generate_content("test")
            if response.text:
                ACTIVE_MODEL = model_name
                print(f"✅ Modèle Gemini actif : {model_name}")
                return model_name
        except Exception as e:
            print(f"⚠️ Modèle {model_name} non disponible")
            continue
    
    print("❌ Aucun modèle Gemini disponible")
    return None


# ============================================================
# FONCTIONS D'EXTRACTION DE DONNÉES
# ============================================================
def get_platform_stats() -> Dict:
    """Récupère les statistiques générales de la plateforme"""
    try:
        total_hotels = Hotel.objects.filter(est_actif=True).count()
        total_rooms = Room.objects.filter(est_actif=True).count()
        total_reservations = Reservation.objects.filter(
            statut__in=['CONFIRMEE', 'PAYEE']
        ).count()
        total_clients = Client.objects.count()
        
        villes = list(
            Hotel.objects.filter(est_actif=True)
            .values_list('ville', flat=True)
            .distinct()
        )
        
        prix_stats = Room.objects.filter(est_actif=True).aggregate(
            min_price=Min('prix_nuit'),
            max_price=Max('prix_nuit')
        )
        
        prix_min = prix_stats['min_price']
        prix_max = prix_stats['max_price']
        
        return {
            'total_hotels': total_hotels,
            'total_rooms': total_rooms,
            'total_reservations': total_reservations,
            'total_clients': total_clients,
            'villes': villes,
            'prix_min': float(prix_min) if prix_min else 0,
            'prix_max': float(prix_max) if prix_max else 0,
        }
    except Exception as e:
        print(f"❌ Erreur stats: {e}")
        return {
            'total_hotels': 0, 'total_rooms': 0, 'total_reservations': 0,
            'total_clients': 0, 'villes': [], 'prix_min': 0, 'prix_max': 0,
        }


def get_hotel_info(nom_hotel: str) -> Optional[Dict]:
    """Récupère les infos d'un hôtel par son nom"""
    try:
        hotel = Hotel.objects.filter(nom__icontains=nom_hotel, est_actif=True).first()
        if not hotel:
            return None
        
        rooms = hotel.chambres.filter(est_actif=True)
        rooms_available = []
        
        for room in rooms:
            disponible = room.est_disponible_aujourd_hui()
            rooms_available.append({
                'numero': room.numero,
                'type': room.type,
                'prix_nuit': float(room.prix_nuit),
                'capacite': room.capacite,
                'surface': room.surface,
                'disponible': disponible,
                'message': room.statut_disponibilite.get('message', ''),
            })
        
        return {
            'id': hotel.id,
            'nom': hotel.nom,
            'ville': hotel.ville,
            'adresse': hotel.adresse,
            'description': hotel.description or 'Pas de description',
            'telephone': hotel.telephone,
            'email': hotel.email_contact,
            'note_moyenne': float(hotel.note_moyenne) if hotel.note_moyenne else 0,
            'nombre_chambres': rooms.count(),
            'chambres': rooms_available,
        }
    except Exception as e:
        print(f"❌ Erreur hotel info: {e}")
        return None


def get_room_availability(nom_hotel: str, numero_chambre: str = None,
                          date_debut: str = None, date_fin: str = None) -> Optional[Dict]:
    """Vérifie la disponibilité d'une chambre"""
    try:
        hotel = Hotel.objects.filter(nom__icontains=nom_hotel, est_actif=True).first()
        if not hotel:
            return None
        
        rooms = hotel.chambres.filter(est_actif=True)
        if numero_chambre:
            rooms = rooms.filter(numero__icontains=numero_chambre)
        
        results = []
        for room in rooms:
            if date_debut and date_fin:
                disponible = room.est_disponible_pour_periode(date_debut, date_fin)
            else:
                disponible = room.est_disponible_aujourd_hui()
            
            results.append({
                'numero': room.numero,
                'type': room.type,
                'prix_nuit': float(room.prix_nuit),
                'disponible': disponible,
                'message': room.statut_disponibilite.get('message', ''),
            })
        
        return {'hotel': hotel.nom, 'ville': hotel.ville, 'chambres': results}
    except Exception as e:
        print(f"❌ Erreur dispo: {e}")
        return None


def get_all_hotels_summary() -> str:
    """Récupère un résumé de tous les hôtels"""
    try:
        hotels = Hotel.objects.filter(est_actif=True).order_by('-note_moyenne')[:20]
        lines = []
        for h in hotels:
            lines.append(
                f"- {h.nom} ({h.ville}) - Note: {h.note_moyenne or 'N/A'}/5 - "
                f"{h.chambres.count()} chambres"
            )
        return '\n'.join(lines) if lines else "Aucun hôtel disponible"
    except Exception as e:
        print(f"❌ Erreur hotels summary: {e}")
        return "Erreur lors du chargement"


# ============================================================
# SYSTÈME DE PROMPTS
# ============================================================
def build_system_prompt(is_authenticated: bool, user=None) -> str:
    """Construit le prompt système selon le contexte"""
    stats = get_platform_stats()
    hotels_summary = get_all_hotels_summary()
    
    base_prompt = f"""Tu es "Ravorona", l'assistant IA de Reservation_HOTEL, la plateforme de réservation d'hôtels à Madagascar.

🌍 LANGUE : Tu réponds TOUJOURS dans la langue de l'utilisateur (Français ou Malgache).

📊 INFORMATIONS GÉNÉRALES :
- Nombre d'hôtels : {stats['total_hotels']}
- Nombre de chambres : {stats['total_rooms']}
- Nombre de clients : {stats['total_clients']}
- Villes : {', '.join(stats['villes']) if stats['villes'] else 'Aucune'}
- Prix : de {stats['prix_min']:,.0f} Ar à {stats['prix_max']:,.0f} Ar par nuit

🏨 LISTE DES HÔTELS :
{hotels_summary}

🎯 TES RÔLES :
1. Aider à trouver des hôtels et chambres
2. Donner les informations publiques (noms, villes, prix, disponibilité)
3. Expliquer le fonctionnement de la plateforme
4. Guider vers les bonnes pages

⚠️ INTERDICTIONS :
1. ❌ Ne JAMAIS faire de réservation
2. ❌ Ne JAMAIS donner les informations personnelles de clients
3. ❌ Ne JAMAIS valider/refuser une réservation
4. ❌ Ne JAMAIS traiter des paiements

📋 STYLE :
- Concis (2-4 phrases)
- Chaleureux et professionnel
- Emojis avec modération
- Si tu ne sais pas, propose le support

🌐 MALGACHE : Si l'utilisateur écrit en malgache, réponds en malgache.

"""
    
    if is_authenticated and user:
        base_prompt += f"""
✅ UTILISATEUR CONNECTÉ : {user.get_full_name() or user.username}
- Donne des informations personnalisées si demandé
- Aide à naviguer vers son dashboard
"""
    else:
        base_prompt += """
👤 VISITEUR NON CONNECTÉ :
- Informations générales uniquement
- Propose de se connecter pour plus de détails
- Ne divulgue JAMAIS d'informations privées
"""
    
    return base_prompt


# ============================================================
# FALLBACK - RÉPONSES PAR RÈGLES
# ============================================================
def fallback_response(question: str, is_authenticated: bool) -> str:
    """Réponse par règles si l'IA n'est pas disponible"""
    q = question.lower().strip()
    
    # ✅ Nettoyer les accents
    import unicodedata
    q_clean = ''.join(c for c in unicodedata.normalize('NFD', q) if unicodedata.category(c) != 'Mn')
    
    stats = get_platform_stats()
    
    # Salutations
    if any(w in q_clean for w in ['bonjour', 'salut', 'hello', 'manao ahoana', 'miarahaba', 'bonsoir']):
        if is_authenticated:
            return "Bonjour ! 👋 Comment puis-je vous aider aujourd'hui ?"
        return "Bonjour ! 👋 Je suis Ravorona, l'assistant de Reservation_HOTEL."
    
    # Comment découvrir/voir
    if any(w in q_clean for w in ['comment', 'ou ', 'where', 'how']) and \
       any(w in q_clean for w in ['decouvr', 'voir', 'trouv', 'explor', 'visit', 'consulter', 'cherch']):
        if any(w in q_clean for w in ['hotel', 'etablissement']):
            return """Pour découvrir nos hôtels : 🏨

1️⃣ Allez sur la page **Accueil**
2️⃣ Section **"Hôtels Populaires"**
3️⃣ Ou cliquez sur **"Hôtels"** dans le menu
4️⃣ Ou visitez `/hotels`"""
        if any(w in q_clean for w in ['chambre', 'room']):
            return """Pour découvrir nos chambres : 🛏️

1️⃣ Section **"Chambres Disponibles"** sur l'accueil
2️⃣ Ou cliquez sur **"Chambres"** dans le menu
3️⃣ Ou visitez `/chambres`"""
    
    # Nombre d'hôtels
    if any(w in q_clean for w in ['combien', 'nombre', 'how many']) and \
       any(w in q_clean for w in ['hotel', 'etablissement']):
        return f"Nous avons **{stats['total_hotels']} hôtels** partenaires. 🏨\n\nDécouvrez-les sur `/hotels`."
    
    # Nombre de chambres
    if any(w in q_clean for w in ['combien', 'nombre']) and \
       any(w in q_clean for w in ['chambre', 'room']):
        return f"Nous proposons **{stats['total_rooms']} chambres**. 🛏️\n\nConsultez `/chambres`."
    
    # Villes
    if any(w in q_clean for w in ['ville', 'localisation', 'region']):
        villes_str = ', '.join(stats['villes']) if stats['villes'] else 'Aucune'
        return f"Nos hôtels sont à : **{villes_str}**. 📍"
    
    # Prix
    if any(w in q_clean for w in ['prix', 'tarif', 'cout', 'price']):
        if stats['prix_min'] and stats['prix_max']:
            return f"Prix : **{stats['prix_min']:,.0f} Ar** à **{stats['prix_max']:,.0f} Ar** par nuit. 💰"
        return "Consultez `/chambres` pour les tarifs."
    
    # Réservation
    if any(w in q_clean for w in ['reserv', 'booking']):
        if is_authenticated:
            return "Pour réserver : `/chambres` → Choisir → Dates → Réserver → Paiement Stripe 💳"
        return "Connectez-vous d'abord : `/login` ou `/register` 📝"
    
    # Liste des hôtels
    if any(w in q_clean for w in ['liste', 'montre', 'affiche']):
        return f"Nos hôtels :\n\n{get_all_hotels_summary()}"
    
    # Contact
    if any(w in q_clean for w in ['contact', 'telephone', 'email']):
        return "📧 contact@reservation-hotel.mg\n📞 +261 34 12 345 67"
    
    # Aide
    if any(w in q_clean for w in ['aide', 'help', 'assistance', 'que peux']):
        return """Je peux vous aider avec :
- 🏨 Informations sur les hôtels
- 🛏️ Disponibilité des chambres
- 💰 Prix et tarifs
- 📍 Villes
- 📞 Contact

Tapez votre question !"""
    
    # Par défaut
    return """Je n'ai pas compris. 🤔

Exemples :
- "Combien y a-t-il d'hôtels ?"
- "Comment découvrir les hôtels ?"
- "Quels sont les prix ?"
- "Comment réserver ?"

Tapez **"aide"** pour plus d'options."""


# ============================================================
# AGENT PRINCIPAL
# ============================================================
def get_ai_response(question: str, is_authenticated: bool = False,
                    user=None, conversation_history: List[Dict] = None) -> Dict:
    """
    Génère une réponse IA à une question.
    """
    
    # ✅ Vérifier Gemini
    if not GEMINI_AVAILABLE or not GEMINI_API_KEY:
        return {
            'content': fallback_response(question, is_authenticated),
            'source': 'fallback'
        }
    
    # ✅ Trouver un modèle qui fonctionne
    model_name = find_working_model()
    
    if not model_name:
        # Aucun modèle Gemini ne fonctionne → fallback
        print("⚠️ Aucun modèle Gemini disponible → fallback")
        return {
            'content': fallback_response(question, is_authenticated),
            'source': 'fallback'
        }
    
    try:
        # ✅ Enrichir le contexte
        context_data = enrich_context(question, is_authenticated)
        
        # ✅ Construire le prompt
        system_prompt = build_system_prompt(is_authenticated, user)
        
        if context_data:
            system_prompt += f"\n\n📌 DONNÉES DE LA BASE :\n{context_data}\n"
        
        # ✅ Appeler Gemini avec le modèle actif
        model = genai.GenerativeModel(
            model_name=model_name,
            system_instruction=system_prompt
        )
        
        response = model.generate_content(question)
        
        return {
            'content': response.text,
            'source': 'ai'
        }
        
    except Exception as e:
        print(f"❌ Erreur Gemini: {e}")
        import traceback
        traceback.print_exc()
        return {
            'content': fallback_response(question, is_authenticated),
            'source': 'fallback'
        }


def enrich_context(question: str, is_authenticated: bool) -> str:
    """Extrait les données pertinentes de la base selon la question"""
    q = question.lower()
    context = []
    
    try:
        # ✅ Détecter les noms d'hôtels
        hotels = Hotel.objects.filter(est_actif=True)
        for hotel in hotels:
            hotel_name_lower = hotel.nom.lower()
            if hotel_name_lower in q or any(
                word in q for word in hotel_name_lower.split() if len(word) > 3
            ):
                info = get_hotel_info(hotel.nom)
                if info:
                    chambres_str = ', '.join([
                        f"{c['numero']} ({c['type']}, {c['prix_nuit']:,.0f} Ar, {'dispo' if c['disponible'] else 'occupée'})"
                        for c in info['chambres']
                    ])
                    context.append(f"""
HÔTEL : {info['nom']}
- Ville : {info['ville']}
- Adresse : {info['adresse']}
- Chambres : {info['nombre_chambres']}
- Note : {info['note_moyenne']}/5
- Description : {(info['description'] or '')[:200]}
- Chambres : {chambres_str if chambres_str else 'Aucune'}
""")
        
        # ✅ Statistiques générales
        stats = get_platform_stats()
        context.append(f"""
STATS GLOBALES :
- {stats['total_hotels']} hôtels
- {stats['total_rooms']} chambres
- Villes : {', '.join(stats['villes']) if stats['villes'] else 'Aucune'}
- Prix : {stats['prix_min']:,.0f} Ar - {stats['prix_max']:,.0f} Ar
""")
        
    except Exception as e:
        print(f"❌ Erreur enrich_context: {e}")
        import traceback
        traceback.print_exc()
    
    return '\n'.join(context)