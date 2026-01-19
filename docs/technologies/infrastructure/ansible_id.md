# Ansible

## Gambaran Umum

Ansible adalah alat otomasi open-source yang menyederhanakan IT orchestration, configuration management, dan deployment aplikasi. Alat ini menggunakan bahasa yang sederhana dan mudah dibaca manusia (YAML) untuk mendefinisikan tugas otomasi dan tidak memerlukan agen pada node yang dikelola. Ansible mengikuti arsitektur agentless, menggunakan SSH untuk komunikasi dan mengeksekusi tugas secara paralel di multiple server.

Ansible sangat cocok untuk infrastructure as code, continuous deployment, dan mengelola aplikasi multi-tier yang kompleks. Alat ini terintegrasi baik dengan platform cloud, container, dan berbagai komponen infrastruktur.

## Konsep Utama

- **Playbooks**: File YAML yang berisi tugas otomasi dan konfigurasi
- **Roles**: Koleksi playbook, tugas, dan variabel yang dapat digunakan ulang
- **Inventory**: Daftar host yang dikelola dan pengelompokkannya
- **Modules**: Unit otomasi siap pakai untuk tugas spesifik
- **Facts**: Informasi yang dikumpulkan tentang host yang dikelola
- **Variables**: Nilai dinamis yang digunakan dalam playbook
- **Templates**: Template Jinja2 untuk file konfigurasi
- **Handlers**: Tugas yang hanya berjalan ketika diberitahu perubahan
- **Tags**: Label untuk menjalankan bagian playbook secara selektif

## Kapan Menggunakan

- Configuration management di multiple server
- Deployment dan update aplikasi
- Provisioning dan orchestration infrastruktur
- Pipeline continuous integration dan deployment
- Deployment multi-environment (dev/staging/prod)
- Manajemen dan provisioning resource cloud
- Orchestration dan manajemen container
- Konfigurasi perangkat network
- Enforcement kebijakan keamanan
- Administrasi dan maintenance database
- Setup monitoring dan alerting

## Contoh

### Basic Ansible Playbook

```yaml
---
# playbook.yml - Setup web server dasar
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

### File Inventory (hosts.ini)

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

### Struktur Role Ansible

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

### Playbook Lanjutan dengan Roles

```yaml
---
# site.yml - Deployment infrastruktur lengkap
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

### Dynamic Inventory dengan AWS

```python
#!/usr/bin/env python3
# aws_ec2.py - Dynamic inventory untuk AWS EC2

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

            # Kategorikan instance berdasarkan tags
            tags = {tag['Key']: tag['Value'] for tag in instance.get('Tags', [])}

            if tags.get('Role') == 'web':
                inventory['webservers']['hosts'].append(public_ip)
            elif tags.get('Role') == 'db':
                inventory['databases']['hosts'].append(public_ip)

            # Tambahkan host variables
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

### Integrasi Ansible Tower/AWX

```yaml
---
# tower_job_template.yml - Trigger job Ansible Tower
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
# deploy.yml - Deployment spesifik environment
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

### Ansible Vault untuk Secrets

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

## Praktik Terbaik

- Gunakan roles untuk komponen otomasi yang dapat digunakan ulang
- Implementasikan error handling dan mekanisme rollback yang tepat
- Gunakan Ansible Vault untuk data sensitif
- Implementasikan tugas idempotent (aman untuk dijalankan berkali-kali)
- Gunakan tags untuk eksekusi selektif
- Implementasikan testing dan validasi yang tepat
- Gunakan dynamic inventory untuk environment cloud
- Implementasikan logging dan monitoring yang tepat
- Gunakan version control untuk playbook dan roles
- Implementasikan integrasi CI/CD untuk automated testing

### Best Practices Development Role

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

### Testing dengan Molecule

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

### Optimasi Performa

```yaml
---
# Optimized playbook dengan parallel execution
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

## Pertimbangan Keamanan

- Gunakan Ansible Vault untuk enkripsi data sensitif
- Implementasikan akses least privilege (sudo ketika diperlukan)
- Validasi SSL certificates dan SSH host keys
- Gunakan SSH keys spesifik inventory
- Implementasikan aturan firewall yang tepat
- Update keamanan dan patching secara regular
- Audit eksekusi playbook dan perubahan
- Implementasikan role-based access control (RBAC)
- Gunakan protokol komunikasi aman
- Scanning keamanan playbook secara regular

## Ansible vs Tools Lain

| Fitur | Ansible | Puppet | Chef | Terraform |
|-------|---------|--------|------|-----------|
| Agent Required | Tidak | Ya | Ya | Tidak |
| Bahasa | YAML | DSL | Ruby | HCL |
| State Management | Idempotent | Declarative | Imperative | Declarative |
| Cloud Support | Baik | Baik | Baik | Excellent |
| Learning Curve | Rendah | Sedang | Tinggi | Sedang |
| Komunitas | Besar | Besar | Besar | Besar |

## Use Case Ansible Umum

- **Infrastructure Provisioning**: Setup dan konfigurasi server otomatis
- **Application Deployment**: Rolling updates dan blue-green deployments
- **Configuration Management**: Konfigurasi server konsisten di seluruh environment
- **Cloud Orchestration**: Manajemen infrastruktur multi-cloud
- **Network Automation**: Konfigurasi router, switch, dan firewall
- **Security Hardening**: Implementasi kebijakan keamanan otomatis
- **Monitoring Setup**: Deployment Prometheus, Grafana, dan ELK stack
- **Database Administration**: Backup dan maintenance otomatis
- **Container Orchestration**: Manajemen Docker dan Kubernetes
- **CI/CD Pipelines**: Workflow testing dan deployment otomatis