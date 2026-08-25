from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Profile


class ProfileInline(admin.StackedInline):
    model = Profile
    can_delete = False
    verbose_name_plural = 'Perfil'


class UserAdmin(BaseUserAdmin):
    readonly_fields = ('last_login', 'date_joined')
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Información Personal', {'fields': ('first_name', 'last_name', 'is_verified')}),
        ('Permisos', {'fields': ('is_active', 'is_staff', 'is_superuser')}),
        ('Fechas', {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'first_name', 'last_name', 'password1', 'password2'),
        }),
    )
    inlines = [ProfileInline]

    def get_inline_instances(self, request, obj=None):
        # Al crear un usuario, el User todavía no existe: el inline no
        # tendría un Profile que editar y terminaría intentando CREAR uno,
        # chocando con el que ya genera la señal post_save al guardar el
        # User (UNIQUE constraint en accounts_profile.user_id). Al editar
        # sí se muestra: para entonces el Profile ya existe.
        if obj is None:
            return []
        return super().get_inline_instances(request, obj)
    list_display = ('email', 'first_name', 'last_name', 'is_verified', 'is_staff', 'date_joined')
    list_filter = ('is_verified', 'is_staff', 'is_active')
    search_fields = ('email', 'first_name', 'last_name')
    ordering = ('-date_joined',)


admin.site.register(User, UserAdmin)
