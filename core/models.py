from django.db import models

class Usuario(models.Model):
    ROL_CHOICES = (
        ('usuario', 'Usuario'),
        ('creador', 'Creador'),
    )

    nombre = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=128)
    edad = models.IntegerField()
    genero = models.CharField(max_length=50)

    rol = models.CharField(max_length=10, choices=ROL_CHOICES)
    fecha_registro = models.DateField(auto_now_add=True)

    def __str__(self):
        return f"{self.nombre} ({self.rol})"


class Contenido(models.Model):
    titulo = models.CharField(max_length=200)
    tipo = models.CharField(max_length=50)
    genero = models.CharField(max_length=100)
    anio = models.IntegerField()
    duracion_min = models.IntegerField()

    creador = models.ForeignKey(Usuario, on_delete=models.CASCADE)

    def __str__(self):
        return self.titulo


class Visualizacion(models.Model):
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE)
    contenido = models.ForeignKey(Contenido, on_delete=models.CASCADE)
    fecha_visualizacion = models.DateField(auto_now_add=True)

    def __str__(self):
        return f"{self.usuario} vio {self.contenido}"