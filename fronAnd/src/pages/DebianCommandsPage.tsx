
import React, { useState, useMemo } from 'react';
import CheatsheetLayout from '@/components/CheatsheetLayout';
import CommandFilter from '@/components/CommandFilter';
import CommandList from '@/components/CommandList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Define command categories
const COMMAND_CATEGORIES = [
  'Package Management',
  'System Administration',
  'File Operations',
  'Network',
  'Process Management',
  'User Management',
  'Security',
];

// Collection of popular Debian commands
const DEBIAN_COMMANDS = [
  // Package Management
  { 
    command: 'apt update', 
    description: 'Update package index', 
    usage: 'sudo apt update', 
    category: 'Package Management' 
  },
  { 
    command: 'apt upgrade', 
    description: 'Upgrade installed packages', 
    usage: 'sudo apt upgrade -y', 
    category: 'Package Management' 
  },
  { 
    command: 'apt install', 
    description: 'Install a package', 
    usage: 'sudo apt install package-name', 
    category: 'Package Management' 
  },
  { 
    command: 'apt remove', 
    description: 'Remove a package', 
    usage: 'sudo apt remove package-name', 
    category: 'Package Management' 
  },
  { 
    command: 'apt autoremove', 
    description: 'Remove automatically installed packages no longer needed', 
    usage: 'sudo apt autoremove', 
    category: 'Package Management' 
  },
  { 
    command: 'apt search', 
    description: 'Search for a package', 
    usage: 'apt search keyword', 
    category: 'Package Management' 
  },
  { 
    command: 'apt show', 
    description: 'Show package details', 
    usage: 'apt show package-name', 
    category: 'Package Management' 
  },
  { 
    command: 'dpkg -i', 
    description: 'Install a .deb package file', 
    usage: 'sudo dpkg -i package.deb', 
    category: 'Package Management' 
  },
  { 
    command: 'dpkg -l', 
    description: 'List installed packages', 
    usage: 'dpkg -l | grep package-name', 
    category: 'Package Management' 
  },
  
  // System Administration
  { 
    command: 'systemctl', 
    description: 'Control system services and view status', 
    usage: 'sudo systemctl status|start|stop|restart service-name', 
    category: 'System Administration' 
  },
  { 
    command: 'journalctl', 
    description: 'Query the systemd journal (logs)', 
    usage: 'journalctl -u service-name --since today', 
    category: 'System Administration' 
  },
  { 
    command: 'update-alternatives', 
    description: 'Maintain symbolic links determining default commands', 
    usage: 'sudo update-alternatives --config editor', 
    category: 'System Administration' 
  },
  { 
    command: 'hostnamectl', 
    description: 'Control the system hostname', 
    usage: 'hostnamectl set-hostname new-hostname', 
    category: 'System Administration' 
  },
  { 
    command: 'uname', 
    description: 'Print system information', 
    usage: 'uname -a', 
    category: 'System Administration' 
  },
  { 
    command: 'lsb_release', 
    description: 'Display distribution-specific information', 
    usage: 'lsb_release -a', 
    category: 'System Administration' 
  },
  
  // File Operations
  { 
    command: 'ls', 
    description: 'List directory contents', 
    usage: 'ls -la', 
    category: 'File Operations' 
  },
  { 
    command: 'cp', 
    description: 'Copy files and directories', 
    usage: 'cp -r source destination', 
    category: 'File Operations' 
  },
  { 
    command: 'mv', 
    description: 'Move/rename files and directories', 
    usage: 'mv source destination', 
    category: 'File Operations' 
  },
  { 
    command: 'rm', 
    description: 'Remove files or directories', 
    usage: 'rm -rf directory', 
    category: 'File Operations' 
  },
  { 
    command: 'mkdir', 
    description: 'Create a directory', 
    usage: 'mkdir -p path/to/directory', 
    category: 'File Operations' 
  },
  { 
    command: 'find', 
    description: 'Search for files in a directory hierarchy', 
    usage: 'find /path -name "*.txt"', 
    category: 'File Operations' 
  },
  { 
    command: 'grep', 
    description: 'Search text for patterns', 
    usage: 'grep -r "pattern" /path', 
    category: 'File Operations' 
  },
  { 
    command: 'chown', 
    description: 'Change file owner and group', 
    usage: 'chown user:group file', 
    category: 'File Operations' 
  },
  { 
    command: 'chmod', 
    description: 'Change file permissions', 
    usage: 'chmod 755 file', 
    category: 'File Operations' 
  },
  
  // Network
  { 
    command: 'ip', 
    description: 'Show/manipulate routing, network devices, interfaces', 
    usage: 'ip a', 
    category: 'Network' 
  },
  { 
    command: 'ss', 
    description: 'Investigate sockets', 
    usage: 'ss -tuln', 
    category: 'Network' 
  },
  { 
    command: 'ping', 
    description: 'Send ICMP ECHO_REQUEST to network hosts', 
    usage: 'ping example.com', 
    category: 'Network' 
  },
  { 
    command: 'traceroute', 
    description: 'Print the route packets trace to network host', 
    usage: 'traceroute example.com', 
    category: 'Network' 
  },
  { 
    command: 'netstat', 
    description: 'Print network connections, routing tables, etc', 
    usage: 'netstat -tuln', 
    category: 'Network' 
  },
  { 
    command: 'curl', 
    description: 'Transfer data from or to a server', 
    usage: 'curl -o file.html https://example.com', 
    category: 'Network' 
  },
  { 
    command: 'wget', 
    description: 'Non-interactive network downloader', 
    usage: 'wget https://example.com/file', 
    category: 'Network' 
  },
  { 
    command: 'ssh', 
    description: 'OpenSSH SSH client (remote login program)', 
    usage: 'ssh user@hostname', 
    category: 'Network' 
  },
  { 
    command: 'scp', 
    description: 'Secure copy (remote file copy program)', 
    usage: 'scp file.txt user@hostname:/path', 
    category: 'Network' 
  },
  
  // Process Management
  { 
    command: 'ps', 
    description: 'Report process status', 
    usage: 'ps aux | grep process-name', 
    category: 'Process Management' 
  },
  { 
    command: 'top', 
    description: 'Display Linux processes', 
    usage: 'top', 
    category: 'Process Management' 
  },
  { 
    command: 'htop', 
    description: 'Interactive process viewer', 
    usage: 'htop', 
    category: 'Process Management' 
  },
  { 
    command: 'kill', 
    description: 'Send a signal to a process', 
    usage: 'kill -9 PID', 
    category: 'Process Management' 
  },
  { 
    command: 'killall', 
    description: 'Kill processes by name', 
    usage: 'killall process-name', 
    category: 'Process Management' 
  },
  { 
    command: 'nice', 
    description: 'Run a program with modified scheduling priority', 
    usage: 'nice -n 19 command', 
    category: 'Process Management' 
  },
  
  // User Management
  { 
    command: 'useradd', 
    description: 'Create a new user', 
    usage: 'sudo useradd -m username', 
    category: 'User Management' 
  },
  { 
    command: 'userdel', 
    description: 'Delete a user account and related files', 
    usage: 'sudo userdel -r username', 
    category: 'User Management' 
  },
  { 
    command: 'passwd', 
    description: 'Change user password', 
    usage: 'sudo passwd username', 
    category: 'User Management' 
  },
  { 
    command: 'usermod', 
    description: 'Modify a user account', 
    usage: 'sudo usermod -aG groupname username', 
    category: 'User Management' 
  },
  { 
    command: 'groups', 
    description: 'Print the groups a user is in', 
    usage: 'groups username', 
    category: 'User Management' 
  },
  { 
    command: 'groupadd', 
    description: 'Create a new group', 
    usage: 'sudo groupadd groupname', 
    category: 'User Management' 
  },
  
  // Security
  { 
    command: 'sudo', 
    description: 'Execute a command as another user', 
    usage: 'sudo command', 
    category: 'Security' 
  },
  { 
    command: 'su', 
    description: 'Change user ID or become superuser', 
    usage: 'su - username', 
    category: 'Security' 
  },
  { 
    command: 'visudo', 
    description: 'Edit the sudoers file', 
    usage: 'sudo visudo', 
    category: 'Security' 
  },
  { 
    command: 'ufw', 
    description: 'Uncomplicated Firewall', 
    usage: 'sudo ufw enable', 
    category: 'Security' 
  },
  { 
    command: 'iptables', 
    description: 'Administration tool for IPv4 packet filtering and NAT', 
    usage: 'sudo iptables -L', 
    category: 'Security' 
  },
  { 
    command: 'fail2ban-client', 
    description: 'Ban IPs that show malicious signs', 
    usage: 'sudo fail2ban-client status', 
    category: 'Security' 
  },
];

const DebianCommandsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredCommands = useMemo(() => {
    return DEBIAN_COMMANDS.filter(cmd => {
      const matchesSearch = cmd.command.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          cmd.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || cmd.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  const handleFilterChange = (search: string, category: string) => {
    setSearchTerm(search);
    setSelectedCategory(category);
  };

  return (
    <CheatsheetLayout>
      <div className="max-w-4xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Debian Commands Cheatsheet</h1>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Filter Commands</CardTitle>
          </CardHeader>
          <CardContent>
            <CommandFilter 
              categories={COMMAND_CATEGORIES} 
              onFilterChange={handleFilterChange} 
            />
          </CardContent>
        </Card>

        <CommandList commands={filteredCommands} filtered={true} />
      </div>
    </CheatsheetLayout>
  );
};

export default DebianCommandsPage;
