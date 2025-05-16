from django.contrib.auth.models import User
from rest_framework import generics, status, views, viewsets, serializers
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticatedOrReadOnly, IsAuthenticated
from .serializers import UserSerializer, LizardSerializer, RaceSerializer, BetSerializer, UserProfileSerializer, ChangePasswordSerializer, AddFundsSerializer
from .models import Lizard, Race, Bet, UserProfile
from decimal import Decimal
from django.db import transaction, IntegrityError

class UserCreateView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny] # Allow anyone to register

class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

class ChangePasswordView(generics.UpdateAPIView):
    serializer_class = ChangePasswordSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user # Ensure the user is updating their own password

    def update(self, request, *args, **kwargs):
        self.object = self.get_object()
        serializer = self.get_serializer(data=request.data, context={'request': request})

        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Password changed successfully."}, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# New View for Adding Funds
class AddFundsView(generics.GenericAPIView):
    serializer_class = AddFundsSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            amount_to_add = serializer.validated_data['amount']
            
            # Get or create the UserProfile for the current user
            user_profile, created = UserProfile.objects.get_or_create(user=request.user)
            
            # Ensure funds are treated as Decimal, especially if profile was just created
            current_funds = Decimal(user_profile.funds) if user_profile.funds is not None else Decimal('0.00')
            user_profile.funds = current_funds + amount_to_add
            user_profile.save()
            
            # Return updated profile or just success message
            # For simplicity, returning success and new balance
            return Response({
                "message": "Funds added successfully.", 
                "new_balance": user_profile.funds
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LizardViewSet(viewsets.ModelViewSet):
    queryset = Lizard.objects.all()
    serializer_class = LizardSerializer
    permission_classes = [IsAuthenticated] 


    def perform_create(self, serializer):

        serializer.save(owner=self.request.user)

class RaceViewSet(viewsets.ModelViewSet):
    queryset = Race.objects.all()
    serializer_class = RaceSerializer
    permission_classes = [IsAuthenticated] 

class BetViewSet(viewsets.ModelViewSet):
    serializer_class = BetSerializer
    permission_classes = [IsAuthenticated] 


    def get_queryset(self):
        """
        This view should return a list of all the bets
        for the currently authenticated user.
        """
        user = self.request.user
        if user.is_authenticated:
            return Bet.objects.filter(user=user).order_by('-placed_at')
        return Bet.objects.none() 

    def perform_create(self, serializer):
        user = self.request.user
        # Ensure amount is validated by the serializer first. Access it from validated_data.
        # The serializer should raise a ValidationError if 'amount' is missing or invalid.
        amount_to_bet = serializer.validated_data.get('amount') 

        if amount_to_bet is None: # Should be caught by serializer, but as a safeguard.
            raise serializers.ValidationError({"amount": "Amount is required and must be valid."})

        try:
            with transaction.atomic():
                # Lock the user profile row for update to prevent race conditions on funds
                try:
                    user_profile = UserProfile.objects.select_for_update().get(user=user)
                except UserProfile.DoesNotExist:
                    raise serializers.ValidationError({"detail": "User profile not found. Cannot place bet."})

                if user_profile.funds < amount_to_bet:
                    raise serializers.ValidationError({
                        "detail": f"Insufficient funds. Your current balance is {user_profile.funds}€."
                    })

                # Deduct funds
                user_profile.funds -= amount_to_bet
                user_profile.save()

                # Save the bet with the current user
                # This is where the IntegrityError for duplicate bet will be caught if it occurs
                serializer.save(user=user)
        
        except IntegrityError: # Catches the UNIQUE constraint failed error
            # The transaction.atomic() block will automatically roll back the fund deduction.
            raise serializers.ValidationError({"detail": "You have already placed this bet for this lizard on this race."})
        # Other exceptions (like UserProfile.DoesNotExist if not caught inside, or other unexpected ones)
        # will be handled by DRF's default exception handler, typically resulting in a 500, 
        # or be re-raised if they are already APIExceptions (like the ValidationError for funds). 