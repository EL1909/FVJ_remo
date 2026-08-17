from rest_framework import serializers
from .models import User, Profile


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['phone', 'profile_picture']


class UserProfileSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer()

    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'is_staff', 'is_superuser', 'is_verified', 'date_joined', 'profile']
        read_only_fields = ['id', 'email', 'is_staff', 'is_superuser', 'is_verified', 'date_joined']

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', {})

        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.save()

        profile, _ = Profile.objects.get_or_create(user=instance)
        for attr, value in profile_data.items():
            setattr(profile, attr, value)
        profile.save()

        return instance
