from django.db import models
from django.contrib.auth.models import AbstractUser

# Create your models here.
class CustomUser(AbstractUser):
    email=models.EmailField(unique=True)
    mobile=models.CharField(max_length=15,null=True,blank=True)
    otp = models.CharField(max_length=6, null=True, blank=True)
    totp_secret = models.CharField(max_length=32, null=True, blank=True)

    Role_Choices=(
        ('admin','Admin'),
        ('user','User'),
        ('doctor','Doctor'),
        ('employee','Employee')
    )
    role=models.CharField(max_length=10,choices=Role_Choices,default='user')

    Status_Choices=(
        ('active','Active'),
        ('inactive','Inactive'),
    )
    status=models.CharField(max_length=10,choices=Status_Choices,default='active')

    groups=models.ManyToManyField(
        'auth.Group',
        blank=True,
        help_text='the groups this user belong to.',
        verbose_name='groups'
    )

    user_permissions=models.ManyToManyField(
        'auth.Permission',
        related_name='csutomeruser_set',
        blank=True,
        help_text='specific permission for this user',
        verbose_name='user permissions'
    )

    def __str__(self):
        return self.username
    
