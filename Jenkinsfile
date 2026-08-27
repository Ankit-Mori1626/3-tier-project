pipeline {
    agent any

    environment {
        // Credentials IDs stored in Jenkins Manager
        DOCKERHUB_CREDENTIALS  = 'Dockerhub'
        KUBECONFIG_CREDENTIALS = 'k8s-kubeconfig'
        
        // Dynamic Image parameters
        DOCKERHUB_USERNAME     = 'ankitmori1626'
        BACKEND_IMAGE          = "${DOCKERHUB_USERNAME}/myapp-backend"
        FRONTEND_IMAGE         = "${DOCKERHUB_USERNAME}/myapp-frontend"
        IMAGE_TAG              = "${env.BUILD_NUMBER}"
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
                
                withKubeConfig([credentialsId: "${KUBECONFIG_CREDENTIALS}"]) {
                    sh """
                        # Update manifest tags dynamically
                        sed -i 's|DOCKERHUB_USERNAME/myapp-backend:latest|${BACKEND_IMAGE}:${IMAGE_TAG}|g' k8s/backend-deployment.yaml
                        sed -i 's|DOCKERHUB_USERNAME/myapp-frontend:latest|${FRONTEND_IMAGE}:${IMAGE_TAG}|g' k8s/frontend-deployment.yaml

                        # Apply all manifests from the k8s folder directly
                        kubectl apply -f k8s/

                        # Verify deployment rollout status
                        kubectl rollout status deployment/backend -n myapp --timeout=120s
                        kubectl rollout status deployment/frontend -n myapp --timeout=120s
                    """
                }
            }
        }

        stage('6. Health & Telemetry Verification') {
            steps {
                echo '🔍 Verifying running Pods and Services...'
                // Added withKubeConfig here to allow status check authentication
                withKubeConfig([credentialsId: "${KUBECONFIG_CREDENTIALS}"]) {
                    sh """
                        kubectl get nodes -o wide
                        kubectl get pods -n myapp -o wide
                        kubectl get svc -n myapp -o wide
                    """
                }
            }
        }
    }

    post {
        always {
            echo '🧹 Cleaning up local dangling images...'
            sh 'docker image prune -f'
        }
        success {
            echo '🎉 Deployment to Kubernetes Cluster Completed Successfully!'
        }
        failure {
            echo '❌ Pipeline failed! Please inspect logs above.'
        }
    }
}
