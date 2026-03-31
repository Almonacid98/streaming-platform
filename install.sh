#!/bin/bash
echo "Creando entorno virtual..."
python3 -m venv streaming_env

echo "Activando entorno virtual..."
. streaming_env/bin/activate

echo "Instalando dependencias..."
pip install --upgrade pip
pip install -r requirements.txt

echo "Instalación completada"