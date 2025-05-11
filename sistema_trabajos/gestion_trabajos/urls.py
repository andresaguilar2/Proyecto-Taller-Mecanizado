from django.urls import path
from django.contrib.auth import views as auth_views
from . import views

urlpatterns = [
    # Autenticación
    path('', auth_views.LoginView.as_view(template_name='gestion_trabajos/login.html'), name='login'),
    path('logout/', auth_views.LogoutView.as_view(next_page='login'), name='logout'),
    path('registro/', views.registro_usuario, name='registro'),
    
    # Dashboard
    path('dashboard/', views.dashboard, name='dashboard'),
    
    # Clientes
    path('clientes/', views.lista_clientes, name='lista_clientes'),
    path('clientes/nuevo/', views.registrar_cliente, name='registrar_cliente'),
    path('clientes/<int:cliente_id>/', views.detalle_cliente, name='detalle_cliente'),
    
    # Trabajos
    path('trabajos/nuevo/', views.nuevo_trabajo, name='nuevo_trabajo'),
    path('trabajos/<int:trabajo_id>/', views.detalle_trabajo, name='detalle_trabajo'),
    path('trabajos/<int:trabajo_id>/editar/', views.editar_trabajo, name='editar_trabajo'),
    
    # Pagos
    path('trabajos/<int:trabajo_id>/pago/', views.registrar_pago, name='registrar_pago'),
]
