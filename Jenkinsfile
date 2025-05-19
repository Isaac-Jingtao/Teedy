pipeline {
    agent any
    environment {
        DEPLOYMENT_NAME = "hello-node"
        CONTAINER_NAME = "teedy"
        IMAGE_NAME = "monalisalw/teedy:2"
    }
    stages {
        stage('Start Minikube') {
            steps {
                sh '''
                    if ! minikube status | grep -q "Running"; then
                        echo "Starting Minikube..."
                        minikube start
                    else
                        echo "Minikube already running."
                    fi
                '''
            }
        }
        stage('Pull and Load Image') {
            steps {
                sh '''
                    echo "拉取镜像并导入到 minikube..."
                    docker pull ${IMAGE_NAME}
                    minikube image load ${IMAGE_NAME}
                '''
            }
        }
        stage('Set Image') {
            steps {
                sh '''
                    echo "设置 deployment 镜像..."
                    kubectl set image deployment/${DEPLOYMENT_NAME} ${CONTAINER_NAME}=${IMAGE_NAME} --record
                '''
            }
        }
        stage('Verify') {
            steps {
                sh 'kubectl rollout status deployment/${DEPLOYMENT_NAME}'
                sh 'kubectl get pods'
            }
        }
    }
}