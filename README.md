# funDocs PDF Converter API

API independiente para convertir archivos DOCX a PDF utilizando LibreOffice. Esta API está diseñada para ser desplegada en Railway u otro proveedor incluso en docker sin ningun cloud provider y funciona en conjunto con la aplicación principal funDocs.

## 🚀 Características

- ✅ Conversión DOCX → PDF de alta calidad usando LibreOffice
- ✅ Preservación completa del formato original
- ✅ Sustitución correcta de variables antes de la conversión
- ✅ API RESTful simple y fácil de integrar
- ✅ Manejo de errores robusto
- ✅ CORS configurado para seguridad

## 📋 Requisitos

- Node.js 18 o superior
- LibreOffice (instalado automáticamente en Docker)

## 🛠️ Instalación Local

```bash
# Clonar el repositorio
git clone <repository-url>
cd pdfConverter

# Instalar dependencias
npm install

# Copiar archivo de entorno
cp .env.example .env

# Editar .env con tus configuraciones
# Asegúrate de configurar ALLOWED_ORIGINS

# Instalar LibreOffice (solo para desarrollo local)
# macOS
brew install libreoffice

# Ubuntu/Debian
sudo apt-get install libreoffice

# Iniciar servidor
npm run dev
```

El servidor estará disponible en `http://localhost:3000`

## 📡 Endpoints de la API

### `GET /health`

Health check del servicio.

**Respuesta:**
```json
{
  "status": "ok",
  "message": "PDF Converter API is running"
}
```

### `POST /convert`

Convierte un archivo DOCX a PDF.

**Request:**
- Método: `POST`
- Content-Type: `multipart/form-data`
- Body: Campo `file` con el archivo DOCX

**Ejemplo con cURL:**
```bash
curl -X POST \
  -F "file=@document.docx" \
  http://localhost:3000/convert \
  --output result.pdf
```

**Ejemplo con JavaScript (fetch):**
```javascript
const formData = new FormData();
formData.append('file', docxFile);

const response = await fetch('https://your-railway-url.railway.app/convert', {
  method: 'POST',
  body: formData,
});

if (response.ok) {
  const pdfBlob = await response.blob();
  // Descargar o procesar el PDF
}
```

**Respuesta exitosa:**
- Status: `200 OK`
- Content-Type: `application/pdf`
- Body: PDF binario

**Errores posibles:**
- `400` - No se proporcionó archivo o formato inválido
- `413` - Archivo demasiado grande (máx. 10MB)
- `500` - Error en la conversión

## 🚀 Opciones de Despliegue

Esta API es **completamente agnóstica a la plataforma** y puede desplegarse en cualquier servicio que soporte Docker:
- 🐳 Docker / Docker Compose (VPS, servidor propio)
- ☁️ EasyPanel
- 🚂 Railway
- 🌊 DigitalOcean App Platform
- 📦 Render
- ☸️ Kubernetes
- Y cualquier otro servicio compatible con Docker

> 📖 **[Ver DEPLOYMENT.md](DEPLOYMENT.md)** para guías detalladas paso a paso de cada plataforma

---

## 🐳 Despliegue con Docker Compose (VPS / EasyPanel)

### Opción 1: EasyPanel (Recomendado para VPS)

1. **Accede a tu panel de EasyPanel**

2. **Crear nuevo servicio**:
   - Click en "Create Service"
   - Selecciona "Docker"
   - Nombre: `pdf-converter-api`

3. **Configurar desde repositorio Git**:
   - Repository URL: Tu repositorio Git
   - Branch: `main`
   - Dockerfile path: `./Dockerfile`

4. **Variables de entorno**:
   ```
   ALLOWED_ORIGINS=https://fundocs.vercel.app,https://tu-dominio.com
   PORT=3000
   ```

5. **Networking**:
   - Exponer puerto: `3000`
   - Habilitar dominio público o configurar reverse proxy

6. **Deploy**: EasyPanel construirá y desplegará automáticamente

### Opción 2: Docker Compose en VPS

```bash
# 1. Clonar en tu VPS
ssh tu-usuario@tu-vps
git clone <repository-url>
cd pdfConverter

# 2. Configurar variables de entorno
cp .env.example .env
nano .env  # Editar ALLOWED_ORIGINS

# 3. Levantar con Docker Compose
docker-compose up -d

# 4. Verificar que está corriendo
docker-compose ps
curl http://localhost:3000/health
```

**Acceso público con Nginx (opcional)**:
```nginx
# /etc/nginx/sites-available/pdf-converter
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
        
        # Aumentar límites para archivos grandes
        client_max_body_size 10M;
    }
}
```

### Opción 3: Docker manual

```bash
# Construir la imagen
docker build -t pdf-converter-api .

# Ejecutar el contenedor
docker run -d \
  --name pdf-converter \
  -p 3000:3000 \
  -e ALLOWED_ORIGINS="https://fundocs.vercel.app" \
  --restart unless-stopped \
  pdf-converter-api

# Ver logs
docker logs -f pdf-converter
```

---

## 🚂 Despliegue en Railway

1. **Preparar repositorio**:
   ```bash
   git add .
   git commit -m "Initial commit: PDF Converter API"
   git push origin main
   ```

2. **Crear proyecto en Railway**:
   - Ve a [Railway](https://railway.app)
   - "New Project" → "Deploy from GitHub repo"
   - Selecciona tu repositorio

3. **Variables de entorno**:
   ```
   ALLOWED_ORIGINS=https://fundocs.vercel.app
   ```
   > Railway asigna automáticamente el `PORT`

4. **Deploy**: Railway detecta el Dockerfile y despliega automáticamente

5. **URL**: Railway proporciona una URL como `https://xxx.up.railway.app`

## 🔗 Integración con funDocs

En tu aplicación funDocs (Vercel), actualiza el endpoint de conversión:

```javascript
// En tu código de funDocs
const CONVERTER_API_URL = process.env.NEXT_PUBLIC_CONVERTER_API_URL || 
  'http://localhost:3000'; // Fallback para desarrollo

async function convertToPDF(docxBlob) {
  const formData = new FormData();
  formData.append('file', docxBlob, 'document.docx');

  const response = await fetch(`${CONVERTER_API_URL}/convert`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Conversion failed');
  }

  return await response.blob();
}
```

**Variables de entorno en Vercel** según tu plataforma de despliegue:
```bash
# Si usas EasyPanel/VPS
NEXT_PUBLIC_CONVERTER_API_URL=https://pdf-api.tudominio.com

# Si usas Railway
NEXT_PUBLIC_CONVERTER_API_URL=https://your-app.up.railway.app

# Si usas otro servicio
NEXT_PUBLIC_CONVERTER_API_URL=https://tu-url-de-api.com
```

## 🔒 Seguridad

- El servidor valida que solo se acepten archivos `.docx`
- Límite de tamaño de archivo: 10MB
- CORS configurado para permitir solo orígenes específicos
- Los archivos se procesan en memoria (no se guardan en disco)

## 📊 Monitoreo

Railway proporciona logs en tiempo real. Para ver los logs:
1. Ve al dashboard del proyecto en Railway
2. Click en "View Logs"
3. Monitorea las conversiones y errores

## ⚙️ Configuración Avanzada

### Aumentar el límite de tamaño de archivo

En `server.js`, modifica:
```javascript
limits: {
  fileSize: 20 * 1024 * 1024, // 20MB
}
```

### Cambiar orígenes permitidos

Edita la variable de entorno `ALLOWED_ORIGINS` en Railway o en tu `.env` local.

## 🐛 Troubleshooting

### Error: "LibreOffice not found"
- En local: Asegúrate de tener LibreOffice instalado
- En Railway: Verifica que el Dockerfile se está usando correctamente

### Error: "CORS policy"
- Verifica que la URL de tu aplicación funDocs esté en `ALLOWED_ORIGINS`
- Confirma que estás enviando las credenciales correctamente

### Conversión lenta
- LibreOffice puede tardar varios segundos en iniciar
- Primera conversión siempre es más lenta
- Considera aumentar los recursos en Railway si es necesario

## 📝 Licencia

MIT

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un issue primero para discutir cambios importantes.
