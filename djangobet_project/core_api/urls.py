from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserCreateView, LizardViewSet, RaceViewSet, BetViewSet, UserProfileView, ChangePasswordView, AddFundsView

router = DefaultRouter()
router.register(r'lizards', LizardViewSet, basename='lizard')
router.register(r'races', RaceViewSet, basename='race')
router.register(r'bets', BetViewSet, basename='bet')


urlpatterns = [
    path('register/', UserCreateView.as_view(), name='user-register'),
    path('profile/', UserProfileView.as_view(), name='user-profile'),
    path('profile/change-password/', ChangePasswordView.as_view(), name='user-change-password'),
    path('profile/add-funds/', AddFundsView.as_view(), name='add-funds'),
    path('', include(router.urls)),
] 