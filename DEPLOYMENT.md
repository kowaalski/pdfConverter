# Guías de Despliegue Detalladas

Esta API puede desplegarse en múltiples plataformas. A continuación, guías detalladas para cada una.

## 📋 Índice

- [EasyPanel (VPS)](#easypanel-vps)
- [Docker Compose (VPS manual)](#docker-compose-vps-manual)
- [Railway](#railway)
- [DigitalOcean App Platform](#digitalocean-app-platform)
- [Render](#render)

---

## 🎯 EasyPanel (VPS)

**Ideal para**: Control total sobre tu infraestructura, costos predecibles.

### Requisitos
- VPS con Docker instalado
- EasyPanel instalado en el VPS
- Dominio (opcional, pero recomendado)

### Paso a Paso

#### 1. Preparar el Código

```bash
# Asegúrate de que el código esté en un repositorio Git
git add .
git commit -m "feat: PDF converter API ready for deployment"
git push origin main
```

#### 2. Configurar en EasyPanel

1. **Accede a tu panel de EasyPanel** (ej: `https://panel.tudominio.com`)

2. **Crear nuevo proyecto/servicio**:
   - Click en "+ Create" o "New Service"
   - Tipo: App
   - Source: **Git Service** o **GitHub Service**

3. **Configuración del repositorio**:
   - **Repository**: URL de tu repositorio
   - **Branch**: `main`
   - **Build Type**: `Dockerfile`
   - **Dockerfile Path**: `./Dockerfile` (o dejar en blanco si está en la raíz)

4. **Variables de entorno** (Environment Variables):
   ```
   ALLOWED_ORIGINS=https://fundocs.vercel.app,https://otro-dominio.com
   PORT=3000
   NODE_ENV=production
   ```

5. **Configuración de red**:
   - **Port Mapping**: 
     - Container Port: `3000`
     - Host Port: `3000` (o el que prefieras)
   - **Domain**: 
     - Configurar subdomain: `pdf-api.tudominio.com`
     - O usar la IP del VPS: `http://tu-ip-vps:3000`

6. **Deploy**:
   - Click en "Deploy" o "Save and Deploy"
   - EasyPanel clonará el repo, construirá la imagen y ejecutará el contenedor
   - Tiempo estimado: 5-10 minutos (primera vez)

#### 3. Configurar HTTPS (Recomendado)

EasyPanel generalmente maneja SSL automáticamente si configuraste un dominio:
- Asegúrate de que tu dominio apunte a la IP del VPS
- EasyPanel usará Let's Encrypt para generar certificados SSL

#### 4. Verificar

```bash
# Health check
curl https://pdf-api.tudominio.com/health

# Test conversión
curl -X POST \
  -F "file=@test.docx" \
  https://pdf-api.tudominio.com/convert \
  --output result.pdf
```

#### 5. Actualizar la Aplicación

Para futuras actualizaciones:
1. Push los cambios a Git
2. En EasyPanel, click en "Redeploy" o configurar auto-deploy en push

---

## 🐳 Docker Compose (VPS manual)

**Ideal para**: Máximo control, servidor dedicado.

### Requisitos
- VPS con acceso SSH
- Docker y Docker Compose instalados
- (Opcional) Nginx para reverse proxy

### Paso a Paso

#### 1. Conectar al VPS

```bash
ssh tu-usuario@tu-vps-ip
```

#### 2. Instalar Docker (si no está instalado)

```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verificar
docker --version
docker-compose --version
```

#### 3. Clonar el Repositorio

```bash
cd /opt
sudo git clone <tu-repositorio-url> pdf-converter
cd pdf-converter
```

#### 4. Configurar Variables de Entorno

```bash
cp .env.example .env
nano .env
```

Editar:
```
PORT=3000
ALLOWED_ORIGINS=https://fundocs.vercel.app,https://tudominio.com
```

#### 5. Levantar el Servicio

```bash
# Construir y levantar
sudo docker-compose up -d

# Ver logs
sudo docker-compose logs -f

# Verificar estado
sudo docker-compose ps
```

#### 6. Configurar Nginx como Reverse Proxy (Recomendado)

```bash
# Instalar Nginx
sudo apt update
sudo apt install nginx

# Crear configuración
sudo nano /etc/nginx/sites-available/pdf-converter
```

Contenido:
```nginx
server {
    listen 80;
    server_name pdf-api.tudominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        client_max_body_size 10M;
        proxy_read_timeout 60s;
    }
}
```

Activar y recargar:
```bash
sudo ln -s /etc/nginx/sites-available/pdf-converter /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 7. Configurar HTTPS con Let's Encrypt

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obtener certificado
sudo certbot --nginx -d pdf-api.tudominio.com

# Renovación automática (ya configurada por defecto)
sudo certbot renew --dry-run
```

#### 8. Configurar Auto-inicio

```bash
# Crear servicio systemd
sudo nano /etc/systemd/system/pdf-converter.service
```

Contenido:
```ini
[Unit]
Description=PDF Converter API
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/pdf-converter
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

Activar:
```bash
sudo systemctl daemon-reload
sudo systemctl enable pdf-converter
sudo systemctl start pdf-converter
```

---

## 🚂 Railway

**Ideal para**: Despliegue rápido, escalado automático, sin gestión de servidores.

### Paso a Paso

1. **Push a GitHub**:
   ```bash
   git push origin main
   ```

2. **Desplegar en Railway**:
   - Ve a [railway.app](https://railway.app)
   - "New Project" → "Deploy from GitHub"
   - Selecciona el repositorio

3. **Variables de entorno**:
   ```
   ALLOWED_ORIGINS=https://fundocs.vercel.app
   ```

4. **URL proporcionada**: `https://xxx.up.railway.app`

### Ventajas
- ✅ SSL automático
- ✅ Deploy automático en push
- ✅ Logs integrados
- ✅ Escalado automático

---

## 🌊 DigitalOcean App Platform

**Ideal para**: Balance entre control y facilidad.

### Paso a Paso

1. **Crear App**:
   - App Platform → Create App
   - Conectar repositorio GitHub

2. **Configuración**:
   - Type: Docker
   - Dockerfile path: `Dockerfile`
   - Port: `3000`

3. **Variables de entorno**:
   ```
   ALLOWED_ORIGINS=https://fundocs.vercel.app
   ```

4. **Deploy**: DigitalOcean construye y despliega automáticamente

---

## 📦 Render

**Ideal para**: Alternativa gratuita a Railway.

### Paso a Paso

1. **New Web Service**:
   - Dashboard → New → Web Service
   - Conectar repositorio

2. **Configuración**:
   - Environment: Docker
   - Instance Type: Free o Starter

3. **Variables de entorno**:
   ```
   ALLOWED_ORIGINS=https://fundocs.vercel.app
   PORT=3000
   ```

4. **Deploy**: Render construye y despliega

---

## 🔄 Actualización de la API

### EasyPanel / VPS
```bash
cd /opt/pdf-converter
sudo git pull
sudo docker-compose down
sudo docker-compose up -d --build
```

### Railway / Render / DigitalOcean
- Push a GitHub → Deploy automático

---

## 🐛 Troubleshooting

### Error: "Cannot connect to API"
- Verificar que el contenedor está corriendo: `docker ps`
- Revisar logs: `docker logs fundocs-pdf-converter`
- Verificar firewall: `sudo ufw status`

### Error: "CORS policy"
- Verificar variable `ALLOWED_ORIGINS`
- Añadir todas las URLs necesarias separadas por comas

### API lenta
- Primera conversión siempre es más lenta (LibreOffice init)
- Considerar más RAM/CPU en el VPS
- Verificar logs para ver tiempos

---

## 📊 Comparativa de Plataformas

| Plataforma | Precio | Control | Facilidad | SSL | Auto-deploy |
|------------|--------|---------|-----------|-----|-------------|
| EasyPanel  | 💰 VPS | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ✅ | ✅ |
| Docker VPS | 💰 VPS | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⚙️ Manual | ⚙️ Manual |
| Railway    | 💰💰 Pay-as-go | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ | ✅ |
| Render     | 💰 Free tier | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ | ✅ |
| DO App     | 💰💰 Fijo | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ✅ | ✅ |

**Recomendación**: 
- **Control + Precio**: EasyPanel en VPS
- **Facilidad**: Railway o Render
- **Balance**: DigitalOcean App Platform
