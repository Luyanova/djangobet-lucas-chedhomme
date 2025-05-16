from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Lizard, Race, Bet

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
            email=validated_data.get('email', ''),
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        return user

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'password')
        extra_kwargs = {'password': {'write_only': True}}



class UserProfileSerializer(serializers.ModelSerializer):
    funds = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True, source='profile.funds')

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'funds')
        read_only_fields = ('id', 'username')

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True, write_only=True)
    new_password1 = serializers.CharField(required=True, write_only=True)
    new_password2 = serializers.CharField(required=True, write_only=True)

    def validate(self, data):
        if data['new_password1'] != data['new_password2']:
            raise serializers.ValidationError({"new_password2": "New passwords must match."})
        return data

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is not correct.")
        return value

    def save(self, **kwargs):
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password1'])
        user.save()
        # Update the request user instance after password change,
        # so that request.user.check_password() works correctly within the same request if called again.
        # This is important if e.g. you log the user out or re-authenticate them after password change.
        from django.contrib.auth import update_session_auth_hash
        update_session_auth_hash(self.context['request'], user) # Important for session-based auth
        return user

# Serializers for Lizard, Race, and Bet

class LizardSerializer(serializers.ModelSerializer):

    class Meta:
        model = Lizard
        fields = '__all__'


class RaceSerializer(serializers.ModelSerializer):
    participants = LizardSerializer(many=True, read_only=True)
    winner = LizardSerializer(read_only=True, allow_null=True)

    class Meta:
        model = Race
        fields = '__all__' 



class MinimalLizardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lizard
        fields = ('id', 'name')

class MinimalRaceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Race
        fields = ('id', 'name')

class BetSerializer(serializers.ModelSerializer):
    user_username = serializers.ReadOnlyField(source='user.username')
    race_details = MinimalRaceSerializer(source='race', read_only=True)
    lizard_details = MinimalLizardSerializer(source='lizard', read_only=True)

    class Meta:
        model = Bet
        fields = (
            'id',
            'user_username',
            'race',         
            'lizard',       
            'amount',
            'placed_at',
            'race_details', 
            'lizard_details'
        )
        read_only_fields = ('placed_at', 'user_username', 'race_details', 'lizard_details')
       

# Serializer for adding funds
class AddFundsSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=0.01)

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("The amount must be positive.")
        return value
       