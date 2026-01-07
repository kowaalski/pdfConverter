# Use Node.js 18 as base image
FROM node:18-bullseye

# Install LibreOffice (required for DOCX to PDF conversion)
RUN apt-get update && \
    apt-get install -y \
    libreoffice \
    libreoffice-writer \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Expose port
EXPOSE 3000

# Set environment variable for production
ENV NODE_ENV=production

# Start the application
CMD ["node", "server.js"]
