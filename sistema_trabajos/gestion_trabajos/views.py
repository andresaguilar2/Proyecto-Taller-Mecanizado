from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib.auth import login
from django.contrib import messages
from django.db.models import Sum
from .models import Trabajo, Pago, Cliente
from .forms import RegistroUsuarioForm, TrabajoForm, PagoForm, ClienteForm

def registro_usuario(request):
    if request.method == 'POST':
        form = RegistroUsuarioForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            messages.success(request, "Usuario registrado correctamente")
            return redirect('dashboard')
    else:
        form = RegistroUsuarioForm()
    return render(request, 'gestion_trabajos/registro.html', {'form': form})

@login_required
def dashboard(request):
    trabajos = Trabajo.objects.filter(usuario=request.user).order_by('-fecha_creacion')
    return render(request, 'gestion_trabajos/dashboard.html', {'trabajos': trabajos})

@login_required
def registrar_cliente(request):
    if request.method == 'POST':
        form = ClienteForm(request.POST)
        if form.is_valid():
            cliente = form.save()
            messages.success(request, "Cliente registrado correctamente")
            return redirect('lista_clientes')
    else:
        form = ClienteForm()
    return render(request, 'gestion_trabajos/registrar_cliente.html', {'form': form})

@login_required
def lista_clientes(request):
    clientes = Cliente.objects.all().order_by('nombre')
    return render(request, 'gestion_trabajos/lista_clientes.html', {'clientes': clientes})

@login_required
def detalle_cliente(request, cliente_id):
    cliente = get_object_or_404(Cliente, id=cliente_id)
    trabajos = Trabajo.objects.filter(cliente=cliente, usuario=request.user)
    return render(request, 'gestion_trabajos/detalle_cliente.html', {
        'cliente': cliente,
        'trabajos': trabajos
    })

@login_required
def nuevo_trabajo(request):
    if request.method == 'POST':
        form = TrabajoForm(request.POST)
        if form.is_valid():
            trabajo = form.save(commit=False)
            trabajo.usuario = request.user
            trabajo.saldo = trabajo.valor_total
            trabajo.save()
            messages.success(request, "Trabajo registrado correctamente")
            return redirect('dashboard')
    else:
        form = TrabajoForm()
    return render(request, 'gestion_trabajos/form_trabajo.html', {
        'form': form,
        'titulo': 'Nuevo Trabajo'
    })

@login_required
def editar_trabajo(request, trabajo_id):
    trabajo = get_object_or_404(Trabajo, id=trabajo_id, usuario=request.user)
    
    if request.method == 'POST':
        form = TrabajoForm(request.POST, instance=trabajo)
        if form.is_valid():
            # Guardar el valor total anterior para recalcular el saldo
            valor_total_anterior = trabajo.valor_total
            
            trabajo = form.save(commit=False)
            
            # Recalcular saldo si el valor total cambió
            if trabajo.valor_total != valor_total_anterior:
                total_pagos = trabajo.pagos.aggregate(Sum('monto'))['monto__sum'] or 0
                trabajo.saldo = trabajo.valor_total - total_pagos
            
            trabajo.save()
            messages.success(request, "Trabajo actualizado correctamente")
            return redirect('detalle_trabajo', trabajo_id=trabajo.id)
    else:
        form = TrabajoForm(instance=trabajo)
    
    return render(request, 'gestion_trabajos/form_trabajo.html', {
        'form': form,
        'titulo': f'Editar Trabajo #{trabajo.id}',
        'trabajo': trabajo
    })

@login_required
def detalle_trabajo(request, trabajo_id):
    trabajo = get_object_or_404(Trabajo, id=trabajo_id, usuario=request.user)
    pagos = trabajo.pagos.all().order_by('-fecha')
    
    return render(request, 'gestion_trabajos/detalle_trabajo.html', {
        'trabajo': trabajo,
        'pagos': pagos
    })

@login_required
def registrar_pago(request, trabajo_id):
    trabajo = get_object_or_404(Trabajo, id=trabajo_id, usuario=request.user)
    
    if trabajo.saldo <= 0:
        messages.info(request, "Este trabajo ya está pagado completamente")
        return redirect('detalle_trabajo', trabajo_id=trabajo.id)
    
    if request.method == 'POST':
        form = PagoForm(trabajo, request.POST)
        if form.is_valid():
            pago = form.save(commit=False)
            pago.trabajo = trabajo
            pago.save()
            
            # El saldo se actualiza automáticamente en el método save() de Pago
            
            messages.success(request, f"Pago de ${pago.monto} registrado correctamente")
            return redirect('detalle_trabajo', trabajo_id=trabajo.id)
    else:
        form = PagoForm(trabajo)
    
    return render(request, 'gestion_trabajos/registrar_pago.html', {
        'form': form,
        'trabajo': trabajo
    })
