# --- 1. Bastion (Jump Server) Security Group (Public Subnet) ---
resource "aws_security_group" "bastion_sg" {
  name        = "${var.project_name}-bastion-sg"
  description = "Security group for Bastion Jump Host"
  vpc_id      = aws_vpc.main.id

  # Inbound SSH from Admin IP
  ingress {
    description = "SSH from allowed admin CIDR"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.allowed_ssh_cidr]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-bastion-sg"
  }
}

# --- 2. Jenkins CI/CD Security Group (Private Subnet) ---
resource "aws_security_group" "jenkins_sg" {
  name        = "${var.project_name}-jenkins-sg"
  description = "Security group for Jenkins server in private subnet"
  vpc_id      = aws_vpc.main.id

  # SSH only from Bastion
  ingress {
    description     = "SSH from Bastion Host"
    from_port       = 22
    to_port         = 22
    protocol        = "tcp"
    security_groups = [aws_security_group.bastion_sg.id]
  }

  # Jenkins Web UI 8080 from Bastion
  ingress {
    description     = "Jenkins Web UI from Bastion"
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.bastion_sg.id]
  }

  egress {
    description = "Allow all outbound traffic via NAT"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-jenkins-sg"
  }
}

# --- 3. Kubernetes Nodes Security Group (Master & Workers in Private Subnets) ---
resource "aws_security_group" "k8s_nodes_sg" {
  name        = "${var.project_name}-k8s-nodes-sg"
  description = "Security group for K8s Master and Worker nodes"
  vpc_id      = aws_vpc.main.id

  # SSH from Bastion Host
  ingress {
    description     = "SSH from Bastion Jump Host"
    from_port       = 22
    to_port         = 22
    protocol        = "tcp"
    security_groups = [aws_security_group.bastion_sg.id]
  }

  # Jenkins to K8s API server
  ingress {
    description     = "Kubernetes API Server from Jenkins"
    from_port       = 6443
    to_port         = 6443
    protocol        = "tcp"
    security_groups = [aws_security_group.jenkins_sg.id, aws_security_group.bastion_sg.id]
  }

  # NodePort range (30080 frontend, 30800 backend)
  ingress {
    description = "NodePort services"
    from_port   = 30000
    to_port     = 32767
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }

  # Full inter-node cluster communication (flannel overlay, etcd, kubelet)
  ingress {
    description = "Internal K8s overlay & pod network"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    self        = true
  }

  egress {
    description = "Allow all outbound traffic via NAT"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-k8s-nodes-sg"
  }
}

# --- 4. AWS Aurora RDS PostgreSQL Security Group (Private DB Subnet) ---
resource "aws_security_group" "aurora_rds_sg" {
  name        = "${var.project_name}-aurora-rds-sg"
  description = "Security group for Aurora PostgreSQL RDS cluster"
  vpc_id      = aws_vpc.main.id

  # Ingress on 5432 only from K8s Nodes (Backend Worker) & Bastion
  ingress {
    description     = "PostgreSQL from K8s Worker Nodes"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.k8s_nodes_sg.id, aws_security_group.bastion_sg.id]
  }

  egress {
    description = "Outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-aurora-rds-sg"
  }
}

