data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

locals {
  k8s_userdata = file("${path.module}/../kubeadm-scripts/common-setup.sh")
}

# ==============================================================================
# 1. BASTION (JUMP SERVER) - PUBLIC SUBNET
# ==============================================================================
resource "aws_instance" "bastion" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.bastion_instance_type
  subnet_id              = aws_subnet.public.id
  key_name               = aws_key_pair.this.key_name
  vpc_security_group_ids = [aws_security_group.bastion_sg.id]

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
  }

  tags = {
    Name = "${var.project_name}-bastion-jump-server"
    Role = "bastion"
    Tier = "public"
  }
}

# ==============================================================================
# 2. JENKINS CI/CD SERVER - PRIVATE APP SUBNET
# ==============================================================================
resource "aws_instance" "jenkins" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.jenkins_instance_type
  subnet_id              = aws_subnet.private_app_1.id
  key_name               = aws_key_pair.this.key_name
  vpc_security_group_ids = [aws_security_group.jenkins_sg.id]

  user_data = <<-EOF
              #!/bin/bash
              sudo apt-get update -y
              sudo apt-get install -y openjdk-17-jdk docker.io
              sudo systemctl enable --now docker
              sudo usermod -aG docker ubuntu
              EOF

  root_block_device {
    volume_size = 30
    volume_type = "gp3"
  }

  tags = {
    Name = "${var.project_name}-jenkins-server"
    Role = "jenkins"
    Tier = "private-app"
  }
}

# ==============================================================================
# 3. KUBERNETES MASTER NODE (CONTROL PLANE) - PRIVATE APP SUBNET
# ==============================================================================
resource "aws_instance" "master" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  subnet_id              = aws_subnet.private_app_1.id
  key_name               = aws_key_pair.this.key_name
  vpc_security_group_ids = [aws_security_group.k8s_nodes_sg.id]
  user_data              = local.k8s_userdata

  root_block_device {
    volume_size = 25
    volume_type = "gp3"
  }

  tags = {
    Name = "${var.project_name}-k8s-master"
    Role = "control-plane"
    Tier = "private-app"
  }
}

# ==============================================================================
# 4. KUBERNETES WORKER 1 (FRONTEND WORKER) - PRIVATE APP SUBNET 1
# ==============================================================================
resource "aws_instance" "worker_frontend" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  subnet_id              = aws_subnet.private_app_1.id
  key_name               = aws_key_pair.this.key_name
  vpc_security_group_ids = [aws_security_group.k8s_nodes_sg.id]
  user_data              = local.k8s_userdata

  root_block_device {
    volume_size = 25
    volume_type = "gp3"
  }

  tags = {
    Name = "${var.project_name}-k8s-worker-frontend"
    Role = "worker-frontend"
    Tier = "private-app"
  }
}

# ==============================================================================
# 5. KUBERNETES WORKER 2 (BACKEND WORKER) - PRIVATE APP SUBNET 2
# ==============================================================================
resource "aws_instance" "worker_backend" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  subnet_id              = aws_subnet.private_app_2.id
  key_name               = aws_key_pair.this.key_name
  vpc_security_group_ids = [aws_security_group.k8s_nodes_sg.id]
  user_data              = local.k8s_userdata

  root_block_device {
    volume_size = 25
    volume_type = "gp3"
  }

  tags = {
    Name = "${var.project_name}-k8s-worker-backend"
    Role = "worker-backend"
    Tier = "private-app"
  }
}

# ==============================================================================
# 6. AWS AURORA RDS POSTGRESQL CLUSTER - PRIVATE DB SUBNETS (MULTI-AZ)
# ==============================================================================
resource "aws_db_subnet_group" "aurora" {
  name        = "${var.project_name}-aurora-db-subnet-group"
  description = "Subnet group for Aurora PostgreSQL cluster across 2 AZs"
  subnet_ids  = [aws_subnet.private_db_1.id, aws_subnet.private_db_2.id]

  tags = {
    Name = "${var.project_name}-aurora-subnet-group"
  }
}

resource "aws_rds_cluster" "aurora" {
  cluster_identifier      = "${var.project_name}-aurora-cluster"
  engine                  = "aurora-postgresql"
  engine_version          = "15.4"
  database_name           = var.db_name
  master_username         = var.db_username
  master_password         = var.db_password
  db_subnet_group_name    = aws_db_subnet_group.aurora.name
  vpc_security_group_ids  = [aws_security_group.aurora_rds_sg.id]
  skip_final_snapshot     = true
  deletion_protection     = false

  tags = {
    Name = "${var.project_name}-aurora-postgresql"
    Tier = "private-db"
  }
}

resource "aws_rds_cluster_instance" "aurora_instances" {
  count              = 2
  identifier         = "${var.project_name}-aurora-instance-${count.index + 1}"
  cluster_identifier = aws_rds_cluster.aurora.id
  instance_class     = "db.t4g.medium"
  engine             = aws_rds_cluster.aurora.engine
  engine_version     = aws_rds_cluster.aurora.engine_version
  publicly_accessible = false

  tags = {
    Name = "${var.project_name}-aurora-node-${count.index + 1}"
  }
}

