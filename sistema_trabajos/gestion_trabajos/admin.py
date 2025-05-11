from django.contrib import admin
from .models import Cliente, Trabajo, Pago

@admin.register(Cliente)
class ClienteAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'celular', 'fecha_registro')
    search_fields = ('nombre', 'celular')

class PagoInline(admin.TabularInline):
    model = Pago
    extra = 0

@admin.register(Trabajo)
class TrabajoAdmin(admin.ModelAdmin):
    list_display = ('id', 'cliente', 'fecha_creacion', 'valor_total', 'saldo', 'estado')
    list_filter = ('estado', 'requiere_factura')
    search_fields = ('cliente__nombre', 'descripcion')
    inlines = [PagoInline]

@admin.register(Pago)
class PagoAdmin(admin.ModelAdmin):
    list_display = ('id', 'trabajo', 'monto', 'fecha')
    list_filter = ('fecha',)
    search_fields = ('trabajo__cliente__nombre',)
