// Configuration for Cassandra cluster
// Future: Will be loaded from API_BASE_URL
// For now, showing single cluster with profile_datastore keyspace

export const clusterConfigs = [
  {
    id: 'cluster-1',
    name: 'Cassandra Cluster',
    hosts: ['localhost:9042'],
    datacenter: 'datacenter1',
  },
]

