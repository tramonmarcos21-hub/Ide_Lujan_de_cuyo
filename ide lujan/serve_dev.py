#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Servidor HTTP local para probar el Geoportal y el Visor SIG de Luján de Cuyo
Con soporte de CORS y tipos MIME adecuados para GeoJSON.
"""
import http.server
import socketserver
import os
import sys

PORT = 8080
DIRECTORY = os.path.join(os.path.dirname(os.path.abspath(__file__)), "frontend")

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Habilitar CORS abierto conforme a IDERA
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

    def guess_type(self, path):
        if path.endswith('.geojson'):
            return 'application/geo+json'
        return super().guess_type(path)

print(f"""
================================================================================
  NODO IDE MUNICIPALIDAD DE LUJÁN DE CUYO (IDERA) - SERVIDOR DE DESARROLLO
================================================================================
  Directorio: {DIRECTORY}
  Acceso local: http://localhost:{PORT}
  Geoportal:    http://localhost:{PORT}/index.html
  Visor SIG:    http://localhost:{PORT}/visor.html

  Presiona Ctrl+C para detener el servidor.
================================================================================
""")

try:
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        httpd.serve_forever()
except KeyboardInterrupt:
    print("\nServidor detenido.")
    sys.exit(0)
