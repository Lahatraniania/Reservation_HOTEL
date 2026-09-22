from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from . import views
from . import stripe_views
from .jwt_views import CustomTokenObtainPairView

# ========== ROUTER ==========
router = DefaultRouter()
router.register(r'hotels', views.HotelViewSet, basename='hotel')
router.register(r'chambres', views.RoomViewSet, basename='chambre')
router.register(r'clients', views.ClientViewSet, basename='client')
router.register(r'reservations', views.ReservationViewSet, basename='reservation')
router.register(r'notifications', views.NotificationViewSet, basename='notification')
router.register(r'demandes-placement', views.DemandePlacementViewSet, basename='demande-placement')
router.register(r'commissions', views.CommissionAdminViewSet, basename='commission')
router.register(r'chat', views.ChatViewSet, basename='chat')
# ========== URLS ==========
urlpatterns = [
    path('', include(router.urls)),
    
    # Auth
    path('auth/register/', views.RegisterView.as_view(), name='register'),
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Stripe
    path('create-checkout-session/', stripe_views.create_checkout_session, name='create_checkout_session'),
    path('stripe-webhook/', stripe_views.stripe_webhook, name='stripe_webhook'),
    path('verify-payment/<str:session_id>/', stripe_views.verify_payment, name='verify_payment'),
    path('stripe-config/', stripe_views.get_stripe_config, name='stripe_config'),
]