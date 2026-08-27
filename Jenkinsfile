pipeline {
    agent any

    environment {
        // Docker Hub Credentials ID configured in Jenkins (Credentials -> Add Credentials -> Username with password)
        DOCKERHUB_CREDENTIALS = 'Dockerhub'
        DOCKERHUB_USERNAME    = 'ankitmori1626' // Change to your Docker Hub username
        
        // Image Names
        BACKEND_IMAGE         = "${DOCKERHUB_USERNAME}/myapp-backend"
        FRONTEND_IMAGE        = "${DOCKERHUB_USERNAME}/myapp-frontend"
        
        // Build Tag
        IMAGE_TAG             = "${env.BUILD_NUMBER}"

        // Kubernetes Master Node SSH or Kubeconfig Credentials ID
        // In your private subnet: Jenkins SSH to Master (10.0.2.10) or uses kubeconfig
        KUBECONFIG_CREDENTIALS = 'k8s-kubeconfig'
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '15'))
        timestamps()
        timeout(time: 30, unit: 'MINUTES')
    }

    stages {
        stage('1. Checkout Source Code') {
            steps {
                echo '📥 Checking out repository...'
                checkout scm
            }
        }

        stage('2. Build Backend Docker Image') {
            steps {
                echo "🐳 Building Django Backend Image (${BACKEND_IMAGE}:${IMAGE_TAG})..."
                dir('backend') {
                    sh """
                        docker build -t ${BACKEND_IMAGE}:${IMAGE_TAG} .
                        docker tag ${BACKEND_IMAGE}:${IMAGE_TAG} ${BACKEND_IMAGE}:latest
                    """
                }
            }
        }

        stage('3. Build Frontend Docker Image') {
            steps {
                echo "🐳 Building React Frontend Image (${FRONTEND_IMAGE}:${IMAGE_TAG})..."
                dir('frontend') {
                    sh """
                        docker build -t ${FRONTEND_IMAGE}:${IMAGE_TAG} .
                        docker tag ${FRONTEND_IMAGE}:${IMAGE_TAG} ${FRONTEND_IMAGE}:latest
                    """
                }
            }
        }

        stage('4. Push Images to Docker Hub') {
            steps {
                echo '🚀 Authenticating & Pushing to Docker Hub...'
                withCredentials([usernamePassword(
                    credentialsId: "${DOCKERHUB_CREDENTIALS}",
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh """
                        echo "\$DOCKER_PASS" | docker login -u "\$DOCKER_USER" --password-stdin
                        
                        docker push ${BACKEND_IMAGE}:${IMAGE_TAG}
                        docker push ${BACKEND_IMAGE}:latest
                        
                        docker push ${FRONTEND_IMAGE}:${IMAGE_TAG}
                        docker push ${FRONTEND_IMAGE}:latest
                    """
                }
            }
        }

        stage('5. Deploy to AWS Kubeadm Cluster') {
            steps {
                echo '☸️ Deploying to Kubernetes Cluster (myapp namespace)...'
                
                // Option A: If Jenkins has kubeconfig file credentials configured
                // Option B: Running kubectl apply with image replacement
                withKubeConfig([credentialsId: 'kubeconfig-cred']) {
                sh """
                    # Replace DOCKERHUB_USERNAME placeholder with actual repository
                    sed -i 's|DOCKERHUB_USERNAME/myapp-backend:latest|${BACKEND_IMAGE}:${IMAGE_TAG}|g' k8s/backend-deployment.yaml
                    sed -i 's|DOCKERHUB_USERNAME/myapp-frontend:latest|${FRONTEND_IMAGE}:${IMAGE_TAG}|g' k8s/frontend-deployment.yaml

                    # Apply all Kubernetes manifests
                    kubectl apply -f k8s/namespace.yaml
                    kubectl apply -f k8s/rbac.yaml
                    kubectl apply -f k8s/configmap.yaml
                    kubectl apply -f k8s/secrets.yaml
                    kubectl apply -f k8s/backend-deployment.yaml
                    kubectl apply -f k8s/backend-service.yaml
                    kubectl apply -f k8s/frontend-deployment.yaml
                    kubectl apply -f k8s/frontend-service.yaml

                    # Verify rolling updates
                    kubectl rollout status deployment/backend -n myapp --timeout=120s
                    kubectl rollout status deployment/frontend -n myapp --timeout=120s
                """
                }
            }
        }
        stage('6. Health & Telemetry Verification') {
            steps {
                echo '🔍 Verifying running Pods and Services...'
                sh """
                    kubectl get nodes -o wide
                    kubectl get pods -n myapp -o wide
                    kubectl get svc -n myapp -o wide
                """
            }
        }
    }

    post {
        always {
            echo '🧹 Cleaning up local dangling images...'
            sh 'docker image prune -f || true'
        }
        success {
            echo '🎉 Deployment to Kubernetes Cluster Completed Successfully!'
        }
        failure {
            echo '❌ Pipeline failed! Please inspect logs above.'
        }
    }
}
