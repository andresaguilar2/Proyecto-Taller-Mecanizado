from django.db import models
from django.contrib.auth.models import User
import datetime

class Cliente(models.Model):
    nombre = models.CharField(max_length=100)
    celular = models.CharField(max_length=20)
    fecha_registro = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.nombre

class Trabajo(models.Model):
    ESTADO_CHOICES = [
        ('Pendiente', 'Pendiente'),
        ('En Proceso', 'En Proceso'),
        ('Terminado', 'Terminado'),
        ('Entregado', 'Entregado'),
    ]
    
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, related_name='trabajos')
    descripcion = models.TextField(blank=True, null=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    valor_total = models.DecimalField(max_digits=10, decimal_places=2)
    saldo = models.DecimalField(max_digits=10, decimal_places=2)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='Pendiente')
    factura_electronica = models.CharField(max_length=50, blank=True, null=True)
    requiere_factura = models.BooleanField(default=False)
    usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name='trabajos')
    
    def __str__(self):
        return f"Trabajo #{self.id} - {self.cliente.nombre}"
    
    def actualizar_saldo(self):
        total_pagos = sum(pago.monto for pago in self.pagos.all())
        self.saldo = self.valor_total - total_pagos
        self.save()

class Pago(models.Model):
    trabajo = models.ForeignKey(Trabajo, on_delete=models.CASCADE, related_name='pagos')
    monto = models.DecimalField(max_digits=10, decimal_places=2)
    fecha = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Pago de ${self.monto} para Trabajo #{self.trabajo.id}"
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.trabajo.actualizar_saldo()
