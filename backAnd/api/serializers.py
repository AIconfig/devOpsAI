from rest_framework import serializers
from .models import Task, ConfigSnippet

class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = '__all__'

class ConfigSnippetSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConfigSnippet
        fields = '__all__' 