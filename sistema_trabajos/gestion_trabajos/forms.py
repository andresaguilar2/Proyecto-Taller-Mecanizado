from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User
from .models import Trabajo, Pago, Cliente

class RegistroUsuarioForm(UserCreationForm):
    nombre_completo = forms.CharField(max_length=100, required=True)
    
    class Meta:
        model = User
        fields = ['username', 'nombre_completo', 'password1', 'password2']
    
    def save(self, commit=True):
        user = super().save(commit=False)
        user.first_name = self.cleaned_data['nombre_completo']
        if commit:
            user.save()
        return user

class ClienteForm(forms.ModelForm):
    class Meta:
        model = Cliente
        fields = ['nombre', 'celular']
        widgets = {
            'nombre': forms.TextInput(attrs={'class': 'form-control'}),
            'celular': forms.TextInput(attrs={'class': 'form-control'}),
        }

class TrabajoForm(forms.ModelForm):
    cliente = forms.ModelChoiceField(
        queryset=Cliente.objects.all(),
        widget=forms.Select(attrs={'class': 'form-control'})
    )
    
    class Meta:
        model = Trabajo
        fields = ['cliente', 'descripcion', 'valor_total', 'estado', 'requiere_factura', 'factura_electronica']
        widgets = {
            'descripcion': forms.Textarea(attrs={'class': 'form-control', 'rows': 4}),
            'valor_total': forms.NumberInput(attrs={'class': 'form-control'}),
            'estado': forms.Select(attrs={'class': 'form-control'}),
            'requiere_factura': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
            'factura_electronica': forms.TextInput(attrs={'class': 'form-control'}),
        }

class PagoForm(forms.ModelForm):
    class Meta:
        model = Pago
        fields = ['monto']
        widgets = {
            'monto': forms.NumberInput(attrs={'class': 'form-control'}),
        }
    
    def __init__(self, trabajo=None, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.trabajo = trabajo
        if trabajo:
            self.fields['monto'].widget.attrs.update({
                'max': trabajo.saldo,
                'min': 0.01,
            })
    
    def clean_monto(self):
        monto = self.cleaned_data['monto']
        if self.trabajo and monto > self.trabajo.saldo:
            raise forms.ValidationError(f"El monto no puede ser mayor al saldo pendiente (${self.trabajo.saldo})")
        if monto <= 0:
            raise forms.ValidationError("El monto debe ser mayor que cero")
        return monto
