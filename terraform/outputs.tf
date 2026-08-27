output "bastion_public_ip" {
  description = "Public IP of Bastion Jump Host (use for SSH gateway)"
  value       = aws_instance.bastion.public_ip
}

output "bastion_ssh_command" {
  description = "SSH command to connect to Bastion"
  value       = "ssh -i ${local_file.private_key.filename} ubuntu@${aws_instance.bastion.public_ip}"
}

output "jenkins_private_ip" {
  description = "Private IP of Jenkins server"
  value       = aws_instance.jenkins.private_ip
}

output "master_private_ip" {
  description = "Private IP of the master node (use for kubeadm init --apiserver-advertise-address)"
  value       = aws_instance.master.private_ip
}

output "worker_frontend_private_ip" {
  description = "Private IP of Frontend Worker Node"
  value       = aws_instance.worker_frontend.private_ip
}

output "worker_backend_private_ip" {
  description = "Private IP of Backend Worker Node"
  value       = aws_instance.worker_backend.private_ip
}

output "aurora_rds_writer_endpoint" {
  description = "Writer endpoint for AWS Aurora PostgreSQL cluster"
  value       = aws_rds_cluster.aurora.endpoint
}

output "aurora_rds_reader_endpoint" {
  description = "Reader endpoint for AWS Aurora PostgreSQL cluster"
  value       = aws_rds_cluster.aurora.reader_endpoint
}

output "ssh_private_key_path" {
  description = "Path to generated private key"
  value       = local_file.private_key.filename
}

