import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import CheatsheetLayout from '@/components/CheatsheetLayout';
import CodeBlock from '@/components/CodeBlock';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from '@/lib/useTranslation';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import AddConfigForm from '@/components/AddConfigForm';
import { useToast } from '@/hooks/use-toast';

// Extended data for cheatsheets
const cheatsheetData: Record<string, any> = {
  basics: {
    title: 'Linux Basics',
    sections: [
      {
        title: 'Directory Structure',
        configs: [
          {
            title: 'Linux File System Hierarchy',
            code: `# Key Linux Directories
/bin       - Essential command binaries
/boot      - Boot loader files
/dev       - Device files
/etc       - System configuration files
/home      - User home directories
/lib       - Essential shared libraries
/media     - Mount point for removable media
/mnt       - Mount point for temporary filesystems
/opt       - Optional application software
/proc      - Virtual filesystem documenting kernel and process status
/root      - Home directory for the root user
/run       - Run-time variable data
/sbin      - System binaries
/srv       - Data for services provided by the system
/tmp       - Temporary files
/usr       - Secondary hierarchy (user programs, libraries)
/var       - Variable data (logs, databases, websites, etc)`
          }
        ]
      },
      {
        title: 'Essential Commands',
        configs: [
          {
            title: 'File Management',
            code: `# Navigation
pwd           # Print working directory
ls -la        # List all files with details
cd /path      # Change directory
mkdir dirname # Create directory
rmdir dirname # Remove empty directory
rm -rf dir    # Remove directory and contents (be careful!)

# File Operations
touch file    # Create empty file or update timestamp
cp src dst    # Copy files
mv src dst    # Move/rename files
cat file      # Display file content
less file     # View file with paging
head -n10 file # Show first 10 lines
tail -n10 file # Show last 10 lines
tail -f file   # Follow file updates (great for logs)
grep pattern file # Search for pattern in file
find /path -name "*.txt" # Find files by name`
          },
          {
            title: 'System Commands',
            code: `# System Information
uname -a      # Kernel info
lsb_release -a # Distribution info
df -h         # Disk usage
free -h       # Memory usage
top           # Process activity (interactive)
htop          # Enhanced process viewer
ps aux        # List all processes
kill PID      # Kill process by ID
killall name  # Kill process by name

# Systemd Service Management
systemctl start service   # Start service
systemctl stop service    # Stop service
systemctl restart service # Restart service
systemctl status service  # Check service status
systemctl enable service  # Enable at boot
systemctl disable service # Disable at boot
systemctl list-units --type=service # List services

# Network Commands
ip a                  # Show IP addresses
ip r                  # Show routing table
ss -tuln              # List listening ports
netstat -tuln         # List listening ports (alternative)
curl ifconfig.me      # Check public IP
ping host             # Check connectivity
traceroute host       # Trace route to host
dig domain            # DNS lookup
nslookup domain       # DNS lookup (alternative)
nmcli connection show # Network connections (NetworkManager)`
          }
        ]
      },
      {
        title: 'User Management',
        configs: [
          {
            title: 'User Commands',
            code: `# User Management
useradd username      # Create user
usermod -aG group user # Add user to group
userdel username      # Delete user
passwd username       # Set/change password

# Group Management
groupadd groupname    # Create group
groupdel groupname    # Delete group
groups username       # Show user groups

# Permissions
chmod 755 file        # Change file permissions (rwx r-x r-x)
chmod u+x file        # Add execute permission for user
chown user:group file # Change file owner and group
chgrp group file      # Change file group

# Sudo
sudo command          # Run command as root
visudo               # Edit sudoers file safely
sudo -u username cmd  # Run command as another user

# User Info
whoami               # Current username
id                   # User and groups info
who                  # Who is logged in
w                    # Who is logged in and what they're doing`
          }
        ]
      },
      {
        title: 'SSH and Secure Connection',
        configs: [
          {
            title: 'SSH Commands',
            code: `# SSH Connection
ssh user@hostname         # Connect to remote host
ssh -p 2222 user@hostname # Connect on custom port
ssh-keygen -t ed25519     # Generate SSH key pair
ssh-copy-id user@hostname # Copy key to remote host

# SSH Config (~/.ssh/config)
Host myserver
    HostName 192.168.1.100
    User myuser
    Port 2222
    IdentityFile ~/.ssh/id_ed25519

# SCP (Secure Copy)
scp file.txt user@host:/path       # Copy local file to remote
scp user@host:/path/file.txt .     # Copy remote file to local
scp -r folder user@host:/path      # Copy entire directory

# SSH Tunneling
ssh -L 8080:localhost:80 user@host # Local port forwarding
ssh -R 8080:localhost:80 user@host # Remote port forwarding
ssh -D 1080 user@host              # SOCKS proxy`
          },
          {
            title: 'SSH Server Configuration (/etc/ssh/sshd_config)',
            code: `# Basic SSH Server Security Settings
Port 22
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys
PermitEmptyPasswords no
X11Forwarding no
AllowUsers user1 user2
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 2`
          }
        ]
      },
      {
        title: 'Crontab and Task Automation',
        configs: [
          {
            title: 'Crontab Format',
            code: `# Crontab format:
# MIN HOUR DAY MONTH DAYOFWEEK COMMAND
# Fields:
# MIN: Minute (0-59)
# HOUR: Hour (0-23)
# DAY: Day of month (1-31)
# MONTH: Month (1-12)
# DAYOFWEEK: Day of week (0-6, 0=Sunday)

# Examples:
0 * * * * /path/to/script.sh       # Run every hour at minute 0
*/15 * * * * /path/to/script.sh    # Run every 15 minutes
0 0 * * * /path/to/script.sh       # Run at midnight every day
0 0 * * 0 /path/to/script.sh       # Run at midnight every Sunday
0 0 1 * * /path/to/script.sh       # Run at midnight on 1st day of month
0 0,12 * * * /path/to/script.sh    # Run at midnight and noon
0 8-17 * * 1-5 /path/to/script.sh  # Run hourly 8am-5pm weekdays

# Crontab commands:
crontab -e                         # Edit crontab
crontab -l                         # List crontab entries
crontab -r                         # Remove all crontab entries`
          },
          {
            title: 'Systemd Timers (Alternative to Cron)',
            code: `# Create a service unit file: /etc/systemd/system/myscript.service
[Unit]
Description=My Script Service
After=network.target

[Service]
Type=oneshot
ExecStart=/path/to/script.sh
User=username

[Install]
WantedBy=multi-user.target

# Create a timer unit file: /etc/systemd/system/myscript.timer
[Unit]
Description=Run My Script Every Hour

[Timer]
OnBootSec=5min
OnUnitActiveSec=1h
Unit=myscript.service

[Install]
WantedBy=timers.target

# Enable and start timer:
systemctl enable myscript.timer
systemctl start myscript.timer

# List timers:
systemctl list-timers`
          }
        ]
      },
      {
        title: 'Logging and Log Files',
        configs: [
          {
            title: 'Common Log Files',
            code: `# Important system log files:
/var/log/syslog        # General system logs
/var/log/auth.log      # Authentication logs
/var/log/kern.log      # Kernel logs
/var/log/dmesg         # Boot messages
/var/log/apache2/      # Apache web server logs
/var/log/nginx/        # Nginx web server logs
/var/log/postgresql/   # PostgreSQL database logs
/var/log/mysql/        # MySQL database logs

# Log commands:
tail -f /var/log/syslog           # Follow system log in real-time
grep "error" /var/log/syslog      # Find errors in syslog
journalctl -u nginx.service       # View logs for specific service
journalctl -f                     # Follow systemd journal logs
journalctl --since "1 hour ago"   # Logs from last hour
journalctl -b                     # Logs from current boot`
          },
          {
            title: 'rsyslog Configuration (/etc/rsyslog.conf)',
            code: `# Sample rsyslog.conf settings
# Module loading
module(load="imuxsock") # local system logging
module(load="imklog")   # kernel logging

# Templates
template(name="FileFormat" type="string" string="%TIMESTAMP:::date-rfc3339% %HOSTNAME% %syslogtag%%msg:::sp-if-no-1st-sp%%msg:::drop-last-lf%\\n")

# Rules
*.info;mail.none;authpriv.none;cron.none    /var/log/messages
authpriv.*                                  /var/log/secure
mail.*                                      /var/log/maillog
cron.*                                      /var/log/cron
*.emerg                                     :omusrmsg:*

# Remote logging
*.* @logserver.example.com:514           # UDP
*.* @@logserver.example.com:10514        # TCP`
          }
        ]
      }
    ]
  },
  networking: {
    title: 'Networking & VPN',
    sections: [
      {
        title: 'Network Configuration',
        configs: [
          {
            title: 'Static IP (Netplan - Ubuntu/Debian)',
            code: `# /etc/netplan/01-netcfg.yaml
network:
  version: 2
  renderer: networkd
  ethernets:
    ens33:
      dhcp4: no
      addresses:
        - 192.168.1.10/24
      gateway4: 192.168.1.1
      nameservers:
        addresses: [8.8.8.8, 8.8.4.4]
        
# Apply configuration:
sudo netplan apply`
          },
          {
            title: 'Network Bridge Config',
            code: `# /etc/netplan/01-netcfg.yaml (Ubuntu/Debian)
network:
  version: 2
  renderer: networkd
  ethernets:
    enp3s0:
      dhcp4: no
  bridges:
    br0:
      interfaces: [enp3s0]
      dhcp4: no
      addresses: [192.168.1.10/24]
      gateway4: 192.168.1.1
      nameservers:
        addresses: [8.8.8.8, 1.1.1.1]
        
# Apply configuration:
sudo netplan apply`
          }
        ]
      }
    ]
  },
  vpn: {
    title: 'VPN Configurations',
    sections: [
      {
        title: 'OpenVPN',
        configs: [
          {
            title: 'OpenVPN Server Config',
            code: `# /etc/openvpn/server.conf
port 1194
proto udp
dev tun
ca ca.crt
cert server.crt
key server.key
dh dh2048.pem
server 10.8.0.0 255.255.255.0
ifconfig-pool-persist ipp.txt
push "redirect-gateway def1 bypass-dhcp"
push "dhcp-option DNS 8.8.8.8"
push "dhcp-option DNS 8.8.4.4"
keepalive 10 120
cipher AES-256-CBC
auth SHA256
user nobody
group nogroup
persist-key
persist-tun
status openvpn-status.log
verb 3
crl-verify crl.pem
explicit-exit-notify 1`
          },
          {
            title: 'OpenVPN Client Config',
            code: `# client.ovpn
client
dev tun
proto udp
remote server-address 1194
resolv-retry infinite
nobind
persist-key
persist-tun
remote-cert-tls server
cipher AES-256-CBC
auth SHA256
key-direction 1
verb 3

<ca>
-----BEGIN CERTIFICATE-----
# Paste CA certificate here
-----END CERTIFICATE-----
</ca>

<cert>
-----BEGIN CERTIFICATE-----
# Paste client certificate here
-----END CERTIFICATE-----
</cert>

<key>
-----BEGIN PRIVATE KEY-----
# Paste client private key here
-----END PRIVATE KEY-----
</key>

<tls-auth>
-----BEGIN OpenVPN Static key V1-----
# Paste TLS auth key here
-----END OpenVPN Static key V1-----
</tls-auth>`
          },
          {
            title: 'Setup OpenVPN on Ubuntu/Debian',
            code: `#!/bin/bash
# Install OpenVPN
apt update
apt install -y openvpn easy-rsa

# Setup the CA directory
make-cadir ~/openvpn-ca
cd ~/openvpn-ca

# Configure CA variables
cat > vars << EOF
export KEY_COUNTRY="US"
export KEY_PROVINCE="CA"
export KEY_CITY="SanFrancisco"
export KEY_ORG="MyOrganization"
export KEY_EMAIL="admin@example.com"
export KEY_OU="MyOrganizationalUnit"
export KEY_NAME="server"
EOF

# Build the CA
source vars
./clean-all
./build-ca

# Build server key pair
./build-key-server server

# Generate Diffie-Hellman parameters
./build-dh

# Generate HMAC signature
openvpn --genkey --secret keys/ta.key

# Copy files to OpenVPN directory
cp keys/ca.crt keys/server.crt keys/server.key keys/dh2048.pem keys/ta.key /etc/openvpn/`
          }
        ]
      },
      {
        title: 'WireGuard',
        configs: [
          {
            title: 'WireGuard Server Config',
            code: `# /etc/wireguard/wg0.conf
[Interface]
Address = 10.0.0.1/24
ListenPort = 51820
PrivateKey = YOUR_SERVER_PRIVATE_KEY
PostUp = iptables -A FORWARD -i wg0 -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i wg0 -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE

# Client 1
[Peer]
PublicKey = CLIENT1_PUBLIC_KEY
AllowedIPs = 10.0.0.2/32

# Client 2
[Peer]
PublicKey = CLIENT2_PUBLIC_KEY
AllowedIPs = 10.0.0.3/32`
          },
          {
            title: 'WireGuard Client Config',
            code: `# /etc/wireguard/wg0.conf (Client)
[Interface]
Address = 10.0.0.2/24
PrivateKey = CLIENT_PRIVATE_KEY
DNS = 1.1.1.1, 8.8.8.8

[Peer]
PublicKey = SERVER_PUBLIC_KEY
Endpoint = server.example.com:51820
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 25`
          },
          {
            title: 'WireGuard Quick Setup',
            code: `# Server setup
apt update
apt install -y wireguard

# Generate server keys
cd /etc/wireguard
umask 077
wg genkey | tee privatekey | wg pubkey > publickey

# Create config
nano /etc/wireguard/wg0.conf

# Enable and start WireGuard
systemctl enable wg-quick@wg0
systemctl start wg-quick@wg0

# Client setup
apt install -y wireguard
cd /etc/wireguard
umask 077
wg genkey | tee privatekey | wg pubkey > publickey

# Create client config
nano /etc/wireguard/wg0.conf

# Connect
wg-quick up wg0

# Disconnect
wg-quick down wg0`
          }
        ]
      },
      {
        title: 'IPsec/L2TP',
        configs: [
          {
            title: 'IPsec/L2TP Server Setup',
            code: `#!/bin/bash
# Install required packages
apt update
apt install -y strongswan xl2tpd

# Configure IPsec
cat > /etc/ipsec.conf << EOF
config setup
    charondebug="ike 1, knl 1, cfg 0"
    uniqueids=no

conn %default
    ikelifetime=60m
    keylife=20m
    rekeymargin=3m
    keyingtries=1
    keyexchange=ikev1
    authby=secret
    ike=aes128-sha1-modp1024,3des-sha1-modp1024!
    esp=aes128-sha1-modp1024,3des-sha1-modp1024!

conn L2TP-PSK
    type=transport
    left=%defaultroute
    leftprotoport=17/1701
    right=%any
    rightprotoport=17/%any
    auto=add
EOF

# Configure IPsec secrets
cat > /etc/ipsec.secrets << EOF
%any %any : PSK "your_ipsec_pre_shared_key"
EOF

# Configure xl2tpd
cat > /etc/xl2tpd/xl2tpd.conf << EOF
[global]
ipsec saref = yes
saref refinfo = 30

[lns default]
ip range = 10.1.2.2-10.1.2.10
local ip = 10.1.2.1
require chap = yes
refuse pap = yes
require authentication = yes
name = LinuxVPNserver
ppp debug = yes
pppoptfile = /etc/ppp/options.xl2tpd
length bit = yes
EOF

# Configure PPP
cat > /etc/ppp/options.xl2tpd << EOF
ipcp-accept-local
ipcp-accept-remote
ms-dns 8.8.8.8
ms-dns 8.8.4.4
noccp
auth
mtu 1280
mru 1280
proxyarp
lcp-echo-failure 4
lcp-echo-interval 30
connect-delay 5000
EOF

# Add users
cat > /etc/ppp/chap-secrets << EOF
# username  server  password        IP addresses
username    l2tpd   user_password   *
EOF

# Enable IP forwarding
echo "net.ipv4.ip_forward = 1" > /etc/sysctl.d/99-vpn.conf
sysctl -p /etc/sysctl.d/99-vpn.conf

# Restart services
systemctl restart strongswan
systemctl restart xl2tpd
systemctl enable strongswan
systemctl enable xl2tpd`
          },
          {
            title: 'IPsec/L2TP Client Config (Windows)',
            code: `# Windows IPsec/L2TP VPN Client Setup
1. Go to Network and Sharing Center
2. Click "Set up a new connection or network"
3. Select "Connect to a workplace" and click Next
4. Click "Use my Internet connection (VPN)"
5. Enter server address and VPN name
6. Enter username and password
7. Right-click on the new VPN connection and select Properties
8. Go to the Security tab
9. Select "Type of VPN" as "Layer 2 Tunneling Protocol with IPsec (L2TP/IPsec)"
10. Click "Advanced settings" 
11. Select "Use preshared key for authentication" and enter your PSK
12. Click OK and connect to the VPN`
          }
        ]
      },
      {
        title: 'Troubleshooting',
        configs: [
          {
            title: 'Common VPN Troubleshooting',
            code: `# Checking VPN connectivity
ping 10.8.0.1    # Ping VPN server internal IP

# Check if VPN interface is up
ip addr show     # Look for tun0/wg0 interface

# Check routing
ip route         # Verify routes through VPN

# Check OpenVPN logs
tail -f /var/log/syslog | grep openvpn

# Check WireGuard status
wg show

# Check IPsec status
ipsec status

# Firewall rules for VPN
iptables -L -v   # Check current rules

# Restart VPN services
systemctl restart openvpn@server
systemctl restart wg-quick@wg0
systemctl restart strongswan xl2tpd

# Verify DNS settings when connected
cat /etc/resolv.conf

# Test for DNS leaks
dig +short myip.opendns.com @resolver1.opendns.com

# Monitor VPN connections
netstat -anp | grep openvpn
ss -anp | grep openvpn`
          }
        ]
      }
    ]
  },
  asterisk: {
    title: 'Asterisk PBX',
    sections: [
      {
        title: 'Installation and Setup',
        configs: [
          {
            title: 'Asterisk Installation (Debian/Ubuntu)',
            code: `# Install dependencies
apt update
apt install -y build-essential git wget libssl-dev libncurses5-dev libnewt-dev libxml2-dev linux-headers-$(uname -r) libsqlite3-dev uuid-dev

# Install Asterisk (latest LTS version)
cd /usr/src
wget http://downloads.asterisk.org/pub/telephony/asterisk/asterisk-18-current.tar.gz
tar -zxf asterisk-18-current.tar.gz
cd asterisk-18*/

# Configure and install
./configure
make menuselect  # Choose required modules (optional)
make
make install
make samples    # Install sample config files
make config     # Install startup scripts

# Start Asterisk
systemctl start asterisk
systemctl enable asterisk

# Access Asterisk CLI
asterisk -r`
          },
          {
            title: 'Basic Asterisk CLI Commands',
            code: `# Check Asterisk version
core show version

# Show status summary
core show status

# Show active channels
core show channels

# Show registered SIP endpoints
pjsip show endpoints
sip show peers  # For chan_sip (legacy)

# Check extension status
dialplan show

# Monitor log in real-time
core set verbose 3
core set debug 3  # More detailed debugging

# Reload configuration
core reload

# Gracefully restart Asterisk
core restart gracefully

# Exit CLI
exit`
          }
        ]
      },
      {
        title: 'Basic Configuration',
        configs: [
          {
            title: 'SIP Configuration (pjsip.conf)',
            code: `; /etc/asterisk/pjsip.conf - PJSIP Configuration

; Global settings
[global]
type = global
user_agent = Asterisk PBX
debug = yes

; Transport definition 
[transport-udp]
type = transport
protocol = udp
bind = 0.0.0.0:5060
external_media_address = 203.0.113.1  ; Your public IP
external_signaling_address = 203.0.113.1
local_net = 192.168.0.0/24

; Extension template
[endpoint-internal](!)
type = endpoint
context = from-internal
disallow = all
allow = ulaw,alaw,gsm,g722
direct_media = no
trust_id_outbound = yes
device_state_busy_at = 1
dtmf_mode = rfc4733

; Authentication definition
[auth-userpass](!)
type = auth
auth_type = userpass

; AOR (Address of Record) template
[aor-single-reg](!)
type = aor
max_contacts = 1
remove_existing = yes
qualify_frequency = 60

; SIP Extension: 100
[100](endpoint-internal)
auth = auth100
aors = 100

[auth100](auth-userpass)
password = secret100
username = 100

[100](aor-single-reg)
mailboxes = 100@default

; SIP Extension: 101
[101](endpoint-internal)
auth = auth101
aors = 101

[auth101](auth-userpass)
password = secret101
username = 101

[101](aor-single-reg)
mailboxes = 101@default`
          },
          {
            title: 'Dialplan Configuration (extensions.conf)',
            code: `; /etc/asterisk/extensions.conf - Dialplan

[general]
static=yes
writeprotect=no
autofallthrough=yes
priorityjumping=no
extenpatternmatchnew=yes

[globals]
OPERATOR=101
TRUNK=SIP/provider

; Context for internal extensions
[from-internal]
exten => _1XX,1,NoOp(Dialing Extension \${EXTEN})
 same => n,Dial(PJSIP/\${EXTEN},20)
 same => n,Voicemail(\${EXTEN}@default,u)
 same => n,Hangup()

; Handle incoming calls
[from-external]
exten => _X.,1,NoOp(Incoming call from \${CALLERID(num)})
 same => n,Answer()
 same => n,Wait(1)
 same => n,Playback(welcome)
 same => n,Dial(PJSIP/100,20)
 same => n,VoiceMail(100@default,u)
 same => n,Hangup()

; IVR Menu
[ivr-main]
exten => s,1,NoOp(IVR Main Menu)
 same => n,Answer()
 same => n,Wait(1)
 same => n,Background(welcome-to-company)
 same => n,WaitExten(5)

exten => 1,1,Dial(PJSIP/100,20)
 same => n,Voicemail(100@default,u)
 same => n,Hangup()

exten => 2,1,Dial(PJSIP/101,20) 
 same => n,Voicemail(101@default,u)
 same => n,Hangup()

exten => 0,1,Dial(PJSIP/\${OPERATOR},20)
 same => n,Hangup()

exten => i,1,Playback(invalid)
 same => n,Goto(s,1)

exten => t,1,Playback(goodbye)
 same => n,Hangup()`
          }
        ]
      },
      {
        title: 'Voicemail Configuration',
        configs: [
          {
            title: 'Voicemail Configuration (voicemail.conf)',
            code: `; /etc/asterisk/voicemail.conf

[general]
format=wav49|wav|gsm
serveremail=asterisk@example.com
attach=yes
skipms=3000
maxsilence=10
silencethreshold=128
maxlogins=3
emaildateformat=%A, %B %d, %Y at %r
pagerdateformat=%T %D
sendvoicemail=yes

[default]
100 => 1234,User 100,user100@example.com
101 => 4321,User 101,user101@example.com`
          }
        ]
      },
      {
        title: 'Trunk Configuration',
        configs: [
          {
            title: 'VoIP Provider Setup (pjsip.conf)',
            code: `; /etc/asterisk/pjsip.conf - Provider configuration

; Registration
[provider-reg]
type = registration
transport = transport-udp
outbound_auth = provider-auth
server_uri = sip:sip.provider.com
client_uri = sip:your_account@sip.provider.com
retry_interval = 60
expiration = 3600
contact_user = your_account

; Authentication
[provider-auth]
type = auth
auth_type = userpass
username = your_account
password = your_password

; AOR
[provider]
type = aor
contact = sip:sip.provider.com

; Endpoint
[provider]
type = endpoint
transport = transport-udp
context = from-provider
disallow = all
allow = ulaw,alaw
outbound_auth = provider-auth
aors = provider
from_user = your_account
from_domain = sip.provider.com
direct_media = no
rtp_symmetric = yes
force_rport = yes
rewrite_contact = yes
ice_support = yes

; Identify
[provider]
type = identify
endpoint = provider
match = sip.provider.com`
          },
          {
            title: 'Outbound Routes (extensions.conf)',
            code: `; /etc/asterisk/extensions.conf - Outbound calling

[outbound]
; Local calls (7 digits)
exten => _NXXXXXX,1,NoOp(Dialing local number \${EXTEN})
 same => n,Set(CALLERID(name)=Company Name)
 same => n,Dial(PJSIP/\${EXTEN}@provider,30)
 same => n,Hangup()

; Long distance calls (11 digits)
exten => _1NXXNXXXXXX,1,NoOp(Dialing long distance \${EXTEN})
 same => n,Set(CALLERID(name)=Company Name)
 same => n,Dial(PJSIP/\${EXTEN}@provider,30)
 same => n,Hangup()

; International calls
exten => _011X.,1,NoOp(Dialing international \${EXTEN})
 same => n,Authenticate(1234)  ; Require PIN for international
 same => n,Set(CALLERID(name)=Company Name)
 same => n,Dial(PJSIP/\${EXTEN}@provider,30)
 same => n,Hangup()

; Add to from-internal context to allow extensions to dial out
[from-internal]
; Include outbound dialing rules
include => outbound

; Allow internal extension dialing (keep existing rules)
exten => _1XX,1,NoOp(Dialing Extension \${EXTEN})
 same => n,Dial(PJSIP/\${EXTEN},20)
 same => n,Voicemail(\${EXTEN}@default,u)
 same => n,Hangup()`
          }
        ]
      },
      {
        title: 'Call Features',
        configs: [
          {
            title: 'Conference Rooms (confbridge.conf)',
            code: `; /etc/asterisk/confbridge.conf

[general]

; User profiles
[default_user]
type=user
pin=1234
music_on_hold_when_empty=yes
announce_join_leave=yes
announce_user_count=yes
wait_marked=yes

[admin_user]
type=user
pin=4321
admin=yes
marked=yes
announce_join_leave=yes
music_on_hold_when_empty=no

; Conference profiles
[default_conf]
type=bridge
max_members=50
record_conference=no

; Setup Conference extensions in dialplan (extensions.conf)
[conferences]
; Standard conference
exten => 800,1,NoOp(Entering conference \${EXTEN})
 same => n,ConfBridge(\${EXTEN},default_conf,default_user)
 
; Admin conference
exten => 801,1,NoOp(Entering admin conference \${EXTEN})
 same => n,ConfBridge(\${EXTEN},default_conf,admin_user)

; Include in from-internal context
[from-internal]
include => conferences`
          },
          {
            title: 'Call Recording',
            code: `; Add call recording to extensions.conf

[from-internal]
; Record all internal calls
exten => _1XX,1,NoOp(Dialing Extension \${EXTEN} with recording)
 same => n,Set(CALLFILENAME=internal-\${STRFTIME(\${EPOCH},,%Y%m%d-%H%M%S)}-\${EXTEN}-\${CALLERID(num)})
 same => n,MixMonitor(/var/spool/asterisk/monitor/\${CALLFILENAME}.wav)
 same => n,Dial(PJSIP/\${EXTEN},20)
 same => n,Voicemail(\${EXTEN}@default,u)
 same => n,Hangup()
 
; Stop recording on hangup (add to any context)
exten => h,1,NoOp(Hangup handler)
 same => n,StopMixMonitor()
 
; Enable one-touch recording (in-call) for SIP devices
; Add this line to pjsip.conf endpoint definitions:
; one_touch_recording = yes`
          }
        ]
      }
    ]
  },
  docker: {
    title: 'Docker',
    sections: [
      {
        title: 'Basic Commands',
        configs: [
          {
            title: 'Common Docker Commands',
            code: `# List all running containers
docker ps

# List all containers, including stopped ones
docker ps -a

# Pull an image from Docker Hub
docker pull nginx:latest

# Run a container
docker run -d -p 8080:80 --name my-nginx nginx:latest

# Stop a container
docker stop my-nginx

# Remove a container
docker rm my-nginx

# List all images
docker images

# Remove an image
docker rmi nginx:latest

# View container logs
docker logs my-nginx

# Execute command in running container
docker exec -it my-nginx bash

# View container details
docker inspect my-nginx

# View resource usage statistics
docker stats

# Build an image from Dockerfile
docker build -t myapp:1.0 .

# Tag an image
docker tag myapp:1.0 username/myapp:1.0

# Push image to Docker Hub
docker push username/myapp:1.0

# Save image to tar file
docker save -o myapp.tar myapp:1.0

# Load image from tar file
docker load -i myapp.tar`
          }
        ]
      },
      {
        title: 'Docker Compose',
        configs: [
          {
            title: 'Simple Web App with Database',
            code: `# docker-compose.yml
version: '3'
services:
  web:
    image: nginx:latest
    ports:
      - "8080:80"
    volumes:
      - ./web:/usr/share/nginx/html
    depends_on:
      - db
  
  db:
    image: postgres:13
    environment:
      POSTGRES_PASSWORD: example
      POSTGRES_USER: postgres
      POSTGRES_DB: myapp
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:`
          },
          {
            title: 'MERN Stack Application',
            code: `# docker-compose.yml
version: '3'

services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    depends_on:
      - backend
    environment:
      - REACT_APP_API_URL=http://localhost:5000/api

  backend:
    build: ./backend
    ports:
      - "5000:5000"
    volumes:
      - ./backend:/app
      - /app/node_modules
    depends_on:
      - mongo
    environment:
      - MONGO_URI=mongodb://mongo:27017/myapp
      - JWT_SECRET=your_jwt_secret
      - NODE_ENV=development

  mongo:
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:`
          }
        ]
      },
      {
        title: 'Dockerfile Examples',
        configs: [
          {
            title: 'Python FastAPI Dockerfile',
            code: `# Dockerfile for FastAPI application
FROM python:3.9-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Command to run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]`
          },
          {
            title: 'Node.js Dockerfile',
            code: `# Dockerfile for Node.js application
FROM node:16-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

# Command to run the application
CMD ["npm", "start"]`
          }
        ]
      }
    ]
  },
  nginx: {
    title: 'Nginx Web Server',
    sections: [
      {
        title: 'Basic Configuration',
        configs: [
          {
            title: 'Nginx Server Block',
            code: `# /etc/nginx/sites-available/example.com
server {
    listen 80;
    server_name example.com www.example.com;
    root /var/www/example.com/html;
    index index.html index.htm index.nginx-debian.html;

    location / {
        try_files $uri $uri/ =404;
    }

    # Additional common configuration
    location ~ \\.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php8.0-fpm.sock;
    }

    # Deny access to .htaccess files
    location ~ /\\.ht {
        deny all;
    }
}

# Create symbolic link to enable site
# ln -s /etc/nginx/sites-available/example.com /etc/nginx/sites-enabled/
# systemctl reload nginx`
          },
          {
            title: 'HTTPS Configuration',
            code: `# /etc/nginx/sites-available/example.com (SSL)
server {
    listen 80;
    server_name example.com www.example.com;
    # Redirect all HTTP requests to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name example.com www.example.com;
    root /var/www/example.com/html;
    index index.html index.htm index.nginx-debian.html;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers 'ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305';
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:10m;
    ssl_session_tickets off;

    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    resolver 8.8.8.8 8.8.4.4 valid=300s;
    resolver_timeout 5s;

    location / {
        try_files $uri $uri/ =404;
    }
}`
          }
        ]
      },
      {
        title: 'Reverse Proxy',
        configs: [
          {
            title: 'Nginx as Reverse Proxy',
            code: `# /etc/nginx/sites-available/proxy.conf
server {
    listen 80;
    server_name app.example.com;

    location / {
        proxy_pass http://localhost:3000;  # Node.js app
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# For multiple backend services
server {
    listen 80;
    server_name api.example.com;

    # API service
    location /api {
        proxy_pass http://localhost:8080/api;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Static files
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}`
          },
          {
            title: 'Load Balancing',
            code: `# /etc/nginx/sites-available/loadbalance.conf
upstream backend {
    server backend1.example.com weight=3;  # More traffic to this server
    server backend2.example.com;
    server backend3.example.com backup;    # Used when others are down
}

# For session persistence (sticky sessions)
upstream backend_sticky {
    ip_hash;  # Send same client to same server based on IP
    server backend1.example.com;
    server backend2.example.com;
}

# For least connections
upstream backend_least_conn {
    least_conn;  # Send to server with least active connections
    server backend1.example.com;
    server backend2.example.com;
}

server {
    listen 80;
    server_name app.example.com;

    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # Health check
        health_check interval=10 fails=3 passes=2;
    }
}`
          }
        ]
      },
      {
        title: 'Performance Optimization',
        configs: [
          {
            title: 'Nginx Performance Settings',
            code: `# /etc/nginx/nginx.conf
user www-data;
worker_processes auto;  # Auto-detect number of cores
pid /run/nginx.pid;
include /etc/nginx/modules-enabled/*.conf;

events {
    worker_connections 1024;  # Maximum connections per worker
    multi_accept on;          # Accept as many connections as possible
    use epoll;                # Efficient connection processing method
}

http {
    # Basic Settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    server_tokens off;        # Hide Nginx version

    # MIME Types
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # SSL Optimization
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Logging
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    # Gzip Settings
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_buffers 16 8k;
    gzip_http_version 1.1;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # File Cache Settings
    open_file_cache max=1000 inactive=20s;
    open_file_cache_valid 30s;
    open_file_cache_min_uses 2;
    open_file_cache_errors on;

    # Include site configurations
    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}`
          }
        ]
      }
    ]
  },
  kubernetes: {
    title: 'Kubernetes',
    sections: [
      {
        title: 'Basic Deployments',
        configs: [
          {
            title: 'Simple Deployment',
            code: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
  labels:
    app: nginx
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:1.19
        ports:
        - containerPort: 80`
          },
          {
            title: 'Service Configuration',
            code: `apiVersion: v1
kind: Service
metadata:
  name: nginx-service
spec:
  selector:
    app: nginx
  ports:
  - port: 80
    targetPort: 80
  type: LoadBalancer`
          }
        ]
      },
      {
        title: 'Helm Package Manager',
        configs: [
          {
            title: 'Helm Basic Commands',
            code: `# Install Helm
# Linux
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# MacOS
brew install helm

# Windows (with Chocolatey)
choco install kubernetes-helm

# Add a Helm repository
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

# Search for charts
helm search repo bitnami

# Install a chart
helm install my-release bitnami/nginx

# List installed releases
helm list

# Upgrade a release
helm upgrade my-release bitnami/nginx --set replicaCount=3

# Rollback to a previous version
helm rollback my-release 1

# Uninstall a release
helm uninstall my-release

# Create a new Helm chart
helm create mychart

# Package a chart
helm package mychart

# Install a local chart
helm install my-release ./mychart

# Debug a chart
helm template mychart
helm lint mychart`
          },
          {
            title: 'Helm Chart Structure',
            code: `mychart/
├── Chart.yaml          # Chart metadata
├── values.yaml         # Default values
├── charts/             # Dependent charts
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   ├── _helpers.tpl    # Template helpers
│   └── NOTES.txt       # Usage notes
└── .helmignore         # Ignored files

# Example Chart.yaml
apiVersion: v2
name: mychart
description: A Helm chart for my application
type: application
version: 0.1.0
appVersion: "1.0.0"
dependencies:
  - name: postgresql
    version: "11.6.12"
    repository: "https://charts.bitnami.com/bitnami"
    condition: postgresql.enabled

# Example values.yaml
replicaCount: 1
image:
  repository: nginx
  tag: "1.21.6"
  pullPolicy: IfNotPresent
service:
  type: ClusterIP
  port: 80
ingress:
  enabled: false
resources:
  limits:
    cpu: 100m
    memory: 128Mi
  requests:
    cpu: 50m
    memory: 64Mi`
          },
          {
            title: 'Kubernetes Security',
            code: `# Pod with security context
apiVersion: v1
kind: Pod
metadata:
  name: security-context-pod
spec:
  securityContext:
    runAsUser: 1000
    runAsGroup: 3000
    fsGroup: 2000
  containers:
  - name: secured-container
    image: nginx
    securityContext:
      allowPrivilegeEscalation: false
      capabilities:
        drop:
          - ALL
      readOnlyRootFilesystem: true
      runAsNonRoot: true
      seccompProfile:
        type: RuntimeDefault

# PodSecurityPolicy (being replaced by Pod Security Standards)
apiVersion: policy/v1beta1
kind: PodSecurityPolicy
metadata:
  name: restricted
spec:
  privileged: false
  allowPrivilegeEscalation: false
  requiredDropCapabilities:
    - ALL
  volumes:
    - 'configMap'
    - 'emptyDir'
    - 'projected'
    - 'secret'
    - 'downwardAPI'
    - 'persistentVolumeClaim'
  hostNetwork: false
  hostIPC: false
  hostPID: false
  runAsUser:
    rule: 'MustRunAsNonRoot'
  seLinux:
    rule: 'RunAsAny'
  supplementalGroups:
    rule: 'MustRunAs'
    ranges:
      - min: 1
        max: 65535
  fsGroup:
    rule: 'MustRunAs'
    ranges:
      - min: 1
        max: 65535
  readOnlyRootFilesystem: true`
          },
          {
            title: 'Network Policies',
            code: `# Default deny all ingress traffic
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-ingress
spec:
  podSelector: {}
  policyTypes:
  - Ingress

# Allow traffic to specific application
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-frontend-to-backend
spec:
  podSelector:
    matchLabels:
      app: backend
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: frontend
    ports:
    - protocol: TCP
      port: 8080`
          }
        ]
      }
    ]
  },
  debian: {
    title: 'Debian',
    sections: [
      {
        title: 'Package Management',
        configs: [
          {
            title: 'APT Commands',
            code: `# Update package index
sudo apt update

# Upgrade all packages
sudo apt upgrade -y

# Install a package
sudo apt install package-name

# Remove a package
sudo apt remove package-name

# Search for a package
apt search package-name

# Show package information
apt show package-name

# Clean apt cache
sudo apt clean

# Autoremove unused dependencies
sudo apt autoremove`
          }
        ]
      },
      {
        title: 'System Management',
        configs: [
          {
            title: 'System Control',
            code: `# Check system status
systemctl status

# Start a service
sudo systemctl start service-name

# Stop a service
sudo systemctl stop service-name

# Restart a service
sudo systemctl restart service-name

# Enable service at startup
sudo systemctl enable service-name

# Disable service at startup
sudo systemctl disable service-name

# View system logs
journalctl -xe`
          }
        ]
      }
    ]
  },
  cicd: {
    title: 'CI/CD Systems',
    sections: [
      {
        title: 'Jenkins',
        configs: [
          {
            title: 'Jenkinsfile Pipeline',
            code: `// Jenkinsfile - Declarative Pipeline
pipeline {
    agent any
    
    environment {
        DOCKER_REGISTRY = 'registry.example.com'
        IMAGE_NAME = 'myapp'
        IMAGE_TAG = "BUILD_NUMBER"
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Build') {
            steps {
                sh 'npm install'
                sh 'npm run build'
            }
        }
        
        stage('Test') {
            steps {
                sh 'npm test'
            }
            post {
                always {
                    junit 'test-results/*.xml'
                }
            }
        }
        
        stage('Docker Build') {
            steps {
                sh "docker build -t DOCKER_REGISTRY/IMAGE_NAME:IMAGE_TAG ."
            }
        }
        
        stage('Docker Push') {
            steps {
                withCredentials([string(credentialsId: 'docker-pwd', variable: 'DOCKER_PWD')]) {
                    sh "docker login DOCKER_REGISTRY -u username -p DOCKER_PWD"
                    sh "docker push DOCKER_REGISTRY/IMAGE_NAME:IMAGE_TAG"
                }
            }
        }
        
        stage('Deploy to Dev') {
            steps {
                sh "kubectl apply -f k8s/dev/"
                sh "kubectl set image deployment/myapp myapp=DOCKER_REGISTRY/IMAGE_NAME:IMAGE_TAG -n dev"
            }
        }
    }
    
    post {
        success {
            slackSend channel: '#deploy', color: 'good', message: "Deployment successful: JOB_NAME BUILD_NUMBER"
        }
        failure {
            slackSend channel: '#deploy', color: 'danger', message: "Build failed: JOB_NAME BUILD_NUMBER"
        }
    }
}`
          },
          {
            title: 'Jenkins Installation',
            code: `#!/bin/bash
# Install Jenkins on Debian/Ubuntu

# Add Jenkins repository key
wget -q -O - https://pkg.jenkins.io/debian-stable/jenkins.io.key | sudo apt-key add -

# Add Jenkins repository
echo "deb https://pkg.jenkins.io/debian-stable binary/" | sudo tee /etc/apt/sources.list.d/jenkins.list

# Update and install Java
sudo apt update
sudo apt install -y openjdk-11-jdk

# Install Jenkins
sudo apt install -y jenkins

# Start Jenkins service
sudo systemctl start jenkins
sudo systemctl enable jenkins

# Print initial admin password
echo "Jenkins initial admin password:"
sudo cat /var/lib/jenkins/secrets/initialAdminPassword`
          }
        ]
      },
      {
        title: 'GitLab CI',
        configs: [
          {
            title: 'GitLab CI/CD Configuration',
            code: `# .gitlab-ci.yml
stages:
  - build
  - test
  - docker
  - deploy

variables:
  DOCKER_REGISTRY: registry.example.com
  IMAGE_NAME: myapp

build:
  stage: build
  image: node:16
  script:
    - npm install
    - npm run build
  artifacts:
    paths:
      - dist/
    expire_in: 1 hour

test:
  stage: test
  image: node:16
  script:
    - npm install
    - npm test
  artifacts:
    paths:
      - coverage/
    reports:
      junit: test-results.xml

docker-build:
  stage: docker
  image: docker:20.10.12
  services:
    - docker:20.10.12-dind
  script:
    - docker build -t $DOCKER_REGISTRY/$IMAGE_NAME:$CI_COMMIT_SHORT_SHA .
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $DOCKER_REGISTRY
    - docker push $DOCKER_REGISTRY/$IMAGE_NAME:$CI_COMMIT_SHORT_SHA
  only:
    - main
    - staging

deploy-dev:
  stage: deploy
  image: bitnami/kubectl:latest
  script:
    - kubectl config set-cluster k8s --server="$KUBE_URL" --insecure-skip-tls-verify=true
    - kubectl config set-credentials ci --token="$KUBE_TOKEN"
    - kubectl config set-context ci --cluster=k8s --user=ci
    - kubectl config use-context ci
    - sed -i "s|__IMAGE__|$DOCKER_REGISTRY/$IMAGE_NAME:$CI_COMMIT_SHORT_SHA|" k8s/deployment.yaml
    - kubectl apply -f k8s/deployment.yaml -n dev
  environment:
    name: dev
  only:
    - main`
          },
          {
            title: 'GitHub Actions',
            code: `# .github/workflows/deploy.yml
name: Deploy Application

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3
      
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: 16
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Build project
      run: npm run build
    
    - name: Run tests
      run: npm test
      
    - name: Deploy to production server
      uses: appleboy/ssh-action@master
      with:
        host: '\${{ secrets.HOST }}'
        username: '\${{ secrets.USERNAME }}'
        key: '\${{ secrets.SSH_KEY }}'
        script: |
          cd /opt/myapp
          git pull origin main
          npm ci --production
          pm2 restart myapp
`
          },
          {
            title: 'Basic CI/CD Bash Script',
            code: `#!/bin/bash
# Simple CI/CD script for deployment

set -e  # Exit immediately if a command fails

# Configuration
APP_DIR="/opt/myapp"
REPO="https://github.com/username/myapp.git"
BRANCH="main"
SERVICE_NAME="myapp"

echo "Starting deployment process..."

# Update code from repository
if [ -d "$APP_DIR" ]; then
  echo "Repository exists, pulling latest changes..."
  cd $APP_DIR
  git fetch origin
  git reset --hard origin/$BRANCH
else
  echo "Cloning repository..."
  git clone -b $BRANCH $REPO $APP_DIR
  cd $APP_DIR
fi

# Install dependencies
echo "Installing dependencies..."
if [ -f "package.json" ]; then
  npm ci --production
elif [ -f "requirements.txt" ]; then
  python -m venv venv
  source venv/bin/activate
  pip install -r requirements.txt
fi

# Run build commands if needed
if [ -f "package.json" ]; then
  echo "Building application..."
  npm run build
fi

# Apply database migrations if needed
if [ -f "manage.py" ]; then
  echo "Running migrations..."
  python manage.py migrate
  python manage.py collectstatic --noinput
fi

# Restart the service
echo "Restarting service..."
if command -v systemctl &> /dev/null; then
  systemctl restart $SERVICE_NAME
elif command -v pm2 &> /dev/null; then
  pm2 restart $SERVICE_NAME
else
  echo "WARNING: Could not find systemd or pm2, please restart service manually."
fi

echo "Deployment completed successfully."
`
          }
        ]
      },
      {
        title: 'GitOps',
        sections: [
          {
            title: 'ArgoCD',
            configs: [
              {
                title: 'ArgoCD Installation',
                code: `# Install ArgoCD in Kubernetes
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Access ArgoCD UI
kubectl port-forward svc/argocd-server -n argocd 8080:443

# Login with admin user and password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d

# Install ArgoCD CLI
# Linux
curl -sSL -o argocd-linux-amd64 https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-amd64
sudo install -m 555 argocd-linux-amd64 /usr/local/bin/argocd
rm argocd-linux-amd64

# Mac
brew install argocd

# Login using CLI
argocd login <ARGOCD_SERVER>

# Create an application
argocd app create guestbook \\
  --repo https://github.com/argoproj/argocd-example-apps.git \\
  --path guestbook \\
  --dest-server https://kubernetes.default.svc \\
  --dest-namespace default`
          },
          {
            title: 'ArgoCD Application Example',
            code: `# application.yaml - for defining applications in ArgoCD
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: guestbook
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/argoproj/argocd-example-apps.git
    targetRevision: HEAD
    path: guestbook
  destination:
    server: https://kubernetes.default.svc
    namespace: guestbook
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
    - CreateNamespace=true`
          }
        ]
      },
      {
        title: 'Flux CD',
        configs: [
          {
            title: 'Flux Installation',
            code: `# Install Flux CLI
# Linux
curl -s https://fluxcd.io/install.sh | sudo bash

# Mac
brew install fluxcd/tap/flux

# Check cluster compatibility
flux check --pre

# Bootstrap with GitHub
flux bootstrap github \\
  --owner=<GITHUB_USER> \\
  --repository=<REPOSITORY_NAME> \\
  --branch=main \\
  --path=./clusters/my-cluster \\
  --personal

# Create a source for Git repository
flux create source git podinfo \\
  --url=https://github.com/stefanprodan/podinfo \\
  --branch=master \\
  --interval=30s \\
  --export > ./clusters/my-cluster/podinfo-source.yaml

# Create a Kustomization
flux create kustomization podinfo \\
  --source=podinfo \\
  --path="./kustomize" \\
  --prune=true \\
  --validation=client \\
  --interval=5m \\
  --export > ./clusters/my-cluster/podinfo-kustomization.yaml`
          },
          {
            title: 'Flux Kustomization Example',
            code: `# Example of GitOps repository structure for Flux CD
clusters/
└── production
    ├── flux-system/ # flux components
    │   ├── gotk-components.yaml
    │   ├── gotk-sync.yaml
    │   └── kustomization.yaml
    ├── namespaces/
    │   ├── kustomization.yaml
    │   └── monitoring.yaml
    ├── infrastructure/
    │   ├── kustomization.yaml
    │   ├── sources/
    │   │   ├── kustomization.yaml
    │   │   └── podinfo.yaml
    │   └── monitoring/
    │       ├── kustomization.yaml
    │       └── prometheus.yaml
    └── apps/
        ├── kustomization.yaml
        └── podinfo/
            ├── kustomization.yaml
            ├── release.yaml
            └── values.yaml`
          }
        ]
      },
      {
        title: 'GitOps Principles',
        configs: [
          {
            title: 'GitOps Best Practices',
            code: `# Core GitOps Principles

1. Declarative System Description
   - All system configurations are defined declaratively in Git
   - Infrastructure as Code (IaC) tools like Terraform, Ansible
   - Kubernetes manifests, Helm charts, Kustomize configurations

2. Version Controlled, Immutable Configuration
   - All changes tracked in Git history
   - Branches, commits, and tags to represent system state
   - Git hooks to enforce policy and validation

3. Automatic Pull-based Deployments
   - Agents inside the cluster pull from Git (not pushed)
   - Continuous reconciliation between Git and runtime state
   - Drift detection and self-healing

4. Approved Changes via Git Workflow
   - Pull Requests as change mechanism
   - CI validates changes before merging
   - Approvals and reviews through Git platform

# Typical GitOps Workflow

1. Developer commits code to application repository
2. CI system builds, tests, and pushes container image
3. Developer creates PR to update image tag in GitOps repo
4. After approval and merge, GitOps tool detects change
5. GitOps tool applies changes to the target environment

# Tools Ecosystem

- CD Tools: ArgoCD, Flux CD, Jenkins X
- Security: Sealed Secrets, Vault, SOPS
- Validation: OPA/Gatekeeper, Kyverno
- Monitoring: Prometheus + Grafana
- Progressive Delivery: Argo Rollouts, Flagger`
          }
        ]
      }
    ]
  },
  serverless: {
    title: 'Serverless',
    sections: [
      {
        title: 'AWS Lambda',
        configs: [
          {
            title: 'AWS Lambda Function (Node.js)',
            code: `// Basic AWS Lambda function with Node.js
exports.handler = async (event) => {
  console.log('Event: ', JSON.stringify(event, null, 2));
  
  try {
    // Process event data
    const records = event.Records || [];
    const results = [];
    
    for (const record of records) {
      // Example: process SQS messages or S3 events
      if (record.s3) {
        console.log('Processing S3 event');
        // Process S3 event
      } else if (record.eventSource === 'aws:sqs') {
        console.log('Processing SQS message');
        // Process SQS message
      }
      
      results.push({
        id: record.eventID || 'unknown',
        status: 'processed'
      });
    }
    
    // Return results
    const response = {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Successfully processed records',
        results: results
      })
    };
    
    return response;
  } catch (error) {
    console.error('Error:', error);
    
    // Return error response
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Error processing request',
        error: error.message
      })
    };
  }
};`
          },
          {
            title: 'PowerShell Scripts',
            code: `# PowerShell doesn't support && operator like bash
# Instead use semicolons or write multi-line commands

# Change directory and run a command (instead of cd folder && command)
cd backAnd; python manage.py runserver

# Alternative approach with multi-line commands
cd backAnd
python manage.py runserver

# For conditional execution (similar to && in bash)
cd backAnd; if ($?) { python manage.py runserver }

# Run front-end development server
cd fronAnd
npm run dev

# Running multiple services - use multiple PowerShell windows or jobs
# Start a background job
Start-Job -ScriptBlock {
    cd D:\\Проекты\\DevOps\\backAnd
    python manage.py runserver
}

# Start another process in the current shell
cd D:\\Проекты\\DevOps\\fronAnd
npm run dev

# View all running jobs
Get-Job

# Get output from a background job
Receive-Job -Id 1

# Stop a background job when done
Stop-Job -Id 1
Remove-Job -Id 1`
          }
        ]
      }
    ]
  },
  deployment: {
    title: 'Deployment',
    sections: [
      {
        title: 'Frontend Deployment',
        configs: [
          {
            title: 'React App Deployment (Nginx)',
            code: `#!/bin/bash
# Script for deploying React application with Nginx

# Install dependencies
apt update
apt install -y nginx nodejs npm

# Create directory structure
mkdir -p /var/www/myapp

# Clone repository
cd /tmp
git clone https://github.com/username/react-app.git
cd react-app

# Install dependencies and build
npm install
npm run build

# Copy build to web root
cp -r build/* /var/www/myapp/

# Create Nginx config
cat > /etc/nginx/sites-available/myapp << EOF
server {
    listen 80;
    server_name myapp.example.com;
    root /var/www/myapp;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
EOF

# Enable site and restart Nginx
ln -s /etc/nginx/sites-available/myapp /etc/nginx/sites-enabled/
nginx -t && systemctl restart nginx

# Setup SSL with Certbot (optional)
apt install -y certbot python3-certbot-nginx
certbot --nginx -d myapp.example.com
`
          },
          {
            title: 'Vue.js App Deployment',
            code: `#!/bin/bash
# Deploy Vue.js application to Apache

# Install dependencies
apt update
apt install -y apache2 nodejs npm

# Create directory structure
mkdir -p /var/www/vueapp

# Clone repository
cd /tmp
git clone https://github.com/username/vue-app.git
cd vue-app

# Install dependencies and build
npm install
npm run build

# Copy build to web root
cp -r dist/* /var/www/vueapp/

# Create Apache config
cat > /etc/apache2/sites-available/vueapp.conf << EOF
<VirtualHost *:80>
    ServerName vueapp.example.com
    DocumentRoot /var/www/vueapp
    
    <Directory /var/www/vueapp>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    # Rewrite rules for SPA
    RewriteEngine On
    RewriteBase /
    RewriteRule ^index\\.html$ - [L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
    
    ErrorLog \${APACHE_LOG_DIR}/vueapp-error.log
    CustomLog \${APACHE_LOG_DIR}/vueapp-access.log combined
</VirtualHost>
EOF

# Enable site and modules
a2ensite vueapp.conf
a2enmod rewrite
systemctl restart apache2

# Setup SSL with Certbot (optional)
apt install -y certbot python3-certbot-apache
certbot --apache -d vueapp.example.com
`
          }
        ]
      }
    ]
  }
};

// Component for CheatsheetPage
const CheatsheetPage = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const { t, locale } = useTranslation();
  const [currentCategory, setCurrentCategory] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();
  
  // Retrieve saved configs from local storage
  const getSavedConfigs = () => {
    const saved = localStorage.getItem(`cheatsheet-${categoryId}`);
    return saved ? JSON.parse(saved) : null;
  };

  useEffect(() => {
    if (categoryId) {
      // Добавляем проверку загрузки данных с таймаутом
      const loadTimeout = setTimeout(() => {
        // Если данные не загрузились за 3 секунды, показываем пустой шаблон
        if (!currentCategory) {
          setCurrentCategory({
            title: t.categories[categoryId as keyof typeof t.categories] || categoryId,
            sections: []
          });
          
          toast({
            title: "Information",
            description: "Data for this category not found. You can add your own configurations.",
          });
        }
      }, 3000);
      
      // Merge default data with any saved user configs
      const defaultData = cheatsheetData[categoryId];
      const savedData = getSavedConfigs();
      
      if (defaultData && savedData) {
        // Combine default data with saved user configurations
        const merged = {
          ...defaultData,
          sections: [
            ...defaultData.sections,
            ...savedData.sections.filter((section: any) => 
              !defaultData.sections.some((s: any) => s.title === section.title)
            )
          ]
        };
        setCurrentCategory(merged);
        clearTimeout(loadTimeout);
      } else if (defaultData) {
        setCurrentCategory(defaultData);
        clearTimeout(loadTimeout);
      } else if (savedData) {
        setCurrentCategory(savedData);
        clearTimeout(loadTimeout);
      } else {
        // Если данные не найдены, не устанавливаем null,
        // таймаут выше создаст пустой шаблон через 3 секунды
      }
      
      return () => clearTimeout(loadTimeout);
    }
  }, [categoryId, t.categories]);

  const handleAddConfig = (data: { sectionTitle: string; configTitle: string; configCode: string; notes: string }) => {
    if (!categoryId) return;

    const newConfig = {
      title: data.configTitle,
      code: data.configCode,
      notes: data.notes
    };

    let updatedCategory;
    if (currentCategory) {
      // Check if section already exists
      const existingSection = currentCategory.sections.find(
        (section: any) => section.title === data.sectionTitle
      );

      if (existingSection) {
        // Add config to existing section
        updatedCategory = {
          ...currentCategory,
          sections: currentCategory.sections.map((section: any) => {
            if (section.title === data.sectionTitle) {
              return {
                ...section,
                configs: [...section.configs, newConfig]
              };
            }
            return section;
          })
        };
      } else {
        // Create new section with the new config
        updatedCategory = {
          ...currentCategory,
          sections: [
            ...currentCategory.sections,
            {
              title: data.sectionTitle,
              configs: [newConfig]
            }
          ]
        };
      }
    } else {
      // Create a completely new category
      updatedCategory = {
        title: t.categories[categoryId as keyof typeof t.categories] || categoryId,
        sections: [
          {
            title: data.sectionTitle,
            configs: [newConfig]
          }
        ]
      };
    }

    // Save to state
    setCurrentCategory(updatedCategory);
    
    // Save to local storage
    localStorage.setItem(`cheatsheet-${categoryId}`, JSON.stringify(updatedCategory));
    
    // Show success message
    toast({
      title: "Config Added",
      description: `Added ${data.configTitle} to ${data.sectionTitle}`,
    });

    // Close the form
    setShowForm(false);
  };

  if (!currentCategory) {
    return (
      <CheatsheetLayout>
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">
              {t.categories[categoryId as keyof typeof t.categories] || categoryId}
            </h1>
            <Button onClick={() => setShowForm(true)} variant="outline">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Config
            </Button>
          </div>
          
          {showForm ? (
            <AddConfigForm onSubmit={handleAddConfig} onCancel={() => setShowForm(false)} />
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Cheatsheet content is not available yet for this category. Add your own configs!
              </p>
            </div>
          )}
        </div>
      </CheatsheetLayout>
    );
  }

  return (
    <CheatsheetLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">
            {t.categories[categoryId as keyof typeof t.categories] || currentCategory.title}
          </h1>
          <Button onClick={() => setShowForm(true)} variant="outline">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Config
          </Button>
        </div>

        {showForm && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <AddConfigForm onSubmit={handleAddConfig} onCancel={() => setShowForm(false)} />
            </CardContent>
          </Card>
        )}

        {currentCategory.sections.map((section: any, index: number) => (
          <Card key={index} className="mb-6 overflow-hidden">
            <CardHeader className="bg-muted">
              <CardTitle>{section.title}</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {section.configs.length > 1 ? (
                <Tabs defaultValue={`${index}-0`}>
                  <TabsList className="mb-4">
                    {section.configs.map((config: any, configIndex: number) => (
                      <TabsTrigger key={configIndex} value={`${index}-${configIndex}`}>
                        {config.title}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {section.configs.map((config: any, configIndex: number) => (
                    <TabsContent key={configIndex} value={`${index}-${configIndex}`}>
                      <CodeBlock code={config.code} title={config.title} />
                      {config.notes && (
                        <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                          <h4 className="font-medium mb-2">Notes:</h4>
                          <p className="text-sm">{config.notes}</p>
                        </div>
                      )}
                    </TabsContent>
                  ))}
                </Tabs>
              ) : (
                section.configs.map((config: any, configIndex: number) => (
                  <div key={configIndex}>
                    <CodeBlock code={config.code} title={config.title} />
                    {config.notes && (
                      <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                        <h4 className="font-medium mb-2">Notes:</h4>
                        <p className="text-sm">{config.notes}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </CheatsheetLayout>
  );
};

export default CheatsheetPage;

