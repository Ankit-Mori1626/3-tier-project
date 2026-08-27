variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "ap-south-1"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidr" {
  description = "CIDR for public subnet (Jump Server & NAT Gateway)"
  type        = string
  default     = "10.0.1.0/24"
}

variable "private_app_subnet_cidr_1" {
  description = "CIDR for private app subnet AZ 1 (Jenkins, Master, Frontend Worker)"
  type        = string
  default     = "10.0.2.0/24"
}

variable "private_app_subnet_cidr_2" {
  description = "CIDR for private app subnet AZ 2 (Backend Worker)"
  type        = string
  default     = "10.0.3.0/24"
}

variable "private_db_subnet_cidr_1" {
  description = "CIDR for private database subnet AZ 1 (Aurora RDS Primary)"
  type        = string
  default     = "10.0.10.0/24"
}

variable "private_db_subnet_cidr_2" {
  description = "CIDR for private database subnet AZ 2 (Aurora RDS Replica)"
  type        = string
  default     = "10.0.11.0/24"
}

variable "instance_type" {
  description = "EC2 instance type for K8s master & worker nodes (t3.medium recommended)"
  type        = string
  default     = "t3.medium"
}

variable "bastion_instance_type" {
  description = "EC2 instance type for Bastion Jump host"
  type        = string
  default     = "t3.micro"
}

variable "jenkins_instance_type" {
  description = "EC2 instance type for Jenkins CI/CD server"
  type        = string
  default     = "t3.medium"
}

variable "db_name" {
  description = "Aurora PostgreSQL database name"
  type        = string
  default     = "appdb"
}

variable "db_username" {
  description = "Aurora PostgreSQL master username"
  type        = string
  default     = "appuser"
}

variable "db_password" {
  description = "Aurora PostgreSQL master password"
  type        = string
  default     = "AuroraPass123!Secure"
  sensitive   = true
}

variable "project_name" {
  description = "Prefix used to tag/name all resources"
  type        = string
  default     = "k8s-project"
}

variable "allowed_ssh_cidr" {
  description = "CIDR allowed to SSH into the Bastion Jump Server"
  type        = string
  default     = "0.0.0.0/0"
}
