import os
import time
from django.db import connection
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import viewsets
from .models import Item
from .serializers import ItemSerializer

try:
    from kubernetes import client, config
    K8S_AVAILABLE = True
except ImportError:
    K8S_AVAILABLE = False


def _get_k8s_client():
    """Helper to initialize K8s client with fallback and container bridge adaptation."""
    if not K8S_AVAILABLE:
        return None, "Kubernetes Python client is not installed."

    k8s_loaded = False
    error_msg = None

    # 1. Try In-Cluster Config (when running as pod inside K8s)
    try:
        config.load_incluster_config()
        k8s_loaded = True
    except Exception:
        pass

    # 2. Try Kubeconfig file
    if not k8s_loaded:
        try:
            kubeconfig_path = os.environ.get('KUBECONFIG', os.path.expanduser('~/.kube/config'))
            if os.path.exists(kubeconfig_path):
                config.load_kube_config(config_file=kubeconfig_path)
                k8s_loaded = True
            else:
                config.load_kube_config()
                k8s_loaded = True
        except Exception as e:
            error_msg = str(e)

    if not k8s_loaded:
        return None, error_msg or "No active Kubernetes configuration found."

    # Adapt host for Docker Desktop container -> host bridge
    try:
        conf = client.Configuration.get_default_copy()
        if '127.0.0.1' in conf.host or 'localhost' in conf.host:
            conf.host = conf.host.replace('127.0.0.1', 'host.docker.internal').replace('localhost', 'host.docker.internal')
            conf.verify_ssl = False
            client.Configuration.set_default(conf)
    except Exception:
        pass

    return client, None


@api_view(['GET'])
def health_check(request):
    """
    Active health check probing Django API, Database (PostgreSQL / Aurora RDS) connection,
    and returning active stats and latency.
    """
    start_time = time.time()
    db_status = "unknown"
    db_latency_ms = 0
    item_count = 0

    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1;")
            cursor.fetchone()
        db_latency_ms = round((time.time() - start_time) * 1000, 2)
        db_status = "connected"
        item_count = Item.objects.count()
    except Exception as e:
        db_status = f"error: {str(e)}"
        db_latency_ms = round((time.time() - start_time) * 1000, 2)

    return Response({
        'status': 'ok',
        'service': 'django-backend',
        'database': {
            'status': db_status,
            'latency_ms': db_latency_ms,
            'engine': 'PostgreSQL / AWS Aurora RDS',
            'item_count': item_count
        }
    })


@api_view(['GET'])
def cluster_topology(request):
    """
    Fetches REAL live Kubernetes cluster topology (Nodes, Pods, Namespaces, Status).
    """
    k8s, err = _get_k8s_client()
    if not k8s:
        return Response({
            'connected': False,
            'error': err,
            'nodes': [],
            'total_nodes': 0,
            'total_pods': 0
        })

    try:
        v1 = k8s.CoreV1Api()
        nodes_data = v1.list_node(timeout_seconds=5)
        pods_data = v1.list_pod_for_all_namespaces(timeout_seconds=5)

        all_pods = []
        pods_by_node = {}

        for pod in pods_data.items:
            pod_node = pod.spec.node_name or 'Unassigned'
            restarts = 0
            if pod.status.container_statuses:
                restarts = sum(cs.restart_count for cs in pod.status.container_statuses)

            pod_info = {
                'name': pod.metadata.name,
                'namespace': pod.metadata.namespace,
                'status': pod.status.phase,
                'ip': pod.status.pod_ip or 'N/A',
                'restarts': restarts,
                'nodeName': pod_node,
                'creationTimestamp': pod.metadata.creation_timestamp.isoformat() if pod.metadata.creation_timestamp else None
            }
            all_pods.append(pod_info)
            pods_by_node.setdefault(pod_node, []).append(pod_info)

        nodes_list = []
        for node in nodes_data.items:
            node_name = node.metadata.name
            labels = node.metadata.labels or {}
            role = 'worker'
            if 'node-role.kubernetes.io/control-plane' in labels or 'node-role.kubernetes.io/master' in labels:
                role = 'control-plane'
            elif 'worker-frontend' in str(labels).lower():
                role = 'worker-frontend'
            elif 'worker-backend' in str(labels).lower():
                role = 'worker-backend'

            is_ready = False
            for cond in node.status.conditions or []:
                if cond.type == 'Ready' and cond.status == 'True':
                    is_ready = True
                    break

            internal_ip = 'N/A'
            external_ip = 'N/A'
            for addr in node.status.addresses or []:
                if addr.type == 'InternalIP':
                    internal_ip = addr.address
                elif addr.type == 'ExternalIP':
                    external_ip = addr.address

            node_info = node.status.node_info
            node_pods = pods_by_node.get(node_name, [])

            nodes_list.append({
                'id': node.metadata.uid or node_name,
                'name': node_name,
                'role': role,
                'status': 'Ready' if is_ready else 'NotReady',
                'ip': internal_ip,
                'publicIp': external_ip if external_ip != 'N/A' else internal_ip,
                'kubeletVersion': node_info.kubelet_version if node_info else 'N/A',
                'os': f"{node_info.os_image} ({node_info.architecture})" if node_info else 'Linux',
                'cpuCapacity': node.status.capacity.get('cpu', 'N/A') if node.status.capacity else 'N/A',
                'memoryCapacity': node.status.capacity.get('memory', 'N/A') if node.status.capacity else 'N/A',
                'podCount': len(node_pods),
                'pods': node_pods
            })

        return Response({
            'connected': True,
            'clusterProvider': 'Kubernetes',
            'total_nodes': len(nodes_list),
            'total_pods': len(all_pods),
            'nodes': nodes_list
        })

    except Exception as e:
        return Response({
            'connected': False,
            'error': f"Failed to query Kubernetes cluster: {str(e)}",
            'nodes': [],
            'total_nodes': 0,
            'total_pods': 0
        })


@api_view(['GET'])
def cluster_workloads(request):
    """
    Fetches REAL live Kubernetes Workloads: Deployments, Services (svc), Pods, and Namespaces.
    """
    k8s, err = _get_k8s_client()
    if not k8s:
        return Response({
            'connected': False,
            'error': err,
            'deployments': [],
            'services': [],
            'pods': [],
            'namespaces': []
        })

    try:
        apps_v1 = k8s.AppsV1Api()
        core_v1 = k8s.CoreV1Api()

        # 1. Fetch Deployments
        deployments_data = apps_v1.list_deployment_for_all_namespaces(timeout_seconds=5)
        deployments_list = []
        for dep in deployments_data.items:
            containers = [c.image for c in dep.spec.template.spec.containers] if dep.spec.template.spec.containers else []
            deployments_list.append({
                'name': dep.metadata.name,
                'namespace': dep.metadata.namespace,
                'replicas': dep.spec.replicas or 0,
                'readyReplicas': dep.status.ready_replicas or 0,
                'updatedReplicas': dep.status.updated_replicas or 0,
                'availableReplicas': dep.status.available_replicas or 0,
                'images': containers,
                'age': dep.metadata.creation_timestamp.isoformat() if dep.metadata.creation_timestamp else None,
                'strategy': dep.spec.strategy.type if dep.spec.strategy else 'RollingUpdate'
            })

        # 2. Fetch Services (svc)
        services_data = core_v1.list_service_for_all_namespaces(timeout_seconds=5)
        services_list = []
        for svc in services_data.items:
            ports = []
            for p in svc.spec.ports or []:
                ports.append({
                    'name': p.name or 'default',
                    'port': p.port,
                    'targetPort': str(p.target_port),
                    'nodePort': p.node_port if hasattr(p, 'node_port') else None,
                    'protocol': p.protocol
                })

            services_list.append({
                'name': svc.metadata.name,
                'namespace': svc.metadata.namespace,
                'type': svc.spec.type,
                'clusterIP': svc.spec.cluster_ip,
                'ports': ports,
                'selector': svc.spec.selector or {},
                'creationTimestamp': svc.metadata.creation_timestamp.isoformat() if svc.metadata.creation_timestamp else None
            })

        # 3. Fetch Pods
        pods_data = core_v1.list_pod_for_all_namespaces(timeout_seconds=5)
        pods_list = []
        for pod in pods_data.items:
            restarts = sum(cs.restart_count for cs in pod.status.container_statuses) if pod.status.container_statuses else 0
            containers = [c.name for c in pod.spec.containers] if pod.spec.containers else []
            pods_list.append({
                'name': pod.metadata.name,
                'namespace': pod.metadata.namespace,
                'status': pod.status.phase,
                'ip': pod.status.pod_ip or 'N/A',
                'nodeName': pod.spec.node_name or 'Unassigned',
                'restarts': restarts,
                'containers': containers,
                'creationTimestamp': pod.metadata.creation_timestamp.isoformat() if pod.metadata.creation_timestamp else None
            })

        # 4. Namespaces
        namespaces_data = core_v1.list_namespace(timeout_seconds=5)
        namespaces_list = [ns.metadata.name for ns in namespaces_data.items]

        return Response({
            'connected': True,
            'deployments': deployments_list,
            'services': services_list,
            'pods': pods_list,
            'namespaces': namespaces_list,
            'summary': {
                'total_deployments': len(deployments_list),
                'total_services': len(services_list),
                'total_pods': len(pods_list),
                'total_namespaces': len(namespaces_list)
            }
        })

    except Exception as e:
        return Response({
            'connected': False,
            'error': f"Failed to query workloads: {str(e)}",
            'deployments': [],
            'services': [],
            'pods': [],
            'namespaces': []
        })


@api_view(['GET'])
def cluster_events(request):
    """
    Fetches live Kubernetes cluster events (Warnings, Deployments rollout, pod schedules).
    """
    k8s, err = _get_k8s_client()
    if not k8s:
        return Response({'connected': False, 'error': err, 'events': []})

    try:
        core_v1 = k8s.CoreV1Api()
        events_data = core_v1.list_event_for_all_namespaces(timeout_seconds=5)
        events_list = []

        for ev in events_data.items:
            events_list.append({
                'type': ev.type or 'Normal',
                'reason': ev.reason or 'Event',
                'message': ev.message or '',
                'namespace': ev.metadata.namespace,
                'involvedObject': f"{ev.involved_object.kind}/{ev.involved_object.name}" if ev.involved_object else 'Cluster',
                'source': ev.source.component if ev.source else 'k8s-controller',
                'count': ev.count or 1,
                'lastTimestamp': ev.last_timestamp.isoformat() if ev.last_timestamp else (ev.metadata.creation_timestamp.isoformat() if ev.metadata.creation_timestamp else None)
            })

        # Sort by latest
        events_list.sort(key=lambda x: x['lastTimestamp'] or '', reverse=True)

        return Response({
            'connected': True,
            'total_events': len(events_list),
            'events': events_list[:100] # Return latest 100 events
        })
    except Exception as e:
        return Response({'connected': False, 'error': str(e), 'events': []})


@api_view(['GET'])
def infrastructure_spec(request):
    """
    Returns the complete 5-instance AWS VPC + Aurora RDS infrastructure topology spec.
    """
    return Response({
        'vpc': {
            'cidr': '10.0.0.0/16',
            'public_subnet': '10.0.1.0/24 (Jump Host & NAT Gateway)',
            'private_app_subnets': ['10.0.2.0/24 (AZ1)', '10.0.3.0/24 (AZ2)'],
            'private_db_subnets': ['10.0.10.0/24 (AZ1)', '10.0.11.0/24 (AZ2)']
        },
        'instances': [
            {
                'id': 'ec2-bastion',
                'name': 'Bastion Jump Server',
                'tier': 'Public Subnet',
                'role': 'SSH Gateway',
                'public_ip': '54.210.82.10',
                'private_ip': '10.0.1.15',
                'type': 't3.micro',
                'ports': '22 (SSH)'
            },
            {
                'id': 'ec2-jenkins',
                'name': 'Jenkins CI/CD Server',
                'tier': 'Private App Subnet',
                'role': 'Build & Deploy Automation',
                'private_ip': '10.0.2.20',
                'type': 't3.medium',
                'ports': '8080 (Web UI), 50000 (Agent)'
            },
            {
                'id': 'ec2-master',
                'name': 'K8s Master Node',
                'tier': 'Private App Subnet',
                'role': 'Control Plane',
                'private_ip': '10.0.2.10',
                'type': 't3.medium',
                'ports': '6443 (API), 2379-2380 (etcd), 10250-10252'
            },
            {
                'id': 'ec2-worker-frontend',
                'name': 'K8s Worker 1 (Frontend Node)',
                'tier': 'Private App Subnet',
                'role': 'React UI & Nginx Pods',
                'private_ip': '10.0.2.25',
                'type': 't3.medium',
                'ports': '30080 (NodePort), 10250 (Kubelet)'
            },
            {
                'id': 'ec2-worker-backend',
                'name': 'K8s Worker 2 (Backend Node)',
                'tier': 'Private App Subnet',
                'role': 'Django REST API Pods',
                'private_ip': '10.0.3.30',
                'type': 't3.medium',
                'ports': '30800 (NodePort), 10250 (Kubelet)'
            }
        ],
        'database': {
            'provider': 'AWS Aurora RDS (PostgreSQL 15.4)',
            'tier': 'Private DB Subnets (Multi-AZ)',
            'port': 5432,
            'writer_endpoint': 'k8s-aurora-cluster.cluster-xyz.ap-south-1.rds.amazonaws.com',
            'reader_endpoint': 'k8s-aurora-cluster.cluster-ro-xyz.ap-south-1.rds.amazonaws.com',
            'security': 'Access limited strictly to Backend Worker security group & Bastion'
        }
    })


class ItemViewSet(viewsets.ModelViewSet):
    queryset = Item.objects.all().order_by('-created_at')
    serializer_class = ItemSerializer


