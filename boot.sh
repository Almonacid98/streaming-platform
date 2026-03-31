#!/bin/bash

echo "Activando entorno virtual..."
. streaming_env/bin/activate

#echo "Aplicando migraciones..."
#python manage.py migrate

#echo "Levantando servidor Django..."
#python manage.py runserver