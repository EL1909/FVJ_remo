from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.forms import SetPasswordForm
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.views.generic import RedirectView
from django.conf import settings
from django.contrib.auth import get_user_model
from evz_core.mail_relay import send_relay_email
from .serializers import UserProfileSerializer

User = get_user_model()


class LoginView(APIView):
    """
    Login del panel interno (equipo de FVJ). Sin auto-registro: las cuentas
    las crea un admin desde Django admin.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = (request.data.get('email') or '').strip()
        password = request.data.get('password', '')

        if not email or not password:
            raise AuthenticationFailed('Credenciales requeridas.')

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            user = None

        if user is None or not user.check_password(password):
            raise AuthenticationFailed('Credenciales incorrectas.')

        if not user.is_active:
            raise AuthenticationFailed('Cuenta inactiva.')

        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        })


class ProfileView(generics.RetrieveUpdateAPIView):
    """
    Perfil del usuario autenticado.
    """
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_object(self):
        return self.request.user


class PasswordResetRequestView(APIView):
    """
    POST { email } → envía email con link de recuperación, a través del
    relay de EsfuerzoVZ (evz_core.mail_relay) — este deploy no maneja sus
    propias credenciales SMTP.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = (request.data.get('email') or '').strip()
        if not email:
            return Response({'error': 'Email requerido.'}, status=400)

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return Response({'detail': 'Si el email está registrado recibirás un mensaje.'})

        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        reset_url = f"{settings.FRONTEND_URL}/reset-password?uid={uid}&token={token}"

        nombre = user.first_name or user.email
        send_relay_email(
            to=email,
            subject='Recuperación de contraseña',
            headline='Recuperación de contraseña',
            body_text=(
                f"Hola {nombre},\n\n"
                "Se solicitó restablecer la contraseña de tu cuenta. "
                "Si no fuiste vos, podés ignorar este mensaje.\n\n"
                "El enlace para establecer una nueva contraseña expira en 15 minutos."
            ),
            button_text='Restablecer contraseña',
            button_url=reset_url,
            email_type='password_reset',
        )

        return Response({'detail': 'Si el email está registrado recibirás un mensaje.'})


class PasswordResetConfirmView(APIView):
    """POST { uid, token, new_password1, new_password2 } → cambia la contraseña."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        uid = request.data.get('uid', '')
        token = request.data.get('token', '')
        new_password1 = request.data.get('new_password1', '')
        new_password2 = request.data.get('new_password2', '')

        try:
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_id)
        except (TypeError, ValueError, User.DoesNotExist):
            return Response({'error': 'Enlace inválido.'}, status=400)

        if not default_token_generator.check_token(user, token):
            return Response({'error': 'El enlace ha expirado.'}, status=400)

        form = SetPasswordForm(user, {'new_password1': new_password1, 'new_password2': new_password2})
        if not form.is_valid():
            errors = [e for errors in form.errors.values() for e in errors]
            return Response({'error': ' '.join(errors)}, status=400)

        form.save()
        return Response({'detail': 'Contraseña actualizada correctamente.'})


class PasswordResetRedirectView(RedirectView):
    """GET desde el email → redirige al frontend con uid y token."""
    def get_redirect_url(self, *args, **kwargs):
        uid = kwargs.get('uidb64')
        token = kwargs.get('token')
        return f"{settings.FRONTEND_URL}/reset-password?uid={uid}&token={token}"
