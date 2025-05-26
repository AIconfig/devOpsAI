from django.db import models

# Create your models here.

class Task(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.title

class ConfigSnippet(models.Model):
    CATEGORY_CHOICES = [
        ('docker', 'Docker'),
        ('kubernetes', 'Kubernetes'),
        ('nginx', 'Nginx'),
        ('apache', 'Apache'),
        ('database', 'Databases'),
        ('security', 'Security'),
        ('network', 'Networking'),
        ('cicd', 'CI/CD'),
        ('terraform', 'Terraform'),
        ('ansible', 'Ansible'),
        ('other', 'Other'),
    ]
    
    title = models.CharField(max_length=200)
    description = models.TextField()
    config_type = models.CharField(max_length=50)
    content = models.TextField()
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='other')
    language = models.CharField(max_length=50, default='english')
    parameters = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.title
