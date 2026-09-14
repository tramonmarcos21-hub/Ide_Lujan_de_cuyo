#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de aprovisionamiento automatizado para GeoServer mediante REST API
Configura el Workspace 'ide_lujan', conecta con PostGIS y publica las capas según IDERA.
"""
import os
import sys
import json
import urllib.request
import urllib.error
import base64

GS_URL = os.getenv("GEOSERVER_URL", "http://localhost:8082/geoserver/rest")
GS_USER = os.getenv("GEOSERVER_USER", "admin")
GS_PASS = os.getenv("GEOSERVER_PASSWORD", "LujanGeoServer2026!")
WORKSPACE = "ide_lujan"
NAMESPACE_URI = "https://ide.lujandecuyo.gob.ar/geoserver/ide_lujan"

auth_header = "Basic " + base64.b64encode(f"{GS_USER}:{GS_PASS}".encode()).decode()

def req(endpoint, method="GET", data=None, content_type="application/json"):
    url = f"{GS_URL}/{endpoint}"
    headers = {"Authorization": auth_header, "Accept": "application/json"}
    if data is not None:
        headers["Content-Type"] = content_type
        if isinstance(data, dict):
            body = json.dumps(data).encode("utf-8")
        elif isinstance(data, str):
            body = data.encode("utf-8")
        else:
            body = data
    else:
        body = None
    
    r = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r) as response:
            return response.status, response.read().decode("utf-8", errors="ignore")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", errors="ignore")
    except Exception as e:
        return 0, str(e)

def main():
    print("Iniciando aprovisionamiento de GeoServer para Nodo IDE Luján de Cuyo...")
    
    # 1. Crear Workspace
    status, res = req("workspaces", "POST", {
        "workspace": {
            "name": WORKSPACE,
            "isolated": False
        }
    })
    print(f"Workspace '{WORKSPACE}': status {status}")

    # 2. Configurar Namespace
    req(f"namespaces/{WORKSPACE}", "PUT", {
        "namespace": {
            "prefix": WORKSPACE,
            "uri": NAMESPACE_URI
        }
    })

    # 3. Crear DataStore PostGIS
    datastore_payload = {
        "dataStore": {
            "name": "postgis_lujan",
            "connectionParameters": {
                "host": os.getenv("POSTGRES_HOST", "postgis"),
                "port": "5432",
                "database": "ide_lujan_db",
                "user": "ide_admin",
                "passwd": "LujanIDE2026_Secure",
                "dbtype": "postgis",
                "schema": "public",
                "Expose primary keys": "true",
                "validate connections": "true"
            }
        }
    }
    status, res = req(f"workspaces/{WORKSPACE}/datastores", "POST", datastore_payload)
    print(f"DataStore 'postgis_lujan': status {status}")

    print("GeoServer aprovisionado satisfactoriamente.")

if __name__ == "__main__":
    main()
