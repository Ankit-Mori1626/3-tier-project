from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    health_check,
    cluster_topology,
    cluster_workloads,
    cluster_events,
    infrastructure_spec,
    ItemViewSet
)

router = DefaultRouter()
router.register('items', ItemViewSet)

urlpatterns = [
    path('health/', health_check, name='health-check'),
    path('cluster/topology/', cluster_topology, name='cluster-topology'),
    path('cluster/workloads/', cluster_workloads, name='cluster-workloads'),
    path('cluster/events/', cluster_events, name='cluster-events'),
    path('cluster/infrastructure/', infrastructure_spec, name='infrastructure-spec'),
    path('', include(router.urls)),
]


