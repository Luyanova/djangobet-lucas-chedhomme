from django.db import models
from django.contrib.auth.models import User 
from django.db.models.signals import post_save
from django.dispatch import receiver

class Lizard(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='lizards')
    name = models.CharField(max_length=100)
    species = models.CharField(max_length=100, blank=True, null=True)
    age = models.PositiveIntegerField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.owner.username})"

class Race(models.Model):
    STATUS_CHOICES = [
        ('upcoming', 'Upcoming'),
        ('ongoing', 'Ongoing'),
        ('finished', 'Finished'),
        ('cancelled', 'Cancelled'),
    ]

    name = models.CharField(max_length=200)
    scheduled_at = models.DateTimeField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='upcoming')
    participants = models.ManyToManyField(Lizard, related_name='races', blank=True)
    winner = models.ForeignKey(Lizard, on_delete=models.SET_NULL, null=True, blank=True, related_name='won_races')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} at {self.scheduled_at.strftime('%Y-%m-%d %H:%M')}"

class Bet(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bets')
    race = models.ForeignKey(Race, on_delete=models.CASCADE, related_name='bets')
    lizard = models.ForeignKey(Lizard, on_delete=models.CASCADE, related_name='bets_on')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    placed_at = models.DateTimeField(auto_now_add=True)
    # Potential future field: is_payout_processed = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.username} bets {self.amount} on {self.lizard.name} for race {self.race.name}"

    class Meta:
        unique_together = [('user', 'race', 'lizard')] # Prevent a user from betting multiple times on the same lizard for the same race

# New UserProfile model
class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    funds = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s Profile (Funds: {self.funds})"

# Signal to create or update UserProfile whenever a User instance is saved
@receiver(post_save, sender=User)
def create_or_update_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)
    # instance.profile.save() # Use this if you want to update on every User save, not just creation
    # For now, we only care about creation. If there are profile fields editable by user directly on UserProfile model,
    # they would be saved through a UserProfileSerializer.
    # If we want to update UserProfile whenever User is updated (e.g. email change propagating), 
    # then the save() call would be needed, but ensure it doesn't cause recursion if UserProfile save also touches User.
    # For adding funds, we'll have a separate mechanism.
