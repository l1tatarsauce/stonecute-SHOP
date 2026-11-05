import { useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const API_URL = 'http://localhost:5000';

export default function Page() {
  const [token, setToken] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [employees, setEmployees] = useState([]);
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [salary, setSalary] = useState('');

  const [clusters, setClusters] = useState([]);
  const [loadingCluster, setLoadingCluster] = useState(false);

  const handleLogin = async () => {
    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();

      if (data.success) {
        setToken(data.token);
        fetchEmployees();
      } else {
        alert(data.message || 'Invalid username or password');
      }
    } catch (error) {
      alert('Cannot connect to backend server');
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${API_URL}/api/employees`);
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setEmployees(data);
      } else {
        console.error("Backend Error:", data);
        setEmployees([]);
      }
    } catch (error) {
      alert('Failed to fetch employees');
      setEmployees([]);
    }
  };

  const handleAddEmployee = async () => {
    if (!name.trim() || !position.trim() || !salary.trim()) {
      alert('Please fill in all fields (Name, Position, Salary)');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          position: position.trim(),
          salary: Number(salary),
        }),
      });

      if (response.ok) {
        setName('');
        setPosition('');
        setSalary('');
        fetchEmployees();
      } else {
        alert('Failed to add employee');
      }
    } catch (error) {
      alert('Cannot submit data');
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const response = await fetch(`${API_URL}/api/employees/${id}/status`, {
        method: 'PUT',
      });
      if (response.ok) {
        fetchEmployees();
      }
    } catch (error) {
      alert('Failed to toggle status');
    }
  };

  const handleDeleteEmployee = (id) => {
    const confirmDelete = window.confirm ? window.confirm('Are you sure you want to delete this employee?') : true;
    if (confirmDelete) {
      fetch(`${API_URL}/api/employees/${id}`, { method: 'DELETE' })
        .then((res) => {
          if (res.ok) fetchEmployees();
        })
        .catch(() => alert('Failed to delete employee'));
    }
  };

  const handleAnalyzeSalary = async () => {
    setLoadingCluster(true);
    try {
      const response = await fetch(`${API_URL}/api/employees/salary-clusters`);
      const data = await response.json();
      if (data.success) {
        setClusters(data.clusters);
      }
    } catch (error) {
      alert('Failed to calculate clusters');
    } finally {
      setLoadingCluster(false);
    }
  };

  if (!token) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <View style={styles.card}>
          <Text style={styles.title}>HR Login</Text>
          <TextInput
            style={styles.input}
            placeholder="Username (admin)"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Password (password123)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TouchableOpacity style={styles.btnPrimary} onPress={handleLogin}>
            <Text style={styles.btnText}>Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>HR Manager Dashboard</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Add New Employee</Text>
          <TextInput
            style={styles.input}
            placeholder="Employee Name"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="Position"
            value={position}
            onChangeText={setPosition}
          />
          <TextInput
            style={styles.input}
            placeholder="Salary"
            value={salary}
            onChangeText={setSalary}
            keyboardType="numeric"
          />
          <TouchableOpacity style={styles.btnSuccess} onPress={handleAddEmployee}>
            <Text style={styles.btnText}>Add Employee</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.btnAnalytics} onPress={handleAnalyzeSalary}>
          <Text style={styles.btnText}>Analyze Salary Structure (K-Means)</Text>
        </TouchableOpacity>

        {loadingCluster && <ActivityIndicator size="large" color="#0000ff" style={{ marginVertical: 15 }} />}
        {clusters.length > 0 && !loadingCluster && (
          <View style={styles.analyticsSection}>
            <Text style={styles.cardTitle}>Salary Cluster Results (k=3)</Text>
            <View style={styles.clusterGrid}>
              {clusters.map((item, index) => (
                <View key={index} style={styles.clusterCard}>
                  <Text style={styles.tierName}>{item.group}</Text>
                  <Text>Employees: {item.count}</Text>
                  <Text>Avg Salary: ฿{item.centroid?.toLocaleString()}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <Text style={styles.sectionHeader}>Employee List ({employees.length})</Text>
        {employees.map((item) => (
          <View key={item.id} style={styles.empCard}>
            <View style={styles.empInfo}>
              <Text style={styles.empName}>{item.name}</Text>
              <Text>{item.position} | ฿{item.salary?.toLocaleString()}</Text>
              <Text style={{ color: item.status === 'Active' ? 'green' : 'orange', fontWeight: 'bold' }}>
                Status: {item.status}
              </Text>
            </View>
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.btnToggle} onPress={() => handleToggleStatus(item.id)}>
                <Text style={styles.btnTextSmall}>Toggle</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnDelete} onPress={() => handleDeleteEmployee(item.id)}>
                <Text style={styles.btnTextSmall}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scrollContent: { padding: 16 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
  title: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginVertical: 12 },
  sectionHeader: { fontSize: 18, fontWeight: 'bold', marginTop: 15, marginBottom: 8 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 8, marginBottom: 15, elevation: 2, width: '100%', maxWidth: 400 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 10, marginBottom: 10 },
  btnPrimary: { backgroundColor: '#007AFF', padding: 12, borderRadius: 6, alignItems: 'center' },
  btnSuccess: { backgroundColor: '#28a745', padding: 12, borderRadius: 6, alignItems: 'center' },
  btnAnalytics: { backgroundColor: '#6f42c1', padding: 14, borderRadius: 6, alignItems: 'center', marginBottom: 15 },
  btnText: { color: '#fff', fontWeight: 'bold' },
  btnTextSmall: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  empCard: { backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  empInfo: { flex: 1 },
  empName: { fontSize: 16, fontWeight: 'bold' },
  actionButtons: { flexDirection: 'row', gap: 6 },
  btnToggle: { backgroundColor: '#ffc107', padding: 8, borderRadius: 4 },
  btnDelete: { backgroundColor: '#dc3545', padding: 8, borderRadius: 4 },
  analyticsSection: { marginBottom: 15 },
  clusterGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  clusterCard: { backgroundColor: '#e9ecef', padding: 10, borderRadius: 6, width: '31%', alignItems: 'center' },
  tierName: { fontWeight: 'bold', color: '#6f42c1' },
});