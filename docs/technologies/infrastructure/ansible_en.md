# Ansible

## Overview

Ansible is an open-source automation tool that simplifies IT orchestration, configuration management, and application deployment. It uses a simple, human-readable language (YAML) for defining automation tasks and doesn't require agents on managed nodes. Ansible follows an agentless architecture, using SSH for communication and executing tasks in parallel across multiple servers.

Ansible is particularly well-suited for infrastructure as code, continuous deployment, and managing complex multi-tier applications. It integrates well with cloud platforms, containers, and various infrastructure components.

## Key Concepts

- **Playbooks**: YAML files containing automation tasks and configurations
- **Roles**: Reusable collections of playbooks, tasks, and variables
- **Inventory**: List of managed hosts and their groupings
- **Modules**: Pre-built automation units for specific tasks
- **Facts**: Information gathered about managed hosts
- **Variables**: Dynamic values used in playbooks
- **Templates**: Jinja2 templates for configuration files
- **Handlers**: Tasks that run only when notified of changes
- **Tags**: Labels for selectively running parts of playbooks

## When to Use

- Configuration management across multiple servers
- Application deployment and updates
- Infrastructure provisioning and orchestration
- Continuous integration and deployment pipelines
- Multi-environment deployments (dev/staging/prod)
- Cloud resource management and provisioning
- Container orchestration and management
- Network device configuration
- Security policy enforcement
- Database administration and maintenance
- Monitoring and alerting setup

## Examples

### Basic Ansible Playbook

```yaml
---
# playbook.yml - Basic web server setup
- name: Setup web server
  hosts: webservers
  become: yes
  vars:
    web_package: nginx
    web_service: nginx

  tasks:
    - name: Install web server package
      package:
        name: "{{ web_package }}"
        state: present

    - name: Start and enable web service
      service:
        name: "{{ web_service }}"
        state: started
        enabled: yes

    - name: Copy custom configuration
      template:
        src: nginx.conf.j2
        dest: /etc/nginx/nginx.conf
      notify: restart nginx

    - name: Deploy application files
      copy:
        src: app/
        dest: /var/www/html/

  handlers:
    - name: restart nginx
      service:
        name: nginx
        state: restarted
```

### Inventory File (hosts.ini)

```ini
[webservers]
web01.example.com ansible_user=ubuntu
web02.example.com ansible_user=ubuntu

[databases]
db01.example.com ansible_user=ubuntu

[loadbalancers]
lb01.example.com ansible_user=ubuntu

[all:vars]
ansible_python_interpreter=/usr/bin/python3
ansible_ssh_private_key_file=~/.ssh/id_rsa
```

### Ansible Role Structure

```
roles/
└── webserver/
    ├── tasks/
    │   ├── main.yml
    │   └── install.yml
    ├── handlers/
    │   └── main.yml
    ├── vars/
    │   └── main.yml
    ├── defaults/
    │   └── main.yml
    ├── templates/
    │   ├── nginx.conf.j2
    │   └── index.html.j2
    ├── files/
    │   └── ssl/
    └── meta/
        └── main.yml
```

### Advanced Playbook with Roles

```yaml
---
# site.yml - Complete infrastructure deployment
- name: Deploy complete web application
  hosts: all
  become: yes

  pre_tasks:
    - name: Update package cache
      package:
        update_cache: yes
      when: ansible_os_family == "Debian"

  roles:
    - common
    - security
    - { role: nginx, when: "'webservers' in group_names" }
    - { role: postgresql, when: "'databases' in group_names" }
    - { role: haproxy, when: "'loadbalancers' in group_names" }

  post_tasks:
    - name: Run application tests
      command: /opt/app/test.sh
      when: "'webservers' in group_names"
      ignore_errors: yes
```

### Dynamic Inventory with AWS

```python
#!/usr/bin/env python3
# aws_ec2.py - Dynamic inventory for AWS EC2

import boto3
import json
import sys

def get_instances():
    ec2 = boto3.client('ec2')
    response = ec2.describe_instances()

    inventory = {
        '_meta': {
            'hostvars': {}
        },
        'webservers': {
            'hosts': [],
            'vars': {}
        },
        'databases': {
            'hosts': [],
            'vars': {}
        }
    }

    for reservation in response['Reservations']:
        for instance in reservation['Instances']:
            if instance['State']['Name'] != 'running':
                continue

            public_ip = instance.get('PublicIpAddress')
            if not public_ip:
                continue

            # Categorize instances based on tags
            tags = {tag['Key']: tag['Value'] for tag in instance.get('Tags', [])}

            if tags.get('Role') == 'web':
                inventory['webservers']['hosts'].append(public_ip)
            elif tags.get('Role') == 'db':
                inventory['databases']['hosts'].append(public_ip)

            # Add host variables
            inventory['_meta']['hostvars'][public_ip] = {
                'ansible_user': 'ubuntu',
                'instance_id': instance['InstanceId'],
                'instance_type': instance['InstanceType']
            }

    return inventory

if __name__ == '__main__':
    if len(sys.argv) == 2 and sys.argv[1] == '--list':
        print(json.dumps(get_instances(), indent=2))
    elif len(sys.argv) == 3 and sys.argv[1] == '--host':
        print(json.dumps({}, indent=2))
    else:
        print("Usage: %s --list or --host <hostname>" % sys.argv[0])
```

### Ansible Tower/AWX Integration

```yaml
---
# tower_job_template.yml - Trigger Ansible Tower job
- name: Deploy application via Tower
  hosts: localhost
  connection: local
  gather_facts: no

  tasks:
    - name: Launch Tower job template
      tower_job_launch:
        tower_host: https://tower.example.com
        tower_username: admin
        tower_password: "{{ tower_password }}"
        job_template: "Deploy Application"
        extra_vars:
          app_version: "{{ app_version }}"
          environment: "{{ environment }}"
      register: tower_job

    - name: Wait for job completion
      tower_job_wait:
        tower_host: https://tower.example.com
        tower_username: admin
        tower_password: "{{ tower_password }}"
        job_id: "{{ tower_job.id }}"
      register: job_result

    - name: Display job result
      debug:
        msg: "Job completed with status: {{ job_result.status }}"
```

### Multi-Environment Deployment

```yaml
---
# deploy.yml - Environment-specific deployment
- name: Deploy to {{ environment }}
  hosts: "{{ environment }}"
  become: yes
  vars_files:
    - "vars/{{ environment }}.yml"
    - "vars/secrets.yml"

  pre_tasks:
    - name: Validate environment
      assert:
        that:
          - environment in ['dev', 'staging', 'prod']
        fail_msg: "Invalid environment: {{ environment }}"

  roles:
    - { role: app-deploy, tags: ['deploy'] }
    - { role: monitoring, tags: ['monitoring'] }
    - { role: backup, tags: ['backup'] }

  post_tasks:
    - name: Run smoke tests
      uri:
        url: "http://{{ ansible_host }}/health"
        status_code: 200
      when: environment != 'dev'

    - name: Notify deployment completion
      slack:
        token: "{{ slack_token }}"
        channel: "#deployments"
        msg: "Deployment to {{ environment }} completed successfully"
      when: environment == 'prod'
```

### Ansible Vault for Secrets

```yaml
---
# Create encrypted secrets file
# ansible-vault create secrets.yml

vault_mysql_password: mySecurePassword123
vault_api_key: sk-1234567890abcdef
vault_ssl_cert: |
  -----BEGIN CERTIFICATE-----
  MIICiTCCAg+gAwIBAgIJAJ8l4HnPq7F5MAOGA1UEBhMCVVMxCzAJBgNVBAgTAkNB
  ...
  -----END CERTIFICATE-----

# Use in playbook
- name: Configure database
  mysql_user:
    name: app_user
    password: "{{ vault_mysql_password }}"
    priv: 'app_db.*:ALL'
    state: present
```

## Best Practices

- Use roles for reusable automation components
- Implement proper error handling and rollback mechanisms
- Use Ansible Vault for sensitive data
- Implement idempotent tasks (safe to run multiple times)
- Use tags for selective execution
- Implement proper testing and validation
- Use dynamic inventory for cloud environments
- Implement proper logging and monitoring
- Use version control for playbooks and roles
- Implement CI/CD integration for automated testing

### Role Development Best Practices

```yaml
# roles/webserver/tasks/main.yml
---
- name: Include OS-specific variables
  include_vars: "{{ ansible_os_family }}.yml"

- name: Install web server
  include_tasks: install.yml

- name: Configure web server
  include_tasks: configure.yml

- name: Setup SSL certificates
  include_tasks: ssl.yml
  when: ssl_enabled | default(false)

- name: Deploy application
  include_tasks: deploy.yml
```

### Testing with Molecule

```yaml
# molecule/default/molecule.yml
---
dependency:
  name: galaxy
driver:
  name: docker
platforms:
  - name: instance
    image: ubuntu:20.04
provisioner:
  name: ansible
verifier:
  name: ansible
```

```yaml
# molecule/default/playbook.yml
---
- name: Converge
  hosts: all
  roles:
    - role: webserver
```

### Ansible Collections

```yaml
# requirements.yml
collections:
  - name: community.general
  - name: community.kubernetes
  - name: amazon.aws
  - name: azure.azcollection

# Use in playbook
- name: Create S3 bucket
  amazon.aws.s3_bucket:
    name: my-app-bucket
    state: present
    region: us-east-1
```

### Performance Optimization

```yaml
---
# Optimized playbook with parallel execution
- name: Deploy application cluster
  hosts: app_servers
  become: yes
  strategy: free  # Allow parallel execution
  max_fail_percentage: 25  # Allow some failures

  tasks:
    - name: Update packages
      package:
        name: "*"
        state: latest
      async: 3600  # Run asynchronously
      poll: 10     # Check every 10 seconds

    - name: Deploy application
      include_role:
        name: app-deploy
      when: inventory_hostname in groups['primary_app_servers']
```

## Security Considerations

- Use Ansible Vault for sensitive data encryption
- Implement least privilege access (sudo when necessary)
- Validate SSL certificates and SSH host keys
- Use inventory-specific SSH keys
- Implement proper firewall rules
- Regular security updates and patching
- Audit playbook execution and changes
- Implement role-based access control (RBAC)
- Use secure communication protocols
- Regular security scanning of playbooks

## Ansible vs Other Tools

| Feature | Ansible | Puppet | Chef | Terraform |
|---------|---------|--------|------|-----------|
| Agent Required | No | Yes | Yes | No |
| Language | YAML | DSL | Ruby | HCL |
| State Management | Idempotent | Declarative | Imperative | Declarative |
| Cloud Support | Good | Good | Good | Excellent |
| Learning Curve | Low | Medium | High | Medium |
| Community | Large | Large | Large | Large |

## Common Ansible Use Cases

- **Infrastructure Provisioning**: Automated server setup and configuration
- **Application Deployment**: Rolling updates and blue-green deployments
- **Configuration Management**: Consistent server configurations across environments
- **Cloud Orchestration**: Multi-cloud infrastructure management
- **Network Automation**: Router, switch, and firewall configuration
- **Security Hardening**: Automated security policy implementation
- **Monitoring Setup**: Prometheus, Grafana, and ELK stack deployment
- **Database Administration**: Automated backups and maintenance
- **Container Orchestration**: Docker and Kubernetes management
- **CI/CD Pipelines**: Automated testing and deployment workflows