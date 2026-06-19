#!/usr/bin/env bash
# ==============================================================================
# Lahana Resort PMS — Ubuntu 22.04 LTS Production Server Setup Script
# ==============================================================================
# Run this script as root: sudo ./server_setup.sh
# Make sure to point your DNS (pms.lahanaresort.com) to the server IP beforehand.

set -euo pipefail

# Configurations
DOMAIN="pms.lahanaresort.com"
EMAIL="info@lahanaresort.com"

echo "=== [1/7] Updating system packages ==="
apt update && apt upgrade -y
apt install -y curl git ufw fail2ban certbot python3-certbot-nginx

echo "=== [2/7] Installing Docker and Docker Compose ==="
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
fi

# Ensure docker group exists and current user is added
usermod -aG docker "${USER:-ubuntu}" || true

echo "=== [3/7] Setting up Firewall (UFW) ==="
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'
echo "y" | ufw enable

echo "=== [4/7] Hardening Fail2ban ==="
cat <<EOF > /etc/fail2ban/jail.local
[sshd]
enabled = true
port = 22
filter = sshd
logpath = /var/log/auth.log
maxretry = 5
bantime = 1h

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 3
EOF
systemctl restart fail2ban

echo "=== [5/7] Configuring Nginx Reverse Proxy ==="
mkdir -p /etc/nginx/sites-available
mkdir -p /etc/nginx/sites-enabled

cat <<EOF > /etc/nginx/sites-available/lahana_pms
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};

    # Redirect all HTTP traffic to HTTPS
    location / {
        return 301 https://\$host\$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name ${DOMAIN} www.${DOMAIN};

    # SSL parameters (Will be appended/updated by Certbot)
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';

    client_max_body_size 50M;

    # Nginx level rate-limiting on login to prevent brute force
    limit_req_zone \$binary_remote_addr zone=login_limit:10m rate=5r/m;

    # Next.js Frontend
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Django API backend
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Django Admin Panel
    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Static resources served by Django backend
    location /django_static/ {
        alias /var/www/lahana_static/;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    # KDS & Housekeeping WebSockets
    location /ws/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Rate limiting rule application for auth endpoint
    location /api/auth/login/ {
        limit_req zone=login_limit burst=5 nodelay;
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Link site configurations and restart Nginx
ln -sf /etc/nginx/sites-available/lahana_pms /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default || true
systemctl restart nginx

echo "=== [6/7] Issuing SSL Certificate via Certbot ==="
# Run certbot to request SSL cert and auto-configure Nginx block configurations
certbot --nginx --non-interactive --agree-tos --email "${EMAIL}" -d "${DOMAIN}" --redirect

# Setup SSL renewal cron task
(crontab -l 2>/dev/null; echo "0 12 * * * certbot renew --quiet && systemctl reload nginx") | crontab - || true

echo "=== [7/7] Production Server Setup Completed successfully! ==="
echo "You can now run: git clone, set your .env values, and execute docker compose."
